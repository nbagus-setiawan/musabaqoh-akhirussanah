import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  CheckCircle2, 
  UserPlus, 
  User, 
  UserCheck,
  Trophy, 
  GraduationCap, 
  ArrowLeft,
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function SuccessTicket({ 
  registration, 
  onRegisterAnother, 
  onBackHome,
  showActions = true,
  showNotification = true,
  className = ""
}) {
  if (!registration) return null;

  const isPutra = (registration.Jenis_Kelamin || '').toLowerCase().startsWith('l') || 
                  (registration.Kelas_Kategori || '').toLowerCase().includes('putra');
  const isPutri = (registration.Jenis_Kelamin || '').toLowerCase().startsWith('p') || 
                  (registration.Kelas_Kategori || '').toLowerCase().includes('putri');

  const isVerified = registration.Status === 'Terverifikasi';

  return (
    <div className={className || "max-w-md mx-auto px-3 py-2 sm:py-4 animate-in fade-in duration-200"}>
      
      {/* 1. NOTIFIKASI SUKSES RINGKAS & BERSIH */}
      {showNotification && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200/90 rounded-xl px-3.5 py-2 mb-2.5 shadow-2xs no-print">
          <div className="flex items-center space-x-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 leading-tight truncate">
                Pendaftaran Berhasil Dikirimkan
              </h3>
              <p className="text-[10px] text-slate-500 truncate">Data tersimpan di sistem panitia</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-800 shrink-0 ml-2">
            {registration.ID_Pendaftaran}
          </span>
        </div>
      )}

      {/* 2. KARTU TANDA PESERTA DIGITAL (ELEGANT & COMPACT) */}
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-slate-800 print-avoid-break"
      >
        {/* Kop Resmi Al-Falah Putak - Solid Emerald Gradient */}
        <div 
          className="p-3 sm:p-3.5 text-white relative border-b-2 border-[#D9B45B]"
          style={{
            backgroundColor: '#054736',
            background: 'linear-gradient(135deg, #054736 0%, #075B45 60%, #033427 100%)'
          }}
        >
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2.5 min-w-0">
              <img 
                src="/logo.webp" 
                alt="Logo Al-Falah Putak" 
                className="w-10 h-10 object-contain shrink-0 drop-shadow-sm" 
              />
              <div className="leading-tight min-w-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#D9B45B] block truncate">
                  YPPS AL-FALAH PUTAK
                </span>
                <h2 className="text-xs sm:text-sm font-black tracking-tight text-white uppercase truncate">
                  MUSABAQAH AKHIRUSSANAH
                </h2>
                <span className="text-[9.5px] text-emerald-100 font-medium block">
                  Tahun Ajaran 1447 H / 2026 M
                </span>
              </div>
            </div>

            <span className="px-2 py-1 rounded-md text-[8.5px] font-black uppercase tracking-wider bg-[#D9B45B] text-slate-950 shadow-2xs shrink-0 whitespace-nowrap">
              KARTU PESERTA
            </span>
          </div>
        </div>

        {/* Section: ID & Nomor Urut Pemanggilan (2 Kolom Seimbang) */}
        <div className="bg-slate-50/90 px-3.5 py-2.5 border-b border-slate-200/80 flex items-center justify-between gap-3">
          <div>
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 block">
              ID Registrasi
            </span>
            <span className="text-base font-black text-slate-900 font-mono tracking-wider block leading-tight">
              {registration.ID_Pendaftaran}
            </span>
            <span className="text-[8.5px] text-slate-400 block">
              {registration.Timestamp}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 block">
              Nomor Urut Panggilan
            </span>
            {registration.Nomor_Urut ? (
              <span className="text-xl font-black text-emerald-800 font-mono tracking-widest block leading-tight">
                {registration.Nomor_Urut}
              </span>
            ) : (
              <div className="mt-0.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[9.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                  <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>Belum Diundi</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section: Rincian Data Peserta (Clean, Airy & Seamless) */}
        <div className="p-3 sm:p-3.5 space-y-2.5 text-xs bg-white">
          
          {/* Nama Santri & Gender */}
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="min-w-0">
              <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <User className="w-3 h-3 text-emerald-800" />
                <span>Nama Lengkap Santri</span>
              </span>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight mt-0.5 truncate">
                {registration.Nama_Lengkap}
              </h3>
            </div>
            {isPutra ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                <User className="w-2.5 h-2.5 text-blue-600" />
                <span>Putra</span>
              </span>
            ) : isPutri ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-800 border border-rose-200 shrink-0">
                <User className="w-2.5 h-2.5 text-rose-600" />
                <span>Putri</span>
              </span>
            ) : null}
          </div>

          {/* Cabang Lomba & Kelas (Grid 2 Kolom) */}
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
            <div className="min-w-0">
              <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <Trophy className="w-3 h-3 text-amber-600" />
                <span>Cabang Lomba</span>
              </span>
              <p className="text-xs font-black text-emerald-800 truncate mt-0.5" title={registration.Cabang_Lomba}>
                {registration.Cabang_Lomba}
              </p>
            </div>

            <div className="min-w-0">
              <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                <GraduationCap className="w-3 h-3 text-emerald-800" />
                <span>Kelas Diniyah</span>
              </span>
              <p className="text-xs font-bold text-slate-900 truncate mt-0.5" title={registration.Kelas_Kategori}>
                {registration.Kelas_Kategori}
              </p>
              <span className="text-[8.5px] text-slate-400 block truncate">
                {registration.Tingkat}
              </span>
            </div>
          </div>

          {/* Wali Kelas Pendaftar */}
          <div className="space-y-1 pb-2 border-b border-slate-100">
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <UserCheck className="w-3 h-3 text-emerald-800" />
              <span>Wali Kelas Pendaftar</span>
            </span>
            <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
              {registration.Wali_Kelas || '-'}
            </p>
            {registration.Nomor_WA && (
              <div className="pt-0.5 flex items-center space-x-1.5 text-[10.5px]">
                <span className="text-slate-400 text-[10px]">Nomor WhatsApp:</span>
                <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  {registration.Nomor_WA}
                </span>
              </div>
            )}
          </div>

          {/* Status & QR Code (Baris Bawah - Presisi Sempurna) */}
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <div className="space-y-1 min-w-0 pr-1">
              <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 block">
                Status Validasi
              </span>
              <div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold ${
                  isVerified
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {isVerified ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span>Terverifikasi Panitia</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3 h-3 text-amber-700 shrink-0" />
                      <span>Menunggu Verifikasi</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-[8.5px] text-slate-400 leading-tight">
                Tunjukkan kartu ini saat registrasi ulang sebelum lomba.
              </p>
            </div>

            {/* Kotak QR Code Presisi Simetris */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="w-[68px] h-[68px] bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center p-1">
                <QRCodeSVG 
                  value={`ALFALAH-PUTAK-${registration.ID_Pendaftaran}-${registration.Nama_Lengkap}`} 
                  size={56}
                  level="M"
                  className="block"
                />
              </div>
              <span className="text-[7.5px] font-mono font-bold text-slate-400 mt-1 uppercase tracking-wider text-center">
                Scan Validasi
              </span>
            </div>
          </div>

        </div>

        {/* Note Bawah */}
        <div className="bg-slate-50 px-3 py-1.5 border-t border-slate-100 text-center text-[8.5px] text-slate-400">
          Musabaqah Akhirussanah 1447 H • Pondok Pesantren Salafiyah Al-Falah Putak
        </div>

      </div>

      {/* 3. TOMBOL AKSI BESAR & NYAMAN DIKLIK (MOBILE-FRIENDLY) */}
      {showActions && (
        <div className="mt-3.5 space-y-2.5 no-print">
          
          {/* Tombol Utama: Daftarkan Santri Lain (Besar, Nyaman, Jelas) */}
          <button
            type="button"
            onClick={onRegisterAnother}
            className="w-full py-3.5 px-4 rounded-xl bg-[#075B45] hover:bg-[#054736] active:bg-[#042A1D] text-white font-bold text-sm shadow-md flex items-center justify-center space-x-2.5 cursor-pointer active:scale-[0.99] transition-all min-h-[48px]"
          >
            <UserPlus className="w-5 h-5 text-[#D9B45B] shrink-0" />
            <span>Daftarkan Delegasi Santri Lain</span>
          </button>

          <p className="text-[10px] text-center text-slate-400 font-medium">
            Nama wali kelas & nomor WhatsApp tetap tersimpan otomatis.
          </p>

          {/* Tombol Sekunder: Kembali ke Formulir */}
          <button
            type="button"
            onClick={onBackHome}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm border border-slate-300 shadow-2xs flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99] transition-all min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Kembali ke Formulir Utama</span>
          </button>

        </div>
      )}

    </div>
  );
}
