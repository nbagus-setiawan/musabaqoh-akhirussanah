import React, { useState, useEffect, useRef } from 'react';
import { 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  FastForward, 
  Plus, 
  Trash2, 
  BookOpen, 
  Users, 
  Send, 
  Edit3, 
  Check, 
  Info, 
  RotateCcw,
  Sparkles,
  Phone,
  Layers,
  Award,
  ShieldCheck,
  X
} from 'lucide-react';
import { 
  getWaliKelasList, 
  fetchWaliKelas, 
  getTingkatList, 
  fetchTingkatKelas,
  getSubKelasByTingkat,
  saveBatchRegistrations
} from '../../shared/services/api';
import { 
  CABANG_LOMBA_LIST, 
  PILIHAN_BAHASA, 
  PILIHAN_JUZ_MHQ, 
  getGenderFromKelas,
  MASTER_WALI_KELAS 
} from '../../shared/data/competitions';

const STORAGE_DRAFT_KEY = 'alfalah_multistep_draft_v1';

export default function RegistrationForm({ onSubmitSuccess, initialWaliData = null }) {
  // State Master Data
  const [waliList, setWaliList] = useState(() => {
    const list = getWaliKelasList();
    return (Array.isArray(list) && list.length > 0) ? list : MASTER_WALI_KELAS;
  });
  const [tingkatList, setTingkatList] = useState(() => getTingkatList());
  const [subKelasData, setSubKelasData] = useState(() => getSubKelasByTingkat());

  // Current Step: 1 sampai 12
  const [currentStep, setCurrentStep] = useState(1);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STEP 1: Identitas Wali Kelas & Kelas Diniyah
  const [waliInput, setWaliInput] = useState('');
  const [selectedWaliId, setSelectedWaliId] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tingkat, setTingkat] = useState('');
  const [tingkatName, setTingkatName] = useState('');
  const [kelasDiniyah, setKelasDiniyah] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState('L');
  const [nomorWA, setNomorWA] = useState('');
  const waliDropdownRef = useRef(null);
  const waliInputRef = useRef(null);

  // DATA DELEGASI TIAP CABANG LOMBA
  // Step 2: MQK (maks 3 santri)
  const [mqkSantri, setMqkSantri] = useState(['', '', '']);

  // Step 3: Pidato (maks 3 santri + pilihan 3 bahasa)
  const [pidatoSantri, setPidatoSantri] = useState([
    { nama: '', bahasa: 'Bahasa Indonesia' },
    { nama: '', bahasa: 'Bahasa Arab' },
    { nama: '', bahasa: 'Bahasa Inggris' }
  ]);

  // Step 4: MC (maks 3 santri + pilihan 3 bahasa)
  const [mcSantri, setMcSantri] = useState([
    { nama: '', bahasa: 'Bahasa Indonesia' },
    { nama: '', bahasa: 'Bahasa Arab' },
    { nama: '', bahasa: 'Bahasa Inggris' }
  ]);

  // Step 5: Syarhil Qur'an (Regu dengan tombol + Tambah Regu)
  const [syarhilRegu, setSyarhilRegu] = useState([
    { namaRegu: 'Regu 1', pensyarah: '', tilawah: '', terjemah: '' }
  ]);

  // Step 6: Tilawah (maks 3 santri)
  const [tilawahSantri, setTilawahSantri] = useState(['', '', '']);

  // Step 7: Khot / Kaligrafi (maks 3 santri)
  const [kaligrafiSantri, setKaligrafiSantri] = useState(['', '', '']);

  // Step 8: MHQ (maks 3 santri + pilihan juz)
  const [mhqSantri, setMhqSantri] = useState([
    { nama: '', juz: '5 Juz' },
    { nama: '', juz: '10 Juz' },
    { nama: '', juz: '15 Juz' }
  ]);

  // Step 9: Adzan (maks 3 santri)
  const [adzanSantri, setAdzanSantri] = useState(['', '', '']);

  // Step 10: CCM (Cerdas Cermat Musabaqoh - Regu dengan tombol + Tambah Regu)
  const [ccmRegu, setCcmRegu] = useState([
    { namaRegu: 'Regu 1', anggota1: '', anggota2: '', anggota3: '' }
  ]);

  // Step 11: Kreasi Nadzom (Nama Ketua, Jumlah Anggota, Catatan)
  const [kreasiNadzom, setKreasiNadzom] = useState({
    ketua: '',
    jumlahAnggota: '',
    catatan: ''
  });

  // Track Cabang yang Dilewati
  const [skippedSteps, setSkippedSteps] = useState({});

  // 1. Muat Data Guru & Rombel dari Google Sheets jika tersedia
  useEffect(() => {
    fetchWaliKelas().then(list => {
      if (Array.isArray(list) && list.length > 0) setWaliList(list);
    }).catch(() => {});

    fetchTingkatKelas().then(grouped => {
      if (grouped && typeof grouped === 'object') setSubKelasData(grouped);
    }).catch(() => {});
  }, []);

  // 2. Click Outside listener untuk dropdown saran nama guru
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

  // 3. Muat draft tersimpan (jika ada) saat pertama kali buka
  useEffect(() => {
    try {
      const savedDraft = sessionStorage.getItem(STORAGE_DRAFT_KEY);
      if (savedDraft) {
        const d = JSON.parse(savedDraft);
        if (d.waliInput) setWaliInput(d.waliInput);
        if (d.selectedWaliId) setSelectedWaliId(d.selectedWaliId);
        if (d.tingkat) setTingkat(d.tingkat);
        if (d.tingkatName) setTingkatName(d.tingkatName);
        if (d.kelasDiniyah) setKelasDiniyah(d.kelasDiniyah);
        if (d.jenisKelamin) setJenisKelamin(d.jenisKelamin);
        if (d.nomorWA) setNomorWA(d.nomorWA);
        if (d.mqkSantri) setMqkSantri(d.mqkSantri);
        if (d.pidatoSantri) setPidatoSantri(d.pidatoSantri);
        if (d.mcSantri) setMcSantri(d.mcSantri);
        if (d.syarhilRegu) setSyarhilRegu(d.syarhilRegu);
        if (d.tilawahSantri) setTilawahSantri(d.tilawahSantri);
        if (d.kaligrafiSantri) setKaligrafiSantri(d.kaligrafiSantri);
        if (d.mhqSantri) setMhqSantri(d.mhqSantri);
        if (d.adzanSantri) setAdzanSantri(d.adzanSantri);
        if (d.ccmRegu) setCcmRegu(d.ccmRegu);
        if (d.kreasiNadzom) setKreasiNadzom(d.kreasiNadzom);
        if (d.skippedSteps) setSkippedSteps(d.skippedSteps);
      }
    } catch (e) {}
  }, []);

  // 4. Autosave draft ke sessionStorage setiap ada perubahan
  useEffect(() => {
    try {
      const draftObj = {
        waliInput,
        selectedWaliId,
        tingkat,
        tingkatName,
        kelasDiniyah,
        jenisKelamin,
        nomorWA,
        mqkSantri,
        pidatoSantri,
        mcSantri,
        syarhilRegu,
        tilawahSantri,
        kaligrafiSantri,
        mhqSantri,
        adzanSantri,
        ccmRegu,
        kreasiNadzom,
        skippedSteps
      };
      sessionStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(draftObj));
    } catch (e) {}
  }, [
    waliInput, selectedWaliId, tingkat, tingkatName, kelasDiniyah, jenisKelamin, nomorWA,
    mqkSantri, pidatoSantri, mcSantri, syarhilRegu, tilawahSantri, kaligrafiSantri,
    mhqSantri, adzanSantri, ccmRegu, kreasiNadzom, skippedSteps
  ]);

  // Filter saran guru berdasarkan teks yang diketik
  const query = waliInput.trim().toLowerCase();
  const suggestedWali = Array.isArray(waliList)
    ? (query.length > 0
        ? waliList.filter(w => 
            (w.nama && w.nama.toLowerCase().includes(query)) ||
            (w.kelas && w.kelas.toLowerCase().includes(query))
          )
        : waliList)
    : [];

  const getTingkatFromKelasName = (namaKelas) => {
    if (!namaKelas) return '';
    for (const [tingkatKey, list] of Object.entries(subKelasData || {})) {
      if (list && list.includes(namaKelas)) return tingkatKey;
    }
    const k = namaKelas.toLowerCase();
    if (k.includes('tpa') || k.includes('ula')) return 'ula';
    if (k.includes('sifir') || k.includes('jurumiyah') || k.includes('wustho')) return 'wustho';
    if (k.includes('imrithi') || k.includes('alfiyah') || k.includes('ulya')) return 'ulya';
    return '';
  };

  const handleSelectSuggestedGuru = (guru) => {
    setWaliInput(guru.nama);
    setSelectedWaliId(guru.id || '');
    const derivedTingkat = guru.tingkat || getTingkatFromKelasName(guru.kelas);
    setTingkat(derivedTingkat);
    const tObj = tingkatList.find(t => t.id === derivedTingkat);
    setTingkatName(tObj ? tObj.name : (guru.tingkat || derivedTingkat));
    setKelasDiniyah(guru.kelas || '');

    const autoGender = getGenderFromKelas(guru.kelas);
    if (autoGender) setJenisKelamin(autoGender);

    if (guru.kontak && !nomorWA) {
      setNomorWA(guru.kontak);
    }
    setShowSuggestions(false);
    setFormError('');
  };

  const handleClearWali = () => {
    setWaliInput('');
    setSelectedWaliId('');
    setShowSuggestions(true);
    setTingkat('');
    setTingkatName('');
    setKelasDiniyah('');
    if (waliInputRef.current) waliInputRef.current.focus();
  };

  // Navigasi Langkah
  const handleNextStep = () => {
    setFormError('');

    // Validasi Langkah 1
    if (currentStep === 1) {
      if (!waliInput.trim() || !tingkat || !kelasDiniyah) {
        setFormError('Harap pilih nama Ustadz / Ustadzah dari daftar saran agar Kelas Diniyah tervalidasi.');
        return;
      }
      if (!nomorWA.trim() || nomorWA.replace(/\D/g, '').length < 9) {
        setFormError('Nomor WhatsApp Wali Kelas wajib diisi minimal 9 digit.');
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Untuk langkah 2 s.d. 11: Otomatis tandai cabang tidak dilewati jika ada santri yang diisi
    if (currentStep >= 2 && currentStep <= 11) {
      setSkippedSteps(prev => ({ ...prev, [currentStep]: false }));
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Langkah 12: Pengiriman Batch
    if (currentStep === 12) {
      handleSubmitAll();
    }
  };

  const handlePrevStep = () => {
    setFormError('');
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSkipStep = () => {
    setFormError('');
    // Tandai langkah cabang ini sebagai dilewati
    setSkippedSteps(prev => ({ ...prev, [currentStep]: true }));
    if (currentStep < 12) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handler Tambah & Hapus Regu untuk Syarhil Qur'an & CCM
  const handleAddSyarhilRegu = () => {
    setSyarhilRegu(prev => [
      ...prev,
      { namaRegu: `Regu ${prev.length + 1}`, pensyarah: '', tilawah: '', terjemah: '' }
    ]);
  };

  const handleRemoveSyarhilRegu = (index) => {
    if (syarhilRegu.length <= 1) return;
    setSyarhilRegu(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddCcmRegu = () => {
    setCcmRegu(prev => [
      ...prev,
      { namaRegu: `Regu ${prev.length + 1}`, anggota1: '', anggota2: '', anggota3: '' }
    ]);
  };

  const handleRemoveCcmRegu = (index) => {
    if (ccmRegu.length <= 1) return;
    setCcmRegu(prev => prev.filter((_, idx) => idx !== index));
  };

  // Kumpulkan Seluruh Santri Delegasi untuk Step 12 & Pengiriman Sekaligus
  const compileAllDelegates = () => {
    const list = [];

    // Step 2: MQK
    if (!skippedSteps[2]) {
      mqkSantri.forEach((nama, idx) => {
        if (nama.trim()) {
          list.push({
            cabangId: 'mqk',
            cabangLomba: 'MQK',
            namaSantri: nama.trim().toUpperCase(),
            kategoriDetail: kelasDiniyah,
            label: `Santri ${idx + 1}`
          });
        }
      });
    }

    // Step 3: PIDATO
    if (!skippedSteps[3]) {
      pidatoSantri.forEach((item, idx) => {
        if (item.nama && item.nama.trim()) {
          list.push({
            cabangId: 'pidato',
            cabangLomba: 'PIDATO',
            namaSantri: item.nama.trim().toUpperCase(),
            kategoriDetail: `${kelasDiniyah} (${item.bahasa})`,
            label: `Santri ${idx + 1} • ${item.bahasa}`,
            catatan: `Bahasa: ${item.bahasa}`
          });
        }
      });
    }

    // Step 4: MC
    if (!skippedSteps[4]) {
      mcSantri.forEach((item, idx) => {
        if (item.nama && item.nama.trim()) {
          list.push({
            cabangId: 'mc',
            cabangLomba: 'MC',
            namaSantri: item.nama.trim().toUpperCase(),
            kategoriDetail: `${kelasDiniyah} (${item.bahasa})`,
            label: `Santri ${idx + 1} • ${item.bahasa}`,
            catatan: `Bahasa: ${item.bahasa}`
          });
        }
      });
    }

    // Step 5: Syarhil Qur'an
    if (!skippedSteps[5]) {
      syarhilRegu.forEach((regu, rIdx) => {
        const reguTitle = regu.namaRegu || `Regu ${rIdx + 1}`;
        if (regu.pensyarah && regu.pensyarah.trim()) {
          list.push({
            cabangId: 'syarhil',
            cabangLomba: 'Syarhil Qur\'an',
            namaSantri: regu.pensyarah.trim().toUpperCase(),
            kategoriDetail: `${kelasDiniyah} (${reguTitle})`,
            label: `${reguTitle} • Pensyarah`,
            catatan: `${reguTitle} - Pensyarah`
          });
        }
        if (regu.tilawah && regu.tilawah.trim()) {
          list.push({
            cabangId: 'syarhil',
            cabangLomba: 'Syarhil Qur\'an',
            namaSantri: regu.tilawah.trim().toUpperCase(),
            kategoriDetail: `${kelasDiniyah} (${reguTitle})`,
            label: `${reguTitle} • Tilawah`,
            catatan: `${reguTitle} - Tilawah`
          });
        }
        if (regu.terjemah && regu.terjemah.trim()) {
          list.push({
            cabangId: 'syarhil',
            cabangLomba: 'Syarhil Qur\'an',
            namaSantri: regu.terjemah.trim().toUpperCase(),
            kategoriDetail: `${kelasDiniyah} (${reguTitle})`,
            label: `${reguTitle} • Terjemah`,
            catatan: `${reguTitle} - Terjemah`
          });
        }
      });
    }

    // Step 6: Tilawah
    if (!skippedSteps[6]) {
      tilawahSantri.forEach((nama, idx) => {
        if (nama.trim()) {
          list.push({
            cabangId: 'tilawah',
            cabangLomba: 'Tilawah',
            namaSantri: nama.trim().toUpperCase(),
            kategoriDetail: kelasDiniyah,
            label: `Santri ${idx + 1}`
          });
        }
      });
    }

    // Step 7: Khot/Kaligrafi
    if (!skippedSteps[7]) {
      kaligrafiSantri.forEach((nama, idx) => {
        if (nama.trim()) {
          list.push({
            cabangId: 'kaligrafi',
            cabangLomba: 'Khot/Kaligrafi',
            namaSantri: nama.trim().toUpperCase(),
            kategoriDetail: kelasDiniyah,
            label: `Santri ${idx + 1}`
          });
        }
      });
    }

    // Step 8: MHQ
    if (!skippedSteps[8]) {
      mhqSantri.forEach((item, idx) => {
        if (item.nama && item.nama.trim()) {
          list.push({
            cabangId: 'mhq',
            cabangLomba: 'MHQ (Musabaqoh Hifdzil Qur\'an)',
            namaSantri: item.nama.trim().toUpperCase(),
            kategoriDetail: `${kelasDiniyah} (${item.juz})`,
            label: `Santri ${idx + 1} • Kategori ${item.juz}`,
            catatan: `Kategori Hafalan: ${item.juz}`
          });
        }
      });
    }

    // Step 9: Adzan
    if (!skippedSteps[9]) {
      adzanSantri.forEach((nama, idx) => {
        if (nama.trim()) {
          list.push({
            cabangId: 'adzan',
            cabangLomba: 'Adzan',
            namaSantri: nama.trim().toUpperCase(),
            kategoriDetail: kelasDiniyah,
            label: `Santri ${idx + 1}`
          });
        }
      });
    }

    // Step 10: CCM
    if (!skippedSteps[10]) {
      ccmRegu.forEach((regu, rIdx) => {
        const reguTitle = regu.namaRegu || `Regu ${rIdx + 1}`;
        if (regu.anggota1 && regu.anggota1.trim()) {
          list.push({
            cabangId: 'ccm',
            cabangLomba: 'CCM',
            namaSantri: regu.anggota1.trim().toUpperCase(),
            kategoriDetail: `${kelasDiniyah} (${reguTitle})`,
            label: `${reguTitle} • Anggota 1`,
            catatan: `${reguTitle} - Anggota 1`
          });
        }
        if (regu.anggota2 && regu.anggota2.trim()) {
          list.push({
            cabangId: 'ccm',
            cabangLomba: 'CCM',
            namaSantri: regu.anggota2.trim().toUpperCase(),
            kategoriDetail: `${kelasDiniyah} (${reguTitle})`,
            label: `${reguTitle} • Anggota 2`,
            catatan: `${reguTitle} - Anggota 2`
          });
        }
        if (regu.anggota3 && regu.anggota3.trim()) {
          list.push({
            cabangId: 'ccm',
            cabangLomba: 'CCM',
            namaSantri: regu.anggota3.trim().toUpperCase(),
            kategoriDetail: `${kelasDiniyah} (${reguTitle})`,
            label: `${reguTitle} • Anggota 3`,
            catatan: `${reguTitle} - Anggota 3`
          });
        }
      });
    }

    // Step 11: Kreasi Nadzom
    if (!skippedSteps[11] && kreasiNadzom.ketua.trim()) {
      list.push({
        cabangId: 'kreasi_nadzom',
        cabangLomba: 'Kreasi Nadzom',
        namaSantri: `${kreasiNadzom.ketua.trim().toUpperCase()} (Ketua Regu)`,
        kategoriDetail: `${kelasDiniyah} (${kreasiNadzom.jumlahAnggota ? `${kreasiNadzom.jumlahAnggota} Anggota` : 'Regu'})`,
        label: `Ketua Regu • ${kreasiNadzom.jumlahAnggota ? `${kreasiNadzom.jumlahAnggota} Anggota` : 'Regu'}`,
        catatan: `Ketua: ${kreasiNadzom.ketua.trim().toUpperCase()}, Jumlah Anggota: ${kreasiNadzom.jumlahAnggota || '-'}. ${kreasiNadzom.catatan || ''}`
      });
    }

    return list;
  };

  const allDelegates = compileAllDelegates();

  // Pengiriman Batch ke Database (Sekali Kirim)
  const handleSubmitAll = async () => {
    if (allDelegates.length === 0) {
      setFormError('Belum ada santri delegasi yang diisi di cabang lomba manapun. Harap isi minimal 1 santri.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const metadata = {
        waliKelas: waliInput.trim(),
        waliKelasId: selectedWaliId,
        tingkat: tingkat,
        tingkatName: tingkatName,
        kelasDiniyah: kelasDiniyah,
        nomorWA: nomorWA.trim(),
        jenisKelamin: jenisKelamin
      };

      const santriPayloadList = allDelegates.map(item => ({
        namaSantri: item.namaSantri,
        cabangLomba: item.cabangLomba,
        kelasKategori: item.kategoriDetail,
        catatan: item.catatan || '',
        jenisKelamin: jenisKelamin
      }));

      const result = await saveBatchRegistrations(santriPayloadList, metadata);

      // Hapus draft setelah berhasil terkirim
      sessionStorage.removeItem(STORAGE_DRAFT_KEY);

      if (onSubmitSuccess) {
        await onSubmitSuccess(result);
      }
    } catch (err) {
      setFormError('Terjadi kendala saat menyimpan pendaftaran. Silakan periksa koneksi dan coba kembali.');
      setIsSubmitting(false);
    }
  };

  // Helper Judul Langkah Aktif
  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Validasi Identitas Wali Kelas & Kelas Diniyah';
      case 2: return 'Musabaqoh Qiro\'atil Kutub (MQK)';
      case 3: return 'Lomba Pidato (3 Bahasa)';
      case 4: return 'Lomba MC / Pembawa Acara (3 Bahasa)';
      case 5: return 'Lomba Syarhil Qur\'an (Regu)';
      case 6: return 'Lomba Tilawah Al-Qur\'an';
      case 7: return 'Lomba Khot / Kaligrafi';
      case 8: return 'Musabaqoh Hifdzil Qur\'an (MHQ)';
      case 9: return 'Lomba Adzan';
      case 10: return 'Cerdas Cermat Musabaqoh (CCM)';
      case 11: return 'Lomba Kreasi Nadzom (Regu)';
      case 12: return 'Ringkasan & Pengiriman Delegasi Sekaligus';
      default: return 'Formulir Pendaftaran';
    }
  };

  const isPutriClass = jenisKelamin === 'P' || (kelasDiniyah || '').toLowerCase().includes('putri');

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4 py-2 sm:py-5 select-none font-sans">
      
      {/* Kartu Utama Formulir 12 Langkah */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden relative">
        
        {/* Garis Header Aksen Hijau Zamrud & Emas */}
        <div className="h-2 w-full bg-gradient-to-r from-[#075B45] via-[#D9B45B] to-[#075B45]"></div>

        {/* Top Bar Progress & Tombol Lewati di Atas Kanan */}
        <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#075B45] text-white text-[11px] font-bold">
                Langkah {currentStep} dari 12
              </span>
              {currentStep > 1 && kelasDiniyah && (
                <span className="text-[11px] font-bold text-slate-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full truncate">
                  Kelas Diniyah: {kelasDiniyah}
                </span>
              )}
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 mt-1 truncate">
              {getStepTitle()}
            </h2>
          </div>

          {/* Tombol Lewati di Atas Kanan (Hanya di langkah cabang 2 s.d. 11) */}
          {currentStep >= 2 && currentStep <= 11 && (
            <button
              type="button"
              onClick={handleSkipStep}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-50 active:bg-amber-100 text-slate-600 hover:text-amber-800 text-xs font-bold transition-all border border-slate-200 shrink-0 cursor-pointer shadow-2xs"
              title="Lewati cabang ini jika kelas tidak mengirimkan delegasi"
            >
              <span>Lewati</span>
              <FastForward className="w-3.5 h-3.5 text-amber-600" />
            </button>
          )}
        </div>

        {/* Progress Bar Indikator Visual */}
        <div className="w-full bg-slate-200 h-1.5">
          <div 
            className="bg-gradient-to-r from-[#075B45] to-[#D9B45B] h-1.5 transition-all duration-300"
            style={{ width: `${(currentStep / 12) * 100}%` }}
          ></div>
        </div>

        {/* Area Konten Form */}
        <div className="p-4 sm:p-7">
          
          {/* ========================================================= */}
          {/* LANGKAH 1: IDENTITAS WALI KELAS & KELAS DINIYAH           */}
          {/* ========================================================= */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start space-x-2.5 text-xs text-slate-700">
                <Info className="w-4 h-4 text-[#075B45] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Ketik atau pilih nama Ustadz / Ustadzah Wali Kelas. Jenjang tingkat dan <strong>Kelas Diniyah</strong> santri akan terdeteksi otomatis dari database.
                </p>
              </div>

              {/* Input Nama Wali Kelas dengan Dropdown Autocomplete */}
              <div className="space-y-1.5" ref={waliDropdownRef}>
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-[13px] font-bold text-slate-800 block">
                    Nama Ustadz / Ustadzah Wali Kelas <span className="text-rose-500">*</span>
                  </label>
                  {showSuggestions && suggestedWali.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {query.length > 0 ? `${suggestedWali.length} guru cocok` : `${suggestedWali.length} asatidz tersedia`}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <input
                    ref={waliInputRef}
                    type="text"
                    placeholder="Ketik atau pilih nama Ustadz / Ustadzah..."
                    value={waliInput}
                    onChange={(e) => {
                      setWaliInput(e.target.value);
                      setShowSuggestions(true);
                      setFormError('');
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onClick={() => setShowSuggestions(true)}
                    className="w-full pl-9 pr-9 py-3 rounded-2xl border border-slate-300 focus:border-[#075B45] focus:ring-4 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-semibold text-slate-900 bg-white shadow-2xs placeholder:text-slate-400 min-h-[46px]"
                  />

                  {waliInput && (
                    <button
                      type="button"
                      onClick={handleClearWali}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title="Hapus Nama"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {/* Floating Suggestions List */}
                  {showSuggestions && suggestedWali.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-56 overflow-y-auto animate-fadeIn">
                      <div className="px-3.5 py-1.5 bg-slate-50 border-b border-slate-100 text-[10.5px] font-bold text-slate-500 flex items-center justify-between">
                        <span>Daftar Wali Kelas Diniyah:</span>
                        <span className="text-[10px] text-slate-400">Pilih untuk validasi</span>
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
                              Kelas Diniyah: <span className="font-semibold text-slate-700">{guru.kelas}</span> • {(guru.tingkat || '').toUpperCase()}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg shrink-0">
                            Pilih
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* KOTAK NOTIFIKASI HIJAU: NAMA WALI KELAS TERVALIDASI */}
              {tingkat && kelasDiniyah && (
                <div className="p-3.5 sm:p-4 bg-emerald-50/90 border-2 border-emerald-400 rounded-2xl shadow-2xs space-y-2.5 animate-fadeIn">
                  <div className="flex items-center space-x-2 text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    <span className="text-xs sm:text-sm font-black tracking-tight">
                      Nama Wali Kelas Tervalidasi
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Jenjang Tingkat</span>
                      <span className="text-xs sm:text-sm font-black text-emerald-900 block truncate">{tingkatName || tingkat.toUpperCase()}</span>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Kelas Diniyah</span>
                      <span className="text-xs sm:text-sm font-black text-[#075B45] block truncate">{kelasDiniyah}</span>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Kategori Delegasi</span>
                      <span className="text-xs sm:text-sm font-black text-slate-800 block truncate">
                        {jenisKelamin === 'P' ? 'Santri Putri' : 'Santri Putra'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Input Nomor WhatsApp */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs sm:text-[13px] font-bold text-slate-800 block">
                  Nomor WhatsApp Wali Kelas <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={nomorWA}
                    onChange={(e) => {
                      setNomorWA(e.target.value);
                      setFormError('');
                    }}
                    className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-300 focus:border-[#075B45] focus:ring-4 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-semibold text-slate-900 bg-white shadow-2xs min-h-[46px]"
                  />
                </div>
                <p className="text-[10.5px] text-slate-400">
                  Untuk konfirmasi pemanggilan dan jadwal penampilan perlombaan.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* LANGKAH 2: MUSABAQOH QIRO'ATIL KUTUB (MQK)               */}
          {/* ========================================================= */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Cabang: Musabaqoh Qiro'atil Kutub (MQK)
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Maksimal 3 santri delegasi dari Kelas Diniyah {kelasDiniyah}. Boleh mengisi 1, 2, atau 3 kolom di bawah ini:
                </p>
              </div>

              <div className="space-y-3">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Nama Lengkap Santri {idx + 1} {idx === 0 ? '(Utama)' : '(Tambahan - Opsional)'}
                    </label>
                    <input
                      type="text"
                      placeholder={`Ketik nama lengkap santri ${idx + 1}...`}
                      value={mqkSantri[idx] || ''}
                      onChange={(e) => {
                        const updated = [...mqkSantri];
                        updated[idx] = e.target.value.toUpperCase();
                        setMqkSantri(updated);
                      }}
                      className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-4 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-2xs min-h-[44px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* LANGKAH 3: PIDATO (3 BAHASA)                             */}
          {/* ========================================================= */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Cabang: PIDATO (3 Pilihan Bahasa)
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Maksimal 3 santri delegasi. Tentukan pilihan bahasa (Indonesia, Arab, atau Inggris) untuk setiap santri:
                </p>
              </div>

              <div className="space-y-3.5">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="p-3 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Santri Delegasi {idx + 1}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        Pilihan Bahasa Wajib
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-7">
                        <input
                          type="text"
                          placeholder={`Nama lengkap santri ${idx + 1}...`}
                          value={pidatoSantri[idx]?.nama || ''}
                          onChange={(e) => {
                            const updated = [...pidatoSantri];
                            updated[idx] = { ...updated[idx], nama: e.target.value.toUpperCase() };
                            setPidatoSantri(updated);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-2xs min-h-[42px]"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <select
                          value={pidatoSantri[idx]?.bahasa || 'Bahasa Indonesia'}
                          onChange={(e) => {
                            const updated = [...pidatoSantri];
                            updated[idx] = { ...updated[idx], bahasa: e.target.value };
                            setPidatoSantri(updated);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-bold text-slate-800 bg-white shadow-2xs min-h-[42px] cursor-pointer"
                        >
                          {PILIHAN_BAHASA.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* LANGKAH 4: MC / PEMBAWA ACARA (3 BAHASA)                 */}
          {/* ========================================================= */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Cabang: MC / Pembawa Acara (3 Pilihan Bahasa)
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Maksimal 3 santri delegasi. Tentukan pilihan bahasa (Indonesia, Arab, atau Inggris) untuk setiap santri:
                </p>
              </div>

              <div className="space-y-3.5">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="p-3 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Santri Delegasi {idx + 1}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        Pilihan Bahasa MC
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-7">
                        <input
                          type="text"
                          placeholder={`Nama lengkap santri ${idx + 1}...`}
                          value={mcSantri[idx]?.nama || ''}
                          onChange={(e) => {
                            const updated = [...mcSantri];
                            updated[idx] = { ...updated[idx], nama: e.target.value.toUpperCase() };
                            setMcSantri(updated);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-2xs min-h-[42px]"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <select
                          value={mcSantri[idx]?.bahasa || 'Bahasa Indonesia'}
                          onChange={(e) => {
                            const updated = [...mcSantri];
                            updated[idx] = { ...updated[idx], bahasa: e.target.value };
                            setMcSantri(updated);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-bold text-slate-800 bg-white shadow-2xs min-h-[42px] cursor-pointer"
                        >
                          {PILIHAN_BAHASA.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* LANGKAH 5: SYARHIL QUR'AN (REGU + TOMBOL TAMBAH REGU)     */}
          {/* ========================================================= */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Cabang: Syarhil Qur'an (Per Regu)
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    1 Regu terdiri dari 3 santri: Pensyarah, Tilawah, dan Terjemah.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSyarhilRegu}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[#075B45] text-xs font-bold flex items-center space-x-1 shrink-0 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Regu</span>
                </button>
              </div>

              <div className="space-y-4">
                {syarhilRegu.map((regu, rIdx) => (
                  <div key={rIdx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-xs font-black text-[#075B45]">
                        {regu.namaRegu || `Regu ${rIdx + 1}`}
                      </span>
                      {syarhilRegu.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSyarhilRegu(rIdx)}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Regu</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          1. Nama Pensyarah (Pidato Isi)
                        </label>
                        <input
                          type="text"
                          placeholder="Nama lengkap pensyarah..."
                          value={regu.pensyarah || ''}
                          onChange={(e) => {
                            const updated = [...syarhilRegu];
                            updated[rIdx].pensyarah = e.target.value.toUpperCase();
                            setSyarhilRegu(updated);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-2xs min-h-[42px]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          2. Nama Qori' / Qori'ah (Tilawah)
                        </label>
                        <input
                          type="text"
                          placeholder="Nama lengkap tilawah..."
                          value={regu.tilawah || ''}
                          onChange={(e) => {
                            const updated = [...syarhilRegu];
                            updated[rIdx].tilawah = e.target.value.toUpperCase();
                            setSyarhilRegu(updated);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-2xs min-h-[42px]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          3. Nama Sari Tilawah / Terjemah
                        </label>
                        <input
                          type="text"
                          placeholder="Nama lengkap penerjemah..."
                          value={regu.terjemah || ''}
                          onChange={(e) => {
                            const updated = [...syarhilRegu];
                            updated[rIdx].terjemah = e.target.value.toUpperCase();
                            setSyarhilRegu(updated);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-2xs min-h-[42px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* LANGKAH 6: TILAWAH AL-QUR'AN                              */}
          {/* ========================================================= */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Cabang: Tilawah Al-Qur'an
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Maksimal 3 santri delegasi dari Kelas Diniyah {kelasDiniyah}:
                </p>
              </div>

              <div className="space-y-3">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Nama Lengkap Santri {idx + 1} {idx === 0 ? '(Utama)' : '(Tambahan - Opsional)'}
                    </label>
                    <input
                      type="text"
                      placeholder={`Ketik nama lengkap santri ${idx + 1}...`}
                      value={tilawahSantri[idx] || ''}
                      onChange={(e) => {
                        const updated = [...tilawahSantri];
                        updated[idx] = e.target.value.toUpperCase();
                        setTilawahSantri(updated);
                      }}
                      className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-4 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-2xs min-h-[44px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* LANGKAH 7: KHOT / KALIGRAFI                               */}
          {/* ========================================================= */}
          {currentStep === 7 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Cabang: Khot / Kaligrafi
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Maksimal 3 santri delegasi dari Kelas Diniyah {kelasDiniyah}:
                </p>
              </div>

              <div className="space-y-3">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Nama Lengkap Santri {idx + 1} {idx === 0 ? '(Utama)' : '(Tambahan - Opsional)'}
                    </label>
                    <input
                      type="text"
                      placeholder={`Ketik nama lengkap santri ${idx + 1}...`}
                      value={kaligrafiSantri[idx] || ''}
                      onChange={(e) => {
                        const updated = [...kaligrafiSantri];
                        updated[idx] = e.target.value.toUpperCase();
                        setKaligrafiSantri(updated);
                      }}
                      className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-4 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-2xs min-h-[44px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* LANGKAH 8: MHQ (MUSABAQOH HIFDZIL QUR'AN)                */}
          {/* ========================================================= */}
          {currentStep === 8 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Cabang: MHQ (Musabaqoh Hifdzil Qur'an)
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Maksimal 3 santri delegasi. Pilih kategori juz (5, 10, 15, 20, 25, atau 30 Juz) untuk tiap santri:
                </p>
              </div>

              <div className="space-y-3.5">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="p-3 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Santri Hafalan {idx + 1}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        Pilihan Kategori Juz
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-7">
                        <input
                          type="text"
                          placeholder={`Nama lengkap santri ${idx + 1}...`}
                          value={mhqSantri[idx]?.nama || ''}
                          onChange={(e) => {
                            const updated = [...mhqSantri];
                            updated[idx] = { ...updated[idx], nama: e.target.value.toUpperCase() };
                            setMhqSantri(updated);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-2xs min-h-[42px]"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <select
                          value={mhqSantri[idx]?.juz || '5 Juz'}
                          onChange={(e) => {
                            const updated = [...mhqSantri];
                            updated[idx] = { ...updated[idx], juz: e.target.value };
                            setMhqSantri(updated);
                          }}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-bold text-slate-800 bg-white shadow-2xs min-h-[42px] cursor-pointer"
                        >
                          {PILIHAN_JUZ_MHQ.map(j => (
                            <option key={j} value={j}>{j}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* LANGKAH 9: ADZAN (KHUSUS PUTRA)                          */}
          {/* ========================================================= */}
          {currentStep === 9 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Cabang: Lomba Adzan
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Maksimal 3 santri delegasi dari Kelas Diniyah {kelasDiniyah}:
                </p>
              </div>

              {/* Notifikasi jika kelas santri putri */}
              {isPutriClass && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Cabang lomba Adzan dikhususkan untuk <strong>Santri Putra</strong>. Untuk Kelas Diniyah Putri, silakan klik tombol <strong>"Lewati"</strong> di bagian kanan atas.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Nama Lengkap Santri {idx + 1} {idx === 0 ? '(Utama)' : '(Tambahan - Opsional)'}
                    </label>
                    <input
                      type="text"
                      placeholder={`Ketik nama lengkap santri ${idx + 1}...`}
                      value={adzanSantri[idx] || ''}
                      onChange={(e) => {
                        const updated = [...adzanSantri];
                        updated[idx] = e.target.value.toUpperCase();
                        setAdzanSantri(updated);
                      }}
                      className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-4 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-2xs min-h-[44px]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* LANGKAH 10: CERDAS CERMAT MUSABAQOH (CCM)                */}
          {/* ========================================================= */}
          {currentStep === 10 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Cabang: Cerdas Cermat Musabaqoh (CCM)
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    1 Regu terdiri dari 3 santri. Tersedia tombol Tambah Regu jika mengirim lebih dari 1 regu:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCcmRegu}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[#075B45] text-xs font-bold flex items-center space-x-1 shrink-0 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Regu</span>
                </button>
              </div>

              <div className="space-y-4">
                {ccmRegu.map((regu, rIdx) => (
                  <div key={rIdx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                      <span className="text-xs font-black text-[#075B45]">
                        {regu.namaRegu || `Regu ${rIdx + 1}`}
                      </span>
                      {ccmRegu.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCcmRegu(rIdx)}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Regu</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Nama Anggota 1 (Juru Bicara / Ketua Regu)
                        </label>
                        <input
                          type="text"
                          placeholder="Nama anggota 1..."
                          value={regu.anggota1 || ''}
                          onChange={(e) => {
                            const updated = [...ccmRegu];
                            updated[rIdx].anggota1 = e.target.value.toUpperCase();
                            setCcmRegu(updated);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-2xs min-h-[42px]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Nama Anggota 2
                        </label>
                        <input
                          type="text"
                          placeholder="Nama anggota 2..."
                          value={regu.anggota2 || ''}
                          onChange={(e) => {
                            const updated = [...ccmRegu];
                            updated[rIdx].anggota2 = e.target.value.toUpperCase();
                            setCcmRegu(updated);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-2xs min-h-[42px]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Nama Anggota 3
                        </label>
                        <input
                          type="text"
                          placeholder="Nama anggota 3..."
                          value={regu.anggota3 || ''}
                          onChange={(e) => {
                            const updated = [...ccmRegu];
                            updated[rIdx].anggota3 = e.target.value.toUpperCase();
                            setCcmRegu(updated);
                          }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-2xs min-h-[42px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* LANGKAH 11: KREASI NADZOM                                 */}
          {/* ========================================================= */}
          {currentStep === 11 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Cabang: Kreasi Nadzom (Per Regu)
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Isikan nama ketua tim / koordinator regu dan jumlah total anggota yang tampil:
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Nama Ketua / Koordinator Regu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nama lengkap ketua regu..."
                    value={kreasiNadzom.ketua || ''}
                    onChange={(e) => setKreasiNadzom(prev => ({ ...prev, ketua: e.target.value.toUpperCase() }))}
                    className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-4 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-bold text-slate-900 bg-white shadow-2xs min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Berapa Jumlah Anggota Regu? <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 6 orang, 8 orang, atau 10 orang"
                    value={kreasiNadzom.jumlahAnggota || ''}
                    onChange={(e) => setKreasiNadzom(prev => ({ ...prev, jumlahAnggota: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-semibold text-slate-900 bg-white shadow-2xs min-h-[42px]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Rincian Nama Anggota (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Tuliskan nama anggota regu jika diperlukan..."
                    value={kreasiNadzom.catatan || ''}
                    onChange={(e) => setKreasiNadzom(prev => ({ ...prev, catatan: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs text-slate-800 bg-white shadow-2xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* LANGKAH 12: RINGKASAN & KIRIM SEMUA SEKALIGUS            */}
          {/* ========================================================= */}
          {currentStep === 12 && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Header Rekap Rombel Kelas Diniyah */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    REKAPITULASI PENDAFTARAN KELAS
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-emerald-950">
                    Kelas Diniyah: {kelasDiniyah}
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Wali Kelas: <span className="font-bold">{waliInput}</span> • WA: {nomorWA}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl sm:text-2xl font-black text-[#075B45] block leading-none">
                    {allDelegates.length}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                    Total Santri
                  </span>
                </div>
              </div>

              {allDelegates.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    Belum ada santri yang diisi pada cabang lomba manapun
                  </p>
                  <p className="text-xs text-slate-500">
                    Silakan klik tombol "Sebelumnya" untuk mengisi nama delegasi santri.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
                    <span>Daftar Delegasi Santri per Cabang:</span>
                    <span className="text-emerald-700">{allDelegates.length} peserta siap didaftarkan</span>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto bg-white shadow-2xs">
                    {allDelegates.map((item, idx) => (
                      <div key={idx} className="p-3 hover:bg-slate-50/80 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-black text-slate-900 truncate">
                            {idx + 1}. {item.namaSantri}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            <span className="font-bold text-[#075B45]">{item.cabangLomba}</span> • {item.label}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full shrink-0">
                          Siap Kirim
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Ketentuan Pengiriman Sekali Kirim:</p>
                <p>Seluruh santri di atas akan langsung didaftarkan serentak ke database panitia dalam 1 kali kirim tanpa perlu mengisi ulang formulir.</p>
              </div>
            </div>
          )}

          {/* Form Error Alert */}
          {formError && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-tight font-medium">{formError}</span>
            </div>
          )}

          {/* Tombol Navigasi Bawah: SEBELUMNYA & BERIKUTNYA / KIRIM */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-6 gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isSubmitting}
                className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition-all cursor-pointer min-h-[44px] disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNextStep}
              disabled={isSubmitting || (currentStep === 1 && (!tingkat || !kelasDiniyah))}
              className={`ml-auto px-5 py-2.5 sm:px-7 sm:py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center space-x-2 transition-all cursor-pointer min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed ${
                currentStep === 12
                  ? 'bg-gradient-to-r from-[#075B45] to-[#054736] hover:from-[#054736] hover:to-[#033024] text-white border border-[#D9B45B]/50'
                  : 'bg-[#075B45] hover:bg-[#054736] text-white'
              }`}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center space-x-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Menyimpan Seluruh Delegasi...</span>
                </span>
              ) : currentStep === 1 ? (
                <>
                  <span>Lanjutkan ke Pengisian Delegasi</span>
                  <ArrowRight className="w-4 h-4 text-[#D9B45B]" />
                </>
              ) : currentStep === 12 ? (
                <>
                  <Send className="w-4 h-4 text-[#D9B45B]" />
                  <span>Kirim Semua Pendaftaran Sekaligus</span>
                </>
              ) : (
                <>
                  <span>Berikutnya</span>
                  <ArrowRight className="w-4 h-4 text-[#D9B45B]" />
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
