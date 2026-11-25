import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Users,
  CheckCircle2,
  Clock,
  Dices,
  Trophy,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Building2,
  Download,
  FileText,
  Layers,
  Award,
  ArrowUpRight
} from 'lucide-react';
import {
  getWaliKelasList,
  fetchPengaturan,
  getLocalPengaturan
} from '../../shared/services/api';
import { MASTER_WALI_KELAS, CABANG_LOMBA_LIST } from '../../shared/data/competitions';
import WhatsAppIcon from '../../shared/components/WhatsAppIcon';
import { buildWaUrl } from '../../shared/utils/phone';

export default function AdminDashboard({
  registrations = [],
  onRefresh,
  setActiveView,
  setSearchTerm
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [targetKuota, setTargetKuota] = useState(() =>
    Math.max(1, parseInt(getLocalPengaturan()?.TARGET_KUOTA_KELAS, 10) || 10)
  );

  useEffect(() => {
    fetchPengaturan()
      .then(cfg => {
        const parsed = parseInt(cfg?.TARGET_KUOTA_KELAS, 10);
        if (!isNaN(parsed) && parsed > 0) setTargetKuota(parsed);
      })
      .catch(() => {});
  }, []);

  const [matrixFilter, setMatrixFilter] = useState('ALL');
  const [matrixPage, setMatrixPage] = useState(1);
  const matrixPerPage = 8;

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPengaturan()
      .then(cfg => {
        const parsed = parseInt(cfg?.TARGET_KUOTA_KELAS, 10);
        if (!isNaN(parsed) && parsed > 0) setTargetKuota(parsed);
      })
      .catch(() => {});
    if (onRefresh) onRefresh(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleExportExcel = () => {
    const exportRows = registrations.map((item, idx) => ({
      No: idx + 1,
      Timestamp: item.Timestamp,
      'Wali Kelas': item.Wali_Kelas,
      'ID Pendaftaran': item.ID_Pendaftaran,
      'Nomor Peserta': item.Nomor_Urut || '-',
      'Nama Santri': item.Nama_Lengkap,
      'Jenis Kelamin': item.Jenis_Kelamin === 'L' ? 'Putra' : 'Putri',
      Tingkat: item.Tingkat,
      'Kelas Diniyah': item.Kelas_Kategori || item.Kelas_Diniyah,
      'Cabang Lomba': item.Cabang_Lomba,
      'Nomor WhatsApp': item.Nomor_WA,
      Status: item.Status,
      Catatan: item.Catatan || '-'
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
  const totalDiundi = registrations.filter(r => r.Nomor_Urut && String(r.Nomor_Urut).trim() !== '').length;

  const pctTerverifikasi = totalPeserta > 0 ? Math.round((totalTerverifikasi / totalPeserta) * 100) : 0;
  const pctDiundi = totalPeserta > 0 ? Math.round((totalDiundi / totalPeserta) * 100) : 0;

  // =========================================================
  // MATRIKS KEPATUHAN KELAS DINIYAH (DINAMIS)
  // =========================================================
  const waliList = useMemo(() => {
    try {
      const stored = getWaliKelasList();
      if (Array.isArray(stored) && stored.length > 0) return stored;
    } catch (e) {}
    return MASTER_WALI_KELAS;
  }, [registrations]);

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

      let status = 'BELUM';
      if (totalCount >= targetKuota) {
        status = 'LENGKAP';
      } else if (totalCount > 0) {
        status = 'SEBAGIAN';
      }

      const rawTingkat = (wali.tingkat || '').toLowerCase();
      let tingkatKey = 'lainnya';
      let tingkatLabel = wali.tingkat || 'Kelas';
      if (rawTingkat.includes('ula')) {
        tingkatKey = 'ula';
        tingkatLabel = 'Tingkat Ula';
      } else if (rawTingkat.includes('wustho')) {
        tingkatKey = 'wustho';
        tingkatLabel = 'Tingkat Wustho';
      } else if (rawTingkat.includes('ulya')) {
        tingkatKey = 'ulya';
        tingkatLabel = 'Tingkat Ulya';
      } else if (rawTingkat.includes('mhq')) {
        tingkatKey = 'mhq';
        tingkatLabel = 'Tingkat MHQ';
      }

      return {
        ...wali,
        no: idx + 1,
        tingkatKey,
        tingkatLabel,
        totalCount,
        verifiedCount,
        status
      };
    });
  }, [waliList, registrations, targetKuota]);

  const countLengkap = complianceMatrix.filter(m => m.status === 'LENGKAP').length;
  const countSebagian = complianceMatrix.filter(m => m.status === 'SEBAGIAN').length;
  const countBelum = complianceMatrix.filter(m => m.status === 'BELUM').length;
  const countIncomplete = countSebagian + countBelum;

  const countUlaKelas = complianceMatrix.filter(m => m.tingkatKey === 'ula').length;
  const countWusthoKelas = complianceMatrix.filter(m => m.tingkatKey === 'wustho').length;
  const countUlyaKelas = complianceMatrix.filter(m => m.tingkatKey === 'ulya').length;
  const countMhqKelas = complianceMatrix.filter(m => m.tingkatKey === 'mhq').length;

  const filteredCompliance = useMemo(() => {
    return complianceMatrix.filter(item => {
      if (matrixFilter === 'ula') return item.tingkatKey === 'ula';
      if (matrixFilter === 'wustho') return item.tingkatKey === 'wustho';
      if (matrixFilter === 'ulya') return item.tingkatKey === 'ulya';
      if (matrixFilter === 'mhq') return item.tingkatKey === 'mhq';
      if (matrixFilter === 'incomplete') return item.status !== 'LENGKAP';
      return true;
    });
  }, [complianceMatrix, matrixFilter]);

  const totalMatrixPages = Math.max(1, Math.ceil(filteredCompliance.length / matrixPerPage));
  const currentSafePage = Math.min(matrixPage, totalMatrixPages);

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

  // =========================================================
  // SEBARAN PER JENJANG & CABANG LOMBA (PENGGANTI KALENDER STATIS)
  // =========================================================
  const jenjangSummary = useMemo(() => {
    const groups = [
      { key: 'ula', label: 'Tingkat Ula', keyword: 'Tingkat Ula', match: t => t.includes('ula') },
      { key: 'wustho', label: 'Tingkat Wustho', keyword: 'Tingkat Wustho', match: t => t.includes('wustho') },
      { key: 'ulya', label: 'Tingkat Ulya', keyword: 'Tingkat Ulya', match: t => t.includes('ulya') },
      { key: 'mhq', label: 'Tingkat MHQ', keyword: 'MHQ', match: t => t.includes('mhq') }
    ];

    return groups.map(g => {
      const items = registrations.filter(r => g.match(String(r.Tingkat || '').toLowerCase()));
      const sah = items.filter(r => r.Status === 'Terverifikasi').length;
      return {
        ...g,
        total: items.length,
        sah
      };
    });
  }, [registrations]);

  const branchSummary = useMemo(() => {
    const counts = new Map();
    CABANG_LOMBA_LIST.forEach(c => {
      counts.set(c.id, {
        id: c.id,
        name: c.name,
        searchKeyword: c.name,
        total: 0
      });
    });

    registrations.forEach(r => {
      const raw = String(r.Cabang_Lomba || '').trim();
      if (!raw) return;
      const lower = raw.toLowerCase();

      const matched = CABANG_LOMBA_LIST.find(c => {
        const cname = c.name.toLowerCase();
        if (lower === cname || lower.startsWith(`${cname} (`) || lower.startsWith(`${cname} -`)) return true;
        if (c.id === 'kaligrafi' && (lower.includes('kaligrafi') || lower.includes('khot'))) return true;
        if (c.id === 'syarhil' && lower.includes('syarhil')) return true;
        if (c.id === 'kreasi_nadzom' && lower.includes('kreasi nadzom')) return true;
        return false;
      });

      if (matched) {
        counts.get(matched.id).total += 1;
      } else {
        const customKey = `custom_${lower}`;
        if (!counts.has(customKey)) {
          counts.set(customKey, {
            id: customKey,
            name: raw,
            searchKeyword: raw,
            total: 0
          });
        }
        counts.get(customKey).total += 1;
      }
    });

    return Array.from(counts.values()).sort((a, b) => b.total - a.total);
  }, [registrations]);

  const maxBranchCount = useMemo(
    () => Math.max(1, ...branchSummary.map(b => b.total)),
    [branchSummary]
  );

  // 5 Santri Terdaftar Terbaru
  const recentSantri = useMemo(() => {
    return [...registrations].reverse().slice(0, 5);
  }, [registrations]);

  const handleJumpWithQuery = (queryText = '') => {
    if (setSearchTerm) setSearchTerm(queryText);
    if (setActiveView) setActiveView('santri');
  };

  const handleSendReminderWA = (item) => {
    const statusDesc =
      item.totalCount === 0
        ? `Belum ada santri yang didaftarkan (0/${targetKuota} Kuota)`
        : `Baru terdaftar ${item.totalCount}/${targetKuota} santri`;
    const msg =
      `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
      `Kepada Yth. *${item.nama}*\n` +
      `Wali Kelas Diniyah: *${item.kelas}*\n` +
      `Pondok Pesantren Al-Falah Putak\n\n` +
      `Semoga Ustadz/Ustadzah senantiasa dalam limpahan rahmat dan kesehatan dari Allah SWT.\n\n` +
      `Kami dari Panitia Pelaksana menyampaikan pengingat resmi terkait pendaftaran delegasi santri dalam rangka *Musabaqah Akhirussanah 1447 H*.\n\n` +
      `Status Kuota Kelas Saat Ini: *${statusDesc}*.\n\n` +
      `Mohon kiranya Ustadz/Ustadzah dapat segera melengkapi data delegasi santri secara mandiri melalui portal resmi pendaftaran berikut:\n` +
      `https://musabaqoh-akhirussanah.vercel.app/\n\n` +
      `Besar harapan kami agar pendaftaran dapat diselesaikan tepat waktu demi kelancaran pengundian nomor peserta dan persiapan jadwal lomba.\n\n` +
      `Atas perhatian, dedikasi, dan kerja sama Ustadz/Ustadzah, kami haturkan terima kasih yang sebesar-besarnya.\n` +
      `Jazakumullah Khairan Katsiran.\n\n` +
      `Wassalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
      `*Panitia Musabaqah Akhirussanah 1447 H*\n` +
      `YPPS Al-Falah Putak`;
    window.open(buildWaUrl(item.kontak, msg), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6 max-w-7xl mx-auto">
      {/* =========================================================
          1. BAR KENDALI OPERASIONAL RINGKAS (EMERALD & EMAS AL-FALAH)
         ========================================================= */}
      <section className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#054736] via-[#075B45] to-[#D9B45B]" />
        <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF4F0] text-[#054736] border border-[#075B45]/15">
                Musabaqah Akhirussanah 1447 H
              </span>
              <span className="text-xs font-semibold text-slate-500">
                YPPS Al-Falah Putak
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
              Pusat Kendali & Monitoring Panitia
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Pantau kelengkapan {complianceMatrix.length} Kelas Diniyah, antrean verifikasi delegasi, dan pengundian nomor peserta 3 digit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleJumpWithQuery('')}
              className="px-4 py-2.5 rounded-xl bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs transition-all shadow-xs flex items-center space-x-2 cursor-pointer active:scale-95"
            >
              <Dices className="w-4 h-4 text-[#D9B45B]" />
              <span>Undian Nomor Peserta</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-[#075B45]" />
              <span>Export Excel</span>
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-all cursor-pointer active:scale-95"
              title="Refresh Data"
              aria-label="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#075B45]' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          2. 4 KARTU METRIK KPI UTAMA
         ========================================================= */}
      <section aria-label="Ringkasan Statistik" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <button
          type="button"
          onClick={() => handleJumpWithQuery('')}
          className="text-left bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-[#075B45]/40 hover:shadow-sm transition-all cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#EAF4F0] text-[#075B45] flex items-center justify-center shrink-0 border border-[#075B45]/15 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block tracking-wider uppercase leading-none">
              Total Delegasi
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums leading-tight block mt-1">
              {totalPeserta}
            </span>
            <span className="text-[11px] font-semibold text-[#075B45] block mt-0.5 truncate">
              {totalPutra} Putra • {totalPutri} Putri
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleJumpWithQuery('')}
          className="text-left bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-emerald-400/50 hover:shadow-sm transition-all cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/70 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block tracking-wider uppercase leading-none">
              Terverifikasi
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums leading-tight block mt-1">
              {totalTerverifikasi}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 block mt-0.5 truncate">
              {pctTerverifikasi}% Berkas Sah
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleJumpWithQuery('')}
          className="text-left bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-amber-400/60 hover:shadow-sm transition-all cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/70 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block tracking-wider uppercase leading-none">
              Antrean Pending
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums leading-tight block mt-1 font-mono">
              {totalPending}
            </span>
            <span className="text-[11px] font-semibold text-amber-700 block mt-0.5 truncate">
              {totalPending > 0 ? 'Perlu dicek panitia' : 'Semua telah dicek'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleJumpWithQuery('')}
          className="text-left bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-[#D9B45B] hover:shadow-sm transition-all cursor-pointer flex items-center gap-3.5 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#FCF6E5] text-[#9A7418] flex items-center justify-center shrink-0 border border-[#D9B45B]/40 group-hover:scale-105 transition-transform">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 block tracking-wider uppercase leading-none">
              Nomor Peserta
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums leading-tight block mt-1 font-mono">
              {totalDiundi}
            </span>
            <span className="text-[11px] font-semibold text-[#9A7418] block mt-0.5 truncate">
              {pctDiundi}% Sudah Diundi
            </span>
          </div>
        </button>
      </section>

      {/* =========================================================
          3. MATRIKS KEPATUHAN KELAS DINIYAH (DINAMIS)
         ========================================================= */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Matriks Kepatuhan Kelas Diniyah
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF4F0] text-[#054736] border border-[#075B45]/15">
                Target: {targetKuota} Delegasi / Kelas
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pantau pengisian delegasi tiap kelas. Klik Kirim WA untuk mengirim pengingat resmi ke Wali Kelas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleFilterChange('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                matrixFilter === 'ALL'
                  ? 'bg-[#075B45] text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Semua ({complianceMatrix.length})
            </button>
            {countUlaKelas > 0 && (
              <button
                type="button"
                onClick={() => handleFilterChange('ula')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  matrixFilter === 'ula'
                    ? 'bg-[#075B45] text-white shadow-xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Ula ({countUlaKelas})
              </button>
            )}
            {countWusthoKelas > 0 && (
              <button
                type="button"
                onClick={() => handleFilterChange('wustho')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  matrixFilter === 'wustho'
                    ? 'bg-[#075B45] text-white shadow-xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Wustho ({countWusthoKelas})
              </button>
            )}
            {countUlyaKelas > 0 && (
              <button
                type="button"
                onClick={() => handleFilterChange('ulya')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  matrixFilter === 'ulya'
                    ? 'bg-[#075B45] text-white shadow-xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Ulya ({countUlyaKelas})
              </button>
            )}
            {countMhqKelas > 0 && (
              <button
                type="button"
                onClick={() => handleFilterChange('mhq')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  matrixFilter === 'mhq'
                    ? 'bg-[#075B45] text-white shadow-xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                MHQ ({countMhqKelas})
              </button>
            )}
            <button
              type="button"
              onClick={() => handleFilterChange('incomplete')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                matrixFilter === 'incomplete'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              Belum Lengkap ({countIncomplete})
            </button>
          </div>
        </div>

        {/* Ringkasan Status Kepatuhan */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#075B45]" />
            <span>{countLengkap} Lengkap (&ge;{targetKuota})</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/70 font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{countSebagian} Sebagian (1–{Math.max(1, targetKuota - 1)})</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200/70 font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{countBelum} Belum Mendaftar</span>
          </div>
        </div>

        {/* Grid 8 Kartu Kelas per Halaman */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {pagedCompliance.map(item => {
            const pctFill = Math.min(100, Math.round((item.totalCount / targetKuota) * 100));

            return (
              <div
                key={item.kelas || item.no}
                className="bg-slate-50/70 hover:bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-[#075B45]/30 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      #{String(item.no).padStart(2, '0')}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#EAF4F0] text-[#075B45]">
                      {item.tingkatLabel}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug mt-1.5 truncate" title={item.kelas}>
                    {item.kelas}
                  </h3>

                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-medium mt-1 truncate" title={item.nama}>
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{item.nama}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600">Terdaftar</span>
                    <span className="font-bold text-slate-900 font-mono tabular-nums">
                      {item.totalCount} / {targetKuota}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        item.status === 'LENGKAP'
                          ? 'bg-[#075B45]'
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
                        ? 'bg-emerald-100 text-[#054736]'
                        : item.status === 'SEBAGIAN'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {item.status === 'LENGKAP' ? 'LENGKAP' : item.status === 'SEBAGIAN' ? 'SEBAGIAN' : 'BELUM ADA'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 tabular-nums">
                      {item.verifiedCount} Sah
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSendReminderWA(item)}
                    className="flex-1 px-2.5 py-2 rounded-xl bg-[#075B45] hover:bg-[#054736] active:scale-95 text-white text-[11px] font-bold transition-all shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer"
                    title={`Kirim WhatsApp Pengingat ke ${item.nama}`}
                  >
                    <WhatsAppIcon variant="white" className="w-3.5 h-3.5 text-white shrink-0" />
                    <span>Kirim WA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleJumpWithQuery(item.kelas)}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-700 text-[11px] font-bold border border-slate-300 transition-all cursor-pointer"
                    title="Lihat Santri Kelas Ini"
                  >
                    Lihat
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Paginasi Matriks */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Menampilkan <strong className="text-slate-800">{startMatrixIndex}–{endMatrixIndex}</strong> dari{' '}
            <strong className="text-slate-800">{filteredCompliance.length}</strong> Kelas Diniyah
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handlePageChange(currentSafePage - 1)}
              disabled={currentSafePage === 1}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalMatrixPages }, (_, i) => i + 1).map(pageNo => (
                <button
                  key={pageNo}
                  type="button"
                  onClick={() => handlePageChange(pageNo)}
                  className={`w-7 h-7 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pageNo === currentSafePage
                      ? 'bg-[#075B45] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pageNo}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handlePageChange(currentSafePage + 1)}
              disabled={currentSafePage === totalMatrixPages}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#075B45] text-white hover:bg-[#054736] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1 cursor-pointer shadow-xs"
            >
              <span>Lanjutkan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          4. SEBARAN JENJANG & CABANG LOMBA + DATA SANTRI TERKINI
         ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* KIRI (5 KOLOM): SEBARAN PER JENJANG & CABANG LOMBA */}
        <section className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#EAF4F0] text-[#075B45] flex items-center justify-center border border-[#075B45]/15">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    Sebaran Jenjang & Cabang
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Klik untuk saring di Data Santri
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#9A7418] bg-[#FCF6E5] px-2.5 py-1 rounded-xl border border-[#D9B45B]/40">
                {branchSummary.length} Cabang
              </span>
            </div>

            {/* Ringkasan per Jenjang: Ula, Wustho, Ulya, MHQ */}
            <div className="grid grid-cols-2 gap-2.5">
              {jenjangSummary.map(j => (
                <button
                  key={j.key}
                  type="button"
                  onClick={() => handleJumpWithQuery(j.keyword)}
                  className="text-left p-3 rounded-2xl bg-slate-50/80 hover:bg-[#EAF4F0]/70 border border-slate-200/70 hover:border-[#075B45]/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 group-hover:text-[#054736] truncate">
                      {j.label}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#075B45] shrink-0" />
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-black text-slate-900 tabular-nums">{j.total}</span>
                    <span className="text-[10px] font-semibold text-[#075B45] tabular-nums">{j.sah} Sah</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Partisipasi per Cabang Lomba */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span className="inline-flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-[#D9B45B]" />
                  <span>Partisipasi Cabang Lomba</span>
                </span>
                <span>Peserta</span>
              </div>

              <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1 admin-sidebar-scroll">
                {branchSummary.map(branch => {
                  const barPct = branch.total === 0 ? 0 : Math.max(6, Math.round((branch.total / maxBranchCount) * 100));
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => handleJumpWithQuery(branch.searchKeyword)}
                      className="w-full text-left group space-y-1 p-1.5 -mx-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 group-hover:text-[#075B45] truncate pr-2">
                          {branch.name}
                        </span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums shrink-0">
                          {branch.total}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#075B45] to-[#D9B45B] transition-all duration-500"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* KANAN (7 KOLOM): DATA SANTRI TERDAFTAR TERKINI */}
        <section className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#EAF4F0] text-[#075B45] flex items-center justify-center border border-[#075B45]/15">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    Data Santri Terdaftar Terkini
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    5 delegasi santri pendaftar terakhir
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleJumpWithQuery('')}
                className="text-xs font-bold text-[#075B45] hover:text-[#054736] hover:underline cursor-pointer shrink-0"
              >
                Lihat Semua ({totalPeserta})
              </button>
            </div>

            <div className="dashboard-recent-wrapper" tabIndex={0} role="region" aria-label="Tabel Santri Terdaftar Terkini">
              <table className="dashboard-recent-table text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-semibold text-[11px] border-b border-slate-100">
                    <th className="pb-3 font-semibold">Nama Santri</th>
                    <th className="pb-3 font-semibold">Kelas Diniyah</th>
                    <th className="pb-3 font-semibold">Cabang Lomba</th>
                    <th className="pb-3 font-semibold text-center">No. Peserta</th>
                    <th className="pb-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentSantri.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-slate-400 text-xs">
                        Belum ada santri yang didaftarkan.
                      </td>
                    </tr>
                  ) : (
                    recentSantri.map((item, idx) => {
                      const isPutri = item.Jenis_Kelamin === 'P';
                      return (
                        <tr key={item.ID_Pendaftaran || idx} className="hover:bg-slate-50/80 transition-colors">
                          <th scope="row" className="py-3 pr-2 font-normal">
                            <span className="font-bold text-slate-900 block truncate max-w-[170px]">
                              {item.Nama_Lengkap}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.ID_Pendaftaran}
                            </span>
                          </th>
                          <td data-label="Kelas Diniyah" className="py-3 text-slate-600 font-medium">
                            <div className="flex flex-col sm:items-start items-end">
                              <span className="truncate max-w-[140px]">
                                {item.Kelas_Kategori || item.Kelas_Diniyah}
                              </span>
                              <span className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                isPutri ? 'bg-rose-50 text-rose-700' : 'bg-[#EAF4F0] text-[#075B45]'
                              }`}>
                                {isPutri ? 'Putri' : 'Putra'}
                              </span>
                            </div>
                          </td>
                          <td data-label="Cabang Lomba" className="py-3 text-slate-700 font-semibold">
                            <span className="truncate block max-w-[140px]">{item.Cabang_Lomba}</span>
                          </td>
                          <td data-label="No. Peserta" className="py-3 text-center font-mono">
                            {item.Nomor_Urut && String(item.Nomor_Urut).trim() !== '' ? (
                              <span className="px-2 py-0.5 rounded-lg bg-[#FCF6E5] text-[#9A7418] font-bold text-[11px] border border-[#D9B45B]/50 tabular-nums">
                                {String(item.Nomor_Urut).padStart(3, '0')}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs">-</span>
                            )}
                          </td>
                          <td data-label="Status" className="py-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              item.Status === 'Terverifikasi'
                                ? 'bg-[#EAF4F0] text-[#054736] border border-[#075B45]/20'
                                : item.Status === 'Ditolak'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {item.Status === 'Terverifikasi' ? 'Sah' : item.Status === 'Ditolak' ? 'Ditolak' : 'Pending'}
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

          <div className="pt-2.5 flex items-center justify-between border-t border-slate-100 text-[11px] text-slate-400">
            <span>Terurut dari pendaftaran paling baru</span>
            <span className="font-semibold text-slate-600 tabular-nums">
              Total {totalPeserta} delegasi
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
