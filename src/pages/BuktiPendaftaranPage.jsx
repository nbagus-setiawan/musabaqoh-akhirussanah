import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  FileQuestion, 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  Printer, 
  User, 
  Trophy, 
  Layers, 
  Phone, 
  UserCheck, 
  FileText,
  RotateCcw
} from 'lucide-react';
import SuccessTicket from '../public/components/SuccessTicket';

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

  // State tampilan: 'batch' (rekap kolektif), 'cards' (semua kartu peserta massal), 'complete' (cetak lengkap rekap + seluruh kartu)
  const [viewMode, setViewMode] = useState(() => (batchResult?.entries?.length > 1 ? 'batch' : 'cards'));
  const [selectedCardFilter, setSelectedCardFilter] = useState('all');

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
  const meta = batchResult?.metadata || {
    waliKelas: ticket?.Wali_Kelas,
    kelasDiniyah: ticket?.Kelas_Kategori,
    tingkat: ticket?.Tingkat,
    nomorWA: ticket?.Nomor_WA
  };

  const handlePrint = (targetMode) => {
    if (targetMode && targetMode !== viewMode) {
      setViewMode(targetMode);
      if (targetMode === 'cards') {
        setSelectedCardFilter('all');
      }
      setTimeout(() => {
        window.print();
      }, 200);
    } else {
      if (viewMode === 'cards' && selectedCardFilter !== 'all') {
        setSelectedCardFilter('all');
        setTimeout(() => {
          window.print();
        }, 200);
      } else {
        window.print();
      }
    }
  };

  const formatTingkat = (val) => {
    if (!val) return '-';
    const lower = String(val).toLowerCase().trim();
    if (lower === 'ula') return 'Tingkat Ula';
    if (lower === 'wustho') return 'Tingkat Wustho';
    if (lower === 'ulya') return 'Tingkat Ulya';
    return val;
  };

  // Komponen Kartu Cetak Rekap Resmi
  const renderRekapCard = () => (
    <div id="printable-rekap-kelas" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-slate-800 print-avoid-break">
      
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
      <div className="p-3 sm:p-4 bg-slate-50/90 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 text-xs">
        <div>
          <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kelas Diniyah</span>
          <span className="font-black text-[#075B45] text-xs sm:text-sm block truncate">{meta.kelasDiniyah || '-'}</span>
        </div>
        <div>
          <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Wali Kelas</span>
          <span className="font-bold text-slate-900 block truncate">{meta.waliKelas || '-'}</span>
        </div>
        <div>
          <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jenjang</span>
          <span className="font-bold text-slate-800 block truncate">{formatTingkat(meta.tingkat)}</span>
        </div>
        <div>
          <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kontak WA</span>
          <span className="font-bold text-slate-800 block truncate">{meta.nomorWA || '-'}</span>
        </div>
      </div>

      {/* Tabel / Daftar Delegasi Santri */}
      <div className="p-2.5 sm:p-4">
        <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
          
          {/* 1. Header Khusus Desktop & Cetak */}
          <div className="bg-slate-100/80 px-3.5 py-2.5 text-[10.5px] font-black text-slate-600 uppercase tracking-wider hidden sm:grid print:grid grid-cols-12 gap-2">
            <span className="col-span-1">No</span>
            <span className="col-span-2">ID Santri</span>
            <span className="col-span-5">Nama Lengkap Santri</span>
            <span className="col-span-4 text-right">Cabang Lomba</span>
          </div>

          {/* 2. Header Khusus Tampilan Mobile */}
          <div className="bg-slate-100/80 px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center justify-between sm:hidden print:hidden">
            <span>Daftar Delegasi ({entries.length} Santri)</span>
            <span>Cabang Lomba</span>
          </div>

          {entries.map((item, idx) => (
            <React.Fragment key={idx}>
              {/* Tampilan Mobile: Elegan, Lebar Penuh, Tanpa Pemotongan Teks */}
              <div className="p-3 hover:bg-slate-50/80 transition-colors sm:hidden print:hidden">
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

              {/* Tampilan Desktop & Cetak (Formal Grid Table) */}
              <div className="px-3.5 py-2.5 text-xs hover:bg-slate-50 hidden sm:grid print:grid grid-cols-12 gap-2 items-center">
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
        <span>Status Pendaftaran: Menunggu Verifikasi Panitia</span>
        <span>Al-Falah Putak • 1447 H</span>
      </div>
    </div>
  );

  // Komponen Seluruh Kartu Peserta Massal
  const renderAllCardsList = () => (
    <div className="space-y-4 sm:space-y-6">
      {entries.map((item, idx) => (
        <div key={idx} className="print-avoid-break">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1 px-1 no-print">
            <span>Kartu Peserta #{idx + 1} dari {entries.length}</span>
            <span className="font-mono text-emerald-800 font-bold">{item.ID_Pendaftaran}</span>
          </div>
          <SuccessTicket
            registration={item}
            showActions={false}
            showNotification={false}
            className="w-full"
          />
          {/* Garis Pemotong Khusus Cetak */}
          {idx < entries.length - 1 && (
            <div className="hidden print:block my-6 border-b border-dashed border-slate-300 text-center relative">
              <span className="bg-white px-3 text-[8.5px] font-mono text-slate-400 uppercase tracking-widest relative -top-2.5">
                Gunting di sini
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="py-2 sm:py-5 max-w-2xl mx-auto px-3 sm:px-4 font-sans select-none">
      
      {/* Switch Mode jika pendaftaran kolektif (lebih dari 1 santri) */}
      {entries.length > 1 && (
        <div className="mb-3 flex items-center justify-between gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs no-print">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setViewMode('batch')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center truncate cursor-pointer ${
                viewMode === 'batch'
                  ? 'bg-[#075B45] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="sm:hidden">Rekap ({entries.length})</span>
              <span className="hidden sm:inline">Rekapitulasi Kelas ({entries.length} Santri)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('cards');
                setSelectedCardFilter('all');
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center truncate cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#075B45] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="sm:hidden">Semua Kartu ({entries.length})</span>
              <span className="hidden sm:inline">Semua Kartu Peserta ({entries.length} Santri)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handlePrint()}
            aria-label="Cetak Dokumen"
            className="shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {viewMode === 'batch' 
                ? 'Cetak Rekap' 
                : viewMode === 'complete' 
                ? 'Cetak Lengkap' 
                : `Cetak Semua Kartu (${entries.length})`}
            </span>
            <span className="sm:hidden">
              {viewMode === 'batch' ? 'Cetak Rekap' : 'Cetak Semua'}
            </span>
          </button>
        </div>
      )}

      {/* TAMPILAN 1: REKAPITULASI KOLEKTIF KELAS DINIYAH */}
      {viewMode === 'batch' && entries.length > 0 && (
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
                  Data telah tersimpan di sistem panitia dan spreadsheet resmi
                </p>
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-black bg-white text-[#075B45] border border-emerald-200 px-2.5 py-1 rounded-xl shrink-0 whitespace-nowrap shadow-2xs">
              {entries.length} Santri
            </span>
          </div>

          {/* Kartu Cetak Rekap Resmi Kelas Diniyah */}
          {renderRekapCard()}

          {/* Tombol Aksi Bawah */}
          <div className="space-y-2 pt-2 no-print">
            <button
              type="button"
              onClick={() => handlePrint('batch')}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-all min-h-[46px]"
            >
              <Printer className="w-4 h-4 text-[#D9B45B]" />
              <span>Cetak Lembar Rekapitulasi Kelas</span>
            </button>
            <button
              type="button"
              onClick={() => handlePrint('cards')}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-[#075B45] font-bold text-xs sm:text-sm border border-emerald-300 shadow-2xs flex items-center justify-center space-x-2 cursor-pointer transition-all min-h-[44px]"
            >
              <Printer className="w-4 h-4 text-[#075B45]" />
              <span>Cetak Semua Kartu Peserta ({entries.length} Santri Sekaligus)</span>
            </button>
            <button
              type="button"
              onClick={() => handlePrint('complete')}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs flex items-center justify-center space-x-2 cursor-pointer transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Cetak Lengkap (Rekap + Seluruh Kartu Sekaligus)</span>
            </button>
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

      {/* TAMPILAN 2: SEMUA KARTU PESERTA (MASS PRINT READY) */}
      {viewMode === 'cards' && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* Header Info Cetak Massal */}
          <div className="p-3 sm:p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center justify-between gap-2.5 shadow-2xs no-print">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#075B45] text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-emerald-950 leading-tight truncate">
                  Semua Kartu Peserta ({entries.length} Santri)
                </h3>
                <p className="text-[10.5px] sm:text-[11px] text-emerald-800 mt-0.5 leading-tight truncate">
                  Seluruh kartu dicetak sekaligus dalam satu dokumen untuk dibagikan
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handlePrint('cards')}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-[#075B45] hover:bg-[#054736] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-[#D9B45B]" />
              <span className="hidden sm:inline">Cetak Semua</span>
              <span className="sm:hidden">Cetak</span>
            </button>
          </div>

          {/* Filter Bar (Khusus Layar, Disembunyikan Saat Cetak) */}
          {entries.length > 1 && (
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-print">
              <span className="text-[10.5px] font-bold text-slate-500 shrink-0">Tampilkan:</span>
              <button
                type="button"
                onClick={() => setSelectedCardFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCardFilter === 'all'
                    ? 'bg-[#075B45] text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Semua ({entries.length} Kartu)
              </button>
              {entries.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedCardFilter(idx)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    selectedCardFilter === idx
                      ? 'bg-[#075B45] text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {idx + 1}. {item.Nama_Lengkap?.split(' ')[0]}
                </button>
              ))}
            </div>
          )}

          {/* Daftar Kartu Peserta */}
          {selectedCardFilter === 'all' ? (
            renderAllCardsList()
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-xl no-print">
                <span className="text-xs font-bold text-slate-700">
                  Menampilkan santri ke-{Number(selectedCardFilter) + 1} dari {entries.length}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCardFilter('all')}
                  className="text-xs font-bold text-[#075B45] hover:underline cursor-pointer"
                >
                  Tampilkan Semua Kartu
                </button>
              </div>
              <SuccessTicket
                registration={entries[selectedCardFilter] || ticket}
                onRegisterAnother={() => navigate('/')}
                onBackHome={() => navigate('/')}
              />
            </div>
          )}

          {/* Tombol Aksi Bawah */}
          <div className="space-y-2 pt-2 no-print">
            <button
              type="button"
              onClick={() => handlePrint('cards')}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-all min-h-[46px]"
            >
              <Printer className="w-4 h-4 text-[#D9B45B]" />
              <span>Cetak Semua Kartu Peserta ({entries.length} Santri Sekaligus)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('batch')}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-300 shadow-2xs flex items-center justify-center space-x-2 cursor-pointer transition-all min-h-[44px]"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Lihat & Cetak Rekapitulasi Kelas</span>
            </button>
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

      {/* TAMPILAN 3: CETAK LENGKAP (REKAPITULASI + SEMUA KARTU SEKALIGUS) */}
      {viewMode === 'complete' && (
        <div className="space-y-4 animate-fadeIn">
          
          <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs no-print">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-emerald-950">
                Mode Cetak Lengkap (Rekap + Semua Kartu)
              </h3>
              <p className="text-[10.5px] text-emerald-800 mt-0.5">
                Lembar rekapitulasi kelas dan seluruh {entries.length} kartu santri dicetak berurutan
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-[#075B45] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#D9B45B]" />
              <span>Cetak Sekarang</span>
            </button>
          </div>

          {/* 1. Halaman Pertama: Lembar Rekapitulasi */}
          {renderRekapCard()}

          {/* Pemisah Halaman untuk Cetak */}
          <div className="print-page-break my-6 border-b border-dashed border-slate-300"></div>

          {/* 2. Halaman Berikutnya: Seluruh Kartu Peserta */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 no-print">
              Lampiran Seluruh Kartu Tanda Peserta ({entries.length} Santri)
            </h3>
            {renderAllCardsList()}
          </div>

          {/* Tombol Aksi Bawah */}
          <div className="space-y-2 pt-2 no-print">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-all min-h-[46px]"
            >
              <Printer className="w-4 h-4 text-[#D9B45B]" />
              <span>Cetak Dokumen Lengkap Sekarang</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('batch')}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs border border-slate-200 shadow-2xs flex items-center justify-center space-x-2 cursor-pointer transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Kembali ke Tampilan Rekapitulasi</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
