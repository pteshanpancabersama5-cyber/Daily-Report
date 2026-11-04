import { DailyReport, AppSettings } from '../types/report';

// Helper to generate crisp SVG data URLs for sample project photos
function createSamplePhotoDataUrl(title: string, subtitle: string, badge: string, bgColor: string, accentColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
    <defs>
      <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgColor}" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="640" height="420" fill="url(#g1)" />
    <rect width="640" height="420" fill="url(#grid)" />
    
    <!-- Blueprint / construction lines -->
    <circle cx="320" cy="200" r="140" fill="none" stroke="${accentColor}" stroke-width="2" stroke-dasharray="6,4" opacity="0.4"/>
    <line x1="80" y1="310" x2="560" y2="310" stroke="${accentColor}" stroke-width="3" opacity="0.6"/>
    
    <!-- Building / crane silhouette -->
    <path d="M 120 310 L 120 140 L 220 140 L 220 310 Z" fill="rgba(255,255,255,0.1)"/>
    <path d="M 230 310 L 230 100 L 360 100 L 360 310 Z" fill="rgba(255,255,255,0.15)"/>
    <path d="M 370 310 L 370 170 L 480 170 L 480 310 Z" fill="rgba(255,255,255,0.08)"/>
    
    <!-- Crane mast -->
    <line x1="295" y1="100" x2="295" y2="40" stroke="#f59e0b" stroke-width="3"/>
    <line x1="250" y1="50" x2="420" y2="50" stroke="#f59e0b" stroke-width="3"/>
    <line x1="400" y1="50" x2="400" y2="110" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,3"/>

    <!-- Badge -->
    <rect x="24" y="24" width="160" height="30" rx="6" fill="${accentColor}" />
    <text x="104" y="44" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">${badge}</text>

    <!-- Watermark / Timestamp info box -->
    <rect x="24" y="320" width="592" height="76" rx="8" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.2)"/>
    <text x="44" y="348" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">${title}</text>
    <text x="44" y="372" fill="#94a3b8" font-family="sans-serif" font-size="12">${subtitle}</text>
    <text x="600" y="372" fill="${accentColor}" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="end">TERVERIFIKASI LAPANGAN</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Sample Signature Data URL
const sampleSignaturePelapor = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">
    <path d="M 20 50 Q 50 10 70 40 T 110 30 T 150 55 T 180 35" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round"/>
    <path d="M 60 45 L 140 45" fill="none" stroke="#0284c7" stroke-width="2"/>
    <text x="100" y="70" fill="#64748b" font-size="10" font-family="sans-serif" text-anchor="middle">Arya Wicaksono, ST</text>
  </svg>`
)}`;

const sampleSignaturePengawas = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">
    <path d="M 25 45 Q 60 20 90 50 T 130 25 T 175 40" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round"/>
    <circle cx="100" cy="35" r="4" fill="#16a34a"/>
    <text x="100" y="70" fill="#64748b" font-size="10" font-family="sans-serif" text-anchor="middle">Ir. Budi Santoso</text>
  </svg>`
)}`;

export const initialSettings: AppSettings = {
  companyName: 'PT. Eshan Panca Bersama',
  companyAddress: 'Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan, DKI Jakarta 12190',
  defaultContractor: 'PT. Eshan Panca Bersama - Divisi Konstruksi & Sipil',
  defaultClient: 'PT. Metropolitan Urban Development Tbk',
  supervisorName: 'Arya Wicaksono, ST',
  supervisorPhone: '+6281234567890',
  managerEmail: 'pt.eshanpancabersama5@gmail.com',
};

