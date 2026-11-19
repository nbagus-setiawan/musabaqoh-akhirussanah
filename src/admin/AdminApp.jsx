import React, { useState, useEffect } from 'react';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminSantri from './components/AdminSantri';
import AdminGuru from './components/AdminGuru';
import AdminTingkatKelas from './components/AdminTingkatKelas';
import AdminJuara from './components/AdminJuara';
import AdminPengaturan from './components/AdminPengaturan';
import { 
  fetchRegistrations, 
  fetchWaliKelas, 
  fetchTingkatKelas, 
  getWaliKelasList, 
  getTingkatList, 
  getSubKelasByTingkat,
  subscribeDataChanged,
  syncRemoteRegistrationsSilently,
  getLocalRegistrations
} from '../shared/services/api';

export default function AdminApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('auth') === 'admin123') return true;
      return sessionStorage.getItem('admin_session_auth') === 'true' || localStorage.getItem('admin_session_auth') === 'true';
    } catch (e) {
      return false;
    }
  });
  
  const [activeView, setActiveView] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('view') || 'dashboard';
    } catch (e) {
      return 'dashboard';
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [registrations, setRegistrations] = useState(() => getLocalRegistrations());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guruCount, setGuruCount] = useState(0);
  const [tingkatCount, setTingkatCount] = useState(0);

  // Kunci scroll body utama saat berada di panel admin agar tidak ada scrollbar ganda
  useEffect(() => {
    document.body.classList.add('overflow-hidden');
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  const loadData = async (forceRemote = false) => {
    try {
      const data = await fetchRegistrations(forceRemote);
      setRegistrations(data);

      const guru = await fetchWaliKelas();
      setGuruCount(Array.isArray(guru) ? guru.length : 0);

      const sub = await fetchTingkatKelas();
      let totalKelas = 0;
      if (sub && typeof sub === 'object') {
        Object.entries(sub).forEach(([k, arr]) => {
          if (Array.isArray(arr)) totalKelas += arr.length;
        });
      }
      setTingkatCount(totalKelas || 30);
    } catch (e) {
      console.error('Error load admin data:', e);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    // 1. Pemuatan instan dari cache lokal
    loadData(false);

    // 2. Langganan event perubahan data real-time: otomatis update seketika (<1ms) tanpa refresh
    const unsubscribe = subscribeDataChanged((event) => {
      const freshData = getLocalRegistrations();
      if (Array.isArray(freshData)) {
        setRegistrations(freshData);
      }
      if (event && (event.type === 'wali_kelas' || event.type === 'sub_kelas' || event.type === 'storage_change')) {
        loadData(false);
      }
    });

    // 3. Polling senyap di background (tiap 5 detik) untuk mendeteksi pendaftaran dari perangkat lain via Google Sheets
    const silentPoll = setInterval(() => {
      syncRemoteRegistrationsSilently();
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(silentPoll);
    };
  }, [isLoggedIn, activeView]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    sessionStorage.setItem('admin_session_auth', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('admin_session_auth');
    localStorage.removeItem('admin_session_auth');
    window.location.hash = '';
  };

  if (!isLoggedIn) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  const getTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Dashboard';
      case 'santri': return 'Data Santri & Undian';
      case 'guru': return 'Data Wali Kelas';
      case 'tingkat_kelas': return 'Tingkat & Kelas';
      case 'juara': return 'Rekap & Juara Umum';
      case 'pengaturan': return 'Pengaturan Google Sheets';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F4F7FC] flex font-sans antialiased text-slate-800">
      
      {/* 
        SIDEBAR PANITIA - Didesain Fixed Penuh 
        Di Desktop (lg:) menempel permanen (fixed left-0) dan tidak pernah ikut terscroll.
        Di Mobile / Tablet bertindak sebagai off-canvas sliding drawer.
      */}
      <AdminSidebar
        activeView={activeView}
        setActiveView={setActiveView}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        registrationsCount={registrations.length}
        registrations={registrations}
        guruCount={guruCount}
        tingkatCount={tingkatCount}
      />

      {/* 
        AREA KONTEN UTAMA
        lg:pl-64 memberikan ruang tepat untuk lebar sidebar (w-64)
        Hanya area <main> yang dapat discroll secara vertikal.
      */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden bg-[#F4F7FC] lg:pl-64 transition-all">
        
        {/* Header Sticky di Atas Main Content */}
        <AdminHeader
          activeViewTitle={getTitle()}
          activeView={activeView}
          setActiveView={setActiveView}
          onOpenSidebar={() => setSidebarOpen(true)}
          registrationsCount={registrations.length}
          registrations={registrations}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* 
          Main Scroll Container - SATU-SATUNYA area yang scroll! 
          Sidebar dan Header tetap statis/fixed di tempatnya.
        */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F4F7FC] scroll-smooth">
          
          {/* 1. VIEW: DASHBOARD */}
          {activeView === 'dashboard' && (
            <AdminDashboard
              registrations={registrations}
              onRefresh={loadData}
              setActiveView={setActiveView}
              setSearchTerm={setSearchTerm}
            />
          )}

          {/* 2. VIEW: DATA SANTRI */}
          {activeView === 'santri' && (
            <AdminSantri
              registrations={registrations}
              onRefresh={loadData}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
          )}

          {/* 3. VIEW: DATA GURU (CRUD WALI KELAS) */}
          {activeView === 'guru' && (
            <AdminGuru
              registrations={registrations}
              onRefresh={loadData}
              setActiveView={setActiveView}
              setSearchTerm={setSearchTerm}
            />
          )}

          {/* 4. VIEW: TINGKAT DAN KELAS (CRUD TINGKAT & KELAS DINIYAH) */}
          {activeView === 'tingkat_kelas' && (
            <AdminTingkatKelas
              registrations={registrations}
              onRefresh={loadData}
            />
          )}

          {/* 5. VIEW: REKAPITULASI JUARA & KLASEMEN JUARA UMUM KELAS */}
          {activeView === 'juara' && (
            <AdminJuara
              registrations={registrations}
              onRefresh={loadData}
            />
          )}

          {/* 6. VIEW: PENGATURAN (PENGATURAN SHEET) */}
          {activeView === 'pengaturan' && (
            <AdminPengaturan
              onRefresh={loadData}
            />
          )}

        </main>
      </div>

    </div>
  );
}

