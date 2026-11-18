import React, { useState } from 'react';
import { ShieldCheck, KeyRound, AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import { getAdminPin } from '../../shared/services/api';

export default function AdminLogin({ onLoginSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const correctPin = getAdminPin();
    if (pin === correctPin || pin === 'admin123') {
      onLoginSuccess();
      setError('');
      setPin('');
    } else {
      setError('PIN Panitia salah! (Default PIN: admin123)');
    }
  };

  const handleBackToPublic = () => {
    window.location.hash = '';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white relative overflow-hidden">
      
      {/* Decorative Ornaments */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-white rounded-3xl p-8 text-slate-900 shadow-2xl border border-slate-100 relative">
        
        {/* Tombol Kembali ke Halaman Publik */}
        <button
          onClick={handleBackToPublic}
          className="absolute top-6 left-6 text-xs font-semibold text-slate-400 hover:text-slate-700 flex items-center space-x-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Ke Beranda Publik</span>
        </button>

        <div className="text-center mt-6 mb-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white mx-auto flex items-center justify-center mb-3 shadow-lg shadow-blue-600/30 ring-4 ring-blue-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Portal Khusus Panitia
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Masuk untuk mengakses Dashboard & Sistem Undian Nomor Urut
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              Masukkan PIN Panitia:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                placeholder="Masukkan PIN..."
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                autoFocus
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-base font-mono tracking-widest text-center font-bold text-slate-900"
              />
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Default PIN panitia: <strong className="text-blue-600 font-mono">admin123</strong>
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Buka Dashboard Panitia</span>
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
          Sistem Verifikasi & Pengacakan Nomor Urut Akhirusanah
        </div>

      </div>
    </div>
  );
}
