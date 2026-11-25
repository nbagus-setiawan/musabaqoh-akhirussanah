import React, { useState, useEffect, useMemo } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  RefreshCw, 
  BookOpen,
  Award,
  Users,
  Layers,
  School,
  LayoutGrid,
  List,
  Search,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  User,
  UserCheck,
  Phone,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowDownToLine,
  ArrowUpToLine,
  Cloud,
  Filter,
  Check
} from 'lucide-react';
import { 
  getTingkatList, 
  getSubKelasByTingkat, 
  fetchTingkatKelas,
  syncAllTingkatKelasToGas,
  resetTingkatKelasToMaster,
  addKelasToTingkat, 
  updateKelasInTingkat, 
  deleteKelasFromTingkat,
  getWaliKelasList,
  getStoredGasUrl
} from '../../shared/services/api';

export default function AdminTingkatKelas({ registrations = [], onRefresh }) {
  const [tingkatList, setTingkatList] = useState(() => getTingkatList());
  const [subKelasData, setSubKelasData] = useState(() => getSubKelasByTingkat());
  const [waliKelasList, setWaliKelasList] = useState(() => getWaliKelasList());

  // Filter & Search State
  const [filterTingkat, setFilterTingkat] = useState('ALL');
  const [filterGender, setFilterGender] = useState('ALL'); // 'ALL' | 'L' (Putra) | 'P' (Putri)
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  // Pagination State untuk Table View
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal Tambah / Edit State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [selectedTingkat, setSelectedTingkat] = useState('ula');
  const [selectedGenderType, setSelectedGenderType] = useState('PUTRA'); // 'PUTRA' | 'PUTRI' | 'UMUM'
  const [oldKelasName, setOldKelasName] = useState('');
  const [kelasNameInput, setKelasNameInput] = useState('');
  const [formError, setFormError] = useState('');

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  const hasGasUrl = Boolean(getStoredGasUrl());

  const loadData = async (forceFetchFromSheets = false) => {
    setIsRefreshing(true);
    setTingkatList(getTingkatList());
    setWaliKelasList(getWaliKelasList());

    if (forceFetchFromSheets || hasGasUrl) {
      try {
        const fetchedSub = await fetchTingkatKelas();
        if (fetchedSub) {
          setSubKelasData(fetchedSub);
        } else {
          setSubKelasData(getSubKelasByTingkat());
        }
      } catch (e) {
        setSubKelasData(getSubKelasByTingkat());
      }
    } else {
      setSubKelasData(getSubKelasByTingkat());
    }

    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handlePullFromSheets = async () => {
    setIsSyncingSheets(true);
    setSyncMessage(null);
    try {
      const fetchedSub = await fetchTingkatKelas();
      setSubKelasData(fetchedSub);
      setSyncMessage({
        type: 'success',
        text: 'Alhamdulillah! Berhasil menarik data kelas diniyah dari Google Sheets.'
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      setSyncMessage({
        type: 'error',
        text: 'Gagal menarik data dari Google Sheets: ' + (err.message || 'Cek URL Web App di Pengaturan.')
      });
    } finally {
      setIsSyncingSheets(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handlePushToSheets = async () => {
    setIsSyncingSheets(true);
    setSyncMessage(null);
    try {
      const res = await syncAllTingkatKelasToGas(subKelasData);
      setSyncMessage({
        type: 'success',
        text: res.message || 'Alhamdulillah! Seluruh kelas diniyah (Putra & Putri) berhasil dikirim & disinkronkan ke Google Sheets.'
      });
    } catch (err) {
      setSyncMessage({
        type: 'error',
        text: 'Gagal mengirim ke Google Sheets: ' + (err.message || 'Cek URL Web App di Pengaturan.')
      });
    } finally {
      setIsSyncingSheets(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleResetToMaster = async () => {
    setIsSyncingSheets(true);
    try {
      const restored = await resetTingkatKelasToMaster();
      setSubKelasData(restored || getSubKelasByTingkat());
      setTingkatList(getTingkatList());
      setSyncMessage({
        type: 'success',
        text: 'Alhamdulillah! Seluruh kelas diniyah resmi Al-Falah Putak (Putra & Putri terpisah) berhasil dipulihkan.'
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      setSyncMessage({
        type: 'error',
        text: 'Gagal memulihkan data kelas: ' + (err.message || 'Cek koneksi Google Sheets.')
      });
    } finally {
      setIsSyncingSheets(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset pagination saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filterTingkat, filterGender, searchQuery, viewMode, itemsPerPage]);

  // Helper Deteksi Gender Kelas
  const detectKelasGender = (cName = '') => {
    const lower = cName.toLowerCase();
    if (lower.includes('putri') || lower.includes(' pi') || lower.endsWith('pi')) return 'P';
    if (lower.includes('putra') || lower.includes(' pa') || lower.endsWith('pa')) return 'L';
    return 'UMUM';
  };

  // Palet Tema Visual Jenjang Tingkat
  const getTingkatTheme = (id) => {
    switch (id) {
      case 'ula':
        return {
          name: 'Tingkat Ula',
          subName: 'Santri Tingkat Dasar / TPA',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          dot: 'bg-emerald-600',
          iconBg: 'bg-emerald-50 text-emerald-800 border border-emerald-100',
          accentBorder: 'border-emerald-200',
          icon: GraduationCap
        };
      case 'wustho':
        return {
          name: 'Tingkat Wustho',
          subName: 'Santri Tingkat Menengah (Sifir & Jurumiyah)',
          badgeBg: 'bg-sky-50 text-sky-800 border-sky-200/80',
          dot: 'bg-sky-600',
          iconBg: 'bg-sky-50 text-sky-800 border border-sky-100',
          accentBorder: 'border-sky-200',
          icon: BookOpen
        };
      case 'ulya':
        return {
          name: 'Tingkat Ulya',
          subName: 'Santri Tingkat Atas (Imrithi & Alfiyah)',
          badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
          dot: 'bg-indigo-600',
          iconBg: 'bg-indigo-50 text-indigo-800 border border-indigo-100',
          accentBorder: 'border-indigo-200',
          icon: Award
        };
      case 'mhq_juz':
        return {
          name: 'Tingkat Hifdzil Qur\'an (MHQ)',
          subName: 'Khusus Kategori Cabang MHQ Berdasarkan Juz',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
          dot: 'bg-amber-600',
          iconBg: 'bg-amber-50 text-amber-800 border border-amber-100',
          accentBorder: 'border-amber-200',
          icon: Sparkles
        };
      default:
        return {
          name: id,
          subName: 'Jenjang Tambahan',
          badgeBg: 'bg-slate-50 text-slate-800 border-slate-200',
          dot: 'bg-slate-500',
          iconBg: 'bg-slate-100 text-slate-800',
          accentBorder: 'border-slate-200',
          icon: School
        };
    }
  };

  // 1. Flatten Data Semua Kelas Diniyah Lengkap
  const allKelasList = useMemo(() => {
    const list = [];
    tingkatList.forEach(t => {
      const classes = subKelasData[t.id] || [];
      classes.forEach(cName => {
        const santriCount = registrations.filter(r => 
          (r.Kelas_Kategori || '').toLowerCase().trim() === cName.toLowerCase().trim()
        ).length;

        const wali = (waliKelasList || []).find(w => 
          (w.kelas || '').toLowerCase().trim() === cName.toLowerCase().trim()
        );

        const gender = detectKelasGender(cName);

        list.push({
          id: `${t.id}-${cName}`,
          tingkatId: t.id,
          tingkatName: t.name,
          namaKelas: cName,
          gender,
          santriCount,
          waliKelas: wali ? wali.nama : null,
          waliKontak: wali ? wali.kontak : null
        });
      });
    });
    return list;
  }, [tingkatList, subKelasData, registrations, waliKelasList]);

  // 2. Metrik Ringkasan Bersih
  const stats = useMemo(() => {
    const totalKelas = allKelasList.length;
    const putraKelas = allKelasList.filter(r => r.gender === 'L').length;
    const putriKelas = allKelasList.filter(r => r.gender === 'P').length;
    const totalSantri = registrations.length;
    const santriPutra = registrations.filter(r => (r.Jenis_Kelamin || '').toLowerCase().startsWith('l')).length;
    const santriPutri = registrations.filter(r => (r.Jenis_Kelamin || '').toLowerCase().startsWith('p')).length;

    return {
      totalJenjang: tingkatList.length,
      totalKelas,
      putraKelas,
      putriKelas,
      totalSantri,
      santriPutra,
      santriPutri
    };
  }, [tingkatList, allKelasList, registrations]);

  // 3. Filter Kelas Diniyah berdasarkan Tingkat, Gender, dan Pencarian
  const filteredKelas = useMemo(() => {
    return allKelasList.filter(item => {
      // Filter Pencarian
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = (
          item.namaKelas.toLowerCase().includes(q) ||
          item.tingkatName.toLowerCase().includes(q) ||
          (item.waliKelas || '').toLowerCase().includes(q)
        );
        if (!match) return false;
      }

      // Filter Jenjang
      if (filterTingkat !== 'ALL' && item.tingkatId !== filterTingkat) {
        return false;
      }

      // Filter Gender
      if (filterGender !== 'ALL' && item.gender !== filterGender) {
        return false;
      }

      return true;
    });
  }, [allKelasList, searchQuery, filterTingkat, filterGender]);

  // 4. Paginasi Tabel
  const totalPages = Math.max(1, Math.ceil(filteredKelas.length / itemsPerPage));
  const paginatedKelas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredKelas.slice(start, start + itemsPerPage);
  }, [filteredKelas, currentPage, itemsPerPage]);

  const startIndex = filteredKelas.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredKelas.length);

  // Tab Navigasi Jenjang
  const tabPills = [
    { id: 'ALL', label: 'Semua Jenjang', count: allKelasList.length },
    ...tingkatList.map(t => {
      const count = (subKelasData[t.id] || []).length;
      return { id: t.id, label: t.name, count };
    })
  ];

  // Handler Buka Modal Tambah
  const openAddModal = (tingkatId = 'ula') => {
    setModalMode('add');
    setSelectedTingkat(tingkatId);
    setSelectedGenderType('PUTRA');
    setOldKelasName('');
    setKelasNameInput('');
    setFormError('');
    setShowModal(true);
  };

  // Handler Buka Modal Edit
  const openEditModal = (tingkatId, currentName) => {
    setModalMode('edit');
    setSelectedTingkat(tingkatId);
    setOldKelasName(currentName);
    setKelasNameInput(currentName);
    const g = detectKelasGender(currentName);
    setSelectedGenderType(g === 'L' ? 'PUTRA' : g === 'P' ? 'PUTRI' : 'UMUM');
    setFormError('');
    setShowModal(true);
  };

  // Simpan / Edit Kelas Diniyah
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    let trimmed = kelasNameInput.trim();
    if (!trimmed) {
      setFormError('Nama kelas diniyah tidak boleh kosong.');
      return;
    }

    // Bantu tambahkan akhiran Putra / Putri jika belum ada dan mode add
    if (modalMode === 'add' && selectedTingkat !== 'mhq_juz') {
      const lower = trimmed.toLowerCase();
      if (selectedGenderType === 'PUTRA' && !lower.includes('putra') && !lower.endsWith('pa')) {
        trimmed = `${trimmed} Putra`;
      } else if (selectedGenderType === 'PUTRI' && !lower.includes('putri') && !lower.endsWith('pi')) {
        trimmed = `${trimmed} Putri`;
      }
    }

    try {
      if (modalMode === 'add') {
        const updated = await addKelasToTingkat(selectedTingkat, trimmed);
        setSubKelasData(updated || getSubKelasByTingkat());
      } else {
        const updated = await updateKelasInTingkat(selectedTingkat, oldKelasName, trimmed);
        setSubKelasData(updated || getSubKelasByTingkat());
      }
      setShowModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan perubahan kelas.');
    }
  };

  // Hapus Kelas Diniyah
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const updated = await deleteKelasFromTingkat(deleteTarget.tingkatId, deleteTarget.namaKelas);
      setSubKelasData(updated || getSubKelasByTingkat());
      setDeleteTarget(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setSyncMessage({
        type: 'error',
        text: err.message || 'Gagal menghapus kelas diniyah.'
      });
      setDeleteTarget(null);
    }
  };

  return (
    <div className="p-3 sm:p-5 lg:p-7 space-y-3 sm:space-y-4 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER BANNER (COMPACT & RAPI) */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4.5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 relative overflow-hidden">
        <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#EAF4F0] text-[#075B45] border border-[#075B45]/15 flex items-center justify-center shrink-0">
            <School className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Tingkat & Kelas Diniyah</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF4F0] text-[#054736] border border-[#075B45]/15 whitespace-nowrap">
                {stats.totalKelas} Kelas
              </span>
            </h2>
            <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
              Kelola master jenjang pendidikan santri dan pembagian kelas diniyah (Santri Putra & Santri Putri terpisah rapi).
            </p>
          </div>
        </div>

        {/* Toolbar Aksi - 1 Baris Rapi di HP */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openAddModal('ula')}
            className="px-3 py-1.5 sm:py-2 rounded-xl bg-[#075B45] hover:bg-[#054736] active:scale-95 text-white font-bold text-xs shadow-2xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            <span>+ Kelas</span>
          </button>

          <button
            type="button"
            onClick={handlePushToSheets}
            disabled={isSyncingSheets}
            title="Kirim seluruh kelas diniyah ke Google Sheets"
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white font-bold text-xs shadow-2xs flex items-center justify-center space-x-1 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <ArrowUpToLine className={`w-3.5 h-3.5 text-teal-200 ${isSyncingSheets ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">Kirim ke Sheets</span>
            <span className="sm:hidden">Sheets</span>
          </button>

          <button
            type="button"
            onClick={handlePullFromSheets}
            disabled={isSyncingSheets}
            title="Tarik data kelas langsung dari Google Sheets"
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200/90 bg-white text-sky-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            type="button"
            onClick={handleResetToMaster}
            title="Pulihkan seluruh kelas diniyah standar resmi Al-Falah Putak"
            className="p-1.5 sm:p-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700" />
          </button>

          <button
            type="button"
            onClick={() => loadData(true)}
            title="Segarkan Data"
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin text-[#075B45]' : ''}`} />
          </button>
        </div>
      </div>

      {/* NOTIFIKASI SYNC SHEETS */}
      {syncMessage && (
        <div className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 text-xs font-medium animate-fadeIn ${
          syncMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center space-x-2 min-w-0">
            {syncMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="truncate">{syncMessage.text}</span>
          </div>
          <button 
            type="button"
            onClick={() => setSyncMessage(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. STATS WIDGETS (COMPACT WIDGET LAYOUT - BEBAS BENGKAK) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        
        {/* Card 1: Total Kelas Diniyah */}
        <button
          type="button"
          onClick={() => { setFilterTingkat('ALL'); setFilterGender('ALL'); }}
          className={`text-left rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] ${
            filterTingkat === 'ALL' && filterGender === 'ALL'
              ? 'border-[#075B45] ring-2 ring-[#075B45]/20 bg-[#EAF4F0]/40'
              : 'bg-white border-slate-200/80 shadow-2xs hover:border-[#075B45]/40 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 tracking-wider uppercase truncate">
              Total Kelas
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg border flex items-center justify-center shrink-0 bg-[#EAF4F0] text-[#075B45] border-[#075B45]/20 group-hover:scale-105 transition-transform">
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums leading-none block">
              {stats.totalKelas}
            </span>
            <span className="text-[10.5px] sm:text-xs font-semibold block mt-1 whitespace-nowrap truncate text-[#075B45]">
              {stats.totalJenjang} Jenjang Pendidikan
            </span>
          </div>
        </button>

        {/* Card 2: Santri Terdaftar */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 tracking-wider uppercase truncate">
              Total Santri
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg border flex items-center justify-center shrink-0 bg-teal-50 text-teal-700 border-teal-200">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums leading-none block">
              {stats.totalSantri}
            </span>
            <span className="text-[10.5px] sm:text-xs font-semibold block mt-1 whitespace-nowrap truncate text-teal-700">
              Terdata di perlombaan
            </span>
          </div>
        </div>

        {/* Card 3: Kelas Putra */}
        <button
          type="button"
          onClick={() => setFilterGender(filterGender === 'L' ? 'ALL' : 'L')}
          className={`text-left rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] ${
            filterGender === 'L'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40'
              : 'bg-white border-slate-200/80 shadow-2xs hover:border-blue-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 tracking-wider uppercase truncate">
              Kelas Putra
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg border flex items-center justify-center shrink-0 bg-blue-50 text-blue-700 border-blue-200 group-hover:scale-105 transition-transform">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-700" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black text-blue-900 tabular-nums leading-none block">
              {stats.putraKelas} <span className="text-xs font-normal text-blue-600">Kelas</span>
            </span>
            <span className="text-[10.5px] sm:text-xs font-semibold block mt-1 whitespace-nowrap truncate text-blue-700">
              {stats.santriPutra} Santri Putra
            </span>
          </div>
        </button>

        {/* Card 4: Kelas Putri */}
        <button
          type="button"
          onClick={() => setFilterGender(filterGender === 'P' ? 'ALL' : 'P')}
          className={`text-left rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] ${
            filterGender === 'P'
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40'
              : 'bg-white border-slate-200/80 shadow-2xs hover:border-rose-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] sm:text-[11px] font-bold text-rose-600 tracking-wider uppercase truncate">
              Kelas Putri
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg border flex items-center justify-center shrink-0 bg-rose-50 text-rose-700 border-rose-200 group-hover:scale-105 transition-transform">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-700" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black text-rose-900 tabular-nums leading-none block">
              {stats.putriKelas} <span className="text-xs font-normal text-rose-600">Kelas</span>
            </span>
            <span className="text-[10.5px] sm:text-xs font-semibold block mt-1 whitespace-nowrap truncate text-rose-700">
              {stats.santriPutri} Santri Putri
            </span>
          </div>
        </button>

      </div>

      {/* 3. TOOLBAR PENCARIAN & FILTER TERINTEGRASI */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        
        {/* Baris 1: Filter Tab Jenjang & Gender */}
        <div className="border-b border-slate-100 px-3 sm:px-6 py-2 sm:py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 bg-slate-50/50">
          
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none w-full sm:w-auto">
            {tabPills.map((tab) => {
              const isActive = filterTingkat === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTingkat(tab.id)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#054736] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-[#075B45] text-emerald-100' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Gender Segmented Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200/80 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterGender('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterGender === 'ALL'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilterGender('L')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                filterGender === 'L'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Putra ({stats.putraKelas})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterGender('P')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                filterGender === 'P'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <User className="w-3 h-3" />
              <span>Putri ({stats.putriKelas})</span>
            </button>
          </div>
        </div>

        {/* Baris 2: Search Input & View Toggle */}
        <div className="p-3 sm:p-4 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white">
          
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kelas (contoh: Sifir A Putra, Alfiyah, dll)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-[#075B45] focus:ring-1 focus:ring-[#075B45] bg-slate-50/50 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end text-xs">
            <span className="text-slate-500 text-[11px] sm:text-xs">
              Menampilkan <strong className="text-slate-800">{filteredKelas.length}</strong> kelas terfilter
            </span>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-[#075B45] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Tampilan Kartu Kelas"
              >
                <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline text-[11px]">Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-[#075B45] shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Tampilan Tabel Rinci"
              >
                <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline text-[11px]">Tabel</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4A. VIEW MODE: KARTU KELAS DINIYAH (ANTI-BENGKAK, COMPACT & RAPI) */}
        {viewMode === 'cards' && (
          <div className="p-3 sm:p-5 bg-slate-50/40 space-y-5 sm:space-y-6">
            {tingkatList
              .filter(t => filterTingkat === 'ALL' || t.id === filterTingkat)
              .map(tingkat => {
                const theme = getTingkatTheme(tingkat.id);
                const IconComp = theme.icon;
                const allClasses = subKelasData[tingkat.id] || [];

                // Filter kelas di dalam jenjang ini
                const classes = allClasses.filter(cName => {
                  const gender = detectKelasGender(cName);
                  if (filterGender !== 'ALL' && gender !== filterGender) return false;

                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  const wali = (waliKelasList || []).find(w => (w.kelas || '').toLowerCase() === cName.toLowerCase());
                  return cName.toLowerCase().includes(q) || (wali && wali.nama.toLowerCase().includes(q));
                });

                if (classes.length === 0 && (searchQuery || filterGender !== 'ALL')) {
                  return null;
                }

                const totalSantriTingkat = registrations.filter(r => {
                  const t = (r.Tingkat || '').toLowerCase();
                  return t.includes(tingkat.name.toLowerCase()) || t.includes(tingkat.id.toLowerCase());
                }).length;

                return (
                  <div key={tingkat.id} className="space-y-2.5 sm:space-y-3">
                    
                    {/* Header Jenjang Compact */}
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200/80">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${theme.iconBg} flex items-center justify-center shrink-0`}>
                          <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight truncate">
                              {tingkat.name}
                            </h3>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              {classes.length} Kelas
                            </span>
                          </div>
                          <p className="hidden sm:block text-[11px] text-slate-400 truncate">{tingkat.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border ${theme.badgeBg}`}>
                          {totalSantriTingkat} Santri
                        </span>
                        <button
                          type="button"
                          onClick={() => openAddModal(tingkat.id)}
                          className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[#075B45] hover:bg-emerald-50 text-[11px] font-bold flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Kelas</span>
                        </button>
                      </div>
                    </div>

                    {/* Responsive Grid Cards: 1 kol di mobile, 2 di tablet, 3-4 di desktop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                      {classes.map((kelasName) => {
                        const gender = detectKelasGender(kelasName);
                        const isPutra = gender === 'L';
                        const isPutri = gender === 'P';

                        const santriInClass = registrations.filter(r => 
                          (r.Kelas_Kategori || '').toLowerCase().trim() === kelasName.toLowerCase().trim()
                        ).length;

                        const wali = (waliKelasList || []).find(w => 
                          (w.kelas || '').toLowerCase().trim() === kelasName.toLowerCase().trim()
                        );

                        return (
                          <div
                            key={kelasName}
                            className={`bg-white rounded-xl p-2.5 sm:p-3 border transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-xs group ${
                              isPutra 
                                ? 'border-blue-100 hover:border-blue-300' 
                                : isPutri 
                                  ? 'border-rose-100 hover:border-rose-300' 
                                  : 'border-slate-200 hover:border-emerald-300'
                            }`}
                          >
                            {/* Baris Atas: Badge Gender & Aksi */}
                            <div className="flex items-center justify-between gap-1 mb-1">
                              {/* Gender Badge */}
                              {isPutra ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                                  <User className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                                  <span>Santri Putra</span>
                                </span>
                              ) : isPutri ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                                  <User className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                                  <span>Santri Putri</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                                  <BookOpen className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                  <span>Tahfidz MHQ</span>
                                </span>
                              )}

                              {/* Action Buttons */}
                              <div className="flex items-center space-x-0.5">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(tingkat.id, kelasName)}
                                  title="Edit Nama Kelas"
                                  className="p-1 rounded text-slate-400 hover:text-[#075B45] hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget({ tingkatId: tingkat.id, namaKelas: kelasName })}
                                  title="Hapus Kelas"
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Nama Kelas */}
                            <div className="my-1">
                              <h4 className="text-xs sm:text-[13px] font-extrabold text-slate-900 tracking-tight group-hover:text-emerald-800 transition-colors truncate leading-snug">
                                {kelasName}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-medium block truncate">
                                {tingkat.name}
                              </span>
                            </div>

                            {/* Baris Bawah: Wali Kelas & Santri Count */}
                            <div className="pt-1.5 mt-1 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs">
                              {/* Info Wali */}
                              <div className="truncate flex items-center space-x-1 text-slate-600 min-w-0">
                                <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="text-[10.5px] font-medium truncate" title={wali ? wali.nama : 'Belum ditetapkan'}>
                                  {wali ? wali.nama : 'Belum ada wali'}
                                </span>
                              </div>

                              {/* Badge Santri */}
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                santriInClass > 0
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-400'
                              }`}>
                                {santriInClass} Santri
                              </span>
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
          </div>
        )}

        {/* 4B. VIEW MODE: TABEL LENGKAP & MOBILE CARDS LIST */}
        {viewMode === 'table' && (
          <div>
            {/* Tampilan Kartu Khusus HP (block sm:hidden) */}
            <div className="block sm:hidden divide-y divide-slate-100 bg-white">
              {filteredKelas.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <School className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 text-xs">Tidak ada kelas ditemukan</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Coba sesuaikan kata kunci atau filter jenjang/gender.</p>
                </div>
              ) : (
                paginatedKelas.map((item, idx) => {
                  const theme = getTingkatTheme(item.tingkatId);
                  const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                  const isPutra = item.gender === 'L';
                  const isPutri = item.gender === 'P';

                  return (
                    <div key={item.id || idx} className="p-3 hover:bg-slate-50/80 transition-colors">
                      {/* Baris 1: No, Nama Kelas, Gender Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-slate-400 text-[10px] font-semibold w-4 shrink-0 text-center">
                            {rowNumber}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate">
                              {item.namaKelas}
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {item.tingkatName}
                            </span>
                          </div>
                        </div>

                        {isPutra ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                            <User className="w-2.5 h-2.5 text-blue-600" />
                            <span>Putra</span>
                          </span>
                        ) : isPutri ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                            <User className="w-2.5 h-2.5 text-rose-600" />
                            <span>Putri</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                            <BookOpen className="w-2.5 h-2.5 text-amber-600" />
                            <span>Tahfidz</span>
                          </span>
                        )}
                      </div>

                      {/* Baris 2: Wali Kelas & Santri & Aksi */}
                      <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-100 text-xs">
                        <div className="truncate flex items-center space-x-1 text-slate-600 min-w-0 mr-2">
                          <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="text-[10.5px] font-medium truncate" title={item.waliKelas || 'Belum ada wali'}>
                            {item.waliKelas || 'Belum ada wali'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.santriCount > 0 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {item.santriCount} Santri
                          </span>

                          <button
                            type="button"
                            onClick={() => openEditModal(item.tingkatId, item.namaKelas)}
                            title="Edit Nama Kelas"
                            className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ tingkatId: item.tingkatId, namaKelas: item.namaKelas })}
                            title="Hapus Kelas"
                            className="p-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Nama Kelas Diniyah</th>
                    <th className="py-3 px-4">Kategori Gender</th>
                    <th className="py-3 px-4">Jenjang Pendidikan</th>
                    <th className="py-3 px-4">Wali Kelas Pengampu</th>
                    <th className="py-3 px-4 text-center">Santri Terdaftar</th>
                    <th className="py-3 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredKelas.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-16 text-center text-slate-400">
                        <div className="max-w-xs mx-auto space-y-2">
                          <School className="w-10 h-10 text-slate-300 mx-auto" />
                          <p className="font-bold text-slate-700 text-sm">Tidak ada kelas ditemukan</p>
                          <p className="text-xs text-slate-400">Coba sesuaikan kata kunci pencarian atau filter jenjang/gender.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedKelas.map((item, idx) => {
                      const theme = getTingkatTheme(item.tingkatId);
                      const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                      const isPutra = item.gender === 'L';
                      const isPutri = item.gender === 'P';

                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors group">
                          
                          {/* No */}
                          <td className="py-3 px-4 text-center font-mono text-slate-400 text-xs font-semibold">
                            {rowNumber}
                          </td>

                          {/* Nama Kelas Diniyah */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-800 transition-colors">
                              {item.namaKelas}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Kode: {item.tingkatId}
                            </span>
                          </td>

                          {/* Kategori Gender */}
                          <td className="py-3 px-4">
                            {isPutra ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                <User className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>Putra</span>
                              </span>
                            ) : isPutri ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                                <User className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>Putri</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <BookOpen className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Tahfidz</span>
                              </span>
                            )}
                          </td>

                          {/* Jenjang Tingkat */}
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${theme.badgeBg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${theme.dot}`}></span>
                              {item.tingkatName}
                            </span>
                          </td>

                          {/* Wali Kelas */}
                          <td className="py-3 px-4">
                            {item.waliKelas ? (
                              <div className="flex items-center space-x-2">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                                <div>
                                  <span className="font-semibold text-slate-800 text-xs block">
                                    {item.waliKelas}
                                  </span>
                                  {item.waliKontak && (
                                    <span className="text-[10px] font-mono text-emerald-700 flex items-center gap-1">
                                      <Phone className="w-2.5 h-2.5" />
                                      {item.waliKontak}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Belum ditetapkan
                              </span>
                            )}
                          </td>

                          {/* Santri Terdaftar */}
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              item.santriCount > 0 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {item.santriCount} Santri
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => openEditModal(item.tingkatId, item.namaKelas)}
                                title="Edit Nama Kelas"
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteTarget({ tingkatId: item.tingkatId, namaKelas: item.namaKelas })}
                                title="Hapus Kelas"
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

            {/* Pagination Footer */}
            <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
              <div className="text-slate-500 font-medium flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <span>
                  Menampilkan <strong className="text-slate-800">{startIndex} - {endIndex}</strong> dari <strong className="text-slate-800">{filteredKelas.length}</strong> kelas
                </span>
                <span className="text-slate-300">•</span>
                <div className="flex items-center space-x-1">
                  <span>Tampilkan:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1 shadow-2xs cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    if (
                      totalPages > 6 &&
                      page !== 1 &&
                      page !== totalPages &&
                      Math.abs(page - currentPage) > 1
                    ) {
                      if (page === 2 || page === totalPages - 1) {
                        return <span key={page} className="px-1 text-slate-400 font-bold">...</span>;
                      }
                      return null;
                    }

                    const isActive = page === currentPage;
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${
                          isActive
                            ? 'bg-[#054736] text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || filteredKelas.length === 0}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1 shadow-2xs cursor-pointer"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 5. MODAL TAMBAH / EDIT KELAS (SPACIOUS & INTUITIF DENGAN PILIHAN GENDER) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800" />

            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
                  {modalMode === 'add' ? <Plus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {modalMode === 'add' ? 'Tambah Kelas Diniyah Baru' : 'Edit Nama Kelas Diniyah'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalMode === 'add' ? 'Tambahkan sub-kelas baru (Putra / Putri)' : 'Perbarui nama kelas diniyah santri'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Pilihan Jenjang */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                  Jenjang Pendidikan
                </label>
                <select
                  value={selectedTingkat}
                  onChange={(e) => setSelectedTingkat(e.target.value)}
                  disabled={modalMode === 'edit'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-500 cursor-pointer"
                >
                  {tingkatList.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.desc})</option>
                  ))}
                </select>
              </div>

              {/* Pilihan Kategori Gender untuk Memudahkan Penamaan */}
              {selectedTingkat !== 'mhq_juz' && (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                    Kategori Santri
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedGenderType('PUTRA')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
                        selectedGenderType === 'PUTRA'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>Santri Putra</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedGenderType('PUTRI')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all ${
                        selectedGenderType === 'PUTRI'
                          ? 'bg-rose-600 border-rose-600 text-white shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>Santri Putri</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Input Nama Kelas */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                  Nama Kelas Diniyah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={selectedTingkat === 'mhq_juz' ? 'Contoh: 30 Juz' : 'Contoh: Alfiyah Tsalits / Jurumiyah D'}
                  value={kelasNameInput}
                  onChange={(e) => setKelasNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 bg-slate-50/50 focus:bg-white transition-all placeholder:font-normal placeholder:text-slate-400"
                  required
                />
                {modalMode === 'add' && selectedTingkat !== 'mhq_juz' && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Akhiran <strong>"{selectedGenderType === 'PUTRA' ? 'Putra' : 'Putri'}"</strong> akan ditambahkan otomatis jika belum diketik.
                  </p>
                )}
              </div>

              {formError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Tombol Aksi Modal */}
              <div className="flex space-x-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {modalMode === 'add' ? 'Simpan Kelas' : 'Perbarui Kelas'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. MODAL KONFIRMASI HAPUS KELAS DINIYAH */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />

            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Hapus Kelas Diniyah?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Apakah Anda yakin ingin menghapus kelas diniyah <strong>"{deleteTarget.namaKelas}"</strong>? Kelas ini tidak akan muncul lagi di opsi formulir pendaftaran.
              </p>
            </div>

            <div className="flex space-x-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors shadow-xs cursor-pointer"
              >
                Ya, Hapus Kelas
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
