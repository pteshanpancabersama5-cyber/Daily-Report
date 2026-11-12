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
  Search,
  Link2,
  Copy,
  Layers,
  HardHat,
  Boxes,
  Users,
  AlertTriangle,
  Sparkles,
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
  const [copiedLink, setCopiedLink] = useState(false);

  // Drive spreadsheets list
  const [driveSheets, setDriveSheets] = useState<SyncedSpreadsheet[]>([]);
  const [driveSearch, setDriveSearch] = useState('');
  const [selectedSheetId, setSelectedSheetId] = useState(settings.spreadsheetId || '');
  const [manualSheetInput, setManualSheetInput] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'choose' | 'manual' | 'active'>(
    settings.spreadsheetId ? 'active' : 'create'
  );
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
      message: `Apakah Anda yakin ingin membuat Google Spreadsheet baru berjudul "${newSheetTitle}" di akun Google Drive Anda?\n\nSpreadsheet ini akan otomatis dibuat dengan 5 tab terstruktur: Rekap Laporan, Item Pekerjaan, Log Tenaga Kerja, Material & Perangkat (dengan SN, Daya, Tahun, Merk), dan Kendala Lapangan.`,
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
   * Extracts Google Sheets ID from URL or bare ID string.
   */
  const extractSheetId = (input: string): string => {
    const trimmed = input.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed;
  };

  const handleConnectManual = () => {
    const extractedId = extractSheetId(manualSheetInput);
    if (!extractedId) {
      setErrorMessage('Masukkan tautan (URL) atau ID Google Spreadsheet yang valid.');
      return;
    }
    setSelectedSheetId(extractedId);
    onUpdateSettings({
      spreadsheetId: extractedId,
      spreadsheetName: 'Spreadsheet Tersambung Manual',
    });
    setSyncSuccess('Spreadsheet ID berhasil dihubungkan.');
    setActiveTab('active');
  };

  /**
   * Prompts user with mandatory confirmation dialog before mutating Google Sheet.
   */
  const requestSyncToExisting = (bulk = false) => {
    const targetId = selectedSheetId || settings.spreadsheetId;
    if (!token || !targetId) {
      setErrorMessage('Pilih atau tentukan spreadsheet terlebih dahulu.');
      return;
    }

    const count = bulk ? allReports.length : 1;
    const targetSheetName =
      driveSheets.find((s) => s.id === targetId)?.name ||
      settings.spreadsheetName ||
      'Spreadsheet Terpilih';

    setConfirmDialog({
      isOpen: true,
      title: 'Konfirmasi Sinkronisasi Data ke Google Sheets',
      message: `Apakah Anda ingin menulis dan menambahkan ${count} data laporan harian ke spreadsheet "${targetSheetName}"?\n\nData baris baru akan ditambahkan ke tab Rekap Laporan, Item Pekerjaan, Tenaga Kerja, Material & Perangkat (dengan SN, Daya, Tahun, Merk) tanpa menghapus data sebelumnya.`,
      action: () => executeSyncToExisting(bulk),
    });
  };

  const executeSyncToExisting = async (bulk = false) => {
    const targetId = selectedSheetId || settings.spreadsheetId;
    if (!token || !targetId) return;
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      let finalUrl = '';
      if (bulk && allReports.length > 0) {
        for (const r of allReports) {
          const res = await appendReportToSpreadsheet(targetId, r, token);
          finalUrl = res.spreadsheetUrl;
          if (onReportSynced) {
            onReportSynced(r.id, res.spreadsheetUrl);
          }
        }
        setSyncSuccess(`Berhasil menyinkronkan ${allReports.length} laporan proyek ke Google Sheets!`);
      } else if (report) {
        const res = await appendReportToSpreadsheet(targetId, report, token);
        finalUrl = res.spreadsheetUrl;
        if (onReportSynced) {
          onReportSynced(report.id, res.spreadsheetUrl);
        }
        setSyncSuccess(`Laporan No. ${report.reportNumber} berhasil ditambahkan ke Google Sheets!`);
      }

      onUpdateSettings({
        spreadsheetId: targetId,
        spreadsheetName:
          driveSheets.find((s) => s.id === targetId)?.name ||
          settings.spreadsheetName ||
          'Google Spreadsheet Proyek',
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyinkronkan data ke Google Sheets');
    } finally {
      setIsSyncing(false);
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const currentSheetId = selectedSheetId || settings.spreadsheetId || '';
  const currentSheetUrl = currentSheetId
    ? `https://docs.google.com/spreadsheets/d/${currentSheetId}/edit`
    : '';

  const handleCopyLink = () => {
    if (!currentSheetUrl) return;
    navigator.clipboard.writeText(currentSheetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredDriveSheets = driveSheets.filter((s) =>
    s.name.toLowerCase().includes(driveSearch.toLowerCase())
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-700/80 rounded-xl border border-emerald-500/30 shadow-xs">
                <FileSpreadsheet size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base">Sinkronisasi Google Sheets</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                    Workspace V4 API
                  </span>
                </div>
                <p className="text-xs text-emerald-200">
                  Cadangkan rekap progres, tenaga kerja, kendala, dan log material (SN/Daya/Tahun/Merk) ke cloud
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700/60 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {/* User Auth Section */}
            {!user ? (
              <div className="p-6 bg-gradient-to-b from-slate-50 to-emerald-50/40 border border-slate-200 rounded-2xl text-center flex flex-col items-center">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
                  <Table2 size={28} />
                </div>
                <h4 className="text-base font-bold text-slate-800 mb-1">Hubungkan Akun Google Anda</h4>
                <p className="text-xs text-slate-600 max-w-md mb-5 leading-relaxed">
                  Masuk dengan akun Google untuk menyinkronkan laporan pekerjaan langsung ke spreadsheet resmi di Google Drive Anda.
                </p>

                {/* Official Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="inline-flex items-center gap-3 px-6 py-3 bg-white border border-slate-300 rounded-xl shadow-xs hover:bg-slate-50 hover:shadow-md transition-all text-xs font-semibold text-slate-700 cursor-pointer disabled:opacity-50"
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
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-2xs">
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
                      <span className="px-2 py-0.5 text-[9px] bg-emerald-200 text-emerald-800 rounded font-semibold">Tersambung</span>
                    </div>
                    <div className="text-[11px] text-emerald-700">{user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => token && loadDriveSpreadsheets(token)}
                    title="Segarkan daftar spreadsheet dari Drive"
                    className="p-2 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors"
                  >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <LogOut size={13} /> Keluar
                  </button>
                </div>
              </div>
            )}

            {/* Success notification banner */}
            {syncSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                  <span className="font-medium">{syncSuccess}</span>
                </div>
                {currentSheetUrl && (
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-2.5 py-1 text-xs bg-white border border-emerald-300 rounded-lg text-emerald-800 hover:bg-emerald-100 flex items-center gap-1"
                    >
                      {copiedLink ? <CheckCircle size={12} /> : <Copy size={12} />}
                      <span>{copiedLink ? 'Tersalin' : 'Salin Link'}</span>
                    </button>
                    <a
                      href={currentSheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1"
                    >
                      Buka Sheet <ExternalLink size={12} />
                    </a>
                  </div>
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

            {/* OPTIMIZED SEGMENTED TABS MENU */}
            {user && (
              <div className="space-y-4">
                {/* Modern Segmented Navigation Bar */}
                <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                      activeTab === 'create'
                        ? 'bg-white text-emerald-800 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <PlusCircle size={14} className={activeTab === 'create' ? 'text-emerald-600' : ''} />
                    <span>Buat Baru</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('choose')}
                    className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                      activeTab === 'choose'
                        ? 'bg-white text-emerald-800 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <FolderOpen size={14} className={activeTab === 'choose' ? 'text-emerald-600' : ''} />
                    <span>Dari Google Drive</span>
                    {driveSheets.length > 0 && (
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                        {driveSheets.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('manual')}
                    className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                      activeTab === 'manual'
                        ? 'bg-white text-emerald-800 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Link2 size={14} className={activeTab === 'manual' ? 'text-emerald-600' : ''} />
                    <span>Tautkan URL / ID</span>
                  </button>

                  {settings.spreadsheetId && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('active')}
                      className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                        activeTab === 'active'
                          ? 'bg-emerald-600 text-white shadow-xs font-bold'
                          : 'text-emerald-800 hover:bg-emerald-100/50'
                      }`}
                    >
                      <FileCheck size={14} />
                      <span>Spreadsheet Aktif</span>
                    </button>
                  )}
                </div>

                {/* TAB 1: BUAT SPREADSHEET BARU */}
                {activeTab === 'create' && (
                  <div className="space-y-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-200 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Judul Google Spreadsheet Baru:
                      </label>
                      <input
                        type="text"
                        value={newSheetTitle}
                        onChange={(e) => setNewSheetTitle(e.target.value)}
                        placeholder="Daily Report Log Proyek..."
                        className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                      />
                    </div>

                    {/* Structure Preview of 5 tabs */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                        Struktur 5 Tab Otomatis yang Dibuat:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px]">
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                          <div className="font-bold text-slate-800 flex items-center gap-1">
                            <Layers size={12} className="text-emerald-600" /> Rekap Laporan
                          </div>
                          <p className="text-slate-400">No. Lap, Tgl, No. WO, Cuaca, Shift, Pelapor</p>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                          <div className="font-bold text-slate-800 flex items-center gap-1">
                            <HardHat size={12} className="text-sky-600" /> Pekerjaan
                          </div>
                          <p className="text-slate-400">Uraian, Satuan, Vol Target & Realisasi, %</p>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                          <div className="font-bold text-slate-800 flex items-center gap-1">
                            <Users size={12} className="text-indigo-600" /> Tenaga Kerja
                          </div>
                          <p className="text-slate-400">Jabatan, Jumlah Org, Jam Kerja, MH</p>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-emerald-300 bg-emerald-50/40 shadow-2xs space-y-1">
                          <div className="font-bold text-emerald-900 flex items-center gap-1">
                            <Boxes size={12} className="text-emerald-700" /> Material & SN
                          </div>
                          <p className="text-emerald-700/80 font-medium">SN, Daya, Tahun, Merk, Qty</p>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
                          <div className="font-bold text-slate-800 flex items-center gap-1">
                            <AlertTriangle size={12} className="text-amber-600" /> Kendala
                          </div>
                          <p className="text-slate-400">Kategori, Dampak Jam, Tindakan</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                      <span className="text-[11px] text-slate-500">
                        {report ? `Laporan #${report.reportNumber} akan langsung diisikan.` : 'Spreadsheet siap menerima data laporan.'}
                      </span>
                      <button
                        type="button"
                        onClick={requestCreateSheet}
                        disabled={isSyncing || !newSheetTitle}
                        className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isSyncing ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <PlusCircle size={15} />
                        )}
                        <span>Buat & Sinkronkan Sekarang</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: PILIH DARI GOOGLE DRIVE */}
                {activeTab === 'choose' && (
                  <div className="space-y-3.5 p-5 bg-slate-50/80 rounded-2xl border border-slate-200 animate-in fade-in">
                    <div className="flex items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                        <input
                          type="text"
                          placeholder="Cari spreadsheet di Google Drive Anda..."
                          value={driveSearch}
                          onChange={(e) => setDriveSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => token && loadDriveSpreadsheets(token)}
                        className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                        <span>Segarkan</span>
                      </button>
                    </div>

                    {filteredDriveSheets.length > 0 ? (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {filteredDriveSheets.map((s) => (
                          <label
                            key={s.id}
                            className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                              selectedSheetId === s.id
                                ? 'border-emerald-600 bg-emerald-50/80 font-bold text-emerald-950 shadow-xs'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100/70'
                            }`}
                          >
                            <div className="flex items-center gap-3 truncate">
                              <input
                                type="radio"
                                name="spreadsheet-choice"
                                checked={selectedSheetId === s.id}
                                onChange={() => setSelectedSheetId(s.id)}
                                className="accent-emerald-600 w-4 h-4 cursor-pointer"
                              />
                              <Table2 size={16} className="text-emerald-600 shrink-0" />
                              <div className="truncate">
                                <div className="truncate text-xs font-bold">{s.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">ID: {s.id}</div>
                              </div>
                            </div>
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] text-slate-400 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-slate-100"
                              title="Buka spreadsheet di tab baru"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                        {isLoading
                          ? 'Memuat daftar file dari Google Drive...'
                          : driveSearch
                          ? `Tidak ditemukan spreadsheet dengan kata kunci "${driveSearch}".`
                          : 'Belum ada Google Spreadsheet di akun Anda. Gunakan opsi "Buat Baru".'}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-[11px] text-slate-500">
                        {selectedSheetId ? 'Spreadsheet siap disinkronkan.' : 'Pilih spreadsheet dari daftar.'}
                      </span>
                      <div className="flex items-center gap-2">
                        {allReports.length > 1 && (
                          <button
                            type="button"
                            onClick={() => requestSyncToExisting(true)}
                            disabled={isSyncing || !selectedSheetId}
                            className="px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <span>Sync Semua ({allReports.length})</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => requestSyncToExisting(false)}
                          disabled={isSyncing || !selectedSheetId}
                          className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          {isSyncing ? (
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <CheckCircle size={15} />
                          )}
                          <span>{report ? `Tambahkan Laporan #${report.reportNumber}` : 'Hubungkan Spreadsheet'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: TEMPEL URL / ID SECARA MANUAL */}
                {activeTab === 'manual' && (
                  <div className="space-y-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-200 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Tautan (URL) atau ID Google Spreadsheet:
                      </label>
                      <div className="relative">
                        <Link2 className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input
                          type="text"
                          value={manualSheetInput}
                          onChange={(e) => setManualSheetInput(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit atau salin ID"
                          className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        Anda bisa menyalin link browser spreadsheet yang sudah ada. Sistem akan otomatis mendeteksi ID dokumen tersebut.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={handleConnectManual}
                        disabled={!manualSheetInput.trim()}
                        className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle size={15} /> Hubungkan Spreadsheet Ini
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 4: SPREADSHEET AKTIF & SYNC */}
                {activeTab === 'active' && settings.spreadsheetId && (
                  <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-4 animate-in fade-in">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{settings.spreadsheetName || 'Spreadsheet Utama Proyek'}</span>
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-200 text-emerald-800 rounded">Aktif</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">ID: {settings.spreadsheetId}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                          {copiedLink ? <CheckCircle size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          <span>{copiedLink ? 'Tersalin' : 'Salin URL'}</span>
                        </button>

                        <a
                          href={`https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/edit`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                          <span>Buka Google Sheets</span>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>

                    {/* Sync actions */}
                    <div className="p-3.5 bg-white rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Tindakan Sinkronisasi:</div>
                        <div className="text-[11px] text-slate-500">
                          Data akan ditambahkan ke tab Rekap, Pekerjaan, Manpower, dan Material (SN/Daya/Tahun/Merk).
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {report && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSheetId(settings.spreadsheetId!);
                              requestSyncToExisting(false);
                            }}
                            disabled={isSyncing}
                            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                          >
                            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                            <span>Sync Laporan #{report.reportNumber}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSheetId(settings.spreadsheetId!);
                            requestSyncToExisting(true);
                          }}
                          disabled={isSyncing}
                          className="px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <Sparkles size={13} className="text-emerald-700" />
                          <span>Sync Semua ({allReports.length} Lap.)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-500">
              Sinkronisasi aman menggunakan Google Workspace API resmi dengan izin pengguna.
            </span>
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
