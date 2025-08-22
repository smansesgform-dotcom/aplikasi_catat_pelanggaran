import type { EnrichedViolationRecord, StudentSummary } from '../types';

declare const XLSX: any;
declare const jspdf: any;

export const generateExcel = (detailedData: EnrichedViolationRecord[], summaryData: StudentSummary[]) => {
  const workbook = XLSX.utils.book_new();

  // --- Sheet 1: Ringkasan Siswa ---
  const summaryHeaders = [
    "Peringkat",
    "Nama Siswa",
    "Kelas",
    "Jumlah Insiden",
    "Total Poin"
  ];
  const summaryWorksheetData = summaryData.map((row, index) => ({
    "Peringkat": index + 1,
    "Nama Siswa": row.studentName,
    "Kelas": row.studentClass,
    "Jumlah Insiden": row.incidentCount,
    "Total Poin": row.totalPoints,
  }));
  const summaryWorksheet = XLSX.utils.json_to_sheet(summaryWorksheetData, { header: summaryHeaders });
  // Auto-fit column widths for summary
  const summaryColWidths = summaryHeaders.map(header => ({
    wch: Math.max(header.length, ...summaryWorksheetData.map(row => row[header as keyof typeof row]?.toString().length ?? 0))
  }));
  summaryWorksheet["!cols"] = summaryColWidths;
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Ringkasan Siswa");

  // --- Sheet 2: Laporan Rinci ---
  const detailedHeaders = [
    "Tanggal & Waktu",
    "Nama Siswa",
    "Kelas",
    "Pelanggaran",
    "Poin Insiden",
    "Guru Pelapor"
  ];
  const detailedWorksheetData = detailedData.map(row => ({
    "Tanggal & Waktu": row.timestamp,
    "Nama Siswa": row.studentName,
    "Kelas": row.studentClass,
    "Pelanggaran": row.violations,
    "Poin Insiden": row.totalPoints,
    "Guru Pelapor": row.teacherName,
  }));
  const detailedWorksheet = XLSX.utils.json_to_sheet(detailedWorksheetData, { header: detailedHeaders });
  // Auto-fit column widths for details
  const detailedColWidths = detailedHeaders.map(header => ({
    wch: Math.max(header.length, ...detailedWorksheetData.map(row => row[header as keyof typeof row]?.toString().length ?? 0))
  }));
  detailedWorksheet["!cols"] = detailedColWidths;
  XLSX.utils.book_append_sheet(workbook, detailedWorksheet, "Laporan Rinci");
  
  XLSX.writeFile(workbook, "Laporan_Pelanggaran_Lengkap.xlsx");
};

export const generatePdf = (detailedData: EnrichedViolationRecord[], summaryData: StudentSummary[]) => {
  const doc = new jspdf.jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const schoolName = import.meta.env.VITE_SCHOOL_NAME || "Laporan Pelanggaran Sekolah";
  const reportTitle = "Laporan Pelanggaran Siswa";
  const generationDate = `Dibuat pada: ${new Date().toLocaleString('id-ID')}`;
  const pageMargin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- Header ---
  doc.setFontSize(16);
  doc.text(schoolName, pageWidth / 2, pageMargin, { align: 'center' });
  doc.setFontSize(12);
  doc.text(reportTitle, pageWidth / 2, pageMargin + 7, { align: 'center' });
  doc.setFontSize(10);
  doc.text(generationDate, pageWidth / 2, pageMargin + 13, { align: 'center' });

  let startY = pageMargin + 22;

  // --- Summary Table ---
  if (summaryData.length > 0) {
    doc.setFontSize(12);
    doc.text("Ringkasan Siswa", pageMargin, startY);
    startY += 5;

    const summaryColumns = ["Peringkat", "Nama Siswa", "Kelas", "Jml Insiden", "Total Poin"];
    const summaryRows = summaryData.map((row, index) => [
      index + 1,
      row.studentName,
      row.studentClass,
      row.incidentCount,
      row.totalPoints
    ]);

    (doc as any).autoTable({
      head: [summaryColumns],
      body: summaryRows,
      startY: startY,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' }
    });
    startY = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // --- Detailed Report Table ---
  if (detailedData.length > 0) {
    doc.setFontSize(12);
    doc.text("Laporan Rinci", pageMargin, startY);
    startY += 5;

    const detailedColumns = ["Tanggal & Waktu", "Nama Siswa", "Kelas", "Pelanggaran", "Poin", "Guru Pelapor"];
    const detailedRows = detailedData.map(row => [
      row.timestamp,
      row.studentName,
      row.studentClass,
      row.violations,
      row.totalPoints,
      row.teacherName
    ]);

    (doc as any).autoTable({
      head: [detailedColumns],
      body: detailedRows,
      startY: startY,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' }
    });
  }

  doc.save("Laporan_Pelanggaran_Lengkap.pdf");
};