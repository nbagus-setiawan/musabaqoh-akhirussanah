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

  // State tampilan: 'batch' (rekap kolektif kelas diniyah) atau 'single' (tiket per santri)
  const [viewMode, setViewMode] = useState(() => (batchResult?.entries?.length > 1 ? 'batch' : 'single'));
  const [selectedSingleIndex, setSelectedSingleIndex] = useState(0);

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

  const handlePrint = () => {
    window.print();
  };

  const formatTingkat = (val) => {
    if (!val) return '-';
    const lower = String(val).toLowerCase().trim();
    if (lower === 'ula') return 'Tingkat Ula';
    if (lower === 'wustho') return 'Tingkat Wustho';
    if (lower === 'ulya') return 'Tingkat Ulya';
    return val;
  };

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
              onClick={() => setViewMode('single')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center truncate cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-[#075B45] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="sm:hidden">Per Santri</span>
              <span className="hidden sm:inline">Kartu Per Santri</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            aria-label="Cetak Bukti"
            className="shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cetak Bukti</span>
            <span className="sm:hidden">Cetak</span>
          </button>
        </div>
      )}

      {/* TAMPILAN 1: REKAPITULASI KOLEKTIF KELAS DINIYAH */}
      {viewMode === 'batch' && entries.length > 0 ? (
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

          {/* Tombol Aksi Bawah */}
          <div className="space-y-2 pt-2 no-print">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-all min-h-[46px]"
            >
              <Printer className="w-4 h-4 text-[#D9B45B]" />
              <span>Cetak / Simpan Bukti PDF</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-300 shadow-2xs flex items-center justify-center space-x-2 cursor-pointer transition-all min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Daftarkan Kelas Diniyah Lain</span>
            </button>
          </div>

        </div>
      ) : (
        /* TAMPILAN 2: KARTU INDIVIDU (SUCCESS TICKET) */
        <div>
          {entries.length > 1 && (
            <div className="mb-3 flex items-center space-x-2 overflow-x-auto pb-1 no-print">
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
            onRegisterAnother={() => navigate('/')}
            onBackHome={() => navigate('/')}
          />
        </div>
      )}

    </div>
  );
}
