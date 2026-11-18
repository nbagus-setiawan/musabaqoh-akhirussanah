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
        text: 'Alhamdulillah! Berhasil menarik data rombel kelas dari Google Sheets.'
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
        text: res.message || 'Alhamdulillah! Seluruh 38 rombel (Putra & Putri) berhasil dikirim & disinkronkan ke Google Sheets.'
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

  const handleResetToMaster = () => {
    const restored = resetTingkatKelasToMaster();
    setSubKelasData(restored);
    setTingkatList(getTingkatList());
    setSyncMessage({
      type: 'success',
      text: 'Alhamdulillah! Seluruh rombel resmi Al-Falah Putak (Putra & Putri terpisah) berhasil dipulihkan.'
    });
    if (onRefresh) onRefresh();
    setTimeout(() => setSyncMessage(null), 5000);
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

  // 1. Flatten Data Semua Rombel Lengkap
  const allRombelList = useMemo(() => {
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
    const totalRombel = allRombelList.length;
    const putraRombel = allRombelList.filter(r => r.gender === 'L').length;
    const putriRombel = allRombelList.filter(r => r.gender === 'P').length;
    const totalSantri = registrations.length;
    const santriPutra = registrations.filter(r => (r.Jenis_Kelamin || '').toLowerCase().startsWith('l')).length;
    const santriPutri = registrations.filter(r => (r.Jenis_Kelamin || '').toLowerCase().startsWith('p')).length;

    return {
      totalJenjang: tingkatList.length,
      totalRombel,
      putraRombel,
      putriRombel,
      totalSantri,
      santriPutra,
      santriPutri
    };
  }, [tingkatList, allRombelList, registrations]);

  // 3. Filter Rombel berdasarkan Tingkat, Gender, dan Pencarian
  const filteredRombel = useMemo(() => {
    return allRombelList.filter(item => {
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
  }, [allRombelList, searchQuery, filterTingkat, filterGender]);

  // 4. Paginasi Tabel
  const totalPages = Math.max(1, Math.ceil(filteredRombel.length / itemsPerPage));
  const paginatedRombel = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRombel.slice(start, start + itemsPerPage);
  }, [filteredRombel, currentPage, itemsPerPage]);

  const startIndex = filteredRombel.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredRombel.length);

  // Tab Navigasi Jenjang
  const tabPills = [
    { id: 'ALL', label: 'Semua Jenjang', count: allRombelList.length },
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

  // Simpan / Edit Rombel
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    let trimmed = kelasNameInput.trim();
    if (!trimmed) {
      setFormError('Nama kelas / rombel tidak boleh kosong.');
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
        const updated = addKelasToTingkat(selectedTingkat, trimmed);
        setSubKelasData(updated);
      } else {
        const updated = updateKelasInTingkat(selectedTingkat, oldKelasName, trimmed);
        setSubKelasData(updated);
      }
      setShowModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setFormError(err.message);
    }
  };

  // Hapus Rombel
  const handleDelete = () => {
    if (!deleteTarget) return;
    try {
      const updated = deleteKelasFromTingkat(deleteTarget.tingkatId, deleteTarget.namaKelas);
      setSubKelasData(updated);
      setDeleteTarget(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER BANNER (LEGA, BERSIH, MODERN) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Sisi Kiri: Judul & Subtitle */}
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-sm shrink-0">
              <School className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Tingkat Pendidikan & Rombel Kelas
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {stats.totalRombel} Rombel Terdaftar
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Kelola master jenjang pendidikan santri dan pembagian rombel kelas (Santri Putra & Santri Putri terpisah rapi).
              </p>
            </div>
          </div>

          {/* Sisi Kanan: Action Controls Terorganisir */}
          <div className="flex items-center flex-wrap gap-2.5 shrink-0">
            
            {/* Tombol Utama: Tambah Kelas */}
            <button
              onClick={() => openAddModal('ula')}
              className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-300" />
              <span>Tambah Kelas</span>
            </button>

            {/* Tombol Kirim ke Sheets */}
            <button
              onClick={handlePushToSheets}
              disabled={isSyncingSheets}
              title="Kirim seluruh rombel (Putra & Putri) ke Google Sheets"
              className="px-3.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <ArrowUpToLine className={`w-4 h-4 text-teal-200 ${isSyncingSheets ? 'animate-bounce' : ''}`} />
              <span>Kirim ke Sheets</span>
            </button>

            {/* Tombol Tarik dari Sheets */}
            <button
              onClick={handlePullFromSheets}
              disabled={isSyncingSheets}
              title="Tarik data kelas langsung dari Google Sheets"
              className="px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <ArrowDownToLine className="w-4 h-4 text-sky-600" />
              <span className="hidden sm:inline">Tarik</span>
            </button>

            {/* Tombol Pulihkan Master */}
            <button
              onClick={handleResetToMaster}
              title="Pulihkan seluruh rombel standar resmi Al-Falah Putak"
              className="px-3 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden md:inline">Pulihkan Master</span>
            </button>

            {/* Tombol Segarkan */}
            <button
              onClick={() => loadData(true)}
              title="Segarkan Data"
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-800' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* NOTIFIKASI SYNC SHEETS */}
      {syncMessage && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-medium animate-fadeIn ${
          syncMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <div className="flex items-center space-x-2.5">
            {syncMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{syncMessage.text}</span>
          </div>
          <button 
            onClick={() => setSyncMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. STATS STRIP RINGKAS (TIDAK MEMAKAN TEMPAT & BERSIH) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Stat 1: Total Rombel */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Rombel</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.totalRombel}</span>
              <span className="text-[11px] text-slate-500 font-medium">Kelas</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">4 Jenjang Pendidikan</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 2: Santri Terdaftar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Santri</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.totalSantri}</span>
              <span className="text-[11px] text-slate-500 font-medium">Santri</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Terdata di perlombaan</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 3: Rombel Putra */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Rombel Putra</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-blue-900">{stats.putraRombel}</span>
              <span className="text-[11px] text-blue-700 font-medium">Kelas Pa</span>
            </div>
            <span className="text-[10px] text-blue-600 font-medium mt-0.5 block">{stats.santriPutra} Santri Putra</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
            <User className="w-5 h-5 text-blue-700" />
          </div>
        </div>

        {/* Stat 4: Rombel Putri */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">Rombel Putri</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-rose-900">{stats.putriRombel}</span>
              <span className="text-[11px] text-rose-700 font-medium">Kelas Pi</span>
            </div>
            <span className="text-[10px] text-rose-600 font-medium mt-0.5 block">{stats.santriPutri} Santri Putri</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100">
            <User className="w-5 h-5 text-rose-700" />
          </div>
        </div>

      </div>

      {/* 3. TOOLBAR PENCARIAN & FILTER TERINTEGRASI */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Baris 1: Filter Tab Jenjang */}
        <div className="border-b border-slate-100 px-4 sm:px-6 pt-3.5 pb-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
            {tabPills.map((tab) => {
              const isActive = filterTingkat === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterTingkat(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-emerald-950/50 text-emerald-100' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Gender Segmented Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
            <button
              onClick={() => setFilterGender('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterGender === 'ALL'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterGender('L')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                filterGender === 'L'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Putra ({stats.putraRombel})</span>
            </button>
            <button
              onClick={() => setFilterGender('P')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                filterGender === 'P'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Putri ({stats.putriRombel})</span>
            </button>
          </div>

        </div>

        {/* Baris 2: Search Input & View Toggle */}
        <div className="p-4 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari rombel (contoh: Sifir A Putra, Alfiyah, dll)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 bg-slate-50/50 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-slate-500">
              Menampilkan <strong className="text-slate-800">{filteredRombel.length}</strong> kelas terfilter
            </span>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Tampilan Kartu Rombel"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden md:inline text-[11px]">Kartu</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Tampilan Tabel Rinci"
              >
                <List className="w-4 h-4" />
                <span className="hidden md:inline text-[11px]">Tabel</span>
              </button>
            </div>
          </div>

        </div>

        {/* 4A. VIEW MODE: KARTU ROMBEL SPASIOUS (TIDAK SEMPIT, LEGA & RAPI) */}
        {viewMode === 'cards' && (
          <div className="p-4 sm:p-6 bg-slate-50/40 space-y-8">
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
                  <div key={tingkat.id} className="space-y-4">
                    
                    {/* Header Jenjang Full Width */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                              {tingkat.name}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {classes.length} Rombel
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{tingkat.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${theme.badgeBg}`}>
                          {totalSantriTingkat} Santri Terdaftar
                        </span>
                        <button
                          onClick={() => openAddModal(tingkat.id)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-emerald-800 hover:bg-emerald-50 text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah di {tingkat.name.split(' ')[1] || tingkat.name}</span>
                        </button>
                      </div>
                    </div>

                    {/* Responsive Grid Rombel Cards: 1 kol di mobile, 2 di tablet, 3-4 di desktop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                            className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-md group relative ${
                              isPutra 
                                ? 'border-blue-100 hover:border-blue-300' 
                                : isPutri 
                                  ? 'border-rose-100 hover:border-rose-300' 
                                  : 'border-slate-200 hover:border-emerald-300'
                            }`}
                          >
                            {/* Baris Atas: Badge Gender & Aksi */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              
                              {/* Gender Badge */}
                              {isPutra ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200/80">
                                  <User className="w-3 h-3 text-blue-600 shrink-0" />
                                  <span>Santri Putra</span>
                                </span>
                              ) : isPutri ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200/80">
                                  <User className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>Santri Putri</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                                  <BookOpen className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>Tahfidz MHQ</span>
                                </span>
                              )}

                              {/* Action Buttons */}
                              <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openEditModal(tingkat.id, kelasName)}
                                  title="Edit Nama Kelas"
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-800 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget({ tingkatId: tingkat.id, namaKelas: kelasName })}
                                  title="Hapus Kelas"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Nama Kelas */}
                            <div className="my-1.5">
                              <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight group-hover:text-emerald-800 transition-colors">
                                {kelasName}
                              </h4>
                              <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                                {tingkat.name}
                              </span>
                            </div>

                            {/* Baris Bawah: Wali Kelas & Santri Count */}
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                              {/* Info Wali */}
                              <div className="truncate flex items-center space-x-1.5 text-slate-600">
                                <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="text-[11px] font-semibold truncate" title={wali ? wali.nama : 'Belum ditetapkan'}>
                                  {wali ? wali.nama : 'Belum ada wali'}
                                </span>
                              </div>

                              {/* Badge Santri */}
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                                santriInClass > 0
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500'
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

        {/* 4B. VIEW MODE: TABEL LENGKAP SPASIOUS (DENGAN PAGINASI) */}
        {viewMode === 'table' && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-4 px-4 w-14 text-center">No</th>
                    <th className="py-4 px-4">Nama Kelas Rombel</th>
                    <th className="py-4 px-4">Kategori Gender</th>
                    <th className="py-4 px-4">Jenjang Pendidikan</th>
                    <th className="py-4 px-4">Wali Kelas Pengampu</th>
                    <th className="py-4 px-4 text-center">Santri Terdaftar</th>
                    <th className="py-4 px-4 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRombel.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-16 text-center text-slate-400">
                        <div className="max-w-xs mx-auto space-y-2">
                          <School className="w-10 h-10 text-slate-300 mx-auto" />
                          <p className="font-bold text-slate-700 text-sm">Tidak ada rombel ditemukan</p>
                          <p className="text-xs text-slate-400">Coba sesuaikan kata kunci pencarian atau filter jenjang/gender.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRombel.map((item, idx) => {
                      const theme = getTingkatTheme(item.tingkatId);
                      const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                      const isPutra = item.gender === 'L';
                      const isPutri = item.gender === 'P';

                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors group">
                          
                          {/* No */}
                          <td className="py-4 px-4 text-center font-mono text-slate-400 text-xs font-semibold">
                            {rowNumber}
                          </td>

                          {/* Nama Rombel */}
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-800 transition-colors">
                              {item.namaKelas}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Kode: {item.tingkatId}
                            </span>
                          </td>

                          {/* Kategori Gender */}
                          <td className="py-4 px-4">
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
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${theme.badgeBg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${theme.dot}`}></span>
                              {item.tingkatName}
                            </span>
                          </td>

                          {/* Wali Kelas */}
                          <td className="py-4 px-4">
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
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              item.santriCount > 0 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {item.santriCount} Santri
                            </span>
                          </td>

                          {/* Aksi */}
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => openEditModal(item.tingkatId, item.namaKelas)}
                                title="Edit Nama Kelas"
                                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setDeleteTarget({ tingkatId: item.tingkatId, namaKelas: item.namaKelas })}
                                title="Hapus Kelas"
                                className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
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
            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 font-medium flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                <span>
                  Menampilkan <strong className="text-slate-800">{startIndex} - {endIndex}</strong> dari <strong className="text-slate-800">{filteredRombel.length}</strong> rombel
                </span>
                <span className="text-slate-300">•</span>
                <div className="flex items-center space-x-1">
                  <span>Tampilkan:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value={10}>10 data</option>
                    <option value={20}>20 data</option>
                    <option value={50}>50 data</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1 shadow-2xs cursor-pointer"
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
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${
                          isActive
                            ? 'bg-emerald-800 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || filteredRombel.length === 0}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1 shadow-2xs cursor-pointer"
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
                    {modalMode === 'add' ? 'Tambah Kelas Rombel Baru' : 'Edit Nama Kelas Rombel'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalMode === 'add' ? 'Tambahkan sub-kelas baru (Putra / Putri)' : 'Perbarui nama rombel belajar santri'}
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
                  Nama Kelas / Rombel Belajar <span className="text-rose-500">*</span>
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
                  {modalMode === 'add' ? 'Simpan Rombel' : 'Perbarui Rombel'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. MODAL KONFIRMASI HAPUS ROMBEL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />

            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Hapus Kelas Rombel?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Apakah Anda yakin ingin menghapus rombel <strong>"{deleteTarget.namaKelas}"</strong>? Rombel ini tidak akan muncul lagi di opsi formulir pendaftaran.
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
                Ya, Hapus Rombel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
