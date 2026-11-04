import { DailyReport } from '../types/report';

export interface SyncedSpreadsheet {
  id: string;
  name: string;
  url: string;
}

export const SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
export const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';

/**
 * Creates a brand new Google Spreadsheet formatted for Daily Project Reports.
 */
export async function createReportSpreadsheet(
  title: string,
  accessToken: string
): Promise<SyncedSpreadsheet> {
  const requestBody = {
    properties: {
      title: title || `Daily Report Log - ${new Date().toISOString().slice(0, 10)}`,
    },
    sheets: [
      {
        properties: {
          title: 'Rekap Laporan Harian',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: 'Item Pekerjaan & Progres',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: 'Log Tenaga Kerja',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: 'Kendala & Solusi Lapangan',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
    ],
  };

  const response = await fetch(SHEETS_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gagal membuat spreadsheet (${response.status})`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;

  // Initialize Header rows in the sheets
  await initializeSheetHeaders(spreadsheetId, accessToken);

  return {
    id: spreadsheetId,
    name: data.properties?.title || title,
    url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

/**
 * Inserts professional headers into the newly created sheets.
 */
async function initializeSheetHeaders(spreadsheetId: string, accessToken: string) {
  const headerUpdates = [
    {
      range: "'Rekap Laporan Harian'!A1:M1",
      values: [[
        'No. Laporan',
        'Tanggal',
        'Nama Pekerjaan',
        'No. WO / Kode Proyek',
        'Lokasi',
        'Cuaca',
        'Shift Kerja',
        'Status',
        'Total Tenaga Kerja',
        'Jumlah Item Pekerjaan',
        'Rangkuman / Catatan Umum',
        'Pelapor',
        'Waktu Sinkronisasi'
      ]],
    },
    {
      range: "'Item Pekerjaan & Progres'!A1:H1",
      values: [[
        'No. Laporan',
        'Tanggal',
        'Uraian Pekerjaan',
        'Satuan',
        'Target Volume',
        'Realisasi Hari Ini',
        'Progres (%)',
        'Status Pekerjaan'
      ]],
    },
    {
      range: "'Log Tenaga Kerja'!A1:F1",
      values: [[
        'No. Laporan',
        'Tanggal',
        'Klasifikasi / Jabatan',
        'Jumlah Orang',
        'Jam Kerja (Jam)',
        'Catatan'
      ]],
    },
    {
      range: "'Kendala & Solusi Lapangan'!A1:G1",
      values: [[
        'No. Laporan',
        'Tanggal',
        'Kategori Kendala',
        'Deskripsi Kendala',
        'Dampak Waktu (Jam)',
        'Tindakan / Solusi',
        'Status Masalah'
      ]],
    },
  ];

  for (const update of headerUpdates) {
    await fetch(`${SHEETS_API_URL}/${spreadsheetId}/values/${encodeURIComponent(update.range)}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: update.values,
      }),
    });
  }
}

/**
 * Appends a daily report and all its sub-records to the specified Google Spreadsheet.
 */
export async function appendReportToSpreadsheet(
  spreadsheetId: string,
  report: DailyReport,
  accessToken: string
): Promise<{ success: boolean; spreadsheetUrl: string }> {
  const timestamp = new Date().toLocaleString('id-ID');
  const totalWorkers = report.manpowerList.reduce((acc, m) => acc + (Number(m.count) || 0), 0);

  // 1. Append to Rekap Laporan Harian
  const summaryRow = [
    report.reportNumber,
    report.date,
    report.projectName,
    report.projectCode || '-',
    report.location,
    report.weather,
    report.shift,
    report.status,
    totalWorkers,
    report.workItems.length,
    report.generalNotes || report.executiveSummary || '-',
    report.preparedBy?.name || 'Pengawas Lapangan',
    timestamp,
  ];

  await appendRow(spreadsheetId, "'Rekap Laporan Harian'!A:M", [summaryRow], accessToken);

  // 2. Append Work Items if available
  if (report.workItems.length > 0) {
    const workRows = report.workItems.map((item) => [
      report.reportNumber,
      report.date,
      item.name,
      item.unit,
      item.planVolume,
      item.actualVolume,
      `${item.progressPercent}%`,
      item.status,
    ]);
    await appendRow(spreadsheetId, "'Item Pekerjaan & Progres'!A:H", workRows, accessToken);
  }

  // 3. Append Manpower records if available
  if (report.manpowerList.length > 0) {
    const manpowerRows = report.manpowerList.map((m) => [
      report.reportNumber,
      report.date,
      m.role,
      m.count,
      m.workHours,
      m.notes || '-',
    ]);
    await appendRow(spreadsheetId, "'Log Tenaga Kerja'!A:F", manpowerRows, accessToken);
  }

  // 4. Append Issues if available
  if (report.issues.length > 0) {
    const issueRows = report.issues.map((i) => [
      report.reportNumber,
      report.date,
      i.category,
      i.description,
      i.impactHours || 0,
      i.actionTaken,
      i.status,
    ]);
    await appendRow(spreadsheetId, "'Kendala & Solusi Lapangan'!A:G", issueRows, accessToken);
  }

  return {
    success: true,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

async function appendRow(
  spreadsheetId: string,
  range: string,
  values: any[][],
  accessToken: string
) {
  const url = `${SHEETS_API_URL}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gagal menyinkronkan data ke sheet range ${range}`);
  }

  return response.json();
}

/**
 * Searches the user's Google Drive for spreadsheets created or accessible.
 */
export async function listUserSpreadsheets(accessToken: string): Promise<SyncedSpreadsheet[]> {
  try {
    const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
    const res = await fetch(`${DRIVE_API_URL}?q=${query}&fields=files(id,name,webViewLink)&pageSize=15&orderBy=modifiedTime desc`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      url: f.webViewLink || `https://docs.google.com/spreadsheets/d/${f.id}/edit`,
    }));
  } catch (err) {
    console.warn('Error listing spreadsheets from Drive:', err);
    return [];
  }
}
