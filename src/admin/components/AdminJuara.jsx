import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  Printer, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  X, 
  RefreshCw,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronLeft,
  School,
  Users,
  Layers,
  Building2,
  AlertCircle,
  Medal,
  Clock
} from 'lucide-react';
import { 
  CABANG_LOMBA_LIST, 
  TINGKAT_LIST, 
  SKEMA_POIN_JUARA,
  getGenderFromKelas 
} from '../../shared/data/competitions';
import { 
  getJuaraList, 
  fetchJuaraLomba,
  saveJuara, 
  deleteJuara, 
  calculateKlasemenJuara,
  getSubKelasByTingkat 
} from '../../shared/services/api';

export default function AdminJuara({ registrations = [], onRefresh }) {
  // Mode View: 'klasemen' (Papan Peringkat Juara Umum) | 'cabang' (Daftar & Input Juara per Cabang)
  const [viewMode, setViewMode] = useState('klasemen');
  const [filterTingkat, setFilterTingkat] = useState('ALL'); // 'ALL' | 'ula' | 'wustho' | 'ulya'
  const [filterGender, setFilterGender] = useState('ALL'); // 'ALL' | 'L' | 'P'
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination State (5 Item Per Halaman sesuai standar Admin)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Data Juara Lokal
  const [juaraData, setJuaraData] = useState(() => getJuaraList());

  // State Modal Input Juara
  const [showModal, setShowModal] = useState(false);
  const [selectedCabangKey, setSelectedCabangKey] = useState('');
  const [selectedCabangName, setSelectedCabangName] = useState('');
  const [selectedTingkat, setSelectedTingkat] = useState('wustho');
  const [j1SantriId, setJ1SantriId] = useState('');
  const [j2SantriId, setJ2SantriId] = useState('');
  const [j3SantriId, setJ3SantriId] = useState('');
  const [modalError, setModalError] = useState('');

  // Delete Confirm Modal
  const [deleteTargetKey, setDeleteTargetKey] = useState(null);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const fresh = await fetchJuaraLomba();
      if (Array.isArray(fresh)) {
        setJuaraData(fresh);
      } else {
        setJuaraData(getJuaraList());
      }
    } catch (e) {
      setJuaraData(getJuaraList());
    }
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 300);
  };

  // Reset pagination saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filterTingkat, filterGender, searchQuery, viewMode]);

  // Daftar seluruh kombinasi cabang lomba & tingkat yang dibuka
  const daftarKompetisi = useMemo(() => {
    const list = [];
    (CABANG_LOMBA_LIST || []).forEach(c => {
      (c.tingkatAllowed || ['ula', 'wustho', 'ulya']).forEach(tId => {
        if (tId === 'mhq_juz') return;
        const key = `${c.name}__${tId}`;
        const existing = juaraData[key];
        list.push({
          key,
          cabangName: c.name,
          cabangFullName: c.fullName || c.name,
          tingkatId: tId,
          isDecided: !!existing,
          juara: existing || null
        });
      });
    });
    return list;
  }, [juaraData]);

  // Hitung Klasemen Juara Umum Real-Time
  const rawKlasemen = useMemo(() => {
    return calculateKlasemenJuara(filterTingkat);
  }, [juaraData, filterTingkat]);

  // Filter Klasemen berdasarkan Gender dan Pencarian
  const filteredKlasemen = useMemo(() => {
    return rawKlasemen.filter(item => {
      const matchGender = filterGender === 'ALL' || item.gender === filterGender;
      const matchSearch = searchQuery.trim() === '' || 
        item.namaKelas.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGender && matchSearch;
    });
  }, [rawKlasemen, filterGender, searchQuery]);

  // Filter Daftar Cabang untuk Mode 'cabang'
  const filteredKompetisi = useMemo(() => {
    return daftarKompetisi.filter(item => {
      const matchTingkat = filterTingkat === 'ALL' || item.tingkatId === filterTingkat;
      const matchSearch = searchQuery.trim() === '' || 
        item.cabangFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.cabangName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTingkat && matchSearch;
    });
  }, [daftarKompetisi, filterTingkat, searchQuery]);

  // Hitung Pagination
  const activeDataList = viewMode === 'klasemen' ? filteredKlasemen : filteredKompetisi;
  const totalPages = Math.max(1, Math.ceil(activeDataList.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return activeDataList.slice(start, start + itemsPerPage);
  }, [activeDataList, currentPage, itemsPerPage]);

  const startIndex = activeDataList.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, activeDataList.length);

  // Metrik Statistik 4 Kartu (Identik dengan AdminGuru & AdminTingkatKelas)
  const stats = useMemo(() => {
    const totalCabang = daftarKompetisi.length;
    const sudahJuara = daftarKompetisi.filter(c => c.isDecided).length;
    const totalPoinDiberikan = rawKlasemen.reduce((acc, k) => acc + k.totalPoin, 0);
    const topClass = rawKlasemen.length > 0 && rawKlasemen[0].totalPoin > 0 ? rawKlasemen[0] : null;

    return {
      totalCabang,
      sudahJuara,
      totalPoinDiberikan,
      topClass
    };
  }, [daftarKompetisi, rawKlasemen]);

  // Daftar peserta terdaftar untuk cabang yang sedang dipilih di Modal
  const eligiblePeserta = useMemo(() => {
    if (!selectedCabangName || !selectedTingkat) return [];
    return registrations.filter(r => {
      const matchCabang = r.Cabang_Lomba === selectedCabangName || (r.Cabang_Lomba && r.Cabang_Lomba.includes(selectedCabangName));
      const matchTingkat = (r.Tingkat || '').toLowerCase().includes(selectedTingkat.toLowerCase());
      return matchCabang && matchTingkat;
    });
  }, [registrations, selectedCabangName, selectedTingkat]);

  // Buka Modal Penetapan Juara
  const handleOpenModal = (kompetisi) => {
    setSelectedCabangKey(kompetisi.key);
    setSelectedCabangName(kompetisi.cabangName);
    setSelectedTingkat(kompetisi.tingkatId);
    setModalError('');

    const existing = juaraData[kompetisi.key];
    if (existing) {
      setJ1SantriId(existing.juara1?.santriId || '');
      setJ2SantriId(existing.juara2?.santriId || '');
      setJ3SantriId(existing.juara3?.santriId || '');
    } else {
      setJ1SantriId('');
      setJ2SantriId('');
      setJ3SantriId('');
    }
    setShowModal(true);
  };

  // Simpan Penetapan Juara
  const handleSaveModal = (e) => {
    e.preventDefault();
    setModalError('');

    if (!j1SantriId && !j2SantriId && !j3SantriId) {
      setModalError('Harap tentukan minimal salah satu pemenang (Juara 1, 2, atau 3).');
      return;
    }

    const chosenIds = [j1SantriId, j2SantriId, j3SantriId].filter(Boolean);
    const uniqueIds = new Set(chosenIds);
    if (chosenIds.length !== uniqueIds.size) {
      setModalError('Satu orang santri tidak dapat dipilih di lebih dari satu peringkat juara pada cabang yang sama.');
      return;
    }

    const getSantriDetail = (id) => {
      if (!id) return null;
      const s = eligiblePeserta.find(item => item.ID_Pendaftaran === id);
      if (!s) return null;
      return {
        santriId: s.ID_Pendaftaran,
        nama: s.Nama_Lengkap,
        kelas: s.Kelas_Kategori,
        jenisKelamin: s.Jenis_Kelamin
      };
    };

    const payload = {
      cabangLomba: selectedCabangName,
      tingkat: selectedTingkat,
      juara1: getSantriDetail(j1SantriId),
      juara2: getSantriDetail(j2SantriId),
      juara3: getSantriDetail(j3SantriId)
    };

    saveJuara(selectedCabangKey, payload);
    loadData();
    setShowModal(false);
  };

  // Hapus Juara
  const handleConfirmDelete = () => {
    if (deleteTargetKey) {
      deleteJuara(deleteTargetKey);
      setDeleteTargetKey(null);
      loadData();
    }
  };

  // Tab Navigation Pills (Identik dengan AdminGuru & AdminTingkatKelas)
  const tabPills = [
    { id: 'ALL', label: 'Semua Tingkat', count: rawKlasemen.length },
    { id: 'ula', label: 'Tingkat Ula', count: rawKlasemen.filter(k => k.tingkatId === 'ula').length },
    { id: 'wustho', label: 'Tingkat Wustho', count: rawKlasemen.filter(k => k.tingkatId === 'wustho').length },
    { id: 'ulya', label: 'Tingkat Ulya', count: rawKlasemen.filter(k => k.tingkatId === 'ulya').length }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER BANNER (Identik 100% dengan AdminGuru & AdminTingkatKelas) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        {/* Subtle accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800" />

        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-sm shrink-0">
            <Trophy className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Rekapitulasi Juara & Klasemen Juara Umum</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                Skema A (5-3-1 Poin)
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Penetapan juara cabang lomba dan akumulasi skor per Kelas Diniyah untuk penentuan Juara Umum Musabaqah.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          
          {/* View Mode Toggle: Papan Klasemen vs Input Juara */}
          <div className="p-1 bg-slate-100 rounded-xl flex items-center border border-slate-200/70">
            <button
              onClick={() => setViewMode('klasemen')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'klasemen'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Papan Klasemen Juara Umum"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Klasemen Kelas</span>
            </button>
            <button
              onClick={() => setViewMode('cabang')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'cabang'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Input Juara per Cabang"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Input Juara</span>
            </button>
          </div>

          {/* Tombol Cetak Berita Acara */}
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Cetak Berita Acara Pengumuman Juara"
          >
            <Printer className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">Cetak Rekap</span>
          </button>

          {/* Tombol Refresh */}
          <button
            onClick={loadData}
            title="Segarkan Data"
            className="p-2.5 rounded-xl border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-800' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. STATISTIC METRIC CARDS (4 Kartu Elegan Identik dengan Halaman Admin Lainnya) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Card 1: Total Cabang Lomba */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Cabang Diperlombakan
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {stats.totalCabang}
            </span>
            <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1 mt-0.5">
              <span>Ula, Wustho, Ulya</span>
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100/80">
            <Trophy className="w-5 h-5 text-emerald-800" />
          </div>
        </div>

        {/* Card 2: Status Penetapan Juara */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Juara Ditetapkan
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {stats.sudahJuara} <span className="text-xs font-semibold text-slate-400">/ {stats.totalCabang}</span>
            </span>
            <span className="text-[11px] font-medium text-teal-700 mt-0.5 block">
              {stats.totalCabang - stats.sudahJuara} cabang belum dinilai
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100/80">
            <CheckCircle2 className="w-5 h-5 text-teal-800" />
          </div>
        </div>

        {/* Card 3: Total Poin Terkumpul */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Poin Terdistribusi
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {stats.totalPoinDiberikan} <span className="text-xs font-semibold text-slate-400">Poin</span>
            </span>
            <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
              Skema 5 - 3 - 1 Poin
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-800 flex items-center justify-center border border-sky-100/80">
            <Award className="w-5 h-5 text-sky-800" />
          </div>
        </div>

        {/* Card 4: Pemuncak Klasemen Sementara */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Juara Umum Sementara
            </span>
            <span className="text-lg font-black text-slate-900 mt-1 block truncate" title={stats.topClass?.namaKelas || 'Belum Ada'}>
              {stats.topClass ? stats.topClass.namaKelas : 'Belum Ada'}
            </span>
            <span className="text-[11px] font-bold text-amber-700 mt-0.5 block">
              {stats.topClass ? `${stats.topClass.totalPoin} Poin (Juara 1: ${stats.topClass.juara1})` : 'Menunggu input juara'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100/80 shrink-0">
            <Sparkles className="w-5 h-5 text-amber-700" />
          </div>
        </div>

      </div>

      {/* 3. TAB PILLS JENJANG TINGKAT (Identik dengan AdminGuru & AdminTingkatKelas) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
        {tabPills.map(tab => {
          const isActive = filterTingkat === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterTingkat(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 cursor-pointer ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                isActive
                  ? 'bg-emerald-900/60 text-emerald-100'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. MAIN DATA CONTAINER (Identik Card Putih rounded-3xl) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Table / Grid Toolbar Filter & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-72">
              <input
                type="text"
                placeholder={viewMode === 'klasemen' ? "Cari nama Kelas Diniyah..." : "Cari mata perlombaan..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200/90 bg-slate-50/50 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 outline-none transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Gender Kelas (Hanya untuk mode Klasemen) */}
            {viewMode === 'klasemen' && (
              <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs border border-slate-200/70">
                {[
                  { id: 'ALL', label: 'Semua Kelas' },
                  { id: 'L', label: 'Putra' },
                  { id: 'P', label: 'Putri' }
                ].map(g => (
                  <button
                    key={g.id}
                    onClick={() => setFilterGender(g.id)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      filterGender === g.id
                        ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium shrink-0">
            {viewMode === 'klasemen' ? (
              <span>Menampilkan <strong className="text-slate-800">{filteredKlasemen.length}</strong> Kelas Diniyah</span>
            ) : (
              <span>Menampilkan <strong className="text-slate-800">{filteredKompetisi.length}</strong> mata lomba</span>
            )}
          </div>
        </div>

        {/* ================= VIEW MODE 1: PAPAN KLASEMEN JUARA UMUM KELAS ================= */}
        {viewMode === 'klasemen' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-semibold text-xs">
                  <th className="py-3 px-4 text-center w-14">Rank</th>
                  <th className="py-3 px-4">Kelas Diniyah</th>
                  <th className="py-3 px-4 text-center">Jenjang Tingkat</th>
                  <th className="py-3 px-4 text-center">Kategori</th>
                  <th className="py-3 px-4 text-center text-amber-700" title="Juara 1 (5 Poin)">Juara 1</th>
                  <th className="py-3 px-4 text-center text-slate-600" title="Juara 2 (3 Poin)">Juara 2</th>
                  <th className="py-3 px-4 text-center text-amber-900" title="Juara 3 (1 Poin)">Juara 3</th>
                  <th className="py-3 px-5 text-center text-emerald-800 font-black w-28">Total Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400 text-xs">
                      Tidak ada data kelas yang cocok dengan filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item) => {
                    const isChampion = item.rank === 1 && item.totalPoin > 0;
                    return (
                      <tr 
                        key={item.namaKelas} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isChampion ? 'bg-amber-50/60 font-semibold' : ''
                        }`}
                      >
                        {/* Rank Badge */}
                        <td className="py-3.5 px-4 text-center">
                          {isChampion ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xs shadow-xs">
                              1
                            </span>
                          ) : item.rank === 2 && item.totalPoin > 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-200 text-slate-800 font-bold text-xs">
                              2
                            </span>
                          ) : item.rank === 3 && item.totalPoin > 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-700/20 text-amber-900 font-bold text-xs">
                              3
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">{item.rank}</span>
                          )}
                        </td>

                        {/* Kelas Diniyah */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">{item.namaKelas}</span>
                            {isChampion && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-2xs">
                                JUARA UMUM
                              </span>
                            )}
                          </div>
                          {item.daftarJuara.length > 0 && (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {item.daftarJuara.map(dj => `${dj.cabangLomba} (J${dj.juaraRank})`).join(', ')}
                            </div>
                          )}
                        </td>

                        {/* Tingkat */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-700">
                            {item.tingkatId?.toUpperCase()}
                          </span>
                        </td>

                        {/* Gender */}
                        <td className="py-3.5 px-4 text-center">
                          {item.gender === 'P' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-800 border border-rose-200/80">
                              Putri
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-sky-50 text-sky-800 border border-sky-200/80">
                              Putra
                            </span>
                          )}
                        </td>

                        {/* Medali Juara 1 */}
                        <td className="py-3.5 px-4 text-center font-bold text-amber-700">
                          {item.juara1 > 0 ? `${item.juara1} (×5)` : '-'}
                        </td>

                        {/* Medali Juara 2 */}
                        <td className="py-3.5 px-4 text-center font-bold text-slate-600">
                          {item.juara2 > 0 ? `${item.juara2} (×3)` : '-'}
                        </td>

                        {/* Medali Juara 3 */}
                        <td className="py-3.5 px-4 text-center font-bold text-amber-900">
                          {item.juara3 > 0 ? `${item.juara3} (×1)` : '-'}
                        </td>

                        {/* Total Poin */}
                        <td className="py-3.5 px-5 text-center">
                          <span className={`text-base font-black ${
                            item.totalPoin > 0 ? 'text-emerald-800' : 'text-slate-400'
                          }`}>
                            {item.totalPoin}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= VIEW MODE 2: INPUT & KELOLA JUARA PER CABANG ================= */}
        {viewMode === 'cabang' && (
          <div className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada cabang lomba yang cocok dengan filter yang dipilih.
              </div>
            ) : (
              paginatedData.map((kompetisi) => {
                const isDecided = kompetisi.isDecided;
                const juara = kompetisi.juara;

                return (
                  <div 
                    key={kompetisi.key} 
                    className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                          TINGKAT {kompetisi.tingkatId.toUpperCase()}
                        </span>
                        {isDecided ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Pemenang Ditetapkan</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Belum Ditetapkan
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">
                        {kompetisi.cabangFullName}
                      </h4>

                      {/* Rincian Pemenang */}
                      {isDecided && juara ? (
                        <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                          {juara.juara1 && (
                            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-950">
                              <span className="font-bold text-amber-800">Juara 1:</span>
                              <span className="font-extrabold">{juara.juara1.nama}</span>
                              <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-amber-300 font-semibold">
                                {juara.juara1.kelas}
                              </span>
                            </div>
                          )}
                          {juara.juara2 && (
                            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800">
                              <span className="font-bold text-slate-600">Juara 2:</span>
                              <span className="font-extrabold">{juara.juara2.nama}</span>
                              <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-300 font-semibold">
                                {juara.juara2.kelas}
                              </span>
                            </div>
                          )}
                          {juara.juara3 && (
                            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-50/60 border border-amber-700/30 text-amber-950">
                              <span className="font-bold text-amber-900">Juara 3:</span>
                              <span className="font-extrabold">{juara.juara3.nama}</span>
                              <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-amber-600/40 font-semibold">
                                {juara.juara3.kelas}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">
                          Pemenang belum dimasukkan. Klik tombol "Tetapkan Juara" untuk memilih santri dari daftar peserta.
                        </p>
                      )}
                    </div>

                    {/* Action Buttons per Cabang */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleOpenModal(kompetisi)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 ${
                          isDecided
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-xs'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isDecided ? 'Ubah Juara' : 'Tetapkan Juara'}</span>
                      </button>

                      {isDecided && (
                        <button
                          onClick={() => setDeleteTargetKey(kompetisi.key)}
                          className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Penetapan Juara"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 5. STANDARDIZED PAGINATION BAR (Identik dengan AdminGuru & AdminTingkatKelas) */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan <strong className="text-slate-800">{startIndex}</strong> - <strong className="text-slate-800">{endIndex}</strong> dari <strong className="text-slate-800">{activeDataList.length}</strong> data
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  currentPage === page
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ================= MODAL PENETAPAN JUARA (Identik rounded-3xl Admin) ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
            
            {/* Modal Header */}
            <div className="bg-emerald-800 text-white p-5 flex items-center justify-between relative overflow-hidden">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-900 text-emerald-200 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Penetapan Juara Perlombaan
                  </h3>
                  <p className="text-xs text-emerald-200">
                    {selectedCabangName} • Tingkat {selectedTingkat.toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <p className="text-xs text-slate-500 leading-relaxed">
                Pilih santri dari daftar peserta terdaftar cabang ini. Skor kejuaraan otomatis disumbangkan ke kelas santri yang bersangkutan.
              </p>

              {/* JUARA 1 (+5 POIN) */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
                <div className="flex items-center justify-between font-bold text-amber-950">
                  <span>Juara 1 (Emas)</span>
                  <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                    +5 Poin Kelas
                  </span>
                </div>
                <select
                  value={j1SantriId}
                  onChange={(e) => setJ1SantriId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                >
                  <option value="">-- Pilih Santri Juara 1 --</option>
                  {eligiblePeserta.map(p => (
                    <option key={p.ID_Pendaftaran} value={p.ID_Pendaftaran}>
                      {p.Nama_Lengkap} ({p.Kelas_Kategori}) - No: {p.Nomor_Urut || p.ID_Pendaftaran}
                    </option>
                  ))}
                </select>
              </div>

              {/* JUARA 2 (+3 POIN) */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-100 border border-slate-200">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Juara 2 (Perak)</span>
                  <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                    +3 Poin Kelas
                  </span>
                </div>
                <select
                  value={j2SantriId}
                  onChange={(e) => setJ2SantriId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                >
                  <option value="">-- Pilih Santri Juara 2 --</option>
                  {eligiblePeserta.map(p => (
                    <option key={p.ID_Pendaftaran} value={p.ID_Pendaftaran}>
                      {p.Nama_Lengkap} ({p.Kelas_Kategori}) - No: {p.Nomor_Urut || p.ID_Pendaftaran}
                    </option>
                  ))}
                </select>
              </div>

              {/* JUARA 3 (+1 POIN) */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50/40 border border-amber-700/20">
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span>Juara 3 (Perunggu)</span>
                  <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                    +1 Poin Kelas
                  </span>
                </div>
                <select
                  value={j3SantriId}
                  onChange={(e) => setJ3SantriId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-700/30 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
                >
                  <option value="">-- Pilih Santri Juara 3 --</option>
                  {eligiblePeserta.map(p => (
                    <option key={p.ID_Pendaftaran} value={p.ID_Pendaftaran}>
                      {p.Nama_Lengkap} ({p.Kelas_Kategori}) - No: {p.Nomor_Urut || p.ID_Pendaftaran}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-semibold text-xs text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-xs cursor-pointer active:scale-95"
                >
                  Simpan Juara
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS ================= */}
      {deleteTargetKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Hapus Penetapan Juara?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Penetapan juara cabang ini akan dihapus dan poin kemenangan kelas terkait akan otomatis ditarik kembali.
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteTargetKey(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
