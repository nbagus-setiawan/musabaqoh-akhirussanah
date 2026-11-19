// Layanan Integrasi Database Google Sheets via Code.gs (Direct API & .env)
// Musabaqah Akhirussanah YPPS Pondok Pesantren Al-Falah Putak

import { 
  MASTER_WALI_KELAS, 
  TINGKAT_LIST, 
  SUB_KELAS_BY_TINGKAT,
  SKEMA_POIN_JUARA,
  getGenderFromKelas
} from '../data/competitions';

// Kunci penyimpanan sesi
const STORAGE_KEY = 'akhirusanah_registrations_v2';
const WALI_KELAS_KEY = 'akhirusanah_ustadz_v2';
const SUB_KELAS_KEY = 'akhirusanah_kelas_v2';
const ACTIVITY_LOGS_KEY = 'akhirusanah_activity_logs_v2';
const JUARA_KEY = 'akhirusanah_juara_v2';

// URL Google Apps Script dari .env (VITE_GAS_URL)
export const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbyg6odSPbv_pqXFD2qPTUROwooyWWmZ9N4Y4SZRAtfiBDb7FlKcy7cuIwVqiSFpXJSt/exec';

export const getStoredGasUrl = () => {
  return import.meta.env.VITE_GAS_URL || localStorage.getItem('akhirusanah_gas_url') || DEFAULT_GAS_URL;
};

export const setStoredGasUrl = (url) => {
  localStorage.setItem('akhirusanah_gas_url', url ? url.trim() : DEFAULT_GAS_URL);
};

export const getAdminPin = () => {
  return localStorage.getItem('akhirusanah_admin_pin') || 'admin123';
};

export const setAdminPin = (pin) => {
  localStorage.setItem('akhirusanah_admin_pin', pin);
};

// =========================================================================
// REAL-TIME BROADCAST ENGINE (Sinkronisasi Antar Tab Peramban)
// =========================================================================
const BROADCAST_CHANNEL_NAME = 'alfalah_realtime_sync_v2';
let syncChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  syncChannel = null;
}

export const notifyDataChanged = (type = 'registrations', payload = null) => {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent('alfalah_data_changed', { detail: { type, payload, timestamp: Date.now() } }));

  if (syncChannel) {
    try {
      syncChannel.postMessage({ type, payload, timestamp: Date.now() });
    } catch (e) {}
  }
};

export const subscribeDataChanged = (callback) => {
  if (typeof window === 'undefined') return () => {};

  const handleCustom = (e) => {
    if (callback) callback(e.detail || { type: 'registrations' });
  };
  const handleBroadcast = (e) => {
    if (callback) callback(e.data || { type: 'registrations' });
  };

  window.addEventListener('alfalah_data_changed', handleCustom);
  if (syncChannel) {
    syncChannel.addEventListener('message', handleBroadcast);
  }

  return () => {
    window.removeEventListener('alfalah_data_changed', handleCustom);
    if (syncChannel) {
      syncChannel.removeEventListener('message', handleBroadcast);
    }
  };
};

// =========================================================================
// 1. DATA PENDAFTARAN SANTRI (SHEET: Pendaftaran)
// =========================================================================

export const getLocalRegistrations = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Mengambil seluruh data santri langsung dari Google Sheets tab Pendaftaran
 */
export const fetchRegistrations = async (forceRemote = true) => {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) return getLocalRegistrations();

  try {
    const url = gasUrl.includes('?') ? `${gasUrl}&action=get_all` : `${gasUrl}?action=get_all`;
    const resp = await fetch(url, { method: 'GET' });
    if (resp.ok) {
      const result = await resp.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
        return result.data;
      }
    }
  } catch (err) {
    console.warn('Koneksi Google Sheets gagal saat fetchRegistrations, menggunakan cadangan lokal:', err);
  }

  return getLocalRegistrations();
};

