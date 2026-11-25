import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  KeyRound, 
  AlertCircle, 
  ArrowLeft, 
  Lock, 
  Eye, 
  EyeOff, 
  Database
} from 'lucide-react';
import { verifyAdminLogin } from '../../shared/services/api';

export default function AdminLogin({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Harap masukkan PIN Panitia terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const res = await verifyAdminLogin(pin.trim());
      if (res.success) {
        onLoginSuccess();
        setPin('');
      } else {
        setError(res.message || 'PIN Panitia salah! Silakan periksa kembali kode PIN Anda.');
      }
    } catch (err) {
      setError('Gagal memverifikasi PIN. Periksa koneksi dan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPublic = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#021f17] via-[#043325] to-[#01140e] text-white relative overflow-hidden select-none font-sans">
      
      {/* Decorative Ambient Glowing Orbs */}
      <div className="absolute -top-36 -right-36 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute -bottom-36 -left-36 w-96 h-96 rounded-full bg-[#D9B45B]/15 blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-96 bg-emerald-600/5 blur-[120px] pointer-events-none"></div>

      {/* Main Card Container with Glassmorphism */}
      <div className="max-w-md w-full bg-white rounded-3xl text-slate-900 shadow-2xl shadow-emerald-950/50 border border-emerald-100/40 relative overflow-hidden animate-fadeIn">
        
        {/* Top Gold & Emerald Islamic Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#075B45] via-[#D9B45B] to-[#075B45]"></div>

        <div className="p-6 sm:p-8">
          
          {/* Top Bar: Tombol Kembali ke Beranda Publik */}
          <div className="flex items-center justify-between mb-5">
            <button
              type="button"
              onClick={handleBackToPublic}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100/90 hover:bg-emerald-50 text-slate-600 hover:text-[#075B45] text-xs font-semibold transition-all active:scale-95 cursor-pointer border border-slate-200/80"
              title="Kembali ke Beranda Formulir"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Beranda Publik</span>
            </button>

            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#075B45] text-[10.5px] font-bold tracking-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Portal Terlindungi</span>
            </span>
          </div>

          {/* Logo & Header Pesantren Al-Falah */}
          <div className="text-center mb-6">
            <div className="relative inline-block mb-3">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-b from-white to-emerald-50/50 p-2.5 mx-auto flex items-center justify-center shadow-md border-2 border-[#D9B45B]/40 ring-4 ring-[#075B45]/10 group hover:scale-105 transition-transform duration-300">
                <img 
                  src="/logo.webp" 
                  alt="Logo Pondok Pesantren Al-Falah Putak" 
                  className="w-full h-full object-contain drop-shadow-xs"
                />
              </div>
            </div>

            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-snug">
              YPPS AL-FALAH PUTAK
            </h1>
            <p className="text-xs font-bold text-[#075B45] mt-0.5 tracking-wide">
              Musabaqah Akhirussanah 1447 H / 2026 M
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Otentikasi Khusus Panitia Pelaksana untuk Akses Dashboard & Pengundian Nomor Peserta
            </p>
          </div>

          {/* Form Login PIN */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#075B45]" />
                  <span>Kode PIN Panitia</span>
                </label>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ketik PIN..."
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (error) setError('');
                  }}
                  autoFocus
                  className="w-full pl-10 pr-11 py-3 sm:py-3.5 rounded-2xl border border-slate-300 focus:border-[#075B45] focus:ring-4 focus:ring-[#075B45]/15 outline-none text-base sm:text-lg font-mono tracking-widest text-center font-bold text-slate-900 bg-white shadow-2xs transition-all placeholder:text-slate-300 placeholder:font-sans placeholder:tracking-normal placeholder:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showPassword ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between mt-2 px-1">
                <p className="text-[11px] text-slate-400">
                  Masukkan PIN resmi Panitia Pelaksana.
                </p>
                <span className="text-[10px] text-slate-400 font-medium">Tersinkron Google Sheets</span>
              </div>
            </div>

            {/* Alert Error */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start space-x-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {/* Tombol Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 sm:py-4 px-4 rounded-2xl bg-gradient-to-r from-[#075B45] to-[#054736] hover:from-[#054736] hover:to-[#033024] text-white font-bold text-sm shadow-md shadow-[#075B45]/25 border border-[#D9B45B]/40 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed min-h-[48px]"
              >
                {isLoading ? (
                  <span className="inline-flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Memverifikasi Akses...</span>
                  </span>
                ) : (
                  <>
                    <ShieldCheck className="w-4.5 h-4.5 text-[#D9B45B]" />
                    <span className="tracking-wide">Buka Dashboard Panitia</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Card Info */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Sheets Database</span>
            </div>
            <div className="flex items-center space-x-1 text-slate-500 font-medium">
              <span>Keamanan Panitia</span>
              <span className="text-[#D9B45B]">•</span>
              <span className="text-[#075B45] font-bold">1447 H</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
