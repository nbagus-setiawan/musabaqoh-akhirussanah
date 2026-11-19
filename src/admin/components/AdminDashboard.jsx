import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
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
  MessageSquare, 
  Building2, 
  AlertCircle, 
  Check, 
  Download, 
  Eye, 
  Layers, 
  FileSpreadsheet, 
  ShieldCheck,
  Send,
  FileText,
  Settings,
  X,
  Search,
  Filter
} from 'lucide-react';
import { 
  getActivityLogs, 
  clearActivityLogs,
  getWaliKelasList,
  updateStatus
} from '../../shared/services/api';
import { MASTER_WALI_KELAS } from '../../shared/data/competitions';

export default function AdminDashboard({ 
  registrations = [], 
  onRefresh, 
  setActiveView,
  setSearchTerm
}) {
  const [logs, setLogs] = useState(() => getActivityLogs());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [quickVerifyingId, setQuickVerifyingId] = useState(null);

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

  // Antrean Cepat Verifikasi Santri (Status: Pending)
  const pendingQueue = useMemo(() => {
    return registrations.filter(r => r.Status === 'Pending').slice(0, 5);
  }, [registrations]);

  // 5 Santri Terdaftar Terbaru
  const recentSantri = useMemo(() => {
    return [...registrations].reverse().slice(0, 5);
  }, [registrations]);

  // Handler Verifikasi Cepat (Terima) di Dashboard dalam 0ms
  const handleQuickAccept = async (item) => {
    if (!item || !item.ID_Pendaftaran) return;
    const cleanId = String(item.ID_Pendaftaran).trim();
    setQuickVerifyingId(cleanId);
    try {
      await updateStatus(cleanId, 'Terverifikasi');
      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true
      }).fire({
        icon: 'success',
        title: `Santri ${item.Nama_Lengkap} Diterima (Terverifikasi)`
      });
      if (onRefresh) onRefresh(false);
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memverifikasi',
        text: e.message || 'Terjadi kesalahan saat memverifikasi santri.'
      });
    } finally {
      setQuickVerifyingId(null);
    }
  };

  const handleJumpToClass = (kelasName) => {
    if (setSearchTerm) setSearchTerm(kelasName);
    if (setActiveView) setActiveView('santri');
  };

  const handleSendReminderWA = (item) => {
    const cleanPhone = (item.kontak || '').replace(/^0/, '62').replace(/\D/g, '');
    const statusDesc = item.totalCount === 0 
      ? 'belum ada delegasi santri yang didaftarkan' 
      : `baru terdaftar ${item.totalCount} santri (kuota target: minimal 10 delegasi per kelas)`;
    const msg = encodeURIComponent(
      `Assalamu'alaikum Wr. Wb. Yth. ${item.nama}.\n\n` +
      `Mengingatkan terkait pendaftaran delegasi santri Musabaqah Akhirussanah 1447 H untuk kelas binaan: *${item.kelas}*.\n` +
      `Status pendaftaran saat ini: *${statusDesc}*.\n\n` +
      `Sesuai ketentuan lomba, setiap Kelas Diniyah wajib mengirimkan delegasi. Mohon kiranya dapat segera melengkapi pendaftaran santri melalui sistem formulir musabaqah.\n\n` +
      `Jazakumullah Khairan Katsiran.`
    );
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    }
  };

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
            Monitoring kepatuhan 24 Kelas Diniyah, verifikasi antrean berkas delegasi santri, dan pengundian nomor urut 3 digit.
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
                    className="flex-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[10.5px] font-bold transition-all shadow-2xs flex items-center justify-center space-x-1 cursor-pointer"
                    title={`Kirim WhatsApp Pengingat ke ${item.nama}`}
                  >
                    <MessageSquare className="w-3 h-3 text-white" />
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
          4. ANTREAN VERIFIKASI CEPAT & DATA SANTRI TERBARU
             Memudahkan panitia langsung memverifikasi berkas santri
          ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* KIRI (7 KOLOM): ANTREAN VERIFIKASI CEPAT (STATUS: PENDING) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/70">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    Antrean Verifikasi Berkas
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Klik Terima untuk memvalidasi delegasi santri langsung
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (setActiveView) setActiveView('santri');
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Lihat Semua ({totalPending})
              </button>
            </div>

            {/* List Antrean Santri Pending */}
            <div className="divide-y divide-slate-100 pt-1">
              {pendingQueue.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200/60">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    Alhamdulillah, seluruh berkas telah diverifikasi!
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Tidak ada santri yang berstatus pending saat ini.
                  </p>
                </div>
              ) : (
                pendingQueue.map((item) => (
                  <div 
                    key={item.ID_Pendaftaran}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-2xl transition-colors"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {item.Nama_Lengkap}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          item.Jenis_Kelamin === 'P' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {item.Jenis_Kelamin === 'P' ? 'Putri' : 'Putra'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        <span className="font-semibold text-slate-700">{item.Cabang_Lomba}</span> • {item.Kelas_Kategori || item.Kelas_Diniyah} ({item.Wali_Kelas})
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => handleQuickAccept(item)}
                        disabled={quickVerifyingId === item.ID_Pendaftaran}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all shadow-2xs flex items-center space-x-1 cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {quickVerifyingId === item.ID_Pendaftaran ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin text-white" />
                            <span>Proses...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Terima</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          if (setSearchTerm) setSearchTerm(item.Nama_Lengkap);
                          setActiveView('santri');
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-all cursor-pointer"
                        title="Periksa Lengkap"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 text-right border-t border-slate-100">
            <span className="text-[10.5px] text-slate-400 font-medium">
              Verifikasi mengubah status di aplikasi dan sinkron ke Google Sheets
            </span>
          </div>
        </div>

        {/* KANAN (5 KOLOM): SANTRI TERDAFTAR TERBARU & NO URUT 3 DIGIT */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/70">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    Pendaftar Terbaru
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    5 santri delegasi terakhir
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveView('santri')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Lihat Semua
              </button>
            </div>

            {/* List Santri Terbaru */}
            <div className="space-y-2.5 pt-1">
              {recentSantri.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Belum ada santri yang didaftarkan.
                </div>
              ) : (
                recentSantri.map((item, idx) => (
                  <div 
                    key={item.ID_Pendaftaran || idx}
                    className="p-2.5 rounded-2xl bg-[#F8FAFC] border border-slate-100 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs truncate">
                        {item.Nama_Lengkap}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium truncate">
                        {item.Cabang_Lomba} • {item.Kelas_Kategori || item.Kelas_Diniyah}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {item.Nomor_Urut && String(item.Nomor_Urut).trim() !== '' ? (
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-mono font-bold text-[11px] border border-emerald-200">
                          {String(item.Nomor_Urut).padStart(3, '0')}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-200/70 text-slate-500 font-mono text-[9.5px]">
                          Belum Diundi
                        </span>
                      )}
                      <div className="text-[9.5px] font-bold text-slate-400 mt-0.5">
                        {item.Status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 text-right border-t border-slate-100">
            <span className="text-[10.5px] text-slate-400 font-medium">
              Total {totalPeserta} delegasi santri terdata
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