export const syncRemoteRegistrationsSilently = async () => {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) return;

  try {
    const url = gasUrl.includes('?') ? `${gasUrl}&action=get_all` : `${gasUrl}?action=get_all`;
    const resp = await fetch(url, { method: 'GET' });
    if (resp.ok) {
      const result = await resp.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        const local = getLocalRegistrations();
        if (JSON.stringify(result.data) !== JSON.stringify(local)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
          notifyDataChanged('registrations', result.data);
        }
      }
    }
  } catch (e) {}
};

/**
 * Simpan Pendaftaran Santri Baru Langsung ke Google Sheets
 */
export const saveRegistration = async (formData) => {
  const currentList = getLocalRegistrations();
  const nextNum = currentList.length + 1;
  const idPendaftaran = `AKH-${String(nextNum).padStart(3, '0')}`;
  
  const now = new Date();
  const timestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const newEntry = {
    Timestamp: timestamp,
    Wali_Kelas: formData.waliKelas || '',
    ID_Pendaftaran: idPendaftaran,
    Nomor_Urut: '',
    Nama_Lengkap: (formData.namaSantri || '').trim().toUpperCase(),
    Jenis_Kelamin: formData.jenisKelamin || 'L',
    Tingkat: formData.tingkat || '',
    Kelas_Kategori: formData.kelasKategori || '',
    Cabang_Lomba: formData.cabangLomba || '',
    Nomor_WA: formData.nomorWA || '',
    Status: 'Pending',
    Catatan: formData.catatan || ''
  };

  const updatedList = [newEntry, ...currentList];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  notifyDataChanged('registrations', newEntry);

  addActivityLog(
    'Pendaftaran Santri Baru',
    `Santri ${formData.namaSantri} didaftarkan oleh ${formData.waliKelas} (${formData.tingkat} - ${formData.cabangLomba})`,
    'registration'
  );

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    try {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'register', ...newEntry })
      });
    } catch (e) {
      console.warn('Gagal kirim ke Google Sheets:', e);
    }
  }

  return newEntry;
};

/**
 * Simpan Batch Pendaftaran Delegasi Multi-Step Langsung ke Google Sheets
 */
export const saveBatchRegistrations = async (santriList = [], metadata = {}) => {
  if (!Array.isArray(santriList) || santriList.length === 0) {
    throw new Error('Tidak ada data delegasi santri yang dikirimkan.');
  }

  const currentList = getLocalRegistrations();
  const existingNums = currentList
    .map(item => {
      const match = (item.ID_Pendaftaran || '').match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    })
    .filter(n => n > 0);
  let nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : currentList.length + 1;

  const now = new Date();
  const timestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const newEntries = santriList.map((item) => {
    const idPendaftaran = `AKH-${String(nextNum).padStart(3, '0')}`;
    nextNum++;

    return {
      Timestamp: timestamp,
      Wali_Kelas: metadata.waliKelas || item.waliKelas || '',
      ID_Pendaftaran: idPendaftaran,
      Nomor_Urut: '',
      Nama_Lengkap: String(item.namaSantri || item.Nama_Lengkap || '').trim().toUpperCase(),
      Jenis_Kelamin: item.jenisKelamin || metadata.jenisKelamin || 'L',
      Tingkat: metadata.tingkatName || metadata.tingkat || item.tingkat || '',
      Kelas_Kategori: item.kelasKategori || metadata.kelasDiniyah || metadata.kelasKategori || '',
      Cabang_Lomba: item.cabangLomba || '',
      Nomor_WA: metadata.nomorWA || item.nomorWA || '',
      Status: 'Pending',
      Catatan: item.catatan || ''
    };
  });

  const updatedList = [...newEntries, ...currentList];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  notifyDataChanged('registrations', newEntries);

  addActivityLog(
    'Pendaftaran Batch Delegasi',
    `${newEntries.length} santri delegasi didaftarkan oleh ${metadata.waliKelas} (${metadata.kelasDiniyah || 'Kelas Diniyah'})`,
    'registration'
  );

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    try {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'batch_register',
          Wali_Kelas: metadata.waliKelas || '',
          Nomor_WA: metadata.nomorWA || '',
          Tingkat: metadata.tingkatName || metadata.tingkat || '',
          Kelas_Kategori: metadata.kelasDiniyah || '',
          entries: newEntries
        })
      });
    } catch (e) {
      console.warn('Sync batch ke Google Sheets gagal:', e);
    }
  }

  return {
    success: true,
    count: newEntries.length,
    entries: newEntries,
    metadata
  };
};

