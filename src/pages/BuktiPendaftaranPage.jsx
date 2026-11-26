import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import { 
  FileQuestion, 
  Search, 
  CheckCircle2, 
  Printer, 
  Download,
  FileText,
  RotateCcw,
  QrCode,
  ArrowLeft
} from 'lucide-react';
import SuccessTicket from '../public/components/SuccessTicket';
import WhatsAppIcon from '../shared/components/WhatsAppIcon';
import { drawOfficialKop } from '../shared/utils/pdfKop';
import { normalizePhoneLocal08 } from '../shared/utils/phone';

export default function BuktiPendaftaranPage() {
  const location = useLocation();
  const navigate = useNavigate();

  let batchResult = location.state?.batchResult;
  let ticket = location.state?.ticket;

  if (!batchResult) {
    try {
      const storedBatch = sessionStorage.getItem('alfalah_latest_batch');
      if (storedBatch) {
        batchResult = JSON.parse(storedBatch);
      }
    } catch (e) {}
  }

  if (!ticket && batchResult?.entries?.length > 0) {
    ticket = batchResult.entries[0];
  }

  if (!ticket) {
    try {
      const stored = sessionStorage.getItem('alfalah_latest_ticket');
      if (stored) {
        ticket = JSON.parse(stored);
      }
    } catch (e) {}
  }

  // State tampilan: 'rekap' (rekapitulasi kelas diniyah) atau 'cards' (kartu QR per santri)
  const [viewMode, setViewMode] = useState('rekap');
  const [selectedSingleIndex, setSelectedSingleIndex] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!ticket && !batchResult) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4 font-sans">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
          <FileQuestion className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Belum Ada Bukti Pendaftaran yang Dipilih
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Silakan isi formulir pendaftaran terlebih dahulu atau gunakan fitur pencarian pada menu Cek Status Pendaftaran.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#075B45] text-white font-bold text-xs shadow-xs"
          >
            Buka Formulir Pendaftaran
          </Link>
          <Link
            to="/cek-status"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center justify-center space-x-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Cari Data Pendaftaran</span>
          </Link>
        </div>
      </div>
    );
  }

  const entries = batchResult?.entries || (ticket ? [ticket] : []);
  const rawMeta = batchResult?.metadata || {
    waliKelas: ticket?.Wali_Kelas,
    kelasDiniyah: ticket?.Kelas_Kategori,
    tingkat: ticket?.Tingkat,
    nomorWA: ticket?.Nomor_WA
  };
  const meta = {
    ...rawMeta,
    nomorWA: rawMeta.nomorWA ? normalizePhoneLocal08(rawMeta.nomorWA) : ''
  };

  const formatTingkat = (val) => {
    if (!val) return '-';
    const lower = String(val).toLowerCase().trim();
    if (lower === 'ula') return 'Tingkat Ula';
    if (lower === 'wustho') return 'Tingkat Wustho';
    if (lower === 'ulya') return 'Tingkat Ulya';
    return val;
  };

  // ========================================================
  // GENERATOR PDF RESMI DENGAN KOP & TTD (PERSIS DAFTAR SANTRI)
  // ========================================================
  const generateAndDownloadPdf = async (action = 'download') => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    try {
      if (entries.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Tidak Ada Data',
          text: 'Belum ada data delegasi santri yang dapat dicetak.',
          confirmButtonColor: '#075B45'
        });
        setIsGeneratingPdf(false);
        return;
      }

      Swal.fire({
        title: 'Menyiapkan PDF...',
        text: 'Menyusun KOP resmi, tabel delegasi santri, dan pengesahan...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const leftMargin = 14.5;
      const rightMargin = 14.5;

      // 1. KOP Surat Resmi Bersama (100% Identik via drawOfficialKop)
      await drawOfficialKop(doc, leftMargin, rightMargin);

      // 4. Judul Dokumen & Keterangan Kelas
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.text('BUKTI PENDAFTARAN DELEGASI KELAS DINIYAH', 105, 48.5, { align: 'center' });

      doc.setFontSize(9.5);
      doc.text('MUSABAQAH AKHIRUSSANAH 1447 H / 2026 M', 105, 53.5, { align: 'center' });

      const cleanKelas = (meta.kelasDiniyah || '-').toUpperCase();
      const cleanTingkat = formatTingkat(meta.tingkat).toUpperCase();
      const cleanWali = (meta.waliKelas || '-').toUpperCase();

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const subtitleText = `KELAS : ${cleanKelas}   |   JENJANG : ${cleanTingkat}   |   WALI KELAS : ${cleanWali}`;
      doc.text(subtitleText, 105, 58.5, { align: 'center' });

      // 5. Tabel Delegasi Santri (jsPDF AutoTable)
      const tableRows = entries.map((item, idx) => [
        String(idx + 1),
        item.ID_Pendaftaran ? String(item.ID_Pendaftaran) : '-',
        item.Nama_Lengkap || '-',
        item.Cabang_Lomba || '-',
        item.Catatan || '-'
      ]);

      autoTable(doc, {
        startY: 63.5,
        margin: { left: leftMargin, right: rightMargin },
        head: [['NO.', 'ID SANTRI', 'NAMA LENGKAP SANTRI', 'CABANG LOMBA', 'KETERANGAN']],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [11, 93, 69], // #0B5D45 Khas Al-Falah Putak
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          fontSize: 9.5,
          minCellHeight: 8,
          cellPadding: 2.2,
          lineColor: [51, 65, 85],
          lineWidth: 0.35
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12, fontStyle: 'normal' },
          1: { halign: 'center', cellWidth: 26, fontStyle: 'bold' },
          2: { halign: 'left', cellWidth: 62, fontStyle: 'bold' },
          3: { halign: 'left', cellWidth: 48, fontStyle: 'normal' },
          4: { halign: 'left', cellWidth: 33, fontStyle: 'normal' }
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [0, 0, 0],
          valign: 'middle',
          minCellHeight: 7,
          cellPadding: 2,
          lineColor: [71, 85, 105],
          lineWidth: 0.35
        },
        alternateRowStyles: {
          fillColor: [232, 240, 246] // #E8F0F6
        }
      });

      // 6. Ruang Tanda Tangan (TTD)
      let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 110;
      if (finalY > 230) {
        doc.addPage();
        finalY = 25;
      }

      const ttdY = finalY + 10;
      const todayStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // TTD Kiri: Mengetahui Panitia Musabaqoh
      const leftSig = 50;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(0, 0, 0);
      doc.text('Mengetahui,', leftSig, ttdY, { align: 'center' });
      doc.text('Panitia Musabaqoh Akhirussanah', leftSig, ttdY + 5, { align: 'center' });

      const nameLeftY = ttdY + 28;
      doc.setFont('helvetica', 'bold');
      doc.text('Ust. Danil Ali Sabila', leftSig, nameLeftY, { align: 'center' });
      const leftWidth = doc.getTextWidth('Ust. Danil Ali Sabila');
      doc.setLineWidth(0.3);
      doc.line(leftSig - (leftWidth / 2), nameLeftY + 1, leftSig + (leftWidth / 2), nameLeftY + 1);

      // TTD Kanan: Wali Kelas Pendaftar
      const rightSig = 160;
      doc.setFont('helvetica', 'normal');
      doc.text(`Putak, ${todayStr}`, rightSig, ttdY, { align: 'center' });
      doc.text(`Wali Kelas ${meta.kelasDiniyah || ''}`, rightSig, ttdY + 5, { align: 'center' });

      const nameRightY = ttdY + 28;
      const waliName = meta.waliKelas || 'Wali Kelas';
      doc.setFont('helvetica', 'bold');
      doc.text(waliName, rightSig, nameRightY, { align: 'center' });
      const rightWidth = doc.getTextWidth(waliName);
      doc.setLineWidth(0.3);
      doc.line(rightSig - (rightWidth / 2), nameRightY + 1, rightSig + (rightWidth / 2), nameRightY + 1);

      if (meta.nomorWA) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(`WA: ${meta.nomorWA}`, rightSig, nameRightY + 5.5, { align: 'center' });
      }

      // 7. Footer nomor halaman
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Bukti Pendaftaran Kelas Diniyah ${meta.kelasDiniyah || ''} | Halaman ${i} dari ${totalPages}`,
          105,
          290,
          { align: 'center' }
        );
      }

      // 8. Simpan atau Cetak PDF
      const cleanKelasFile = (meta.kelasDiniyah || 'Kelas').replace(/[^a-zA-Z0-9]/g, '_');
      const cleanFileName = `Bukti_Pendaftaran_${cleanKelasFile}_Musabaqoh_1447H.pdf`;

      if (action === 'print') {
        doc.autoPrint();
        const blobUrl = doc.output('bloburl');
        window.open(blobUrl, '_blank');
        Swal.close();
      } else {
        doc.save(cleanFileName);
        Swal.fire({
          icon: 'success',
          title: 'PDF Berhasil Diunduh',
          text: `Dokumen Bukti Pendaftaran ${meta.kelasDiniyah || ''} (${entries.length} Santri) berhasil disimpan ke perangkat Anda.`,
          confirmButtonColor: '#075B45'
        });
      }
    } catch (err) {
      console.error('Gagal generate PDF:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Membuat PDF',
        text: 'Terjadi kendala saat menyusun dokumen PDF. Silakan coba kembali.',
        confirmButtonColor: '#075B45'
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="py-2 sm:py-5 max-w-2xl mx-auto px-3 sm:px-4 font-sans select-none">
      
      {/* Switch Mode jika pendaftaran kolektif (lebih dari 1 santri) */}
      {entries.length > 1 && (
        <div className="mb-3 flex items-center justify-between gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs no-print">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setViewMode('rekap')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center truncate cursor-pointer ${
                viewMode === 'rekap'
                  ? 'bg-[#075B45] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="sm:hidden">Rekap ({entries.length})</span>
              <span className="hidden sm:inline">Rekapitulasi Kelas ({entries.length} Santri)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center truncate cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#075B45] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="sm:hidden">Kartu QR</span>
              <span className="hidden sm:inline">Kartu Santri (QR Code)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => generateAndDownloadPdf('download')}
            disabled={isGeneratingPdf}
            aria-label="Unduh PDF Resmi"
            className="shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#075B45] border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#075B45]" />
            <span className="hidden sm:inline">Unduh PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      )}

      {/* TAMPILAN 1: REKAPITULASI RESMI KELAS DINIYAH */}
      {viewMode === 'rekap' && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* Header Notifikasi Sukses */}
          <div className="p-3 sm:p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center justify-between gap-2.5 shadow-2xs no-print">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#075B45] text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-emerald-950 leading-tight truncate">
                  Seluruh Delegasi Berhasil Didaftarkan
                </h3>
                <p className="text-[10.5px] sm:text-[11px] text-emerald-800 mt-0.5 leading-tight truncate">
                  Data telah tersimpan resmi di sistem panitia
                </p>
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-black bg-white text-[#075B45] border border-emerald-200 px-2.5 py-1 rounded-xl shrink-0 whitespace-nowrap shadow-2xs">
              {entries.length} Santri
            </span>
          </div>

          {/* Kartu Pratinjau Rekap Resmi Kelas Diniyah */}
          <div id="printable-rekap-kelas" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-slate-800">
            
            {/* Kop Resmi Pesantren Al-Falah Putak */}
            <div 
              className="p-3.5 sm:p-5 text-white relative border-b-2 border-[#D9B45B]"
              style={{
                backgroundColor: '#054736',
                background: 'linear-gradient(135deg, #054736 0%, #075B45 60%, #033427 100%)'
              }}
            >
              <div className="flex items-center space-x-3">
                <img 
                  src="/logo.webp" 
                  alt="Logo Al-Falah Putak" 
                  className="w-11 h-11 sm:w-12 sm:h-12 object-contain shrink-0 drop-shadow-sm" 
                />
                <div className="leading-tight min-w-0">
                  <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider text-[#D9B45B] block truncate">
                    YPPS AL-FALAH PUTAK
                  </span>
                  <h2 className="text-xs sm:text-base font-black tracking-tight text-white uppercase leading-snug">
                    BUKTI PENDAFTARAN DELEGASI KELAS DINIYAH
                  </h2>
                  <span className="text-[10px] sm:text-[10.5px] text-emerald-100 font-medium block truncate">
                    Musabaqah Akhirussanah 1447 H / 2026 M
                  </span>
                </div>
              </div>
            </div>

            {/* Identitas Kelas Diniyah */}
            <div className="p-3 sm:p-4 bg-slate-50/90 border-b border-slate-200 space-y-2 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                <div>
                  <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kelas Diniyah</span>
                  <span className="font-black text-[#075B45] text-xs sm:text-sm block truncate">{meta.kelasDiniyah || '-'}</span>
                </div>
                <div>
                  <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jenjang</span>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm block truncate">{formatTingkat(meta.tingkat)}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Wali Kelas</span>
                  <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">{meta.waliKelas || '-'}</span>
                </div>
              </div>

              {/* Baris Khusus Nomor WhatsApp di Bawah (Tidak Bersandingan) */}
              {meta.nomorWA && (
                <div className="pt-2 border-t border-slate-200/70 flex items-center space-x-2 text-[11px] text-slate-600">
                  <WhatsAppIcon variant="brand" className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-slate-400 font-medium">Nomor WhatsApp:</span>
                  <span className="font-mono font-bold text-[#075B45] bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                    {meta.nomorWA}
                  </span>
                </div>
              )}
            </div>

            {/* Tabel Delegasi Santri */}
            <div className="p-2.5 sm:p-4">
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                
                {/* 1. Header Khusus Layar Tablet & Desktop */}
                <div className="bg-slate-100/80 px-3.5 py-2.5 text-[10.5px] font-black text-slate-600 uppercase tracking-wider hidden sm:grid grid-cols-12 gap-2">
                  <span className="col-span-1">No</span>
                  <span className="col-span-2">ID Santri</span>
                  <span className="col-span-5">Nama Lengkap Santri</span>
                  <span className="col-span-4 text-right">Cabang Lomba</span>
                </div>

                {/* 2. Header Khusus Layar Ponsel */}
                <div className="bg-slate-100/80 px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center justify-between sm:hidden">
                  <span>Daftar Delegasi ({entries.length} Santri)</span>
                  <span>Cabang Lomba</span>
                </div>

                {entries.map((item, idx) => (
                  <React.Fragment key={idx}>
                    {/* Tampilan Mobile: Rapi, Lebar Penuh, Tanpa Pemotongan Teks */}
                    <div className="p-3 hover:bg-slate-50/80 transition-colors sm:hidden">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-black text-slate-900 text-xs leading-snug break-words">
                              {item.Nama_Lengkap}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                              <span className="font-mono font-bold text-emerald-800 bg-emerald-50/90 px-1.5 py-0.5 rounded border border-emerald-200/60 shrink-0">
                                {item.ID_Pendaftaran}
                              </span>
                              {item.Catatan && (
                                <span className="text-slate-500 italic truncate max-w-[140px]">
                                  • {item.Catatan}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded-lg bg-emerald-50 text-[#075B45] border border-emerald-200 text-[10.5px] font-bold shrink-0 text-right max-w-[48%] leading-tight break-words">
                          {item.Cabang_Lomba}
                        </span>
                      </div>
                    </div>

                    {/* Tampilan Desktop */}
                    <div className="px-3.5 py-2.5 text-xs hover:bg-slate-50 hidden sm:grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-1 font-bold text-slate-400">{idx + 1}</span>
                      <span className="col-span-2 font-mono font-bold text-emerald-800 text-[11px]">{item.ID_Pendaftaran}</span>
                      <div className="col-span-5 min-w-0 pr-1">
                        <p className="font-black text-slate-900 truncate">{item.Nama_Lengkap}</p>
                        {item.Catatan && (
                          <p className="text-[10px] text-slate-400 truncate">{item.Catatan}</p>
                        )}
                      </div>
                      <span className="col-span-4 text-right font-bold text-slate-700">{item.Cabang_Lomba}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Catatan Kaki */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Status: Menunggu Verifikasi Panitia</span>
              <span>Al-Falah Putak • 1447 H</span>
            </div>
          </div>

          {/* Tombol Aksi Bawah */}
          <div className="space-y-2 pt-2 no-print">
            {/* Tombol Utama: Unduh Rekap PDF Resmi (Format Sama dengan di Daftar Santri) */}
            <button
              type="button"
              onClick={() => generateAndDownloadPdf('download')}
              disabled={isGeneratingPdf}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-all min-h-[46px]"
            >
              <Download className="w-4 h-4 text-[#D9B45B]" />
              <span>{isGeneratingPdf ? 'Menyiapkan PDF...' : 'Unduh Rekap PDF Resmi (Format Surat Resmi)'}</span>
            </button>

            {/* Tombol Sekunder: Cetak PDF Langsung */}
            <button
              type="button"
              onClick={() => generateAndDownloadPdf('print')}
              disabled={isGeneratingPdf}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-300 shadow-2xs flex items-center justify-center space-x-2 cursor-pointer transition-all min-h-[44px]"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Cetak Dokumen PDF Langsung</span>
            </button>

            {/* Tombol Tersier: Daftarkan Kelas Lain */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs border border-slate-200 shadow-2xs flex items-center justify-center space-x-2 cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Daftarkan Kelas Diniyah Lain</span>
            </button>
          </div>

        </div>
      )}

      {/* TAMPILAN 2: KARTU QR INDIVIDUAL PER SANTRI */}
      {viewMode === 'cards' && (
        <div className="space-y-3 animate-fadeIn">
          {entries.length > 1 && (
            <div className="mb-2 flex items-center space-x-2 overflow-x-auto pb-1 no-print">
              <span className="text-[11px] font-bold text-slate-500 shrink-0">Pilih Santri:</span>
              {entries.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedSingleIndex(idx)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    selectedSingleIndex === idx
                      ? 'bg-[#075B45] text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {idx + 1}. {item.Nama_Lengkap?.split(' ')[0]}
                </button>
              ))}
            </div>
          )}

          <SuccessTicket
            registration={entries[selectedSingleIndex] || ticket}
            showActions={false}
            showNotification={false}
          />

          {/* Tombol Aksi Bawah di Halaman Kartu QR */}
          <div className="space-y-2 pt-2 no-print">
            <button
              type="button"
              onClick={() => generateAndDownloadPdf('download')}
              disabled={isGeneratingPdf}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-all min-h-[46px]"
            >
              <Download className="w-4 h-4 text-[#D9B45B]" />
              <span>{isGeneratingPdf ? 'Menyiapkan PDF...' : 'Unduh Rekap PDF Resmi Seluruh Santri'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('rekap')}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs flex items-center justify-center space-x-2 cursor-pointer transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Kembali ke Lembar Rekapitulasi</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
