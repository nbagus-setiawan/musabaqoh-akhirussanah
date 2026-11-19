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
  Trash2, 
  ExternalLink,
  BookOpen, 
  Award, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft,
  UserPlus, 
  FileText, 
  Layers, 
  BarChart3,
  Download,
  Eye,
  Megaphone,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  Check,
  TrendingUp,
  MessageSquare,
  Phone,
  Search,
  Building2,
  X
} from 'lucide-react';
import { 
  getActivityLogs, 
  clearActivityLogs,
  getWaliKelasList
} from '../../shared/services/api';
import { MASTER_WALI_KELAS } from '../../shared/data/competitions';

export default function AdminDashboard({ 
  registrations = [], 
  onRefresh, 
  setActiveView,
  setSearchTerm
}) {
  const [logs, setLogs] = useState(() => getActivityLogs());
  const [logFilter, setLogFilter] = useState('ALL');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setLogs(getActivityLogs());
  }, [registrations]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setLogs(getActivityLogs());
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleClearLogs = () => {
    clearActivityLogs();
    setLogs([]);
    setShowClearConfirm(false);
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
      'Kelas': item.Kelas_Kategori,
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

  // Statistik Utama (Tanpa Ulya, Sesuai 24 Kelas Diniyah & MHQ)
  const totalPeserta = registrations.length;
  
  const santriUla = registrations.filter(r => (r.Tingkat || '').toLowerCase().includes('ula'));
  const santriWustho = registrations.filter(r => (r.Tingkat || '').toLowerCase().includes('wustho'));
  const santriMHQ = registrations.filter(r => {
    const t = (r.Tingkat || '').toLowerCase();
    const c = (r.Cabang_Lomba || '').toLowerCase();
    return t.includes('mhq') || t.includes('qur\'an') || c.includes('mhq');
  });

  const totalUla = santriUla.length;
  const totalWustho = santriWustho.length;
  const totalMHQ = santriMHQ.length;

  const totalTerverifikasi = registrations.filter(r => r.Status === 'Terverifikasi').length;
  const totalPending = registrations.filter(r => r.Status === 'Pending').length;
  const totalDitolak = registrations.filter(r => r.Status === 'Ditolak').length;
  const totalDiundi = registrations.filter(r => r.Nomor_Urut && String(r.Nomor_Urut).trim() !== '').length;

  // Persentase
  const pctUla = totalPeserta > 0 ? Math.round((totalUla / totalPeserta) * 100) : 0;
  const pctWustho = totalPeserta > 0 ? Math.round((totalWustho / totalPeserta) * 100) : 0;
  const pctMHQ = totalPeserta > 0 ? Math.round((totalMHQ / totalPeserta) * 100) : 0;

  const pctTerverifikasi = totalPeserta > 0 ? Math.round((totalTerverifikasi / totalPeserta) * 100) : 0;
  const pctPending = totalPeserta > 0 ? Math.round((totalPending / totalPeserta) * 100) : 0;
  const pctDitolak = totalPeserta > 0 ? Math.round((totalDitolak / totalPeserta) * 100) : 0;
  const pctDiundi = totalPeserta > 0 ? Math.round((totalDiundi / totalPeserta) * 100) : 0;

  // =========================================================
  // MATRIKS KEPATUHAN & KESIAPAN 24 KELAS DINIYAH (ZERO GUESSWORK)
  // =========================================================
  const [matrixFilter, setMatrixFilter] = useState('ALL'); // 'ALL' | 'BELUM' | 'SEBAGIAN' | 'LENGKAP'
  const [matrixTingkat, setMatrixTingkat] = useState('ALL'); // 'ALL' | 'ula' | 'wustho'
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixPage, setMatrixPage] = useState(1);
  const [matrixItemsPerPage, setMatrixItemsPerPage] = useState(8);

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
        const k = (r.Kelas_Kategori || '').toLowerCase().trim();
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
  const countUla = complianceMatrix.filter(m => (m.tingkat || '').toLowerCase() === 'ula').length;
  const countWustho = complianceMatrix.filter(m => (m.tingkat || '').toLowerCase() === 'wustho').length;

  const filteredMatrix = complianceMatrix.filter(m => {
    if (matrixTingkat !== 'ALL' && (m.tingkat || '').toLowerCase() !== matrixTingkat.toLowerCase()) return false;
    if (matrixFilter !== 'ALL' && m.status !== matrixFilter) return false;
    if (matrixSearch) {
      const q = matrixSearch.toLowerCase();
      const match = (
        (m.kelas || '').toLowerCase().includes(q) ||
        (m.nama || '').toLowerCase().includes(q) ||
        (m.kontak || '').includes(q)
      );
      if (!match) return false;
    }
    return true;
  });

  const matrixTotalPages = Math.max(1, Math.ceil(filteredMatrix.length / matrixItemsPerPage));
  const currentMatrixPage = Math.min(matrixPage, matrixTotalPages);
  const matrixStartIndex = (currentMatrixPage - 1) * matrixItemsPerPage;
  const paginatedMatrix = filteredMatrix.slice(matrixStartIndex, matrixStartIndex + matrixItemsPerPage);

  const handleJumpToClass = (kelasName) => {
    if (setSearchTerm) setSearchTerm(kelasName);
    if (setActiveView) setActiveView('santri');
  };

  const handleSendReminderWA = (item) => {
    const cleanPhone = (item.kontak || '').replace(/^0/, '62').replace(/\D/g, '');
    const statusDesc = item.totalCount === 0 
      ? 'belum ada delegasi santri yang didaftarkan' 
      : `baru terdaftar ${item.totalCount} santri (kuota lengkap: minimal 10 delegasi)`;
    const msg = encodeURIComponent(
      `Assalamu'alaikum Wr. Wb. Yth. ${item.nama}.\n\n` +
      `Mengingatkan terkait pendaftaran delegasi santri Musabaqah Akhirussanah 1447 H untuk kelas binaan: *${item.kelas}*.\n` +
      `Status pendaftaran saat ini: *${statusDesc}*.\n\n` +
      `Sesuai ketentuan lomba, setiap kelas wajib mengirimkan delegasi. Mohon kiranya dapat segera melengkapi pendaftaran santri melalui sistem formulir musabaqah.\n\n` +
      `Jazakumullah Khairan Katsiran.`
    );
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    }
  };

  // =========================================================
  // DATA & KOORDINAT GRAFIK GARIS GUNUNG (AREA CHART)
  // =========================================================
  const timelineDays = 7;
  const today = new Date();
  
  const dailyStats = Array.from({ length: timelineDays }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (timelineDays - 1 - i));
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const dateKeySlash = `${day}/${month}/${year}`;
    const dateKeyDash = `${year}-${month}-${day}`;
    const shortLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });

    const count = registrations.filter(r => {
      const ts = r.Timestamp || '';
      return ts.includes(dateKeySlash) || ts.startsWith(`${day}/${month}`) || ts.includes(dateKeyDash);
    }).length;

    return { label: shortLabel, dayName, count, dateKey: dateKeySlash };
  });

  const svgWidth = 840;
  const svgHeight = 210;
  const padLeft = 45;
  const padRight = 45;
  const padTop = 35;
  const padBottom = 25;
  const usableWidth = svgWidth - padLeft - padRight;
  const usableHeight = svgHeight - padTop - padBottom;

  const maxDailyVal = Math.max(...dailyStats.map(d => d.count), 4);
  const peakDay = [...dailyStats].sort((a, b) => b.count - a.count)[0];

  const mountainPoints = dailyStats.map((item, idx) => {
    const x = padLeft + (idx / (timelineDays - 1)) * usableWidth;
    const y = padTop + usableHeight - (item.count / maxDailyVal) * usableHeight;
    return { x, y, ...item };
  });

  // Spline Catmull-Rom ke Cubic Bezier yang melengkung mulus (bentuk kurva gunung)
  const generateSmoothPath = (pts) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const linePathD = generateSmoothPath(mountainPoints);
  const baselineY = (svgHeight - padBottom + 8).toFixed(1);
  const areaPathD = `${linePathD} L ${mountainPoints[mountainPoints.length - 1].x.toFixed(1)},${baselineY} L ${mountainPoints[0].x.toFixed(1)},${baselineY} Z`;

  // Filter Log
  const filteredLogs = logs.filter(item => {
    if (logFilter === 'ALL') return true;
    return item.type === logFilter;
  });

  return (
    <div className="p-3.5 sm:p-6 space-y-5 max-w-7xl mx-auto">
      
      {/* =========================================================
          1. WELCOME HERO BANNER (Mirip Banner di Referensi Desain)
          ========================================================= */}
      <div className="relative rounded-2xl sm:rounded-3xl p-5 sm:p-7 bg-gradient-to-br from-emerald-50 via-teal-50/70 to-emerald-100/60 border border-emerald-200/80 shadow-xs overflow-hidden">
        
        {/* Ornamen Lingkaran Halus Latar Belakang */}
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-emerald-300/20 pointer-events-none blur-2xl"></div>
        <div className="absolute right-36 -bottom-10 w-40 h-40 rounded-full bg-amber-300/20 pointer-events-none blur-xl"></div>

        <div className="relative z-10 space-y-2">
          
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-800 text-white text-[11px] font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Musabaqah Akhirussanah 1447 H / 2026 M</span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Ahlan wa Sahlan, <span className="text-emerald-800">Ustadz Admin!</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            Pusat kendali operasional pendaftaran delegasi santri YPPS Al-Falah Putak.
          </p>

          {/* Quick Status Chips */}
          <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-700">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/90 border border-emerald-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Undian 3 Digit Bebas Duplikat</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200/80 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{totalTerverifikasi} Santri Lolos Verifikasi</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200/80 shadow-2xs">
              <Dices className="w-3.5 h-3.5 text-indigo-600" />
              <span>{totalDiundi} / {totalPeserta} Sudah Diundi</span>
            </span>
            <button
              onClick={() => setActiveView('juara')}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-300 text-amber-900 shadow-2xs transition-colors cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Klasemen Juara Umum Kelas</span>
            </button>
          </div>

        </div>
      </div>

      {/* =========================================================
          2. KARTU METRIK UTAMA (Super Bersih, Minimalis & Lega)
          ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* KPI 1: TOTAL SANTRI */}
        <div 
          onClick={() => setActiveView('santri')}
          className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center space-x-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block leading-tight">
              Total Delegasi
            </span>
            <span className="text-2xl font-black text-slate-900 leading-none">
              {totalPeserta}
            </span>
          </div>
        </div>

        {/* KPI 2: TINGKAT ULA */}
        <div 
          onClick={() => {
            if (setSearchTerm) setSearchTerm('Ula');
            setActiveView('santri');
          }}
          className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center space-x-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block leading-tight">
              Tingkat Ula ({pctUla}%)
            </span>
            <span className="text-2xl font-black text-slate-900 leading-none">
              {totalUla}
            </span>
          </div>
        </div>

        {/* KPI 3: TINGKAT WUSTHO */}
        <div 
          onClick={() => {
            if (setSearchTerm) setSearchTerm('Wustho');
            setActiveView('santri');
          }}
          className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center space-x-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block leading-tight">
              Tingkat Wustho ({pctWustho}%)
            </span>
            <span className="text-2xl font-black text-slate-900 leading-none">
              {totalWustho}
            </span>
          </div>
        </div>

        {/* KPI 4: CABANG MHQ */}
        <div 
          onClick={() => {
            if (setSearchTerm) setSearchTerm('MHQ');
            setActiveView('santri');
          }}
          className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center space-x-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100 group-hover:scale-105 transition-transform">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block leading-tight">
              Cabang MHQ
            </span>
            <span className="text-2xl font-black text-slate-900 leading-none">
              {totalMHQ}
            </span>
          </div>
        </div>

        {/* KPI 5: TERVERIFIKASI */}
        <div 
          onClick={() => setActiveView('santri')}
          className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center space-x-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block leading-tight">
              Terverifikasi ({pctTerverifikasi}%)
            </span>
            <span className="text-2xl font-black text-emerald-800 leading-none">
              {totalTerverifikasi}
            </span>
          </div>
        </div>

      </div>

      {/* =========================================================
          3. MATRIKS KEPATUHAN & KESIAPAN 24 KELAS DINIYAH (ZERO GUESSWORK)
          ========================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        
        {/* Header Matriks */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Matriks Kepatuhan 24 Kelas Diniyah
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                  16 Ula + 8 Wustho
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau kepatuhan delegasi kelas tanpa tebak-tebakan. Klik nama kelas untuk melihat santri atau hubungi Wali Kelas via WhatsApp.
              </p>
            </div>
          </div>

          {/* Quick Counter Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => { setMatrixFilter('ALL'); setMatrixPage(1); }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                matrixFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua ({complianceMatrix.length})
            </button>
            <button
              onClick={() => { setMatrixFilter('LENGKAP'); setMatrixPage(1); }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                matrixFilter === 'LENGKAP'
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
              }`}
            >
              Lengkap ({countLengkap})
            </button>
            <button
              onClick={() => { setMatrixFilter('SEBAGIAN'); setMatrixPage(1); }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                matrixFilter === 'SEBAGIAN'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70'
              }`}
            >
              Sebagian ({countSebagian})
            </button>
            <button
              onClick={() => { setMatrixFilter('BELUM'); setMatrixPage(1); }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                matrixFilter === 'BELUM'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100/70'
              }`}
            >
              Belum Mendaftar ({countBelum})
            </button>
          </div>
        </div>

        {/* Filter Tingkat dan Bar Pencarian */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filter Jenjang Tingkat (Semua 24 / Ula 16 / Wustho 8) */}
          <div className="flex items-center space-x-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => { setMatrixTingkat('ALL'); setMatrixPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                matrixTingkat === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Jenjang ({complianceMatrix.length})
            </button>
            <button
              type="button"
              onClick={() => { setMatrixTingkat('ula'); setMatrixPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                matrixTingkat === 'ula'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tingkat Ula ({countUla})
            </button>
            <button
              type="button"
              onClick={() => { setMatrixTingkat('wustho'); setMatrixPage(1); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                matrixTingkat === 'wustho'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tingkat Wustho ({countWustho})
            </button>
          </div>

          {/* Search Bar dalam Matriks */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kelas, wali kelas, kontak..."
              value={matrixSearch}
              onChange={(e) => {
                setMatrixSearch(e.target.value);
                setMatrixPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-emerald-700 focus:bg-white bg-slate-50/60 transition-all placeholder:text-slate-400"
            />
            {matrixSearch && (
              <button
                type="button"
                onClick={() => {
                  setMatrixSearch('');
                  setMatrixPage(1);
                }}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tabel Matriks 24 Kelas */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/70">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3">Kelas Diniyah</th>
                <th className="py-3 px-3">Wali Kelas</th>
                <th className="py-3 px-3">Progres Delegasi</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center w-40">Aksi Panitia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMatrix.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada kelas yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                paginatedMatrix.map((item) => {
                  const isPutri = (item.kelas || '').toLowerCase().includes('putri');
                  const isUla = (item.tingkat || '').toLowerCase() === 'ula';
                  const pct = Math.min(100, Math.round((item.totalCount / 10) * 100));

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* No */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                        {item.no}
                      </td>

                      {/* Kelas Diniyah */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                          <span>{item.kelas}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            isPutri ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {isPutri ? 'Putri' : 'Putra'}
                          </span>
                        </div>
                        <span className={`text-[10px] font-semibold ${
                          isUla ? 'text-amber-700' : 'text-teal-700'
                        }`}>
                          {isUla ? 'Tingkat Ula' : 'Tingkat Wustho'}
                        </span>
                      </td>

                      {/* Wali Kelas */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800 leading-tight">
                          {item.nama}
                        </div>
                        {item.kontak ? (
                          <span className="text-[10px] font-mono text-slate-500">
                            {item.kontak}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            Kontak belum diisi
                          </span>
                        )}
                      </td>

                      {/* Progres Delegasi */}
                      <td className="py-2.5 px-3">
                        <div className="space-y-1 max-w-[170px]">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                            <span>{item.totalCount} Delegasi</span>
                            <span className="text-[10px] text-slate-400 font-mono">{pct}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                item.status === 'LENGKAP' 
                                  ? 'bg-emerald-600' 
                                  : item.status === 'SEBAGIAN' 
                                  ? 'bg-amber-500' 
                                  : 'bg-slate-300'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex items-center space-x-2 text-[9.5px] text-slate-400 font-mono">
                            <span>Sah: {item.verifiedCount}</span>
                            <span>•</span>
                            <span>Diundi: {item.diundiCount}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center">
                        {item.status === 'LENGKAP' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Check className="w-3 h-3 mr-1 text-emerald-600" />
                            <span>Lengkap</span>
                          </span>
                        ) : item.status === 'SEBAGIAN' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 mr-1 text-amber-600" />
                            <span>Sebagian ({item.totalCount})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">
                            <AlertCircle className="w-3 h-3 mr-1 text-rose-600" />
                            <span>Belum Mendaftar</span>
                          </span>
                        )}
                      </td>

                      {/* Aksi Panitia */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Tombol Lihat Santri */}
                          <button
                            onClick={() => handleJumpToClass(item.kelas)}
                            title={`Lihat delegasi santri ${item.kelas}`}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[10px] border border-emerald-200 transition-colors cursor-pointer flex items-center space-x-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Santri</span>
                          </button>

                          {/* Tombol Ingatkan via WA */}
                          <button
                            onClick={() => handleSendReminderWA(item)}
                            title={`Kirim pesan pengingat WA ke ${item.nama}`}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-semibold text-[10px] border border-slate-200 transition-colors cursor-pointer flex items-center space-x-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WA</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Kontrol Paginasi Matriks 24 Kelas */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Info Range & Pilihan Baris Per Halaman */}
          <div className="flex flex-wrap items-center gap-3 text-slate-500 font-medium">
            <span>
              Menampilkan{' '}
              <strong className="text-slate-800 font-mono">
                {filteredMatrix.length === 0 ? 0 : matrixStartIndex + 1}
              </strong>
              {' '}-{' '}
              <strong className="text-slate-800 font-mono">
                {Math.min(matrixStartIndex + matrixItemsPerPage, filteredMatrix.length)}
              </strong>
              {' '}dari{' '}
              <strong className="text-slate-800 font-mono">
                {filteredMatrix.length}
              </strong>
              {' '}Kelas Diniyah
            </span>

            <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200">
              <span className="text-[11px] text-slate-400">Tampilkan:</span>
              <select
                value={matrixItemsPerPage}
                onChange={(e) => {
                  setMatrixItemsPerPage(Number(e.target.value));
                  setMatrixPage(1);
                }}
                aria-label="Jumlah baris kelas per halaman"
                className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 outline-none focus:border-emerald-700 text-xs cursor-pointer"
              >
                <option value={8}>8 Kelas / Halaman</option>
                <option value={12}>12 Kelas / Halaman</option>
                <option value={24}>Semua (24 Kelas)</option>
              </select>
            </div>
          </div>

          {/* Tombol Navigasi Halaman: Sebelumnya, Nomor Halaman, Selanjutnya */}
          {matrixTotalPages > 1 && (
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setMatrixPage(p => Math.max(1, p - 1))}
                disabled={currentMatrixPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>

              <div className="flex items-center space-x-1 px-1">
                {Array.from({ length: matrixTotalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setMatrixPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentMatrixPage === pageNum
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setMatrixPage(p => Math.min(matrixTotalPages, p + 1))}
                disabled={currentMatrixPage === matrixTotalPages}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================
          3. GRAFIK GARIS GUNUNG (TREN PENDAFTARAN SANTRI)
          ========================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
        {/* Header Grafik Gunung */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Tren Pendaftaran Santri
                </h3>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>7 Hari Terakhir</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Grafik kurva pendaftaran delegasi santri harian Musabaqah Akhirussanah
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700">
              <span className="text-[10px] text-slate-400 block leading-tight">Total Delegasi</span>
              <span className="font-bold text-slate-900 font-mono text-sm">{totalPeserta} Santri</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-emerald-900">
              <span className="text-[10px] text-emerald-600 block leading-tight">Puncak Harian</span>
              <span className="font-bold text-emerald-950 font-mono text-sm">{peakDay.count} Santri</span>
            </div>
          </div>
        </div>

        {/* Visualisasi SVG Kurva Gunung & Gradasi */}
        <div className="relative w-full overflow-hidden pt-2">
          <svg 
            viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
            className="w-full h-56 sm:h-64"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Gradasi Warna Lereng Gunung (Mountain Area Gradient) */}
              <linearGradient id="mountainAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                <stop offset="45%" stopColor="#059669" stopOpacity="0.18" />
                <stop offset="90%" stopColor="#047857" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0.0" />
              </linearGradient>

              {/* Gradasi Garis Kurva Puncak Gunung */}
              <linearGradient id="mountainLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#059669" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>

              {/* Filter Bayangan Halus Garis */}
              <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#047857" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Garis Horizontal Bantu (Gridlines) */}
            {[0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const yGrid = padTop + usableHeight - ratio * usableHeight;
              const valLabel = Math.round(ratio * maxDailyVal);
              return (
                <g key={i}>
                  <line 
                    x1={padLeft - 10} 
                    y1={yGrid} 
                    x2={svgWidth - padRight + 10} 
                    y2={yGrid} 
                    stroke="#F1F5F9" 
                    strokeDasharray="4 4" 
                    strokeWidth="1.2" 
                  />
                  <text 
                    x={padLeft - 16} 
                    y={yGrid + 3} 
                    textAnchor="end" 
                    className="text-[10px] fill-slate-300 font-mono select-none"
                  >
                    {valLabel}
                  </text>
                </g>
              );
            })}

            {/* Baseline Garis Bawah */}
            <line 
              x1={padLeft - 10} 
              y1={padTop + usableHeight} 
              x2={svgWidth - padRight + 10} 
              y2={padTop + usableHeight} 
              stroke="#E2E8F0" 
              strokeWidth="1.5" 
            />

            {/* Area Lereng Gunung (Gradient Fill) */}
            <path 
              d={areaPathD} 
              fill="url(#mountainAreaGrad)" 
            />

            {/* Garis Kurva Puncak Gunung (Smooth Mountain Line) */}
            <path 
              d={linePathD} 
              fill="none" 
              stroke="url(#mountainLineGrad)" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              filter="url(#softGlow)"
            />

            {/* Titik Puncak Data (Glowing Dots & Badges) */}
            {mountainPoints.map((pt, idx) => {
              const isPeak = pt.count === peakDay.count && pt.count > 0;
              return (
                <g key={idx} className="group cursor-pointer">
                  {/* Titik Lingkaran */}
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r={isPeak ? "6.5" : "5"} 
                    className={`fill-white transition-all duration-200 group-hover:scale-125 ${
                      isPeak 
                        ? 'stroke-emerald-600 stroke-[3.5]' 
                        : pt.count > 0 
                        ? 'stroke-emerald-600 stroke-[3]' 
                        : 'stroke-slate-300 stroke-[2]'
                    }`}
                  />

                  {/* Badge Angka di Atas Titik */}
                  {pt.count > 0 && (
                    <g>
                      <rect 
                        x={pt.x - 24} 
                        y={pt.y - 32} 
                        width="48" 
                        height="20" 
                        rx="6" 
                        className={isPeak ? "fill-[#04382B]" : "fill-slate-800"} 
                      />
                      <text 
                        x={pt.x} 
                        y={pt.y - 18} 
                        textAnchor="middle" 
                        fill="#FFFFFF" 
                        fontSize="10" 
                        fontWeight="bold" 
                        fontFamily="monospace"
                      >
                        {pt.count} Santri
                      </text>
                      <polygon 
                        points={`${pt.x - 4},${pt.y - 12} ${pt.x + 4},${pt.y - 12} ${pt.x},${pt.y - 8}`} 
                        className={isPeak ? "fill-[#04382B]" : "fill-slate-800"} 
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Label Tanggal Sumbu X */}
          <div className="grid grid-cols-7 pt-2 text-center text-xs">
            {dailyStats.map((item, idx) => {
              const isToday = idx === dailyStats.length - 1;
              return (
                <div key={idx} className="space-y-0.5">
                  <span className={`block text-[11px] font-bold ${isToday ? 'text-emerald-800' : 'text-slate-700'}`}>
                    {item.label}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-medium">
                    {isToday ? 'Hari Ini' : item.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ringkasan Insight di Bawah Grafik Gunung */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <div>
              <span className="text-[10px] text-slate-400 block">Puncak Registrasi</span>
              <span className="font-bold text-slate-800">{peakDay.label} ({peakDay.count} Santri)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
            <div>
              <span className="text-[10px] text-slate-400 block">Total Delegasi</span>
              <span className="font-bold text-slate-800">{totalPeserta} Peserta</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
            <div>
              <span className="text-[10px] text-slate-400 block">Status Lolos Sah</span>
              <span className="font-bold text-slate-800">{totalTerverifikasi} ({pctTerverifikasi}%)</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
            <div>
              <span className="text-[10px] text-slate-400 block">Koneksi Database</span>
              <span className="font-bold text-slate-800">Google Sheets Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          4. STATUS VERIFIKASI & LOG RIWAYAT AKTIVITAS SISTEM
          ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* STATUS VERIFIKASI (4 Kolom) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Status Verifikasi
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Kesiapan data tampil lomba</p>
            </div>
            <button
              onClick={() => setActiveView('santri')}
              className="text-xs font-bold text-emerald-800 hover:underline"
            >
              Detail
            </button>
          </div>

          {/* SVG Donut Chart Sederhana */}
          <div className="flex items-center justify-center py-2">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  className="stroke-slate-100"
                  strokeWidth="3.8"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  className="stroke-emerald-600 transition-all duration-700"
                  strokeWidth="3.8"
                  strokeDasharray={`${totalPeserta > 0 ? (totalTerverifikasi / totalPeserta) * 88 : 0} 100`}
                  strokeLinecap="round"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  className="stroke-amber-400 transition-all duration-700"
                  strokeWidth="3.8"
                  strokeDasharray={`${totalPeserta > 0 ? (totalPending / totalPeserta) * 88 : 0} 100`}
                  strokeDashoffset={`-${totalPeserta > 0 ? (totalTerverifikasi / totalPeserta) * 88 : 0}`}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-extrabold text-slate-900 leading-none">
                  {pctTerverifikasi}%
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Lolos Sah
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex items-center justify-between text-slate-700">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span>Terverifikasi (Sah)</span>
              </div>
              <span className="font-bold text-slate-900 font-mono">{totalTerverifikasi} ({pctTerverifikasi}%)</span>
            </div>

            <div className="flex items-center justify-between text-slate-700">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>Menunggu Verifikasi</span>
              </div>
              <span className="font-bold text-slate-900 font-mono">{totalPending} ({pctPending}%)</span>
            </div>

            <div className="flex items-center justify-between text-slate-700">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Ditolak / Batal</span>
              </div>
              <span className="font-bold text-slate-900 font-mono">{totalDitolak} ({pctDitolak}%)</span>
            </div>
          </div>

          <div className="pt-2 text-right border-t border-slate-100">
            <span className="text-[10px] text-slate-400">
              Diperbarui otomatis dari database
            </span>
          </div>
        </div>

        {/* LOG RIWAYAT AKTIVITAS SISTEM (8 Kolom) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Riwayat Aktivitas Sistem
                </h3>
                <p className="text-xs text-slate-500">
                  Catatan audit operasional dan perubahan data terkini
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 outline-none bg-slate-50 hover:bg-white transition-colors"
              >
                <option value="ALL">Semua ({logs.length})</option>
                <option value="registration">Pendaftaran</option>
                <option value="status">Status</option>
                <option value="lottery">Undian</option>
              </select>

              <button
                onClick={handleRefresh}
                title="Segarkan Log"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {logs.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  title="Bersihkan Log"
                  className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Modal Konfirmasi Hapus Log */}
          {showClearConfirm && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-rose-800">
                Hapus seluruh catatan log aktivitas?
              </span>
              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 bg-white font-medium hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleClearLogs}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700"
                >
                  Hapus
                </button>
              </div>
            </div>
          )}

          {/* List Aktivitas Terakhir (Lega, Bersih, Rapi) */}
          <div className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada catatan aktivitas pada kategori ini.
              </div>
            ) : (
              filteredLogs.slice(0, 5).map(item => {
                let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                let IconComp = Activity;

                if (item.type === 'registration') {
                  badgeColor = 'bg-blue-50 text-blue-800 border-blue-200/60';
                  IconComp = UserPlus;
                } else if (item.type === 'status') {
                  badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200/60';
                  IconComp = CheckCircle2;
                } else if (item.type === 'lottery') {
                  badgeColor = 'bg-amber-50 text-amber-800 border-amber-200/60';
                  IconComp = Dices;
                } else if (item.type === 'guru') {
                  badgeColor = 'bg-purple-50 text-purple-800 border-purple-200/60';
                  IconComp = GraduationCap;
                } else if (item.type === 'tingkat') {
                  badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                  IconComp = Layers;
                }

                return (
                  <div key={item.id} className="py-2.5 flex items-start space-x-3 hover:bg-slate-50/60 px-1 rounded-lg transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200/60">
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                          {item.action}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed truncate">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 text-right border-t border-slate-100">
            <span className="text-[10px] text-slate-400">
              Audit log tersimpan di memori sistem panitia
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