/**
 * Update Status Santri Langsung ke Google Sheets
 */
export const updateStatus = async (idPendaftaran, newStatus) => {
  const currentList = getLocalRegistrations();
  const updated = currentList.map(item => {
    if (item.ID_Pendaftaran === idPendaftaran) {
      return { ...item, Status: newStatus };
    }
    return item;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  notifyDataChanged('registrations', { idPendaftaran, newStatus });

  addActivityLog(
    'Perubahan Status Santri',
    `Status santri ID ${idPendaftaran} diubah menjadi "${newStatus}"`,
    'status'
  );

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    try {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'update_single',
          ID_Pendaftaran: idPendaftaran,
          Status: newStatus
        })
      });
    } catch (e) {
      console.warn('Update status ke GAS gagal:', e);
    }
  }

  return updated;
};

/**
 * Edit Santri Lengkap Langsung ke Google Sheets
 */
export const updateRegistration = async (idPendaftaran, updatedFields) => {
  const currentList = getLocalRegistrations();
  const updated = currentList.map(item => {
    if (item.ID_Pendaftaran === idPendaftaran) {
      return { ...item, ...updatedFields };
    }
    return item;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  notifyDataChanged('registrations', { idPendaftaran, updatedFields });

  addActivityLog(
    'Update Data Santri',
    `Data santri ${idPendaftaran} diperbarui`,
    'update'
  );

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    try {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'edit_santri',
          ID_Pendaftaran: idPendaftaran,
          ...updatedFields
        })
      });
    } catch (e) {
      console.warn('Update santri ke Google Sheets gagal:', e);
    }
  }

  return updated;
};

/**
 * Hapus Santri Langsung dari Google Sheets
 */
export const deleteRegistration = async (idPendaftaran) => {
  const currentList = getLocalRegistrations();
  const filtered = currentList.filter(item => item.ID_Pendaftaran !== idPendaftaran);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  notifyDataChanged('registrations', { deletedId: idPendaftaran });

  addActivityLog('Hapus Santri', `Santri ${idPendaftaran} dihapus dari pendaftaran`, 'delete');

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    try {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'delete_santri',
          ID_Pendaftaran: idPendaftaran
        })
      });
    } catch (e) {
      console.warn('Hapus santri di Google Sheets gagal:', e);
    }
  }

  return filtered;
};

/**
 * Undi Nomor Urut Seluruh Santri di Google Sheets
 */
export const generateRandomQueueNumbers = async () => {
  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    try {
      const resp = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'undi_nomor' })
      });
      if (resp.ok) {
        // Ambil data terbaru hasil pengundian dari spreadsheet
        const fresh = await fetchRegistrations(true);
        return { success: true, count: fresh.length };
      }
    } catch (e) {
      console.warn('Undi nomor via Google Sheets gagal:', e);
    }
  }

  return { success: false, message: 'Gagal menghubungi Google Sheets.' };
};

export const isSantriPutri = (item) => {
  if (!item) return false;
  const jk = (item.Jenis_Kelamin || item.jenisKelamin || '').toUpperCase();
  if (jk === 'P') return true;
  const kelas = (item.Kelas_Kategori || item.kelasKategori || '').toLowerCase();
  return kelas.includes('putri') || kelas.includes(' pi') || kelas.endsWith('pi');
};

