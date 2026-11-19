import React, { useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  GraduationCap, 
  FileSpreadsheet, 
  LogOut,
  ExternalLink,
  X,
  ChevronRight,
  Dices,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Trophy
} from 'lucide-react';
import { getWaliKelasList, getSubKelasByTingkat, getJuaraList } from '../../shared/services/api';

export default function AdminSidebar({ 
  activeView, 
  setActiveView, 
  onLogout,
  isOpen = false,
  onClose,
  registrationsCount = 0,
  registrations = [],
  guruCount = 0,
  tingkatCount = 0
}) {
  // Hitung jumlah riil guru dari data lokal / props
  const realGuruCount = useMemo(() => {
    try {
      const list = getWaliKelasList();
      if (Array.isArray(list)) return list.length;
    } catch (e) {}
    return typeof guruCount === 'number' ? guruCount : 0;
  }, [guruCount, activeView]);

  // Hitung jumlah riil kelas diniyah (Ula + Wustho)
  const realKelasCount = useMemo(() => {
    try {
      const sub = getSubKelasByTingkat();
      let count = 0;
      if (sub && typeof sub === 'object') {
        Object.entries(sub).forEach(([k, arr]) => {
          if (k !== 'mhq_juz' && Array.isArray(arr)) count += arr.length;
        });
      }
      return count > 0 ? count : (tingkatCount || 24);
    } catch (e) {
      return tingkatCount || 24;
    }
  }, [tingkatCount, activeView]);

  const verifiedCount = registrations.filter(r => r.Status === 'Terverifikasi').length;
  const pendingCount = registrations.filter(r => r.Status === 'Pending').length;
  const undianCount = registrations.filter(r => r.Nomor_Urut && String(r.Nomor_Urut).trim() !== '').length;
  const totalCount = registrations.length || registrationsCount;
  const progressPct = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  const mainNavigation = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      badge: 'Live',
      badgeColor: 'emerald'
    },
    { 
      id: 'santri', 
      label: 'Data Santri', 
      icon: Users, 
      count: totalCount,
      badgeColor: 'slate'
    },
    { 
      id: 'guru', 
      label: 'Data Guru', 
      icon: UserCheck, 
      count: realGuruCount,
      badgeColor: 'slate'
    },
    { 
      id: 'tingkat_kelas', 
      label: 'Tingkat & Kelas', 
      icon: GraduationCap, 
      count: realKelasCount,
      badgeColor: 'slate'
    },
    { 
      id: 'juara', 
      label: 'Rekap & Juara Umum', 
      icon: Trophy, 
      badge: 'Juara',
      badgeColor: 'amber'
    },
  ];

  const systemNavigation = [
    { 
      id: 'pengaturan', 
      label: 'Pengaturan Sheet', 
      icon: FileSpreadsheet,
      badge: 'Cloud',
      badgeColor: 'emerald'
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity duration-300"
        />
      )}

      {/* 
        SIDEBAR PANITIA - Kaya Konten, Elegan, Berwibawa & Tidak Polosan
        Terkunci secara fixed di viewport (top-0, bottom-0, left-0, w-64)
      */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 h-screen flex flex-col shrink-0 no-print transition-transform duration-300 ease-in-out select-none bg-white border-r border-slate-200/90 shadow-sm text-slate-800 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        
        {/* Brand Header: Logo di Atas, Tulisan Bersih di Bawah Logo */}
        <div className="pt-6 pb-4 px-4 border-b border-slate-100 bg-white relative shrink-0 text-center flex flex-col items-center">
          <button
            onClick={onClose}
            className="lg:hidden absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Logo Al-Falah Bersih & Berwibawa */}
          <div className="mb-2.5 flex items-center justify-center">
            <img 
              src="/logo.webp" 
              alt="Logo Al-Falah Putak" 
              className="w-20 h-20 object-contain drop-shadow-sm hover:scale-105 transition-transform duration-200" 
            />
          </div>

          {/* Identitas Resmi Pesantren */}
          <div className="w-full space-y-0.5">
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase leading-snug">
              YPPS AL-FALAH PUTAK
            </h1>
            <p className="text-xs font-semibold text-emerald-700 leading-tight">
              Musabaqah Akhirussanah 1447 H
            </p>
          </div>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          
          {/* Kelompok 1: Navigasi Menu Utama */}
          <div className="space-y-1">
            <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center justify-between">
              <span>Navigasi Utama</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            <nav className="space-y-1">
              {mainNavigation.map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      if (onClose) onClose();
                    }}
                    className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 text-left cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                      }`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.count !== undefined ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/80'
                      }`}>
                        {item.count}
                      </span>
                    ) : item.badge ? (
                      <span className={`px-2 py-0.2 rounded-full text-[9px] font-semibold tracking-wide shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Kelompok 2: Sistem & Database */}
          <div className="space-y-1 pt-1">
            <div className="px-3 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Sistem & Sinkronisasi
            </div>

            <nav className="space-y-1">
              {systemNavigation.map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      if (onClose) onClose();
                    }}
                    className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 text-left cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                      }`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* WIDGET INTERAKTIF: Status Undian & Kuota Peserta (Sesuai Referensi Desain) */}
          <div className="pt-2">
            <div className="rounded-2xl p-3.5 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 text-slate-800 shadow-2xs border border-blue-100/80 relative overflow-hidden">
              <div className="relative z-10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold tracking-wide uppercase">
                    <Dices className="w-2.5 h-2.5 text-blue-600" />
                    <span>Sistem Undian</span>
                  </span>
                  <span className="text-[10px] font-mono text-blue-700 font-bold bg-white px-2 py-0.5 rounded-full border border-blue-100 shadow-2xs">
                    {undianCount} Diundi
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-900">Status Kuota</span>
                    <span className="text-[11px] font-mono font-bold text-blue-600">
                      {progressPct}% Sah
                    </span>
                  </div>

                  {/* Progress bar mini */}
                  <div className="w-full h-1.5 bg-blue-200/50 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-100/80 text-[10px]">
                  <div className="flex items-center space-x-1.5 text-slate-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{verifiedCount} Sah</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-700">
                    <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{pendingCount} Pending</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveView('santri');
                    if (onClose) onClose();
                  }}
                  className="w-full mt-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-blue-600 hover:text-white text-blue-700 text-[10px] font-semibold text-center transition-all flex items-center justify-center space-x-1 border border-blue-200/80 shadow-2xs cursor-pointer"
                >
                  <span>Buka Data Undian</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Sidebar: Profil Panitia & Aksi Cepat */}
        <div className="p-3 border-t border-slate-100 space-y-2 shrink-0 bg-white">
          {/* Kartu Profil Ustadz Panitia */}
          <div className="p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 shadow-2xs flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              UA
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-slate-900 truncate">
                Ustadz Admin
              </span>
              <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Panitia Pelaksana</span>
              </span>
            </div>
          </div>

          {/* Tombol Pintasan */}
          <div className="space-y-0.5">
            <a
              href="/"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 transition-colors group"
            >
              <span className="flex items-center space-x-2">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span>Portal Formulir Publik</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </a>

            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors text-left cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Logout</span>
            </button>
          </div>

          <div className="pt-1 text-center">
            <span className="text-[9px] text-slate-400 font-medium block">
              YPPS Al-Falah Putak
            </span>
          </div>
        </div>

      </aside>
    </>
  );
}
