import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  RefreshCw,
  Phone,
  MessageSquare,
  GraduationCap,
  BookOpen,
  Award,
  Users,
  Layers,
  LayoutGrid,
  List,
  School,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Filter,
  Eye
} from 'lucide-react';
import { 
  getWaliKelasList, 
  fetchWaliKelas,
  saveWaliKelas, 
  deleteWaliKelas, 
  getSubKelasByTingkat,
  getTingkatList
} from '../../shared/services/api';

export default function AdminGuru({ 
  registrations = [], 
  onRefresh, 
  setActiveView,
  setSearchTerm
}) {
  const [guruList, setGuruList] = useState(() => getWaliKelasList());
  const [tingkatList, setTingkatList] = useState(() => getTingkatList());
  const [subKelasData, setSubKelasData] = useState(() => getSubKelasByTingkat());
  const [searchGuru, setSearchGuru] = useState('');
  const [filterTingkat, setFilterTingkat] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination State (Default 25 Data Per Halaman untuk 24 Wali Kelas)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Modal Tambah / Edit State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState(null);
  
  // Form State
  const [namaGuru, setNamaGuru] = useState('');
  const [tingkatGuru, setTingkatGuru] = useState('ula');
  const [kelasGuru, setKelasGuru] = useState('');
  const [customKelas, setCustomKelas] = useState('');
  const [kontakWA, setKontakWA] = useState('');
  const [formError, setFormError] = useState('');

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await fetchWaliKelas();
      if (Array.isArray(fresh) && fresh.length > 0) {
        setGuruList(fresh);
      } else {
        setGuruList(getWaliKelasList());
      }
    } catch (e) {
      setGuruList(getWaliKelasList());
    }
    setTingkatList(getTingkatList());
    setSubKelasData(getSubKelasByTingkat());
    setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setNamaGuru('');
    setTingkatGuru('ula');
    const defaultClasses = subKelasData['ula'] || [];
    setKelasGuru(defaultClasses[0] || '');
    setCustomKelas('');
    setKontakWA('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (guru) => {
    setModalMode('edit');
    setEditingId(guru.id);
    setNamaGuru(guru.nama);
    setTingkatGuru(guru.tingkat || 'ula');
    setKelasGuru(guru.kelas || '');
    setCustomKelas('');
    setKontakWA(guru.kontak || '');
    setFormError('');
    setShowModal(true);
  };

  const handleTingkatChange = (newTingkat) => {
    setTingkatGuru(newTingkat);
    const classes = subKelasData[newTingkat] || [];
    setKelasGuru(classes[0] || '');
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    setFormError('');

    if (!namaGuru.trim()) {
      setFormError('Nama lengkap Ustadz / Ustadzah wajib diisi.');
      return;
    }

    const finalKelas = kelasGuru === 'CUSTOM' ? customKelas.trim() : kelasGuru;
    if (!finalKelas) {
      setFormError('Kelas Diniyah binaan wajib dipilih atau diisi.');
      return;
    }

    const payload = {
      nama: namaGuru.trim(),
      tingkat: tingkatGuru,
      kelas: finalKelas,
      kontak: kontakWA.trim()
    };

    if (modalMode === 'edit') {
      payload.id = editingId;
    }

    const updated = saveWaliKelas(payload);
    setGuruList(updated);
    setShowModal(false);
    if (onRefresh) onRefresh();
  };

  const handleDeleteGuru = () => {
    if (!deleteTarget) return;
    const updated = deleteWaliKelas(deleteTarget.id);
    setGuruList(updated);
    setDeleteTarget(null);
    if (onRefresh) onRefresh();
  };

  const handleSendWA = (guru) => {
    if (!guru.kontak) {
      alert(`Nomor WhatsApp untuk ${guru.nama} belum terdaftar.`);
      return;
    }
    const cleanPhone = guru.kontak.replace(/^0/, '62').replace(/\D/g, '');
    const pesan = encodeURIComponent(
      `Assalamu'alaikum Wr. Wb. Yth. ${guru.nama} (Wali Kelas ${guru.kelas}).\n\n` +
      `Panitia Musabaqah Akhirussanah Pondok Pesantren Al-Falah Putak menyampaikan konfirmasi data santri binaan panjenengan.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${pesan}`, '_blank');
  };

  // Helper Initials untuk Avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const clean = name.replace(/^(Ust\.|Usth\.|K\.H\.|Dr\.)\s*/gi, '').trim();
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || 'U';
  };

  // Helper Badge Jenjang Tingkat
  const getTingkatBadge = (tingkat) => {
    switch (tingkat) {
      case 'ula':
        return {
          label: 'Tingkat Ula',
          subLabel: 'Sifir & Jurumiyah',
          bg: 'bg-emerald-50',
          text: 'text-emerald-800',
          border: 'border-emerald-200/80',
          dot: 'bg-emerald-600',
          avatarBg: 'bg-emerald-100 text-emerald-800'
        };
      case 'wustho':
        return {
          label: 'Tingkat Wustho',
          subLabel: 'Imrithi & Alfiyah',
          bg: 'bg-sky-50',
          text: 'text-sky-800',
          border: 'border-sky-200/80',
          dot: 'bg-sky-600',
          avatarBg: 'bg-sky-100 text-sky-800'
        };
      case 'mhq_juz':
        return {
          label: 'Tingkat MHQ',
          subLabel: 'Tahfidz Qur\'an',
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          border: 'border-amber-200/80',
          dot: 'bg-amber-600',
          avatarBg: 'bg-amber-100 text-amber-800'
        };
      default:
        return {
          label: tingkat || 'Umum',
          subLabel: '',
          bg: 'bg-slate-50',
          text: 'text-slate-800',
          border: 'border-slate-200/80',
          dot: 'bg-slate-500',
          avatarBg: 'bg-slate-100 text-slate-800'
        };
    }
  };

  // Metrik Statistik Cepat
  const stats = useMemo(() => {
    const ulaGurus = guruList.filter(g => g.tingkat === 'ula');
    const wusthoGurus = guruList.filter(g => g.tingkat === 'wustho');
    const mhqGurus = guruList.filter(g => g.tingkat === 'mhq_juz');

    const countSantriByTingkat = (tKey) => {
      const tLower = tKey.toLowerCase();
      return registrations.filter(r => (r.Tingkat || '').toLowerCase().includes(tLower)).length;
    };

    return {
      total: guruList.length,
      ula: {
        count: ulaGurus.length,
        santri: countSantriByTingkat('ula')
      },
      wustho: {
        count: wusthoGurus.length,
        santri: countSantriByTingkat('wustho')
      },
      mhq: {
        count: mhqGurus.length,
        santri: countSantriByTingkat('mhq')
      }
    };
  }, [guruList, registrations]);

  // Filter Data Guru
  const filteredGuru = useMemo(() => {
    return guruList.filter(guru => {
      if (searchGuru) {
        const q = searchGuru.toLowerCase();
        const match = (
          (guru.nama || '').toLowerCase().includes(q) ||
          (guru.kelas || '').toLowerCase().includes(q) ||
          (guru.kontak || '').includes(q)
        );
        if (!match) return false;
      }

      if (filterTingkat !== 'ALL') {
        if (guru.tingkat !== filterTingkat) return false;
      }

      return true;
    });
  }, [guruList, searchGuru, filterTingkat]);

  // Reset halaman ke 1 saat pencarian atau filter jenjang berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchGuru, filterTingkat, itemsPerPage]);

  // Hitung total halaman & data yang ditampilkan
  const totalPages = Math.max(1, Math.ceil(filteredGuru.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedGuru = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredGuru.slice(start, start + itemsPerPage);
  }, [filteredGuru, currentPage, itemsPerPage]);

  const startIndex = filteredGuru.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredGuru.length);

  // Tab Navigation List
  const tabPills = [
    { id: 'ALL', label: 'Semua Jenjang', count: guruList.length },
    { id: 'ula', label: 'Tingkat Ula', count: stats.ula.count },
    { id: 'wustho', label: 'Tingkat Wustho', count: stats.wustho.count },
    { id: 'mhq_juz', label: 'Tingkat MHQ', count: stats.mhq.count }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/70 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Data Guru & Wali Kelas</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                {guruList.length} Wali Kelas
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola master data asatidz, Kelas Diniyah binaan, dan pantau santri bimbingan di Musabaqah Akhirussanah.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          
          {/* View Mode Toggle */}
          <div className="p-1 bg-slate-100 rounded-2xl flex items-center border border-slate-200/70">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Tampilan Grid Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Tambah Wali Kelas</span>
          </button>

          <button
            onClick={loadData}
            title="Segarkan Data"
            className="p-2.5 rounded-2xl border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. STATISTIC METRIC CARDS (SESUAI REFERENSI DESAIN) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card Total */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center space-x-3.5 group">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
              Total Wali Kelas
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight block mt-1">
              {stats.total}
            </span>
            <span className="text-[10.5px] font-semibold text-blue-600 block mt-0.5">
              Semua jenjang aktif
            </span>
          </div>
        </div>

        {/* Card Ula */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center space-x-3.5 group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
              Tingkat Ula
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight block mt-1">
              {stats.ula.count} <span className="text-xs font-normal text-slate-400">Guru</span>
            </span>
            <span className="text-[10.5px] font-semibold text-emerald-600 block mt-0.5">
              {stats.ula.santri} Santri Terdaftar
            </span>
          </div>
        </div>

        {/* Card Wustho */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center space-x-3.5 group">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
              Tingkat Wustho
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight block mt-1">
              {stats.wustho.count} <span className="text-xs font-normal text-slate-400">Guru</span>
            </span>
            <span className="text-[10.5px] font-semibold text-purple-600 block mt-0.5">
              {stats.wustho.santri} Santri Terdaftar
            </span>
          </div>
        </div>

        {/* Card MHQ */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center space-x-3.5 group">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100/70 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Award className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block leading-none">
              Cabang MHQ
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-tight block mt-1">
              {stats.mhq.count} <span className="text-xs font-normal text-slate-400">Kategori</span>
            </span>
            <span className="text-[10.5px] font-semibold text-amber-600 block mt-0.5">
              {stats.mhq.santri} Santri Terdaftar
            </span>
          </div>
        </div>

      </div>

      {/* 3. MAIN CONTENT CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Jenjang Pill Tabs Bar */}
        <div className="border-b border-slate-100 px-4 sm:px-6 pt-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-3 w-full sm:w-auto scrollbar-none">
            {tabPills.map((tab) => {
              const isActive = filterTingkat === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterTingkat(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center space-x-2 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-emerald-950/40 text-emerald-100' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Active Filter Indicator */}
          {filterTingkat !== 'ALL' && (
            <button
              onClick={() => setFilterTingkat('ALL')}
              className="pb-3 text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center space-x-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Jenjang</span>
            </button>
          )}
        </div>

        {/* Search & Tool Bar */}
        <div className="p-4 sm:px-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama Ustadz / Ustadzah, kelas, nomor kontak..."
              value={searchGuru}
              onChange={(e) => setSearchGuru(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 bg-slate-50/50 focus:bg-white transition-all"
            />
            {searchGuru && (
              <button
                onClick={() => setSearchGuru('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500 w-full sm:w-auto justify-end">
            <span>Menampilkan <strong>{startIndex} - {endIndex}</strong> dari <strong>{filteredGuru.length}</strong> wali kelas (Hal. {currentPage}/{totalPages})</span>
          </div>
        </div>

        {/* 4A. VIEW MODE: TABEL */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Nama Ustadz / Ustadzah</th>
                  <th className="py-3.5 px-4">Jenjang Binaan</th>
                  <th className="py-3.5 px-4">Kelas yang Diampu</th>
                  <th className="py-3.5 px-4 text-center">Santri Binaan</th>
                  <th className="py-3.5 px-4 text-center w-36">Aksi Panitia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGuru.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <UserCheck className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-700 text-sm">Tidak ada wali kelas ditemukan</p>
                        <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau ganti filter jenjang tingkat.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedGuru.map((guru, idx) => {
                    const santriList = registrations.filter(r => 
                      ((r.Wali_Kelas || '').toLowerCase().trim() === (guru.nama || '').toLowerCase().trim()) ||
                      ((r.Kelas_Kategori || '').toLowerCase().trim() === (guru.kelas || '').toLowerCase().trim())
                    );
                    const santriCount = santriList.length;
                    const isLengkap = santriCount >= 10;
                    const isSebagian = santriCount > 0 && santriCount < 10;

                    const badge = getTingkatBadge(guru.tingkat);
                    const initials = getInitials(guru.nama);
                    const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;

                    return (
                      <tr key={guru.id || idx} className="hover:bg-slate-50/80 transition-colors group">
                        
                        {/* No */}
                        <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-xs font-semibold">
                          {rowNumber}
                        </td>

                        {/* Nama Wali Kelas & Kontak */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-9 h-9 rounded-xl ${badge.avatarBg} font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200/50 shadow-2xs`}>
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs group-hover:text-emerald-800 transition-colors">
                                {guru.nama}
                              </div>
                              {guru.kontak ? (
                                <button
                                  onClick={() => handleSendWA(guru)}
                                  className="text-[11px] text-emerald-700 hover:text-emerald-900 hover:underline font-mono flex items-center space-x-1 mt-0.5 cursor-pointer"
                                  title="Kirim pesan WhatsApp"
                                >
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>{guru.kontak}</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic block mt-0.5">
                                  Belum ada nomor WA
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Jenjang Tingkat */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${badge.dot}`}></span>
                            {badge.label}
                          </span>
                        </td>

                        {/* Kelas yang Diampu */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 text-xs flex items-center space-x-1.5">
                            <School className="w-3.5 h-3.5 text-slate-400" />
                            <span>{guru.kelas}</span>
                          </div>
                        </td>

                        {/* Santri Masuk */}
                        <td className="py-3.5 px-4 text-center">
                          {isLengkap ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Lengkap ({santriCount})
                            </span>
                          ) : isSebagian ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Sebagian ({santriCount})
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 animate-pulse">
                              Belum Ada (0)
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            
                            {/* Tombol Lihat Santri */}
                            <button
                              onClick={() => {
                                if (setSearchTerm) setSearchTerm(guru.kelas || guru.nama);
                                if (setActiveView) setActiveView('santri');
                              }}
                              title={`Lihat delegasi santri ${guru.kelas}`}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {guru.kontak && (
                              <button
                                onClick={() => handleSendWA(guru)}
                                title="Chat WhatsApp"
                                className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => openEditModal(guru)}
                              title="Edit Data Guru"
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeleteTarget(guru)}
                              title="Hapus Data Guru"
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
        ) : (
          /* 4B. VIEW MODE: GRID KARTU */
          <div className="p-4 sm:p-6 bg-slate-50/30">
            {filteredGuru.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 text-sm">Tidak ada wali kelas ditemukan</p>
                <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau ganti filter jenjang tingkat.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedGuru.map((guru, idx) => {
                  const santriList = registrations.filter(r => 
                    ((r.Wali_Kelas || '').toLowerCase().trim() === (guru.nama || '').toLowerCase().trim()) ||
                    ((r.Kelas_Kategori || '').toLowerCase().trim() === (guru.kelas || '').toLowerCase().trim())
                  );
                  const santriCount = santriList.length;
                  const isLengkap = santriCount >= 10;
                  const isSebagian = santriCount > 0 && santriCount < 10;

                  const badge = getTingkatBadge(guru.tingkat);
                  const initials = getInitials(guru.nama);

                  return (
                    <div 
                      key={guru.id || idx}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Top Card: Avatar + Level Badge */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className={`w-11 h-11 rounded-2xl ${badge.avatarBg} font-black text-sm flex items-center justify-center border border-slate-200/60 shadow-2xs`}>
                            {initials}
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1 ${badge.dot}`}></span>
                            {badge.label}
                          </span>
                        </div>

                        {/* Name & Class */}
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800 transition-colors line-clamp-1">
                          {guru.nama}
                        </h4>

                        <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-medium mt-1">
                          <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Kelas: <strong>{guru.kelas}</strong></span>
                        </div>

                        {/* Santri Count Box */}
                        <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-medium">Santri Bimbingan:</span>
                          <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                            isLengkap 
                              ? 'bg-emerald-800 text-white' 
                              : isSebagian 
                              ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {isLengkap ? `Lengkap (${santriCount})` : isSebagian ? `Sebagian (${santriCount})` : 'Belum Ada (0)'}
                          </span>
                        </div>
                      </div>

                      {/* Card Bottom: Phone & Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        {guru.kontak ? (
                          <button
                            onClick={() => handleSendWA(guru)}
                            className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium flex items-center space-x-1 cursor-pointer"
                            title="Chat WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Hubungi WA</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Tanpa WA</span>
                        )}

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              if (setSearchTerm) setSearchTerm(guru.kelas || guru.nama);
                              if (setActiveView) setActiveView('santri');
                            }}
                            title={`Lihat santri delegasi ${guru.kelas}`}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(guru)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                            title="Edit Data Guru"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(guru)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="Hapus Data Guru"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4C. PAGINATION FOOTER */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium text-center sm:text-left flex flex-wrap items-center gap-2">
            <span>
              Menampilkan <strong className="text-slate-800">{startIndex} - {endIndex}</strong> dari total <strong className="text-slate-800">{filteredGuru.length}</strong> wali kelas
            </span>
            <div className="flex items-center space-x-1.5 ml-1">
              <span className="text-[11px] text-slate-400 font-medium">Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-2 py-0.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white outline-none cursor-pointer hover:border-slate-300"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={Math.max(1000, filteredGuru.length)}>Semua ({filteredGuru.length})</option>
              </select>
              <span className="text-[11px] text-slate-400 font-medium">/ halaman</span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Tombol Sebelumnya */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1 shadow-2xs cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            {/* Nomor Halaman */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Sembunyikan halaman terlalu jauh jika totalPages > 6
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

            {/* Tombol Berikutnya */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || filteredGuru.length === 0}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1 shadow-2xs cursor-pointer"
              title="Halaman Berikutnya"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 5. MODAL TAMBAH / EDIT GURU (MODERN) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800" />

            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
                  {modalMode === 'add' ? <Plus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {modalMode === 'add' ? 'Tambah Wali Kelas' : 'Edit Data Wali Kelas'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalMode === 'add' ? 'Masukkan data asatidz pembina santri' : 'Perbarui informasi wali kelas'}
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

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              
              {/* Nama Guru */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                  Nama Lengkap Ustadz / Ustadzah <span className="text-rose-500">*</span>:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-700">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: Ust. Ahmad Fauzan"
                    value={namaGuru}
                    onChange={(e) => setNamaGuru(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800"
                    required
                  />
                </div>
              </div>

              {/* Jenjang Tingkat */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                  Jenjang Tingkat Binaan <span className="text-rose-500">*</span>:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-700">
                    <Layers className="w-4 h-4" />
                  </div>
                  <select
                    value={tingkatGuru}
                    onChange={(e) => handleTingkatChange(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 bg-white cursor-pointer"
                  >
                    {tingkatList.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kelas yang Diampu */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                  Kelas Diniyah yang Diampu <span className="text-rose-500">*</span>:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-700">
                    <School className="w-4 h-4" />
                  </div>
                  <select
                    value={kelasGuru}
                    onChange={(e) => setKelasGuru(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 outline-none focus:border-emerald-800 focus:ring-1 focus:ring-emerald-800 bg-white cursor-pointer"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {(subKelasData[tingkatGuru] || []).map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                    <option value="CUSTOM">+ Tulis Kelas Lainnya</option>
                  </select>
                </div>
              </div>

              {kelasGuru === 'CUSTOM' && (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                    Nama Kelas Baru:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Alfiyah Tsalits"
                    value={customKelas}
                    onChange={(e) => setCustomKelas(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 outline-none focus:border-emerald-800"
                  />
                </div>
              )}

              {/* Nomor WhatsApp */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                  Nomor WhatsApp (Opsional):
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-700">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={kontakWA}
                    onChange={(e) => setKontakWA(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-slate-800 outline-none focus:border-emerald-800"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {modalMode === 'add' ? 'Simpan Wali Kelas' : 'Simpan Perubahan'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. MODAL KONFIRMASI HAPUS GURU (MODERN) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center relative overflow-hidden">
            {/* Top red accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-600" />

            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100 shadow-2xs">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Hapus Data Wali Kelas?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus data <strong>{deleteTarget.nama}</strong> ({deleteTarget.kelas})? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteGuru}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
