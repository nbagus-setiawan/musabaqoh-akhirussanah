import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  Trophy,
  Users,
  Building2,
  PhoneCall,
  Search,
  BookOpen,
  Sparkles,
  ShieldAlert,
  ListOrdered,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CABANG_LOMBA_LIST, SUB_KELAS_BY_TINGKAT } from '../../shared/data/competitions';

export default function GuideInstructions({ onGoToForm, onGoToStatus }) {
  const navigate = useNavigate();
  const [showKelasDetail, setShowKelasDetail] = useState(false);

  const handleGoToForm = () => {
    if (onGoToForm) {
      onGoToForm();
    } else {
      navigate('/formulir');
    }
  };

  const handleGoToStatus = () => {
    if (onGoToStatus) {
      onGoToStatus();
    } else {
      navigate('/status');
    }
  };

  // 6 Aturan Mutlak Panitia Musabaqah Akhirussanah Al-Falah Putak
  const generalRules = [
    {
      num: '1',
      title: 'Kewajiban Pengiriman Delegasi',
      text: 'Setiap kelas wajib mengirimkan delegasi di setiap mata perlombaan yang dibuka oleh panitia.',
      badge: 'Wajib'
    },
    {
      num: '2',
      title: 'Batas Cabang per Santri',
      text: '1 Santri maksimal boleh mengikuti 2 cabang perlombaan (di luar cabang CCM dan Kreasi Nadzom).',
      badge: 'Maks. 2 Lomba'
    },
    {
      num: '3',
      title: 'Batas Delegasi per Kelas Diniyah (Putra & Putri Terpisah)',
      text: 'Setiap Kelas Diniyah (baik kelas putra maupun kelas putri) masing-masing berhak mengirimkan maksimal 3 delegasi santri di setiap cabang perlombaan. Kuota dihitung terpisah per Kelas Diniyah sehingga santri putra dan putri tidak saling mengurangi jatah kuota.',
      badge: 'Maks. 3 per Kelas'
    },
    {
      num: '4',
      title: 'Ketentuan Khusus Juara Provinsi / Kabupaten',
      text: 'Bagi santri yang sudah pernah meraih Juara 1, 2, atau 3 di ajang MPP Sumsel maupun MAFAHIS OKU Timur tidak diperkenankan mengikuti perlombaan MQK dan MHN.',
      badge: 'Khusus Juara'
    },
    {
      num: '5',
      title: 'Ketentuan Juara Bertahan Musabaqah',
      text: 'Bagi santri yang sudah meraih Juara 1 pada Musabaqah Akhirussanah tahun sebelumnya tidak diperkenankan mengikuti cabang perlombaan yang sama.',
      badge: 'Evaluasi Prestasi'
    },
    {
      num: '6',
      title: 'Komitmen Tampil & Ketentuan Ta\'zir',
      text: 'Bagi santri yang namanya sudah didaftarkan, jika tidak mengikuti perlombaan dengan alasan apa pun tanpa izin panitia, maka dikenakan sanksi infaq 1 sak semen dan di-ta\'zir oleh pengurus/panitia.',
      badge: 'Sanksi & Ta\'zir',
      isWarning: true
    }
  ];

  // 7 Langkah Tata Cara Pendaftaran Sistem Digital Terbaru
  const registrationSteps = [
    {
      step: '1',
      title: 'Buka Formulir Pendaftaran',
      desc: 'Akses menu "Daftar Santri" pada navigasi atas atau klik tombol "Daftar Peserta Sekarang" di halaman utama portal.',
      tip: 'Bisa diakses langsung lewat HP maupun komputer.'
    },
    {
      step: '2',
      title: 'Pilih Nama Wali Kelas Terdaftar',
      desc: 'Ketik nama Ustadz / Ustadzah Wali Kelas pada kolom Langkah 1. Pilih nama dari saran yang muncul. Jenjang tingkat (Ula, Wustho) dan Kelas Diniyah otomatis terhubung dari database guru.',
      tip: 'Nama Wali Kelas wajib sudah didaftarkan panitia terlebih dahulu.'
    },
    {
      step: '3',
      title: 'Pilih Cabang Perlombaan',
      desc: 'Pilih salah satu dari 10 cabang perlombaan resmi yang tersedia untuk tingkatan kelas tersebut. Khusus cabang MHQ, pilih kategori hafalan juz yang diikuti (5, 10, 15, 20, 25, atau 30 Juz).',
      tip: 'Pilihan mata lomba disaring otomatis sesuai jenjang kelas.'
    },
    {
      step: '4',
      title: 'Isi Identitas Delegasi Santri & Kontak',
      desc: 'Ketik Nama Lengkap Santri (otomatis diformat huruf besar/kapital), pilih Jenis Kelamin (Putra atau Putri), dan masukkan Nomor WhatsApp resmi Wali Kelas untuk sarana koordinasi panitia.',
      tip: 'Nomor WhatsApp yang dimasukkan adalah nomor kontak Wali Kelas.'
    },
    {
      step: '5',
      title: 'Pemeriksaan Otomatis & Penyorotan Kolom',
      desc: 'Sistem secara cerdas memeriksa seluruh kelengkapan formulir. Apabila terdapat data yang belum terisi atau nama guru belum terdaftar, kolom terkait akan otomatis tersorot merah dengan pesan petunjuk jelas.',
      tip: 'Layar akan scroll dan fokus otomatis ke kolom yang bermasalah.'
    },
    {
      step: '6',
      title: 'Pratinjau & Konfirmasi Pengiriman',
      desc: 'Klik tombol "Lanjut ke Konfirmasi Data" untuk melihat rangkuman delegasi. Setelah memastikan seluruh data santri, kelas, dan cabang lomba sudah benar, klik tombol "Kirim Pendaftaran Sekarang".',
      tip: 'Data langsung tersimpan aman ke database spreadsheet panitia.'
    },
    {
      step: '7',
      title: 'Simpan Bukti & Daftarkan Delegasi Lainnya',
      desc: 'Simpan kartu bukti pendaftaran digital yang diterbitkan. Untuk mendaftarkan delegasi santri berikutnya dari kelas yang sama, klik tombol "Daftarkan Peserta Lain" — Nama Wali Kelas, Kelas Diniyah, dan Nomor WhatsApp otomatis tetap tersimpan tanpa perlu diketik ulang.',
      tip: 'Nama Wali, Kelas Diniyah, dan No. WA tetap tersimpan untuk delegasi berikutnya.'
    }
  ];

  // 10 Cabang Lomba Resmi
  const competitionList = CABANG_LOMBA_LIST || [];

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3 sm:py-7 space-y-4 sm:space-y-6">
      
      {/* ================= HEADER RESMI ================= */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        
        {/* Header Resmi Khas Al-Falah Putak */}
        <div className="bg-[#075B45] text-white px-4 sm:px-6 py-4 sm:py-5 border-b border-[#054736]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/20">
                <FileText className="w-5 h-5 text-[#D9B45B]" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white">
                  Petunjuk & Tata Cara Pendaftaran Delegasi
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/90 leading-tight mt-0.5">
                  Musabaqah Akhirussanah 1447 H / 2026 M • YPPS Al-Falah Putak
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider bg-white/10 text-emerald-100 px-3 py-1 rounded-full border border-white/10">
              Al-Falah Putak
            </span>
          </div>
        </div>

        {/* Pengantar & Tombol Aksi Cepat */}
        <div className="p-4 sm:p-5 bg-emerald-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed max-w-xl">
            Panduan lengkap ketentuan delegasi santri antar-kelas, batas kuota 3 delegasi per Kelas Diniyah putra/putri terpisah, serta sistem poin penentuan Juara Umum Kelas.
          </p>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleGoToForm}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <span>Buka Formulir</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D9B45B]" />
            </button>
            <button
              onClick={handleGoToStatus}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 shadow-2xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[#075B45]" />
              <span>Cek Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= BAGIAN A: KETENTUAN UMUM (6 ATURAN WAJIB) ================= */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#075B45] text-[#D9B45B] flex items-center justify-center font-bold text-xs shadow-2xs">
              A
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                Ketentuan Umum & Tata Tertib Perlombaan
              </h2>
              <p className="text-[10.5px] sm:text-[11px] text-slate-500">
                6 ketentuan mutlak yang wajib dipatuhi oleh seluruh santri dan wali kelas
              </p>
            </div>
          </div>
          <span className="text-[10px] sm:text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#075B45] border border-emerald-200 shrink-0">
            6 Poin Wajib
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {generalRules.map((rule) => (
            <div 
              key={rule.num}
              className={`p-3 rounded-xl border transition-all ${
                rule.isWarning
                  ? 'bg-rose-50/40 border-rose-200 md:col-span-2'
                  : 'bg-slate-50/70 hover:bg-[#EAF4F0]/40 border-slate-200/80'
              }`}
            >
              <div className="flex items-start space-x-2.5">
                <div className={`w-6 h-6 rounded-lg text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                  rule.isWarning ? 'bg-rose-600' : 'bg-[#075B45]'
                }`}>
                  {rule.num}
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <h3 className={`text-xs font-bold leading-tight ${
                      rule.isWarning ? 'text-rose-900' : 'text-slate-900'
                    }`}>
                      {rule.title}
                    </h3>
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded shrink-0 ${
                      rule.isWarning 
                        ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                        : 'bg-emerald-100/70 text-emerald-800'
                    }`}>
                      {rule.badge}
                    </span>
                  </div>
                  <p className={`text-[11px] sm:text-xs leading-relaxed ${
                    rule.isWarning ? 'text-rose-800 font-medium' : 'text-slate-700'
                  }`}>
                    {rule.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= BAGIAN B: TATA CARA PENDAFTARAN (7 LANGKAH) ================= */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#075B45] text-[#D9B45B] flex items-center justify-center font-bold text-xs shadow-2xs">
              B
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                Tata Cara Pendaftaran Delegasi (7 Langkah)
              </h2>
              <p className="text-[10.5px] sm:text-[11px] text-slate-500">
                Alur pengisian formulir online secara praktis dari awal hingga mendapatkan bukti pendaftaran
              </p>
            </div>
          </div>
          <span className="text-[10px] sm:text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
            Alur Resmi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {registrationSteps.map((st, idx) => (
            <div 
              key={st.step}
              className={`p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 flex flex-col justify-between space-y-2 hover:border-emerald-300 transition-all ${
                idx === 6 ? 'md:col-span-2 bg-emerald-50/50 border-emerald-300' : ''
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <div className="w-5.5 h-5.5 rounded-md bg-[#075B45] text-[#D9B45B] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                    {st.step}
                  </div>
                  <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug">
                    Langkah {st.step}: {st.title}
                  </h3>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed pl-7.5">
                  {st.desc}
                </p>
              </div>

              {/* Tip Tambahan */}
              <div className="pl-7.5 pt-1 border-t border-slate-200/50 flex items-center space-x-1.5 text-[10.5px] text-slate-500">
                <Sparkles className="w-3 h-3 text-[#D9B45B] shrink-0" />
                <span className="italic">{st.tip}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= BAGIAN C: 10 CABANG PERLOMBAAN & KELAS DINIYAH ================= */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#075B45] text-[#D9B45B] flex items-center justify-center font-bold text-xs shadow-2xs">
              C
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                Daftar 10 Cabang Perlombaan Resmi
              </h2>
              <p className="text-[10.5px] sm:text-[11px] text-slate-500">
                Mata musabaqah yang diperlombakan pada Akhirussanah 1447 H / 2026 M
              </p>
            </div>
          </div>
          <span className="text-[10px] sm:text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF4F0] text-[#075B45] border border-[#075B45]/20 shrink-0">
            10 Mata Lomba
          </span>
        </div>

        {/* Grid 10 Cabang Lomba */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
          {competitionList.map((c, index) => (
            <div 
              key={c.id || c.name}
              className="p-2.5 sm:p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-start space-x-2.5 hover:bg-emerald-50/30 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-[#075B45] font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-xs sm:text-[12.5px] font-bold text-slate-900 truncate">
                    {c.fullName || c.name}
                  </h3>
                </div>
                <p className="text-[10.5px] text-slate-600 line-clamp-2">
                  {c.description}
                </p>
                <div className="pt-1 flex flex-wrap gap-1">
                  <span className="text-[9.5px] font-semibold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200/60">
                    Jenjang: Ula, Wustho
                  </span>
                  {c.isMHQ && (
                    <span className="text-[9.5px] font-semibold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                      5, 10, 15, 20, 25, 30 Juz
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Toggle Lihat Rincian Kelas Diniyah Lengkap */}
        <div className="pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowKelasDetail(!showKelasDetail)}
            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-[#075B45]" />
              <span>Lihat Pembagian Jenjang Tingkat & Kelas Diniyah Lengkap</span>
            </div>
            {showKelasDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showKelasDetail && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs animate-fadeIn">
              {/* ULA */}
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between pb-1 border-b border-emerald-200/70">
                  <span className="font-extrabold text-emerald-950">Tingkat Ula</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                    16 Kelas (Pa/Pi)
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">Sifir & Jurumiyah</p>
                <ul className="text-[11px] text-slate-700 space-y-0.5 pl-3 list-disc">
                  {(SUB_KELAS_BY_TINGKAT.ula || []).map(k => (
                    <li key={k}><strong className="text-slate-900">{k}</strong></li>
                  ))}
                </ul>
              </div>

              {/* WUSTHO */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1.5">
                <div className="flex items-center justify-between pb-1 border-b border-blue-200/70">
                  <span className="font-extrabold text-blue-950">Tingkat Wustho</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                    8 Kelas (Pa/Pi)
                  </span>
                </div>
                <p className="text-[11px] text-blue-800">Imrithi & Alfiyah</p>
                <ul className="text-[11px] text-slate-700 space-y-0.5 pl-3 list-disc">
                  {(SUB_KELAS_BY_TINGKAT.wustho || []).map(k => (
                    <li key={k}><strong className="text-slate-900">{k}</strong></li>
                  ))}
                </ul>
              </div>

              {/* MHQ */}
              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1.5">
                <div className="flex items-center justify-between pb-1 border-b border-purple-200/70">
                  <span className="font-extrabold text-purple-950">Cabang MHQ</span>
                  <span className="text-[10px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded-full border border-purple-200">
                    6 Kategori Juz
                  </span>
                </div>
                <p className="text-[11px] text-purple-800">Hifdzil Qur'an</p>
                <ul className="text-[11px] text-slate-700 space-y-0.5 pl-3 list-disc">
                  {(SUB_KELAS_BY_TINGKAT.mhq_juz || []).map(k => (
                    <li key={k}><strong className="text-slate-900">{k}</strong></li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Box Skema Bobot Poin Juara Umum Kelas (Skema A) */}
        <div className="mt-3 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-50/90 via-emerald-50/70 to-amber-50/90 border border-amber-300/80 shadow-2xs space-y-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#D9B45B] text-slate-950 flex items-center justify-center font-bold shadow-2xs">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Sistem Poin Penentuan Juara Umum Kelas (Skema A)
              </h3>
              <p className="text-[10.5px] text-slate-600">
                Poin medali disumbangkan langsung untuk kelas santri yang bersangkutan
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 rounded-xl bg-white border border-amber-300 shadow-2xs">
              <span className="text-xs sm:text-sm font-black text-amber-900 block bg-amber-100/80 rounded-md py-1 mb-1 border border-amber-200">
                Juara 1
              </span>
              <span className="text-[11px] font-extrabold text-[#075B45]">+5 Poin</span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-slate-300 shadow-2xs">
              <span className="text-xs sm:text-sm font-black text-slate-800 block bg-slate-100 rounded-md py-1 mb-1 border border-slate-200">
                Juara 2
              </span>
              <span className="text-[11px] font-extrabold text-[#075B45]">+3 Poin</span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-amber-700/30 shadow-2xs">
              <span className="text-xs sm:text-sm font-black text-amber-900 block bg-amber-50 rounded-md py-1 mb-1 border border-amber-200">
                Juara 3
              </span>
              <span className="text-[11px] font-extrabold text-[#075B45]">+1 Poin</span>
            </div>
          </div>

          <p className="text-[10.5px] sm:text-[11px] text-slate-700 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-amber-200">
            <span className="font-bold text-[#075B45] mr-1.5">[Catatan]</span><strong>Ketentuan Juara Umum:</strong> Kelas dengan total akumulasi poin terbanyak dinobatkan sebagai <strong>Juara Umum Kelas</strong>. Apabila terdapat poin yang sama (seri), penentuan pemenang dihitung berdasarkan perolehan Juara 1 terbanyak.
          </p>
        </div>
      </section>

      {/* ================= BAGIAN D: HAL YANG PERLU DIPERHATIKAN ================= */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#075B45] text-[#D9B45B] flex items-center justify-center font-bold text-xs shadow-2xs">
              D
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <span>Hal-Hal Penting yang Perlu Diperhatikan</span>
              </h2>
              <p className="text-[10.5px] sm:text-[11px] text-slate-500">
                Panduan praktis agar delegasi santri terhindar dari kendala administrasi
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#075B45] shrink-0 mt-0.5" />
            <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed">
              <strong>Nama Santri Sesuai Dokumen:</strong> Pastikan nama lengkap santri sesuai dengan nama resmi di pesantren. Sistem akan otomatis menyimpannya dalam huruf kapital.
            </p>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#075B45] shrink-0 mt-0.5" />
            <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed">
              <strong>Nomor WhatsApp Wali Kelas:</strong> Gunakan nomor WhatsApp wali kelas yang aktif. Panitia akan mengirimkan konfirmasi dan notifikasi jadwal panggil melalui kontak ini.
            </p>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#075B45] shrink-0 mt-0.5" />
            <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed">
              <strong>Patuhi Kuota Tiap Kelas:</strong> Maksimal 3 delegasi per cabang perlombaan untuk setiap kelas. 1 santri maksimal mengikuti 2 cabang lomba (selain CCM & Kreasi Nadzom).
            </p>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#075B45] shrink-0 mt-0.5" />
            <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed">
              <strong>Cek Status Secara Berkala:</strong> Setelah pendaftaran dikirimkan, gunakan menu "Cek Status" untuk melihat nomor urut undian 3 digit unik dan verifikasi panitia.
            </p>
          </div>
        </div>
      </section>

      {/* ================= PENUTUP & TOMBOL AKSI ================= */}
      <div className="rounded-2xl p-4 sm:p-6 text-center space-y-3 border border-[#075B45]/20 bg-gradient-to-br from-[#EAF4F0] via-emerald-50 to-[#EAF4F0]">
        <div className="w-10 h-10 rounded-2xl bg-[#075B45] text-[#D9B45B] flex items-center justify-center mx-auto shadow-xs">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Siap Mendaftarkan Delegasi Santri?
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-relaxed max-w-lg mx-auto">
            Jazakumullah khairan katsiran atas kerja sama seluruh Ustadz / Ustadzah Wali Kelas. Mari bersama menyukseskan Musabaqah Akhirussanah 1447 H / 2026 M.
          </p>
        </div>
        <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            onClick={handleGoToForm}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs shadow-xs transition-all inline-flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
          >
            <span>Lanjut ke Formulir Pendaftaran</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D9B45B]" />
          </button>
          <button
            onClick={handleGoToStatus}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 shadow-2xs transition-all inline-flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-[#075B45]" />
            <span>Cek Status Delegasi</span>
          </button>
        </div>
      </div>

    </div>
  );
}
