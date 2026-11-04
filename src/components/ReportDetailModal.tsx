import React, { useState } from 'react';
import { DailyReport, AppSettings } from '../types/report';
import { generateDailyReportPDF } from '../services/pdfGenerator';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { EmailShareModal } from './EmailShareModal';
import { GoogleSheetsModal } from './GoogleSheetsModal';
import { ConfirmModal } from './ConfirmModal';
import {
  FileText,
  FileDown,
  Printer,
  Share2,
  Mail,
  Table2,
  Calendar,
  CloudSun,
  MapPin,
  Clock,
  Edit,
  Trash2,
  X,
  Users,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Camera,
  ExternalLink,
} from 'lucide-react';

interface ReportDetailModalProps {
  report: DailyReport;
  allReports: DailyReport[];
  settings: AppSettings;
  onEdit: (report: DailyReport) => void;
  onDelete: (reportId: string) => void;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onClose: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  allReports,
  settings,
  onEdit,
  onDelete,
  onUpdateSettings,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'work' | 'manpower' | 'materials' | 'issues' | 'photos' | 'signatures'>('overview');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showWAModal, setShowWAModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

  const totalWorkers = report.manpowerList.reduce((acc, m) => acc + (Number(m.count) || 0), 0);
  const totalManHours = report.manpowerList.reduce((acc, m) => acc + (Number(m.count) || 0) * (Number(m.workHours) || 8), 0);