// =========================================================================
// 2. MASTER DATA USTADZ / WALI KELAS (SHEET: Ustadz)
// =========================================================================

export const getWaliKelasList = () => {
  try {
    const raw = localStorage.getItem(WALI_KELAS_KEY);
    return raw ? JSON.parse(raw) : MASTER_WALI_KELAS;
  } catch (e) {
    return MASTER_WALI_KELAS;
  }
};

/**
 * Mengambil master Ustadz / Wali Kelas langsung dari Google Sheets
 */
export const fetchWaliKelas = async () => {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) return getWaliKelasList();

  try {
    const url = gasUrl.includes('?') ? `${gasUrl}&action=get_ustadz` : `${gasUrl}?action=get_ustadz`;
    const resp = await fetch(url, { method: 'GET' });
    if (resp.ok) {
      const result = await resp.json();
      if (result.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
        localStorage.setItem(WALI_KELAS_KEY, JSON.stringify(result.data));
        return result.data;
      }
    }
  } catch (err) {
    console.warn('Gagal ambil data Ustadz dari Google Sheets, menggunakan master lokal:', err);
  }

  return getWaliKelasList();
};

export const saveWaliKelas = async (ustadzData) => {
  const list = getWaliKelasList();
  const id = ustadzData.id || `ust-${Date.now()}`;
  const newItem = { ...ustadzData, id };
  const existingIdx = list.findIndex(u => u.id === id);

  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...list];
    updatedList[existingIdx] = newItem;
  } else {
    updatedList = [...list, newItem];
  }

  localStorage.setItem(WALI_KELAS_KEY, JSON.stringify(updatedList));
  notifyDataChanged('wali_kelas', newItem);

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    try {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'save_ustadz', ...newItem })
      });
    } catch (e) {
      console.warn('Simpan Ustadz ke Google Sheets gagal:', e);
    }
  }

  return updatedList;
};

export const deleteWaliKelas = async (id) => {
  const list = getWaliKelasList();
  const filtered = list.filter(u => u.id !== id);

  localStorage.setItem(WALI_KELAS_KEY, JSON.stringify(filtered));
  notifyDataChanged('wali_kelas', { deletedId: id });

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    try {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete_ustadz', id })
      });
    } catch (e) {
      console.warn('Hapus Ustadz di Google Sheets gagal:', e);
    }
  }

  return filtered;
};

export const syncAllWaliKelasToGas = async () => {
  const list = getWaliKelasList();
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) throw new Error('URL Google Apps Script belum dikonfigurasi.');

  for (const item of list) {
    await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'save_ustadz', ...item })
    });
  }

  return { success: true, count: list.length };
};

// =========================================================================
// 3. MASTER TINGKAT DAN KELAS DINIYAH (SHEET: Tingkat_dan_Kelas)
// =========================================================================

export const getTingkatList = () => TINGKAT_LIST;

export const getSubKelasByTingkat = () => {
  try {
    const raw = localStorage.getItem(SUB_KELAS_KEY);
    return raw ? JSON.parse(raw) : SUB_KELAS_BY_TINGKAT;
  } catch (e) {
    return SUB_KELAS_BY_TINGKAT;
  }
};

/**
 * Mengambil daftar 30 Kelas Diniyah langsung dari Google Sheets
 */
export const fetchTingkatKelas = async () => {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) return getSubKelasByTingkat();

  try {
    const url = gasUrl.includes('?') ? `${gasUrl}&action=get_tingkat_kelas` : `${gasUrl}?action=get_tingkat_kelas`;
    const resp = await fetch(url, { method: 'GET' });
    if (resp.ok) {
      const result = await resp.json();
      if (result.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
        // Kelompokkan kelas berdasarkan kode tingkat (ula, wustho, mhq_juz)
        const grouped = { ula: [], wustho: [], mhq_juz: [] };
        result.data.forEach(item => {
          const tId = String(item.kodeTingkat || 'ula').toLowerCase().trim();
          if (!grouped[tId]) grouped[tId] = [];
          if (item.namaKelas && !grouped[tId].includes(item.namaKelas)) {
            grouped[tId].push(item.namaKelas);
          }
        });

        localStorage.setItem(SUB_KELAS_KEY, JSON.stringify(grouped));
        return grouped;
      }
    }
  } catch (err) {
    console.warn('Gagal ambil data Kelas Diniyah dari Google Sheets, menggunakan master lokal:', err);
  }

  return getSubKelasByTingkat();
};

