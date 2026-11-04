import React, { useState } from 'react';
import { DailyReport, ReportStatus, WeatherCondition, AppSettings } from '../types/report';
import { generateDailyReportPDF } from '../services/pdfGenerator';
import {
  Search,
  Filter,
  FileDown,
  Share2,
  Mail,
  Table2,
  Eye,
  Edit,
  Trash2,
  Calendar,
  CloudSun,
  MapPin,
  Users,
  HardHat,
  Camera,
  CheckCircle2,
  Clock,
  Layers,
  LayoutGrid,
  List,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface ReportListProps {
  reports: DailyReport[];
  settings: AppSettings;
  onViewReport: (report: DailyReport) => void;
  onEditReport: (report: DailyReport) => void;
  onDeleteReport: (reportId: string) => void;
  onOpenWhatsApp: (report: DailyReport) => void;
  onOpenEmail: (report: DailyReport) => void;
  onOpenSheets: (report?: DailyReport) => void;
  onCreateNew: () => void;
}

export const ReportList: React.FC<ReportListProps> = ({
  reports,
  settings,
  onViewReport,
  onEditReport,
  onDeleteReport,
  onOpenWhatsApp,
  onOpenEmail,
  onOpenSheets,
  onCreateNew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [weatherFilter, setWeatherFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Statistics
  const totalReports = reports.length;
  const approvedReports = reports.filter((r) => r.status === 'Disetujui').length;
  const totalWorkersToday = reports.reduce((acc, r) => {
    return acc + r.manpowerList.reduce((mAcc, m) => mAcc + (Number(m.count) || 0), 0);
  }, 0);
  const totalPhotosArchived = reports.reduce((acc, r) => acc + (r.photos?.length || 0), 0);

  // Filtering
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.projectCode && report.projectCode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesWeather = weatherFilter === 'all' || report.weather === weatherFilter;

    return matchesSearch && matchesStatus && matchesWeather;
  });

  const handleQuickDownloadPDF = async (report: DailyReport, e: React.MouseEvent) => {
    e.stopPropagation();
    setExportingId(report.id);
    try {
      const doc = await generateDailyReportPDF(report);
      const safeProject = report.projectName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      doc.save(`DailyReport_${report.reportNumber.replace(/[^a-zA-Z0-9]/g, '-')}_${safeProject}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setExportingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Layers size={22} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">{totalReports}</div>
            <div className="text-xs text-slate-500 font-medium">Total Laporan Harian</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">{approvedReports}</div>
            <div className="text-xs text-slate-500 font-medium">Laporan Terverifikasi</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users size={22} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">{totalWorkersToday}</div>
            <div className="text-xs text-slate-500 font-medium">Total Personil Terlibat</div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Camera size={22} />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-800">{totalPhotosArchived}</div>
            <div className="text-xs text-slate-500 font-medium">Foto Dokumentasi Fisik</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari nomor laporan, nama proyek, lokasi, atau kode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-700"
            >
              <option value="all">Semua Status</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Diajukan">Diajukan</option>
              <option value="Draft">Draft</option>
              <option value="Revisi">Revisi</option>
            </select>

            {/* Weather Filter */}
            <select
              value={weatherFilter}
              onChange={(e) => setWeatherFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-700"
            >
              <option value="all">Semua Cuaca</option>
              <option value="Cerah">Cerah</option>
              <option value="Cerah Berawan">Cerah Berawan</option>
              <option value="Berawan">Berawan</option>
              <option value="Hujan Ringan">Hujan Ringan</option>
              <option value="Hujan Deras">Hujan Deras</option>
            </select>

            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Tampilan Grid Kartu"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Tampilan Tabel Rinci"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Items Container */}
      {filteredReports.length > 0 ? (
        viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReports.map((report) => {
              const workerCount = report.manpowerList.reduce((acc, m) => acc + (Number(m.count) || 0), 0);
              const progressAvg = report.workItems.length > 0
                ? Math.round(report.workItems.reduce((acc, w) => acc + (Number(w.progressPercent) || 0), 0) / report.workItems.length)
                : 0;

              return (
                <div
                  key={report.id}
                  onClick={() => onViewReport(report)}
                  className="group bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between"
                >
                  {/* Card Top Banner */}
                  <div className="p-4 border-b border-slate-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-100">
                        {report.reportNumber}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          report.status === 'Disetujui'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : report.status === 'Diajukan'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-sky-700 transition-colors">
                      {report.projectName}
                    </h4>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar size={12} className="text-slate-400" /> {formatDate(report.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CloudSun size={12} className="text-slate-400" /> {report.weather}
                      </span>
                    </div>
                  </div>

                  {/* Card Center: Progress, Manpower, Photo Preview */}
                  <div className="p-4 space-y-3.5 flex-1">
                    {/* Location */}
                    <div className="text-[11px] text-slate-600 flex items-start gap-1.5">
                      <MapPin size={13} className="text-rose-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{report.location || 'Lokasi Belum Diisi'}</span>
                    </div>

                    {/* Progress Average Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-500 font-medium">Progres Kumulatif:</span>
                        <span className="font-bold font-mono text-slate-800">{progressAvg}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-600 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progressAvg, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Meta badges: Manpower, Items, Photos */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block">Pekerja</span>
                        <span className="font-bold text-slate-700">{workerCount} Org</span>
                      </div>
                      <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block">Pekerjaan</span>
                        <span className="font-bold text-slate-700">{report.workItems.length} Item</span>
                      </div>
                      <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block">Foto</span>
                        <span className="font-bold text-slate-700">{report.photos.length} Foto</span>
                      </div>
                    </div>

                    {/* Photo Thumbnails if available */}
                    {report.photos.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1 overflow-hidden">
                        {report.photos.slice(0, 3).map((ph) => (
                          <img
                            key={ph.id}
                            src={ph.dataUrl}
                            alt=""
                            className="w-12 h-9 object-cover rounded-md border border-slate-200"
                          />
                        ))}
                        {report.photos.length > 3 && (
                          <div className="w-9 h-9 rounded-md bg-slate-100 text-[10px] font-bold text-slate-500 flex items-center justify-center border border-slate-200">
                            +{report.photos.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Quick Actions */}
                  <div
                    className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1">
                      {/* PDF Quick Download */}
                      <button
                        type="button"
                        onClick={(e) => handleQuickDownloadPDF(report, e)}
                        disabled={exportingId === report.id}
                        title="Unduh PDF Resmi (+Foto)"
                        className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                      >
                        {exportingId === report.id ? (
                          <div className="w-4 h-4 border-2 border-sky-600/30 border-t-sky-600 rounded-full animate-spin" />
                        ) : (
                          <FileDown size={16} />
                        )}
                      </button>

                      {/* WhatsApp Quick Share */}
                      <button
                        type="button"
                        onClick={() => onOpenWhatsApp(report)}
                        title="Kirim via WhatsApp"
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Share2 size={16} />
                      </button>

                      {/* Email Quick Share */}
                      <button
                        type="button"
                        onClick={() => onOpenEmail(report)}
                        title="Kirim via Email"
                        className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                      >
                        <Mail size={16} />
                      </button>

                      {/* Google Sheets Sync */}
                      <button
                        type="button"
                        onClick={() => onOpenSheets(report)}
                        title="Sinkronkan ke Google Sheets"
                        className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                      >
                        <Table2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditReport(report)}
                        title="Edit Laporan"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteReport(report.id)}
                        title="Hapus"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No. Laporan</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Nama Proyek</th>
                    <th className="py-3 px-4">Cuaca & Shift</th>
                    <th className="py-3 px-4 text-center">Pekerja</th>
                    <th className="py-3 px-4 text-center">Foto</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      onClick={() => onViewReport(report)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-sky-700">{report.reportNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(report.date)}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{report.projectName}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{report.location}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-700">{report.weather}</div>
                        <div className="text-[10px] text-slate-400">{report.shift}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {report.manpowerList.reduce((acc, m) => acc + (Number(m.count) || 0), 0)} Org
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">
                          {report.photos.length}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            report.status === 'Disetujui'
                              ? 'bg-emerald-100 text-emerald-800'
                              : report.status === 'Diajukan'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleQuickDownloadPDF(report, e)}
                            title="Unduh PDF"
                            className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg"
                          >
                            <FileDown size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenWhatsApp(report)}
                            title="WhatsApp"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          >
                            <Share2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenEmail(report)}
                            title="Email"
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg"
                          >
                            <Mail size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditReport(report)}
                            title="Edit"
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                          >
                            <Edit size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
          <HardHat size={36} className="mx-auto text-slate-400" />
          <h4 className="text-base font-bold text-slate-800">Tidak ada laporan yang sesuai pencarian</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Ubah kata kunci pencarian atau buat laporan harian baru untuk memulai pencatatan proyek.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onCreateNew}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs transition-colors"
            >
              Buat Laporan Baru Sekarang
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
