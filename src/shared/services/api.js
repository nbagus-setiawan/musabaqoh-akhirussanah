// Layanan Integrasi Google Sheets & Local Storage
// Musabaqah Akhirussanah YPPS Pondok Pesantren Al-Falah Putak

import { 
  MASTER_WALI_KELAS, 
  TINGKAT_LIST, 
  SUB_KELAS_BY_TINGKAT,
  SKEMA_POIN_JUARA,
  getGenderFromKelas
} from '../data/competitions';

const STORAGE_KEY = 'akhirusanah_registrations_v1';
const GAS_URL_KEY = 'akhirusanah_gas_url';
const ADMIN_PIN_KEY = 'akhirusanah_admin_pin';
const WALI_KELAS_KEY = 'akhirusanah_wali_kelas_v1';
const SUB_KELAS_KEY = 'akhirusanah_subkelas_v1';
const TINGKAT_LIST_KEY = 'akhirusanah_tingkat_v1';
const ACTIVITY_LOGS_KEY = 'akhirusanah_activity_logs_v1';
const JUARA_KEY = 'akhirusanah_juara_lomba_v1';

// Daftar nama data contoh lama yang wajib dibersihkan secara otomatis
const DEMO_NAMES = [
  'Muhammad Al-Fatih',
  'Zahra Syarifah',
  'Rizky Kurniawan'
];

/**
 * Pembersih Data Contoh Lama (Purge Dummy Data)
 * Memastikan cache lokal browser bersih 100% dan hanya memuat data riil
 */
export const cleanDemoData = (list) => {
  if (!Array.isArray(list)) return [];
  return list
    .filter(item => {
      if (!item) return false;
      const name = (item.Nama_Lengkap || '').trim();
      return !DEMO_NAMES.includes(name);
    })
    .map(item => ({
      ...item,
      Nama_Lengkap: (item.Nama_Lengkap || '').trim().toUpperCase()
    }));
};

export const getStoredGasUrl = () => {
  return localStorage.getItem(GAS_URL_KEY) || import.meta.env.VITE_GAS_URL || '';
};

export const setStoredGasUrl = (url) => {
  localStorage.setItem(GAS_URL_KEY, url ? url.trim() : '');
};

export const getAdminPin = () => {
  return localStorage.getItem(ADMIN_PIN_KEY) || 'admin123';
};

export const setAdminPin = (pin) => {
  localStorage.setItem(ADMIN_PIN_KEY, pin);
};

// =========================================================================
// REAL-TIME BROADCAST & AUTO-SYNC ENGINE
// Memastikan semua tab, window, dan background sinkron seketika (<1ms) tanpa refresh
// =========================================================================
const BROADCAST_CHANNEL_NAME = 'alfalah_realtime_sync_v1';
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

  // 1. Dispatch custom event di tab aktif saat ini
  window.dispatchEvent(new CustomEvent('alfalah_data_changed', { detail: { type, payload, timestamp: Date.now() } }));

  // 2. Broadcast via BroadcastChannel ke seluruh tab/jendela lain
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
  const handleStorage = (e) => {
    if (e.key === STORAGE_KEY || e.key === WALI_KELAS_KEY || e.key === SUB_KELAS_KEY) {
      if (callback) callback({ type: 'storage_change', key: e.key });
    }
  };

  window.addEventListener('alfalah_data_changed', handleCustom);
  window.addEventListener('storage', handleStorage);
  if (syncChannel) {
    syncChannel.addEventListener('message', handleBroadcast);
  }

  return () => {
    window.removeEventListener('alfalah_data_changed', handleCustom);
    window.removeEventListener('storage', handleStorage);
    if (syncChannel) {
      syncChannel.removeEventListener('message', handleBroadcast);
    }
  };
};

/**
 * Ambil data lokal secara sinkron & instan (< 1ms)
 */
export const getLocalRegistrations = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? cleanDemoData(JSON.parse(raw)) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Sinkronisasi data Google Sheets di background tanpa memblokir antarmuka pengguna
 */
let isSyncingBackground = false;
export const syncRemoteRegistrationsSilently = async () => {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl || isSyncingBackground) return;

  isSyncingBackground = true;
  try {
    const url = gasUrl.includes('?') ? `${gasUrl}&action=get_all` : `${gasUrl}?action=get_all`;
    const resp = await fetch(url, { method: 'GET' });
    if (resp.ok) {
      const result = await resp.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        const remoteData = cleanDemoData(result.data);
        const localData = getLocalRegistrations();

        // Deteksi apakah ada santri baru atau perubahan data
        const isDifferent = remoteData.length !== localData.length || 
          JSON.stringify(remoteData.map(r => r.ID_Pendaftaran + (r.Status || '') + (r.Nomor_Urut || ''))) !==
          JSON.stringify(localData.map(r => r.ID_Pendaftaran + (r.Status || '') + (r.Nomor_Urut || '')));

        if (isDifferent) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteData));
          notifyDataChanged('registrations', remoteData);
        }
      }
    }
  } catch (e) {
    // Silent background handling
  } finally {
    isSyncingBackground = false;
  }
};

