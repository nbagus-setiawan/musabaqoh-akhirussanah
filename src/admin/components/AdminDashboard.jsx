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
  BookOpen, 
  Award, 
  Sparkles, 
  ChevronRight, 
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
  Calendar,
  Megaphone,
  Compass,
  FileText,
  Settings
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

  // =========================================================
  // METRIK OPERASIONAL
  // =========================================================
  const totalPeserta = registrations.length;
  const totalPutra = registrations.filter(r => r.Jenis_Kelamin === 'L').length;
  const totalPutri = registrations.filter(r => r.Jenis_Kelamin === 'P').length;

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

  const pctTerverifikasi = totalPeserta > 0 ? Math.round((totalTerverifikasi / totalPeserta) * 100) : 0;
  const pctPending = totalPeserta > 0 ? Math.round((totalPending / totalPeserta) * 100) : 0;
  const pctDitolak = totalPeserta > 0 ? Math.round((totalDitolak / totalPeserta) * 100) : 0;
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

  // Recent 5 Santri (Mirip Recent Results di referensi)
  const recentSantri = useMemo(() => {
    return [...registrations].reverse().slice(0, 5);
  }, [registrations]);

  // Notice Board Items (Pemberitahuan & Kepatuhan Kelas)
  const noticeItems = useMemo(() => {
    const list = [];
    
    // Notice 1: Kelas yang belum ada delegasi
    const belumKelas = complianceMatrix.filter(m => m.status === 'BELUM');
    if (belumKelas.length > 0) {
      list.push({
        id: 'notice-belum',
        title: `${belumKelas.length} Kelas Belum Mendaftar`,
        desc: `Di antaranya: ${belumKelas.slice(0, 2).map(k => k.kelas).join(', ')}. Mohon segera ingatkan Wali Kelas.`,
        date: 'Hari Ini',
        type: 'alert',
        actionItem: belumKelas[0]
      });
    }

    // Notice 2: Kelas yang delegasinya masih kurang dari kuota 10
    const sebagianKelas = complianceMatrix.filter(m => m.status === 'SEBAGIAN');
    if (sebagianKelas.length > 0) {
      list.push({
        id: 'notice-sebagian',
        title: `${sebagianKelas.length} Kelas Kuota Belum Lengkap`,
        desc: `Sebagian kelas baru mengirimkan kurang dari 10 santri delegasi musabaqah.`,
        date: 'Penting',
        type: 'warning',
        actionItem: sebagianKelas[0]
      });
    }

    // Notice 3: Status Nomor Undian
    const belumUndiCount = totalPeserta - totalDiundi;
    list.push({
      id: 'notice-undian',
      title: 'Pengundian Nomor Urut 3 Digit',
      desc: belumUndiCount > 0 
        ? `Terdapat ${belumUndiCount} santri terdaftar yang belum diundi nomor panggilannya.`
        : 'Alhamdulillah, seluruh santri terdaftar telah memiliki nomor undian 3 digit.',
      date: 'Operasional',
      type: 'info'
    });

    return list;
  }, [complianceMatrix, totalPeserta, totalDiundi]);

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

  // Helper Kalender
  const todayDate = new Date();
  const currentMonthName = todayDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const currentDayNum = todayDate.getDate();

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6 max-w-7xl mx-auto bg-[#F8FAFC]">
      
      {/* =========================================================
          1. WELCOME HERO CARD (Persis Sesuai Referensi Desain)
          ========================================================= */}
      <div className="relative rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-indigo-50/70 border border-blue-100/80 shadow-xs overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5">
        
        {/* Konten Sambutan Kiri */}
        <div className="space-y-1.5 z-10">
          <div className="flex items-center space-x-2">
            <span className="text-xs sm:text-sm font-semibold text-slate-500">
              Ahlan wa Sahlan,
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Ustadz Panitia Musabaqah!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
            Pusat kendali pendaftaran delegasi santri Musabaqah Akhirussanah 1447 H • YPPS Al-Falah Putak.
          </p>
        </div>

        {/* Ornamen Grafis Kanan (Visual 3D Books & Tanaman Sesuai Referensi) */}
        <div className="flex items-center space-x-3 shrink-0 self-end md:self-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveView('santri')}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200/90 transition-all shadow-xs flex items-center space-x-2 cursor-pointer"
            >
              <Dices className="w-4 h-4 text-blue-600" />
              <span>Undian 3 Digit</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200/90 transition-all shadow-xs flex items-center space-x-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Rekap</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================
          2. KARTU METRIK UTAMA (5 KARTU SEJAJAR SEPERTI REFERENSI)
          ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: TOTAL DELEGASI (Ikon Dokumen Biru) */}
        <div 
          onClick={() => setActiveView('santri')}
          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center space-x-3.5 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/70 group-hover:scale-105 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block tracking-wider uppercase leading-none">
              Total Delegasi
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight block mt-1">
              {totalPeserta}
            </span>
            <span className="text-[10.5px] font-semibold text-blue-600 block mt-0.5">
              {totalPutra} Pa • {totalPutri} Pi
            </span>
          </div>
        </div>

        {/* KPI 2: TINGKAT ULA (Ikon Cap Hijau) */}
        <div 
          onClick={() => {
            if (setSearchTerm) setSearchTerm('Ula');
            setActiveView('santri');
          }}
          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center space-x-3.5 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/70 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block tracking-wider uppercase leading-none">
              Tingkat Ula
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight block mt-1">
              {totalUla}
            </span>
            <span className="text-[10.5px] font-semibold text-emerald-600 block mt-0.5">
              16 Kelas Diniyah
            </span>
          </div>
        </div>

        {/* KPI 3: TINGKAT WUSTHO (Ikon Clipboard Ungu) */}
        <div 
          onClick={() => {
            if (setSearchTerm) setSearchTerm('Wustho');
            setActiveView('santri');
          }}
          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center space-x-3.5 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100/70 group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block tracking-wider uppercase leading-none">
              Tingkat Wustho
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight block mt-1">
              {totalWustho}
            </span>
            <span className="text-[10.5px] font-semibold text-purple-600 block mt-0.5">
              8 Kelas Diniyah
            </span>
          </div>
        </div>

        {/* KPI 4: UNDIAN 3 DIGIT (Ikon Piala Oranye) */}
        <div 
          onClick={() => setActiveView('santri')}
          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center space-x-3.5 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100/70 group-hover:scale-105 transition-transform">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block tracking-wider uppercase leading-none">
              Nomor Diundi
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight block mt-1 font-mono">
              {totalDiundi}
            </span>
            <span className="text-[10.5px] font-semibold text-amber-600 block mt-0.5">
              {pctDiundi}% Siap Tampil
            </span>
          </div>
        </div>

        {/* KPI 5: STATUS TERVERIFIKASI (Ikon Checklist Merah Muda) */}
        <div 
          onClick={() => setActiveView('santri')}
          className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center space-x-3.5 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100/70 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block tracking-wider uppercase leading-none">
              Lolos Sah
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight block mt-1">
              {pctTerverifikasi}%
            </span>
            <span className="text-[10.5px] font-semibold text-rose-600 block mt-0.5">
              {totalTerverifikasi} Terverifikasi
            </span>
          </div>
        </div>

      </div>

      {/* =========================================================
          3. BARIS TENGAH: RECENT RESULTS (KIRI) & NOTICE BOARD (KANAN)
             (PERSIS STRUKTUR PADA GAMBAR REFERENSI DESAIN)
          ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* KIRI (7 KOLOM): RECENT RESULTS / DATA SANTRI TERKINI */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Data Santri Terdaftar Terkini
              </h3>
              <button
                onClick={() => setActiveView('santri')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Lihat Semua Santri
              </button>
            </div>

            {/* Tabel Ringkas Persis Recent Results */}
            <div className="overflow-x-auto pt-2">
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
                <tbody className="divide-y divide-slate-50">
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
                        <tr key={item.ID_Pendaftaran || idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 pr-2">
                            <span className="font-bold text-slate-900 block truncate max-w-[140px]">
                              {item.Nama_Lengkap}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.ID_Pendaftaran}
                            </span>
                          </td>
                          <td className="py-3 text-slate-600 font-medium">
                            <span className="block truncate max-w-[120px]">{item.Kelas_Kategori}</span>
                            <span className={`inline-block px-1 rounded text-[9px] font-bold ${
                              isPutri ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {isPutri ? 'Putri' : 'Putra'}
                            </span>
                          </td>
                          <td className="py-3 text-slate-700 font-medium truncate max-w-[120px]">
                            {item.Cabang_Lomba}
                          </td>
                          <td className="py-3 text-center font-mono">
                            {item.Nomor_Urut ? (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                                {item.Nomor_Urut}
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
              Total {totalPeserta} santri terdaftar di database
            </span>
          </div>
        </div>

        {/* KANAN (5 KOLOM): NOTICE BOARD (PAPAN INFORMASI & KEPATUHAN KELAS) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Papan Informasi & Kepatuhan
              </h3>
              <button
                onClick={() => setActiveView('guru')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Kelola 24 Kelas
              </button>
            </div>

            {/* List Notices Persis Tampilan Notice Board */}
            <div className="space-y-3.5 pt-2">
              {noticeItems.map((n) => (
                <div key={n.id} className="flex items-start space-x-3 group">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/70 mt-0.5">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {n.title}
                      </h4>
                      <span className="text-[10px] font-semibold text-blue-600 shrink-0">
                        {n.date}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {n.desc}
                    </p>
                    {n.actionItem && (
                      <div className="pt-1 flex items-center space-x-2">
                        <button
                          onClick={() => handleSendReminderWA(n.actionItem)}
                          className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 transition-colors cursor-pointer flex items-center space-x-1"
                        >
                          <MessageSquare className="w-2.5 h-2.5" />
                          <span>Kirim WA Pengingat</span>
                        </button>
                        <button
                          onClick={() => handleJumpToClass(n.actionItem.kelas)}
                          className="text-[10px] text-slate-400 hover:text-slate-700 font-semibold cursor-pointer"
                        >
                          Lihat Kelas
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-right border-t border-slate-100">
            <span className="text-[10px] text-slate-400">
              Notifikasi otomatis diperbarui dari status kelas
            </span>
          </div>
        </div>

      </div>

      {/* =========================================================
          4. BARIS BAWAH: 3 KARTU (KALENDER, AKSES CEPAT, STATISTIK)
             (PERSIS 3 KARTU SEJAJAR PADA REFERENSI DESAIN)
          ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* KARTU 1: KALENDER AKADEMIK / MUSABAQAH */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Kalender Musabaqah
              </h3>
              <span className="text-[11px] font-bold text-blue-600">
                {currentMonthName}
              </span>
            </div>

            {/* Grid Kalender Mini */}
            <div className="pt-2 text-center text-xs">
              <div className="grid grid-cols-7 text-[10px] font-bold text-slate-400 mb-2">
                <span>Sn</span>
                <span>Sl</span>
                <span>Rb</span>
                <span>Km</span>
                <span>Jm</span>
                <span>Sb</span>
                <span className="text-rose-500">Ah</span>
              </div>
              <div className="grid grid-cols-7 gap-y-1.5 text-[11px] font-semibold text-slate-700">
                {Array.from({ length: 31 }, (_, i) => {
                  const day = i + 1;
                  const isToday = day === currentDayNum;
                  return (
                    <div key={day} className="flex items-center justify-center">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isToday 
                          ? 'bg-blue-600 text-white font-bold shadow-xs' 
                          : 'hover:bg-slate-100 cursor-pointer'
                      }`}>
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Hari Ini ({currentDayNum} {currentMonthName})</span>
            </span>
            <span className="font-semibold text-emerald-700">Agenda Aktif</span>
          </div>
        </div>

        {/* KARTU 2: QUICK ACCESS (6 TOMBOL PASTEL SQUIRCLE SEPERTI REFERENSI) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Akses Cepat Panitia
              </h3>
              <span className="text-[11px] text-slate-400 font-semibold">Pintasan</span>
            </div>

            {/* Grid 3x2 Icon Pastel */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              
              {/* Tombol 1: Undian 3 Digit */}
              <button 
                onClick={() => setActiveView('santri')}
                className="p-2.5 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer flex flex-col items-center space-y-1 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/60 group-hover:scale-105 transition-transform">
                  <Dices className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 block leading-tight">
                  Undian 3D
                </span>
              </button>

              {/* Tombol 2: Data Santri */}
              <button 
                onClick={() => setActiveView('santri')}
                className="p-2.5 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer flex flex-col items-center space-y-1 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/60 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 block leading-tight">
                  Data Santri
                </span>
              </button>

              {/* Tombol 3: 24 Wali Kelas */}
              <button 
                onClick={() => setActiveView('guru')}
                className="p-2.5 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer flex flex-col items-center space-y-1 group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/60 group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 block leading-tight">
                  Wali Kelas
                </span>
              </button>

              {/* Tombol 4: Juara Umum */}
              <button 
                onClick={() => setActiveView('juara')}
                className="p-2.5 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer flex flex-col items-center space-y-1 group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/60 group-hover:scale-105 transition-transform">
                  <Trophy className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 block leading-tight">
                  Juara Umum
                </span>
              </button>

              {/* Tombol 5: Export Excel */}
              <button 
                onClick={handleExportExcel}
                className="p-2.5 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer flex flex-col items-center space-y-1 group"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100/60 group-hover:scale-105 transition-transform">
                  <Download className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 block leading-tight">
                  Unduh Excel
                </span>
              </button>

              {/* Tombol 6: Pengaturan Sheet */}
              <button 
                onClick={() => setActiveView('pengaturan')}
                className="p-2.5 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer flex flex-col items-center space-y-1 group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100/60 group-hover:scale-105 transition-transform">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 block leading-tight">
                  Pengaturan
                </span>
              </button>

            </div>
          </div>

          <div className="pt-2 text-center border-t border-slate-100">
            <span className="text-[10px] text-slate-400">
              Navigasi langsung ke seluruh fungsi operasional
            </span>
          </div>
        </div>

        {/* KARTU 3: PERFORMANCE OVERVIEW (DONUT CHART & BREAKDOWN SEPERTI REFERENSI) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Kesiapan Operasional
              </h3>
              <button
                onClick={() => setActiveView('santri')}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Detail
              </button>
            </div>

            {/* Donut Chart & Legend Sejajar Sesuai Referensi */}
            <div className="flex items-center justify-between pt-2 gap-3">
              
              {/* Donut Lingkaran */}
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
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
                    className="stroke-emerald-500 transition-all duration-700"
                    strokeWidth="3.8"
                    strokeDasharray={`${totalPeserta > 0 ? (totalTerverifikasi / totalPeserta) * 88 : 0} 100`}
                    strokeLinecap="round"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    className="stroke-blue-500 transition-all duration-700"
                    strokeWidth="3.8"
                    strokeDasharray={`${totalPeserta > 0 ? (totalPending / totalPeserta) * 88 : 0} 100`}
                    strokeDashoffset={`-${totalPeserta > 0 ? (totalTerverifikasi / totalPeserta) * 88 : 0}`}
                    strokeLinecap="round"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-black text-slate-900 leading-none">
                    {pctTerverifikasi}%
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                    Kesiapan
                  </span>
                </div>
              </div>

              {/* Legend di Kanan Donut (Persis Referensi) */}
              <div className="space-y-1.5 text-xs flex-1">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600 font-medium">Terverifikasi</span>
                  </div>
                  <span className="font-bold text-slate-900 font-mono">{pctTerverifikasi}%</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-slate-600 font-medium">Menunggu</span>
                  </div>
                  <span className="font-bold text-slate-900 font-mono">{pctPending}%</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span className="text-slate-600 font-medium">Belum Diundi</span>
                  </div>
                  <span className="font-bold text-slate-900 font-mono">{100 - pctDiundi}%</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    <span className="text-slate-600 font-medium">Ditolak</span>
                  </div>
                  <span className="font-bold text-slate-900 font-mono">{pctDitolak}%</span>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-2 text-right border-t border-slate-100">
            <span className="text-[10px] text-slate-400">
              Sinkron otomatis dengan Google Sheets
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
