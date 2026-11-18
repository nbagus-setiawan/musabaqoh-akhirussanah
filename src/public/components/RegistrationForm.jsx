import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UserCheck, 
  GraduationCap, 
  Trophy, 
  User, 
  Phone, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle,
  Info,
  BookOpen,
  X,
  ChevronDown
} from 'lucide-react';
import { 
  MASTER_WALI_KELAS, 
  CABANG_LOMBA_LIST, 
  TINGKAT_LIST, 
  SUB_KELAS_BY_TINGKAT,
  getGenderFromKelas
} from '../../shared/data/competitions';
import { 
  getWaliKelasList, 
  fetchWaliKelas,
  fetchTingkatKelas,
  getSubKelasByTingkat, 
  getTingkatList 
} from '../../shared/services/api';

export default function RegistrationForm({ onSubmitSuccess, initialWaliData = null }) {
  const navigate = useNavigate();

  // Dynamic Master Data dari Local Storage / Service (selaras dengan panel Admin)
  const [waliList, setWaliList] = useState(() => getWaliKelasList());
  const [tingkatList, setTingkatList] = useState(() => getTingkatList());
  const [subKelasData, setSubKelasData] = useState(() => getSubKelasByTingkat());

  useEffect(() => {
    try {
      setWaliList(getWaliKelasList());
      setTingkatList(getTingkatList());
      setSubKelasData(getSubKelasByTingkat());

      // Sinkronkan data guru & rombel terbaru dari Google Sheets jika terhubung
      fetchWaliKelas().then(list => {
        if (Array.isArray(list) && list.length > 0) {
          setWaliList(list);
        }
      }).catch(() => {});

      fetchTingkatKelas().then(grouped => {
        if (grouped && typeof grouped === 'object') {
          setSubKelasData(grouped);
        }
      }).catch(() => {});
    } catch (e) {}
  }, []);

  // State Pemberitahuan: Hanya muncul 1 kali seumur sesi (disimpan di localStorage agar tidak berulang & tidak mengganggu)
  const [showNoticeModal, setShowNoticeModal] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('notice') === '0') return false;
      const acknowledged = localStorage.getItem('alfalah_notice_acknowledged') || sessionStorage.getItem('alfalah_notice_acknowledged');
      return !acknowledged;
    } catch (e) {
      return false;
    }
  });

  // Helper membaca data wali kelas & nomor WA yang tersimpan (dari pendaftaran santri sebelumnya)
  const getInitialWali = () => {
    if (initialWaliData) return initialWaliData;
    try {
      const stored = sessionStorage.getItem('alfalah_saved_wali') || localStorage.getItem('alfalah_saved_wali');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  };

  const initialWali = getInitialWali();

  // State Input Wali Kelas (Ketik Manual + Autocomplete dari Guru Terdaftar)
  const [waliInput, setWaliInput] = useState(() => initialWali?.waliKelas || '');
  const [selectedWaliId, setSelectedWaliId] = useState(() => initialWali?.waliKelasId || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const waliDropdownRef = useRef(null);

  // Auto-close saran ketika mengklik di luar area input
  useEffect(() => {
    function handleClickOutside(event) {
      if (waliDropdownRef.current && !waliDropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Filter saran guru berdasarkan teks yang diketik (search-as-you-type), atau tampilkan semua jika belum diketik
  const query = waliInput.trim().toLowerCase();
  const suggestedWali = Array.isArray(waliList)
    ? (query.length > 0
        ? waliList.filter(w => 
            (w.nama && w.nama.toLowerCase().includes(query)) ||
            (w.kelas && w.kelas.toLowerCase().includes(query))
          )
        : waliList)
    : [];

  // Auto-filled dari Wali Kelas
  const [tingkat, setTingkat] = useState(() => initialWali?.tingkat || ''); // 'ula' | 'wustho' | 'ulya' | 'mhq_juz'
  const [tingkatName, setTingkatName] = useState(() => initialWali?.tingkatName || '');
  const [kelasKategori, setKelasKategori] = useState(() => initialWali?.kelasKategori || '');

  // Pilihan Cabang Lomba (selalu direset kosong untuk setiap santri baru)
  const [cabangLomba, setCabangLomba] = useState('');
  const [subKategoriMHQ, setSubKategoriMHQ] = useState('');

  // Identitas Santri
  const [namaSantri, setNamaSantri] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState(() => {
    if (initialWali?.jenisKelamin) return initialWali.jenisKelamin;
    if (initialWali?.kelasKategori) {
      const autoGen = getGenderFromKelas(initialWali.kelasKategori);
      if (autoGen) return autoGen;
    }
    return 'L';
  });
  const [nomorWA, setNomorWA] = useState(() => initialWali?.nomorWA || '');
  const [catatan, setCatatan] = useState('');

  // State Modal Konfirmasi & Loading
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // State Error Validasi Per Kolom (Tersorot Merah Langsung pada Kolom yang Belum Terisi)
  const [formErrors, setFormErrors] = useState({});

  // Refs untuk Auto-Focus & Auto-Scroll Halus ke Kolom Error Pertama
  const waliInputRef = useRef(null);
  const cabangSelectRef = useRef(null);
  const mhqRef = useRef(null);
  const santriInputRef = useRef(null);
  const waInputRef = useRef(null);

  const handleAcknowledgeNotice = () => {
    setShowNoticeModal(false);
    try {
      localStorage.setItem('alfalah_notice_acknowledged', 'true');
      sessionStorage.setItem('alfalah_notice_acknowledged', 'true');
    } catch (e) {}
  };

  const handleGoToGuidelines = () => {
    setShowNoticeModal(false);
    try {
      localStorage.setItem('alfalah_notice_acknowledged', 'true');
      sessionStorage.setItem('alfalah_notice_acknowledged', 'true');
    } catch (e) {}
    navigate('/syarat-ketentuan');
  };

  // Helper deteksi jenjang tingkat ('ula' | 'wustho' | 'ulya') dari nama rombel kelas
  const getTingkatFromKelas = (namaKelas) => {
    if (!namaKelas) return '';
    for (const [tingkatKey, rombelList] of Object.entries(subKelasData || {})) {
      if (rombelList && rombelList.includes(namaKelas)) {
        return tingkatKey;
      }
    }
    const kLower = namaKelas.toLowerCase();
    if (kLower.includes('tpa') || kLower.includes('ula')) return 'ula';
    if (kLower.includes('sifir') || kLower.includes('jurumiyah') || kLower.includes('wustho')) return 'wustho';
    if (kLower.includes('imrithi') || kLower.includes('alfiyah') || kLower.includes('ulya')) return 'ulya';
    return '';
  };

  // Helper pencarian guru terdaftar secara cerdas & toleran awalan (Ust. / Usth.)
  const findMatchingGuru = (inputVal) => {
    if (!inputVal || !Array.isArray(waliList) || waliList.length === 0) return null;
    const cleanInput = inputVal.trim().toLowerCase().replace(/^(ustadz|ustadzah|ust\.|usth\.)\s*/i, '');
    if (!cleanInput) return null;

    // 1. Exact match nama asli
    let found = waliList.find(w => (w.nama || '').trim().toLowerCase() === inputVal.trim().toLowerCase());
    if (found) return found;

    // 2. Exact match nama tanpa awalan gelar
    found = waliList.find(w => {
      const wClean = (w.nama || '').trim().toLowerCase().replace(/^(ustadz|ustadzah|ust\.|usth\.)\s*/i, '');
      return wClean === cleanInput;
    });
    if (found) return found;

    // 3. Substring match jika teks pencarian >= 3 karakter
    if (cleanInput.length >= 3) {
      found = waliList.find(w => {
        const wClean = (w.nama || '').trim().toLowerCase().replace(/^(ustadz|ustadzah|ust\.|usth\.)\s*/i, '');
        return wClean.includes(cleanInput) || cleanInput.includes(wClean);
      });
    }
    return found || null;
  };

  useEffect(() => {
    const data = initialWaliData || getInitialWali();
    if (data) {
      if (data.waliKelas) {
        setWaliInput(data.waliKelas);
      }
      if (data.waliKelasId) {
        setSelectedWaliId(data.waliKelasId);
      }
      const initialKelas = data.kelasKategori || '';
      if (initialKelas) {
        setKelasKategori(initialKelas);
        const autoGen = getGenderFromKelas(initialKelas);
        if (autoGen) {
          setJenisKelamin(autoGen);
        }
      }
      const derivedTingkat = data.tingkat || (initialKelas ? getTingkatFromKelas(initialKelas) : '');
      if (derivedTingkat) {
        setTingkat(derivedTingkat);
        const tObj = tingkatList.find(t => t.id === derivedTingkat);
        setTingkatName(tObj ? tObj.name : (data.tingkatName || derivedTingkat));
      }
      if (data.nomorWA) {
        setNomorWA(data.nomorWA);
      }
      if (data.jenisKelamin) {
        setJenisKelamin(data.jenisKelamin);
      }
    }
  }, [initialWaliData, subKelasData, tingkatList]);

  const handleWaliInputChange = (e) => {
    const val = e.target.value;
    setWaliInput(val);
    if (formErrors.wali) {
      setFormErrors(prev => ({ ...prev, wali: '' }));
    }

    if (!val.trim()) {
      setSelectedWaliId('');
      setShowSuggestions(true);
      setTingkat('');
      setTingkatName('');
      setKelasKategori('');
      setCabangLomba('');
      setSubKategoriMHQ('');
      return;
    }

    setShowSuggestions(true);

    // Otomatis deteksi jenjang tingkat & kelas saat nama diketik/dipilih
    const matched = findMatchingGuru(val);
    if (matched) {
      setSelectedWaliId(matched.id || '');
      const derivedTingkat = matched.tingkat || getTingkatFromKelas(matched.kelas);
      setTingkat(derivedTingkat);
      const tObj = tingkatList.find(t => t.id === derivedTingkat);
      setTingkatName(tObj ? tObj.name : (matched.tingkat || derivedTingkat));
      setKelasKategori(matched.kelas || '');
      
      const autoGender = getGenderFromKelas(matched.kelas);
      if (autoGender) {
        setJenisKelamin(autoGender);
      }

      if (matched.kontak && !nomorWA) {
        setNomorWA(matched.kontak);
        if (formErrors.wa) {
          setFormErrors(prev => ({ ...prev, wa: '' }));
        }
      }
      if (formErrors.wali) {
        setFormErrors(prev => ({ ...prev, wali: '' }));
      }
    } else {
      setSelectedWaliId('');
      setTingkat('');
      setTingkatName('');
      setKelasKategori('');
      setCabangLomba('');
      setSubKategoriMHQ('');
    }
  };

  const handleSelectSuggestedGuru = (guru) => {
    setWaliInput(guru.nama);
    setSelectedWaliId(guru.id || '');
    const derivedTingkat = guru.tingkat || getTingkatFromKelas(guru.kelas);
    setTingkat(derivedTingkat);
    const tObj = tingkatList.find(t => t.id === derivedTingkat);
    setTingkatName(tObj ? tObj.name : (guru.tingkat || derivedTingkat));
    setKelasKategori(guru.kelas || '');

    const autoGender = getGenderFromKelas(guru.kelas);
    if (autoGender) {
      setJenisKelamin(autoGender);
    }

    if (guru.kontak) {
      setNomorWA(guru.kontak);
    }
    setShowSuggestions(false);
    setCabangLomba('');
    setSubKategoriMHQ('');
    setFormErrors(prev => ({ ...prev, wali: '', wa: '' }));
  };

  const handleClearWali = () => {
    setWaliInput('');
    setSelectedWaliId('');
    setShowSuggestions(true);
    setTingkat('');
    setTingkatName('');
    setKelasKategori('');
    setCabangLomba('');
    setSubKategoriMHQ('');
    setNomorWA('');
    try {
      sessionStorage.removeItem('alfalah_saved_wali');
      localStorage.removeItem('alfalah_saved_wali');
    } catch (e) {}
    if (waliInputRef.current) {
      waliInputRef.current.focus();
    }
  };

  const availableCabangLomba = CABANG_LOMBA_LIST.filter(c => {
    if (!tingkat) return false;
    return c.tingkatAllowed.includes(tingkat);
  });

  const handleReview = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const errors = {};

    const finalWaliName = waliInput.trim();

    if (!finalWaliName) {
      errors.wali = 'Nama Ustadz / Ustadzah Wali Kelas wajib diisi.';
    } else if (!tingkat || !kelasKategori) {
      errors.wali = 'Nama wali kelas belum cocok. Harap pilih dari daftar saran agar kelas terdeteksi otomatis.';
    }
    if (!cabangLomba) {
      errors.cabang = 'Harap pilih salah satu Cabang Perlombaan.';
    }
    if (cabangLomba && cabangLomba.includes('MHQ') && !subKategoriMHQ) {
      errors.mhqJuz = 'Harap pilih kategori Hafalan Juz (MHQ).';
    }
    if (!namaSantri.trim()) {
      errors.santri = 'Nama Lengkap Santri wajib diisi.';
    }
    if (!nomorWA.trim() || nomorWA.replace(/\D/g, '').length < 9) {
      errors.wa = 'Nomor WhatsApp Wali Kelas wajib diisi (minimal 9 digit angka).';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setErrorMessage('Ada kolom yang belum terisi atau belum sesuai. Mohon periksa kolom yang ditandai merah di bawah.');

      // Sorot & fokus otomatis dengan scroll halus ke elemen pertama yang error
      setTimeout(() => {
        let target = null;
        if (errors.wali && waliInputRef.current) target = waliInputRef.current;
        else if (errors.cabang && cabangSelectRef.current) target = cabangSelectRef.current;
        else if (errors.mhqJuz && mhqRef.current) target = mhqRef.current;
        else if (errors.santri && santriInputRef.current) target = santriInputRef.current;
        else if (errors.wa && waInputRef.current) target = waInputRef.current;

        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof target.focus === 'function') {
            target.focus();
          }
        }
      }, 60);

      return;
    }

    setFormErrors({});
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const finalWaliName = waliInput.trim();
      const finalKelas = kelasKategori;
      
      const payload = {
        waliKelas: finalWaliName,
        waliKelasId: selectedWaliId || null,
        isCustomWali: !selectedWaliId,
        tingkat: tingkatName,
        tingkatId: tingkat,
        rawKelas: finalKelas,
        kelasKategori: cabangLomba.includes('MHQ') && subKategoriMHQ ? `${finalKelas} (${subKategoriMHQ})` : finalKelas,
        cabangLomba,
        namaSantri: namaSantri.trim().toUpperCase(),
        jenisKelamin,
        nomorWA: nomorWA.trim(),
        catatan: catatan.trim()
      };

      await onSubmitSuccess(payload);
      setShowConfirmModal(false);
    } catch (err) {
      setErrorMessage('Terjadi kendala saat menyimpan pendaftaran. Silakan coba kembali.');
      setIsSubmitting(false);
    }
  };

  const currentWaliName = waliInput.trim();

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4 py-1.5 sm:py-5">
      
      {/* Banner Informasi Ketentuan Perlombaan - Rapi, Lega & Nyaman di HP */}
      <div className="mb-2.5 sm:mb-3.5 p-2.5 sm:p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-slate-800 shadow-2xs flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#075B45] text-[#D9B45B] flex items-center justify-center shrink-0 shadow-2xs">
            <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              Syarat & Ketentuan Perlombaan
            </p>
            <p className="text-[10.5px] sm:text-xs text-slate-600 truncate">
              Pastikan delegasi santri sesuai kuota kelas
            </p>
          </div>
        </div>
        <Link
          to="/syarat-ketentuan"
          className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs shadow-xs flex items-center space-x-1 shrink-0 transition-all active:scale-95 cursor-pointer min-h-[36px] sm:min-h-[38px]"
        >
          <span>Petunjuk</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#D9B45B]" />
        </Link>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        
        {/* Header Form Resmi - Rapi & Proporsional */}
        <div className="bg-[#075B45] text-white px-3.5 sm:px-6 py-3.5 sm:py-5 border-b border-[#054736]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/20">
                <FileText className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#D9B45B]" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white leading-tight">
                  Formulir Pendaftaran Delegasi
                </h2>
                <p className="text-[11px] sm:text-sm text-emerald-100/90 leading-tight mt-0.5">
                  Dikoordinasikan oleh Ustadz / Ustadzah Wali Kelas
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider bg-white/10 text-emerald-100 px-3 py-1 rounded-full border border-white/10">
              Al-Falah Putak
            </span>
          </div>
        </div>

        <form onSubmit={handleReview} className="p-2.5 sm:p-6 space-y-3 sm:space-y-5">

          {/* Notifikasi Validasi Error Terpusat & Mencolok */}
          {errorMessage && (
            <div className="p-3 sm:p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs sm:text-sm flex items-start space-x-2.5 shadow-sm animate-fadeIn">
              <div className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-rose-900">Perhatian: Data Belum Lengkap</p>
                <p className="text-rose-700 text-xs mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Info Status Delegasi Beruntun (Wali & No WA Tetap Tersimpan) */}
          {waliInput && kelasKategori && (
            <div className="p-2.5 sm:p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-slate-800 shadow-2xs flex items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#075B45] text-[#D9B45B] flex items-center justify-center shrink-0 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    Data Wali & No. WA Tersimpan: {waliInput}
                  </p>
                  <p className="text-[10.5px] sm:text-xs text-slate-600 truncate">
                    Kelas: <strong className="text-emerald-900">{kelasKategori}</strong> • WA: <span className="font-mono">{nomorWA || '-'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearWali}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-rose-600 text-[11px] sm:text-xs font-bold border border-slate-200 transition-all shrink-0 shadow-2xs cursor-pointer active:scale-95"
                title="Ganti ke Wali Kelas lain"
              >
                Ganti Wali
              </button>
            </div>
          )}

          {/* ================= LANGKAH 1: DATA WALI KELAS ================= */}
          <div className="p-2.5 sm:p-5 rounded-xl border border-slate-200/90 bg-slate-50/60 space-y-2.5 sm:space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-slate-200/70">
              <div className="flex items-center space-x-2 sm:space-x-2.5">
                <span className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full bg-[#075B45] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                  1
                </span>
                <h3 className="text-xs sm:text-base font-bold text-slate-900">
                  Data Wali Kelas Pengampu <span className="text-rose-500">*</span>
                </h3>
              </div>
              <span className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Langkah 1 dari 3</span>
            </div>

            {/* Input Ketik Manual dengan Autocomplete Pintar */}
            <div className="space-y-1.5" ref={waliDropdownRef}>
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block">
                  Nama Ustadz / Ustadzah Wali Kelas <span className="text-rose-500">*</span>
                </label>
                {suggestedWali.length > 0 && showSuggestions && (
                  <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {query.length > 0 ? `${suggestedWali.length} guru cocok` : `${suggestedWali.length} guru tersedia`}
                  </span>
                )}
              </div>

              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                  formErrors.wali ? 'text-rose-500' : 'text-slate-400'
                }`}>
                  <UserCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <input
                  ref={waliInputRef}
                  type="text"
                  list="daftar-wali-guru-list"
                  placeholder="Ketik atau pilih nama Ustadz / Ustadzah..."
                  value={waliInput}
                  onChange={handleWaliInputChange}
                  onFocus={() => setShowSuggestions(true)}
                  onClick={() => setShowSuggestions(true)}
                  className={`w-full pl-9 pr-8 py-2.5 sm:py-3 rounded-xl border bg-white text-slate-900 outline-none text-xs sm:text-sm font-medium shadow-2xs placeholder:text-slate-400 min-h-[44px] sm:min-h-[46px] transition-all ${
                    formErrors.wali 
                      ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/30' 
                      : 'border-slate-300 focus:ring-2 focus:ring-[#075B45]/20 focus:border-[#075B45]'
                  }`}
                />

                {/* Datalist native untuk autocomplete cepat di browser/HP */}
                <datalist id="daftar-wali-guru-list">
                  {(waliList || []).map((w) => (
                    <option key={w.id || w.nama} value={w.nama}>
                      {w.kelas} • {(w.tingkat || '').toUpperCase()}
                    </option>
                  ))}
                </datalist>

                {waliInput && (
                  <button
                    type="button"
                    onClick={handleClearWali}
                    className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title="Hapus / Ganti Nama"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Floating Autocomplete Suggestions Dropdown (Lengkap & Responsif di HP) */}
                {showSuggestions && suggestedWali.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-h-56 overflow-y-auto animate-fadeIn">
                    <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10.5px] font-semibold text-slate-500 flex items-center justify-between">
                      <span>{query.length > 0 ? 'Saran Wali Kelas:' : 'Daftar Nama Wali Kelas:'}</span>
                      <span className="text-[10px] text-slate-400">Pilih untuk deteksi kelas</span>
                    </div>
                    {suggestedWali.map((guru) => (
                      <button
                        key={guru.id || guru.nama}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectSuggestedGuru(guru)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/80 flex items-center justify-between transition-colors border-b border-slate-100 last:border-0 cursor-pointer group"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#075B45] truncate">
                            {guru.nama}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            Kelas: <span className="font-semibold text-slate-700">{guru.kelas}</span> • {guru.tingkat?.toUpperCase()}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md shrink-0">
                          Pilih
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {formErrors.wali && (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center space-x-1 mt-1 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formErrors.wali}</span>
                </p>
              )}
            </div>

            {/* HASIL: Badge Auto-Detect Tingkat & Kelas dari Wali Kelas Terdaftar */}
            {tingkat && kelasKategori ? (
              <div className="p-3 sm:p-3.5 bg-emerald-50/90 border border-emerald-300 rounded-xl shadow-2xs space-y-2 animate-fadeIn">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="text-xs sm:text-[13px] font-bold text-emerald-900 tracking-tight truncate">
                    Kelas Terdeteksi Otomatis
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-emerald-200/70">
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    {kelasKategori}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#075B45] text-white shadow-2xs">
                    {tingkatName}
                  </span>
                  {getGenderFromKelas(kelasKategori) === 'P' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-600 text-white shadow-2xs">
                      Kelas Putri
                    </span>
                  )}
                  {getGenderFromKelas(kelasKategori) === 'L' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-sky-700 text-white shadow-2xs">
                      Kelas Putra
                    </span>
                  )}
                </div>
              </div>
            ) : (
              !formErrors.wali && (
                <p className="text-[11px] text-slate-500 pt-0.5">
                  Silakan ketik atau pilih nama Ustadz / Ustadzah dari daftar saran untuk mendeteksi kelas santri secara otomatis.
                </p>
              )
            )}

          </div>

          {/* ================= LANGKAH 2: PILIHAN CABANG LOMBA ================= */}
          <div className="p-2.5 sm:p-5 rounded-xl border border-slate-200/90 bg-slate-50/60 space-y-2.5 sm:space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-slate-200/70">
              <div className="flex items-center space-x-2 sm:space-x-2.5">
                <span className={`w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs ${
                  tingkat ? 'bg-[#075B45] text-white' : 'bg-slate-300 text-slate-600'
                }`}>
                  2
                </span>
                <h3 className="text-xs sm:text-base font-bold text-slate-900">
                  Pilihan Cabang Perlombaan <span className="text-rose-500">*</span>
                </h3>
              </div>
              <span className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Langkah 2 dari 3</span>
            </div>

            {!tingkat ? (
              <div className="p-3 rounded-xl bg-white border border-dashed border-slate-300 text-slate-500 text-xs sm:text-sm flex items-center space-x-2">
                <HelpCircle className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                <span>Pilih Wali Kelas pada Langkah 1 terlebih dahulu.</span>
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block">
                    Pilih Mata Perlombaan: <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      ref={cabangSelectRef}
                      value={cabangLomba}
                      onChange={(e) => {
                        setCabangLomba(e.target.value);
                        setSubKategoriMHQ('');
                        if (formErrors.cabang) {
                          setFormErrors(prev => ({ ...prev, cabang: '', mhqJuz: '' }));
                        }
                      }}
                      className={`w-full appearance-none px-3 sm:px-3.5 py-2.5 sm:py-3 pr-8 sm:pr-9 rounded-xl border bg-white text-slate-900 outline-none text-xs sm:text-sm font-medium shadow-2xs cursor-pointer min-h-[44px] sm:min-h-[46px] transition-all ${
                        formErrors.cabang
                          ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/30'
                          : 'border-slate-300 focus:ring-2 focus:ring-[#075B45]/20 focus:border-[#075B45]'
                      }`}
                    >
                      <option value="">-- Pilih Cabang Perlombaan yang Diikuti --</option>
                      {availableCabangLomba.map(lomba => (
                        <option key={lomba.id} value={lomba.name}>
                          {lomba.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center pointer-events-none text-slate-400">
                      <ChevronDown className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </div>
                  </div>

                  {formErrors.cabang && (
                    <p className="text-[11px] font-semibold text-rose-600 flex items-center space-x-1 mt-1 animate-fadeIn">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{formErrors.cabang}</span>
                    </p>
                  )}
                </div>

                {/* Khusus MHQ (Juz) */}
                {cabangLomba.includes('MHQ') && (
                  <div 
                    ref={mhqRef}
                    className={`p-2.5 sm:p-3.5 rounded-xl border space-y-2 sm:space-y-2.5 transition-all ${
                      formErrors.mhqJuz
                        ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/40'
                        : 'border-amber-200 bg-amber-50/80'
                    }`}
                  >
                    <label className="text-xs font-bold text-amber-950 block">
                      Pilih Kategori Hafalan Juz (MHQ): <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                      {[
                        '5 Juz',
                        '10 Juz',
                        '15 Juz',
                        '20 Juz',
                        '25 Juz',
                        '30 Juz'
                      ].map(juz => (
                        <button
                          key={juz}
                          type="button"
                          onClick={() => {
                            setSubKategoriMHQ(juz);
                            if (formErrors.mhqJuz) {
                              setFormErrors(prev => ({ ...prev, mhqJuz: '' }));
                            }
                          }}
                          className={`py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-semibold text-center border transition-all cursor-pointer min-h-[38px] sm:min-h-[42px] active:scale-95 ${
                            subKategoriMHQ === juz
                              ? 'bg-[#075B45] text-white border-[#075B45] shadow-xs'
                              : 'bg-white text-slate-700 border-amber-300/80 hover:bg-amber-100/50'
                          }`}
                        >
                          {juz}
                        </button>
                      ))}
                    </div>

                    {formErrors.mhqJuz && (
                      <p className="text-[11px] font-semibold text-rose-600 flex items-center space-x-1 mt-1 animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formErrors.mhqJuz}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================= LANGKAH 3: IDENTITAS PESERTA ================= */}
          <div className="p-2.5 sm:p-5 rounded-xl border border-slate-200/90 bg-slate-50/60 space-y-2.5 sm:space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-slate-200/70">
              <div className="flex items-center space-x-2 sm:space-x-2.5">
                <span className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full bg-[#075B45] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                  3
                </span>
                <h3 className="text-xs sm:text-base font-bold text-slate-900">
                  Identitas Santri Delegasi <span className="text-rose-500">*</span>
                </h3>
              </div>
              <span className="text-[10.5px] sm:text-[11px] font-semibold text-slate-400">Langkah 3 dari 3</span>
            </div>

            {/* Nama Lengkap Santri */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block">
                Nama Lengkap Santri <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                  formErrors.santri ? 'text-rose-500' : 'text-slate-400'
                }`}>
                  <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <input
                  ref={santriInputRef}
                  type="text"
                  placeholder="MASUKKAN NAMA LENGKAP SANTRI..."
                  value={namaSantri}
                  onChange={(e) => {
                    setNamaSantri(e.target.value.toUpperCase());
                    if (formErrors.santri) {
                      setFormErrors(prev => ({ ...prev, santri: '' }));
                    }
                  }}
                  className={`w-full pl-9 pr-3 py-2.5 sm:py-3 rounded-xl border bg-white text-slate-900 outline-none text-xs sm:text-sm font-bold uppercase shadow-2xs placeholder:text-slate-400 placeholder:normal-case min-h-[44px] sm:min-h-[46px] transition-all ${
                    formErrors.santri
                      ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-2 focus:ring-[#075B45]/20 focus:border-[#075B45]'
                  }`}
                />
              </div>

              {formErrors.santri ? (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center space-x-1 mt-1 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formErrors.santri}</span>
                </p>
              ) : (
                <p className="text-[10.5px] sm:text-[11px] text-slate-500">
                  Otomatis menggunakan huruf kapital (HURUF BESAR) sesuai format resmi panitia.
                </p>
              )}
            </div>

            {/* Jenis Kelamin: Modern Segmented Switch Ergonomis di Jempol */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block">
                  Jenis Kelamin Santri <span className="text-rose-500">*</span>
                </label>
                {kelasKategori && getGenderFromKelas(kelasKategori) && (
                  <span className="text-[10px] sm:text-[10.5px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Sesuai {kelasKategori}
                  </span>
                )}
              </div>
              <div className="p-1 sm:p-1.5 bg-slate-200/70 rounded-xl grid grid-cols-2 gap-1 sm:gap-1.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setJenisKelamin('L')}
                  className={`py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer min-h-[40px] sm:min-h-[44px] active:scale-95 ${
                    jenisKelamin === 'L'
                      ? 'bg-sky-700 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span>Putra ♂</span>
                </button>
                <button
                  type="button"
                  onClick={() => setJenisKelamin('P')}
                  className={`py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer min-h-[40px] sm:min-h-[44px] active:scale-95 ${
                    jenisKelamin === 'P'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span>Putri ♀</span>
                </button>
              </div>
            </div>

            {/* Nomor WhatsApp Wali Kelas */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block">
                  Nomor WhatsApp Wali Kelas <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                  Kontak Ustadz / Ustadzah
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {/* Ikon WhatsApp Asli Hijau #25D366 */}
                  <svg 
                    className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-[#25D366] shrink-0" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
                <input
                  ref={waInputRef}
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={nomorWA}
                  onChange={(e) => {
                    setNomorWA(e.target.value);
                    if (formErrors.wa) {
                      setFormErrors(prev => ({ ...prev, wa: '' }));
                    }
                  }}
                  className={`w-full pl-9 pr-3 py-2.5 sm:py-3 rounded-xl border bg-white text-slate-900 outline-none text-xs sm:text-sm font-medium shadow-2xs placeholder:text-slate-400 font-mono min-h-[44px] sm:min-h-[46px] transition-all ${
                    formErrors.wa
                      ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/30'
                      : 'border-slate-300 focus:ring-2 focus:ring-[#075B45]/20 focus:border-[#075B45]'
                  }`}
                />
              </div>

              {formErrors.wa ? (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center space-x-1 mt-1 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formErrors.wa}</span>
                </p>
              ) : (
                <p className="text-[10.5px] sm:text-[11px] text-slate-500">
                  Nomor WhatsApp resmi Ustadz / Ustadzah Wali Kelas untuk konfirmasi pendaftaran & informasi lomba.
                </p>
              )}
            </div>

            {/* Catatan Tambahan */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-[13px] font-semibold text-slate-700 block">
                Catatan Tambahan (Opsional)
              </label>
              <div className="relative">
                <div className="absolute top-2.5 left-3 pointer-events-none text-slate-400">
                  <FileText className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <textarea
                  rows="2"
                  placeholder="Tuliskan keterangan tambahan apabila diperlukan..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#075B45]/20 focus:border-[#075B45] outline-none text-xs sm:text-sm font-medium shadow-2xs placeholder:text-slate-400"
                ></textarea>
              </div>
            </div>

          </div>

          {/* Tombol Lanjutkan - Mantap di Jempol */}
          <div className="pt-1.5 sm:pt-2">
            <button
              type="submit"
              className="w-full py-3 sm:py-3.5 px-4 sm:px-5 rounded-xl bg-[#075B45] hover:bg-[#054736] active:bg-[#04382B] text-white font-bold text-xs sm:text-base shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.98] min-h-[46px] sm:min-h-[50px]"
            >
              <span>Periksa dan Lanjutkan Pendaftaran</span>
              <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#D9B45B]" />
            </button>
          </div>

        </form>
      </div>

      {/* ================= MODAL KONFIRMASI REVIEW ================= */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-5 shadow-2xl border border-slate-200 animate-fadeIn">
            
            <div className="text-center mb-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#EAF4F0] text-[#075B45] mx-auto flex items-center justify-center mb-2">
                <CheckCircle2 className="w-5 h-5 text-[#075B45]" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Periksa Ulang Data Pendaftaran</h3>
              <p className="text-[11px] text-slate-500">Pastikan seluruh data telah sesuai sebelum dikirimkan ke panitia</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs text-slate-700 border border-slate-200 mb-4">
              <div className="flex justify-between border-b border-slate-200/70 pb-1">
                <span className="text-slate-500">Wali Kelas:</span>
                <span className="font-bold text-slate-900">{currentWaliName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/70 pb-1">
                <span className="text-slate-500">Tingkat / Kelas:</span>
                <span className="font-bold text-[#075B45]">{kelasKategori} ({tingkatName})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/70 pb-1">
                <span className="text-slate-500">Cabang Perlombaan:</span>
                <span className="font-bold text-slate-900">{cabangLomba} {subKategoriMHQ && `(${subKategoriMHQ})`}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/70 pb-1">
                <span className="text-slate-500">Nama Peserta:</span>
                <span className="font-bold text-slate-900">{namaSantri}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/70 pb-1">
                <span className="text-slate-500">Jenis Kelamin:</span>
                <span className="font-bold text-slate-900">{jenisKelamin === 'L' ? 'Putra' : 'Putri'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/70 pb-1">
                <span className="text-slate-500">Nomor WhatsApp Wali Kelas:</span>
                <span className="font-bold text-slate-900 font-mono">{nomorWA}</span>
              </div>
              {catatan && (
                <div className="flex justify-between pt-0.5">
                  <span className="text-slate-500">Catatan:</span>
                  <span className="italic text-slate-700">{catatan}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-300 font-semibold text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Kembali Edit
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2 px-3 rounded-lg bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs shadow-xs flex items-center justify-center space-x-1 cursor-pointer"
              >
                {isSubmitting ? <span>Menyimpan...</span> : <span>Kirim Pendaftaran</span>}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL PEMBERITAHUAN SYARAT & KETENTUAN (SOPAN & RAMAH) ================= */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
            
            {/* Header Modal */}
            <div className="bg-[#075B45] text-white p-3.5 sm:p-4 border-b-2 border-[#D9B45B] relative flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <img 
                  src="/logo.webp" 
                  alt="Logo Al-Falah Putak" 
                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0" 
                />
                <div className="leading-tight">
                  <span className="text-[9.5px] uppercase font-bold tracking-wider text-[#D9B45B] block">
                    Musabaqah Akhirussanah 1447 H / 2026 M
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                    Pemberitahuan Pendaftaran Perlombaan
                  </h3>
                </div>
              </div>
              <button
                onClick={handleAcknowledgeNotice}
                className="p-1 rounded-md text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Tutup Pemberitahuan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Isi Pemberitahuan Ringkas, Sopan & Ramah */}
            <div className="p-4 sm:p-5 space-y-2 text-slate-700 text-xs leading-relaxed max-h-[75vh] overflow-y-auto">
              
              <div className="pb-0.5">
                <p className="font-semibold text-slate-900 text-xs">
                  Assalamu'alaikum Warahmatullahi Wabarakatuh
                </p>
                <p className="text-slate-800 font-bold text-xs mt-1">
                  Yth. Ustadz & Ustadzah Wali Kelas,
                </p>
              </div>

              <p className="text-slate-600 text-xs">
                Sebelum mengisi formulir pendaftaran delegasi santri, mohon berkenan memastikan data telah sesuai dengan ketentuan panitia:
              </p>

              {/* Ringkasan Poin Singkat */}
              <div className="bg-[#EAF4F0] rounded-xl p-2.5 sm:p-3 border border-[#075B45]/20 text-[11px] text-slate-800 space-y-1">
                <ul className="space-y-1 pl-4 list-disc text-slate-700">
                  <li><strong>Nama Wali Kelas wajib sudah terdaftar</strong> di database guru (tingkat & rombel otomatis terhubung).</li>
                  <li>Setiap kelas wajib mengirimkan delegasi di setiap mata perlombaan.</li>
                  <li><strong>1 Santri maksimal 2 cabang lomba</strong> (selain CCM & Kreasi Nadzom).</li>
                  <li>Setiap kelas maksimal mengirimkan <strong>3 delegasi</strong> per cabang lomba.</li>
                  <li>Santri peraih <strong>Juara 1</strong> tahun lalu tidak diperkenankan mengikuti cabang yang sama.</li>
                  <li>Santri terdaftar yang tidak tampil tanpa izin panitia dikenakan sanksi infaq 1 sak semen & ta'zir.</li>
                </ul>
              </div>

              <p className="text-slate-600 text-[11px]">
                Atas kerja sama Ustadz / Ustadzah sekalian, kami haturkan <em>jazakumullah khairan katsiran</em>.
              </p>

              <div className="text-right text-[10.5px] font-semibold text-slate-600 pt-0.5">
                <p>Wassalamu'alaikum Wr. Wb.</p>
                <p className="text-[#075B45] font-bold">Panitia Musabaqah Akhirussanah</p>
              </div>

            </div>

            {/* Tombol Aksi Modal */}
            <div className="bg-slate-50 px-3.5 py-3 sm:px-5 sm:py-3.5 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center gap-2 justify-end">
              <button
                type="button"
                onClick={handleGoToGuidelines}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg bg-white border border-slate-300 hover:border-[#075B45] text-slate-700 hover:text-[#075B45] font-bold text-xs shadow-2xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>Baca Ketentuan Lengkap</span>
              </button>
              <button
                type="button"
                onClick={handleAcknowledgeNotice}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-lg bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs shadow-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <span>Saya Memahami, Lanjut Isi Formulir</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D9B45B]" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