/**
 * Ambil Semua Data Pendaftaran Santri Riil
 * 1. Mengembalikan data lokal INSTAN (<1ms) tanpa loading lama
 * 2. Menjalankan sinkronisasi senyap dengan Google Sheets di latar belakang
 */
export const fetchRegistrations = async (forceRemote = false) => {
  const localData = getLocalRegistrations();

  // Jika forceRemote diminta atau data lokal kosong, tarik remote
  const gasUrl = getStoredGasUrl();
  if (gasUrl && (forceRemote || localData.length === 0)) {
    try {
      const url = gasUrl.includes('?') ? `${gasUrl}&action=get_all` : `${gasUrl}?action=get_all`;
      const resp = await fetch(url, { method: 'GET' });
      if (resp.ok) {
        const result = await resp.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
          const cleanedRealData = cleanDemoData(result.data);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedRealData));
          return cleanedRealData;
        }
      }
    } catch (err) {
      console.warn('Gagal fetch dari Google Sheets, menggunakan data lokal:', err);
    }
  }

  // Jika data lokal sudah ada, jalankan pengecekan remote di background
  if (gasUrl && !forceRemote && localData.length > 0) {
    syncRemoteRegistrationsSilently();
  }

  return localData;
};

/**
 * Simpan Pendaftaran Santri Baru (Data Riil)
 */
export const saveRegistration = async (formData) => {
  const currentList = getLocalRegistrations();
  
  // Format nomor urut ID unik otomatis berdasarkan jumlah riil
  const nextNum = currentList.length + 1;
  const idPendaftaran = `AKH-${String(nextNum).padStart(3, '0')}`;
  
  const now = new Date();
  const timestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const newEntry = {
    Timestamp: timestamp,
    Wali_Kelas: formData.waliKelas || '',
    ID_Pendaftaran: idPendaftaran,
    Nomor_Urut: '', // Kosong di awal, akan diundi oleh panitia
    Nama_Lengkap: (formData.namaSantri || '').trim().toUpperCase(),
    Jenis_Kelamin: formData.jenisKelamin || 'L',
    Tingkat: formData.tingkat || '',
    Kelas_Kategori: formData.kelasKategori || '',
    Cabang_Lomba: formData.cabangLomba || '',
    Nomor_WA: formData.nomorWA || '',
    Status: 'Pending',
    Catatan: formData.catatan || ''
  };

  // Simpan ke local storage
  const updatedList = [newEntry, ...currentList];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

  // Trigger sinkronisasi otomatis seketika (<1ms) ke seluruh komponen & tab aktif
  notifyDataChanged('registrations', newEntry);

  // Catat ke Log Aktivitas
  addActivityLog(
    'Pendaftaran Santri Baru',
    `Santri ${formData.namaSantri} didaftarkan oleh ${formData.waliKelas} (${formData.tingkat} - ${formData.cabangLomba})`,
    'registration'
  );

  // Kirim ke Google Apps Script secara real-time di background tanpa memblokir respon UI
  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'register',
        ...newEntry
      }),
      keepalive: true
    }).catch(e => console.warn('Koneksi background GAS gagal:', e));
  }

  return newEntry;
};

/**
 * Update Status Verifikasi Santri (Riil)
 */
export const updateStatus = async (idPendaftaran, newStatus) => {
  const currentList = getLocalRegistrations();
  const target = currentList.find(item => item.ID_Pendaftaran === idPendaftaran);
  const updated = currentList.map(item => {
    if (item.ID_Pendaftaran === idPendaftaran) {
      return { ...item, Status: newStatus };
    }
    return item;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Trigger sinkronisasi otomatis seketika (<1ms)
  notifyDataChanged('registrations', { idPendaftaran, newStatus });

  // Catat ke Log Aktivitas
  const santriName = target ? target.Nama_Lengkap : idPendaftaran;
  addActivityLog(
    'Perubahan Status Santri',
    `Status ${santriName} (${idPendaftaran}) diubah menjadi "${newStatus}"`,
    'status'
  );

  // Kirim update ke Google Apps Script di background
  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'update_single',
        ID_Pendaftaran: idPendaftaran,
        Status: newStatus
      })
    }).catch(e => console.warn('Sync status GAS failed:', e));
  }

  return updated;
};

/**
 * Edit / Update Seluruh Data Pendaftaran Santri (Lengkap: Nama, Kelas, Cabang, WA, Wali Kelas, No Urut, Status, Catatan)
 */
