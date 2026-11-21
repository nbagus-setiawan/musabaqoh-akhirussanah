import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
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
  Layers,
  Award,
  ShieldCheck,
  X,
  ChevronRight,
  School,
  Calendar,
  LayoutGrid,
  ListChecks,
  ChevronDown,
  ChevronUp,
  AlertTriangle
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
import WhatsAppIcon from '../../shared/components/WhatsAppIcon';
import Swal from 'sweetalert2';

const STORAGE_DRAFT_KEY = 'alfalah_multistep_registration_draft_v3';

export default function RegistrationForm({ onSubmitSuccess }) {
  // State Master Data
  const [waliList, setWaliList] = useState(() => {
    const list = getWaliKelasList();
    return (Array.isArray(list) && list.length > 0) ? list : MASTER_WALI_KELAS;
  });
  const [tingkatList, setTingkatList] = useState(() => getTingkatList());
  const [subKelasData, setSubKelasData] = useState(() => getSubKelasByTingkat());

  // Tahapan Formulir: 'identity' | 'hub' | 'edit_branch' | 'review'
  const [formStage, setFormStage] = useState('identity');
  const [activeBranchId, setActiveBranchId] = useState('mqk');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TAHAP 1: Identitas Wali Kelas & Kelas Diniyah
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

  // DATA DELEGASI 10 CABANG LOMBA
  // 1. MQK (maks 3 santri)
  const [mqkSantri, setMqkSantri] = useState(['', '', '']);

  // 2. Pidato (maks 3 santri + pilihan 3 bahasa)
  const [pidatoSantri, setPidatoSantri] = useState([
    { nama: '', bahasa: 'Bahasa Indonesia' },
    { nama: '', bahasa: 'Bahasa Arab' },
    { nama: '', bahasa: 'Bahasa Inggris' }
  ]);

  // 3. MC (maks 3 santri + pilihan 3 bahasa)
  const [mcSantri, setMcSantri] = useState([
    { nama: '', bahasa: 'Bahasa Indonesia' },
    { nama: '', bahasa: 'Bahasa Arab' },
    { nama: '', bahasa: 'Bahasa Inggris' }
  ]);

  // 4. Syarhil Qur'an (Regu: Pensyarah, Tilawah, Terjemah)
  const [syarhilRegu, setSyarhilRegu] = useState([
    { namaRegu: 'Regu 1', pensyarah: '', tilawah: '', terjemah: '' }
  ]);

  // 5. Tilawah (maks 3 santri)
  const [tilawahSantri, setTilawahSantri] = useState(['', '', '']);

  // 6. Khot / Kaligrafi (maks 3 santri)
  const [kaligrafiSantri, setKaligrafiSantri] = useState(['', '', '']);

  // 7. MHQ (maks 3 santri + pilihan juz)
  const [mhqSantri, setMhqSantri] = useState([
    { nama: '', juz: '5 Juz' },
    { nama: '', juz: '10 Juz' },
    { nama: '', juz: '15 Juz' }
  ]);

  // 8. Adzan (maks 3 santri, khusus putra)
  const [adzanSantri, setAdzanSantri] = useState(['', '', '']);

  // 9. CCM (Cerdas Cermat Musabaqoh - Regu 3 orang)
  const [ccmRegu, setCcmRegu] = useState([
    { namaRegu: 'Regu 1', anggota1: '', anggota2: '', anggota3: '' }
  ]);

  // 10. Kreasi Nadzom (Ketua & Jumlah Anggota)
  const [kreasiNadzom, setKreasiNadzom] = useState({
    ketua: '',
    jumlahAnggota: '',
    catatan: ''
  });

  // 1. Muat Data Guru & Kelas Diniyah dari Google Sheets jika tersedia
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

  // 3. Muat draft tersimpan (dari localStorage / fallback sessionStorage) saat pertama kali buka
  useEffect(() => {
    try {
      let savedDraft = localStorage.getItem(STORAGE_DRAFT_KEY);
      if (!savedDraft) {
        savedDraft = sessionStorage.getItem('alfalah_multistep_draft_v2') || sessionStorage.getItem(STORAGE_DRAFT_KEY);
      }
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
        if (d.activeBranchId) setActiveBranchId(d.activeBranchId);
        if (d.formStage && d.formStage !== 'identity' && d.kelasDiniyah) {
          setFormStage(d.formStage);
        }
      }
    } catch (e) {}
  }, []);

  // 4. Autosave draft ke localStorage setiap ada perubahan data
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
        formStage,
        activeBranchId
      };
      localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(draftObj));
    } catch (e) {}
  }, [
    waliInput, selectedWaliId, tingkat, tingkatName, kelasDiniyah, jenisKelamin, nomorWA,
    mqkSantri, pidatoSantri, mcSantri, syarhilRegu, tilawahSantri, kaligrafiSantri,
    mhqSantri, adzanSantri, ccmRegu, kreasiNadzom, formStage, activeBranchId
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
    if (k.includes('sifir') || k.includes('jurumiyah') || k.includes('ula')) return 'ula';
    if (k.includes('imrithi') || k.includes('alfiyah') || k.includes('wustho')) return 'wustho';
    if (k.includes('juz') || k.includes('mhq')) return 'mhq_juz';
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

  const isPutriClass = jenisKelamin === 'P' || (kelasDiniyah || '').toLowerCase().includes('putri');

  // Kumpulkan Seluruh Delegasi Santri Aktif
  const allDelegates = useMemo(() => {
    const list = [];

    // 1. MQK
    mqkSantri.forEach((nama, idx) => {
      if (nama.trim()) {
        list.push({
          cabangId: 'mqk',
          cabangLomba: 'MQK',
          namaSantri: nama.trim().toUpperCase(),
          kelasDiniyah: kelasDiniyah,
          kategoriDetail: kelasDiniyah,
          detailCabang: 'Individu',
          label: `Santri ${idx + 1}`
        });
      }
    });

    // 2. PIDATO
    pidatoSantri.forEach((item, idx) => {
      if (item.nama && item.nama.trim()) {
        list.push({
          cabangId: 'pidato',
          cabangLomba: 'PIDATO',
          namaSantri: item.nama.trim().toUpperCase(),
          kelasDiniyah: kelasDiniyah,
          kategoriDetail: `${kelasDiniyah} (${item.bahasa})`,
          detailCabang: item.bahasa,
          label: `Santri ${idx + 1} • ${item.bahasa}`,
          catatan: `Bahasa: ${item.bahasa}`
        });
      }
    });

    // 3. MC
    mcSantri.forEach((item, idx) => {
      if (item.nama && item.nama.trim()) {
        list.push({
          cabangId: 'mc',
          cabangLomba: 'MC',
          namaSantri: item.nama.trim().toUpperCase(),
          kelasDiniyah: kelasDiniyah,
          kategoriDetail: `${kelasDiniyah} (${item.bahasa})`,
          detailCabang: item.bahasa,
          label: `Santri ${idx + 1} • ${item.bahasa}`,
          catatan: `Bahasa: ${item.bahasa}`
        });
      }
    });

    // 4. Syarhil Qur'an
    syarhilRegu.forEach((regu, rIdx) => {
      const reguTitle = regu.namaRegu || `Regu ${rIdx + 1}`;
      if (regu.pensyarah && regu.pensyarah.trim()) {
        list.push({
          cabangId: 'syarhil',
          cabangLomba: 'Syarhil Qur\'an',
          namaSantri: regu.pensyarah.trim().toUpperCase(),
          kelasDiniyah: kelasDiniyah,
          kategoriDetail: `${kelasDiniyah} (${reguTitle})`,
          detailCabang: reguTitle,
          label: `${reguTitle} • Pensyarah`,
          catatan: `${reguTitle} - Pensyarah`
        });
      }
      if (regu.tilawah && regu.tilawah.trim()) {
        list.push({
          cabangId: 'syarhil',
          cabangLomba: 'Syarhil Qur\'an',
          namaSantri: regu.tilawah.trim().toUpperCase(),
          kelasDiniyah: kelasDiniyah,
          kategoriDetail: `${kelasDiniyah} (${reguTitle})`,
          detailCabang: reguTitle,
          label: `${reguTitle} • Tilawah`,
          catatan: `${reguTitle} - Tilawah`
        });
      }
      if (regu.terjemah && regu.terjemah.trim()) {
        list.push({
          cabangId: 'syarhil',
          cabangLomba: 'Syarhil Qur\'an',
          namaSantri: regu.terjemah.trim().toUpperCase(),
          kelasDiniyah: kelasDiniyah,
          kategoriDetail: `${kelasDiniyah} (${reguTitle})`,
          detailCabang: reguTitle,
          label: `${reguTitle} • Terjemah`,
          catatan: `${reguTitle} - Terjemah`
        });
      }
    });

    // 5. Tilawah
    tilawahSantri.forEach((nama, idx) => {
      if (nama.trim()) {
        list.push({
          cabangId: 'tilawah',
          cabangLomba: 'Tilawah',
          namaSantri: nama.trim().toUpperCase(),
          kelasDiniyah: kelasDiniyah,
          kategoriDetail: kelasDiniyah,
          detailCabang: 'Individu',
          label: `Santri ${idx + 1}`
        });
      }
    });

    // 6. Khot / Kaligrafi
    kaligrafiSantri.forEach((nama, idx) => {
      if (nama.trim()) {
        list.push({
          cabangId: 'khot',
          cabangLomba: 'Khot / Kaligrafi',
          namaSantri: nama.trim().toUpperCase(),
          kelasDiniyah: kelasDiniyah,
          kategoriDetail: kelasDiniyah,
          detailCabang: 'Individu',
          label: `Santri ${idx + 1}`
        });
      }
    });

    // 7. MHQ
    mhqSantri.forEach((item, idx) => {
      if (item.nama && item.nama.trim()) {
        list.push({
          cabangId: 'mhq',
          cabangLomba: 'MHQ (Musabaqoh Hifdzil Qur\'an)',
          namaSantri: item.nama.trim().toUpperCase(),
          kelasDiniyah: kelasDiniyah,
          kategoriDetail: `${kelasDiniyah} (${item.juz})`,
          detailCabang: item.juz,
          label: `Santri ${idx + 1} • Kategori ${item.juz}`,
          catatan: `Kategori Hafalan: ${item.juz}`
        });
      }
    });

    // 8. Adzan
    if (!isPutriClass) {
      adzanSantri.forEach((nama, idx) => {
        if (nama.trim()) {
          list.push({
            cabangId: 'adzan',
            cabangLomba: 'Adzan',
            namaSantri: nama.trim().toUpperCase(),
            kelasDiniyah: kelasDiniyah,
            kategoriDetail: kelasDiniyah,
            detailCabang: 'Individu',
            label: `Santri ${idx + 1}`
          });
        }
      });
    }

    // 9. CCM
    ccmRegu.forEach((regu, rIdx) => {
      const reguTitle = regu.namaRegu || `Regu ${rIdx + 1}`;
      if (regu.anggota1 && regu.anggota1.trim()) {
        list.push({
          cabangId: 'ccm',
          cabangLomba: 'CCM',
          namaSantri: regu.anggota1.trim().toUpperCase(),
          kelasDiniyah: kelasDiniyah,
          kategoriDetail: `${kelasDiniyah} (${reguTitle})`,
          detailCabang: reguTitle,
          label: `${reguTitle} • Anggota 1`,
          catatan: `${reguTitle} - Anggota 1`
        });
      }
      if (regu.anggota2 && regu.anggota2.trim()) {
        list.push({
          cabangId: 'ccm',
          cabangLomba: 'CCM',
          namaSantri: regu.anggota2.trim().toUpperCase(),
          kelasDiniyah: kelasDiniyah,
          kategoriDetail: `${kelasDiniyah} (${reguTitle})`,
          detailCabang: reguTitle,
          label: `${reguTitle} • Anggota 2`,
          catatan: `${reguTitle} - Anggota 2`
        });
      }
      if (regu.anggota3 && regu.anggota3.trim()) {
        list.push({
          cabangId: 'ccm',
          cabangLomba: 'CCM',
          namaSantri: regu.anggota3.trim().toUpperCase(),
          kelasDiniyah: kelasDiniyah,
          kategoriDetail: `${kelasDiniyah} (${reguTitle})`,
          detailCabang: reguTitle,
          label: `${reguTitle} • Anggota 3`,
          catatan: `${reguTitle} - Anggota 3`
        });
      }
    });

    // 10. Kreasi Nadzom
    if (kreasiNadzom.ketua.trim()) {
      const reguTitle = kreasiNadzom.jumlahAnggota ? `${kreasiNadzom.jumlahAnggota} Anggota` : 'Regu';
      list.push({
        cabangId: 'kreasi_nadzom',
        cabangLomba: 'Kreasi Nadzom',
        namaSantri: `${kreasiNadzom.ketua.trim().toUpperCase()} (Ketua Regu)`,
        kelasDiniyah: kelasDiniyah,
        kategoriDetail: `${kelasDiniyah} (${reguTitle})`,
        detailCabang: reguTitle,
        label: `Ketua Regu • ${reguTitle}`,
        catatan: `Ketua: ${kreasiNadzom.ketua.trim().toUpperCase()}, Jumlah Anggota: ${kreasiNadzom.jumlahAnggota || '-'}. ${kreasiNadzom.catatan || ''}`
      });
    }

    return list;
  }, [
    mqkSantri, pidatoSantri, mcSantri, syarhilRegu, tilawahSantri, 
    kaligrafiSantri, mhqSantri, adzanSantri, ccmRegu, kreasiNadzom, 
    kelasDiniyah, isPutriClass
  ]);

  // Validasi Aturan Mutlak #2: Batas Maksimal 2 Lomba per Santri (Di luar CCM & Kreasi Nadzom)
  const studentParticipationMap = useMemo(() => {
    const map = {};
    allDelegates.forEach(item => {
      // Kecualikan CCM dan Kreasi Nadzom sesuai aturan panitia
      if (item.cabangId === 'ccm' || item.cabangId === 'kreasi_nadzom') return;
      const cleanName = item.namaSantri.replace(/\s*\(.*?\)\s*/g, '').trim().toUpperCase();
      if (!cleanName) return;
      if (!map[cleanName]) {
        map[cleanName] = [];
      }
      if (!map[cleanName].includes(item.cabangLomba)) {
        map[cleanName].push(item.cabangLomba);
      }
    });
    return map;
  }, [allDelegates]);

  // Santri yang melanggar batas >2 cabang lomba
  const ruleViolations = useMemo(() => {
    const violations = [];
    Object.entries(studentParticipationMap).forEach(([nama, cabangArr]) => {
      if (cabangArr.length > 2) {
        violations.push({
          nama,
          count: cabangArr.length,
          cabangList: cabangArr.join(', ')
        });
      }
    });
    return violations;
  }, [studentParticipationMap]);

  // Data Rangkuman Tiap Cabang Lomba untuk Kartu Hub
  const branchesHubData = useMemo(() => {
    return CABANG_LOMBA_LIST.map((c, index) => {
      let count = 0;
      let maxLimit = 3;
      let names = [];
      let isEligible = true;

      if (c.id === 'adzan' && isPutriClass) {
        isEligible = false;
      }

      switch (c.id) {
        case 'mqk':
          names = mqkSantri.filter(n => n.trim()).map(n => n.trim().toUpperCase());
          count = names.length;
          break;
        case 'pidato':
          names = pidatoSantri.filter(s => s.nama.trim()).map(s => `${s.nama.trim().toUpperCase()} (${s.bahasa})`);
          count = names.length;
          break;
        case 'mc':
          names = mcSantri.filter(s => s.nama.trim()).map(s => `${s.nama.trim().toUpperCase()} (${s.bahasa})`);
          count = names.length;
          break;
        case 'syarhil':
          maxLimit = syarhilRegu.length * 3;
          syarhilRegu.forEach((r, idx) => {
            const arr = [];
            if (r.pensyarah.trim()) arr.push(r.pensyarah.trim().toUpperCase());
            if (r.tilawah.trim()) arr.push(r.tilawah.trim().toUpperCase());
            if (r.terjemah.trim()) arr.push(r.terjemah.trim().toUpperCase());
            if (arr.length > 0) {
              names.push(`${r.namaRegu || `Regu ${idx + 1}`}: ${arr.join(', ')}`);
              count += arr.length;
            }
          });
          break;
        case 'tilawah':
          names = tilawahSantri.filter(n => n.trim()).map(n => n.trim().toUpperCase());
          count = names.length;
          break;
        case 'kaligrafi':
          names = kaligrafiSantri.filter(n => n.trim()).map(n => n.trim().toUpperCase());
          count = names.length;
          break;
        case 'mhq':
          names = mhqSantri.filter(s => s.nama.trim()).map(s => `${s.nama.trim().toUpperCase()} (${s.juz})`);
          count = names.length;
          break;
        case 'adzan':
          if (!isPutriClass) {
            names = adzanSantri.filter(n => n.trim()).map(n => n.trim().toUpperCase());
            count = names.length;
          }
          break;
        case 'ccm':
          maxLimit = ccmRegu.length * 3;
          ccmRegu.forEach((r, idx) => {
            const arr = [];
            if (r.anggota1.trim()) arr.push(r.anggota1.trim().toUpperCase());
            if (r.anggota2.trim()) arr.push(r.anggota2.trim().toUpperCase());
            if (r.anggota3.trim()) arr.push(r.anggota3.trim().toUpperCase());
            if (arr.length > 0) {
              names.push(`${r.namaRegu || `Regu ${idx + 1}`}: ${arr.join(', ')}`);
              count += arr.length;
            }
          });
          break;
        case 'kreasi_nadzom':
          maxLimit = 1;
          if (kreasiNadzom.ketua.trim()) {
            names = [`Ketua: ${kreasiNadzom.ketua.trim().toUpperCase()} (${kreasiNadzom.jumlahAnggota || '-'} Anggota)`];
            count = 1;
          }
          break;
        default:
          break;
      }

      return {
        ...c,
        orderNumber: index + 1,
        count,
        maxLimit,
        names,
        isEligible,
        isFilled: count > 0,
        isComplete: count >= (c.type === 'regu' ? 3 : maxLimit)
      };
    });
  }, [
    mqkSantri, pidatoSantri, mcSantri, syarhilRegu, tilawahSantri, 
    kaligrafiSantri, mhqSantri, adzanSantri, ccmRegu, kreasiNadzom, 
    isPutriClass
  ]);

  const totalFilledBranches = branchesHubData.filter(b => b.isFilled).length;

  const eligibleBranches = useMemo(() => {
    return branchesHubData.filter(b => b.isEligible);
  }, [branchesHubData]);

  const currentBranchIndex = eligibleBranches.findIndex(b => b.id === activeBranchId);
  const currentBranchNumber = currentBranchIndex >= 0 ? currentBranchIndex + 1 : 1;
  const totalEligibleBranches = eligibleBranches.length;

  // Validator status pengisian cabang aktif saat ini
  const currentBranchStatus = useMemo(() => {
    switch (activeBranchId) {
      case 'mqk': {
        const count = mqkSantri.filter(s => s.trim().length > 0).length;
        return {
          isFilled: count > 0,
          isPartial: false,
          count,
          message: count > 0
            ? `${count} santri terdaftar untuk cabang MQK.`
            : 'Wajib mengisi minimal 1 nama santri delegasi MQK, atau klik "Lewati Cabang" jika kelas tidak mengirim santri.'
        };
      }
      case 'pidato': {
        const count = pidatoSantri.filter(s => s.nama.trim().length > 0).length;
        return {
          isFilled: count > 0,
          isPartial: false,
          count,
          message: count > 0
            ? `${count} santri pidato terdaftar.`
            : 'Wajib mengisi minimal 1 nama santri pidato beserta bahasanya, atau klik "Lewati Cabang" jika tanpa delegasi.'
        };
      }
      case 'mc': {
        const count = mcSantri.filter(s => s.nama.trim().length > 0).length;
        return {
          isFilled: count > 0,
          isPartial: false,
          count,
          message: count > 0
            ? `${count} santri MC terdaftar.`
            : 'Wajib mengisi minimal 1 nama santri pembawa acara (MC), atau klik "Lewati Cabang" jika tanpa delegasi.'
        };
      }
      case 'syarhil': {
        const regu = syarhilRegu[0] || { pensyarah: '', tilawah: '', terjemah: '' };
        const p = regu.pensyarah.trim().length > 0;
        const t = regu.tilawah.trim().length > 0;
        const j = regu.terjemah.trim().length > 0;
        const filledFields = [p, t, j].filter(Boolean).length;
        if (filledFields === 3) {
          return {
            isFilled: true,
            isPartial: false,
            count: 3,
            message: 'Susunan Regu Syarhil Qur\'an (3 anggota) sudah lengkap.'
          };
        }
        if (filledFields > 0) {
          const missing = [];
          if (!p) missing.push('Pensyarah');
          if (!t) missing.push('Tilawah');
          if (!j) missing.push('Terjemah');
          return {
            isFilled: false,
            isPartial: true,
            count: filledFields,
            message: `Regu Syarhil belum lengkap (${filledFields} dari 3). Kurang: ${missing.join(', ')}.`
          };
        }
        return {
          isFilled: false,
          isPartial: false,
          count: 0,
          message: 'Wajib mengisi 3 anggota Regu Syarhil (Pensyarah, Tilawah, Terjemah), atau klik "Lewati Cabang".'
        };
      }
      case 'tilawah': {
        const count = tilawahSantri.filter(s => s.trim().length > 0).length;
        return {
          isFilled: count > 0,
          isPartial: false,
          count,
          message: count > 0
            ? `${count} santri tilawah terdaftar.`
            : 'Wajib mengisi minimal 1 nama santri tilawah, atau klik "Lewati Cabang" jika tanpa delegasi.'
        };
      }
      case 'kaligrafi': {
        const count = kaligrafiSantri.filter(s => s.trim().length > 0).length;
        return {
          isFilled: count > 0,
          isPartial: false,
          count,
          message: count > 0
            ? `${count} santri kaligrafi terdaftar.`
            : 'Wajib mengisi minimal 1 nama santri kaligrafi, atau klik "Lewati Cabang" jika tanpa delegasi.'
        };
      }
      case 'mhq': {
        const count = mhqSantri.filter(s => s.nama.trim().length > 0).length;
        return {
          isFilled: count > 0,
          isPartial: false,
          count,
          message: count > 0
            ? `${count} santri MHQ terdaftar.`
            : 'Wajib mengisi minimal 1 nama santri MHQ beserta kategori juz, atau klik "Lewati Cabang" jika tanpa delegasi.'
        };
      }
      case 'adzan': {
        if (isPutriClass) {
          return {
            isFilled: true,
            isPartial: false,
            count: 0,
            message: 'Cabang Adzan khusus untuk santri putra.'
          };
        }
        const count = adzanSantri.filter(s => s.trim().length > 0).length;
        return {
          isFilled: count > 0,
          isPartial: false,
          count,
          message: count > 0
            ? `${count} santri adzan terdaftar.`
            : 'Wajib mengisi minimal 1 nama santri adzan, atau klik "Lewati Cabang" jika tanpa delegasi.'
        };
      }
      case 'ccm': {
        const regu1 = ccmRegu[0] || { anggota1: '', anggota2: '', anggota3: '' };
        const a1 = regu1.anggota1.trim().length > 0;
        const a2 = regu1.anggota2.trim().length > 0;
        const a3 = regu1.anggota3.trim().length > 0;
        const r1Count = [a1, a2, a3].filter(Boolean).length;

        const hasRegu2 = ccmRegu.length > 1;
        let r2Count = 0;
        if (hasRegu2) {
          const regu2 = ccmRegu[1];
          r2Count = [
            regu2.anggota1.trim().length > 0,
            regu2.anggota2.trim().length > 0,
            regu2.anggota3.trim().length > 0
          ].filter(Boolean).length;
        }

        if (r1Count === 0 && (!hasRegu2 || r2Count === 0)) {
          return {
            isFilled: false,
            isPartial: false,
            count: 0,
            message: 'Wajib mengisi 3 anggota Regu CCM (Cerdas Cermat), atau klik "Lewati Cabang" jika tanpa delegasi.'
          };
        }

        if (r1Count > 0 && r1Count < 3) {
          return {
            isFilled: false,
            isPartial: true,
            count: r1Count,
            message: `Regu 1 CCM belum lengkap (${r1Count} dari 3 anggota). Wajib diisi 3 orang.`
          };
        }

        if (hasRegu2 && r2Count > 0 && r2Count < 3) {
          return {
            isFilled: false,
            isPartial: true,
            count: r1Count + r2Count,
            message: `Regu 2 CCM belum lengkap (${r2Count} dari 3 anggota). Wajib diisi 3 orang.`
          };
        }

        const totalRegu = (r1Count === 3 ? 1 : 0) + (r2Count === 3 ? 1 : 0);
        return {
          isFilled: true,
          isPartial: false,
          count: r1Count + r2Count,
          message: `Regu CCM (${totalRegu} regu) sudah terisi lengkap.`
        };
      }
      case 'kreasi_nadzom': {
        const hasKetua = kreasiNadzom.ketua.trim().length > 0;
        return {
          isFilled: hasKetua,
          isPartial: false,
          count: hasKetua ? 1 : 0,
          message: hasKetua
            ? 'Data Ketua Regu Kreasi Nadzom sudah terisi.'
            : 'Wajib mengisi nama Ketua Regu Kreasi Nadzom, atau klik "Lewati Cabang" jika tanpa delegasi.'
        };
      }
      default:
        return { isFilled: true, isPartial: false, count: 0, message: '' };
    }
  }, [
    activeBranchId, mqkSantri, pidatoSantri, mcSantri, syarhilRegu,
    tilawahSantri, kaligrafiSantri, mhqSantri, adzanSantri, ccmRegu,
    kreasiNadzom, isPutriClass
  ]);

  // Peringatan sebelum reload/tutup halaman jika ada isian formulir
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (allDelegates.length > 0 || (kelasDiniyah && formStage !== 'identity')) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [allDelegates.length, kelasDiniyah, formStage]);

  // Navigasi Aksi
  const handleProceedToHub = (e) => {
    if (e) e.preventDefault();
    setFormError('');

    if (!waliInput.trim() || !tingkat || !kelasDiniyah) {
      setFormError('Harap pilih nama Ustadz / Ustadzah dari daftar saran agar Kelas Diniyah tervalidasi.');
      return;
    }
    const cleanWA = nomorWA.replace(/\D/g, '');
    if (!cleanWA || cleanWA.length < 9) {
      setFormError('Nomor WhatsApp Wali Kelas wajib diisi minimal 9 digit.');
      return;
    }

    setFormStage('hub');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBranchEdit = (branchId) => {
    setFormError('');
    setActiveBranchId(branchId);
    setFormStage('edit_branch');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHub = () => {
    setFormError('');
    if (currentBranchStatus.isPartial) {
      setFormError('Isian cabang ini belum lengkap. Harap lengkapi anggota regu atau kosongkan terlebih dahulu sebelum kembali ke dasbor.');
      return;
    }
    setFormStage('hub');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextBranchInSequence = () => {
    setFormError('');
    if (!currentBranchStatus.isFilled) {
      setFormError('Harap lengkapi isian santri untuk cabang ini sebelum melanjutkan, atau klik "Lewati Cabang Ini (Tanpa Delegasi)".');
      return;
    }
    if (currentBranchIndex >= 0 && currentBranchIndex < eligibleBranches.length - 1) {
      setActiveBranchId(eligibleBranches[currentBranchIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setFormStage('hub');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSkipCurrentBranch = () => {
    handleClearCurrentBranch();
    setFormError('');
    if (currentBranchIndex >= 0 && currentBranchIndex < eligibleBranches.length - 1) {
      setActiveBranchId(eligibleBranches[currentBranchIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setFormStage('hub');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleProceedToReview = () => {
    setFormError('');
    if (allDelegates.length === 0) {
      setFormError('Belum ada santri delegasi yang diisi di cabang manapun. Harap isi minimal 1 cabang lomba.');
      return;
    }
    if (ruleViolations.length > 0) {
      setFormError(`Terdapat santri yang melebihi batas 2 cabang lomba (${ruleViolations.map(r => r.nama).join(', ')}). Harap sesuaikan sebelum mengirim.`);
      return;
    }
    setFormStage('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper Hapus/Kosongkan Seluruh Isian Cabang Tertentu
  const handleClearCurrentBranch = () => {
    switch (activeBranchId) {
      case 'mqk': setMqkSantri(['', '', '']); break;
      case 'pidato':
        setPidatoSantri([
          { nama: '', bahasa: 'Bahasa Indonesia' },
          { nama: '', bahasa: 'Bahasa Arab' },
          { nama: '', bahasa: 'Bahasa Inggris' }
        ]);
        break;
      case 'mc':
        setMcSantri([
          { nama: '', bahasa: 'Bahasa Indonesia' },
          { nama: '', bahasa: 'Bahasa Arab' },
          { nama: '', bahasa: 'Bahasa Inggris' }
        ]);
        break;
      case 'syarhil':
        setSyarhilRegu([{ namaRegu: 'Regu 1', pensyarah: '', tilawah: '', terjemah: '' }]);
        break;
      case 'tilawah': setTilawahSantri(['', '', '']); break;
      case 'kaligrafi': setKaligrafiSantri(['', '', '']); break;
      case 'mhq':
        setMhqSantri([
          { nama: '', juz: '5 Juz' },
          { nama: '', juz: '10 Juz' },
          { nama: '', juz: '15 Juz' }
        ]);
        break;
      case 'adzan': setAdzanSantri(['', '', '']); break;
      case 'ccm':
        setCcmRegu([{ namaRegu: 'Regu 1', anggota1: '', anggota2: '', anggota3: '' }]);
        break;
      case 'kreasi_nadzom':
        setKreasiNadzom({ ketua: '', jumlahAnggota: '', catatan: '' });
        break;
      default: break;
    }
  };

  // Pengiriman Kolektif Langsung ke Google Sheets
  const handleSubmitAll = async () => {
    if (allDelegates.length === 0) {
      setFormError('Belum ada delegasi yang didaftarkan. Harap isi minimal 1 santri.');
      return;
    }
    if (ruleViolations.length > 0) {
      setFormError('Tidak dapat mengirim: Masih terdapat santri yang mengikuti lebih dari 2 cabang lomba.');
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
        kelasDiniyah: kelasDiniyah,
        kelasKategori: kelasDiniyah,
        detailCabang: item.detailCabang || '',
        catatan: item.catatan || '',
        jenisKelamin: jenisKelamin
      }));

      const result = await saveBatchRegistrations(santriPayloadList, metadata);

      // Hapus draft lokal setelah sukses
      localStorage.removeItem(STORAGE_DRAFT_KEY);
      sessionStorage.removeItem(STORAGE_DRAFT_KEY);
      sessionStorage.removeItem('alfalah_multistep_draft_v2');

      if (onSubmitSuccess) {
        await onSubmitSuccess(result);
      }
    } catch (err) {
      setFormError('Terjadi kendala saat menyimpan data ke database. Silakan periksa koneksi dan coba lagi.');
      setIsSubmitting(false);
    }
  };

  // Helper validator partisipasi santri per baris input
  const getStudentCrossNotice = (studentName, currentBranchName) => {
    if (!studentName || !studentName.trim()) return null;
    const clean = studentName.replace(/\s*\(.*?\)\s*/g, '').trim().toUpperCase();
    const otherBranches = (studentParticipationMap[clean] || []).filter(b => b !== currentBranchName);
    if (otherBranches.length === 0) return null;
    if (otherBranches.length >= 2) {
      return {
        isDanger: true,
        text: `Peringatan: Santri ini sudah terdaftar di 2 cabang lain (${otherBranches.join(', ')}). Maksimal batas adalah 2 cabang lomba.`
      };
    }
    return {
      isDanger: false,
      text: `Info: Santri ini juga terdaftar di ${otherBranches.join(', ')} (1 dari maks. 2 lomba).`
    };
  };

  const activeBranchObj = CABANG_LOMBA_LIST.find(c => c.id === activeBranchId) || CABANG_LOMBA_LIST[0];

  return (
    <div className="max-w-3xl mx-auto px-3.5 sm:px-6 pt-2 sm:pt-4 pb-20 sm:pb-28 select-none font-sans space-y-4">
      
      {/* ========================================================= */}
      {/* STEP INDICATOR HEADER (MODERN SEGMENTED PILL BAR)         */}
      {/* ========================================================= */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="grid grid-cols-3 gap-1">
          
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => {
              setFormError('');
              setFormStage('identity');
            }}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              formStage === 'identity'
                ? 'bg-white text-[#075B45] shadow-xs font-bold'
                : kelasDiniyah
                ? 'text-[#075B45] hover:bg-white/60 font-semibold'
                : 'text-slate-600 hover:text-slate-800 font-semibold'
            }`}
          >
            <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
              formStage === 'identity'
                ? 'bg-[#075B45] text-white'
                : kelasDiniyah
                ? 'bg-emerald-100 text-[#075B45]'
                : 'bg-slate-200/90 text-slate-700'
            }`}>
              {kelasDiniyah ? <Check className="w-3 h-3 stroke-[3]" /> : '1'}
            </div>
            <span className="text-xs font-bold truncate">
              Identitas
            </span>
          </button>

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => {
              if (kelasDiniyah) {
                setFormError('');
                setFormStage('hub');
              }
            }}
            disabled={!kelasDiniyah}
            className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              !kelasDiniyah
                ? 'cursor-not-allowed text-slate-400 font-semibold'
                : 'cursor-pointer'
            } ${
              formStage === 'hub' || formStage === 'edit_branch'
                ? 'bg-white text-[#075B45] shadow-xs font-bold'
                : allDelegates.length > 0
                ? 'text-[#075B45] hover:bg-white/60 font-semibold'
                : 'text-slate-600 hover:text-slate-800 font-semibold'
            }`}
          >
            <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
              formStage === 'hub' || formStage === 'edit_branch'
                ? 'bg-[#075B45] text-white'
                : allDelegates.length > 0
                ? 'bg-emerald-100 text-[#075B45]'
                : 'bg-slate-200/90 text-slate-700'
            }`}>
              {allDelegates.length > 0 ? <Check className="w-3 h-3 stroke-[3]" /> : '2'}
            </div>
            <span className="text-xs font-bold truncate">
              Cabang {totalFilledBranches > 0 && <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-[#075B45]">({totalFilledBranches})</span>}
            </span>
          </button>

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => {
              if (allDelegates.length > 0) {
                setFormError('');
                setFormStage('review');
              }
            }}
            disabled={allDelegates.length === 0}
            className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              allDelegates.length === 0
                ? 'cursor-not-allowed text-slate-400 font-semibold'
                : 'cursor-pointer'
            } ${
              formStage === 'review'
                ? 'bg-white text-[#075B45] shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-800 font-semibold'
            }`}
          >
            <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
              formStage === 'review'
                ? 'bg-[#075B45] text-white'
                : 'bg-slate-200/90 text-slate-700'
            }`}>
              3
            </div>
            <span className="text-xs font-bold truncate">
              Kirim
            </span>
          </button>

        </div>
      </div>

      {/* Global Validation Error Banner */}
      {formError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-start space-x-2.5 animate-fadeIn shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-semibold">{formError}</span>
        </div>
      )}

      {/* Global Rule Violation Warning Banner (Batas 2 Lomba per Santri) */}
      {ruleViolations.length > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-2xl space-y-1 animate-fadeIn shadow-2xs">
          <div className="flex items-center space-x-2 font-bold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Peringatan Aturan Panitia: 1 Santri Maksimal 2 Cabang Lomba</span>
          </div>
          <p className="text-[11.5px] leading-relaxed">
            Ditemukan santri yang didaftarkan di lebih dari 2 cabang perlombaan (di luar CCM dan Kreasi Nadzom):
          </p>
          <ul className="list-disc pl-5 text-[11px] font-semibold space-y-0.5 pt-0.5 text-amber-900">
            {ruleViolations.map((v, idx) => (
              <li key={idx}>
                <strong>{v.nama}</strong>: terdaftar di {v.count} cabang ({v.cabangList})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAHAP 1: VALIDASI IDENTITAS WALI KELAS & KELAS DINIYAH    */}
      {/* ========================================================= */}
      {formStage === 'identity' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
          
          {/* Header Hijau Tua Resmi */}
          <div className="bg-[#075B45] text-white p-4 sm:p-5 border-b border-[#054736]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/20">
                <UserCheck className="w-5 h-5 text-[#D9B45B]" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Tahap 1: Identitas Wali Kelas & Kelas Diniyah
                </h1>
                <p className="text-[11px] sm:text-xs text-emerald-100/90 leading-relaxed mt-0.5">
                  Pilih nama Ustadz / Ustadzah pengampu kelas untuk memastikan delegasi terhubung resmi
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleProceedToHub} className="p-4 sm:p-6 space-y-5">
            
            {/* Input Pencarian Nama Wali Kelas */}
            <div className="space-y-1.5" ref={waliDropdownRef}>
              <div className="flex flex-wrap items-center justify-between gap-1.5 pb-0.5">
                <label className="text-xs sm:text-[13px] font-bold text-slate-800 inline-flex items-center gap-1">
                  <span>Nama Ustadz / Ustadzah</span>
                  <span className="whitespace-nowrap">Wali Kelas <span className="text-rose-500 font-bold">*</span></span>
                </label>
                {suggestedWali.length > 0 && (
                  <span className="text-[10px] sm:text-[10.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                    {query.length > 0 ? `${suggestedWali.length} guru` : `${suggestedWali.length} asatidz terdaftar`}
                  </span>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="w-4 h-4 text-[#075B45]" />
                </div>
                <input
                  ref={waliInputRef}
                  type="text"
                  placeholder="Cari atau ketik nama Wali Kelas..."
                  value={waliInput}
                  onChange={(e) => {
                    setWaliInput(e.target.value);
                    setShowSuggestions(true);
                    setFormError('');
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onClick={() => setShowSuggestions(true)}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl border border-slate-300 focus:border-[#075B45] focus:ring-4 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-semibold text-slate-900 bg-white shadow-2xs placeholder:text-slate-400 min-h-[46px]"
                />

                {waliInput && (
                  <button
                    type="button"
                    onClick={handleClearWali}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title="Hapus Nama"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Dropdown Saran Nama Guru */}
                {showSuggestions && suggestedWali.length > 0 && (
                  <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-60 overflow-y-auto animate-fadeIn">
                    <div className="px-3.5 py-1.5 bg-slate-50 border-b border-slate-100 text-[10.5px] font-bold text-slate-500 flex items-center justify-between">
                      <span>Pilih Nama Wali Kelas:</span>
                      <span className="text-[10px] text-slate-400">Klik untuk memilih</span>
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
                            Kelas Diniyah: <strong>{guru.kelas}</strong>
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                          (guru.kelas || '').toLowerCase().includes('putri')
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {(guru.kelas || '').toLowerCase().includes('putri') ? 'Putri' : 'Putra'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Kartu Konfirmasi Kelas Diniyah (Muncul Seketika Saat Guru Dipilih) */}
            {kelasDiniyah ? (
              <div className="p-3.5 sm:p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-3 animate-fadeIn shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-emerald-200/60">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-lg bg-[#075B45] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="text-xs font-bold text-[#075B45]">
                      Kelas Diniyah Terverifikasi Otomatis
                    </span>
                  </div>
                  <span className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isPutriClass 
                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                      : 'bg-emerald-100 text-[#075B45] border-emerald-200'
                  }`}>
                    {isPutriClass ? 'Kelas Santri Putri' : 'Kelas Santri Putra'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-150 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Kelas Diniyah</span>
                    <strong className="text-slate-900 text-xs sm:text-sm font-black block mt-0.5 truncate">{kelasDiniyah}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-150 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Jenjang Tingkat</span>
                    <strong className="text-slate-900 text-xs sm:text-sm font-black block mt-0.5 truncate">{tingkatName || tingkat}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-150 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Wali Kelas</span>
                    <strong className="text-slate-900 text-xs sm:text-sm font-bold block mt-0.5 truncate">{waliInput}</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-150 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Ketentuan Kuota</span>
                    <strong className="text-[#075B45] text-xs sm:text-sm font-black block mt-0.5 truncate">Maks. 3 / Cabang</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start space-x-2.5 text-xs text-slate-600">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p>
                  Silakan pilih nama Wali Kelas pada kolom di atas. Sistem akan mendeteksi jenjang tingkat dan nama <strong>Kelas Diniyah</strong> secara otomatis tanpa perlu diketik manual.
                </p>
              </div>
            )}

            {/* Input Nomor WhatsApp Wali Kelas */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-[13px] font-bold text-slate-800 inline-flex items-center gap-1">
                <span>Nomor WhatsApp</span>
                <span className="whitespace-nowrap">Wali Kelas <span className="text-rose-500 font-bold">*</span></span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <WhatsAppIcon variant="brand" className="w-4 h-4 shrink-0" />
                </div>
                <input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={nomorWA}
                  onChange={(e) => setNomorWA(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 focus:border-[#075B45] focus:ring-4 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-semibold text-slate-900 bg-white shadow-2xs placeholder:text-slate-400 min-h-[46px]"
                />
              </div>
              <p className="text-[10.5px] text-slate-500">
                Digunakan panitia untuk mengirimkan nomor undian resmi dan konfirmasi pemanggilan giliran tampil.
              </p>
            </div>

            {/* Tombol Lanjut ke Dasbor Cabang */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!kelasDiniyah || !nomorWA.trim() || nomorWA.replace(/\D/g, '').length < 9}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-xs transition-all ${
                  kelasDiniyah && nomorWA.replace(/\D/g, '').length >= 9
                    ? 'bg-[#075B45] hover:bg-[#054736] text-white cursor-pointer active:scale-98'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-75'
                }`}
              >
                <span>Lanjut ke Pemilihan Cabang Lomba</span>
                <ArrowRight className="w-4 h-4 text-[#D9B45B]" />
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAHAP 2: HUB / DASBOR CABANG LOMBA (BEBAS TEBAK-TEBAKAN!) */}
      {/* ========================================================= */}
      {formStage === 'hub' && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* Header Info Kelas & Ringkasan Partisipasi */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kelas Diniyah:</span>
                <span className="text-xs sm:text-sm font-black text-[#075B45]">{kelasDiniyah}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isPutriClass ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {isPutriClass ? 'Putri' : 'Putra'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Wali Kelas: <strong>{waliInput}</strong> • No. WA: {nomorWA}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setFormError('');
                setFormStage('identity');
              }}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
            >
              Ubah Data Kelas
            </button>
          </div>

          {/* Baris Status Progress Partisipasi Cabang */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-black text-slate-900">
                  {totalFilledBranches} dari 10 Cabang Terisi
                </span>
                <span className="text-[11px] font-bold text-[#075B45] bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  {allDelegates.length} Total Delegasi
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Klik kartu cabang lomba di bawah untuk mengisi atau memperbarui nama santri delegasi kelas Anda.
              </p>
            </div>

            <button
              type="button"
              onClick={handleProceedToReview}
              disabled={allDelegates.length === 0 || ruleViolations.length > 0}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all shrink-0 cursor-pointer ${
                allDelegates.length > 0 && ruleViolations.length === 0
                  ? 'bg-[#075B45] hover:bg-[#054736] text-white active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <span>Pratinjau & Kirim Data ({allDelegates.length})</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D9B45B]" />
            </button>
          </div>

          {/* Grid 10 Kartu Cabang Lomba */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
            {branchesHubData.map((branch) => {
              const isDisabled = !branch.isEligible;
              return (
                <div
                  key={branch.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    isDisabled
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : branch.isFilled
                        ? 'bg-white border-emerald-300 shadow-2xs hover:border-emerald-400'
                        : 'bg-white border-slate-200 hover:border-emerald-200 shadow-2xs'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header Kartu Cabang */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shrink-0 ${
                          branch.isFilled 
                            ? 'bg-[#075B45] text-[#D9B45B]' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {branch.orderNumber}
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                          {branch.name}
                        </h3>
                      </div>

                      {/* Badge Keterisian Kuota */}
                      {isDisabled ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                          Khusus Putra
                        </span>
                      ) : branch.isComplete ? (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0 flex items-center space-x-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Lengkap ({branch.count})</span>
                        </span>
                      ) : branch.isFilled ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 shrink-0">
                          Terisi ({branch.count}/{branch.maxLimit})
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                          Belum Terisi (0/{branch.maxLimit})
                        </span>
                      )}
                    </div>

                    {/* Deskripsi Singkat */}
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {branch.description}
                    </p>

                    {/* Daftar Nama Santri Terisi di Kartu ini */}
                    {branch.names.length > 0 && (
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Delegasi Terdaftar:</span>
                        {branch.names.map((n, i) => (
                          <div key={i} className="text-[11.5px] font-bold text-slate-800 truncate flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#075B45]"></span>
                            <span>{n}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tombol Aksi Masuk ke Form Cabang */}
                  <div className="pt-2 border-t border-slate-100">
                    {isDisabled ? (
                      <span className="text-[11px] text-slate-400 font-medium italic block text-center py-1">
                        Cabang ini tidak dibuka untuk kelas putri
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenBranchEdit(branch.id)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                          branch.isFilled
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-[#075B45] border border-emerald-200'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{branch.isFilled ? 'Ubah / Tambah Delegasi' : 'Isi Delegasi Cabang Ini'}</span>
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

          {/* Sticky Bottom Action Bar di HP & Desktop */}
          <div className="sticky bottom-2 z-20 bg-white/95 backdrop-blur-sm p-3 rounded-2xl border border-slate-200 shadow-lg flex items-center justify-between gap-3">
            <div className="text-xs text-slate-700">
              <span className="font-bold text-slate-900 block sm:inline">{allDelegates.length} Santri Terdaftar</span>
              <span className="text-slate-400 hidden sm:inline"> • </span>
              <span className="text-slate-500">{totalFilledBranches} cabang lomba</span>
            </div>

            <button
              type="button"
              onClick={handleProceedToReview}
              disabled={allDelegates.length === 0 || ruleViolations.length > 0}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 shadow-xs transition-all cursor-pointer ${
                allDelegates.length > 0 && ruleViolations.length === 0
                  ? 'bg-[#075B45] hover:bg-[#054736] text-white active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <span>Lanjut ke Pratinjau & Kirim</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D9B45B]" />
            </button>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAHAP 3: EDITOR KHUSUS CABANG YANG DIPILIH                */}
      {/* ========================================================= */}
      {formStage === 'edit_branch' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn space-y-0">
          
          {/* Header Editor Cabang */}
          <div className="bg-[#075B45] text-white p-3.5 sm:p-5 border-b border-[#054736] flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5 min-w-0 flex-1">
              <button
                type="button"
                onClick={handleBackToHub}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all shrink-0 cursor-pointer"
                title="Kembali ke Dasbor Cabang"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#D9B45B] block truncate">
                  Cabang {currentBranchNumber} dari {totalEligibleBranches} • {kelasDiniyah}
                </span>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  {activeBranchObj.fullName || activeBranchObj.name}
                </h2>
              </div>
            </div>

            {/* Indikator Langkah Ringkas di Kanan */}
            <div className="shrink-0 bg-white/10 px-2.5 py-1 rounded-xl text-[11px] font-bold text-emerald-100 border border-white/10">
              {currentBranchNumber} / {totalEligibleBranches}
            </div>
          </div>

          <div className="p-3.5 sm:p-5 space-y-4">
            
            {/* Box Petunjuk Cabang Ringkas */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start space-x-2 text-xs text-slate-700">
              <Info className="w-4 h-4 text-[#075B45] shrink-0 mt-0.5" />
              <p className="leading-relaxed text-slate-600 font-medium">
                {activeBranchObj.description}
              </p>
            </div>

            {/* FORM INPUT SESUAI TIPE CABANG */}
            {/* 1. MQK (Individu 3 Slot) */}
            {activeBranchId === 'mqk' && (
              <div className="space-y-3.5">
                {[0, 1, 2].map((idx) => {
                  const notice = getStudentCrossNotice(mqkSantri[idx], 'MQK');
                  return (
                    <div key={idx} className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 block">
                        Santri Delegasi #{idx + 1} {idx === 0 ? '(Utama)' : '(Cadangan / Delegasi Tambahan)'}
                      </label>
                      <input
                        type="text"
                        placeholder={`Ketik nama lengkap santri ${idx + 1}...`}
                        value={mqkSantri[idx]}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setMqkSantri(prev => {
                            const arr = [...prev];
                            arr[idx] = val;
                            return arr;
                          });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-semibold uppercase text-slate-900 bg-white"
                      />
                      {notice && (
                        <p className={`text-[11px] font-semibold ${notice.isDanger ? 'text-rose-600' : 'text-blue-600'}`}>
                          {notice.text}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. PIDATO (3 Bahasa) */}
            {activeBranchId === 'pidato' && (
              <div className="space-y-3.5">
                {pidatoSantri.map((item, idx) => {
                  const notice = getStudentCrossNotice(item.nama, 'PIDATO');
                  return (
                    <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Slot Pidato #{idx + 1}</span>
                        <select
                          value={item.bahasa}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPidatoSantri(prev => {
                              const arr = [...prev];
                              arr[idx] = { ...arr[idx], bahasa: val };
                              return arr;
                            });
                          }}
                          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-[#075B45] outline-none"
                        >
                          {PILIHAN_BAHASA.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder={`Nama santri pidato (${item.bahasa})...`}
                        value={item.nama}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setPidatoSantri(prev => {
                            const arr = [...prev];
                            arr[idx] = { ...arr[idx], nama: val };
                            return arr;
                          });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-semibold uppercase text-slate-900 bg-white"
                      />
                      {notice && (
                        <p className={`text-[11px] font-semibold ${notice.isDanger ? 'text-rose-600' : 'text-blue-600'}`}>
                          {notice.text}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 3. MC (3 Bahasa) */}
            {activeBranchId === 'mc' && (
              <div className="space-y-3.5">
                {mcSantri.map((item, idx) => {
                  const notice = getStudentCrossNotice(item.nama, 'MC');
                  return (
                    <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Slot MC #{idx + 1}</span>
                        <select
                          value={item.bahasa}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMcSantri(prev => {
                              const arr = [...prev];
                              arr[idx] = { ...arr[idx], bahasa: val };
                              return arr;
                            });
                          }}
                          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-[#075B45] outline-none"
                        >
                          {PILIHAN_BAHASA.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder={`Nama santri pembawa acara (${item.bahasa})...`}
                        value={item.nama}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setMcSantri(prev => {
                            const arr = [...prev];
                            arr[idx] = { ...arr[idx], nama: val };
                            return arr;
                          });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-semibold uppercase text-slate-900 bg-white"
                      />
                      {notice && (
                        <p className={`text-[11px] font-semibold ${notice.isDanger ? 'text-rose-600' : 'text-blue-600'}`}>
                          {notice.text}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4. SYARHIL QUR'AN (Beregu) */}
            {activeBranchId === 'syarhil' && (
              <div className="space-y-4">
                {syarhilRegu.map((regu, rIdx) => (
                  <div key={rIdx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">
                        {regu.namaRegu || `Regu ${rIdx + 1}`} (3 Anggota)
                      </span>
                      {syarhilRegu.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSyarhilRegu(prev => prev.filter((_, i) => i !== rIdx))}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          Hapus Regu Ini
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block">1. Pensyarah (Orator):</label>
                        <input
                          type="text"
                          placeholder="Nama lengkap pensyarah..."
                          value={regu.pensyarah}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setSyarhilRegu(prev => {
                              const arr = [...prev];
                              arr[rIdx] = { ...arr[rIdx], pensyarah: val };
                              return arr;
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs uppercase font-semibold bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block">2. Tilawah (Qori / Qoriah):</label>
                        <input
                          type="text"
                          placeholder="Nama lengkap tilawah..."
                          value={regu.tilawah}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setSyarhilRegu(prev => {
                              const arr = [...prev];
                              arr[rIdx] = { ...arr[rIdx], tilawah: val };
                              return arr;
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs uppercase font-semibold bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block">3. Terjemah (Sari Tilawah):</label>
                        <input
                          type="text"
                          placeholder="Nama lengkap terjemah..."
                          value={regu.terjemah}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setSyarhilRegu(prev => {
                              const arr = [...prev];
                              arr[rIdx] = { ...arr[rIdx], terjemah: val };
                              return arr;
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs uppercase font-semibold bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {syarhilRegu.length < 2 && (
                  <button
                    type="button"
                    onClick={() => setSyarhilRegu(prev => [...prev, { namaRegu: `Regu ${prev.length + 1}`, pensyarah: '', tilawah: '', terjemah: '' }])}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#075B45]/40 text-[#075B45] font-bold text-xs hover:bg-emerald-50 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Regu Syarhil 2</span>
                  </button>
                )}
              </div>
            )}

            {/* 5. TILAWAH */}
            {activeBranchId === 'tilawah' && (
              <div className="space-y-3.5">
                {[0, 1, 2].map((idx) => {
                  const notice = getStudentCrossNotice(tilawahSantri[idx], 'Tilawah');
                  return (
                    <div key={idx} className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 block">
                        Santri Tilawah #{idx + 1}
                      </label>
                      <input
                        type="text"
                        placeholder={`Ketik nama lengkap santri tilawah ${idx + 1}...`}
                        value={tilawahSantri[idx]}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setTilawahSantri(prev => {
                            const arr = [...prev];
                            arr[idx] = val;
                            return arr;
                          });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-semibold uppercase text-slate-900 bg-white"
                      />
                      {notice && (
                        <p className={`text-[11px] font-semibold ${notice.isDanger ? 'text-rose-600' : 'text-blue-600'}`}>
                          {notice.text}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 6. KHOT / KALIGRAFI */}
            {activeBranchId === 'kaligrafi' && (
              <div className="space-y-3.5">
                {[0, 1, 2].map((idx) => {
                  const notice = getStudentCrossNotice(kaligrafiSantri[idx], 'Khot / Kaligrafi');
                  return (
                    <div key={idx} className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 block">
                        Santri Khot / Kaligrafi #{idx + 1}
                      </label>
                      <input
                        type="text"
                        placeholder={`Ketik nama lengkap santri kaligrafi ${idx + 1}...`}
                        value={kaligrafiSantri[idx]}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setKaligrafiSantri(prev => {
                            const arr = [...prev];
                            arr[idx] = val;
                            return arr;
                          });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-semibold uppercase text-slate-900 bg-white"
                      />
                      {notice && (
                        <p className={`text-[11px] font-semibold ${notice.isDanger ? 'text-rose-600' : 'text-blue-600'}`}>
                          {notice.text}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 7. MHQ (Musabaqoh Hifdzil Qur'an) */}
            {activeBranchId === 'mhq' && (
              <div className="space-y-3.5">
                {mhqSantri.map((item, idx) => {
                  const notice = getStudentCrossNotice(item.nama, 'MHQ (Musabaqoh Hifdzil Qur\'an)');
                  return (
                    <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Slot MHQ #{idx + 1}</span>
                        <select
                          value={item.juz}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMhqSantri(prev => {
                              const arr = [...prev];
                              arr[idx] = { ...arr[idx], juz: val };
                              return arr;
                            });
                          }}
                          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-[#075B45] outline-none"
                        >
                          {PILIHAN_JUZ_MHQ.map(j => (
                            <option key={j} value={j}>{j}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        placeholder={`Nama santri hafalan (${item.juz})...`}
                        value={item.nama}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setMhqSantri(prev => {
                            const arr = [...prev];
                            arr[idx] = { ...arr[idx], nama: val };
                            return arr;
                          });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-semibold uppercase text-slate-900 bg-white"
                      />
                      {notice && (
                        <p className={`text-[11px] font-semibold ${notice.isDanger ? 'text-rose-600' : 'text-blue-600'}`}>
                          {notice.text}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 8. ADZAN (Khusus Putra) */}
            {activeBranchId === 'adzan' && !isPutriClass && (
              <div className="space-y-3.5">
                {[0, 1, 2].map((idx) => {
                  const notice = getStudentCrossNotice(adzanSantri[idx], 'Adzan');
                  return (
                    <div key={idx} className="space-y-1">
                      <label className="text-xs font-bold text-slate-800 block">
                        Santri Adzan #{idx + 1}
                      </label>
                      <input
                        type="text"
                        placeholder={`Ketik nama santri adzan ${idx + 1}...`}
                        value={adzanSantri[idx]}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setAdzanSantri(prev => {
                            const arr = [...prev];
                            arr[idx] = val;
                            return arr;
                          });
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-semibold uppercase text-slate-900 bg-white"
                      />
                      {notice && (
                        <p className={`text-[11px] font-semibold ${notice.isDanger ? 'text-rose-600' : 'text-blue-600'}`}>
                          {notice.text}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 9. CCM (Beregu 3 Orang) */}
            {activeBranchId === 'ccm' && (
              <div className="space-y-4">
                {ccmRegu.map((regu, rIdx) => (
                  <div key={rIdx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">
                        {regu.namaRegu || `Regu ${rIdx + 1}`} (3 Anggota)
                      </span>
                      {ccmRegu.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setCcmRegu(prev => prev.filter((_, i) => i !== rIdx))}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          Hapus Regu Ini
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block">Anggota 1:</label>
                        <input
                          type="text"
                          placeholder="Nama lengkap anggota 1..."
                          value={regu.anggota1}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setCcmRegu(prev => {
                              const arr = [...prev];
                              arr[rIdx] = { ...arr[rIdx], anggota1: val };
                              return arr;
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs uppercase font-semibold bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block">Anggota 2:</label>
                        <input
                          type="text"
                          placeholder="Nama lengkap anggota 2..."
                          value={regu.anggota2}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setCcmRegu(prev => {
                              const arr = [...prev];
                              arr[rIdx] = { ...arr[rIdx], anggota2: val };
                              return arr;
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs uppercase font-semibold bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block">Anggota 3:</label>
                        <input
                          type="text"
                          placeholder="Nama lengkap anggota 3..."
                          value={regu.anggota3}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setCcmRegu(prev => {
                              const arr = [...prev];
                              arr[rIdx] = { ...arr[rIdx], anggota3: val };
                              return arr;
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs uppercase font-semibold bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {ccmRegu.length < 2 && (
                  <button
                    type="button"
                    onClick={() => setCcmRegu(prev => [...prev, { namaRegu: `Regu ${prev.length + 1}`, anggota1: '', anggota2: '', anggota3: '' }])}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#075B45]/40 text-[#075B45] font-bold text-xs hover:bg-emerald-50 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Regu CCM 2</span>
                  </button>
                )}
              </div>
            )}

            {/* 10. KREASI NADZOM */}
            {activeBranchId === 'kreasi_nadzom' && (
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Nama Ketua Regu / Tim Kreasi Nadzom <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nama ketua kelompok..."
                    value={kreasiNadzom.ketua}
                    onChange={(e) => setKreasiNadzom(prev => ({ ...prev, ketua: e.target.value.toUpperCase() }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-semibold uppercase text-slate-900 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Estimasi Jumlah Total Anggota Regu
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 12 santri"
                    value={kreasiNadzom.jumlahAnggota}
                    onChange={(e) => setKreasiNadzom(prev => ({ ...prev, jumlahAnggota: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-semibold text-slate-900 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">
                    Catatan Judul Nadzom / Instrumen Tambahan
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Nadzom Imrithi Bab Kalam, iringan hadroh..."
                    value={kreasiNadzom.catatan}
                    onChange={(e) => setKreasiNadzom(prev => ({ ...prev, catatan: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#075B45] focus:ring-2 focus:ring-[#075B45]/15 outline-none text-xs sm:text-sm font-semibold text-slate-900 bg-white resize-none"
                  />
                </div>
              </div>
            )}

            {/* Box Status Validasi Ringkas */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition-colors ${
              currentBranchStatus.isFilled
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : currentBranchStatus.isPartial
                ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center space-x-2 min-w-0">
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${
                  currentBranchStatus.isFilled 
                    ? 'bg-emerald-600 text-white' 
                    : currentBranchStatus.isPartial
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-300 text-slate-700'
                }`}>
                  {currentBranchStatus.isFilled ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <Info className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate">
                    {currentBranchStatus.isFilled 
                      ? `${currentBranchStatus.count} Delegasi Terisi (Lengkap)` 
                      : currentBranchStatus.isPartial 
                      ? 'Perhatian: Anggota Belum Lengkap' 
                      : 'Belum Ada Isian Delegasi'}
                  </span>
                  <p className="text-[10.5px] text-slate-500 truncate">
                    {currentBranchStatus.message}
                  </p>
                </div>
              </div>

              {currentBranchStatus.count > 0 && (
                <button
                  type="button"
                  onClick={handleClearCurrentBranch}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 shrink-0 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Tombol Aksi Navigasi Editor Cabang */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentBranchStatus.isFilled ? (
                  <button
                    type="button"
                    onClick={handleNextBranchInSequence}
                    className="w-full py-3 px-4 rounded-xl bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <span>Lanjut ke Cabang Berikutnya</span>
                    <ArrowRight className="w-4 h-4 text-[#D9B45B]" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSkipCurrentBranch}
                    className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <span>Lewati Cabang Ini (Tanpa Delegasi)</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleBackToHub}
                  disabled={currentBranchStatus.isPartial}
                  className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-1.5 border ${
                    currentBranchStatus.isPartial
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                      : 'bg-white hover:bg-emerald-50/50 text-[#075B45] border-emerald-200/80 cursor-pointer'
                  }`}
                >
                  <span>Simpan & Kembali ke Dasbor</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAHAP 4: PRATINJAU AKHIR & PENGIRIMAN KOLEKTIF            */}
      {/* ========================================================= */}
      {formStage === 'review' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn space-y-0">
          
          {/* Header Hijau Tua Resmi */}
          <div className="bg-[#075B45] text-white p-4 sm:p-5 border-b border-[#054736]">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/20">
                <Send className="w-5 h-5 text-[#D9B45B]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Pratinjau & Konfirmasi Pendaftaran
                </h1>
                <p className="text-[11px] sm:text-xs text-emerald-100/90 leading-tight mt-0.5 truncate">
                  Periksa seluruh data delegasi sebelum dikirim ke database panitia
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 sm:p-6 space-y-4">
            
            {/* Rangkuman Metadata Kelas */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Kelas Diniyah Terdaftar</span>
                  <p className="font-black text-slate-900 text-sm sm:text-base">{kelasDiniyah}</p>
                </div>
                <span className="text-[11px] font-black text-[#075B45] bg-white border border-emerald-200 px-3 py-1 rounded-xl shadow-2xs shrink-0">
                  {allDelegates.length} Santri Delegasi
                </span>
              </div>
              
              <div className="pt-2 border-t border-emerald-200/60 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="text-slate-400 text-[11px]">Wali Kelas:</span>
                  <strong className="text-slate-800 truncate">{waliInput}</strong>
                </div>
                <div className="flex items-center space-x-1.5 truncate">
                  <WhatsAppIcon variant="brand" className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-slate-400 text-[11px]">Nomor WhatsApp:</span>
                  <strong className="text-[#075B45] font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">{nomorWA}</strong>
                </div>
              </div>
            </div>

            {/* Daftar Rincian Delegasi per Cabang Lomba */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 pt-1">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                  Rincian Delegasi ({totalFilledBranches} Cabang)
                </h3>
                <button
                  type="button"
                  onClick={() => setFormStage('hub')}
                  className="text-[11px] sm:text-xs font-bold text-[#075B45] hover:text-[#054736] bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 px-2.5 py-1 rounded-xl shrink-0 flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Ubah Cabang</span>
                </button>
              </div>

              <div className="space-y-2">
                {branchesHubData.filter(b => b.isFilled).map((branch) => (
                  <div key={branch.id} className="p-3 sm:p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="w-5 h-5 rounded-lg bg-emerald-100 text-[#075B45] text-[10.5px] font-black flex items-center justify-center shrink-0">
                          {branch.orderNumber}
                        </span>
                        <strong className="text-xs font-bold text-slate-900 truncate">{branch.name}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenBranchEdit(branch.id)}
                        className="text-[11px] font-bold text-[#075B45] hover:text-[#054736] bg-slate-50 hover:bg-emerald-50 px-2 py-0.5 rounded-lg border border-slate-200/80 transition-colors shrink-0 flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="space-y-1 pl-7">
                      {branch.names.map((n, i) => (
                        <div key={i} className="text-xs text-slate-700 flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#075B45] shrink-0"></span>
                          <span className="font-semibold text-slate-800">{n}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist Pernyataan Kebenaran Data */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Ketentuan Resmi Panitia:</p>
              <p className="leading-relaxed">
                Data yang dikirimkan akan langsung tersimpan ke Google Sheets panitia. Santri yang didaftarkan wajib mematuhi ketentuan tata tertib dan hadir saat pemanggilan nomor urut undian perlombaan.
              </p>
            </div>

            {/* Tombol Aksi Final: Kirim Kolektif & Kembali ke Dasbor */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <button
                type="button"
                onClick={handleSubmitAll}
                disabled={isSubmitting || allDelegates.length === 0 || ruleViolations.length > 0}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer min-h-[46px] ${
                  allDelegates.length > 0 && ruleViolations.length === 0
                    ? 'bg-[#075B45] hover:bg-[#054736] text-white active:scale-98'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Menyimpan ke Google Sheets...</span>
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#D9B45B]" />
                    <span>Kirim Pendaftaran Kolektif ({allDelegates.length} Santri)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFormStage('hub')}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer border border-slate-200 hover:bg-slate-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Dasbor Cabang</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
