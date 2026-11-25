import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  User,
  Search,
  Bell,
  X,
  ChevronDown,
  ExternalLink,
  FileSpreadsheet,
  LogOut,
  CheckCircle2,
  Clock,
  Dices
} from 'lucide-react';

export default function AdminHeader({
  activeViewTitle = 'Dashboard',
  activeView = 'dashboard',
  setActiveView,
  onOpenSidebar,
  isSidebarOpen = false,
  menuTriggerRef,
  onLogout,
  registrationsCount = 0,
  registrations = [],
  searchTerm = '',
  setSearchTerm = () => {}
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifContainerRef = useRef(null);
  const profileContainerRef = useRef(null);

  const pendingCount = registrations.filter(r => r.Status === 'Pending').length;
  const verifiedCount = registrations.filter(r => r.Status === 'Terverifikasi').length;
  const undianCount = registrations.filter(r => r.Nomor_Urut && String(r.Nomor_Urut).trim() !== '').length;
  const totalCount = registrations.length || registrationsCount;

  useEffect(() => {
    if (!notifOpen && !profileOpen) return;

    const handleOutside = (e) => {
      if (notifOpen && notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileOpen && profileContainerRef.current && !profileContainerRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [notifOpen, profileOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (setActiveView && activeView !== 'santri') {
      setActiveView('santri');
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 py-2.5 min-h-[58px] flex items-center justify-between no-print sticky top-0 z-30 shrink-0 gap-3">
      {/* Kiri: Trigger Drawer Mobile + Judul Halaman */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          ref={menuTriggerRef}
          type="button"
          onClick={onOpenSidebar}
          aria-expanded={isSidebarOpen}
          aria-controls="admin-sidebar"
          aria-label="Buka Navigasi"
          title="Buka Navigasi"
          className="lg:hidden p-2 -ml-1 rounded-xl text-slate-600 hover:text-[#075B45] hover:bg-[#EAF4F0] transition-colors shrink-0 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
            {activeViewTitle}
          </h1>
        </div>
      </div>

      {/* Tengah: Pencarian Cepat Bahasa Indonesia */}
      <form
        onSubmit={handleSearchSubmit}
        className="hidden md:flex items-center flex-1 max-w-sm mx-4"
      >
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="search"
            aria-label="Cari santri, kelas, atau nomor peserta"
            placeholder="Cari santri, kelas, atau no. peserta..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (activeView !== 'santri' && e.target.value.trim().length > 1 && setActiveView) {
                setActiveView('santri');
              }
            }}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="Hapus pencarian"
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Kanan: Notifikasi Ringkas + Menu Profil Panitia */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        {/* Popover Lonceng Status */}
        <div className="relative" ref={notifContainerRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen(false);
              setNotifOpen(prev => !prev);
            }}
            aria-expanded={notifOpen}
            aria-haspopup="true"
            aria-label={pendingCount > 0 ? `${pendingCount} delegasi menunggu verifikasi` : 'Ringkasan status pendaftaran'}
            title={pendingCount > 0 ? `${pendingCount} delegasi menunggu verifikasi` : 'Status pendaftaran'}
            className="relative p-2 rounded-xl text-slate-500 hover:text-[#075B45] hover:bg-[#EAF4F0]/80 transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold tabular-nums flex items-center justify-center ring-2 ring-white">
                {pendingCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-lg p-3.5 space-y-3 z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-extrabold text-slate-900">Ringkasan Antrean</span>
                <span className="text-[10px] font-bold text-[#075B45] bg-[#EAF4F0] px-2 py-0.5 rounded-full">
                  {totalCount} Total
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Menunggu Verifikasi
                  </span>
                  <strong className="font-mono tabular-nums text-amber-700">{pendingCount}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#075B45]" />
                    Sudah Terverifikasi
                  </span>
                  <strong className="font-mono tabular-nums text-[#075B45]">{verifiedCount}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="inline-flex items-center gap-1.5">
                    <Dices className="w-3.5 h-3.5 text-[#9A7418]" />
                    Nomor Peserta Diundi
                  </span>
                  <strong className="font-mono tabular-nums text-slate-900">{undianCount}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNotifOpen(false);
                  if (setActiveView) setActiveView('santri');
                }}
                className="w-full py-2 px-3 rounded-xl bg-[#075B45] hover:bg-[#054736] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Buka Data Santri & Undian
              </button>
            </div>
          )}
        </div>

        {/* Dropdown Profil Admin Interaktif */}
        <div className="relative pl-2 sm:pl-3 border-l border-slate-200/80" ref={profileContainerRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen(false);
              setProfileOpen(prev => !prev);
            }}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-[#075B45] text-[#D9B45B] flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 border border-[#054736]">
              <User className="w-4 h-4" />
            </div>

            <div className="hidden sm:block text-left leading-tight">
              <p className="text-xs font-bold text-slate-900">Ustadz Admin</p>
              <p className="text-[10px] text-slate-500 font-medium">Panitia Musabaqah</p>
            </div>

            <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
              profileOpen ? 'rotate-180' : ''
            }`} />
          </button>

          {profileOpen && (
            <div
              role="menu"
              aria-label="Menu Profil Admin"
              className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-lg p-1.5 space-y-1 z-50"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setProfileOpen(false);
                  if (setActiveView) setActiveView('pengaturan');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-[#EAF4F0] hover:text-[#054736] transition-colors cursor-pointer text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#075B45]" />
                <span>Pengaturan Sheet</span>
              </button>

              <a
                href="/"
                role="menuitem"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors text-left"
              >
                <ExternalLink className="w-4 h-4 text-slate-500" />
                <span>Portal Formulir Publik</span>
              </a>

              {onLogout && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left border-t border-slate-100 mt-1 pt-2"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
