import React, { useState } from 'react';
import {
  DailyReport,
  WeatherCondition,
  ShiftType,
  ReportStatus,
  Manpower,
  WorkItem,
  MaterialItem,
  EquipmentItem,
  IssueItem,
  PhotoItem,
  AppSettings,
} from '../types/report';
import { SignaturePad } from './SignaturePad';
import { generateExecutiveSummary, polishFieldNotes } from '../services/gemini';
import {
  Plus,
  Trash2,
  Upload,
  Camera,
  Sparkles,
  Save,
  X,
  Calendar,
  CloudSun,
  MapPin,
  Clock,
  Briefcase,
  Users,
  HardHat,
  Boxes,
  Truck,
  AlertTriangle,
  PenTool,
  Image as ImageIcon,
} from 'lucide-react';

interface ReportEditorProps {
  initialReport?: DailyReport | null;
  settings: AppSettings;
  onSave: (report: DailyReport) => void;
  onCancel: () => void;
}

export const ReportEditor: React.FC<ReportEditorProps> = ({
  initialReport,
  settings,
  onSave,
  onCancel,
}) => {
  const isEditing = !!initialReport;

  // Form State
  const [reportNumber, setReportNumber] = useState(
    initialReport?.reportNumber || `RPT/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(new Date().getDate()).padStart(2, '0')}-01`
  );
  const [date, setDate] = useState(initialReport?.date || new Date().toISOString().slice(0, 10));
  const [projectName, setProjectName] = useState(initialReport?.projectName || 'Pembangunan Gedung Kantor Menara Mandiri Tower B');
  const [projectCode, setProjectCode] = useState(initialReport?.projectCode || 'PRJ-MMT-2026');
  const [contractor, setContractor] = useState(initialReport?.contractor || settings.defaultContractor);
  const [clientName, setClientName] = useState(initialReport?.clientName || settings.defaultClient);
  const [location, setLocation] = useState(initialReport?.location || 'Kawasan SCBD Lot 11, Jakarta Selatan');
  const [weather, setWeather] = useState<WeatherCondition>(initialReport?.weather || 'Cerah Berawan');
  const [shift, setShift] = useState<ShiftType>(initialReport?.shift || 'Shift Pagi (08:00 - 16:00)');
  const [status, setStatus] = useState<ReportStatus>(initialReport?.status || 'Diajukan');

  // Lists
  const [manpowerList, setManpowerList] = useState<Manpower[]>(
    initialReport?.manpowerList || [
      { id: '1', role: 'Site Supervisor', count: 1, workHours: 8, notes: 'Monitoring lapangan' },
      { id: '2', role: 'Tukang Besi & Cor', count: 12, workHours: 8, notes: 'Area lantai 3' },
      { id: '3', role: 'Pekerja Umum / Helper', count: 6, workHours: 8, notes: 'Pembersihan & handling' },
    ]
  );

  const [workItems, setWorkItems] = useState<WorkItem[]>(
    initialReport?.workItems || [
      {
        id: '1',
        name: 'Pengecoran Beton Plat Lantai',
        unit: 'm³',
        planVolume: 80,
        actualVolume: 80,
        progressPercent: 100,
        status: 'Selesai',
        locationDetail: 'Lantai 3 Zona Timur',
      },
    ]
  );

  const [materials, setMaterials] = useState<MaterialItem[]>(
    initialReport?.materials || [
      { id: '1', name: 'Beton Ready Mix K-350', receivedQty: 80, usedQty: 80, unit: 'm³', notes: 'Surat jalan lengkap' },
    ]
  );

  const [equipment, setEquipment] = useState<EquipmentItem[]>(
    initialReport?.equipment || [
      { id: '1', name: 'Concrete Pump Truck', totalUnits: 1, operatingHours: 6, standbyHours: 2, breakdownHours: 0, status: 'Baik' },
    ]
  );

  const [issues, setIssues] = useState<IssueItem[]>(
    initialReport?.issues || []
  );

  const [photos, setPhotos] = useState<PhotoItem[]>(
    initialReport?.photos || []
  );

  // Notes & AI
  const [generalNotes, setGeneralNotes] = useState(initialReport?.generalNotes || '');
  const [executiveSummary, setExecutiveSummary] = useState(initialReport?.executiveSummary || '');
  const [safetyNotes, setSafetyNotes] = useState(initialReport?.safetyNotes || '');

  // Signatures
  const [preparedByName, setPreparedByName] = useState(initialReport?.preparedBy?.name || settings.supervisorName);
  const [preparedByTitle, setPreparedByTitle] = useState(initialReport?.preparedBy?.title || 'Site Supervisor');
  const [preparedBySign, setPreparedBySign] = useState(initialReport?.preparedBy?.dataUrl || '');

  const [inspectedByName, setInspectedByName] = useState(initialReport?.inspectedBy?.name || 'Ir. Budi Santoso');
  const [inspectedByTitle, setInspectedByTitle] = useState(initialReport?.inspectedBy?.title || 'Konsultan Pengawas (MK)');
  const [inspectedBySign, setInspectedBySign] = useState(initialReport?.inspectedBy?.dataUrl || '');

  const [approvedByName, setApprovedByName] = useState(initialReport?.approvedBy?.name || 'Drs. Hendra Gunawan, MT');
  const [approvedByTitle, setApprovedByTitle] = useState(initialReport?.approvedBy?.title || 'Project Manager');
  const [approvedBySign, setApprovedBySign] = useState(initialReport?.approvedBy?.dataUrl || '');

  // Active section tab
  const [currentTab, setCurrentTab] = useState<'info' | 'manpower' | 'work' | 'materials' | 'issues' | 'photos' | 'signatures'>('info');

  // Signature Pad state
  const [activeSigner, setActiveSigner] = useState<'prepared' | 'inspected' | 'approved' | null>(null);

  // AI loading states
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isPolishingNotes, setIsPolishingNotes] = useState(false);

  // --- PHOTO COMPRESSION & UPLOAD ---
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Compress on client canvas to max 1280px to keep PDF light and crisp
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

            const now = new Date();
            const timeString = `${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

            const newPhoto: PhotoItem = {
              id: `ph-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              dataUrl: compressedDataUrl,
              caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
              category: 'Pekerjaan Struktur',
              timestamp: timeString,
              location: location,
            };

            setPhotos((prev) => [...prev, newPhoto]);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // --- AI HANDLERS ---
  const handleAiSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const draftReport: DailyReport = {
        id: initialReport?.id || 'temp',
        reportNumber,
        date,
        projectName,
        projectCode,
        contractor,
        clientName,
        location,
        weather,
        shift,
        status,
        manpowerList,
        workItems,
        materials,
        equipment,
        issues,
        photos,
        generalNotes,
        preparedBy: { name: preparedByName, title: preparedByTitle, date },
        inspectedBy: { name: inspectedByName, title: inspectedByTitle, date },
        approvedBy: { name: approvedByName, title: approvedByTitle, date },
        lastUpdated: new Date().toISOString(),
      };
      const summary = await generateExecutiveSummary(draftReport);
      setExecutiveSummary(summary);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleAiPolishNotes = async () => {
    if (!generalNotes.trim()) return;
    setIsPolishingNotes(true);
    try {
      const polished = await polishFieldNotes(generalNotes);
      setGeneralNotes(polished);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPolishingNotes(false);
    }
  };

  // --- SAVE HANDLER ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedReport: DailyReport = {
      id: initialReport?.id || `rpt-${Date.now()}`,
      reportNumber,
      date,
      projectName,
      projectCode,
      contractor,
      clientName,
      location,
      weather,
      shift,
      status,
      manpowerList,
      workItems,
      materials,
      equipment,
      issues,
      photos,
      generalNotes,
      executiveSummary,
      safetyNotes,
      preparedBy: {
        name: preparedByName,
        title: preparedByTitle,
        date,
        dataUrl: preparedBySign,
      },
      inspectedBy: {
        name: inspectedByName,
        title: inspectedByTitle,
        date,
        dataUrl: inspectedBySign,
      },
      approvedBy: {
        name: approvedByName,
        title: approvedByTitle,
        date,
        dataUrl: approvedBySign,
      },
      syncedToSheets: initialReport?.syncedToSheets || false,
      lastUpdated: new Date().toLocaleString('id-ID'),
    };

    onSave(updatedReport);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-bold text-base">
                {isEditing ? `Edit Laporan Harian (${reportNumber})` : 'Buat Laporan Harian Baru (Daily Report)'}
              </h3>
              <p className="text-xs text-slate-400">
                Lengkapi data teknis, progres pekerjaan, log tenaga kerja, dan foto dokumentasi lapangan
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Navigation Buttons */}
          <div className="px-6 pt-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1 overflow-x-auto shrink-0">
            {[
              { id: 'info', label: '1. Info & Proyek', icon: Briefcase },
              { id: 'work', label: `2. Pekerjaan (${workItems.length})`, icon: HardHat },
              { id: 'manpower', label: `3. Tenaga Kerja (${manpowerList.reduce((a, b) => a + (Number(b.count) || 0), 0)})`, icon: Users },
              { id: 'materials', label: `4. Material & Alat (${materials.length + equipment.length})`, icon: Boxes },
              { id: 'issues', label: `5. Kendala (${issues.length})`, icon: AlertTriangle },
              { id: 'photos', label: `6. Foto Lapangan (${photos.length})`, icon: ImageIcon },
              { id: 'signatures', label: '7. Tanda Tangan', icon: PenTool },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCurrentTab(tab.id as any)}
                  className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                    currentTab === tab.id
                      ? 'border-sky-600 text-sky-700 bg-white rounded-t-lg'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* TAB 1: INFO & PROYEK */}
            {currentTab === 'info' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Laporan:</label>
                    <input
                      type="text"
                      required
                      value={reportNumber}
                      onChange={(e) => setReportNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Kegiatan:</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Status Laporan:</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ReportStatus)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                    >
                      <option value="Draft">Draft (Belum Diajukan)</option>
                      <option value="Diajukan">Diajukan ke Pengawas</option>
                      <option value="Disetujui">Disetujui (Approved)</option>
                      <option value="Revisi">Perlu Revisi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pekerjaan:</label>
                    <input
                      type="text"
                      required
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Contoh: Pekerjaan Pengecoran / Renovasi..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">No. WO (Work Order):</label>
                    <input
                      type="text"
                      value={projectCode}
                      onChange={(e) => setProjectCode(e.target.value)}
                      placeholder="Contoh: WO-2026-001 / PRJ-001"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Kontraktor Pelaksana:</label>
                    <input
                      type="text"
                      value={contractor}
                      onChange={(e) => setContractor(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Pemilik Proyek / Klien (Owner):</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lokasi Proyek Lapangan:</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Alamat lengkap lokasi / zona proyek..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Kondisi Cuaca Hari Ini:</label>
                    <select
                      value={weather}
                      onChange={(e) => setWeather(e.target.value as WeatherCondition)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                    >
                      <option value="Cerah">Cerah (Panas)</option>
                      <option value="Cerah Berawan">Cerah Berawan</option>
                      <option value="Berawan">Berawan / Mendung</option>
                      <option value="Hujan Ringan">Hujan Ringan / Gerimis</option>
                      <option value="Hujan Deras">Hujan Deras</option>
                      <option value="Badai / Berangin">Badai / Berangin Kencang</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Kerja:</label>
                    <select
                      value={shift}
                      onChange={(e) => setShift(e.target.value as ShiftType)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                    >
                      <option value="Shift Pagi (08:00 - 16:00)">Shift Pagi (08:00 - 16:00)</option>
                      <option value="Full Day (08:00 - 17:00)">Full Day (08:00 - 17:00)</option>
                      <option value="Shift Siang (13:00 - 21:00)">Shift Siang (13:00 - 21:00)</option>
                      <option value="Shift Malam (20:00 - 05:00)">Shift Malam (20:00 - 05:00)</option>
                      <option value="Lembur / Overtime">Lembur / Overtime</option>
                    </select>
                  </div>
                </div>

                {/* AI Executive Summary & Notes */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-amber-500" />
                        <span>Rangkuman Eksekutif (Untuk WhatsApp & Direksi):</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAiSummary}
                        disabled={isGeneratingSummary}
                        className="px-2.5 py-1 text-[11px] font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors flex items-center gap-1"
                      >
                        {isGeneratingSummary ? (
                          <div className="w-3 h-3 border-2 border-amber-600/30 border-t-amber-800 rounded-full animate-spin" />
                        ) : (
                          <Sparkles size={12} />
                        )}
                        <span>Buat Ringkasan Otomatis via AI</span>
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={executiveSummary}
                      onChange={(e) => setExecutiveSummary(e.target.value)}
                      placeholder="Klik tombol AI di atas untuk membuat rangkuman otomatis atau ketik ringkasan di sini..."
                      className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">Catatan Umum / Instruksi Khusus Lapangan:</label>
                      <button
                        type="button"
                        onClick={handleAiPolishNotes}
                        disabled={isPolishingNotes || !generalNotes}
                        className="text-[11px] font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1 disabled:opacity-40"
                      >
                        <Sparkles size={12} /> Rapikan Bahasa Catatan via AI
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={generalNotes}
                      onChange={(e) => setGeneralNotes(e.target.value)}
                      placeholder="Catatan koordinasi untuk tim besok hari..."
                      className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PEKERJAAN & PROGRES */}
            {currentTab === 'work' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Daftar uraian pekerjaan harian beserta volume rencana, realisasi, dan persentase progres.
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setWorkItems((prev) => [
                        ...prev,
                        {
                          id: `wi-${Date.now()}`,
                          name: '',
                          unit: 'm²',
                          planVolume: 10,
                          actualVolume: 10,
                          progressPercent: 100,
                          status: 'Dalam Proses',
                        },
                      ])
                    }
                    className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Tambah Item Pekerjaan
                  </button>
                </div>

                <div className="space-y-3">
                  {workItems.map((item, idx) => (
                    <div key={item.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-slate-700 w-6">#{idx + 1}</span>
                        <input
                          type="text"
                          required
                          placeholder="Uraian nama pekerjaan (e.g. Pembesian Balok B2 Lantai 3)..."
                          value={item.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWorkItems((prev) => prev.map((w) => (w.id === item.id ? { ...w, name: val } : w)));
                          }}
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setWorkItems((prev) => prev.filter((w) => w.id !== item.id))}
                          className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Lokasi / Grid:</label>
                          <input
                            type="text"
                            placeholder="Grid A1-B3"
                            value={item.locationDetail || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWorkItems((prev) => prev.map((w) => (w.id === item.id ? { ...w, locationDetail: val } : w)));
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Satuan:</label>
                          <input
                            type="text"
                            placeholder="m³, m², Titik, kg"
                            value={item.unit}
                            onChange={(e) => {
                              const val = e.target.value;
                              setWorkItems((prev) => prev.map((w) => (w.id === item.id ? { ...w, unit: val } : w)));
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-center"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Vol. Rencana:</label>
                          <input
                            type="number"
                            step="any"
                            value={item.planVolume}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setWorkItems((prev) => prev.map((w) => (w.id === item.id ? { ...w, planVolume: val } : w)));
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-right"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Vol. Realisasi:</label>
                          <input
                            type="number"
                            step="any"
                            value={item.actualVolume}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setWorkItems((prev) => prev.map((w) => (w.id === item.id ? { ...w, actualVolume: val } : w)));
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-right font-bold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">Status:</label>
                          <select
                            value={item.status}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setWorkItems((prev) => prev.map((w) => (w.id === item.id ? { ...w, status: val } : w)));
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold"
                          >
                            <option value="Selesai">Selesai</option>
                            <option value="Dalam Proses">Dalam Proses</option>
                            <option value="Tertunda">Tertunda</option>
                            <option value="Belum Dimulai">Belum Dimulai</option>
                          </select>
                        </div>
                      </div>

                      {/* Progress Slider */}
                      <div className="flex items-center gap-3 pt-1">
                        <span className="text-[10px] font-semibold text-slate-500">Progres:</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={item.progressPercent}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setWorkItems((prev) => prev.map((w) => (w.id === item.id ? { ...w, progressPercent: val } : w)));
                          }}
                          className="flex-1 accent-sky-600 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-sky-700 font-mono w-12 text-right">
                          {item.progressPercent}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: TENAGA KERJA (MANPOWER) */}
            {currentTab === 'manpower' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-600">
                    Total: <strong className="text-slate-900">{manpowerList.reduce((a, b) => a + (Number(b.count) || 0), 0)} Orang</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setManpowerList((prev) => [
                        ...prev,
                        {
                          id: `mp-${Date.now()}`,
                          role: 'Tukang Kayu / Bekisting',
                          count: 4,
                          workHours: 8,
                          notes: '',
                        },
                      ])
                    }
                    className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Tambah Klasifikasi Pekerja
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Klasifikasi / Jabatan</th>
                        <th className="py-2.5 px-3 text-center w-28">Jumlah (Org)</th>
                        <th className="py-2.5 px-3 text-center w-28">Jam Kerja</th>
                        <th className="py-2.5 px-3">Tugas / Keterangan</th>
                        <th className="py-2.5 px-3 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {manpowerList.map((m) => (
                        <tr key={m.id}>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={m.role}
                              onChange={(e) => {
                                const val = e.target.value;
                                setManpowerList((prev) => prev.map((item) => (item.id === m.id ? { ...item, role: val } : item)));
                              }}
                              className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={m.count}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setManpowerList((prev) => prev.map((item) => (item.id === m.id ? { ...item, count: val } : item)));
                              }}
                              className="w-full px-2.5 py-1 text-xs text-center font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              max="24"
                              value={m.workHours}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 8;
                                setManpowerList((prev) => prev.map((item) => (item.id === m.id ? { ...item, workHours: val } : item)));
                              }}
                              className="w-full px-2.5 py-1 text-xs text-center bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              placeholder="Tugas spesifik..."
                              value={m.notes || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setManpowerList((prev) => prev.map((item) => (item.id === m.id ? { ...item, notes: val } : item)));
                              }}
                              className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setManpowerList((prev) => prev.filter((item) => item.id !== m.id))}
                              className="p-1 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: MATERIAL & ALAT */}
            {currentTab === 'materials' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Log Material</h4>
                    <button
                      type="button"
                      onClick={() =>
                        setMaterials((prev) => [
                          ...prev,
                          {
                            id: `mat-${Date.now()}`,
                            name: '',
                            receivedQty: 0,
                            usedQty: 0,
                            unit: 'Zak',
                            notes: '',
                          },
                        ])
                      }
                      className="px-3 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus size={13} /> Tambah Material
                    </button>
                  </div>

                  <div className="space-y-2">
                    {materials.map((mat) => (
                      <div key={mat.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs">
                        <input
                          type="text"
                          placeholder="Nama Material (e.g. Semen Gresik 50kg)..."
                          value={mat.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMaterials((prev) => prev.map((m) => (m.id === mat.id ? { ...m, name: val } : m)));
                          }}
                          className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-medium"
                        />
                        <div className="w-24">
                          <input
                            type="number"
                            placeholder="Diterima"
                            value={mat.receivedQty}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setMaterials((prev) => prev.map((m) => (m.id === mat.id ? { ...m, receivedQty: val } : m)));
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-center"
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            placeholder="Dipakai"
                            value={mat.usedQty}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setMaterials((prev) => prev.map((m) => (m.id === mat.id ? { ...m, usedQty: val } : m)));
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold"
                          />
                        </div>
                        <div className="w-20">
                          <input
                            type="text"
                            placeholder="Satuan"
                            value={mat.unit}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMaterials((prev) => prev.map((m) => (m.id === mat.id ? { ...m, unit: val } : m)));
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-mono"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setMaterials((prev) => prev.filter((m) => m.id !== mat.id))}
                          className="p-1 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Log Alat Berat & Mesin</h4>
                    <button
                      type="button"
                      onClick={() =>
                        setEquipment((prev) => [
                          ...prev,
                          {
                            id: `eq-${Date.now()}`,
                            name: '',
                            totalUnits: 1,
                            operatingHours: 8,
                            standbyHours: 0,
                            breakdownHours: 0,
                            status: 'Baik',
                          },
                        ])
                      }
                      className="px-3 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus size={13} /> Tambah Alat
                    </button>
                  </div>

                  <div className="space-y-2">
                    {equipment.map((eq) => (
                      <div key={eq.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs">
                        <input
                          type="text"
                          placeholder="Nama Alat (e.g. Excavator Komatsu PC200)..."
                          value={eq.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEquipment((prev) => prev.map((item) => (item.id === eq.id ? { ...item, name: val } : item)));
                          }}
                          className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-medium"
                        />
                        <div className="w-24">
                          <input
                            type="number"
                            placeholder="Jam Kerja"
                            value={eq.operatingHours}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setEquipment((prev) => prev.map((item) => (item.id === eq.id ? { ...item, operatingHours: val } : item)));
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-center"
                          />
                        </div>
                        <div className="w-24">
                          <select
                            value={eq.status}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setEquipment((prev) => prev.map((item) => (item.id === eq.id ? { ...item, status: val } : item)));
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg"
                          >
                            <option value="Baik">Baik</option>
                            <option value="Standby">Standby</option>
                            <option value="Perbaikan">Perbaikan</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEquipment((prev) => prev.filter((item) => item.id !== eq.id))}
                          className="p-1 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: KENDALA & TINDAKAN */}
            {currentTab === 'issues' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Catat setiap hambatan cuaca, material, teknis, atau K3 beserta tindakan penyelesaiannya.
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setIssues((prev) => [
                        ...prev,
                        {
                          id: `iss-${Date.now()}`,
                          category: 'Cuaca',
                          description: '',
                          impactHours: 1,
                          actionTaken: '',
                          status: 'Dalam Penanganan',
                        },
                      ])
                    }
                    className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Catat Kendala Baru
                  </button>
                </div>

                <div className="space-y-3">
                  {issues.map((iss) => (
                    <div key={iss.id} className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <select
                          value={iss.category}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setIssues((prev) => prev.map((item) => (item.id === iss.id ? { ...item, category: val } : item)));
                          }}
                          className="px-2.5 py-1 text-xs bg-white border border-amber-300 rounded-lg font-bold text-amber-950"
                        >
                          <option value="Cuaca">Cuaca (Hujan/Badai)</option>
                          <option value="Material">Keterlambatan Material</option>
                          <option value="Alat">Kerusakan Alat Berat</option>
                          <option value="Tenaga Kerja">Tenaga Kerja</option>
                          <option value="K3 / HSE">K3 / Keselamatan Kerja</option>
                          <option value="Teknis / Desain">Revisi Gambar / Teknis</option>
                          <option value="Lainnya">Lain-lain</option>
                        </select>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">Dampak:</span>
                          <input
                            type="number"
                            step="0.5"
                            value={iss.impactHours || 0}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setIssues((prev) => prev.map((item) => (item.id === iss.id ? { ...item, impactHours: val } : item)));
                            }}
                            className="w-16 px-2 py-1 text-xs text-center bg-white border border-amber-200 rounded-lg font-mono"
                          />
                          <span className="text-[11px] text-slate-500">Jam</span>
                        </div>

                        <select
                          value={iss.status}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setIssues((prev) => prev.map((item) => (item.id === iss.id ? { ...item, status: val } : item)));
                          }}
                          className="px-2.5 py-1 text-xs bg-white border border-amber-300 rounded-lg font-semibold"
                        >
                          <option value="Selesai">Terselesaikan</option>
                          <option value="Dalam Penanganan">Dalam Penanganan</option>
                          <option value="Butuh Keputusan">Butuh Keputusan Manajemen</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => setIssues((prev) => prev.filter((item) => item.id !== iss.id))}
                          className="p-1 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">Uraian Masalah / Hambatan Lapangan:</label>
                        <input
                          type="text"
                          required
                          placeholder="Jelaskan kendala yang dialami secara singkat dan jelas..."
                          value={iss.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setIssues((prev) => prev.map((item) => (item.id === iss.id ? { ...item, description: val } : item)));
                          }}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-amber-200 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-600 mb-0.5">Tindakan / Solusi yang Diambil:</label>
                        <input
                          type="text"
                          required
                          placeholder="Tindakan mitigasi atau penyelesaian yang sudah/akan dilakukan..."
                          value={iss.actionTaken}
                          onChange={(e) => {
                            const val = e.target.value;
                            setIssues((prev) => prev.map((item) => (item.id === iss.id ? { ...item, actionTaken: val } : item)));
                          }}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-amber-200 rounded-lg font-medium text-emerald-900"
                        />
                      </div>
                    </div>
                  ))}

                  {issues.length === 0 && (
                    <p className="text-xs text-slate-400 italic p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      Tidak ada kendala yang dicatat. Klik "Catat Kendala Baru" jika ada insiden atau hambatan kerja.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: FOTO DOKUMENTASI (MANDATORY REQUIREMENT) */}
            {currentTab === 'photos' && (
              <div className="space-y-4">
                <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-sky-950 flex items-center gap-1.5 mb-1">
                      <Camera size={16} /> Dokumentasi Foto Lapangan (Otomatis Dicetak di PDF)
                    </h4>
                    <p className="text-[11px] text-sky-800">
                      Unggah foto pekerjaan, labeli dengan keterangan jelas, dan pilih kategori teknis.
                    </p>
                  </div>

                  <label className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition-colors flex items-center gap-1.5 shrink-0">
                    <Upload size={14} />
                    <span>Pilih / Ambil Foto</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {photos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2 flex flex-col justify-between"
                      >
                        <div className="relative h-44 bg-slate-100 rounded-lg overflow-hidden group">
                          <img src={photo.dataUrl} alt={photo.caption} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(photo.id)}
                            className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition-colors"
                            title="Hapus foto ini"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">Kategori Foto:</label>
                            <select
                              value={photo.category}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, category: val } : p)));
                              }}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                            >
                              <option value="Pekerjaan Struktur">Pekerjaan Struktur</option>
                              <option value="Arsitektur & Finishing">Arsitektur & Finishing</option>
                              <option value="MEP & Utilitas">MEP & Utilitas</option>
                              <option value="K3 / Safety">K3 / Safety Lapangan</option>
                              <option value="Material Masuk">Material Masuk</option>
                              <option value="Kendala Lapangan">Kendala Lapangan</option>
                              <option value="Inspeksi & QC">Inspeksi & QC</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">Keterangan / Caption Foto:</label>
                            <input
                              type="text"
                              value={photo.caption}
                              placeholder="Uraian kegiatan pada foto..."
                              onChange={(e) => {
                                const val = e.target.value;
                                setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, caption: val } : p)));
                              }}
                              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                            <span>{photo.timestamp}</span>
                            <span className="truncate max-w-[120px]">{photo.location}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50 flex flex-col items-center">
                    <Camera size={36} className="text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-slate-700">Belum ada foto dokumentasi yang diunggah</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mt-1 mb-4">
                      Foto dokumentasi sangat penting untuk bukti visual kemajuan pekerjaan fisik di lapangan pada lembar PDF.
                    </p>
                    <label className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition-colors flex items-center gap-1.5">
                      <Upload size={14} />
                      <span>Unggah Foto Sekarang</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* TAB 7: TANDA TANGAN DIGITAL */}
            {currentTab === 'signatures' && (
              <div className="space-y-4">
                <span className="text-xs text-slate-500 block">
                  Bubuhkan tanda tangan digital langsung di layar untuk dicetak pada lembar pengesahan PDF.
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Pelapor */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                        1. Dibuat Oleh (Pelapor)
                      </span>
                      <div className="space-y-2 mb-3">
                        <input
                          type="text"
                          placeholder="Nama Lengkap"
                          value={preparedByName}
                          onChange={(e) => setPreparedByName(e.target.value)}
                          className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg font-semibold"
                        />
                        <input
                          type="text"
                          placeholder="Jabatan"
                          value={preparedByTitle}
                          onChange={(e) => setPreparedByTitle(e.target.value)}
                          className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-500"
                        />
                      </div>

                      {/* Signature canvas preview */}
                      <div className="w-full h-24 bg-white border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-2 mb-2">
                        {preparedBySign ? (
                          <img src={preparedBySign} alt="Sign" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Belum ada tanda tangan</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveSigner('prepared')}
                      className="w-full py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <PenTool size={13} />
                      <span>{preparedBySign ? 'Ubah Tanda Tangan' : 'Tanda Tangan di Layar'}</span>
                    </button>
                  </div>

                  {/* Pengawas */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                        2. Diperiksa (Konsultan MK)
                      </span>
                      <div className="space-y-2 mb-3">
                        <input
                          type="text"
                          placeholder="Nama Lengkap"
                          value={inspectedByName}
                          onChange={(e) => setInspectedByName(e.target.value)}
                          className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg font-semibold"
                        />
                        <input
                          type="text"
                          placeholder="Jabatan"
                          value={inspectedByTitle}
                          onChange={(e) => setInspectedByTitle(e.target.value)}
                          className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-500"
                        />
                      </div>

                      <div className="w-full h-24 bg-white border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-2 mb-2">
                        {inspectedBySign ? (
                          <img src={inspectedBySign} alt="Sign" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Belum ada tanda tangan</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveSigner('inspected')}
                      className="w-full py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <PenTool size={13} />
                      <span>{inspectedBySign ? 'Ubah Tanda Tangan' : 'Tanda Tangan di Layar'}</span>
                    </button>
                  </div>

                  {/* Disetujui */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                        3. Disetujui (Project Manager / Owner)
                      </span>
                      <div className="space-y-2 mb-3">
                        <input
                          type="text"
                          placeholder="Nama Lengkap"
                          value={approvedByName}
                          onChange={(e) => setApprovedByName(e.target.value)}
                          className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg font-semibold"
                        />
                        <input
                          type="text"
                          placeholder="Jabatan"
                          value={approvedByTitle}
                          onChange={(e) => setApprovedByTitle(e.target.value)}
                          className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-500"
                        />
                      </div>

                      <div className="w-full h-24 bg-white border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-2 mb-2">
                        {approvedBySign ? (
                          <img src={approvedBySign} alt="Sign" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Belum ada tanda tangan</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveSigner('approved')}
                      className="w-full py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <PenTool size={13} />
                      <span>{approvedBySign ? 'Ubah Tanda Tangan' : 'Tanda Tangan di Layar'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                onClick={() => setStatus('Draft')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Simpan Sebagai Draft
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <Save size={16} />
                <span>{isEditing ? 'Simpan Perubahan Laporan' : 'Terbitkan Laporan Harian'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Signature Canvas Pad Modal */}
      {activeSigner && (
        <SignaturePad
          title={`Tanda Tangan Digital: ${
            activeSigner === 'prepared' ? 'Pelapor / Pengawas' : activeSigner === 'inspected' ? 'Konsultan MK' : 'Project Manager'
          }`}
          initialSignature={
            activeSigner === 'prepared' ? preparedBySign : activeSigner === 'inspected' ? inspectedBySign : approvedBySign
          }
          onSave={(dataUrl) => {
            if (activeSigner === 'prepared') setPreparedBySign(dataUrl);
            if (activeSigner === 'inspected') setInspectedBySign(dataUrl);
            if (activeSigner === 'approved') setApprovedBySign(dataUrl);
            setActiveSigner(null);
          }}
          onClose={() => setActiveSigner(null)}
        />
      )}
    </>
  );
};
