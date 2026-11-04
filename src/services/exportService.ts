import { DailyReport } from '../types/report';

export type WATemplateType = 'lengkap' | 'ringkas' | 'kendala';

/**
 * Generates formatted WhatsApp text message with emojis and markdown bolding.
 */
export function generateWhatsAppMessage(
  report: DailyReport,
  template: WATemplateType = 'lengkap',
  sheetsUrl?: string
): string {
  const dateFormatted = new Date(report.date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const totalWorkers = report.manpowerList.reduce((acc, m) => acc + (Number(m.count) || 0), 0);

  if (template === 'ringkas') {
    return [
      `📋 *RINGKASAN LAPORAN HARIAN PROYEK*`,
      `🏢 *Proyek:* ${report.projectName}`,
      `📅 *Tanggal:* ${dateFormatted} (${report.shift})`,
      `📍 *Lokasi:* ${report.location}`,
      `🌤️ *Cuaca:* ${report.weather}`,
      `👷 *Tenaga Kerja:* ${totalWorkers} Orang`,
      ``,
      `📊 *Progres Utama:*`,
      ...report.workItems.slice(0, 5).map((w, i) => `• ${w.name}: *${w.progressPercent}%* (${w.status})`),
      ``,
      report.issues.length > 0 ? `⚠️ *Kendala:* ${report.issues[0].description} (Solusi: ${report.issues[0].actionTaken})` : `✅ *Kendala:* Nihil / Kondusif`,
      ``,
      report.generalNotes ? `📝 *Catatan:* ${report.generalNotes}` : '',
      sheetsUrl ? `🔗 *Data Spreadsheet:* ${sheetsUrl}` : '',
      `_Dilaporkan oleh: ${report.preparedBy?.name || 'Pengawas Lapangan'} - DailyReport Pro_`
    ].filter(Boolean).join('\n');
  }

  if (template === 'kendala') {
    return [
      `🚨 *LAPORAN KENDALA & K3 LAPANGAN*`,
      `🏢 *Proyek:* ${report.projectName}`,
      `📅 *Tanggal:* ${dateFormatted}`,
      `📍 *Lokasi:* ${report.location}`,
      `🌤️ *Cuaca Hari Ini:* ${report.weather}`,
      ``,
      `⚠️ *DAFTAR KENDALA & HAMBATAN:*`,
      ...(report.issues.length > 0
        ? report.issues.map((iss, idx) => 
            `${idx + 1}. *[${iss.category}]* ${iss.description}\n   ⏱️ Dampak Waktu: ${iss.impactHours || 0} Jam\n   💡 Tindakan/Solusi: ${iss.actionTaken}\n   📌 Status: *${iss.status}*`
          )
        : ['✅ Tidak ada kendala lapangan hari ini. Pekerjaan berjalan aman & lancar.']),
      ``,
      `📝 *Catatan Tambahan:* ${report.generalNotes || '-'}`,
      `_Pengawas: ${report.preparedBy?.name || 'Supervisor'} | No: ${report.reportNumber}_`
    ].join('\n');
  }

  // Format Lengkap (Default)
  const workItemsText = report.workItems.length > 0
    ? report.workItems.map((w, i) => `${i + 1}. *${w.name}*\n   - Target: ${w.planVolume} ${w.unit} | Real: *${w.actualVolume} ${w.unit}*\n   - Progres: *${w.progressPercent}%* [${w.status}]`).join('\n')
    : '- Tidak ada item pekerjaan tercatat -';

  const manpowerSummary = report.manpowerList.length > 0
    ? report.manpowerList.map(m => `• ${m.role}: *${m.count} Org* (${m.workHours} Jam)`).join('\n')
    : '- Data tenaga kerja nihil -';

  const issuesText = report.issues.length > 0
    ? report.issues.map((iss, i) => `${i + 1}. *[${iss.category}]* ${iss.description} → _Solusi: ${iss.actionTaken}_`).join('\n')
    : '✅ Nihil / Aman Terkendali';

  return [
    `🏗️ *LAPORAN HARIAN PROYEK (DAILY REPORT)*`,
    `📄 *No:* ${report.reportNumber}`,
    `🏢 *Proyek:* ${report.projectName} (${report.projectCode || '-'})`,
    `📅 *Tanggal:* ${dateFormatted}`,
    `📍 *Lokasi:* ${report.location}`,
    `🌤️ *Cuaca:* ${report.weather}`,
    `⏰ *Shift:* ${report.shift}`,
    `📌 *Status Laporan:* *${report.status}*`,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    `👷‍♂️ *TENAGA KERJA (Total: ${totalWorkers} Orang)*`,
    manpowerSummary,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    `🔨 *URAIAN PEKERJAAN & REALISASI*`,
    workItemsText,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    `⚠️ *KENDALA & SOLUSI*`,
    issuesText,
    ``,
    `━━━━━━━━━━━━━━━━━━`,
    `📸 *Dokumentasi:* ${report.photos.length} Foto Terlampir dalam PDF`,
    report.generalNotes ? `📝 *Catatan Pengawas:*\n${report.generalNotes}` : '',
    sheetsUrl ? `📊 *Google Sheets Sync:*\n${sheetsUrl}` : '',
    ``,
    `_Dibuat oleh: ${report.preparedBy?.name || 'Pengawas'} (${report.preparedBy?.title || 'Site Supervisor'})_`,
    `_Sistem DailyReport Pro_`
  ].filter(Boolean).join('\n');
}

/**
 * Creates a WhatsApp web or mobile deep link.
 */
export function createWhatsAppLink(phoneNumber: string, message: string): string {
  // Normalize phone number (e.g. replace leading 0 with 62 for Indonesia)
  let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '62' + cleanNumber.slice(1);
  }

  const encodedMessage = encodeURIComponent(message);
  if (cleanNumber) {
    return `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedMessage}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedMessage}`;
}

/**
 * Generates email subject and body for mailto or client send.
 */
export function generateEmailContent(report: DailyReport, sheetsUrl?: string) {
  const dateFormatted = new Date(report.date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const subject = `[DAILY REPORT] ${report.projectName} - ${report.reportNumber} (${dateFormatted})`;
  const body = generateWhatsAppMessage(report, 'lengkap', sheetsUrl);

  return { subject, body };
}

/**
 * Builds mailto URL with pre-filled parameters.
 */
export function createMailtoLink(
  to: string,
  subject: string,
  body: string,
  cc?: string
): string {
  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  if (body) params.append('body', body);
  if (cc) params.append('cc', cc);

  return `mailto:${encodeURIComponent(to || '')}?${params.toString()}`;
}