export const updateRegistration = async (idPendaftaran, updatedFields) => {
  const currentList = getLocalRegistrations();
  const target = currentList.find(item => item.ID_Pendaftaran === idPendaftaran) || {};
  const sanitizedFields = { ...updatedFields };
  if (sanitizedFields.Nama_Lengkap) {
    sanitizedFields.Nama_Lengkap = sanitizedFields.Nama_Lengkap.trim().toUpperCase();
  }

  const updatedItem = {
    ...target,
    ...sanitizedFields,
    ID_Pendaftaran: idPendaftaran
  };

  const updated = currentList.map(item => 
    item.ID_Pendaftaran === idPendaftaran ? updatedItem : item
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Trigger sinkronisasi otomatis seketika (<1ms)
  notifyDataChanged('registrations', updatedItem);

  const santriName = updatedItem.Nama_Lengkap || idPendaftaran;
  addActivityLog(
    'Edit Data Santri',
    `Data santri ${santriName} (${idPendaftaran}) berhasil diedit oleh panitia`,
    'registration'
  );

  // Sync perubahan langsung ke Google Sheets (Sheet Pendaftaran) di background
  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'edit_santri',
        ID_Pendaftaran: idPendaftaran,
        ...updatedItem
      })
    }).catch(e => console.warn('Sync edit_santri GAS failed:', e));
  }

  return updatedItem;
};

/**
 * Hapus Data Pendaftaran Santri
 */
export const deleteRegistration = async (idPendaftaran) => {
  const currentList = getLocalRegistrations();
  const target = currentList.find(item => item.ID_Pendaftaran === idPendaftaran);
  const updated = currentList.filter(item => item.ID_Pendaftaran !== idPendaftaran);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Trigger sinkronisasi otomatis seketika (<1ms)
  notifyDataChanged('registrations', { idPendaftaran, action: 'delete' });

  const santriName = target ? target.Nama_Lengkap : idPendaftaran;
  addActivityLog(
    'Hapus Data Santri',
    `Data santri ${santriName} (${idPendaftaran}) dihapus oleh panitia`,
    'status'
  );

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'delete_single',
        ID_Pendaftaran: idPendaftaran
      })
    }).catch(e => console.warn('Sync delete GAS failed:', e));
  }

  return updated;
};


/**
 * FUNGSI PENENTU GENDER SANTRI
 * Mengecek apakah santri berstatus Putri (P atau mengandung kata putri)
 */
export const isSantriPutri = (item) => {
  if (!item) return false;
  const jk = String(item.Jenis_Kelamin || '').trim().toUpperCase();
  const kelas = String(item.Kelas_Kategori || '').toLowerCase();
  return jk === 'P' || kelas.includes('putri');
};

/**
 * FUNGSI PENGOCOKAN / GENERATE NOMOR URUT ACAK (MULAI DARI 050)
 * Mengundi nomor urut pemanggilan kepada peserta yang statusnya sudah 'Terverifikasi'
 * Aturan Pemanggilan: Per cabang & per tingkat, acak berselang-seling dimulai dari PUTRI, lalu PUTRA, dst.
 * Dimulai dari startNumber (default: 50 -> "050")
 */
export const generateRandomQueueNumbers = async (targetCategory = 'ALL', startNumber = 50) => {
  const currentList = getLocalRegistrations();

  // Filter peserta yang terverifikasi (dan jika targetCategory bukan ALL, filter sesuai cabang)
  const eligibleIndices = [];
  currentList.forEach((item, idx) => {
    const isCategoryMatch = targetCategory === 'ALL' || item.Cabang_Lomba === targetCategory;
    if (item.Status === 'Terverifikasi' && isCategoryMatch) {
      eligibleIndices.push(idx);
    }
  });

  if (eligibleIndices.length === 0) {
    throw new Error('Tidak ada peserta dengan status "Terverifikasi" untuk diundi nomor urutnya!');
  }

  // Kelompokkan peserta berdasarkan Cabang & Tingkat agar pengundian tetap teratur per cabang dan per tingkat
  const groupIndices = new Map();
  eligibleIndices.forEach(idx => {
    const item = currentList[idx];
    const key = `${item.Cabang_Lomba || 'Umum'}___${item.Tingkat || 'Umum'}`;
    if (!groupIndices.has(key)) {
      groupIndices.set(key, []);
    }
    groupIndices.get(key).push(idx);
  });

  // Kumpulkan semua nomor urut yang sudah terpakai agar tidak ada nomor ganda di seluruh cabang & tingkat
  const existingUsedNumbers = new Set(
    currentList
      .filter((_, idx) => !eligibleIndices.includes(idx))
      .map(it => it.Nomor_Urut && String(it.Nomor_Urut).trim())
      .filter(Boolean)
  );

  let currentStartNum = startNumber;
  const updatesToSync = [];
  const updatedList = [...currentList];

  groupIndices.forEach((indices) => {
    // Pisahkan Putri dan Putra
    const putriIndices = [];
    const putraIndices = [];

    indices.forEach(idx => {
      if (isSantriPutri(currentList[idx])) {
        putriIndices.push(idx);
      } else {
        putraIndices.push(idx);
      }
    });

    // Acak masing-masing grup secara independen dengan algoritma Fisher-Yates
    for (let i = putriIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [putriIndices[i], putriIndices[j]] = [putriIndices[j], putriIndices[i]];
    }
    for (let i = putraIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [putraIndices[i], putraIndices[j]] = [putraIndices[j], putraIndices[i]];
    }

    // Gabungkan berselang-seling: Dimulai dari PUTRI, lalu PUTRA, lalu PUTRI, dst.
    const interleavedIndices = [];
    const maxLen = Math.max(putriIndices.length, putraIndices.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < putriIndices.length) interleavedIndices.push(putriIndices[i]);
      if (i < putraIndices.length) interleavedIndices.push(putraIndices[i]);
    }

    // Siapkan pool nomor urut acak tanpa ada nomor ganda di seluruh sistem
    const poolNumbers = [];
    while (poolNumbers.length < interleavedIndices.length) {
      const formatted = String(currentStartNum).padStart(3, '0');
      if (!existingUsedNumbers.has(formatted)) {
        poolNumbers.push(formatted);
      }
      currentStartNum++;
    }

    // Acak pool nomor urut dengan algoritma Fisher-Yates agar tidak berurutan
    for (let i = poolNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [poolNumbers[i], poolNumbers[j]] = [poolNumbers[j], poolNumbers[i]];
    }

    // Tetapkan nomor urut acak ke peserta hasil undian berselang-seling (Putri -> Putra)
    interleavedIndices.forEach((listIdx, i) => {
      const assignedNo = poolNumbers[i];
      existingUsedNumbers.add(assignedNo);
      updatedList[listIdx] = {
        ...updatedList[listIdx],
        Nomor_Urut: assignedNo
      };
      updatesToSync.push({
        ID_Pendaftaran: updatedList[listIdx].ID_Pendaftaran,
        Nomor_Urut: assignedNo,
        Status: 'Terverifikasi'
      });
    });
  });

  // Simpan ke local storage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

  // Trigger sinkronisasi otomatis seketika (<1ms) ke seluruh komponen & tab aktif
  notifyDataChanged('registrations', { action: 'lottery', count: updatesToSync.length });

  // Catat ke Log Aktivitas
  addActivityLog(
    'Pengundian Nomor Urut',
    `Berhasil mengundi nomor urut untuk ${updatesToSync.length} santri terverifikasi (${targetCategory === 'ALL' ? 'Semua Cabang' : targetCategory}) berselang-seling (Putri - Putra) mulai nomor ${String(startNumber).padStart(3, '0')}`,
    'lottery'
  );

  // Sync batch ke Google Apps Script
  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'batch_update',
        updates: updatesToSync
      })
    }).catch(e => console.warn('Sync batch GAS failed:', e));
  }

  return { updatedList, countAssigned: updatesToSync.length };
};