export const sampleReports: DailyReport[] = [
  {
    id: 'rpt-001',
    reportNumber: 'RPT/EPB/2026/11/04-01',
    date: '2026-11-04',
    projectName: 'Pembangunan Gedung Kantor Menara Mandiri Tower B',
    projectCode: 'PRJ-MMT-2026',
    contractor: 'PT. Eshan Panca Bersama',
    clientName: 'PT. Metropolitan Urban Development Tbk',
    location: 'Kawasan SCBD Lot 11, Kebayoran Baru, Jakarta Selatan',
    weather: 'Cerah Berawan',
    shift: 'Shift Pagi (08:00 - 16:00)',
    status: 'Disetujui',
    
    manpowerList: [
      { id: 'mp-1', role: 'Site Manager / Pengawas Utama', count: 1, workHours: 8, notes: 'Koordinasi umum & K3' },
      { id: 'mp-2', role: 'Site Engineer (Struktur)', count: 2, workHours: 8, notes: 'Monitoring elevasi & pembesian' },
      { id: 'mp-3', role: 'Safety Officer / HSE', count: 1, workHours: 8, notes: 'Toolbox meeting & inspeksi APD' },
      { id: 'mp-4', role: 'Mandor Sipil', count: 2, workHours: 8, notes: 'Supervisi tim tukang cor & besi' },
      { id: 'mp-5', role: 'Tukang Besi & Pembesian', count: 12, workHours: 8, notes: 'Fabrikasi rebar kolom lantai 4' },
      { id: 'mp-6', role: 'Tukang Cor & Bekisting', count: 14, workHours: 8, notes: 'Pengecoran plat lantai 3 zona timur' },
      { id: 'mp-7', role: 'Operator Alat Berat (Tower Crane & Pump)', count: 3, workHours: 8, notes: 'Handling bucket & pipa cor' },
      { id: 'mp-8', role: 'Pekerja Umum / Helper', count: 10, workHours: 8, notes: 'Pembersihan area & curing beton' },
    ],

    workItems: [
      {
        id: 'wi-1',
        name: 'Pengecoran Beton Ready Mix Mutu K-350 Plat Lantai 3 Zona Timur',
        unit: 'm³',
        planVolume: 85,
        actualVolume: 85,
        progressPercent: 100,
        status: 'Selesai',
        locationDetail: 'Lantai 3 Grid B4 - E8',
      },
      {
        id: 'wi-2',
        name: 'Perakitan & Pembesian Tulangan Kolom K1 & K2 Lantai 4',
        unit: 'kg',
        planVolume: 3500,
        actualVolume: 3200,
        progressPercent: 91,
        status: 'Dalam Proses',
        locationDetail: 'Lantai 4 Grid A1 - D4',
      },
      {
        id: 'wi-3',
        name: 'Pemasangan Bekisting Balok Induk B1 & Plat Kantilever',
        unit: 'm²',
        planVolume: 120,
        actualVolume: 95,
        progressPercent: 79,
        status: 'Dalam Proses',
        locationDetail: 'Lantai 4 Sisi Barat',
      },
      {
        id: 'wi-4',
        name: 'Inspeksi & Tes Slump Beton Sebelum Penuangan',
        unit: 'Titik',
        planVolume: 10,
        actualVolume: 10,
        progressPercent: 100,
        status: 'Selesai',
        locationDetail: 'Sampling Truck Mixer 1 s/d 10 (Slump: 12 ± 2 cm)',
      },
      {
        id: 'wi-5',
        name: 'Pekerjaan Curing & Penutupan Karung Basah Beton Lantai 2',
        unit: 'm²',
        planVolume: 250,
        actualVolume: 250,
        progressPercent: 100,
        status: 'Selesai',
        locationDetail: 'Lantai 2 Full Area',
      },
    ],

    materials: [
      { id: 'mat-1', name: 'Beton Ready Mix K-350 (Holcim/Indocement)', receivedQty: 85, usedQty: 85, unit: 'm³', notes: 'Surat jalan No. RM-8821 lengkap' },
      { id: 'mat-2', name: 'Besi Beton Ulir D19 (Krakatau Steel)', receivedQty: 150, usedQty: 95, unit: 'Batang', notes: 'Sertifikat mill terlampir' },
      { id: 'mat-3', name: 'Kawat Bendrat Tali Besi', receivedQty: 10, usedQty: 6, unit: 'Roll', notes: 'Untuk ikatan tulangan kolom' },
      { id: 'mat-4', name: 'Multiplek Phenolic Film 18mm', receivedQty: 40, usedQty: 25, unit: 'Lembar', notes: 'Untuk bekisting balok B1' },
    ],

    equipment: [
      { id: 'eq-1', name: 'Concrete Pump Truck (IHI 36M)', totalUnits: 1, operatingHours: 6.5, standbyHours: 1.5, breakdownHours: 0, status: 'Baik' },
      { id: 'eq-2', name: 'Tower Crane Zoomlion TC6013', totalUnits: 1, operatingHours: 7, standbyHours: 1, breakdownHours: 0, status: 'Baik' },
      { id: 'eq-3', name: 'Concrete Vibrator Elektrik', totalUnits: 4, operatingHours: 6, standbyHours: 2, breakdownHours: 0, status: 'Baik' },
      { id: 'eq-4', name: 'Genset Silent 150 kVA (Denyo)', totalUnits: 1, operatingHours: 8, standbyHours: 0, breakdownHours: 0, status: 'Baik' },
    ],

    issues: [
      {
        id: 'iss-1',
        category: 'Material',
        description: 'Truk mixer beton ke-4 sempat terlambat 35 menit akibat kepadatan lalu lintas di Jl. Gatot Subroto.',
        impactHours: 0.5,
        actionTaken: 'Mengatur jeda waktu keberangkatan dari batching plant dan mengalihkan via rute alternatif Semanggi.',
        status: 'Selesai',
      },
      {
        id: 'iss-2',
        category: 'K3 / HSE',
        description: 'Dua orang helper kedapatan tidak mengenakan safety glasses saat pembersihan serpihan kawat.',
        impactHours: 0,
        actionTaken: 'Diberikan teguran lisan, pengarahan langsung oleh Safety Officer, dan dibagikan kacamata pelindung baru.',
        status: 'Selesai',
      },
    ],

    photos: [
      {
        id: 'ph-1',
        dataUrl: createSamplePhotoDataUrl('Pengecoran Plat Lantai 3', 'Grid B4-E8 • Volume 85 m³ selesai tepat waktu', 'PEKERJAAN STRUKTUR', '#1e293b', '#0284c7'),
        caption: 'Pekerjaan pengecoran beton ready mix mutu K-350 plat lantai 3 zona timur menggunakan concrete pump boom 36m.',
        category: 'Pekerjaan Struktur',
        timestamp: '04 Nov 2026 10:45 WIB',
        location: 'Lantai 3 Grid B4-E8',
      },
      {
        id: 'ph-2',
        dataUrl: createSamplePhotoDataUrl('Pemeriksaan Slump & Sampling Silinder', 'Uji slump rata-rata 12 cm • Sampel 6 benda uji', 'INSPEKSI & QC', '#0f766e', '#14b8a6'),
        caption: 'Pengambilan sampel silinder beton dan tes slump oleh tim QC didampingi Konsultan Manajemen Konstruksi.',
        category: 'Inspeksi & QC',
        timestamp: '04 Nov 2026 09:15 WIB',
        location: 'Area Receiving Gate 1',
      },
      {
        id: 'ph-3',
        dataUrl: createSamplePhotoDataUrl('Pemasangan Tulangan Kolom Lantai 4', 'Fabrikasi rebar ulir D19 • Selimut beton 40mm', 'PEKERJAAN STRUKTUR', '#334155', '#38bdf8'),
        caption: 'Tim pembesian menyelesaikan perakitan tulangan kolom K1 dan pemasangan beton decking selimut beton.',
        category: 'Pekerjaan Struktur',
        timestamp: '04 Nov 2026 14:20 WIB',
        location: 'Lantai 4 Grid C2',
      },
      {
        id: 'ph-4',
        dataUrl: createSamplePhotoDataUrl('Daily Safety Toolbox Meeting', 'Briefing K3 pagi • Pemeriksaan kelayakan APD', 'K3 / SAFETY', '#854d0e', '#f59e0b'),
        caption: 'Pelaksanaan safety talk pagi jam 07:45 bersama seluruh personil lapangan sebelum memulai aktivitas kerja.',
        category: 'K3 / Safety',
        timestamp: '04 Nov 2026 07:45 WIB',
        location: 'Lapangan Apel Proyek',
      },
    ],

    generalNotes: 'Pekerjaan struktur pengecoran plat lantai 3 zona timur telah diselesaikan 100% dengan hasil slump memenuhi spesifikasi teknis. Besok tanggal 05 Nov 2026 dijadwalkan pembongkaran bekisting balok lantai 2 dan persiapan pengecoran kolom lantai 4.',
    executiveSummary: 'Pelaksanaan pekerjaan hari ini berhasil menuntaskan pengecoran plat lantai 3 zona timur seluas 85 m³ dengan capaian 100%. Tim pembesian melanjutkan kolom lantai 4 dengan progres mencapai 91%. Seluruh parameter keselamatan kerja (K3) dan pengujian mutu beton terpenuhi tanpa insiden kecelakaan (Zero Accident).',
    safetyNotes: 'Pekerjaan berlangsung dengan Zero Accident. Seluruh pekerja memakai rompi reflektif, helm proyek, dan sepatu safety. Jalur evakuasi dan rambu K3 terpelihara bersih.',

    preparedBy: {
      name: 'Arya Wicaksono, ST',
      title: 'Site Supervisor / Pelapor',
      date: '2026-11-04',
      dataUrl: sampleSignaturePelapor,
    },
    inspectedBy: {
      name: 'Ir. Budi Santoso',
      title: 'Konsultan Pengawas (MK)',
      date: '2026-11-04',
      dataUrl: sampleSignaturePengawas,
    },
    approvedBy: {
      name: 'Drs. Hendra Gunawan, MT',
      title: 'Project Manager (Owner)',
      date: '2026-11-04',
      dataUrl: '',
    },

    syncedToSheets: true,
    lastUpdated: '2026-11-04 17:30',
  },
  {
    id: 'rpt-002',
    reportNumber: 'RPT/EPB/2026/11/03-01',
    date: '2026-11-03',
    projectName: 'Pembangunan Gedung Kantor Menara Mandiri Tower B',
    projectCode: 'PRJ-MMT-2026',
    contractor: 'PT. Eshan Panca Bersama',
    clientName: 'PT. Metropolitan Urban Development Tbk',
    location: 'Kawasan SCBD Lot 11, Kebayoran Baru, Jakarta Selatan',
    weather: 'Hujan Ringan',
    shift: 'Full Day (08:00 - 17:00)',
    status: 'Disetujui',
    
    manpowerList: [
      { id: 'mp-201', role: 'Site Engineer', count: 2, workHours: 8, notes: 'Opname lapangan & level' },
      { id: 'mp-202', role: 'Mandor Bekisting', count: 2, workHours: 8, notes: 'Supervisi elevasi bekisting' },
      { id: 'mp-203', role: 'Tukang Kayu / Bekisting', count: 16, workHours: 8, notes: 'Scaffolding & bekisting plat lantai 3' },
      { id: 'mp-204', role: 'Tukang Besi', count: 10, workHours: 8, notes: 'Anyam wiremesh M8 plat lantai 3' },
      { id: 'mp-205', role: 'Helper / Kenek', count: 8, workHours: 8, notes: 'Langsir material kayu & kaso' },
    ],

    workItems: [
      {
        id: 'wi-201',
        name: 'Pemasangan Scaffolding Main Frame & U-Head Lantai 3',
        unit: 'Set',
        planVolume: 180,
        actualVolume: 180,
        progressPercent: 100,
        status: 'Selesai',
        locationDetail: 'Zona Barat & Tengah',
      },
      {
        id: 'wi-202',
        name: 'Pemasangan Wiremesh M8 Double Layer Plat Lantai 3',
        unit: 'Lembar',
        planVolume: 90,
        actualVolume: 85,
        progressPercent: 94,
        status: 'Dalam Proses',
        locationDetail: 'Grid B1 - E4',
      },
      {
        id: 'wi-203',
        name: 'Pembersihan Sampah dan Serbuk Kayu dengan Compressor',
        unit: 'm²',
        planVolume: 300,
        actualVolume: 300,
        progressPercent: 100,
        status: 'Selesai',
        locationDetail: 'Lantai 3 Zona Timur',
      },
    ],

    materials: [
      { id: 'mat-201', name: 'Wiremesh M8 (2.1 x 5.4m)', receivedQty: 100, usedQty: 85, unit: 'Lembar', notes: 'Boma Bisma Indra' },
      { id: 'mat-202', name: 'Kaso Kayu 5/7 Meranti', receivedQty: 300, usedQty: 220, unit: 'Batang', notes: 'Penyangga gelagar bekisting' },
    ],

    equipment: [
      { id: 'eq-201', name: 'Air Compressor 5 HP', totalUnits: 2, operatingHours: 4, standbyHours: 4, breakdownHours: 0, status: 'Baik' },
      { id: 'eq-202', name: 'Theodolite Total Station Topcon', totalUnits: 1, operatingHours: 5, standbyHours: 3, breakdownHours: 0, status: 'Baik' },
    ],

    issues: [
      {
        id: 'iss-201',
        category: 'Cuaca',
        description: 'Hujan rintik-rintik pada pukul 14:00 - 15:15 membuat pekerjaan di area terbuka sedikit melambat.',
        impactHours: 1.2,
        actionTaken: 'Pekerjaan dialihkan sementara ke perakitan rebar di bawah naungan terpal lantai dasar.',
        status: 'Selesai',
      },
    ],

    photos: [
      {
        id: 'ph-201',
        dataUrl: createSamplePhotoDataUrl('Pemasangan Shoring & Scaffolding', 'Penyangga bekisting plat lantai 3 kokoh terpasang', 'PEKERJAAN STRUKTUR', '#1e293b', '#0284c7'),
        caption: 'Pemasangan sistem perancah scaffolding heavy-duty untuk mendukung beban pengecoran plat lantai.',
        category: 'Pekerjaan Struktur',
        timestamp: '03 Nov 2026 11:30 WIB',
        location: 'Lantai 2 ke Lantai 3',
      },
      {
        id: 'ph-202',
        dataUrl: createSamplePhotoDataUrl('Inspeksi Elevasi Balok dengan Total Station', 'Toleransi elevasi ±2 mm terpenuhi', 'INSPEKSI & QC', '#0f766e', '#14b8a6'),
        caption: 'Pengecekan kelurusan dan level elevasi balok lantai 3 oleh tim surveyor.',
        category: 'Inspeksi & QC',
        timestamp: '03 Nov 2026 15:45 WIB',
        location: 'Lantai 3',
      },
    ],

    generalNotes: 'Persiapan pembesian dan bekisting plat lantai 3 telah siap 95%. Izin kerja pengecoran (Permit to Cast) telah ditandatangani Konsultan Pengawas.',
    executiveSummary: 'Persiapan akhir struktur plat lantai 3 zona timur telah selesai 95%. Kendala hujan ringan telah dimitigasi dengan pengalihan kerja indoor. Kesiapan pengecoran esok hari dipastikan 100%.',
    safetyNotes: 'Pemasangan safety net di sekeliling perimeter lantai 3 telah selesai.',

    preparedBy: {
      name: 'Arya Wicaksono, ST',
      title: 'Site Supervisor',
      date: '2026-11-03',
      dataUrl: sampleSignaturePelapor,
    },
    inspectedBy: {
      name: 'Ir. Budi Santoso',
      title: 'Konsultan Pengawas',
      date: '2026-11-03',
      dataUrl: sampleSignaturePengawas,
    },
    approvedBy: {
      name: 'Drs. Hendra Gunawan, MT',
      title: 'Project Manager',
      date: '2026-11-03',
    },

    syncedToSheets: true,
    lastUpdated: '2026-11-03 17:15',
  },
];
