import React, { useState, useEffect } from 'react';
import { DailyReport, AppSettings } from '../types/report';
import {
  googleSignIn,
  logout,
  getAccessToken,
  initAuth,
} from '../services/firebase';
import {
  createReportSpreadsheet,
  appendReportToSpreadsheet,
  listUserSpreadsheets,
  SyncedSpreadsheet,
} from '../services/sheets';
import { ConfirmModal } from './ConfirmModal';
import {
  Table2,
  FileSpreadsheet,
  CheckCircle,
  ExternalLink,
  PlusCircle,
  FolderOpen,
  RefreshCw,
  LogOut,
  X,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface GoogleSheetsModalProps {
  report?: DailyReport;
  allReports?: DailyReport[];
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onReportSynced?: (reportId: string, sheetsUrl: string) => void;
  onClose: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  report,
  allReports = [],
  settings,
  onUpdateSettings,
  onReportSynced,
  onClose,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Drive spreadsheets list
  const [driveSheets, setDriveSheets] = useState<SyncedSpreadsheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState(settings.spreadsheetId || '');
  const [activeTab, setActiveTab] = useState<'create' | 'choose' | 'active'>('create');
  const [newSheetTitle, setNewSheetTitle] = useState(
    report ? `Daily Report - ${report.projectName}` : `Daily Report Log - ${settings.companyName}`
  );

  // User confirmation dialog state per mandatory Workspace skill requirement
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });

  useEffect(() => {
    // Initialize Auth state listener
    const unsubscribe = initAuth(
      async (u, t) => {
        setUser(u);
        setToken(t);
        if (t) {
          loadDriveSpreadsheets(t);
        }
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );

    // Initial token check
    getAccessToken().then((t) => {
      if (t) {
        setToken(t);
        loadDriveSpreadsheets(t);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadDriveSpreadsheets = async (accessToken: string) => {
    setIsLoading(true);
    try {
      const sheets = await listUserSpreadsheets(accessToken);
      setDriveSheets(sheets);
      if (sheets.length > 0 && !selectedSheetId) {
        setSelectedSheetId(sheets[0].id);
      }
    } catch (e) {
      console.warn('Could not list drive spreadsheets', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        await loadDriveSpreadsheets(result.accessToken);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal login dengan akun Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
  };

  /**
   * Prompts user with mandatory confirmation dialog before creating new Google Sheet.
   */
  const requestCreateSheet = () => {
    if (!token) {
      setErrorMessage('Silakan login dengan akun Google terlebih dahulu.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Konfirmasi Pembuatan Google Spreadsheet',
      message: `Apakah Anda yakin ingin membuat Google Spreadsheet baru berjudul "${newSheetTitle}" di akun Google Drive Anda?\n\nSpreadsheet ini akan otomatis dibuat dengan tab Rekap Laporan, Log Pekerjaan, Tenaga Kerja, dan Kendala.`,
      action: executeCreateSheet,
    });
  };

  const executeCreateSheet = async () => {
    if (!token) return;
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      const newSheet = await createReportSpreadsheet(newSheetTitle, token);
      setSelectedSheetId(newSheet.id);
      onUpdateSettings({
        spreadsheetId: newSheet.id,
        spreadsheetName: newSheet.name,
      });

      // If a single report was passed, append it right away
      if (report) {
        await appendReportToSpreadsheet(newSheet.id, report, token);
        if (onReportSynced) {
          onReportSynced(report.id, newSheet.url);
        }
      }

      setSyncSuccess(`Berhasil membuat spreadsheet dan menyinkronkan data: ${newSheet.name}`);
      setActiveTab('active');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuat spreadsheet di Google Sheets');
    } finally {
      setIsSyncing(false);
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  /**
   * Prompts user with mandatory confirmation dialog before mutating Google Sheet.
   */
  const requestSyncToExisting = (bulk = false) => {
    if (!token || !selectedSheetId) {
      setErrorMessage('Pilih spreadsheet terlebih dahulu.');
      return;
    }

    const count = bulk ? allReports.length : 1;
    const targetSheetName = driveSheets.find((s) => s.id === selectedSheetId)?.name || 'Spreadsheet Terpilih';

    setConfirmDialog({
      isOpen: true,
      title: 'Konfirmasi Sinkronisasi Data ke Google Sheets',
      message: `Apakah Anda ingin menulis dan menambahkan ${count} data laporan harian ke spreadsheet "${targetSheetName}"?\n\nData baris baru akan ditambahkan ke tab Rekap Laporan dan Log Pekerjaan tanpa menghapus data sebelumnya.`,
      action: () => executeSyncToExisting(bulk),
    });
  };

  const executeSyncToExisting = async (bulk = false) => {
    if (!token || !selectedSheetId) return;
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      let finalUrl = '';
      if (bulk && allReports.length > 0) {
        for (const r of allReports) {
          const res = await appendReportToSpreadsheet(selectedSheetId, r, token);
          finalUrl = res.spreadsheetUrl;
          if (onReportSynced) {
            onReportSynced(r.id, res.spreadsheetUrl);
          }
        }
        setSyncSuccess(`Berhasil menyinkronkan ${allReports.length} laporan ke Google Sheets!`);
      } else if (report) {
        const res = await appendReportToSpreadsheet(selectedSheetId, report, token);
        finalUrl = res.spreadsheetUrl;
        if (onReportSynced) {
          onReportSynced(report.id, res.spreadsheetUrl);
        }
        setSyncSuccess(`Laporan No. ${report.reportNumber} berhasil ditambahkan ke Google Sheets!`);
      }

      onUpdateSettings({
        spreadsheetId: selectedSheetId,
        spreadsheetName: driveSheets.find((s) => s.id === selectedSheetId)?.name || 'Google Spreadsheet',
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyinkronkan ke Google Sheets');
    } finally {
      setIsSyncing(false);
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const currentSheetUrl = selectedSheetId
    ? `https://docs.google.com/spreadsheets/d/${selectedSheetId}/edit`
    : settings.spreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/edit`
    : '';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-700 rounded-xl">
                <FileSpreadsheet size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Sinkronisasi Google Sheets</h3>
                <p className="text-xs text-emerald-200">Integrasi resmi Google Workspace untuk arsip dan log laporan harian</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* User Auth Section */}
            {!user ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-3">
                  <Table2 size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">Hubungkan Akun Google Anda</h4>
                <p className="text-xs text-slate-500 max-w-sm mb-5">
                  Masuk dengan akun Google untuk menyinkronkan laporan pekerjaan langsung ke Google Spreadsheet di Google Drive Anda.
                </p>

                {/* Official Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="inline-flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-300 rounded-xl shadow-xs hover:bg-slate-50 transition-all text-xs font-semibold text-slate-700 hover:shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-emerald-300" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                      {user.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>{user.displayName || 'Akun Google Terhubung'}</span>
                      <span className="px-1.5 py-0.5 text-[9px] bg-emerald-200 text-emerald-800 rounded font-semibold">Tersambung</span>
                    </div>
                    <div className="text-[11px] text-emerald-700">{user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => token && loadDriveSpreadsheets(token)}
                    title="Segarkan daftar spreadsheet"
                    className="p-2 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors"
                  >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <LogOut size={13} /> Keluar
                  </button>
                </div>
              </div>
            )}

            {/* Success notification banner */}
            {syncSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                  <span>{syncSuccess}</span>
                </div>
                {currentSheetUrl && (
                  <a
                    href={currentSheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 shrink-0 ml-2"
                  >
                    Buka Spreadsheet <ExternalLink size={12} />
                  </a>
                )}
              </div>
            )}

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Tabs for choosing spreadsheet action */}
            {user && (
              <div className="space-y-4">
                <div className="flex border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                      activeTab === 'create'
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <PlusCircle size={15} /> Buat Spreadsheet Baru
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('choose')}
                    className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                      activeTab === 'choose'
                        ? 'border-emerald-600 text-emerald-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FolderOpen size={15} /> Pilih dari Google Drive
                  </button>

                  {settings.spreadsheetId && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('active')}
                      className={`pb-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
                        activeTab === 'active'
                          ? 'border-emerald-600 text-emerald-700'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <FileCheck size={15} /> Spreadsheet Aktif
                    </button>
                  )}
                </div>

                {/* Tab: Create New Spreadsheet */}
                {activeTab === 'create' && (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Judul Google Spreadsheet Baru:
                      </label>
                      <input
                        type="text"
                        value={newSheetTitle}
                        onChange={(e) => setNewSheetTitle(e.target.value)}
                        placeholder="Daily Report Log Proyek..."
                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Sistem akan membuat spreadsheet dengan 4 tab terstruktur: <strong>Rekap Laporan</strong>, <strong>Item Pekerjaan</strong>, <strong>Log Tenaga Kerja</strong>, dan <strong>Kendala</strong>.
                    </p>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={requestCreateSheet}
                        disabled={isSyncing || !newSheetTitle}
                        className="px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSyncing ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <PlusCircle size={15} />
                        )}
                        <span>Buat & Sinkronkan ke Spreadsheet Baru</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab: Choose from Drive */}
                {activeTab === 'choose' && (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="block text-xs font-semibold text-slate-700">
                      Pilih Spreadsheet yang Ada di Drive:
                    </label>

                    {driveSheets.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {driveSheets.map((s) => (
                          <label
                            key={s.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                              selectedSheetId === s.id
                                ? 'border-emerald-600 bg-emerald-50/60 font-semibold text-emerald-950 shadow-2xs'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <input
                                type="radio"
                                name="spreadsheet-choice"
                                checked={selectedSheetId === s.id}
                                onChange={() => setSelectedSheetId(s.id)}
                                className="accent-emerald-600"
                              />
                              <Table2 size={16} className="text-emerald-600 shrink-0" />
                              <span className="truncate">{s.name}</span>
                            </div>
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] text-slate-400 hover:text-emerald-700 p-1"
                              title="Buka di tab baru"
                            >
                              <ExternalLink size={13} />
                            </a>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic py-2">
                        {isLoading ? 'Memuat spreadsheet dari Google Drive...' : 'Belum ditemukan spreadsheet di Drive. Anda bisa membuat baru.'}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => requestSyncToExisting(false)}
                        disabled={isSyncing || !selectedSheetId}
                        className="px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSyncing ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <CheckCircle size={15} />
                        )}
                        <span>{report ? `Tambahkan Laporan #${report.reportNumber}` : 'Hubungkan Spreadsheet'}</span>
                      </button>

                      {allReports.length > 1 && (
                        <button
                          type="button"
                          onClick={() => requestSyncToExisting(true)}
                          disabled={isSyncing || !selectedSheetId}
                          className="px-3.5 py-2.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <span>Sync Semua ({allReports.length} Laporan)</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab: Active Spreadsheet Info */}
                {activeTab === 'active' && settings.spreadsheetId && (
                  <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">{settings.spreadsheetName || 'Spreadsheet Utama Proyek'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">ID: {settings.spreadsheetId}</div>
                      </div>
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/edit`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>Buka di Google Sheets</span>
                        <ExternalLink size={13} />
                      </a>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-emerald-100">
                      {report && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSheetId(settings.spreadsheetId!);
                            requestSyncToExisting(false);
                          }}
                          disabled={isSyncing}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                          <span>Sync Ulang Laporan #{report.reportNumber}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSheetId(settings.spreadsheetId!);
                          requestSyncToExisting(true);
                        }}
                        disabled={isSyncing}
                        className="px-3 py-2 text-xs font-medium text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors"
                      >
                        Sinkronkan Seluruh Data ({allReports.length})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Mandatory confirmation dialog before modifying Google Sheets */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Ya, Lanjutkan Sinkronisasi"
        cancelLabel="Batal"
        variant="info"
        isLoading={isSyncing}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};
