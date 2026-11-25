import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawOfficialKop } from './pdfKop';

/**
 * Format angka ke mata uang Rupiah Indonesia tanpa desimal liar
 */
export const formatRupiah = (amount) => {
  const num = Math.round(Number(amount) || 0);
  return `Rp ${num.toLocaleString('id-ID')}`;
};

/**
 * Format tanggal ISO (YYYY-MM-DD) ke DD/MM/YYYY tanpa pergeseran zona waktu
 */
export const formatTanggalId = (isoStr) => {
  if (!isoStr || typeof isoStr !== 'string') return '-';
  const parts = isoStr.trim().split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
};

/**
 * Konversi angka menjadi kalimat Terbilang Bahasa Indonesia resmi
 */
export const terbilangRupiah = (nilai) => {
  const num = Math.floor(Math.abs(Number(nilai) || 0));
  if (num === 0) return 'Nol Rupiah';

  const satuan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima',
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];

  const convert = (n) => {
    if (n < 12) return satuan[n];
    if (n < 20) return `${satuan[n - 10]} Belas`;
    if (n < 100) return `${satuan[Math.floor(n / 10)]} Puluh ${convert(n % 10)}`.trim();
    if (n < 200) return `Seratus ${convert(n - 100)}`.trim();
    if (n < 1000) return `${satuan[Math.floor(n / 100)]} Ratus ${convert(n % 100)}`.trim();
    if (n < 2000) return `Seribu ${convert(n - 1000)}`.trim();
    if (n < 1000000) return `${convert(Math.floor(n / 1000))} Ribu ${convert(n % 1000)}`.trim();
    if (n < 1000000000) return `${convert(Math.floor(n / 1000000))} Juta ${convert(n % 1000000)}`.trim();
    if (n < 1000000000000) return `${convert(Math.floor(n / 1000000000))} Miliar ${convert(n % 1000000000)}`.trim();
    return `${convert(Math.floor(n / 1000000000000))} Triliun ${convert(n % 1000000000000)}`.trim();
  };

  return `${convert(num).replace(/\s+/g, ' ').trim()} Rupiah`;
};

const drawSignatureSection = (doc, startY, signerRole, signerName) => {
  let y = startY + 11;
  if (y > 242) {
    doc.addPage();
    y = 24;
  }

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // TTD Kiri: Ketua Panitia Musabaqah
  const leftSigX = 52;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Mengetahui,', leftSigX, y, { align: 'center' });
  doc.text('Ketua Panitia Musabaqah,', leftSigX, y + 5, { align: 'center' });

  const leftNameY = y + 27;
  const leftName = 'Ust. Danil Ali Sabila';
  doc.setFont('helvetica', 'bold');
  doc.text(leftName, leftSigX, leftNameY, { align: 'center' });
  const leftWidth = doc.getTextWidth(leftName);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.3);
  doc.line(leftSigX - leftWidth / 2, leftNameY + 1, leftSigX + leftWidth / 2, leftNameY + 1);

  // TTD Kanan: Petugas Pencatat / Bendahara / Koordinator
  const rightSigX = 158;
  doc.setFont('helvetica', 'normal');
  doc.text(`Putak, ${todayStr}`, rightSigX, y, { align: 'center' });
  doc.text(`${signerRole || 'Bendahara Panitia'},`, rightSigX, y + 5, { align: 'center' });

  const rightNameY = y + 27;
  const cleanRightName = (signerName || '').trim() || '________________________';
  doc.setFont('helvetica', 'bold');
  doc.text(cleanRightName, rightSigX, rightNameY, { align: 'center' });
  if ((signerName || '').trim()) {
    const rightWidth = doc.getTextWidth(cleanRightName);
    doc.line(rightSigX - rightWidth / 2, rightNameY + 1, rightSigX + rightWidth / 2, rightNameY + 1);
  }
};

const addPageFooters = (doc) => {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.line(14.5, 285.5, 195.5, 285.5);
    doc.text(
      'Arsip Resmi Panitia Musabaqah Akhirussanah 1447 H / 2026 M • YPPS Al-Falah Putak',
      14.5,
      289.5
    );
    doc.text(`Halaman ${i} dari ${totalPages}`, 195.5, 289.5, { align: 'right' });
  }
};

/**
 * Generator PDF Resmi: Laporan Pencatatan Pengeluaran Panitia (Dengan KOP Resmi)
 */
