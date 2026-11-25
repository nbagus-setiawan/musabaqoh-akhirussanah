import React, { useState } from 'react';
import { Search, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CheckStatus({ registrations, onViewTicket }) {
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const clean = query.trim().toLowerCase();

  const searchResults = clean ? registrations.filter(item => {
    const wa = (item.Nomor_WA || '').toLowerCase();
    const id = (item.ID_Pendaftaran || '').toLowerCase();
    const nama = (item.Nama_Lengkap || '').toLowerCase();
    return wa.includes(clean) || id.includes(clean) || nama.includes(clean);
  }) : [];

  const handleSearch = (e) => {
    e.preventDefault();
    setHasSearched(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4">
      
      {/* Kartu Utama Ber-Header Hijau Khas Al-Falah Putak */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        
        {/* Header Form Resmi */}
        <div className="bg-[#075B45] text-white px-4 sm:px-6 py-4 sm:py-5 border-b border-[#054736]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/20">
                <Search className="w-5 h-5 text-[#D9B45B]" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white">
                  Cek Status Pendaftaran Delegasi
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-tight mt-0.5">
                  Musabaqah Akhirussanah 1447 H / 2026 M • Al-Falah Putak
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider bg-white/10 text-emerald-100 px-3 py-1 rounded-full border border-white/10">
              Al-Falah Putak
            </span>
          </div>
        </div>

        {/* Isi Form Pencarian */}
        <div className="p-4 sm:p-5 space-y-3.5">
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block">
              Pencarian Data Delegasi <span className="text-slate-400 font-normal">(Nomor WhatsApp / ID / Nama Santri)</span>
            </label>
            <div className="flex gap-2 p-1.5 bg-white rounded-xl border border-slate-300 shadow-2xs focus-within:border-[#075B45] focus-within:ring-2 focus-within:ring-[#075B45]/20 transition-all">
              <div className="relative flex-1 min-w-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Ketik nama santri, no WA wali kelas, atau ID..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setHasSearched(false);
                  }}
                  className="w-full pl-9 pr-3 py-2 outline-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium bg-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs shadow-xs transition-all shrink-0 cursor-pointer active:scale-95 flex items-center space-x-1.5"
              >
                <span>Cari</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D9B45B]" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Gunakan nama santri, nomor peserta, ID pendaftaran, atau nomor WhatsApp wali kelas yang didaftarkan.
            </p>
          </form>
        </div>
      </div>

      {/* Hasil Pencarian */}
      {hasSearched && (
        <div className="space-y-3">
          
          {searchResults.length > 0 ? (
            <>
              {/* Pesan Apabila Data Ditemukan */}
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Data pendaftaran berhasil ditemukan. Silakan periksa kembali informasi peserta dan nomor peserta yang tercantum.
                </p>
              </div>

              {/* Kartu Informasi Peserta */}
              {searchResults.map((item, idx) => (
                <div 
                  key={idx}
                  className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                          {item.ID_Pendaftaran}
                        </span>
                        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                          item.Status === 'Terverifikasi'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.Status === 'Ditolak'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.Status === 'Terverifikasi' ? 'Terverifikasi' : item.Status === 'Ditolak' ? 'Ditolak' : 'Menunggu Verifikasi'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">
                        {item.Nama_Lengkap}
                      </h3>
                    </div>

                    {/* Nomor Peserta */}
                    <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">
                        Nomor Peserta:
                      </span>
                      {item.Nomor_Urut ? (
                        <span className="text-xl font-black text-[#075B45] font-mono tracking-wider block">
                          {item.Nomor_Urut}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-800 italic block mt-0.5">
                          Menunggu Pengundian Panitia
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Wali Kelas:</span>
                      <strong className="text-slate-800">{item.Wali_Kelas}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Tingkat / Kelas:</span>
                      <strong className="text-slate-800">{item.Kelas_Kategori}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9.5px] uppercase font-bold">Cabang Perlombaan:</span>
                      <strong className="text-[#075B45]">{item.Cabang_Lomba}</strong>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end border-t border-slate-100">
                    <button
                      onClick={() => onViewTicket(item)}
                      className="text-xs font-bold text-[#075B45] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Lihat Kartu Bukti Pendaftaran</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              ))}
            </>
          ) : (
            /* Pesan Apabila Data Belum Ditemukan */
            <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-xs text-slate-700 max-w-md mx-auto leading-relaxed">
                Maaf, data pendaftaran belum ditemukan. Silakan periksa kembali informasi yang dimasukkan atau hubungi wali kelas maupun panitia untuk mendapatkan bantuan.
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
