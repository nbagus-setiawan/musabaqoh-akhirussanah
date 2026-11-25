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
  ArrowUpRight,
  Copy,
  Check,
  X
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

  // State Modal Siaran WhatsApp Grup Panitia / Asatidz
  const [isGroupWaModalOpen, setIsGroupWaModalOpen] = useState(false);
  const [copiedGroupMsg, setCopiedGroupMsg] = useState(false);
  const [editableGroupMsg, setEditableGroupMsg] = useState('');

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
  // SEBARAN PER JENJANG & CABANG LOMBA
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
        ? 'Belum ada santri yang didaftarkan'
        : `Baru terdaftar ${item.totalCount} santri`;
    const msg =
      `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
      `Kepada Yth. *${item.nama}*\n` +
      `Wali Kelas Diniyah: *${item.kelas}*\n` +
      `Pondok Pesantren Al-Falah Putak\n\n` +
      `Semoga Ustadz/Ustadzah senantiasa dalam limpahan taufiq, rahmat, dan kesehatan dari Allah SWT.\n\n` +
      `Kami dari Panitia Pelaksana menyampaikan pengingat resmi terkait pendaftaran delegasi santri dalam rangka *Musabaqah Akhirussanah 1447 H / 2026 M*.\n\n` +
      `Status Pengisian Kelas Saat Ini: *${statusDesc}*.\n\n` +
      `Mohon kiranya Ustadz/Ustadzah dapat segera mengisi dan melengkapi data delegasi santri secara mandiri melalui portal resmi pendaftaran berikut:\n` +
      `https://musabaqoh-akhirussanah.vercel.app/\n\n` +
      `Apabila terdapat kendala teknis atau kesalahan penulisan nama maupun cabang lomba yang perlu diperbaiki, silakan langsung menghubungi panitia pelaksana.\n\n` +
      `Atas perhatian, dedikasi, dan kerja sama Ustadz/Ustadzah, kami haturkan terima kasih yang sebesar-besarnya.\n` +
      `Jazakumullah Khairan Katsiran.\n\n` +
      `Wassalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
      `*Panitia Musabaqah Akhirussanah 1447 H / 2026 M*\n` +
      `YPPS Al-Falah Putak`;
    window.open(buildWaUrl(item.kontak, msg), '_blank', 'noopener,noreferrer');
  };

  // =========================================================
  // GENERATOR PESAN SIARAN GRUP WHATSAPP (SOPAN & TANPA BATAS KUOTA)
  // =========================================================
  const generateGroupWaMessage = () => {
    // 1. Kelas yang BELUM mengisi (0 santri)
    const belumUla = complianceMatrix.filter(m => m.tingkatKey === 'ula' && m.totalCount === 0);
    const belumWustho = complianceMatrix.filter(m => m.tingkatKey === 'wustho' && m.totalCount === 0);
    const belumLainnya = complianceMatrix.filter(
      m => m.tingkatKey !== 'ula' && m.tingkatKey !== 'wustho' && m.totalCount === 0
    );

    // 2. Kelas yang SUDAH mengisi (>0 santri)
    const sudahUla = complianceMatrix.filter(m => m.tingkatKey === 'ula' && m.totalCount > 0);
    const sudahWustho = complianceMatrix.filter(m => m.tingkatKey === 'wustho' && m.totalCount > 0);
    const sudahLainnya = complianceMatrix.filter(
      m => m.tingkatKey !== 'ula' && m.tingkatKey !== 'wustho' && m.totalCount > 0
    );

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    let msg = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n`;
    msg += `Salam ta'dzim kami haturkan kepada segenap Asatidz dan Asatidzah Wali Kelas Diniyah Pondok Pesantren Al-Falah Putak.\n\n`;
    msg += `Semoga para Asatidz senantiasa berada dalam lindungan taufiq, rahmat, dan kesehatan dari Allah Subhanahu wa Ta'ala.\n\n`;
    msg += `Izin kami dari Panitia Pelaksana menyampaikan rekapitulasi status pengisian formulir pendaftaran delegasi santri untuk *Musabaqah Akhirussanah 1447 H / 2026 M* (per ${dateStr}):\n\n`;

    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*KELAS & TINGKAT YANG BELUM MENGISI FORMULIR:*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Tingkat Ula
    msg += `*Tingkat Ula (Sifir s.d Jurumiyah):*\n`;
    if (belumUla.length > 0) {
      belumUla.forEach((item, idx) => {
        msg += `${idx + 1}. ${item.kelas}\n    Wali Kelas: ${item.nama}\n`;
      });
    } else {
      msg += `_(Alhamdulillah seluruh kelas Tingkat Ula sudah mengisi formulir)_\n`;
    }
    msg += `\n`;

    // Tingkat Wustho
    msg += `*Tingkat Wustho (Imrithi s.d Alfiyah):*\n`;
    if (belumWustho.length > 0) {
      belumWustho.forEach((item, idx) => {
        msg += `${idx + 1}. ${item.kelas}\n    Wali Kelas: ${item.nama}\n`;
      });
    } else {
      msg += `_(Alhamdulillah seluruh kelas Tingkat Wustho sudah mengisi formulir)_\n`;
    }

    if (belumLainnya.length > 0) {
      msg += `\n*Tingkat Lainnya:*\n`;
      belumLainnya.forEach((item, idx) => {
        msg += `${idx + 1}. ${item.kelas}\n    Wali Kelas: ${item.nama}\n`;
      });
    }

    msg += `\nKepada para Asatidz/Asatidzah wali kelas di atas yang belum mengisi, mohon bantuan dan kerja samanya untuk segera mendaftarkan delegasi santri kelas masing-masing melalui tautan resmi:\n`;
    msg += `https://musabaqoh-akhirussanah.vercel.app/\n\n`;

    // Kelas yang sudah mendaftarkan santri
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*KELAS YANG SUDAH MENDAFTARKAN DELEGASI:*\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    const totalSudah = sudahUla.length + sudahWustho.length + sudahLainnya.length;
    if (totalSudah > 0) {
      if (sudahUla.length > 0) {
        msg += `*Tingkat Ula:*\n`;
        sudahUla.forEach(item => {
          msg += `• ${item.kelas} (${item.nama}) — Terdaftar: ${item.totalCount} santri\n`;
        });
        msg += `\n`;
      }
      if (sudahWustho.length > 0) {
        msg += `*Tingkat Wustho:*\n`;
        sudahWustho.forEach(item => {
          msg += `• ${item.kelas} (${item.nama}) — Terdaftar: ${item.totalCount} santri\n`;
        });
        msg += `\n`;
      }
      if (sudahLainnya.length > 0) {
        msg += `*Tingkat Lainnya:*\n`;
        sudahLainnya.forEach(item => {
          msg += `• ${item.kelas} (${item.nama}) — Terdaftar: ${item.totalCount} santri\n`;
        });
        msg += `\n`;
      }

      msg += `Bagi para Asatidz/Asatidzah yang kelasnya sudah mengisi di atas, kami mohon konfirmasinya apakah data pendaftaran delegasi santri dari kelas panjenengan sudah *fix (lengkap & final)*, ataukah masih ada delegasi santri tambahan yang akan didaftarkan?\n\n`;
    } else {
      msg += `_(Belum ada kelas yang mengisi pendaftaran)_\n\n`;
    }

    // Bagian Kendala & Hubungi Panitia
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `*KENDALA & BANTUAN PANITIA:*\n`;
    msg += `Apabila terdapat kendala teknis dalam pengisian formulir online, atau terdapat kesalahan nama peserta maupun cabang lomba yang ingin diralat, mohon untuk segera menghubungi panitia pelaksana agar dapat segera kami bantu perbaiki sebelum proses pengundian nomor peserta dilakukan.\n\n`;

    msg += `Portal Pendaftaran:\n`;
    msg += `https://musabaqoh-akhirussanah.vercel.app/\n\n`;

    msg += `Atas perhatian, dedikasi, dan kerja sama yang baik dari segenap Asatidz dan Asatidzah sekalian, kami haturkan terima kasih yang sebesar-besarnya.\n\n`;
    msg += `Jazakumullah Khairan Katsiran.\n\n`;
    msg += `Wassalamu'alaikum Warahmatullahi Wabarakatuh.\n\n`;
    msg += `*Panitia Musabaqah Akhirussanah 1447 H / 2026 M*\n`;
    msg += `YPPS Al-Falah Putak`;

    return msg;
  };

  const handleOpenGroupWaModal = () => {
    setEditableGroupMsg(generateGroupWaMessage());
    setCopiedGroupMsg(false);
    setIsGroupWaModalOpen(true);
  };

  const handleCopyGroupMsg = () => {
    if (!editableGroupMsg) return;
    navigator.clipboard.writeText(editableGroupMsg).then(() => {
      setCopiedGroupMsg(true);
      setTimeout(() => setCopiedGroupMsg(false), 2500);
    }).catch(() => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = editableGroupMsg;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedGroupMsg(true);
        setTimeout(() => setCopiedGroupMsg(false), 2500);
      } catch (err) {}
    });
  };

  const handleSendToGroupWa = () => {
    if (!editableGroupMsg) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(editableGroupMsg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-3 sm:space-y-4.5 max-w-7xl mx-auto">
      {/* =========================================================
          1. BAR KENDALI OPERASIONAL RINGKAS (EMERALD & EMAS AL-FALAH)
         ========================================================= */}
      <section className="rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="h-0.5 sm:h-1 bg-gradient-to-r from-[#054736] via-[#075B45] to-[#D9B45B]" />
        <div className="p-3 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold bg-[#EAF4F0] text-[#054736] border border-[#075B45]/15 whitespace-nowrap">
                Musabaqah 1447 H
              </span>
              <span className="text-[10.5px] sm:text-xs font-semibold text-slate-500 truncate">
                YPPS Al-Falah Putak
              </span>
            </div>
            <h2 className="text-sm sm:text-lg font-extrabold text-slate-900 tracking-tight leading-snug">
              Pusat Kendali Panitia
            </h2>
            <p className="hidden sm:block text-[11px] sm:text-xs text-slate-500">
              Pantau kepatuhan {complianceMatrix.length} Kelas Diniyah, verifikasi berkas, dan nomor peserta.
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenGroupWaModal}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs transition-all shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
              title="Siarkan Rekap Kepatuhan ke Grup WhatsApp"
            >
              <WhatsAppIcon variant="white" className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="hidden sm:inline">Siarkan WA</span>
              <span className="sm:hidden">WA Grup</span>
            </button>
            <button
              type="button"
              onClick={() => handleJumpWithQuery('')}
              className="flex-1 sm:flex-none px-3 py-1.5 sm:py-2 rounded-xl bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs transition-all shadow-2xs flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Dices className="w-3.5 h-3.5 text-[#D9B45B]" />
              <span>Undian</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex-1 sm:flex-none px-3 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-[#075B45]" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-all cursor-pointer active:scale-95 shrink-0"
              title="Refresh Data"
              aria-label="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#075B45]' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          2. 4 KARTU METRIK KPI UTAMA (COMPACT WIDGET LAYOUT - BEBAS BENGKAK)
         ========================================================= */}
      <section aria-label="Ringkasan Statistik" className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5">
        <button
          type="button"
          onClick={() => handleJumpWithQuery('')}
          className="text-left bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-slate-200/80 shadow-2xs hover:border-[#075B45]/40 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase truncate">
              Delegasi
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#EAF4F0] text-[#075B45] flex items-center justify-center shrink-0 border border-[#075B45]/15 group-hover:scale-105 transition-transform">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums leading-none block">
              {totalPeserta}
            </span>
            <span className="text-[10.5px] sm:text-xs font-semibold text-[#075B45] block mt-1 whitespace-nowrap">
              {totalPutra} Pa • {totalPutri} Pi
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleJumpWithQuery('')}
          className="text-left bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-slate-200/80 shadow-2xs hover:border-emerald-400/50 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase truncate">
              Verifikasi
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/70 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums leading-none block">
              {totalTerverifikasi}
            </span>
            <span className="text-[10.5px] sm:text-xs font-semibold text-emerald-700 block mt-1 whitespace-nowrap">
              {pctTerverifikasi}% Berkas Sah
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleJumpWithQuery('')}
          className="text-left bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-slate-200/80 shadow-2xs hover:border-amber-400/60 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase truncate">
              Antrean
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/70 group-hover:scale-105 transition-transform">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums leading-none block font-mono">
              {totalPending}
            </span>
            <span className="text-[10.5px] sm:text-xs font-semibold text-amber-700 block mt-1 whitespace-nowrap">
              {totalPending > 0 ? `${totalPending} perlu verif` : 'Semua Beres'}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleJumpWithQuery('')}
          className="text-left bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-slate-200/80 shadow-2xs hover:border-[#D9B45B] hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase truncate">
              No. Peserta
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#FCF6E5] text-[#9A7418] flex items-center justify-center shrink-0 border border-[#D9B45B]/40 group-hover:scale-105 transition-transform">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums leading-none block font-mono">
              {totalDiundi}
            </span>
            <span className="text-[10.5px] sm:text-xs font-semibold text-[#9A7418] block mt-1 whitespace-nowrap">
              {pctDiundi}% Terundi
            </span>
          </div>
        </button>
      </section>

      {/* =========================================================
          3. MATRIKS KEPATUHAN KELAS DINIYAH (COMPACT & RESPONSIVE)
         ========================================================= */}
      <section className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs p-3 sm:p-5 space-y-3 sm:space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-2.5 sm:pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  Matriks Kepatuhan Kelas Diniyah
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF4F0] text-[#054736] border border-[#075B45]/15 whitespace-nowrap">
                  Target: {targetKuota}/Kelas
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500 mt-0.5">
                Pantau kepatuhan delegasi kelas dan siarkan rekap ke grup WhatsApp.
              </p>
            </div>

            {/* Tombol Mobile WA Grup */}
            <button
              type="button"
              onClick={handleOpenGroupWaModal}
              className="sm:hidden px-2.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-[11px] font-bold shadow-2xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              title="Siarkan Rekap ke WhatsApp Grup"
            >
              <WhatsAppIcon variant="white" className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Grup WA</span>
            </button>
          </div>

          {/* Tab Filter Swipeable di Layar HP & Tombol Desktop */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none -mx-1 px-1">
            <button
              type="button"
              onClick={handleOpenGroupWaModal}
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold shadow-2xs hover:shadow-xs active:scale-95 transition-all items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 mr-1"
              title="Siarkan Rekap ke WhatsApp Grup"
            >
              <WhatsAppIcon variant="white" className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Siarkan ke Grup WA</span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                matrixFilter === 'ALL'
                  ? 'bg-[#075B45] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Semua ({complianceMatrix.length})
            </button>
            {countUlaKelas > 0 && (
              <button
                type="button"
                onClick={() => handleFilterChange('ula')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  matrixFilter === 'ula'
                    ? 'bg-[#075B45] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Ula ({countUlaKelas})
              </button>
            )}
            {countWusthoKelas > 0 && (
              <button
                type="button"
                onClick={() => handleFilterChange('wustho')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  matrixFilter === 'wustho'
                    ? 'bg-[#075B45] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Wustho ({countWusthoKelas})
              </button>
            )}
            {countUlyaKelas > 0 && (
              <button
                type="button"
                onClick={() => handleFilterChange('ulya')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  matrixFilter === 'ulya'
                    ? 'bg-[#075B45] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Ulya ({countUlyaKelas})
              </button>
            )}
            {countMhqKelas > 0 && (
              <button
                type="button"
                onClick={() => handleFilterChange('mhq')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  matrixFilter === 'mhq'
                    ? 'bg-[#075B45] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                MHQ ({countMhqKelas})
              </button>
            )}
            <button
              type="button"
              onClick={() => handleFilterChange('incomplete')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                matrixFilter === 'incomplete'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              Belum Lengkap ({countIncomplete})
            </button>
          </div>
        </div>

        {/* Ringkasan Status Kepatuhan Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none -mx-1 px-1 text-xs">
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-semibold whitespace-nowrap text-[10.5px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#075B45]" />
            <span>{countLengkap} Lengkap (&ge;{targetKuota})</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/70 font-semibold whitespace-nowrap text-[10.5px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{countSebagian} Sebagian (1–{Math.max(1, targetKuota - 1)})</span>
          </div>
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200/70 font-semibold whitespace-nowrap text-[10.5px]">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{countBelum} Belum Mendaftar</span>
          </div>
        </div>

        {/* Grid 8 Kartu Kelas per Halaman (Compact & Rapi) */}
        <div className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-0.5">
          {pagedCompliance.map(item => {
            const pctFill = Math.min(100, Math.round((item.totalCount / targetKuota) * 100));

            return (
              <div
                key={item.kelas || item.no}
                className="bg-slate-50/80 hover:bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/80 hover:border-[#075B45]/30 transition-all flex flex-col justify-between space-y-2 sm:space-y-2.5 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                      <span className="font-mono font-bold">#{String(item.no).padStart(2, '0')}</span>
                      <span>•</span>
                      <span className="text-[#075B45] font-bold">{item.tingkatLabel}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold shrink-0 whitespace-nowrap ${
                      item.status === 'LENGKAP'
                        ? 'bg-emerald-100 text-[#054736]'
                        : item.status === 'SEBAGIAN'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {item.status === 'LENGKAP' ? 'LENGKAP' : item.status === 'SEBAGIAN' ? 'SEBAGIAN' : '0 KUOTA'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug mt-1 truncate" title={item.kelas}>
                    {item.kelas}
                  </h3>

                  <div className="flex items-center space-x-1 text-[10.5px] text-slate-500 font-medium mt-0.5 truncate" title={item.nama}>
                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{item.nama}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="font-medium text-slate-500">Kuota Terdaftar</span>
                    <span className="font-bold text-slate-800 font-mono tabular-nums whitespace-nowrap">
                      {item.totalCount}/{targetKuota} <span className="text-slate-400 font-normal">({item.verifiedCount} Sah)</span>
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-400 rounded-full ${
                        item.status === 'LENGKAP'
                          ? 'bg-[#075B45]'
                          : item.status === 'SEBAGIAN'
                          ? 'bg-amber-500'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: `${item.totalCount === 0 ? 3 : pctFill}%` }}
                    />
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-200/60 flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleSendReminderWA(item)}
                    className="flex-1 py-1 px-2 rounded-lg bg-[#075B45] hover:bg-[#054736] active:scale-95 text-white text-[10.5px] font-bold transition-all shadow-2xs flex items-center justify-center space-x-1 cursor-pointer whitespace-nowrap"
                    title={`Kirim WhatsApp Pengingat ke ${item.nama}`}
                  >
                    <WhatsAppIcon variant="white" className="w-3 h-3 text-white shrink-0" />
                    <span>Kirim WA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleJumpWithQuery(item.kelas)}
                    className="py-1 px-2.5 rounded-lg bg-white hover:bg-slate-100 active:scale-95 text-slate-700 text-[10.5px] font-bold border border-slate-200 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                    title="Lihat Santri Kelas Ini"
                  >
                    Lihat
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Paginasi Matriks Ringkas */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500 font-medium">
            Kelas <strong className="text-slate-800">{startMatrixIndex}–{endMatrixIndex}</strong> dari{' '}
            <strong className="text-slate-800">{filteredCompliance.length}</strong>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => handlePageChange(currentSafePage - 1)}
              disabled={currentSafePage === 1}
              className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1 cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalMatrixPages }, (_, i) => i + 1).map(pageNo => (
                <button
                  key={pageNo}
                  type="button"
                  onClick={() => handlePageChange(pageNo)}
                  className={`w-6.5 h-6.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    pageNo === currentSafePage
                      ? 'bg-[#075B45] text-white shadow-2xs'
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
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#075B45] text-white hover:bg-[#054736] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1 cursor-pointer shadow-2xs"
            >
              <span className="hidden sm:inline">Lanjutkan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          4. SEBARAN JENJANG & CABANG LOMBA + DATA SANTRI TERKINI
         ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5">
        {/* KIRI (5 KOLOM): SEBARAN PER JENJANG & CABANG LOMBA */}
        <section className="lg:col-span-5 bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-3 sm:space-y-3.5">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#EAF4F0] text-[#075B45] flex items-center justify-center border border-[#075B45]/15">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                    Sebaran Jenjang & Cabang
                  </h3>
                  <span className="text-[10.5px] text-slate-400">
                    Saring cepat delegasi lomba
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#9A7418] bg-[#FCF6E5] px-2 py-0.5 rounded-lg border border-[#D9B45B]/40">
                {branchSummary.length} Cabang
              </span>
            </div>

            {/* Ringkasan per Jenjang: Ula, Wustho, Ulya, MHQ */}
            <div className="grid grid-cols-2 gap-2">
              {jenjangSummary.map(j => (
                <button
                  key={j.key}
                  type="button"
                  onClick={() => handleJumpWithQuery(j.keyword)}
                  className="text-left p-2.5 rounded-xl bg-slate-50/80 hover:bg-[#EAF4F0]/70 border border-slate-200/70 hover:border-[#075B45]/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-slate-600 group-hover:text-[#054736] truncate">
                      {j.label}
                    </span>
                    <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-[#075B45] shrink-0" />
                  </div>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-base font-black text-slate-900 tabular-nums">{j.total}</span>
                    <span className="text-[10px] font-semibold text-[#075B45] tabular-nums">{j.sah} Sah</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Partisipasi per Cabang Lomba */}
            <div className="space-y-2 pt-0.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span className="inline-flex items-center gap-1">
                  <Award className="w-3 h-3 text-[#D9B45B]" />
                  <span>Partisipasi Cabang Lomba</span>
                </span>
                <span>Peserta</span>
              </div>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 admin-sidebar-scroll">
                {branchSummary.map(branch => {
                  const barPct = branch.total === 0 ? 0 : Math.max(6, Math.round((branch.total / maxBranchCount) * 100));
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => handleJumpWithQuery(branch.searchKeyword)}
                      className="w-full text-left group space-y-0.5 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700 group-hover:text-[#075B45] truncate pr-2">
                          {branch.name}
                        </span>
                        <span className="font-mono font-bold text-slate-900 tabular-nums shrink-0">
                          {branch.total}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#075B45] to-[#D9B45B] transition-all duration-400"
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

        {/* KANAN (7 KOLOM): DATA SANTRI TERDAFTAR TERKINI (TABEL HORIZONTAL SWIPE RAPI) */}
        <section className="lg:col-span-7 bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#EAF4F0] text-[#075B45] flex items-center justify-center border border-[#075B45]/15">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                    Data Santri Terdaftar Terkini
                  </h3>
                  <span className="text-[10.5px] text-slate-400">
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

            {/* Tabel Scrollable di Layar HP tanpa kartu bengkak */}
            <div className="dashboard-recent-wrapper border border-slate-200/70 rounded-xl overflow-x-auto">
              <table className="dashboard-recent-table text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold text-[11px] border-b border-slate-200/70">
                    <th className="py-2.5 px-3 font-semibold">Nama Santri</th>
                    <th className="py-2.5 px-3 font-semibold">Kelas Diniyah</th>
                    <th className="py-2.5 px-3 font-semibold">Cabang Lomba</th>
                    <th className="py-2.5 px-3 font-semibold text-center">No. Peserta</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Status</th>
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
                          <td className="py-2.5 px-3 font-normal whitespace-nowrap">
                            <span className="font-bold text-slate-900 block truncate max-w-[160px]">
                              {item.Nama_Lengkap}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.ID_Pendaftaran}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium whitespace-nowrap">
                            <span className="truncate block max-w-[130px]">
                              {item.Kelas_Kategori || item.Kelas_Diniyah}
                            </span>
                            <span className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isPutri ? 'bg-rose-50 text-rose-700' : 'bg-[#EAF4F0] text-[#075B45]'
                            }`}>
                              {isPutri ? 'Putri' : 'Putra'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-semibold whitespace-nowrap">
                            <span className="truncate block max-w-[130px]">{item.Cabang_Lomba}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap">
                            {item.Nomor_Urut && String(item.Nomor_Urut).trim() !== '' ? (
                              <span className="px-2 py-0.5 rounded-md bg-[#FCF6E5] text-[#9A7418] font-bold text-[10.5px] border border-[#D9B45B]/50 tabular-nums">
                                {String(item.Nomor_Urut).padStart(3, '0')}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-xs">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
            <p className="text-[10px] text-slate-400 sm:hidden text-center">
              Geser tabel ke kanan untuk melihat nomor peserta & status &rarr;
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-[10.5px] text-slate-400">
            <span>Terurut dari pendaftar paling baru</span>
            <span className="font-semibold text-slate-600 tabular-nums">
              Total {totalPeserta} delegasi
            </span>
          </div>
        </section>
      </div>

      {/* =========================================================
          MODAL SIARKAN PESAN KE GRUP WHATSAPP ASATIDZ / PANITIA
         ========================================================= */}
      {isGroupWaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Top Bar Gradient Al-Falah Putak */}
            <div className="h-1 bg-gradient-to-r from-[#054736] via-[#075B45] to-[#D9B45B]" />

            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0 border border-[#25D366]/30">
                  <WhatsAppIcon variant="color" className="w-6 h-6 shrink-0" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Siarkan Rekap ke WhatsApp Grup
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pesan sopan kepatuhan pendaftaran untuk grup Asatidz & Panitia
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsGroupWaModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-3.5">
              {/* Badges Info Ringkas */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                  Belum Mengisi: {countBelum} Kelas
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  Sudah Terdata: {countLengkap + countSebagian} Kelas
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                  Bebas Batas Kuota
                </span>
              </div>

              {/* Textarea Live Preview & Editable */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Pratinjau & Edit Draf Pesan:</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    Bisa disunting bebas sebelum dikirim
                  </span>
                </div>
                <textarea
                  value={editableGroupMsg}
                  onChange={(e) => setEditableGroupMsg(e.target.value)}
                  rows={13}
                  className="w-full text-xs font-mono leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:bg-white focus:border-[#075B45] focus:ring-1 focus:ring-[#075B45] outline-none transition-all resize-y select-text"
                  placeholder="Ketik atau edit draf pesan WhatsApp..."
                />
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 leading-normal">
                Pesan ini diformat khusus tanpa batas maksimal kuota. Klik <strong>Salin Pesan</strong> untuk menyalin teks ke papan klip, atau klik <strong>Buka WhatsApp</strong> untuk langsung membuka WhatsApp dan memilih grup tujuan.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setEditableGroupMsg(generateGroupWaMessage())}
                className="w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-slate-200 transition-all cursor-pointer"
              >
                Reset Pesan Asli
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCopyGroupMsg}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {copiedGroupMsg ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600" />
                      <span>Salin Pesan</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSendToGroupWa}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#1EBE5D] text-white shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <WhatsAppIcon variant="white" className="w-4 h-4 text-white shrink-0" />
                  <span>Buka WhatsApp (Pilih Grup)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