// ==========================================
// 1. ACTIVITY LOGS (RIWAYAT AKTIVITAS SISTEM)
// ==========================================
const INITIAL_LOGS = [
  {
    id: 'log-sys-1',
    timestamp: '17/11/2026 08:00:00',
    action: 'Inisialisasi Portal',
    detail: 'Sistem Portal Pendaftaran Musabaqah Akhirussanah 1447 H / 2026 M Al-Falah Putak aktif.',
    type: 'system'
  }
];

export const getActivityLogs = () => {
  try {
    const raw = localStorage.getItem(ACTIVITY_LOGS_KEY);
    if (!raw) return INITIAL_LOGS;
    const parsed = JSON.parse(raw);
    // Bersihkan log yang menyebutkan nama contoh
    const cleaned = parsed.filter(l => {
      const detail = l.detail || '';
      return !DEMO_NAMES.some(name => detail.includes(name));
    });
    return cleaned.length > 0 ? cleaned : INITIAL_LOGS;
  } catch (e) {
    return INITIAL_LOGS;
  }
};

export const addActivityLog = (action, detail, type = 'info') => {
  const currentLogs = getActivityLogs();
  const now = new Date();
  const timestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  
  const newLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    timestamp,
    action,
    detail,
    type
  };

  const updated = [newLog, ...currentLogs].slice(0, 100);
  try {
    localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Gagal simpan log aktivitas:', e);
  }
  return updated;
};

export const clearActivityLogs = () => {
  localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(INITIAL_LOGS));
  return INITIAL_LOGS;
};

// ==========================================
// 2. DATA GURU (CRUD WALI KELAS ASLI)
const DUMMY_TEACHER_NAMES = [
  'Ust. Ahmad Fauzan', 'Usth. Siti Maryam', 'Ust. M. Ridwan', 'Usth. Nur Aini',
  'Ust. Muhammad Zaid', 'Usth. Anisa Rahma', 'Ust. Farhan Asy-Syafi\'i', 'Ust. Abdul Somad',
  'Ust. Hasan Basri', 'Ust. Luqman Hakim', 'Ust. Subhan Al-Bantani', 'Ust. Dede Rosyada',
  'Ust. Syamsul Huda', 'Usth. Fatimah Az-Zahra', 'Ust. Dr. K.H. Zainuddin', 'Ust. M. Nur Iskandar'
];

