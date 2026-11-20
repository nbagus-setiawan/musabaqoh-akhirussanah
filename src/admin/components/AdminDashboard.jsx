import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Users, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  Dices, 
  Trophy, 
  Activity, 
  ArrowRight, 
  RefreshCw, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  UserPlus, 
  TrendingUp, 
  Building2, 
  AlertCircle, 
  Check, 
  Download, 
  Eye, 
  Layers, 
  FileSpreadsheet, 
  ShieldCheck,
  Send,
  Calendar,
  FileText,
  Settings,
  X,
  Search,
  Filter
} from 'lucide-react';
import { 
  getActivityLogs, 
  clearActivityLogs,
  getWaliKelasList
} from '../../shared/services/api';
import { MASTER_WALI_KELAS } from '../../shared/data/competitions';
import WhatsAppIcon from '../../shared/components/WhatsAppIcon';

export default function AdminDashboard({ 
  registrations = [], 
  onRefresh, 
  setActiveView,
  setSearchTerm
}) {
  const [logs, setLogs] = useState(() => getActivityLogs());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State Paginasi & Filter Matriks Kepatuhan 24 Kelas Diniyah
  // Ditampilkan bertahap (8 kelas per halaman) dengan tombol Lanjutkan / Sebelumnya
  const [matrixFilter, setMatrixFilter] = useState('ALL'); // 'ALL' | 'ula' | 'wustho' | 'incomplete'
  const [matrixPage, setMatrixPage] = useState(1);
  const matrixPerPage = 8; // 24 kelas dibagi 8 = tepat 3 halaman

  useEffect(() => {
    setLogs(getActivityLogs());
  }, [registrations]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setLogs(getActivityLogs());
    if (onRefresh) onRefresh(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleExportExcel = () => {
    const exportRows = registrations.map((item, idx) => ({
      'No': idx + 1,
      'Timestamp': item.Timestamp,
      'Wali Kelas': item.Wali_Kelas,
      'ID Pendaftaran': item.ID_Pendaftaran,
      'Nomor Urut': item.Nomor_Urut || '-',
      'Nama Santri': item.Nama_Lengkap,
      'Jenis Kelamin': item.Jenis_Kelamin === 'L' ? 'Putra' : 'Putri',
      'Tingkat': item.Tingkat,
      'Kelas Diniyah': item.Kelas_Kategori || item.Kelas_Diniyah,
      'Cabang Lomba': item.Cabang_Lomba,
      'Nomor WhatsApp': item.Nomor_WA,
      'Status': item.Status,
      'Catatan': item.Catatan || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Rekap Santri');
    XLSX.writeFile(workbook, `Rekap_Musabaqah_1447H_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // =========================================================
  // METRIK OPERASIONAL REAL-TIME
  // =========================================================
  const totalPeserta = registrations.length;
  const totalPutra = registrations.filter(r => r.Jenis_Kelamin === 'L').length;
  const totalPutri = registrations.filter(r => r.Jenis_Kelamin === 'P').length;

  const totalTerverifikasi = registrations.filter(r => r.Status === 'Terverifikasi').length;
  const totalPending = registrations.filter(r => r.Status === 'Pending').length;
  const totalDitolak = registrations.filter(r => r.Status === 'Ditolak').length;
  const totalDiundi = registrations.filter(r => r.Nomor_Urut && String(r.Nomor_Urut).trim() !== '').length;

  const pctTerverifikasi = totalPeserta > 0 ? Math.round((totalTerverifikasi / totalPeserta) * 100) : 0;
  const pctPending = totalPeserta > 0 ? Math.round((totalPending / totalPeserta) * 100) : 0;
  const pctDiundi = totalPeserta > 0 ? Math.round((totalDiundi / totalPeserta) * 100) : 0;

  // Analisis 24 Kelas Diniyah
  const waliList = useMemo(() => {
    try {
      const stored = getWaliKelasList();
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch (e) {}
    return MASTER_WALI_KELAS;
  }, []);

  const complianceMatrix = useMemo(() => {
    return waliList.map((wali, idx) => {
      const kelasName = (wali.kelas || '').trim();
      const waliName = (wali.nama || '').trim();

      const santriList = registrations.filter(r => {
        const k = (r.Kelas_Kategori || r.Kelas_Diniyah || '').toLowerCase().trim();
        const w = (r.Wali_Kelas || '').toLowerCase().trim();
        return (k && k === kelasName.toLowerCase()) || (w && w === waliName.toLowerCase());
      });

      const totalCount = santriList.length;
      const verifiedCount = santriList.filter(r => r.Status === 'Terverifikasi').length;
      const diundiCount = santriList.filter(r => r.Nomor_Urut && String(r.Nomor_Urut).trim() !== '').length;

      let status = 'BELUM';
      if (totalCount >= 10) {
        status = 'LENGKAP';
      } else if (totalCount > 0) {
        status = 'SEBAGIAN';
      }

      return {
        ...wali,
        no: idx + 1,
        totalCount,
        verifiedCount,
        diundiCount,
        status,
        santriList
      };
    });
  }, [waliList, registrations]);

  const countLengkap = complianceMatrix.filter(m => m.status === 'LENGKAP').length;
  const countSebagian = complianceMatrix.filter(m => m.status === 'SEBAGIAN').length;
  const countBelum = complianceMatrix.filter(m => m.status === 'BELUM').length;
  const countIncomplete = countSebagian + countBelum;

  // Filter List Kepatuhan Kelas Diniyah
  const filteredCompliance = useMemo(() => {
    return complianceMatrix.filter(item => {
      if (matrixFilter === 'ula') {
        return (item.tingkat || '').toLowerCase().includes('ula');
      }
      if (matrixFilter === 'wustho') {
        return (item.tingkat || '').toLowerCase().includes('wustho');
      }
      if (matrixFilter === 'incomplete') {
        return item.status !== 'LENGKAP';
      }
      return true;
    });
  }, [complianceMatrix, matrixFilter]);

  // Total Halaman Matriks Kelas Diniyah
  const totalMatrixPages = Math.max(1, Math.ceil(filteredCompliance.length / matrixPerPage));
  const currentSafePage = Math.min(matrixPage, totalMatrixPages);

  // Potongan 8 Kelas per Halaman
  const pagedCompliance = useMemo(() => {
    const start = (currentSafePage - 1) * matrixPerPage;
    return filteredCompliance.slice(start, start + matrixPerPage);
  }, [filteredCompliance, currentSafePage, matrixPerPage]);

  const startMatrixIndex = filteredCompliance.length === 0 ? 0 : (currentSafePage - 1) * matrixPerPage + 1;
  const endMatrixIndex = Math.min(currentSafePage * matrixPerPage, filteredCompliance.length);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalMatrixPages) {
      setMatrixPage(newPage);
    }
  };

  const handleFilterChange = (newFilter) => {
    setMatrixFilter(newFilter);
    setMatrixPage(1);
  };

  // 5 Santri Terdaftar Terbaru
  const recentSantri = useMemo(() => {
    return [...registrations].reverse().slice(0, 5);
  }, [registrations]);

  const handleJumpToClass = (kelasName) => {
    if (setSearchTerm) setSearchTerm(kelasName);
    if (setActiveView) setActiveView('santri');
  };

  const handleSendReminderWA = (item) => {
    const cleanPhone = (item.kontak || '').replace(/^0/, '62').replace(/\D/g, '');
    const statusDesc = item.totalCount === 0 
      ? 'Belum ada santri yang didaftarkan (0/10 Kuota)' 
      : `Baru terdaftar ${item.totalCount}/10 santri`;
    const msg = encodeURIComponent(
      `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
      `Kepada Yth. *${item.nama}*\n` +
      `Wali Kelas Diniyah: *${item.kelas}*\n` +
      `Pondok Pesantren Al-Falah Putak\n\n` +
      `Semoga Ustadz/Ustadzah senantiasa dalam limpahan rahmat dan kesehatan dari Allah SWT.\n\n` +
      `Kami dari Panitia Pelaksana menyampaikan pengingat resmi terkait pendaftaran delegasi santri dalam rangka *Musabaqah Akhirussanah 1447 H*.\n\n` +
      `Status Kuota Kelas Saat Ini: *${statusDesc}*.\n\n` +
      `Mohon kiranya Ustadz/Ustadzah dapat segera melengkapi data delegasi santri secara mandiri melalui portal resmi pendaftaran berikut:\n` +
      `https://musabaqoh-akhirussanah.vercel.app/\n\n` +
      `Besar harapan kami agar pendaftaran dapat diselesaikan tepat waktu demi kelancaran pengundian nomor urut dan persiapan jadwal lomba.\n\n` +
      `Atas perhatian, dedikasi, dan kerja sama Ustadz/Ustadzah, kami haturkan terima kasih yang sebesar-besarnya.\n` +
      `Jazakumullah Khairan Katsiran.\n\n` +
      `Wassalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
      `*Panitia Musabaqah Akhirussanah 1447 H*\n` +
      `YPPS Al-Falah Putak`
    );
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    }
  };

  // =========================================================
  // HELPER KALENDER MUSABAQAH (WIDGET TANGGAL SEPERTI TADI)
  // =========================================================
  const todayDate = new Date();
  const currentYear = todayDate.getFullYear();
  const currentMonth = todayDate.getMonth();
  const currentDayNum = todayDate.getDate();
  const currentMonthName = todayDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Perhitungan Hari Kalender Bulan Ini
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0: Ahad, 1: Senin, ...
  const startDayOffset = (firstDayIndex + 6) % 7; // Mengatur Senin sebagai kolom pertama (0..6)
  const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays = useMemo(() => {
    const days = [];
    // Hari dari bulan sebelumnya sebagai padding
    for (let i = startDayOffset - 1; i >= 0; i--) {
      days.push({ day: prevMonthTotalDays - i, isCurrentMonth: false, isToday: false });
    }
    // Hari di bulan berjalan
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({ day: i, isCurrentMonth: true, isToday: i === currentDayNum });
    }
    // Hari di bulan berikutnya untuk melengkapi baris grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isCurrentMonth: false, isToday: false });
    }
    return days;
  }, [currentYear, currentMonth, currentDayNum, daysInCurrentMonth, startDayOffset, prevMonthTotalDays]);

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-7 max-w-7xl mx-auto bg-[#F4F7FC]">
      
      {/* =========================================================
          1. HEADER SAMBUTAN OPERASIONAL PANITIA
          ========================================================= */}
      <div className="relative rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-indigo-50/70 border border-blue-100/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-600 text-white tracking-wide uppercase">
              Musabaqah Akhirussanah 1447 H
            </span>
            <span className="text-xs font-semibold text-slate-500">
              YPPS Al-Falah Putak
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Pusat Kendali Administrasi & Verifikasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Monitoring kepatuhan 24 Kelas Diniyah, verifikasi berkas delegasi santri, dan pengundian nomor urut 3 digit.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0 self-start md:self-center">
          <button
            onClick={() => setActiveView('santri')}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs flex items-center space-x-2 cursor-pointer active:scale-95"
          >
            <Dices className="w-4 h-4 text-white" />
            <span>Undian 3 Digit</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 transition-all shadow-xs flex items-center space-x-2 cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all shadow-xs cursor-pointer active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* =========================================================
          2. KARTU METRIK UTAMA (4 KARTU SQUIRCLE PASTEL JELAS & TRANSPARAN)
          ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* KPI 1: TOTAL DELEGASI */}
        <div 
          onClick={() => setActiveView('santri')}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center space-x-4 group"
        >
          <div className="w-13 h-13 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/70 group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block tracking-wider uppercase leading-none">
              Total Delegasi
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight block mt-1">
              {totalPeserta}
            </span>
            <span className="text-[11px] font-semibold text-blue-600 block mt-0.5">
              {totalPutra} Putra • {totalPutri} Putri
            </span>
          </div>
        </div>

        {/* KPI 2: TERVERIFIKASI (SAH) */}
        <div 
          onClick={() => setActiveView('santri')}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center space-x-4 group"
        >
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/70 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block tracking-wider uppercase leading-none">
              Terverifikasi
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight block mt-1">
              {totalTerverifikasi}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 block mt-0.5">
              {pctTerverifikasi}% Berkas Sah
            </span>
          </div>
        </div>

        {/* KPI 3: MENUNGGU VERIFIKASI (PENDING) */}
        <div 
          onClick={() => setActiveView('santri')}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center space-x-4 group"
        >
          <div className="w-13 h-13 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/70 group-hover:scale-105 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block tracking-wider uppercase leading-none">
              Antrean Pending
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight block mt-1 font-mono">
              {totalPending}
            </span>
            <span className="text-[11px] font-semibold text-amber-600 block mt-0.5">
              {totalPending > 0 ? 'Perlu dicek panitia' : 'Semua telah diverifikasi'}
            </span>
          </div>
        </div>

        {/* KPI 4: NOMOR URUT TERUNDI (3 DIGIT) */}
        <div 
          onClick={() => setActiveView('santri')}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center space-x-4 group"
        >
          <div className="w-13 h-13 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100/70 group-hover:scale-105 transition-transform">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block tracking-wider uppercase leading-none">
              Undian 3 Digit
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight block mt-1 font-mono">
              {totalDiundi}
            </span>
            <span className="text-[11px] font-semibold text-purple-600 block mt-0.5">
              {pctDiundi}% Santri Siap Tampil
            </span>
          </div>
        </div>

      </div>

      {/* =========================================================
          3. MATRIKS KEPATUHAN 24 KELAS DINIYAH (DENGAN PAGINASI "LANJUTKAN")
             Kebutuhan utama panitia untuk monitoring 24 kelas
             Dibagi 8 kelas per halaman dengan tombol "Sebelumnya" & "Lanjutkan"
          ========================================================= */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] p-5 sm:p-6 space-y-5">
        
        {/* Header Matriks: Judul, Ringkasan Status, dan Tab Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Matriks Kepatuhan 24 Kelas Diniyah
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
                Target: 10 Delegasi / Kelas
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pantau kelengkapan santri per kelas. Gunakan tombol aksi untuk mengirim pesan WhatsApp ke Wali Kelas.
            </p>
          </div>

          {/* Tab Filter: Semua, Tingkat Ula, Tingkat Wustho, Belum Lengkap */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleFilterChange('ALL')}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                matrixFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua (24 Kelas)
            </button>
            <button
              onClick={() => handleFilterChange('ula')}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                matrixFilter === 'ula'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tingkat Ula (16)
            </button>
            <button
              onClick={() => handleFilterChange('wustho')}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                matrixFilter === 'wustho'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tingkat Wustho (8)
            </button>
            <button
              onClick={() => handleFilterChange('incomplete')}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                matrixFilter === 'incomplete'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Belum Lengkap ({countIncomplete})
            </button>
          </div>
        </div>

        {/* Ringkasan Pill Status Kepatuhan */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>{countLengkap} Kelas Lengkap (Kuota 10 Terpenuhi)</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/70 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>{countSebagian} Kelas Terisi Sebagian (1 - 9 Santri)</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200/70 font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>{countBelum} Kelas Belum Mendaftar (0 Santri)</span>
          </div>
        </div>

        {/* Grid 8 Kartu Kelas Diniyah (4 Kolom di Desktop, 2 Baris) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {pagedCompliance.map((item) => {
            const isUla = (item.tingkat || '').toLowerCase().includes('ula');
            const pctFill = Math.min(100, Math.round((item.totalCount / 10) * 100));

            return (
              <div 
                key={item.kelas || item.no}
                className="bg-[#F8FAFC] rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
              >
                {/* Header Kartu Kelas */}
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      #{String(item.no).padStart(2, '0')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold ${
                      isUla ? 'bg-blue-100/70 text-blue-800' : 'bg-purple-100/70 text-purple-800'
                    }`}>
                      {isUla ? 'Tingkat Ula' : 'Tingkat Wustho'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug mt-1 truncate" title={item.kelas}>
                    {item.kelas}
                  </h3>

                  <div className="flex items-center space-x-1 text-[11px] text-slate-500 font-medium mt-1 truncate" title={item.nama}>
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{item.nama}</span>
                  </div>
                </div>

                {/* Progress Kuota 10 Delegasi */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600">
                      Kuota Terdaftar
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {item.totalCount} / 10
                    </span>
                  </div>

                  {/* Progress Bar Visual */}
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        item.status === 'LENGKAP' 
                          ? 'bg-emerald-500' 
                          : item.status === 'SEBAGIAN' 
                          ? 'bg-amber-500' 
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${item.totalCount === 0 ? 4 : pctFill}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      item.status === 'LENGKAP'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'SEBAGIAN'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {item.status === 'LENGKAP' ? 'LENGKAP' : item.status === 'SEBAGIAN' ? 'SEBAGIAN' : 'BELUM ADA'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {item.verifiedCount} Sah
                    </span>
                  </div>
                </div>

                {/* Tombol Aksi Langsung (UI & UX yang Jelas Tanpa Tebak-tebakan) */}
                <div className="pt-2 border-t border-slate-200/70 flex items-center space-x-2">
                  <button
                    onClick={() => handleSendReminderWA(item)}
                    className="flex-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[10.5px] font-bold transition-all shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer"
                    title={`Kirim WhatsApp Pengingat ke ${item.nama}`}
                  >
                    <WhatsAppIcon variant="white" className="w-3.5 h-3.5 text-white shrink-0" />
                    <span>Kirim WA</span>
                  </button>

                  <button
                    onClick={() => handleJumpToClass(item.kelas)}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-700 text-[10.5px] font-bold border border-slate-300 transition-all cursor-pointer"
                    title="Lihat Santri Kelas Ini"
                  >
                    Lihat
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Navigasi Paginasi Matriks Kelas Diniyah (Lanjutkan / Sebelumnya) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Menampilkan Kelas <strong className="text-slate-800">{startMatrixIndex} - {endMatrixIndex}</strong> dari <strong className="text-slate-800">{filteredCompliance.length}</strong> Kelas Diniyah (Halaman {currentSafePage} dari {totalMatrixPages})
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentSafePage - 1)}
              disabled={currentSafePage === 1}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            {/* Nomor Halaman */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalMatrixPages }, (_, i) => i + 1).map(pageNo => (
                <button
                  key={pageNo}
                  onClick={() => handlePageChange(pageNo)}
                  className={`w-7 h-7 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pageNo === currentSafePage
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNo}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentSafePage + 1)}
              disabled={currentSafePage === totalMatrixPages}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1 cursor-pointer shadow-xs"
            >
              <span>Lanjutkan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* =========================================================
          4. KALENDER MUSABAQAH (TANGGAL SEPERTI TADI) & DATA SANTRI TERKINI
             Menggantikan antrean verifikasi dengan widget tanggal (kalender)
             sesuai permintaan pengguna
          ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* KIRI (5 KOLOM): KALENDER MUSABAQAH (WIDGET TANGGAL SEPERTI TADI) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/70">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    Kalender Musabaqah
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Jadwal & Agenda Perlombaan
                  </span>
                </div>
              </div>

              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100/70">
                {currentMonthName}
              </span>
            </div>

            {/* Grid Kalender Mini (Sn Sl Rb Km Jm Sb Ah) */}
            <div className="pt-3 text-center text-xs">
              <div className="grid grid-cols-7 text-[10.5px] font-bold text-slate-400 mb-2.5">
                <span>Sn</span>
                <span>Sl</span>
                <span>Rb</span>
                <span>Km</span>
                <span>Jm</span>
                <span>Sb</span>
                <span className="text-rose-500">Ah</span>
              </div>

              <div className="grid grid-cols-7 gap-y-2 text-[11px] font-semibold text-slate-700">
                {calendarDays.map((item, idx) => {
                  const isAhad = idx % 7 === 6;
                  return (
                    <div key={idx} className="flex items-center justify-center">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          item.isToday
                            ? 'bg-blue-600 text-white font-extrabold shadow-xs'
                            : !item.isCurrentMonth
                            ? 'text-slate-300 font-normal cursor-default'
                            : isAhad
                            ? 'text-rose-500 hover:bg-rose-50 cursor-pointer font-bold'
                            : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                        }`}
                      >
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-2.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 font-medium">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Hari Ini: {currentDayNum} {currentMonthName}</span>
            </span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60">
              Agenda Aktif
            </span>
          </div>
        </div>

        {/* KANAN (7 KOLOM): DATA SANTRI TERDAFTAR TERKINI */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/70">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    Data Santri Terdaftar Terkini
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    5 delegasi santri pendaftar terakhir
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveView('santri')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Lihat Semua ({totalPeserta})
              </button>
            </div>

            {/* Tabel Santri Terkini */}
            <div className="overflow-x-auto pt-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold text-[11px] border-b border-slate-100">
                    <th className="pb-3 font-normal">Nama Santri</th>
                    <th className="pb-3 font-normal">Kelas Diniyah</th>
                    <th className="pb-3 font-normal">Cabang Lomba</th>
                    <th className="pb-3 font-normal text-center">No. Urut</th>
                    <th className="pb-3 font-normal text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentSantri.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400 text-xs">
                        Belum ada santri yang didaftarkan.
                      </td>
                    </tr>
                  ) : (
                    recentSantri.map((item, idx) => {
                      const isPutri = item.Jenis_Kelamin === 'P';
                      return (
                        <tr key={item.ID_Pendaftaran || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 pr-2">
                            <span className="font-bold text-slate-900 block truncate max-w-[150px]">
                              {item.Nama_Lengkap}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.ID_Pendaftaran}
                            </span>
                          </td>
                          <td className="py-3 text-slate-600 font-medium">
                            <span className="block truncate max-w-[130px]">{item.Kelas_Kategori || item.Kelas_Diniyah}</span>
                            <span className={`inline-block px-1 rounded text-[9px] font-bold ${
                              isPutri ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {isPutri ? 'Putri' : 'Putra'}
                            </span>
                          </td>
                          <td className="py-3 text-slate-700 font-medium truncate max-w-[130px]">
                            {item.Cabang_Lomba}
                          </td>
                          <td className="py-3 text-center font-mono">
                            {item.Nomor_Urut && String(item.Nomor_Urut).trim() !== '' ? (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                                {String(item.Nomor_Urut).padStart(3, '0')}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs">-</span>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              item.Status === 'Terverifikasi'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {item.Status === 'Terverifikasi' ? 'Sah' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 text-right border-t border-slate-100">
            <span className="text-[10px] text-slate-400">
              Total {totalPeserta} delegasi santri terdaftar di database
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
