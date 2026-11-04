import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DailyReport } from '../types/report';

/**
 * Generates an official, publication-quality PDF Daily Report with tables and photo documentation.
 */
export async function generateDailyReportPDF(report: DailyReport): Promise<jsPDF> {
  // A4 dimensions: 210mm x 297mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = margin;

  // --- BRANDING & HEADER ---
  // Top header banner background
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(margin, currentY, contentWidth, 24, 'F');

  // Decorative accent line
  doc.setFillColor(14, 165, 233); // Sky-500
  doc.rect(margin, currentY + 23, contentWidth, 1.2, 'F');

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('LAPORAN HARIAN PROYEK', margin + 6, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text('DAILY PROGRESS & FIELD DOCUMENTATION REPORT', margin + 6, currentY + 15);

  // Status Badge on Header Right
  const statusColor = report.status === 'Disetujui' ? [16, 185, 129] : report.status === 'Diajukan' ? [59, 130, 246] : [245, 158, 11];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(pageWidth - margin - 35, currentY + 5, 29, 7, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(report.status.toUpperCase(), pageWidth - margin - 20.5, currentY + 9.8, { align: 'center' });

  // Report Number on Header Right
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(report.reportNumber, pageWidth - margin - 6, currentY + 18, { align: 'right' });

  currentY += 28;

  // --- PROJECT INFORMATION TABLE ---
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    body: [
      [
        { content: 'Nama Pekerjaan:', styles: { fontStyle: 'bold', cellWidth: 28, fillColor: [248, 250, 252] } },
        { content: report.projectName, styles: { cellWidth: 62 } },
        { content: 'Tanggal Laporan:', styles: { fontStyle: 'bold', cellWidth: 28, fillColor: [248, 250, 252] } },
        { content: formatDateIndo(report.date), styles: { cellWidth: 64 } },
      ],
      [
        { content: 'No. WO / Kode:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: report.projectCode || '-' },
        { content: 'Kondisi Cuaca:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: report.weather },
      ],
      [
        { content: 'Kontraktor:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: report.contractor || '-' },
        { content: 'Shift Kerja:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: report.shift },
      ],
      [
        { content: 'Lokasi Pekerjaan:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: report.location || '-' },
        { content: 'Pemilik / Klien:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: report.clientName || '-' },
      ],
    ],
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // --- SECTION 1: TENAGA KERJA (MANPOWER) ---
  const totalWorkers = report.manpowerList.reduce((sum, m) => sum + (Number(m.count) || 0), 0);
  const totalManHours = report.manpowerList.reduce((sum, m) => sum + (Number(m.count) || 0) * (Number(m.workHours) || 8), 0);

  const manpowerRows = report.manpowerList.map((m, idx) => [
    (idx + 1).toString(),
    m.role,
    `${m.count} Orang`,
    `${m.workHours} Jam`,
    `${(Number(m.count) || 0) * (Number(m.workHours) || 8)} Man-hour`,
    m.notes || '-',
  ]);

  if (manpowerRows.length === 0) {
    manpowerRows.push(['-', 'Tidak ada data tenaga kerja', '-', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    head: [[
      { content: `1. TENAGA KERJA (MANPOWER) - Total: ${totalWorkers} Orang (${totalManHours} Man-hours)`, colSpan: 6, styles: { fillColor: [51, 65, 85], halign: 'left', fontStyle: 'bold' } }
    ], [
      'No', 'Klasifikasi Tenaga Kerja', 'Jumlah', 'Jam Kerja', 'Total Jam', 'Keterangan'
    ]],
    body: manpowerRows,
    foot: [[
      { content: 'Total Tenaga Kerja', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } },
      { content: `${totalWorkers} Org`, styles: { fontStyle: 'bold' } },
      { content: '-', styles: { halign: 'center' } },
      { content: `${totalManHours} MH`, styles: { fontStyle: 'bold' } },
      { content: '' }
    ]],
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 'auto' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // --- SECTION 2: URAIAN PEKERJAAN & PROGRES ---
  const workRows = report.workItems.map((w, idx) => [
    (idx + 1).toString(),
    w.name + (w.locationDetail ? ` (${w.locationDetail})` : ''),
    w.unit,
    w.planVolume.toString(),
    w.actualVolume.toString(),
    `${w.progressPercent}%`,
    w.status,
  ]);

  if (workRows.length === 0) {
    workRows.push(['-', 'Tidak ada item pekerjaan tercatat', '-', '-', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    head: [[
      { content: '2. URAIAN PEKERJAAN & PROGRES LAPANGAN', colSpan: 7, styles: { fillColor: [51, 65, 85], halign: 'left', fontStyle: 'bold' } }
    ], [
      'No', 'Item Pekerjaan / Uraian Tugas', 'Satuan', 'Rencana', 'Realisasi', 'Progres', 'Status'
    ]],
    body: workRows,
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 68 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 32, halign: 'center' },
    },
    didParseCell: (data) => {
      // Color-code progress status
      if (data.section === 'body' && data.column.index === 6) {
        if (data.cell.raw === 'Selesai') {
          data.cell.styles.textColor = [16, 185, 129];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'Dalam Proses') {
          data.cell.styles.textColor = [2, 132, 199];
        } else if (data.cell.raw === 'Tertunda') {
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // Check page overflow for next tables
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = margin;
  }

  // --- SECTION 3: MATERIAL & PERALATAN ---
  const matRows = report.materials.map((m, idx) => [
    (idx + 1).toString(),
    m.name,
    `${m.receivedQty} ${m.unit}`,
    `${m.usedQty} ${m.unit}`,
    m.notes || '-',
  ]);

  if (matRows.length > 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [[
        { content: '3. LOG PENERIMAAN & PENGGUNAAN MATERIAL', colSpan: 5, styles: { fillColor: [51, 65, 85], halign: 'left', fontStyle: 'bold' } }
      ], [
        'No', 'Nama Material / Bahan', 'Diterima Hari Ini', 'Digunakan Hari Ini', 'Keterangan'
      ]],
      body: matRows,
      styles: { fontSize: 7, cellPadding: 1.6 },
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 65 },
        2: { cellWidth: 32, halign: 'center' },
        3: { cellWidth: 32, halign: 'center' },
        4: { cellWidth: 'auto' },
      },
    });
    currentY = (doc as any).lastAutoTable.finalY + 4;
  }

  // --- SECTION 4: KENDALA & TINDAKAN LANJUT ---
  if (report.issues.length > 0) {
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = margin;
    }

    const issueRows = report.issues.map((issue, idx) => [
      (idx + 1).toString(),
      `[${issue.category}]`,
      issue.description,
      `${issue.impactHours || 0} Jam`,
      issue.actionTaken,
      issue.status,
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      head: [[
        { content: '4. KENDALA LAPANGAN & TINDAKAN PENYELESAIAN', colSpan: 6, styles: { fillColor: [180, 83, 9], halign: 'left', fontStyle: 'bold' } }
      ], [
        'No', 'Kategori', 'Uraian Masalah / Hambatan', 'Dampak', 'Tindakan / Solusi', 'Status'
      ]],
      body: issueRows,
      styles: { fontSize: 7, cellPadding: 1.6 },
      headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 26, fontStyle: 'bold' },
        2: { cellWidth: 62 },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 50 },
        5: { cellWidth: 18, halign: 'center' },
      },
    });
    currentY = (doc as any).lastAutoTable.finalY + 4;
  }

  // --- SECTION 5: CATATAN UMUM / EXECUTIVE SUMMARY ---
  if (report.generalNotes || report.executiveSummary) {
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, contentWidth, 22, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('5. CATATAN UMUM / RANGKUMAN EKSEKUTIF:', margin + 3, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const splitNotes = doc.splitTextToSize(report.executiveSummary || report.generalNotes, contentWidth - 6);
    doc.text(splitNotes, margin + 3, currentY + 10);

    currentY += 26;
  }

  // --- SECTION 6: DOKUMENTASI FOTO LAPANGAN (PHOTO DOCUMENTATION) ---
  // Mandatory feature: Export PDF disertai foto dokumentasi nya
  if (report.photos && report.photos.length > 0) {
    // Start documentation on fresh page for clean professional presentation
    doc.addPage();
    currentY = margin;

    // Photo Section Header Banner
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, currentY, contentWidth, 12, 'F');
    doc.setFillColor(14, 165, 233);
    doc.rect(margin, currentY + 11.2, contentWidth, 0.8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('DOKUMENTASI FOTO LAPANGAN & BUKTI KEGIATAN', margin + 5, currentY + 7.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(226, 232, 240);
    doc.text(`Total: ${report.photos.length} Foto Terlampir`, pageWidth - margin - 5, currentY + 7.5, { align: 'right' });

    currentY += 16;

    // Grid layout: 2 columns, max 2 rows per page (4 photos per page)
    const colWidth = (contentWidth - 8) / 2;
    const photoBoxHeight = 58;
    const imgHeight = 42;

    for (let i = 0; i < report.photos.length; i++) {
      const photo = report.photos[i];
      const col = i % 2;
      const rowInPage = Math.floor((i % 4) / 2);

      // Add page every 4 photos
      if (i > 0 && i % 4 === 0) {
        doc.addPage();
        currentY = margin;

        // Sub-header banner
        doc.setFillColor(51, 65, 85);
        doc.rect(margin, currentY, contentWidth, 9, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(`DOKUMENTASI FOTO LAPANGAN (Lanjutan Hal. ${Math.floor(i / 4) + 1})`, margin + 4, currentY + 6);
        currentY += 13;
      }

      const x = margin + col * (colWidth + 8);
      const y = currentY + rowInPage * (photoBoxHeight + 6);

      // Card frame
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, y, colWidth, photoBoxHeight, 1.5, 1.5, 'FD');

      // Draw photo image if valid dataUrl
      if (photo.dataUrl && photo.dataUrl.startsWith('data:image')) {
        try {
          doc.addImage(
            photo.dataUrl,
            'JPEG',
            x + 2,
            y + 2,
            colWidth - 4,
            imgHeight,
            undefined,
            'FAST'
          );
        } catch (err) {
          // Fallback box if corrupted base64
          doc.setFillColor(226, 232, 240);
          doc.rect(x + 2, y + 2, colWidth - 4, imgHeight, 'F');
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text('[Gagal memuat visual foto]', x + colWidth / 2, y + imgHeight / 2, { align: 'center' });
        }
      } else {
        // Placeholder preview
        doc.setFillColor(241, 245, 249);
        doc.rect(x + 2, y + 2, colWidth - 4, imgHeight, 'F');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text('Foto Lapangan Terlampir', x + colWidth / 2, y + imgHeight / 2, { align: 'center' });
      }

      // Tag badge
      doc.setFillColor(15, 23, 42);
      doc.rect(x + 3, y + 3, 30, 4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(255, 255, 255);
      doc.text(photo.category || 'Dokumentasi', x + 18, y + 6, { align: 'center' });

      // Caption & Timestamp box
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      const cleanCaption = photo.caption || `Foto Kegiatan #${i + 1}`;
      const splitCap = doc.splitTextToSize(cleanCaption, colWidth - 6);
      doc.text(splitCap[0] || '', x + 3, y + imgHeight + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      const metaText = `${photo.timestamp || formatDateIndo(report.date)}${photo.location ? ` • ${photo.location}` : ''}`;
      doc.text(metaText, x + 3, y + imgHeight + 11);
    }

    currentY += Math.ceil(Math.min(report.photos.length, 4) / 2) * (photoBoxHeight + 6) + 4;
  }

  // --- SECTION 7: LEMBAR PENGESAHAN & TANDA TANGAN (SIGNATURE BLOCK) ---
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = margin;
  }

  const signBoxWidth = (contentWidth - 8) / 3;
  const signBoxHeight = 36;
  const signY = pageHeight - margin - signBoxHeight - 6;

  const signers = [
    { label: 'Dibuat Oleh (Pelapor):', data: report.preparedBy, defaultTitle: 'Site Supervisor' },
    { label: 'Diperiksa Oleh (Pengawas):', data: report.inspectedBy, defaultTitle: 'Site Engineer / QC' },
    { label: 'Disetujui Oleh (Pemberi Tugas):', data: report.approvedBy, defaultTitle: 'Project Manager / Owner' },
  ];

  signers.forEach((signer, idx) => {
    const sX = margin + idx * (signBoxWidth + 4);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(sX, signY, signBoxWidth, signBoxHeight, 1.5, 1.5, 'FD');

    // Signer Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(signer.label, sX + signBoxWidth / 2, signY + 4.5, { align: 'center' });

    // Draw digital signature if present
    if (signer.data?.dataUrl && signer.data.dataUrl.startsWith('data:image')) {
      try {
        doc.addImage(signer.data.dataUrl, 'PNG', sX + 4, signY + 6, signBoxWidth - 8, 16);
      } catch (e) {
        // Fallback
      }
    } else {
      // Signature line placeholder
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6);
      doc.setTextColor(148, 163, 184);
      doc.text('(Tanda Tangan Digital)', sX + signBoxWidth / 2, signY + 16, { align: 'center' });
    }

    // Name & Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(signer.data?.name || '_________________', sX + signBoxWidth / 2, signY + 27, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(signer.data?.title || signer.defaultTitle, sX + signBoxWidth / 2, signY + 31, { align: 'center' });
  });

  // --- FOOTER ON ALL PAGES ---
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);

    // Left: Generated timestamp & app name
    const printTime = new Date().toLocaleString('id-ID');
    doc.text(`DailyReport Pro • Dicetak pada: ${printTime}`, margin, pageHeight - 6);

    // Right: Page number
    doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });

    // Thin line above footer
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);
  }

  return doc;
}

function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