export const getWaliKelasList = () => {
  try {
    const raw = localStorage.getItem(WALI_KELAS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    const realOnly = list.filter(item => {
      const nama = item.nama || '';
      return !DUMMY_TEACHER_NAMES.includes(nama);
    });
    if (realOnly.length !== list.length) {
      localStorage.setItem(WALI_KELAS_KEY, JSON.stringify(realOnly));
    }
    return realOnly;
  } catch (e) {
    return [];
  }
};

export const fetchWaliKelas = async () => {
  const gasUrl = getStoredGasUrl();
  let localData = getWaliKelasList();

  if (gasUrl) {
    try {
      const url = gasUrl.includes('?') ? `${gasUrl}&action=get_guru` : `${gasUrl}?action=get_guru`;
      const resp = await fetch(url, { method: 'GET' });
      if (resp.ok) {
        const result = await resp.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
          const cleaned = result.data.filter(item => {
            const nama = item.nama || '';
            return !DUMMY_TEACHER_NAMES.includes(nama);
          });
          localStorage.setItem(WALI_KELAS_KEY, JSON.stringify(cleaned));
          return cleaned;
        }
      }
    } catch (err) {
      console.warn('Gagal fetch guru dari Google Sheets:', err);
    }
  }

  return localData;
};

export const saveWaliKelas = (data) => {
  const current = getWaliKelasList();
  let updated;
  let savedItem;
  if (data.id) {
    savedItem = { ...data };
    updated = current.map(item => item.id === data.id ? { ...item, ...data } : item);
    addActivityLog('Edit Data Guru', `Memperbarui data wali kelas: ${data.nama} (${data.kelas})`, 'guru');
  } else {
    const newId = 'wk-' + Date.now();
    savedItem = { ...data, id: newId };
    updated = [...current, savedItem];
    addActivityLog('Tambah Data Guru', `Menambahkan wali kelas baru: ${data.nama} (${data.kelas})`, 'guru');
  }
  localStorage.setItem(WALI_KELAS_KEY, JSON.stringify(updated));
  notifyDataChanged('wali_kelas', updated);

  // Sync latar belakang ke Google Sheets
  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'save_guru', ...savedItem })
    }).catch(err => console.warn('GAS save_guru sync error:', err));
  }

  return updated;
};

export const deleteWaliKelas = (id) => {
  const current = getWaliKelasList();
  const target = current.find(item => item.id === id);
  const updated = current.filter(item => item.id !== id);
  localStorage.setItem(WALI_KELAS_KEY, JSON.stringify(updated));
  notifyDataChanged('wali_kelas', updated);
  if (target) {
    addActivityLog('Hapus Data Guru', `Menghapus wali kelas: ${target.nama} (${target.kelas})`, 'guru');
  }

  // Sync latar belakang ke Google Sheets
  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'delete_guru', id })
    }).catch(err => console.warn('GAS delete_guru sync error:', err));
  }

  return updated;
};

// ==========================================
// 3. TINGKAT DAN KELAS (CRUD ROMBEL & TINGKAT)
// ==========================================
export const getTingkatList = () => {
  try {
    const raw = localStorage.getItem(TINGKAT_LIST_KEY);
    if (!raw) return TINGKAT_LIST;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(TINGKAT_LIST_KEY, JSON.stringify(TINGKAT_LIST));
      return TINGKAT_LIST;
    }
    return parsed;
  } catch (e) {
    return TINGKAT_LIST;
  }
};

export const getSubKelasByTingkat = () => {
  try {
    const raw = localStorage.getItem(SUB_KELAS_KEY);
    if (!raw) {
      localStorage.setItem(SUB_KELAS_KEY, JSON.stringify(SUB_KELAS_BY_TINGKAT));
      return SUB_KELAS_BY_TINGKAT;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      localStorage.setItem(SUB_KELAS_KEY, JSON.stringify(SUB_KELAS_BY_TINGKAT));
      return SUB_KELAS_BY_TINGKAT;
    }

    // Hitung kelengkapan rombel di masing-masing 4 jenjang
    const ulaCount = Array.isArray(parsed.ula) ? parsed.ula.length : 0;
    const wusthoCount = Array.isArray(parsed.wustho) ? parsed.wustho.length : 0;
    const ulyaCount = Array.isArray(parsed.ulya) ? parsed.ulya.length : 0;
    const mhqCount = Array.isArray(parsed.mhq_juz) ? parsed.mhq_juz.length : 0;

    // Deteksi jika ada format lama tanpa kata Putra/Putri
    const hasPutraPutri = Object.entries(parsed).some(([key, arr]) => {
      if (key === 'mhq_juz') return false;
      return Array.isArray(arr) && arr.some(c => typeof c === 'string' && (c.includes('Putra') || c.includes('Putri')));
    });

    // Jika kosong, belum ada Putra/Putri, atau salah satu jenjang hilang/terpotong (contoh: ulya/mhq 0):
    // Otomatis lengkapi dengan Master Resmi SUB_KELAS_BY_TINGKAT (38 Rombel & Kategori)
    if (!hasPutraPutri || ulaCount < 8 || wusthoCount < 16 || ulyaCount < 8 || mhqCount < 6) {
      const merged = {
        ula: Array.from(new Set([...SUB_KELAS_BY_TINGKAT.ula, ...(parsed.ula || [])])),
        wustho: Array.from(new Set([...SUB_KELAS_BY_TINGKAT.wustho, ...(parsed.wustho || [])])),
        ulya: Array.from(new Set([...SUB_KELAS_BY_TINGKAT.ulya, ...(parsed.ulya || [])])),
        mhq_juz: Array.from(new Set([...SUB_KELAS_BY_TINGKAT.mhq_juz, ...(parsed.mhq_juz || [])]))
      };
      localStorage.setItem(SUB_KELAS_KEY, JSON.stringify(merged));
      return merged;
    }

    return parsed;
  } catch (e) {
    return SUB_KELAS_BY_TINGKAT;
  }
};

