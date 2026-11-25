import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  ClipboardList,
  Receipt,
  ListChecks,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import {
  getWaliKelasList,
  getSubKelasByTingkat,
  getPengeluaranList,
  getKebutuhanList,
  subscribeDataChanged
} from '../../shared/services/api';

export default function AdminSidebar({
  activeView,
  setActiveView,
  onLogout,
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  menuTriggerRef,
  registrationsCount = 0,
  registrations = [],
  guruCount = 0,
  tingkatCount = 0
}) {
  const isPencatatanActive = activeView === 'pencatatan_pengeluaran' || activeView === 'pencatatan_kebutuhan';
  const [isPencatatanOpen, setIsPencatatanOpen] = useState(true);
  const [pengeluaranCount, setPengeluaranCount] = useState(() => getPengeluaranList().length);
  const [kebutuhanCount, setKebutuhanCount] = useState(() => getKebutuhanList().length);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true
  );
  const closeBtnRef = useRef(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (isPencatatanActive) setIsPencatatanOpen(true);
  }, [isPencatatanActive]);

  useEffect(() => {
    const refreshCounts = () => {
      setPengeluaranCount(getPengeluaranList().length);
      setKebutuhanCount(getKebutuhanList().length);
    };
    refreshCounts();
    const unsub = subscribeDataChanged((evt) => {
      if (!evt || evt.type === 'pengeluaran' || evt.type === 'kebutuhan' || evt.type === 'storage_change') {
        refreshCounts();
      }
    });
    return () => unsub();
  }, [activeView]);

  // Kelola Escape & fokus drawer mobile saat bertindak sebagai dialog modal
  useEffect(() => {
    if (isDesktop) return;

    if (isOpen) {
      wasOpenRef.current = true;
      const timer = setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 40);
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose?.();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }

    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      menuTriggerRef?.current?.focus();
    }
  }, [isOpen, isDesktop, onClose, menuTriggerRef]);

  const realGuruCount = useMemo(() => {
    try {
      const list = getWaliKelasList();
      if (Array.isArray(list)) return list.length;
    } catch (e) {}
    return typeof guruCount === 'number' ? guruCount : 0;
  }, [guruCount, activeView]);

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

  const totalCount = registrations.length || registrationsCount;
  const compact = isDesktop && isCollapsed;

  const mainNavigation = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'Live'
    },
    {
      id: 'santri',
      label: 'Data Santri',
      icon: Users,
      count: totalCount
    },
    {
      id: 'guru',
      label: 'Data Guru',
      icon: UserCheck,
      count: realGuruCount
    },
    {
      id: 'tingkat_kelas',
      label: 'Tingkat & Kelas',
      icon: GraduationCap,
      count: realKelasCount
    }
  ];

  const pencatatanSubMenus = [
    {
      id: 'pencatatan_pengeluaran',
      label: 'Pengeluaran',
      icon: Receipt,
      count: pengeluaranCount
    },
    {
      id: 'pencatatan_kebutuhan',
      label: 'Kebutuhan',
      icon: ListChecks,
      count: kebutuhanCount
    }
  ];

  const systemNavigation = [
    {
      id: 'pengaturan',
      label: 'Pengaturan Sheet',
      icon: FileSpreadsheet,
      badge: 'Cloud'
    }
  ];

  const handleNavigate = (viewId) => {
    setActiveView(viewId);
    if (!isDesktop && onClose) onClose();
  };

  return (
    <>
      {/* Backdrop Mobile Drawer */}
      {isOpen && !isDesktop && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity duration-200"
        />
      )}

      {/* 
        SIDEBAR PANITIA - HIJAU ELEGAN KHAS AL-FALAH PUTAK
      */}
      <aside
        id="admin-sidebar"
        role={!isDesktop && isOpen ? 'dialog' : undefined}
        aria-modal={!isDesktop && isOpen ? 'true' : undefined}
        aria-label="Navigasi Panel Panitia"
        aria-hidden={!isDesktop && !isOpen ? 'true' : undefined}
        className={`fixed inset-y-0 left-0 z-50 h-[100dvh] max-h-[100dvh] flex flex-col shrink-0 no-print transition-[width,transform] duration-200 ease-out select-none bg-gradient-to-b from-[#054736] via-[#064e3b] to-[#043327] border-r border-[#075B45]/80 shadow-xl text-white ${
          compact ? 'lg:w-20' : 'lg:w-64'
        } w-[min(17.5rem,85dvw)] ${
          isOpen
            ? 'translate-x-0 visible'
            : '-translate-x-full invisible lg:translate-x-0 lg:visible'
        }`}
      >
        {/* Header Brand Ringkas Horizontal Hijau */}
        <div className={`px-3.5 py-3 border-b border-white/10 bg-[#043327]/50 shrink-0 flex items-center ${
          compact ? 'justify-center' : 'justify-between gap-2.5'
        }`}>
          <div className={`flex items-center min-w-0 ${compact ? 'justify-center' : 'gap-2.5'}`}>
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 p-1 shadow-2xs">
              <img
                src="/logo.webp"
                alt="Logo Al-Falah Putak"
                width="36"
                height="36"
                className="w-full h-full object-contain drop-shadow-xs"
              />
            </div>

            {!compact && (
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white tracking-tight uppercase truncate leading-tight">
                  YPPS Al-Falah
                </p>
                <p className="text-[11px] font-bold text-[#D9B45B] truncate leading-tight mt-0.5">
                  Musabaqah 1447 H
                </p>
              </div>
            )}
          </div>

          {!compact && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:inline-flex p-1.5 rounded-lg text-emerald-200/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Kecilkan Sidebar"
              aria-label="Kecilkan Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}

          {!isDesktop && (
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Tutup Menu"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tombol Perluas Sidebar saat Mode Ringkas Desktop */}
        {compact && onToggleCollapse && (
          <div className="hidden lg:flex justify-center pt-2.5 pb-1 shrink-0">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-2 rounded-xl text-emerald-200 hover:text-[#D9B45B] hover:bg-white/10 transition-colors cursor-pointer"
              title="Perluas Sidebar"
              aria-label="Perluas Sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Area Navigasi Utama */}
        <div className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto admin-sidebar-scroll">
          {/* Kelompok 1: Menu Utama */}
          <div className="space-y-1">
            {!compact && (
              <div className="px-2.5 pb-1 text-[10px] font-bold tracking-wider text-emerald-300/70 uppercase flex items-center justify-between">
                <span>Menu Utama</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#D9B45B]" aria-hidden="true" />
              </div>
            )}

            <nav aria-label="Menu Utama" className="space-y-1">
              {mainNavigation.map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    title={compact ? item.label : undefined}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full group flex items-center rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                      compact ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5 text-left'
                    } ${
                      isActive
                        ? 'bg-[#075B45] text-white shadow-xs font-bold border border-[#D9B45B]/40 ring-1 ring-white/15'
                        : 'text-emerald-100/85 hover:text-white hover:bg-white/10 font-semibold'
                    }`}
                  >
                    <div className={`flex items-center min-w-0 ${compact ? 'justify-center' : 'space-x-2.5'}`}>
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#D9B45B]' : 'text-emerald-300 group-hover:text-white'
                      }`} />
                      {!compact && <span className="truncate">{item.label}</span>}
                    </div>

                    {!compact && item.count !== undefined && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tabular-nums shrink-0 ${
                        isActive
                          ? 'bg-[#D9B45B] text-slate-950 font-bold'
                          : 'bg-black/25 text-emerald-200 border border-white/10 group-hover:bg-white/15 group-hover:text-white'
                      }`}>
                        {item.count}
                      </span>
                    )}

                    {!compact && item.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide shrink-0 ${
                        isActive
                          ? 'bg-[#D9B45B] text-slate-950 font-extrabold'
                          : 'bg-white/10 text-[#D9B45B] border border-[#D9B45B]/30'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Menu Pencatatan + Submenu */}
              <div className="space-y-1">
                <button
                  type="button"
                  aria-expanded={compact ? undefined : isPencatatanOpen}
                  aria-controls={compact ? undefined : 'submenu-pencatatan'}
                  title={compact ? 'Pencatatan Panitia' : undefined}
                  aria-label="Pencatatan Panitia"
                  onClick={() => {
                    if (compact) {
                      onToggleCollapse?.();
                      setIsPencatatanOpen(true);
                      if (!isPencatatanActive) handleNavigate('pencatatan_pengeluaran');
                    } else {
                      setIsPencatatanOpen(prev => !prev);
                    }
                  }}
                  className={`w-full group flex items-center rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                    compact ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5 text-left'
                  } ${
                    isPencatatanActive
                      ? 'bg-white/15 text-white border border-[#D9B45B]/40 font-bold'
                      : 'text-emerald-100/85 hover:text-white hover:bg-white/10 font-semibold'
                  }`}
                >
                  <div className={`flex items-center min-w-0 ${compact ? 'justify-center' : 'space-x-2.5'}`}>
                    <ClipboardList className={`w-4 h-4 shrink-0 transition-colors ${
                      isPencatatanActive ? 'text-[#D9B45B]' : 'text-emerald-300 group-hover:text-white'
                    }`} />
                    {!compact && <span className="truncate">Pencatatan</span>}
                  </div>

                  {!compact && (
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isPencatatanOpen ? 'rotate-0' : '-rotate-90'
                    } ${isPencatatanActive ? 'text-[#D9B45B]' : 'text-emerald-300'}`} />
                  )}
                </button>

                {!compact && isPencatatanOpen && (
                  <div id="submenu-pencatatan" className="pl-3 ml-3 border-l border-white/20 space-y-1">
                    {pencatatanSubMenus.map(sub => {
                      const SubIcon = sub.icon;
                      const isSubActive = activeView === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleNavigate(sub.id)}
                          aria-current={isSubActive ? 'page' : undefined}
                          className={`w-full group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all duration-150 text-left cursor-pointer ${
                            isSubActive
                              ? 'bg-[#075B45] text-white shadow-xs font-bold border border-[#D9B45B]/40'
                              : 'text-emerald-200/80 hover:text-white hover:bg-white/10 font-semibold'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <SubIcon className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                              isSubActive ? 'text-[#D9B45B]' : 'text-emerald-300 group-hover:text-white'
                            }`} />
                            <span className="truncate">{sub.label}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tabular-nums shrink-0 ${
                            isSubActive
                              ? 'bg-[#D9B45B] text-slate-950'
                              : 'bg-black/25 text-emerald-200 border border-white/10 group-hover:bg-white/15 group-hover:text-white'
                          }`}>
                            {sub.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Kelompok 2: Sistem & Database */}
          <div className="space-y-1 pt-2 border-t border-white/10">
            {!compact && (
              <div className="px-2.5 pt-1 pb-1 text-[10px] font-bold tracking-wider text-emerald-300/70 uppercase">
                Sistem
              </div>
            )}

            <nav aria-label="Menu Sistem" className="space-y-1">
              {systemNavigation.map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    title={compact ? item.label : undefined}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full group flex items-center rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                      compact ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5 text-left'
                    } ${
                      isActive
                        ? 'bg-[#075B45] text-white shadow-xs font-bold border border-[#D9B45B]/40 ring-1 ring-white/15'
                        : 'text-emerald-100/85 hover:text-white hover:bg-white/10 font-semibold'
                    }`}
                  >
                    <div className={`flex items-center min-w-0 ${compact ? 'justify-center' : 'space-x-2.5'}`}>
                      <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#D9B45B]' : 'text-emerald-300 group-hover:text-white'
                      }`} />
                      {!compact && <span className="truncate">{item.label}</span>}
                    </div>

                    {!compact && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                        isActive
                          ? 'bg-[#D9B45B] text-slate-950 font-extrabold'
                          : 'bg-white/10 text-[#D9B45B] border border-[#D9B45B]/30'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer Sidebar Ramping Hijau: Pintasan Portal & Logout */}
        <div className="p-2.5 border-t border-white/10 space-y-1 shrink-0 bg-[#043327]/60">
          <a
            href="/"
            title={compact ? 'Portal Formulir Publik' : undefined}
            aria-label="Portal Formulir Publik"
            className={`w-full flex items-center rounded-xl text-xs font-semibold text-emerald-200 hover:text-white hover:bg-white/10 transition-colors group ${
              compact ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
            }`}
          >
            <span className={`flex items-center ${compact ? 'justify-center' : 'space-x-2'}`}>
              <ExternalLink className="w-4 h-4 text-emerald-300 group-hover:text-[#D9B45B] transition-colors shrink-0" />
              {!compact && <span>Portal Publik</span>}
            </span>
            {!compact && (
              <ChevronRight className="w-3.5 h-3.5 text-emerald-300 group-hover:translate-x-0.5 transition-transform" />
            )}
          </a>

          <button
            type="button"
            onClick={onLogout}
            title={compact ? 'Keluar / Logout' : undefined}
            aria-label="Keluar dari Panel Admin"
            className={`w-full flex items-center rounded-xl text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-500/20 transition-colors cursor-pointer ${
              compact ? 'justify-center px-2 py-2.5' : 'space-x-2 px-3 py-2 text-left'
            }`}
          >
            <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
            {!compact && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
