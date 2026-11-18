import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, FileEdit, Search, Menu, X, ArrowRight } from 'lucide-react';

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;

  const navItems = [
    { path: '/', label: 'Formulir Pendaftaran', icon: FileEdit, aliases: ['/', '/formulir'] },
    { path: '/syarat-ketentuan', label: 'Petunjuk & Syarat', icon: BookOpen, aliases: ['/petunjuk', '/syarat-ketentuan'] },
    { path: '/cek-status', label: 'Cek Status Pendaftaran', icon: Search, aliases: ['/cek-status', '/status'] },
  ];

  const isItemActive = (item) => {
    if (item.path === '/') {
      return currentPath === '/' || currentPath === '/formulir';
    }
    if (item.aliases) {
      return item.aliases.some(alias => currentPath.startsWith(alias));
    }
    return currentPath === item.path;
  };

  const handleLinkClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs no-print">
      
      {/* Top Bar Kelembagaan Resmi - Running Text Lengkap & Elegan */}
      <div className="bg-[#04382B] text-white text-xs sm:text-[13px] font-semibold py-2 px-2 border-b border-[#03291F] overflow-hidden select-none">
        <div className="max-w-7xl mx-auto overflow-hidden whitespace-nowrap relative flex items-center">
          <div className="animate-marquee font-semibold tracking-wide text-emerald-100 flex items-center shrink-0">
            <div className="flex items-center space-x-2.5 pr-12">
              <span className="font-bold text-white text-xs sm:text-[13px]">Yayasan Pondok Pesantren Salafiyah Al-Falah Putak</span>
              <span className="text-[#D9B45B]">•</span>
              <span>Musabaqah Akhirussanah 1447 H / 2026 M</span>
              <span className="text-[#D9B45B]">•</span>
              <span>Kecamatan Gelumbang, Kabupaten Muara Enim, Sumatera Selatan</span>
              <span className="text-[#D9B45B]">•</span>
              <span className="text-emerald-300 font-bold">Portal Resmi Pendaftaran Lomba Delegasi Antar Kelas</span>
            </div>
            <div className="flex items-center space-x-2.5 pr-12">
              <span className="font-bold text-white text-xs sm:text-[13px]">Yayasan Pondok Pesantren Salafiyah Al-Falah Putak</span>
              <span className="text-[#D9B45B]">•</span>
              <span>Musabaqah Akhirussanah 1447 H / 2026 M</span>
              <span className="text-[#D9B45B]">•</span>
              <span>Kecamatan Gelumbang, Kabupaten Muara Enim, Sumatera Selatan</span>
              <span className="text-[#D9B45B]">•</span>
              <span className="text-emerald-300 font-bold">Portal Resmi Pendaftaran Lomba Delegasi Antar Kelas</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[68px] sm:min-h-[74px] py-1.5 sm:py-2">
          
          {/* Brand & Identitas Utama: Pondok Pesantren Salafiyah AL-FALAH PUTAK */}
          <Link 
            to="/" 
            className="flex items-center space-x-2.5 sm:space-x-3.5 select-none py-0.5 cursor-pointer shrink-0"
            onClick={() => setMobileMenuOpen(false)}
          >
            <img 
              src="/logo.webp" 
              alt="Logo Pesantren Al-Falah Putak" 
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-15 md:h-15 object-contain shrink-0 drop-shadow-sm transition-transform hover:scale-105"
            />
            <div className="leading-tight">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#075B45] block">
                Pondok Pesantren Salafiyah
              </span>
              <h1 className="text-sm sm:text-base md:text-lg font-black text-slate-900 tracking-tight uppercase leading-snug">
                AL-FALAH PUTAK
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-semibold tracking-tight">
                Musabaqah Akhirussanah 1447 H / 2026 M
              </p>
            </div>
          </Link>

          {/* Navigasi Desktop Multi-Halaman: Ukuran Proporsional & Rapi */}
          <nav className="hidden lg:flex items-center space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 ${
                    active
                      ? 'bg-[#075B45] text-white shadow-xs'
                      : 'text-slate-700 hover:text-[#075B45] hover:bg-[#EAF4F0]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Tombol Aksi Cek Status / Petunjuk di Desktop */}
          <div className="hidden sm:flex items-center">
            <Link
              to="/cek-status"
              className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#075B45] font-bold text-xs sm:text-sm border border-emerald-200/90 transition-all flex items-center space-x-2 active:scale-95 shadow-2xs"
            >
              <Search className="w-4 h-4" />
              <span>Cek Status Santri</span>
            </Link>
          </div>

          {/* Tombol Hamburger Mobile - Ergonomis Pas di Jempol (42x42px) */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100/90 hover:bg-[#EAF4F0] active:bg-[#d8ece2] text-[#075B45] border border-slate-200/90 flex items-center justify-center shadow-2xs active:scale-95 transition-all cursor-pointer"
              aria-label="Menu Navigasi"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Drawer Menu Mobile Bersih, Nyaman di Jempol */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-3.5 pt-2.5 pb-4 space-y-1.5 shadow-xl animate-fadeIn">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);
            return (
              <button
                key={item.path}
                onClick={() => handleLinkClick(item.path)}
                className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-left min-h-[44px] cursor-pointer active:scale-[0.99] ${
                  active
                    ? 'bg-[#075B45] text-white shadow-xs'
                    : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => handleLinkClick('/cek-status')}
              className="w-full py-3 px-4 rounded-xl bg-[#EAF4F0] text-[#075B45] font-bold text-xs sm:text-sm text-center flex items-center justify-center space-x-2 border border-[#075B45]/20 shadow-2xs min-h-[44px] cursor-pointer active:scale-[0.99]"
            >
              <Search className="w-4 h-4" />
              <span>Cek Status & Cari Data Santri</span>
            </button>
          </div>
        </div>
      )}

    </header>
  );
}