  const handleDownloadPDF = async () => {
    setIsExportingPdf(true);
    try {
      const doc = await generateDailyReportPDF(report);
      const safeProject = report.projectName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      const filename = `DailyReport_${report.reportNumber.replace(/[^a-zA-Z0-9]/g, '-')}_${safeProject}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrintPDF = async () => {
    try {
      const doc = await generateDailyReportPDF(report);
      const pdfBlobUrl = doc.output('bloburl');
      window.open(pdfBlobUrl, '_blank');
    } catch (e) {
      console.error('Print failed:', e);
    }
  };

  const formatDateIndo = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
          {/* Header Bar */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 text-sky-400 rounded-xl">
                <FileText size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-slate-800 text-sky-400 px-2 py-0.5 rounded font-semibold">
                    {report.reportNumber}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      report.status === 'Disetujui'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : report.status === 'Diajukan'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-100 truncate max-w-lg mt-0.5">
                  {report.projectName}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintPDF}
                title="Cetak Laporan"
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <Printer size={18} />
              </button>
              <button
                type="button"
                onClick={() => onEdit(report)}
                title="Edit Laporan"
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                <Edit size={18} />
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                title="Hapus Laporan"
                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-xl transition-colors"
              >
                <Trash2 size={18} />
              </button>
              <div className="h-5 w-px bg-slate-700 mx-1" />
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Action Ribbon: PDF, WhatsApp, Email, Sheets */}
          <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 shrink-0">
            <div className="flex items-center gap-2">
              {/* PDF Button */}
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isExportingPdf}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isExportingPdf ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FileDown size={15} />
                )}
                <span>Unduh PDF Lengkap (+Foto)</span>
              </button>

              {/* WhatsApp Button */}
              <button
                type="button"
                onClick={() => setShowWAModal(true)}
                className="px-4 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-all flex items-center gap-2"
              >
                <Share2 size={15} className="text-emerald-700" />
                <span>Kirim WhatsApp</span>
              </button>

              {/* Email Button */}
              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                className="px-4 py-2 text-xs font-semibold text-sky-900 bg-sky-100 hover:bg-sky-200 border border-sky-300 rounded-xl transition-all flex items-center gap-2"
              >
                <Mail size={15} className="text-sky-700" />
                <span>Kirim Email</span>
              </button>

              {/* Google Sheets Button */}
              <button
                type="button"
                onClick={() => setShowSheetsModal(true)}
                className="px-4 py-2 text-xs font-semibold text-teal-900 bg-teal-100 hover:bg-teal-200 border border-teal-300 rounded-xl transition-all flex items-center gap-2"
              >
                <Table2 size={15} className="text-teal-700" />
                <span>Sync Google Sheets</span>
              </button>
            </div>

            {report.syncedToSheets && settings.spreadsheetId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-medium bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
              >
                <CheckCircle2 size={13} className="text-emerald-600" />
                <span>Tersinkron di Google Sheets</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="px-6 pt-2 border-b border-slate-200 flex items-center gap-1 overflow-x-auto shrink-0 bg-white">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Ringkasan Proyek
            </button>
            <button
              onClick={() => setActiveTab('work')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'work'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Uraian Pekerjaan ({report.workItems.length})
            </button>
            <button
              onClick={() => setActiveTab('manpower')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'manpower'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Tenaga Kerja ({totalWorkers} Org)
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'materials'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Material & Alat ({report.materials.length + report.equipment.length})
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'issues'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Kendala & Solusi ({report.issues.length})
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'photos'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Camera size={14} />
              <span>Dokumentasi Foto ({report.photos.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('signatures')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'signatures'
                  ? 'border-sky-600 text-sky-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Tanda Tangan & Pengesahan
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Info Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                      <Calendar size={13} /> Tanggal & Hari
                    </div>
                    <div className="text-xs font-bold text-slate-800">{formatDateIndo(report.date)}</div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                      <CloudSun size={13} /> Kondisi Cuaca
                    </div>
                    <div className="text-xs font-bold text-slate-800">{report.weather}</div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                      <Clock size={13} /> Shift Kerja
                    </div>
                    <div className="text-xs font-bold text-slate-800">{report.shift}</div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mb-1">
                      <Users size={13} /> Tenaga Kerja
                    </div>
                    <div className="text-xs font-bold text-slate-800">{totalWorkers} Personil ({totalManHours} MH)</div>
                  </div>
                </div>

                {/* Location & Metadata Details */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detail Informasi Proyek</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Nama Pekerjaan & No. WO:</span>
                      <span className="font-semibold text-slate-800">{report.projectName} {report.projectCode && `(${report.projectCode})`}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Lokasi Pekerjaan:</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <MapPin size={13} className="text-rose-500 shrink-0" /> {report.location || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Kontraktor Pelaksana:</span>
                      <span className="font-semibold text-slate-800">{report.contractor || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Pemberi Tugas / Klien:</span>
                      <span className="font-semibold text-slate-800">{report.clientName || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Executive Summary */}
                {report.executiveSummary && (
                  <div className="p-4 bg-sky-50/70 rounded-xl border border-sky-200">
                    <h4 className="text-xs font-bold text-sky-950 mb-1.5 flex items-center gap-1.5">
                      <span>Rangkuman Eksekutif Lapangan (Executive Summary)</span>
                    </h4>
                    <p className="text-xs text-sky-900 leading-relaxed whitespace-pre-line">
                      {report.executiveSummary}
                    </p>
                  </div>
                )}

                {/* General Notes */}
                {report.generalNotes && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-700 mb-1">Catatan Pengawas Lapangan:</h4>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {report.generalNotes}
                    </p>
                  </div>
                )}

                {/* Quick Photo Snippet */}
                {report.photos.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Cuplikan Foto Dokumentasi Lapangan ({report.photos.length} Foto)
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveTab('photos')}
                        className="text-xs text-sky-600 hover:underline font-semibold"
                      >
                        Lihat Semua Foto →
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {report.photos.slice(0, 4).map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setZoomedPhoto(p.dataUrl)}
                          className="group relative rounded-xl border border-slate-200 overflow-hidden cursor-pointer shadow-xs bg-slate-100"
                        >
                          <img src={p.dataUrl} alt={p.caption} className="w-full h-28 object-cover group-hover:scale-105 transition-transform" />
                          <div className="p-2 bg-white text-[10px]">
                            <span className="font-bold text-slate-800 line-clamp-1">{p.caption}</span>
                            <span className="text-slate-400">{p.timestamp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: WORK ITEMS */}
            {activeTab === 'work' && (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10">No</th>
                        <th className="py-2.5 px-3">Item Pekerjaan & Lokasi Detail</th>
                        <th className="py-2.5 px-3 text-center w-20">Satuan</th>
                        <th className="py-2.5 px-3 text-right w-24">Target</th>
                        <th className="py-2.5 px-3 text-right w-24">Realisasi</th>
                        <th className="py-2.5 px-3 text-center w-36">Progres</th>
                        <th className="py-2.5 px-3 text-center w-28">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.workItems.map((w, idx) => (
                        <tr key={w.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-800">{w.name}</div>
                            {w.locationDetail && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin size={11} className="text-slate-400" /> {w.locationDetail}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600 font-mono">{w.unit}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">{w.planVolume}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{w.actualVolume}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-sky-600 rounded-full"
                                  style={{ width: `${Math.min(w.progressPercent, 100)}%` }}
                                />
                              </div>
                              <span className="font-bold text-slate-700 font-mono text-[11px] w-10 text-right">
                                {w.progressPercent}%
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                w.status === 'Selesai'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : w.status === 'Dalam Proses'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {w.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: MANPOWER */}
            {activeTab === 'manpower' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-600">
                    Total Tenaga Kerja Hari Ini: <strong className="text-slate-900 text-sm">{totalWorkers} Orang</strong>
                  </div>
                  <div className="text-xs text-slate-600">
                    Total Jam Kerja: <strong className="text-slate-900 text-sm">{totalManHours} Man-Hours</strong>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10">No</th>
                        <th className="py-2.5 px-3">Klasifikasi Tenaga Kerja</th>
                        <th className="py-2.5 px-3 text-center w-28">Jumlah (Orang)</th>
                        <th className="py-2.5 px-3 text-center w-28">Jam Kerja</th>
                        <th className="py-2.5 px-3 text-center w-28">Total Man-Hours</th>
                        <th className="py-2.5 px-3">Keterangan / Tugas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {report.manpowerList.map((m, idx) => (
                        <tr key={m.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{m.role}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900">{m.count} Org</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{m.workHours} Jam</td>
                          <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-700">
                            {(Number(m.count) || 0) * (Number(m.workHours) || 8)} MH
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{m.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: MATERIALS & EQUIPMENT */}
            {activeTab === 'materials' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Boxes size={15} /> Log Penerimaan & Penggunaan Material
                  </h4>
                  {report.materials.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3 text-center w-10">No</th>
                            <th className="py-2.5 px-3">Nama Material / Bahan</th>
                            <th className="py-2.5 px-3 text-center w-32">Diterima Hari Ini</th>
                            <th className="py-2.5 px-3 text-center w-32">Digunakan Hari Ini</th>
                            <th className="py-2.5 px-3">Catatan / Surat Jalan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {report.materials.map((m, idx) => (
                            <tr key={m.id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{m.name}</td>
                              <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-bold">
                                +{m.receivedQty} {m.unit}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                                {m.usedQty} {m.unit}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">{m.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                      Tidak ada data log material untuk laporan ini.
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Penggunaan Alat Berat & Peralatan Proyek
                  </h4>
                  {report.equipment.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3 text-center w-10">No</th>
                            <th className="py-2.5 px-3">Nama Peralatan</th>
                            <th className="py-2.5 px-3 text-center w-24">Jumlah Unit</th>
                            <th className="py-2.5 px-3 text-center w-28">Jam Operasi</th>
                            <th className="py-2.5 px-3 text-center w-28">Jam Standby</th>
                            <th className="py-2.5 px-3 text-center w-28">Status Alat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {report.equipment.map((eq, idx) => (
                            <tr key={eq.id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{eq.name}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-800">{eq.totalUnits} Unit</td>
                              <td className="py-2.5 px-3 text-center font-mono text-emerald-700">{eq.operatingHours} Jam</td>
                              <td className="py-2.5 px-3 text-center font-mono text-amber-700">{eq.standbyHours} Jam</td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                  {eq.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                      Tidak ada peralatan khusus yang tercatat.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: ISSUES & ACTION */}
            {activeTab === 'issues' && (
              <div className="space-y-4">
                {report.issues.length > 0 ? (
                  <div className="space-y-3">
                    {report.issues.map((iss, idx) => (
                      <div key={iss.id} className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-200 text-amber-900 rounded uppercase">
                              {iss.category}
                            </span>
                            <span className="text-xs font-bold text-slate-800">Kendala #{idx + 1}</span>
                          </div>
                          <span className="text-[11px] text-amber-800 font-semibold">
                            Dampak: {iss.impactHours || 0} Jam
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {iss.description}
                        </p>
                        <div className="p-3 bg-white rounded-lg border border-amber-100 text-xs">
                          <span className="font-bold text-emerald-800 block mb-0.5">Tindakan / Solusi Penyelesaian:</span>
                          <span className="text-slate-700">{iss.actionTaken}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                    <h4 className="text-sm font-bold text-slate-800 mb-1">Kondisi Lapangan Kondusif</h4>
                    <p className="text-xs text-slate-500">Tidak ada kendala atau hambatan pekerjaan yang dilaporkan hari ini.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: PHOTOS DOCUMENTATION */}
            {activeTab === 'photos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Foto dokumentasi resmi kegiatan lapangan yang otomatis tercetak di lembar PDF.
                  </div>
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {report.photos.length} Foto Terlampir
                  </span>
                </div>

                {report.photos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {report.photos.map((photo, i) => (
                      <div
                        key={photo.id}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
                      >
                        <div
                          className="relative h-48 bg-slate-100 cursor-pointer overflow-hidden group"
                          onClick={() => setZoomedPhoto(photo.dataUrl)}
                        >
                          <img
                            src={photo.dataUrl}
                            alt={photo.caption}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                            {photo.category}
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="text-[11px] font-semibold text-white bg-slate-900/80 px-2.5 py-1 rounded-lg">
                              Klik untuk Perbesar
                            </span>
                          </div>
                        </div>

                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800 leading-snug mb-1">
                              {photo.caption}
                            </p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{photo.timestamp}</span>
                            {photo.location && <span className="font-medium text-slate-600">{photo.location}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <Camera size={32} className="mx-auto text-slate-400 mb-2" />
                    <h4 className="text-sm font-bold text-slate-800 mb-1">Belum Ada Foto Dokumentasi</h4>
                    <p className="text-xs text-slate-500 mb-4">
                      Tambahkan foto dokumentasi agar laporan PDF memiliki bukti visual pekerjaan lapangan yang valid.
                    </p>
                    <button
                      type="button"
                      onClick={() => onEdit(report)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-colors"
                    >
                      Unggah Foto di Mode Edit
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: SIGNATURES */}
            {activeTab === 'signatures' && (
              <div className="space-y-4">
                <div className="text-xs text-slate-500 mb-3">
                  Lembar pengesahan dan tanda tangan digital penanggung jawab pekerjaan:
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Pelapor */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center flex flex-col items-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Dibuat Oleh (Pelapor)
                    </span>
                    <div className="w-full h-24 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-2 mb-3">
                      {report.preparedBy?.dataUrl ? (
                        <img src={report.preparedBy.dataUrl} alt="Tanda Tangan Pelapor" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Belum ditandatangani</span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-800">{report.preparedBy?.name || '-'}</div>
                    <div className="text-[11px] text-slate-500">{report.preparedBy?.title || 'Site Supervisor'}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{report.preparedBy?.date || report.date}</div>
                  </div>

                  {/* Pengawas */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center flex flex-col items-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Diperiksa Oleh (Pengawas MK)
                    </span>
                    <div className="w-full h-24 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-2 mb-3">
                      {report.inspectedBy?.dataUrl ? (
                        <img src={report.inspectedBy.dataUrl} alt="Tanda Tangan Pengawas" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Belum ditandatangani</span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-800">{report.inspectedBy?.name || '-'}</div>
                    <div className="text-[11px] text-slate-500">{report.inspectedBy?.title || 'Konsultan Pengawas'}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{report.inspectedBy?.date || report.date}</div>
                  </div>

                  {/* Disetujui */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center flex flex-col items-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Disetujui Oleh (Project Manager / Klien)
                    </span>
                    <div className="w-full h-24 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-2 mb-3">
                      {report.approvedBy?.dataUrl ? (
                        <img src={report.approvedBy.dataUrl} alt="Tanda Tangan Owner" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Belum ditandatangani</span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-800">{report.approvedBy?.name || '-'}</div>
                    <div className="text-[11px] text-slate-500">{report.approvedBy?.title || 'Project Manager'}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{report.approvedBy?.date || report.date}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-400">
              Terakhir diperbarui: {report.lastUpdated || report.date}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={isExportingPdf}
                className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isExportingPdf ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FileDown size={15} />
                )}
                <span>Unduh PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      {showWAModal && (
        <WhatsAppShareModal
          report={report}
          sheetsUrl={settings.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/edit` : undefined}
          onClose={() => setShowWAModal(false)}
        />
      )}

      {showEmailModal && (
        <EmailShareModal
          report={report}
          sheetsUrl={settings.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${settings.spreadsheetId}/edit` : undefined}
          onDownloadPdf={handleDownloadPDF}
          onClose={() => setShowEmailModal(false)}
        />
      )}

      {showSheetsModal && (
        <GoogleSheetsModal
          report={report}
          allReports={allReports}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onClose={() => setShowSheetsModal(false)}
        />
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Hapus Laporan Harian?"
        message={`Apakah Anda yakin ingin menghapus laporan nomor ${report.reportNumber} untuk proyek "${report.projectName}"?\n\nTindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Laporan"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={() => {
          onDelete(report.id);
          setShowDeleteConfirm(false);
          onClose();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Zoom photo modal */}
      {zoomedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-zoom-out animate-in fade-in"
          onClick={() => setZoomedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={zoomedPhoto} alt="Zoomed" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" />
            <button
              onClick={() => setZoomedPhoto(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/90 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