/**
 * Reset / Pulihkan Data Tingkat dan Rombel Kelas ke Master Resmi (Putra & Putri Terpisah Lengkap)
 */
export const resetTingkatKelasToMaster = () => {
  localStorage.setItem(SUB_KELAS_KEY, JSON.stringify(SUB_KELAS_BY_TINGKAT));
  localStorage.setItem(TINGKAT_LIST_KEY, JSON.stringify(TINGKAT_LIST));
  addActivityLog('Reset Rombel Kelas', 'Memulihkan data master jenjang & rombel kelas standar Al-Falah Putak (Putra & Putri)', 'tingkat');
  return SUB_KELAS_BY_TINGKAT;
};

/**
 * Ambil Master Tingkat dan Rombel Kelas Langsung dari Google Sheets (Sheet Tingkat_dan_Kelas)
 */
export const fetchTingkatKelas = async () => {
  const gasUrl = getStoredGasUrl();
  let localData = getSubKelasByTingkat();

  if (gasUrl) {
    try {
      const url = gasUrl.includes('?') ? `${gasUrl}&action=get_tingkat_kelas` : `${gasUrl}?action=get_tingkat_kelas`;
      const resp = await fetch(url, { method: 'GET' });
      if (resp.ok) {
        const result = await resp.json();
        // Pastikan respon sukses dan memiliki array data
        if (result.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
          const grouped = {
            ula: [],
            wustho: [],
            ulya: [],
            mhq_juz: []
          };

          result.data.forEach(item => {
            const tId = (item.kodeTingkat || item.tingkatId || '').toLowerCase().trim();
            const cName = (item.namaKelas || '').trim();
            if (tId && cName) {
              if (!grouped[tId]) {
                grouped[tId] = [];
              }
              if (!grouped[tId].includes(cName)) {
                grouped[tId].push(cName);
              }
            }
          });

          const totalExtracted = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);

          // Cek apakah data dari Sheets sudah berformat Putra/Putri
          const hasPutraPutriExtracted = Object.entries(grouped).some(([key, arr]) => {
            if (key === 'mhq_juz') return false;
            return arr.some(c => c.includes('Putra') || c.includes('Putri'));
          });

          // Pastikan semua jenjang utama (Ula, Wustho, Ulya) lengkap
          const isComplete = (grouped.ula?.length || 0) >= 8 && (grouped.wustho?.length || 0) >= 16 && (grouped.ulya?.length || 0) >= 8;

          // PROTEKSI KRUSIAL:
          // Hanya simpan jika data sheet > 0 DAN sudah menggunakan format Putra & Putri serta lengkap.
          // Mencegah data web tertimpa kembali oleh format lama atau data terpotong dari Google Sheets.
          if (totalExtracted > 0 && hasPutraPutriExtracted && isComplete) {
            localStorage.setItem(SUB_KELAS_KEY, JSON.stringify(grouped));
            return grouped;
          }
        }
      }
    } catch (err) {
      console.warn('Gagal fetch tingkat kelas dari Google Sheets:', err);
    }
  }

  return localData;
};

/**
 * Kirim / Timpa Seluruh Data Master Tingkat dan Rombel Kelas ke Google Sheets (Sheet Tingkat_dan_Kelas)
 * Memastikan Google Sheets terisi rapi persis 100% sama dengan website
 */
export const syncAllTingkatKelasToGas = async (overrideData = null) => {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) {
    throw new Error('URL Google Apps Script belum dipasang di Pengaturan Panel Admin.');
  }

  const subKelas = overrideData || getSubKelasByTingkat();
  const tingkatList = getTingkatList();

  const rows = [];
  tingkatList.forEach(t => {
    const classes = subKelas[t.id] || [];
    classes.forEach(cName => {
      let ket = t.desc || '';
      if (cName.includes('Putra')) ket = `${t.name} (Santri Putra)`;
      else if (cName.includes('Putri')) ket = `${t.name} (Santri Putri)`;

      rows.push({
        kodeTingkat: t.id,
        namaTingkat: t.name,
        namaKelas: cName,
        keterangan: ket
      });
    });
  });

  const resp = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'sync_all_kelas',
      data: rows
    })
  });

  if (!resp.ok) {
    throw new Error(`Koneksi HTTP Gagal (Status: ${resp.status})`);
  }

  const result = await resp.json();
  if (result.status === 'error') {
    throw new Error(result.message || 'Gagal sinkronisasi rombel ke Google Sheets');
  }

  addActivityLog(
    'Sinkronisasi Rombel ke Sheets',
    `Menyinkronkan ${rows.length} rombel kelas ke Google Sheets`,
    'tingkat'
  );

  return result;
};

