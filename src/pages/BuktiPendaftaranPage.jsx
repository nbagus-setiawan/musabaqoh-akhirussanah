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

  return (
    <div className="py-2 sm:py-5 max-w-2xl mx-auto px-3 sm:px-4 font-sans select-none">
      
      {/* Switch Mode jika pendaftaran kolektif (lebih dari 1 santri) */}
      {entries.length > 1 && (
        <div className="mb-3 flex items-center justify-between bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs no-print">
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setViewMode('batch')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'batch'
                  ? 'bg-[#075B45] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Rekapitulasi Kelas Diniyah ({entries.length} Santri)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-[#075B45] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Kartu Per Santri
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Bukti</span>
          </button>
        </div>
      )}

      {/* TAMPILAN 1: REKAPITULASI KOLEKTIF KELAS DINIYAH */}
      {viewMode === 'batch' && entries.length > 0 ? (
        <div className="space-y-4 animate-fadeIn">
          
          {/* Header Notifikasi Sukses */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 shadow-2xs no-print">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-emerald-950">
                  Seluruh Delegasi Berhasil Didaftarkan
                </h3>
                <p className="text-[11px] text-emerald-800">
                  Data telah tersimpan di sistem panitia dan Google Sheets
                </p>
              </div>
            </div>
            <span className="text-xs font-bold bg-white text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-xl shrink-0">
              {entries.length} Santri
            </span>
          </div>

          {/* Kartu Cetak Rekap Resmi Kelas Diniyah */}
          <div id="printable-rekap-kelas" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-slate-800">
            
            {/* Kop Resmi Pesantren Al-Falah Putak */}
            <div 
              className="p-4 sm:p-5 text-white relative border-b-2 border-[#D9B45B]"
              style={{
                backgroundColor: '#054736',
                background: 'linear-gradient(135deg, #054736 0%, #075B45 60%, #033427 100%)'
              }}
            >
              <div className="flex items-center space-x-3">
                <img 
                  src="/logo.webp" 
                  alt="Logo Al-Falah Putak" 
                  className="w-12 h-12 object-contain shrink-0 drop-shadow-sm" 
                />
                <div className="leading-tight min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9B45B] block truncate">
                    YPPS AL-FALAH PUTAK
                  </span>
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-white uppercase truncate">
                    BUKTI PENDAFTARAN DELEGASI KELAS DINIYAH
                  </h2>
                  <span className="text-[10.5px] text-emerald-100 font-medium block">
                    Musabaqah Akhirussanah 1447 H / 2026 M
                  </span>
                </div>
              </div>
            </div>

            {/* Identitas Kelas Diniyah */}
            <div className="p-3.5 sm:p-4 bg-slate-50/90 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kelas Diniyah</span>
                <span className="font-black text-[#075B45] text-sm block truncate">{meta.kelasDiniyah}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Wali Kelas</span>
                <span className="font-bold text-slate-900 block truncate">{meta.waliKelas}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jenjang</span>
                <span className="font-bold text-slate-800 block truncate">{meta.tingkat}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kontak WA</span>
                <span className="font-bold text-slate-800 block truncate">{meta.nomorWA}</span>
              </div>
            </div>

            {/* Tabel Daftar Delegasi Santri */}
            <div className="p-3 sm:p-4">
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                <div className="bg-slate-100/80 px-3.5 py-2 text-[10.5px] font-black text-slate-600 uppercase tracking-wider grid grid-cols-12 gap-2">
                  <span className="col-span-1">No</span>
                  <span className="col-span-3">ID Santri</span>
                  <span className="col-span-5">Nama Lengkap Santri</span>
                  <span className="col-span-3 text-right">Cabang Lomba</span>
                </div>
                {entries.map((item, idx) => (
                  <div key={idx} className="px-3.5 py-2.5 text-xs hover:bg-slate-50 grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-1 font-bold text-slate-400">{idx + 1}</span>
                    <span className="col-span-3 font-mono font-bold text-emerald-800">{item.ID_Pendaftaran}</span>
                    <div className="col-span-5 min-w-0 pr-1">
                      <p className="font-black text-slate-900 truncate">{item.Nama_Lengkap}</p>
                      {item.Catatan && (
                        <p className="text-[10px] text-slate-400 truncate">{item.Catatan}</p>
                      )}
                    </div>
                    <span className="col-span-3 text-right font-bold text-slate-700 truncate">{item.Cabang_Lomba}</span>
                  </div>
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
              onClick={() => navigate('/')}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-all min-h-[46px]"
            >
              <RotateCcw className="w-4 h-4 text-[#D9B45B]" />
              <span>Daftarkan Kelas Diniyah Lain</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-300 shadow-2xs flex items-center justify-center space-x-2 cursor-pointer transition-all min-h-[44px]"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Cetak / Simpan Bukti PDF</span>
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