export const addKelasToTingkat = async (tingkatId, namaKelas, keterangan = '') => {
  const grouped = getSubKelasByTingkat();
  if (!grouped[tingkatId]) grouped[tingkatId] = [];
  if (!grouped[tingkatId].includes(namaKelas)) {
    grouped[tingkatId].push(namaKelas);
  }

  localStorage.setItem(SUB_KELAS_KEY, JSON.stringify(grouped));
  notifyDataChanged('sub_kelas', { tingkatId, namaKelas });

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    try {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'save_kelas', tingkatId, namaKelas, keterangan })
      });
    } catch (e) {
      console.warn('Simpan kelas ke Google Sheets gagal:', e);
    }
  }

  return grouped;
};

export const updateKelasInTingkat = async (tingkatId, oldName, newName, keterangan = '') => {
  const grouped = getSubKelasByTingkat();
  if (grouped[tingkatId]) {
    grouped[tingkatId] = grouped[tingkatId].map(n => (n === oldName ? newName : n));
  }

  localStorage.setItem(SUB_KELAS_KEY, JSON.stringify(grouped));
  notifyDataChanged('sub_kelas', { tingkatId, oldName, newName });

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    try {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete_kelas', namaKelas: oldName })
      });
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'save_kelas', tingkatId, namaKelas: newName, keterangan })
      });
    } catch (e) {
      console.warn('Update kelas di Google Sheets gagal:', e);
    }
  }

  return grouped;
};

export const deleteKelasFromTingkat = async (tingkatId, namaKelas) => {
  const grouped = getSubKelasByTingkat();
  if (grouped[tingkatId]) {
    grouped[tingkatId] = grouped[tingkatId].filter(n => n !== namaKelas);
  }

  localStorage.setItem(SUB_KELAS_KEY, JSON.stringify(grouped));
  notifyDataChanged('sub_kelas', { tingkatId, deletedKelas: namaKelas });

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    try {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'delete_kelas', namaKelas })
      });
    } catch (e) {
      console.warn('Hapus kelas di Google Sheets gagal:', e);
    }
  }

  return grouped;
};

export const resetTingkatKelasToMaster = async () => {
  localStorage.setItem(SUB_KELAS_KEY, JSON.stringify(SUB_KELAS_BY_TINGKAT));
  notifyDataChanged('sub_kelas', SUB_KELAS_BY_TINGKAT);

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    try {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'sync_all_kelas' })
      });
    } catch (e) {
      console.warn('Reset kelas ke Google Sheets gagal:', e);
    }
  }

  return SUB_KELAS_BY_TINGKAT;
};

export const syncAllTingkatKelasToGas = async () => {
  return resetTingkatKelasToMaster();
};

// =========================================================================
// 4. JUARA LOMBA & KLASEMEN (SHEET: Juara_Lomba)
// =========================================================================