export const addKelasToTingkat = (tingkatId, namaKelas) => {
  const current = getSubKelasByTingkat();
  const list = current[tingkatId] || [];
  const trimmed = namaKelas.trim();
  if (list.includes(trimmed)) {
    throw new Error(`Kelas "${trimmed}" sudah terdaftar di tingkat ini.`);
  }
  const updated = {
    ...current,
    [tingkatId]: [...list, trimmed]
  };
  localStorage.setItem(SUB_KELAS_KEY, JSON.stringify(updated));
  notifyDataChanged('sub_kelas', updated);
  addActivityLog('Tambah Rombel Kelas', `Menambahkan kelas "${trimmed}" ke tingkat ${tingkatId.toUpperCase()}`, 'tingkat');

  // Sync latar belakang ke Google Sheets
  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    const tingkatObj = TINGKAT_LIST.find(t => t.id === tingkatId);
    fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'save_kelas',
        tingkatId,
        namaTingkat: tingkatObj ? tingkatObj.name : `Tingkat ${tingkatId.toUpperCase()}`,
        namaKelas: trimmed
      })
    }).catch(err => console.warn('GAS save_kelas sync error:', err));
  }

  return updated;
};

export const updateKelasInTingkat = (tingkatId, oldName, newName) => {
  const current = getSubKelasByTingkat();
  const list = current[tingkatId] || [];
  const trimmed = newName.trim();
  const updatedList = list.map(k => k === oldName ? trimmed : k);
  const updated = {
    ...current,
    [tingkatId]: updatedList
  };
  localStorage.setItem(SUB_KELAS_KEY, JSON.stringify(updated));
  notifyDataChanged('sub_kelas', updated);
  addActivityLog('Edit Rombel Kelas', `Mengubah nama kelas dari "${oldName}" menjadi "${trimmed}" pada tingkat ${tingkatId.toUpperCase()}`, 'tingkat');

  // Sync latar belakang ke Google Sheets
  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    const tingkatObj = TINGKAT_LIST.find(t => t.id === tingkatId);
    fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'save_kelas',
        tingkatId,
        namaTingkat: tingkatObj ? tingkatObj.name : `Tingkat ${tingkatId.toUpperCase()}`,
        namaKelas: trimmed,
        oldKelasName: oldName
      })
    }).catch(err => console.warn('GAS update_kelas sync error:', err));
  }

  return updated;
};

export const deleteKelasFromTingkat = (tingkatId, namaKelas) => {
  const current = getSubKelasByTingkat();
  const list = current[tingkatId] || [];
  const updated = {
    ...current,
    [tingkatId]: list.filter(k => k !== namaKelas)
  };
  localStorage.setItem(SUB_KELAS_KEY, JSON.stringify(updated));
  notifyDataChanged('sub_kelas', updated);
  addActivityLog('Hapus Rombel Kelas', `Menghapus kelas "${namaKelas}" dari tingkat ${tingkatId.toUpperCase()}`, 'tingkat');

  // Sync latar belakang ke Google Sheets
  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'delete_kelas',
        tingkatId,
        namaKelas
      })
    }).catch(err => console.warn('GAS delete_kelas sync error:', err));
  }

  return updated;
};

// ==========================================
// 4. MANAJEMEN JUARA LOMBA & KLASEMEN JUARA UMUM KELAS
// ==========================================

/**
 * Mengambil daftar data penetapan juara per cabang lomba
 * Format object: { [cabangKey]: { cabangLomba, tingkat, juara1: {...}, juara2: {...}, juara3: {...} } }
 */