export const downloadPengeluaranPdf = async (items = [], options = {}) => {
  const {
    title = 'LAPORAN PENCATATAN PENGELUARAN PANITIA',
    filterLabel = 'Semua Data Pengeluaran',
    signerRole = 'Bendahara Panitia',
    signerName = '',
    includeTerbilang = true
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const leftMargin = 14.5;
  const rightMargin = 14.5;

  await drawOfficialKop(doc, leftMargin, rightMargin);

  // Judul & Subjudul Resmi
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(title.toUpperCase(), 105, 48.5, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setTextColor(5, 71, 54);
  doc.text('MUSABAQAH AKHIRUSSANAH 1447 H / 2026 M • YPPS AL-FALAH PUTAK', 105, 53.5, { align: 'center' });

  const totalNominal = items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
  const totalQty = items.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Kotak Ringkasan Metadata (181 mm flush dengan KOP)
  doc.setFillColor(244, 250, 247);
  doc.setDrawColor(167, 243, 208);
  doc.setLineWidth(0.3);
  doc.roundedRect(leftMargin, 56.5, 181, 13.5, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Filter Laporan : ${filterLabel}`, leftMargin + 3.5, 61.5);
  doc.text(`Tanggal Cetak : ${todayStr}`, 195.5 - 3.5, 61.5, { align: 'right' });

  doc.text(`Jumlah Akun : ${items.length} Item (${totalQty} Qty)`, leftMargin + 3.5, 67);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 71, 54);
  doc.text(`Total Pengeluaran : ${formatRupiah(totalNominal)}`, 195.5 - 3.5, 67, { align: 'right' });

  // Tabel Data (Total Lebar Kolom = 181 mm persis)
  const bodyRows = items.map((item, idx) => {
    const uraian = item.keterangan
      ? `${item.namaAkun || '-'}\nCatatan: ${item.keterangan}`
      : (item.namaAkun || '-');
    return [
      String(idx + 1),
      formatTanggalId(item.tanggal),
      uraian,
      item.satuan || '-',
      formatRupiah(item.hargaSatuan),
      String(item.qty || 0),
      formatRupiah(item.total)
    ];
  });

  autoTable(doc, {
    startY: 73.5,
    margin: { top: 15, left: leftMargin, right: rightMargin, bottom: 20 },
    head: [['NO.', 'TANGGAL', 'NAMA AKUN / URAIAN', 'SATUAN', 'HARGA SATUAN', 'QTY', 'TOTAL (RP)']],
    body: bodyRows,
    foot: [[
      {
        content: 'TOTAL PENGELUARAN KESELURUHAN',
        colSpan: 6,
        styles: {
          halign: 'right',
          fontStyle: 'bold',
          fillColor: [234, 244, 240],
          textColor: [5, 71, 54]
        }
      },
      {
        content: formatRupiah(totalNominal),
        styles: {
          halign: 'right',
          fontStyle: 'bold',
          fillColor: [234, 244, 240],
          textColor: [5, 71, 54]
        }
      }
    ]],
    showFoot: 'lastPage',
    theme: 'grid',
    headStyles: {
      fillColor: [11, 93, 69],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 8.5,
      minCellHeight: 8.5,
      cellPadding: 2.2,
      lineColor: [51, 65, 85],
      lineWidth: 0.3
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10, fontStyle: 'normal' },
      1: { halign: 'center', cellWidth: 22, fontStyle: 'normal' },
      2: { halign: 'left', cellWidth: 61, fontStyle: 'bold' },
      3: { halign: 'center', cellWidth: 20, fontStyle: 'normal' },
      4: { halign: 'right', cellWidth: 28, fontStyle: 'normal' },
      5: { halign: 'center', cellWidth: 12, fontStyle: 'bold' },
      6: { halign: 'right', cellWidth: 28, fontStyle: 'bold' }
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [15, 23, 42],
      valign: 'middle',
      minCellHeight: 7.5,
      cellPadding: 2.2,
      lineColor: [100, 116, 139],
      lineWidth: 0.28
    },
    footStyles: {
      fontSize: 9,
      minCellHeight: 8.5,
      cellPadding: 2.4,
      lineColor: [11, 93, 69],
      lineWidth: 0.35
    },
    alternateRowStyles: {
      fillColor: [244, 248, 251]
    }
  });

  let afterTableY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 120;

  if (includeTerbilang) {
    if (afterTableY > 255) {
      doc.addPage();
      afterTableY = 20;
    }
    const terbilangText = `Terbilang: # ${terbilangRupiah(totalNominal)} #`;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.roundedRect(leftMargin, afterTableY + 3.5, 181, 8.5, 1.2, 1.2, 'FD');
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(terbilangText, leftMargin + 3.5, afterTableY + 8.8);
    afterTableY += 12;
  }

  drawSignatureSection(doc, afterTableY, signerRole, signerName);
  addPageFooters(doc);

  const fileDate = new Date().toISOString().slice(0, 10);
  doc.save(`Laporan_Pengeluaran_Musabaqah_1447H_${fileDate}.pdf`);
};

/**
 * Generator PDF Resmi: Daftar Kebutuhan & Persiapan Sebelum Hari-H (Dengan KOP Resmi)
 */
export const downloadKebutuhanPdf = async (items = [], options = {}) => {
  const {
    title = 'DAFTAR KEBUTUHAN & PERSIAPAN SEBELUM HARI-H',
    filterLabel = 'Semua Status Kebutuhan',
    signerRole = 'Koordinator Perlengkapan',
    signerName = ''
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const leftMargin = 14.5;
  const rightMargin = 14.5;

  await drawOfficialKop(doc, leftMargin, rightMargin);

  // Judul & Subjudul Resmi
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(title.toUpperCase(), 105, 48.5, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setTextColor(5, 71, 54);
  doc.text('MUSABAQAH AKHIRUSSANAH 1447 H / 2026 M • YPPS AL-FALAH PUTAK', 105, 53.5, { align: 'center' });

  const siapCount = items.filter(it => it.status === 'Sudah Siap').length;
  const prosesCount = items.filter(it => it.status === 'Dalam Proses').length;
  const belumCount = items.filter(it => it.status !== 'Sudah Siap' && it.status !== 'Dalam Proses').length;
  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Kotak Ringkasan Metadata (181 mm flush dengan KOP)
  doc.setFillColor(244, 250, 247);
  doc.setDrawColor(167, 243, 208);
  doc.setLineWidth(0.3);
  doc.roundedRect(leftMargin, 56.5, 181, 13.5, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Filter Daftar : ${filterLabel}`, leftMargin + 3.5, 61.5);
  doc.text(`Tanggal Cetak : ${todayStr}`, 195.5 - 3.5, 61.5, { align: 'right' });

  doc.text(`Total Kebutuhan : ${items.length} Item`, leftMargin + 3.5, 67);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 71, 54);
  doc.text(
    `Rekap Kesiapan : ${siapCount} Siap  |  ${prosesCount} Proses  |  ${belumCount} Belum`,
    195.5 - 3.5,
    67,
    { align: 'right' }
  );

  // Tabel Data (Total Lebar Kolom = 181 mm persis)
  const bodyRows = items.map((item, idx) => {
    const namaDesc = item.keterangan
      ? `${item.namaKebutuhan || '-'}\nCatatan: ${item.keterangan}`
      : (item.namaKebutuhan || '-');
    const targetAndPj = [
      item.targetTanggal ? `Target: ${item.targetTanggal}` : null,
      item.penanggungJawab ? `PJ: ${item.penanggungJawab}` : null
    ]
      .filter(Boolean)
      .join('\n') || '-';

    return [
      String(idx + 1),
      item.kategori || '-',
      namaDesc,
      `${item.qty || 1} ${item.satuan || 'Pcs'}`,
      targetAndPj,
      item.status || 'Belum Siap'
    ];
  });

  autoTable(doc, {
    startY: 73.5,
    margin: { top: 15, left: leftMargin, right: rightMargin, bottom: 20 },
    head: [['NO.', 'KATEGORI / SEKSI', 'KEBUTUHAN & CATATAN', 'JUMLAH', 'TARGET & PJ', 'STATUS']],
    body: bodyRows,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 93, 69],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 8.5,
      minCellHeight: 8.5,
      cellPadding: 2.2,
      lineColor: [51, 65, 85],
      lineWidth: 0.3
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10, fontStyle: 'normal' },
      1: { halign: 'left', cellWidth: 29, fontStyle: 'normal' },
      2: { halign: 'left', cellWidth: 56, fontStyle: 'bold' },
      3: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
      4: { halign: 'left', cellWidth: 38, fontStyle: 'normal' },
      5: { halign: 'center', cellWidth: 26, fontStyle: 'bold' }
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [15, 23, 42],
      valign: 'middle',
      minCellHeight: 7.5,
      cellPadding: 2.2,
      lineColor: [100, 116, 139],
      lineWidth: 0.28
    },
    alternateRowStyles: {
      fillColor: [244, 248, 251]
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const val = String(data.cell.raw || '');
        if (val === 'Sudah Siap') {
          data.cell.styles.fillColor = [236, 253, 245];
          data.cell.styles.textColor = [5, 95, 70];
        } else if (val === 'Dalam Proses') {
          data.cell.styles.fillColor = [255, 251, 235];
          data.cell.styles.textColor = [146, 64, 14];
        } else {
          data.cell.styles.fillColor = [255, 241, 242];
          data.cell.styles.textColor = [159, 18, 57];
        }
      }
    }
  });

  const afterTableY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 120;
  drawSignatureSection(doc, afterTableY, signerRole, signerName);
  addPageFooters(doc);

  const fileDate = new Date().toISOString().slice(0, 10);
  doc.save(`Daftar_Kebutuhan_Musabaqah_1447H_${fileDate}.pdf`);
};
