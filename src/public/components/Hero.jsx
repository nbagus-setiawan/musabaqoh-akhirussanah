import React, { useState } from 'react';
import { 
  Trophy, 
  Users, 
  Dices, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  Search,
  Award
} from 'lucide-react';

export default function Hero({ onGoToForm, onGoToGuide, onGoToStatus }) {
  const [hasCustomPoster, setHasCustomPoster] = useState(true);

  return (
    <div className="space-y-6 sm:space-y-10 pb-8 sm:pb-12">
      
      {/* ================= HERO UTAMA (RESPONSIF MOBILE & DESKTOP) ================= */}
      <section 
        className="relative bg-[#075B45] text-white pt-4 pb-7 sm:pt-8 sm:pb-10 border-b border-[#054736]"
      >
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
          
          {/* Grid Layout: Desktop (Teks Kiri 7 Col, Plakat Kanan 5 Col) | Mobile (Teks Atas, Plakat Bawah) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
            
            {/* ================= KOLOM TEKS (Desktop: Kiri / Mobile: Atas) ================= */}
            <div className="lg:col-span-7 order-1 lg:order-1 text-left space-y-2.5 sm:space-y-3.5">
              
              {/* Badge Identitas Kelembagaan */}
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-[#054736] border border-[#D9B45B]/40 text-[#FBF5E6] text-[10px] sm:text-xs font-semibold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D9B45B] shrink-0"></span>
                <span>Musabaqah Akhirussanah 1447 H / 2026 M</span>
              </div>

              {/* Judul Utama: Proporsional di Desktop (Tidak Kebesaran) & Rapi di Mobile */}
              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#D9B45B]">
                  Pendaftaran Peserta Delegasi
                </p>
                <h1 className="text-xl sm:text-2xl lg:text-[26px] font-black tracking-tight text-white leading-tight">
                  Musabaqah Akhirussanah <br className="hidden sm:inline" />
                  <span className="text-[#D9B45B]">
                    Santri Al-Falah Putak
                  </span>
                </h1>
              </div>

              {/* Tiga Paragraf Deskripsi Resmi - Rapi & Nyaman Dibaca */}
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-[13px] text-emerald-50/95 leading-relaxed max-w-xl">
                <p>
                  Dalam rangka menyemarakkan kegiatan Musabaqah Akhirussanah Santri Tahun 1447 H / 2026 M, Yayasan Pondok Pesantren Salafiyah Al-Falah Putak menyediakan layanan pendaftaran perlombaan secara digital.
                </p>
                <p>
                  Pendaftaran dilaksanakan melalui wali kelas masing-masing untuk memastikan data peserta dan pilihan cabang perlombaan sesuai dengan ketentuan yang telah ditetapkan oleh panitia.
                </p>
                <p className="font-semibold text-[#FBF5E6] pt-0.5">
                  Mari berpartisipasi, mengembangkan potensi, serta menumbuhkan semangat berprestasi melalui berbagai cabang perlombaan.
                </p>
              </div>

              {/* Tombol Aksi: Sangat Rapi di Mobile & Desktop */}
              <div className="pt-1.5 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                <button
                  onClick={onGoToForm}
                  className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg bg-[#D9B45B] hover:bg-[#c7a245] text-slate-950 font-bold text-xs sm:text-[13px] shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                >
                  <span>Daftar Peserta Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                  <button
                    onClick={onGoToGuide}
                    className="w-full sm:w-auto px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-[13px] border border-white/25 transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#D9B45B]" />
                    <span>Petunjuk</span>
                  </button>

                  {onGoToStatus && (
                    <button
                      onClick={onGoToStatus}
                      className="w-full sm:w-auto px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-lg bg-transparent hover:bg-white/10 text-emerald-100 hover:text-white font-semibold text-xs border border-emerald-400/30 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5 text-[#D9B45B]" />
                      <span>Cek Status</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* ================= KOLOM PLAKAT / POSTER (Desktop: Kanan / Mobile: Bawah) ================= */}
            <div className="lg:col-span-5 order-2 lg:order-2 flex justify-center lg:justify-end mt-2 lg:mt-0">
              <div className="w-full max-w-[310px] sm:max-w-[330px] bg-[#054736] rounded-xl border border-[#D9B45B]/60 shadow-lg overflow-hidden text-center relative">
                
                {/* Header Plakat Resmi */}
                <div className="bg-[#033427] px-3.5 py-2 border-b border-[#D9B45B]/40 flex items-center justify-between text-left">
                  <div className="flex items-center space-x-2">
                    <img 
                      src="/logo.webp" 
                      alt="Logo Pesantren Al-Falah Putak" 
                      className="w-5 h-5 object-contain"
                    />
                    <span className="text-[10px] font-black uppercase tracking-wider text-white">
                      AL-FALAH PUTAK
                    </span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#D9B45B] text-slate-950 font-mono">
                    1447 H / 2026 M
                  </span>
                </div>

                {/* Body Plakat: Jika ada poster.webp tampilkan foto; jika belum, render plakat resmi elegan */}
                <div className="p-3.5 sm:p-4 space-y-2.5">
                  
                  {hasCustomPoster ? (
                    <img 
                      src="/poster.webp" 
                      alt="Poster Resmi Musabaqah Akhirussanah"
                      onError={() => setHasCustomPoster(false)}
                      className="w-full h-auto rounded-lg object-cover shadow-xs border border-[#D9B45B]/30"
                    />
                  ) : (
                    <div className="space-y-2.5">
                      {/* Logo Resmi dengan Ring Emas */}
                      <div className="w-16 h-16 mx-auto p-2 bg-white rounded-2xl shadow-md border-2 border-[#D9B45B] flex items-center justify-center">
                        <img 
                          src="/logo.webp" 
                          alt="Logo Pesantren Al-Falah Putak" 
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Identitas Lembaga */}
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-[#D9B45B] uppercase tracking-wider block">
                          Yayasan Pondok Pesantren Salafiyah
                        </span>
                        <h2 className="text-base font-black text-white tracking-wide">
                          AL-FALAH PUTAK
                        </h2>
                        <p className="text-[10px] text-emerald-200">
                          Gelumbang, Muara Enim, Sumatera Selatan
                        </p>
                      </div>

                      {/* Banner Musabaqah */}
                      <div className="py-2 px-3 rounded-lg bg-[#033427] border border-[#D9B45B]/40 space-y-0.5">
                        <span className="text-[10.5px] font-extrabold text-white block uppercase tracking-wider">
                          Musabaqah Akhirussanah Santri
                        </span>
                        <span className="text-[11px] font-bold text-[#D9B45B] block">
                          Tahun Ajaran 1447 H / 2026 M
                        </span>
                      </div>

                      {/* 2 Kolom Info Ringkas */}
                      <div className="grid grid-cols-2 gap-1.5 text-left text-[10px] text-emerald-100">
                        <div className="p-1.5 rounded bg-black/20 border border-white/10">
                          <span className="font-bold text-white block">11 Cabang</span>
                          <span className="text-[9px] text-emerald-200">Ula, Wustho, Ulya</span>
                        </div>
                        <div className="p-1.5 rounded bg-black/20 border border-white/10">
                          <span className="font-bold text-white block">Wali Kelas</span>
                          <span className="text-[9px] text-emerald-200">Koordinator Delegasi</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-1.5 border-t border-white/10 text-center">
                    <span className="text-[9.5px] text-emerald-200 font-medium">
                      Pendaftaran Resmi Delegasi Santri Antar Kelas
                    </span>
                  </div>

                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ================= 4 KARTU INFORMASI (MOBILE 2x2 GRID & DESKTOP 4 COLS) ================= */}
      <section className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-xl mx-auto mb-3.5 sm:mb-6">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            Ketentuan Layanan Pendaftaran Digital
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Kemudahan pendataan santri secara tertib dan transparan
          </p>
        </div>

        {/* 2 Kolom di Mobile, 4 Kolom di Desktop: Tanpa Kalimat Terpotong */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-[#075B45] transition-colors">
            <div className="space-y-1.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#EAF4F0] text-[#075B45] flex items-center justify-center font-bold">
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">11 Cabang Lomba</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tersedia untuk jenjang Ula, Wustho, dan Ulya.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-[#075B45] transition-colors">
            <div className="space-y-1.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#EAF4F0] text-[#075B45] flex items-center justify-center font-bold">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">Wali Kelas</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Pendaftaran melalui wali kelas masing-masing.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-[#075B45] transition-colors">
            <div className="space-y-1.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                <Dices className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D9B45B]" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">Nomor Peserta</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Diundi secara acak dan transparan oleh panitia.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-[#075B45] transition-colors">
            <div className="space-y-1.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">Gratis 100%</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Seluruh pendaftaran bebas biaya registrasi.
              </p>
            </div>
          </div>

        </div>

      </section>

      {/* ================= AJAKAN SUKSESKAN (COMPACT & BERSIH) ================= */}
      <section className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div 
          className="rounded-xl p-3.5 sm:p-5 text-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border border-[#054736]"
          style={{ background: 'linear-gradient(135deg, #054736 0%, #075B45 100%)' }}
        >
          <div className="space-y-0.5 text-center sm:text-left">
            <h2 className="text-xs sm:text-sm font-bold tracking-tight text-white">
              Mari Ikuti dan Sukseskan Perlombaan Akhirussanah!
            </h2>
            <p className="text-[11px] sm:text-xs text-emerald-100/90 leading-relaxed max-w-xl">
              Tunjukkan kemampuan terbaik, junjung sportivitas, dan jadikan perlombaan ini sarana mengasah potensi santri.
            </p>
          </div>
          <div className="w-full sm:w-auto flex items-center gap-2 shrink-0">
            <button
              onClick={onGoToForm}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-[#D9B45B] hover:bg-[#c7a245] text-slate-950 font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <span>Daftar Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onGoToGuide}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#D9B45B]" />
              <span>Petunjuk</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
