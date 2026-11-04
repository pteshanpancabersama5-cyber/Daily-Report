export type WeatherCondition = 'Cerah' | 'Cerah Berawan' | 'Berawan' | 'Hujan Ringan' | 'Hujan Deras' | 'Badai / Berangin';

export type ShiftType = 'Shift Pagi (08:00 - 16:00)' | 'Shift Siang (13:00 - 21:00)' | 'Shift Malam (20:00 - 05:00)' | 'Full Day (08:00 - 17:00)' | 'Lembur / Overtime';

export type ReportStatus = 'Draft' | 'Diajukan' | 'Disetujui' | 'Revisi';

export interface Manpower {
  id: string;
  role: string;
  count: number;
  workHours: number;
  notes?: string;
}

export interface WorkItem {
  id: string;
  name: string;
  unit: string;
  planVolume: number;
  actualVolume: number;
  progressPercent: number; // e.g. 75%
  status: 'Selesai' | 'Dalam Proses' | 'Tertunda' | 'Belum Dimulai';
  locationDetail?: string;
}

export interface MaterialItem {
  id: string;
  name: string;
  receivedQty: number;
  usedQty: number;
  unit: string;
  notes?: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  totalUnits: number;
  operatingHours: number;
  standbyHours: number;
  breakdownHours: number;
  status: 'Baik' | 'Perbaikan' | 'Standby';
}

export interface IssueItem {
  id: string;
  category: 'Cuaca' | 'Material' | 'Alat' | 'Tenaga Kerja' | 'K3 / HSE' | 'Teknis / Desain' | 'Lainnya';
  description: string;
  impactHours?: number;
  actionTaken: string;
  status: 'Selesai' | 'Dalam Penanganan' | 'Butuh Keputusan';
}

export interface PhotoItem {
  id: string;
  dataUrl: string;
  caption: string;
  category: 'Pekerjaan Struktur' | 'Arsitektur & Finishing' | 'MEP & Utilitas' | 'K3 / Safety' | 'Material Masuk' | 'Kendala Lapangan' | 'Inspeksi & QC';
  timestamp: string;
  location?: string;
}

export interface SignatureData {
  name: string;
  title: string;
  date: string;
  dataUrl?: string; // signature canvas base64
}

export interface DailyReport {
  id: string;
  reportNumber: string; // e.g. "RPT/2026/11/04-01"
  date: string; // YYYY-MM-DD
  projectName: string;
  projectCode: string;
  contractor: string;
  clientName: string;
  location: string;
  weather: WeatherCondition;
  shift: ShiftType;
  status: ReportStatus;
  
  // Sections
  manpowerList: Manpower[];
  workItems: WorkItem[];
  materials: MaterialItem[];
  equipment: EquipmentItem[];
  issues: IssueItem[];
  photos: PhotoItem[];
  
  // Summary
  generalNotes: string;
  executiveSummary?: string;
  safetyNotes?: string;
  
  // Signatures
  preparedBy: SignatureData;
  inspectedBy: SignatureData;
  approvedBy: SignatureData;
  
  // Sync metadata
  syncedToSheets?: boolean;
  sheetsRowIndex?: number;
  sheetsUrl?: string;
  lastUpdated: string;
}

export interface AppSettings {
  companyName: string;
  companyAddress: string;
  companyLogoUrl?: string;
  defaultContractor: string;
  defaultClient: string;
  supervisorName: string;
  supervisorPhone: string;
  managerEmail: string;
  spreadsheetId?: string;
  spreadsheetName?: string;
}
