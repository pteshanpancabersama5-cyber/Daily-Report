import { GoogleGenAI } from '@google/genai';
import { DailyReport } from '../types/report';

// Initialize Gemini client if environment variable is present
const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Generates an Executive Summary suitable for management, owners, and client reports.
 */
export async function generateExecutiveSummary(report: DailyReport): Promise<string> {
  if (!ai) {
    // High quality offline heuristic fallback
    const totalWorkers = report.manpowerList.reduce((acc, m) => acc + (Number(m.count) || 0), 0);
    const topWorks = report.workItems.map(w => `${w.name} (${w.progressPercent}%)`).join(', ');
    const issueSummary = report.issues.length > 0 ? `Terdapat kendala: ${report.issues[0].description} yang sedang diatasi.` : 'Kegiatan berjalan aman tanpa kendala berarti.';
    return `Pelaksanaan pekerjaan harian proyek ${report.projectName} pada ${report.date} dengan cuaca ${report.weather} melibatkan total ${totalWorkers} personil kerja. Fokus kegiatan meliputi: ${topWorks || 'pekerjaan rutin'}. ${issueSummary}`;
  }

  try {
    const prompt = `Bertindaklah sebagai Senior Project Manager / Site Engineer profesional Indonesia.
Tuliskan satu paragraf ringkasan eksekutif (Executive Summary) yang lugas, formal, dan profesional dalam Bahasa Indonesia berdasarkan data laporan harian berikut:

Proyek: ${report.projectName} (${report.projectCode})
Tanggal: ${report.date}
Lokasi: ${report.location}
Cuaca: ${report.weather}
Shift: ${report.shift}
Total Tenaga Kerja: ${report.manpowerList.reduce((acc, m) => acc + (Number(m.count) || 0), 0)} orang
Daftar Pekerjaan: ${report.workItems.map(w => `${w.name} (rencana: ${w.planVolume} ${w.unit}, aktual: ${w.actualVolume} ${w.unit}, progres: ${w.progressPercent}%, status: ${w.status})`).join('; ')}
Kendala Lapangan: ${report.issues.map(i => `[${i.category}] ${i.description} (Solusi: ${i.actionTaken})`).join('; ') || 'Nihil'}
Catatan Pengawas: ${report.generalNotes || 'Nihil'}

Panjang ringkasan sekitar 3-5 kalimat, padat, berorientasi hasil dan keselamatan kerja (K3). Berikan hanya teks ringkasan tanpa pembuka/penutup.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || 'Gagal menghasilkan ringkasan AI.';
  } catch (error) {
    console.warn('Gemini summary generation failed:', error);
    return `Pelaksanaan harian proyek ${report.projectName} pada ${report.date} berjalan dengan dukungan ${report.manpowerList.reduce((acc, m) => acc + (Number(m.count) || 0), 0)} tenaga kerja. Progres pekerjaan dan kendala telah dicatat sesuai kondisi lapangan.`;
  }
}

/**
 * Polishes rough field notes into professional Indonesian technical report format.
 */
export async function polishFieldNotes(roughNotes: string): Promise<string> {
  if (!ai || !roughNotes.trim()) {
    return roughNotes;
  }

  try {
    const prompt = `Ubah catatan lapangan / coretan kasar mandor/pengawas proyek berikut menjadi uraian resmi Bahasa Indonesia standar laporan konstruksi/teknik yang rapi, profesional, dan runtut:

Catatan kasar:
"${roughNotes}"

Berikan hasil teks yang sudah dirapikan saja tanpa penjelasan tambahan.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || roughNotes;
  } catch (error) {
    return roughNotes;
  }
}
