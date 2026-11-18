import React from 'react';
import { Menu, User, Search, Bell, X, ChevronDown } from 'lucide-react';

export default function AdminHeader({ 
  activeViewTitle = 'Dashboard',
  activeView = 'dashboard',
  setActiveView,
  onOpenSidebar,
  registrationsCount = 0,
  registrations = [],
  searchTerm = '',
  setSearchTerm = () => {}
}) {
  const pendingCount = registrations.filter(r => r.Status === 'Pending').length;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (setActiveView && activeView !== 'santri') {
      setActiveView('santri');
    }
  };

  const handleNotificationClick = () => {
    if (setActiveView) {
      setActiveView('santri');
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between no-print sticky top-0 z-30 shrink-0 gap-4">
      
      {/* Kiri: Toggle Menu Mobile + Judul Bersih & Tegas */}
      <div className="flex items-center space-x-3 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
          title="Buka Navigasi"
          aria-label="Buka Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
          {activeViewTitle}
        </h1>
      </div>

      {/* Tengah: Search Bar Proporsional (Sesuai Referensi Desain) */}
      <form 
        onSubmit={handleSearchSubmit}
        className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm mx-4"
      >
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search anything..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (activeView !== 'santri' && e.target.value.trim().length > 1 && setActiveView) {
                setActiveView('santri');
              }
            }}
            className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-800 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 outline-none transition-all shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </form>

      {/* Kanan: Notifikasi Lonceng + Profil Admin */}
      <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
        
        {/* Lonceng Notifikasi */}
        <button
          onClick={handleNotificationClick}
          title={pendingCount > 0 ? `${pendingCount} santri menunggu verifikasi` : 'Semua pendaftaran terverifikasi'}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              {pendingCount}
            </span>
          )}
        </button>

        {/* Profil Panitia */}
        <div className="flex items-center space-x-2.5 pl-2 sm:pl-3 border-l border-slate-200/80">
          <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          
          <div className="hidden sm:block text-left leading-tight">
            <p className="text-xs font-bold text-slate-800">Ustadz Admin</p>
            <p className="text-[10px] text-slate-500 font-medium">Panitia Musabaqah</p>
          </div>

          <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400 -ml-1" />
        </div>

      </div>

    </header>
  );
}