export const getJuaraList = () => {
  try {
    const raw = localStorage.getItem(JUARA_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

/**
 * Menyimpan / Memperbarui penetapan juara untuk cabang lomba tertentu
 */
export const saveJuara = (cabangKey, dataJuara) => {
  const current = getJuaraList();
  const updated = {
    ...current,
    [cabangKey]: {
      ...dataJuara,
      updatedAt: new Date().toISOString()
    }
  };
  localStorage.setItem(JUARA_KEY, JSON.stringify(updated));
  notifyDataChanged('juara', updated);

  addActivityLog(
    'Penetapan Juara',
    `Memperbarui juara cabang ${dataJuara.cabangLomba || cabangKey} (${dataJuara.tingkat ? dataJuara.tingkat.toUpperCase() : ''})`,
    'status'
  );

  return updated;
};

/**
 * Menghapus penetapan juara dari suatu cabang lomba
 */
export const deleteJuara = (cabangKey) => {
  const current = getJuaraList();
  const target = current[cabangKey];
  const updated = { ...current };
  delete updated[cabangKey];
  localStorage.setItem(JUARA_KEY, JSON.stringify(updated));
  notifyDataChanged('juara', updated);

  if (target) {
    addActivityLog(
      'Hapus Juara',
      `Menghapus penetapan juara cabang ${target.cabangLomba || cabangKey}`,
      'status'
    );
  }

  return updated;
};

/**
 * Menghitung Papan Klasemen Juara Umum Kelas (Leaderboard) Real-Time
 * Skema A: Juara 1 = 5 Poin, Juara 2 = 3 Poin, Juara 3 = 1 Poin
 * @param {string} filterTingkat 'ALL' | 'ula' | 'wustho' | 'ulya'
 * @returns {Array} Daftar kelas terurut berdasarkan total poin tertinggi (rank 1, 2, 3...)
 */
export const calculateKlasemenJuara = (filterTingkat = 'ALL') => {
  const juaraMap = getJuaraList();
  const subKelasData = getSubKelasByTingkat();

  // Inisialisasi seluruh rombel kelas yang terdaftar
  const kelasMap = {};

  Object.entries(subKelasData).forEach(([tingkatId, classes]) => {
    if (tingkatId === 'mhq_juz') return;
    if (filterTingkat !== 'ALL' && filterTingkat !== tingkatId) return;

    if (Array.isArray(classes)) {
      classes.forEach((namaKelas) => {
        kelasMap[namaKelas] = {
          namaKelas,
          tingkatId,
          gender: getGenderFromKelas(namaKelas) || 'L',
          juara1: 0,
          juara2: 0,
          juara3: 0,
          totalPoin: 0,
          daftarJuara: []
        };
      });
    }
  });

  // Hitung poin kemenangan dari juaraMap
  Object.entries(juaraMap).forEach(([cabangKey, item]) => {
    if (!item) return;

    if (filterTingkat !== 'ALL' && item.tingkat && item.tingkat !== filterTingkat) {
      return;
    }

    // Juara 1 (5 Poin)
    if (item.juara1 && item.juara1.kelas) {
      const k = item.juara1.kelas;
      if (!kelasMap[k]) {
        kelasMap[k] = {
          namaKelas: k,
          tingkatId: item.tingkat || 'wustho',
          gender: getGenderFromKelas(k) || 'L',
          juara1: 0,
          juara2: 0,
          juara3: 0,
          totalPoin: 0,
          daftarJuara: []
        };
      }
      kelasMap[k].juara1 += 1;
      kelasMap[k].totalPoin += (SKEMA_POIN_JUARA[1]?.poin || 5);
      kelasMap[k].daftarJuara.push({
        juaraRank: 1,
        cabangLomba: item.cabangLomba,
        namaSantri: item.juara1.nama,
        poin: (SKEMA_POIN_JUARA[1]?.poin || 5)
      });
    }

    // Juara 2 (3 Poin)
    if (item.juara2 && item.juara2.kelas) {
      const k = item.juara2.kelas;
      if (!kelasMap[k]) {
        kelasMap[k] = {
          namaKelas: k,
          tingkatId: item.tingkat || 'wustho',
          gender: getGenderFromKelas(k) || 'L',
          juara1: 0,
          juara2: 0,
          juara3: 0,
          totalPoin: 0,
          daftarJuara: []
        };
      }
      kelasMap[k].juara2 += 1;
      kelasMap[k].totalPoin += (SKEMA_POIN_JUARA[2]?.poin || 3);
      kelasMap[k].daftarJuara.push({
        juaraRank: 2,
        cabangLomba: item.cabangLomba,
        namaSantri: item.juara2.nama,
        poin: (SKEMA_POIN_JUARA[2]?.poin || 3)
      });
    }

    // Juara 3 (1 Poin)
    if (item.juara3 && item.juara3.kelas) {
      const k = item.juara3.kelas;
      if (!kelasMap[k]) {
        kelasMap[k] = {
          namaKelas: k,
          tingkatId: item.tingkat || 'wustho',
          gender: getGenderFromKelas(k) || 'L',
          juara1: 0,
          juara2: 0,
          juara3: 0,
          totalPoin: 0,
          daftarJuara: []
        };
      }
      kelasMap[k].juara3 += 1;
      kelasMap[k].totalPoin += (SKEMA_POIN_JUARA[3]?.poin || 1);
      kelasMap[k].daftarJuara.push({
        juaraRank: 3,
        cabangLomba: item.cabangLomba,
        namaSantri: item.juara3.nama,
        poin: (SKEMA_POIN_JUARA[3]?.poin || 1)
      });
    }
  });

  // Urutan Klasemen:
  // 1. Total Poin Tertinggi (descending)
  // 2. Tie-Breaker: Jumlah Juara 1 terbanyak (descending)
  // 3. Tie-Breaker: Jumlah Juara 2 terbanyak (descending)
  // 4. Urut Abjad Nama Kelas
  const sorted = Object.values(kelasMap).sort((a, b) => {
    if (b.totalPoin !== a.totalPoin) return b.totalPoin - a.totalPoin;
    if (b.juara1 !== a.juara1) return b.juara1 - a.juara1;
    if (b.juara2 !== a.juara2) return b.juara2 - a.juara2;
    return a.namaKelas.localeCompare(b.namaKelas);
  });

  // Berikan ranking
  return sorted.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
};