export const getJuaraList = () => {
  try {
    const raw = localStorage.getItem(JUARA_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const fetchJuaraLomba = async () => {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) return getJuaraList();

  try {
    const url = gasUrl.includes('?') ? `${gasUrl}&action=get_juara` : `${gasUrl}?action=get_juara`;
    const resp = await fetch(url, { method: 'GET' });
    if (resp.ok) {
      const result = await resp.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        localStorage.setItem(JUARA_KEY, JSON.stringify(result.data));
        return result.data;
      }
    }
  } catch (e) {
    console.warn('Gagal ambil data Juara dari Google Sheets:', e);
  }

  return getJuaraList();
};

export const saveJuara = async (juaraItem) => {
  const list = getJuaraList();
  const idJuara = juaraItem.idJuara || `JUR-${Date.now()}`;
  const newItem = { ...juaraItem, idJuara };

  // Hitung poin sesuai peringkat juara (Juara 1: 5, Juara 2: 3, Juara 3: 1)
  const rank = parseInt(newItem.juaraKe, 10) || 1;
  const poin = SKEMA_POIN_JUARA[rank] ? SKEMA_POIN_JUARA[rank].poin : 1;
  newItem.poin = poin;

  const existingIdx = list.findIndex(j => j.idJuara === idJuara);
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...list];
    updatedList[existingIdx] = newItem;
  } else {
    updatedList = [...list, newItem];
  }

  localStorage.setItem(JUARA_KEY, JSON.stringify(updatedList));
  notifyDataChanged('juara', newItem);

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    try {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'save_juara', ...newItem })
      });
    } catch (e) {
      console.warn('Simpan juara ke Google Sheets gagal:', e);
    }
  }

  return updatedList;
};

export const deleteJuara = async (idJuara) => {
  const list = getJuaraList();
  const filtered = list.filter(j => j.idJuara !== idJuara);

  localStorage.setItem(JUARA_KEY, JSON.stringify(filtered));
  notifyDataChanged('juara', { deletedId: idJuara });

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    try {
      await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'save_juara', isFullSync: true, data: filtered })
      });
    } catch (e) {
      console.warn('Hapus juara di Google Sheets gagal:', e);
    }
  }

  return filtered;
};

export const calculateKlasemenJuara = (juaraList = []) => {
  const totalPoinByKelas = {};
  juaraList.forEach(item => {
    const k = item.kelasDiniyah || item.Kelas_Diniyah || '';
    const p = parseInt(item.poin, 10) || 0;
    if (k) {
      totalPoinByKelas[k] = (totalPoinByKelas[k] || 0) + p;
    }
  });
  return totalPoinByKelas;
};

// =========================================================================
// 5. RIWAYAT LOG AKTIVITAS & PENGATURAN SISTEM (SHEET: Pengaturan)
// =========================================================================

export const getActivityLogs = () => {
  try {
    const raw = localStorage.getItem(ACTIVITY_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const addActivityLog = (action, detail, type = 'info') => {
  const current = getActivityLogs();
  const now = new Date();
  const time = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const newLog = {
    id: `log-${Date.now()}`,
    action,
    detail,
    type,
    time
  };

  const updated = [newLog, ...current].slice(0, 100);
  localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(updated));
  return newLog;
};

export const clearActivityLogs = () => {
  localStorage.removeItem(ACTIVITY_LOGS_KEY);
  return [];
};

export const testGasConnection = async (testUrl) => {
  const urlToTest = testUrl || getStoredGasUrl();
  if (!urlToTest) {
    return { success: false, message: 'URL Google Apps Script belum diisi.' };
  }

  try {
    const pingUrl = urlToTest.includes('?') ? `${urlToTest}&action=ping` : `${urlToTest}?action=ping`;
    const resp = await fetch(pingUrl, { method: 'GET' });
    if (resp.ok) {
      const data = await resp.json();
      if (data.status === 'success') {
        return {
          success: true,
          message: data.message || 'Koneksi ke Google Sheets berhasil!',
          spreadsheetName: data.spreadsheetName || '',
          sheets: data.sheets || [],
          totalSantri: data.totalSantri || 0,
          totalKelas: data.totalKelas || 0,
          totalUstadz: data.totalUstadz || 0
        };
      }
    }
    return { success: false, message: 'Respon dari Google Apps Script tidak valid.' };
  } catch (err) {
    return { success: false, message: `Gagal terhubung: ${err.message}` };
  }
};
