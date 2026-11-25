// Layanan Integrasi Database Google Sheets via Code.gs (Langsung ke Apps Script, tanpa localStorage)
// Musabaqah Akhirussanah YPPS Pondok Pesantren Al-Falah Putak

import {
  MASTER_WALI_KELAS,
  TINGKAT_LIST,
  SUB_KELAS_BY_TINGKAT,
  SKEMA_POIN_JUARA,
  getGenderFromKelas
} from '../data/competitions';
import { normalizePhoneLocal08, toSheetPlainTextPhone } from '../utils/phone';

// URL Google Apps Script dari .env (VITE_GAS_URL)
export const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbyg6odSPbv_pqXFD2qPTUROwooyWWmZ9N4Y4SZRAtfiBDb7FlKcy7cuIwVqiSFpXJSt/exec';

const ADMIN_SESSION_AUTH_KEY = 'admin_session_auth';
const ADMIN_SESSION_PIN_KEY = 'admin_session_pin';

// Penyimpanan memori sementara (in-memory) untuk sesi tab aktif agar sinkron dengan Google Apps Script
const memoryStore = {
  gasUrl: '',
  adminPin: '',
  registrations: [],
  registrationsLoaded: false,
  registrationsAuthMode: null,
  waliKelas: null,
  subKelas: null,
  juara: [],
  pengaturan: null,
  pengeluaran: [],
  kebutuhan: [],
  activityLogs: []
};

export const getStoredGasUrl = () => {
  return memoryStore.gasUrl || import.meta.env.VITE_GAS_URL || DEFAULT_GAS_URL;
};

export const setStoredGasUrl = (url) => {
  memoryStore.gasUrl = url ? url.trim() : '';
};

export const getSessionAdminPin = () => {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_PIN_KEY) || memoryStore.adminPin || '';
  } catch (e) {
    return memoryStore.adminPin || '';
  }
};

export const setSessionAdminPin = (pin) => {
  const clean = pin ? String(pin).trim() : '';
  memoryStore.adminPin = clean;
  try {
    if (clean) {
      sessionStorage.setItem(ADMIN_SESSION_PIN_KEY, clean);
    } else {
      sessionStorage.removeItem(ADMIN_SESSION_PIN_KEY);
    }
  } catch (e) {}
};

export const getAdminPin = () => {
  return getSessionAdminPin();
};

export const setAdminPin = (pin) => {
  setSessionAdminPin(pin);
};

export const clearAdminSession = () => {
  memoryStore.adminPin = '';
  memoryStore.registrationsLoaded = false;
  memoryStore.registrationsAuthMode = null;
  try {
    sessionStorage.removeItem(ADMIN_SESSION_AUTH_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_PIN_KEY);
  } catch (e) {}
};

const getActiveAdminPinForRequests = () => {
  return getSessionAdminPin();
};

const hasActiveAdminSession = () => {
  try {
    return Boolean(
      getSessionAdminPin() &&
      sessionStorage.getItem(ADMIN_SESSION_AUTH_KEY) === 'true'
    );
  } catch (e) {
    return false;
  }
};

const buildGasUrl = (action, params = {}) => {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) return '';
  const query = new URLSearchParams({ action, ...params });
  return gasUrl.includes('?') ? `${gasUrl}&${query.toString()}` : `${gasUrl}?${query.toString()}`;
};

const postGas = async (payload, { includeAdminPin = true, requireSuccess = false } = {}) => {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) return { skipped: true, status: 'local' };

  const bodyPayload = includeAdminPin
    ? { adminPin: getActiveAdminPinForRequests(), ...payload }
    : payload;

  const resp = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(bodyPayload)
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: Gagal menghubungi Google Sheets.`);
  }

  let data = null;
  try {
    data = await resp.json();
  } catch (e) {
    data = null;
  }

  if (requireSuccess && data && data.status === 'error') {
    throw new Error(data.message || 'Operasi ditolak oleh Google Sheets.');
  }

  return data || { status: 'success' };
};

export const verifyAdminLogin = async (pinInput) => {
  const cleanPin = String(pinInput || '').trim();
  if (!cleanPin) {
    return { success: false, message: 'Harap masukkan PIN Panitia terlebih dahulu.' };
  }

  const gasUrl = getStoredGasUrl();
  if (!gasUrl) {
    return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };
  }

  try {
    const res = await postGas(
      { action: 'login_admin', username: 'admin', pin: cleanPin },
      { includeAdminPin: false, requireSuccess: false }
    );
    if (res && res.status === 'success') {
      setSessionAdminPin(cleanPin);
      return { success: true, admin: res.admin || null };
    }
    return { success: false, message: (res && res.message) || 'PIN Panitia tidak valid.' };
  } catch (err) {
    return { success: false, message: 'Gagal terhubung ke server Google Apps Script untuk memverifikasi PIN.' };
  }
};

export const changeAdminPin = async (newPin) => {
  const cleanNewPin = String(newPin || '').trim();
  if (!cleanNewPin || cleanNewPin.length < 4) {
    throw new Error('PIN baru minimal harus 4 karakter / angka.');
  }

  const oldPin = getActiveAdminPinForRequests();
  const res = await postGas(
    { action: 'change_admin_pin', oldPin, newPin: cleanNewPin },
    { includeAdminPin: false, requireSuccess: true }
  );

  setSessionAdminPin(cleanNewPin);
  return { success: true, syncedToSheets: Boolean(res && res.status === 'success') };
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
  return Array.isArray(memoryStore.registrations) ? memoryStore.registrations : [];
};

const normalizeRemoteRegistrations = (data = []) => {
  return data.map(item => {
    const next = { ...item };
    if (next.Nomor_Urut && !isNaN(next.Nomor_Urut) && Number(next.Nomor_Urut) > 0) {
      next.Nomor_Urut = String(next.Nomor_Urut).padStart(3, '0');
    }
    if (next.Nomor_WA) {
      next.Nomor_WA = normalizePhoneLocal08(next.Nomor_WA);
    }
    return next;
  });
};

/**
 * Mengambil seluruh data santri langsung dari Google Sheets tab Pendaftaran
 */
export const fetchRegistrations = async (forceRemote = false) => {
  const isAdminMode = hasActiveAdminSession();
  if (
    !forceRemote &&
    memoryStore.registrationsLoaded &&
    memoryStore.registrationsAuthMode === isAdminMode &&
    memoryStore.registrations.length > 0
  ) {
    return memoryStore.registrations;
  }

  const gasUrl = getStoredGasUrl();
  if (!gasUrl) return getLocalRegistrations();

  try {
    const params = isAdminMode ? { adminPin: getActiveAdminPinForRequests() } : {};
    const url = buildGasUrl('get_all', params);
    const resp = await fetch(url, { method: 'GET' });
    if (resp.ok) {
      const result = await resp.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        const formatted = normalizeRemoteRegistrations(result.data);
        memoryStore.registrations = formatted;
        memoryStore.registrationsLoaded = true;
        memoryStore.registrationsAuthMode = isAdminMode;
        return formatted;
      }
    }
  } catch (err) {
    console.warn('Koneksi Google Sheets gagal saat fetchRegistrations:', err);
  }

  return getLocalRegistrations();
};

export const searchRegistrationStatus = async (query) => {
  const clean = String(query || '').trim();
  if (clean.length < 3) return [];

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    try {
      const url = buildGasUrl('search_status', { q: clean });
      const resp = await fetch(url, { method: 'GET' });
      if (resp.ok) {
        const result = await resp.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
          return normalizeRemoteRegistrations(result.data);
        }
      }
    } catch (e) {}
  }

  return null;
};

let activeRegistrationMutations = 0;
let lastRegistrationMutationAt = 0;

export const syncRemoteRegistrationsSilently = async () => {
  if (activeRegistrationMutations > 0 || (Date.now() - lastRegistrationMutationAt) < 4000) {
    return;
  }
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) return;

  try {
    const reqStartedAt = Date.now();
    const isAdminMode = hasActiveAdminSession();
    const params = isAdminMode ? { adminPin: getActiveAdminPinForRequests() } : {};
    const url = buildGasUrl('get_all', params);
    const resp = await fetch(url, { method: 'GET' });
    if (activeRegistrationMutations > 0 || lastRegistrationMutationAt >= reqStartedAt) {
      return;
    }
    if (resp.ok) {
      const result = await resp.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        const formatted = normalizeRemoteRegistrations(result.data);
        const current = getLocalRegistrations();
        if (
          memoryStore.registrationsAuthMode !== isAdminMode ||
          JSON.stringify(formatted) !== JSON.stringify(current)
        ) {
          memoryStore.registrations = formatted;
          memoryStore.registrationsLoaded = true;
          memoryStore.registrationsAuthMode = isAdminMode;
          notifyDataChanged('registrations', formatted);
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
    Nomor_WA: normalizePhoneLocal08(formData.nomorWA || ''),
    Status: 'Pending',
    Catatan: formData.catatan || ''
  };

  const res = await postGas(
    {
      action: 'register',
      ...newEntry,
      Nomor_WA: toSheetPlainTextPhone(newEntry.Nomor_WA)
    },
    { includeAdminPin: false, requireSuccess: true }
  );

  if (Array.isArray(res?.ids) && res.ids[0]) {
    newEntry.ID_Pendaftaran = res.ids[0];
  }

  memoryStore.registrations = [newEntry, ...currentList];
  notifyDataChanged('registrations', newEntry);

  addActivityLog(
    'Pendaftaran Santri Baru',
    `Santri ${formData.namaSantri} didaftarkan oleh ${formData.waliKelas} (${formData.tingkat} - ${formData.cabangLomba})`,
    'registration'
  );

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
  const normalizedMetaWA = normalizePhoneLocal08(metadata.nomorWA || '');

  const newEntries = santriList.map((item) => {
    const idPendaftaran = `AKH-${String(nextNum).padStart(3, '0')}`;
    nextNum++;

    return {
      Timestamp: timestamp,
      Wali_Kelas: metadata.waliKelas || item.waliKelas || '',
      Nomor_WA: normalizedMetaWA || normalizePhoneLocal08(item.nomorWA || ''),
      ID_Pendaftaran: idPendaftaran,
      Nomor_Urut: '',
      Nama_Santri: String(item.namaSantri || item.Nama_Santri || item.Nama_Lengkap || '').trim().toUpperCase(),
      Nama_Lengkap: String(item.namaSantri || item.Nama_Santri || item.Nama_Lengkap || '').trim().toUpperCase(),
      Jenis_Kelamin: item.jenisKelamin || metadata.jenisKelamin || 'L',
      Tingkat: metadata.tingkatName || metadata.tingkat || item.tingkat || '',
      Kelas_Diniyah: item.kelasDiniyah || metadata.kelasDiniyah || item.kelasKategori || '',
      Kelas_Kategori: item.kelasDiniyah || metadata.kelasDiniyah || item.kelasKategori || '',
      Cabang_Lomba: item.cabangLomba || '',
      Detail_Cabang: item.detailCabang || '',
      Status: 'Pending',
      Catatan: item.catatan || ''
    };
  });

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    const res = await postGas(
      {
        action: 'batch_register',
        Wali_Kelas: metadata.waliKelas || '',
        Nomor_WA: toSheetPlainTextPhone(normalizedMetaWA),
        Tingkat: metadata.tingkatName || metadata.tingkat || '',
        Kelas_Kategori: metadata.kelasDiniyah || '',
        entries: newEntries.map(entry => ({
          ...entry,
          Nomor_WA: toSheetPlainTextPhone(entry.Nomor_WA)
        }))
      },
      { includeAdminPin: false, requireSuccess: true }
    );
    if (Array.isArray(res?.ids) && res.ids.length === newEntries.length) {
      res.ids.forEach((assignedId, idx) => {
        if (assignedId) {
          newEntries[idx].ID_Pendaftaran = assignedId;
        }
      });
    }
  }

  memoryStore.registrations = [...newEntries, ...currentList];
  notifyDataChanged('registrations', newEntries);

  addActivityLog(
    'Pendaftaran Batch Delegasi',
    `${newEntries.length} santri delegasi didaftarkan oleh ${metadata.waliKelas} (${metadata.kelasDiniyah || 'Kelas Diniyah'})`,
    'registration'
  );

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
export const updateStatus = async (idPendaftaran, newStatus, itemMeta = null) => {
  const cleanId = String(idPendaftaran || '').trim();
  const targetRowIdx = itemMeta && itemMeta.rowIndex ? Number(itemMeta.rowIndex) : null;
  const currentList = getLocalRegistrations();

  const updated = currentList.map(item => {
    const matchByRow = targetRowIdx && item.rowIndex && Number(item.rowIndex) === targetRowIdx;
    const matchById = !targetRowIdx && String(item.ID_Pendaftaran || '').trim() === cleanId;
    if (matchByRow || matchById) {
      return { ...item, Status: newStatus };
    }
    return item;
  });

  memoryStore.registrations = updated;
  notifyDataChanged('registrations', { idPendaftaran: cleanId, rowIndex: targetRowIdx, newStatus });

  addActivityLog(
    'Perubahan Status Santri',
    `Status santri ${itemMeta?.Nama_Lengkap || cleanId} (${cleanId}) diubah menjadi "${newStatus}"`,
    'status'
  );

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    activeRegistrationMutations++;
    try {
      await postGas(
        {
          action: 'update_single',
          ID_Pendaftaran: cleanId,
          Status: newStatus,
          rowIndex: targetRowIdx || '',
          Nama_Santri: itemMeta?.Nama_Lengkap || itemMeta?.Nama_Santri || '',
          Cabang_Lomba: itemMeta?.Cabang_Lomba || ''
        },
        { includeAdminPin: true, requireSuccess: true }
      );
    } finally {
      activeRegistrationMutations = Math.max(0, activeRegistrationMutations - 1);
      lastRegistrationMutationAt = Date.now();
    }
  }

  return updated;
};

/**
 * Batch Update Status Santri Sekaligus (Verifikasi Massal Berbasis Baris)
 */
export const batchUpdateStatus = async (itemsOrIds = [], newStatus) => {
  if (!Array.isArray(itemsOrIds) || itemsOrIds.length === 0) return [];

  const metaItems = itemsOrIds.map(entry =>
    typeof entry === 'object' && entry !== null
      ? {
          rowIndex: entry.rowIndex ? Number(entry.rowIndex) : null,
          ID_Pendaftaran: String(entry.ID_Pendaftaran || '').trim(),
          Nama_Santri: String(entry.Nama_Santri || entry.Nama_Lengkap || '').trim().toUpperCase()
        }
      : {
          rowIndex: null,
          ID_Pendaftaran: String(entry || '').trim(),
          Nama_Santri: ''
        }
  );

  const rowIndexSet = new Set(metaItems.filter(m => m.rowIndex).map(m => m.rowIndex));
  const idSet = new Set(metaItems.filter(m => !m.rowIndex && m.ID_Pendaftaran).map(m => m.ID_Pendaftaran));

  const currentList = getLocalRegistrations();
  const updated = currentList.map(item => {
    const byRow = item.rowIndex && rowIndexSet.has(Number(item.rowIndex));
    const byId = !rowIndexSet.size && idSet.has(String(item.ID_Pendaftaran || '').trim());
    if (byRow || byId) {
      return { ...item, Status: newStatus };
    }
    return item;
  });

  memoryStore.registrations = updated;
  notifyDataChanged('registrations', { updatedCount: metaItems.length, newStatus });

  addActivityLog(
    'Verifikasi Massal Santri',
    `${metaItems.length} santri diubah statusnya menjadi "${newStatus}"`,
    'status'
  );

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    activeRegistrationMutations++;
    try {
      await postGas(
        {
          action: 'batch_update_status',
          items: metaItems,
          ids: metaItems.map(m => m.ID_Pendaftaran).filter(Boolean),
          status: newStatus
        },
        { includeAdminPin: true, requireSuccess: true }
      );
    } finally {
      activeRegistrationMutations = Math.max(0, activeRegistrationMutations - 1);
      lastRegistrationMutationAt = Date.now();
    }
  }

  return updated;
};

/**
 * Edit Santri Lengkap Langsung ke Google Sheets
 */
export const updateRegistration = async (idPendaftaran, updatedFields, rowMeta = {}) => {
  const sanitizedFields = { ...updatedFields };
  if (sanitizedFields.Nomor_WA !== undefined) {
    sanitizedFields.Nomor_WA = normalizePhoneLocal08(sanitizedFields.Nomor_WA);
  }
  if (sanitizedFields.Nama_Lengkap !== undefined) {
    const upperName = String(sanitizedFields.Nama_Lengkap).trim().toUpperCase();
    sanitizedFields.Nama_Lengkap = upperName;
    sanitizedFields.Nama_Santri = upperName;
  } else if (sanitizedFields.Nama_Santri !== undefined) {
    const upperName = String(sanitizedFields.Nama_Santri).trim().toUpperCase();
    sanitizedFields.Nama_Santri = upperName;
    sanitizedFields.Nama_Lengkap = upperName;
  }
  if (sanitizedFields.Kelas_Kategori !== undefined) {
    sanitizedFields.Kelas_Diniyah = sanitizedFields.Kelas_Kategori;
  } else if (sanitizedFields.Kelas_Diniyah !== undefined) {
    sanitizedFields.Kelas_Kategori = sanitizedFields.Kelas_Diniyah;
  }

  const targetRowIndex = rowMeta?.rowIndex || updatedFields?.rowIndex;
  const matchNama = String(rowMeta?.Nama_Santri || rowMeta?.Nama_Lengkap || '').trim().toUpperCase();
  const matchCabang = String(rowMeta?.Cabang_Lomba || '').trim().toLowerCase();

  const currentList = getLocalRegistrations();
  const updated = currentList.map(item => {
    const sameRow = targetRowIndex
      ? Number(item.rowIndex) === Number(targetRowIndex)
      : (
          item.ID_Pendaftaran === idPendaftaran &&
          (!matchNama || String(item.Nama_Lengkap || item.Nama_Santri || '').trim().toUpperCase() === matchNama) &&
          (!matchCabang || String(item.Cabang_Lomba || '').trim().toLowerCase() === matchCabang)
        );
    if (sameRow) {
      return { ...item, ...sanitizedFields };
    }
    return item;
  });

  memoryStore.registrations = updated;
  notifyDataChanged('registrations', { idPendaftaran, updatedFields: sanitizedFields });

  addActivityLog(
    'Update Data Santri',
    `Data santri ${idPendaftaran} diperbarui`,
    'update'
  );

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    activeRegistrationMutations++;
    try {
      const remoteFields = { ...sanitizedFields };
      if (remoteFields.Nomor_WA !== undefined) {
        remoteFields.Nomor_WA = toSheetPlainTextPhone(remoteFields.Nomor_WA);
      }
      if (remoteFields.Nomor_Urut !== undefined && String(remoteFields.Nomor_Urut).trim() !== '') {
        remoteFields.Nomor_Urut = `'${String(remoteFields.Nomor_Urut).trim()}`;
      }
      await postGas(
        {
          action: 'edit_santri',
          ID_Pendaftaran: idPendaftaran,
          ...(targetRowIndex ? { rowIndex: targetRowIndex } : {}),
          ...(matchNama ? { Match_Nama: matchNama } : {}),
          ...(matchCabang ? { Match_Cabang: matchCabang } : {}),
          ...remoteFields
        },
        { includeAdminPin: true, requireSuccess: true }
      );
    } finally {
      activeRegistrationMutations = Math.max(0, activeRegistrationMutations - 1);
      lastRegistrationMutationAt = Date.now();
    }
  }

  return updated;
};

/**
 * Hapus Santri Langsung dari Google Sheets
 */
export const deleteRegistration = async (idPendaftaran, rowMeta = {}) => {
  const targetRowIndex = rowMeta?.rowIndex;
  const matchNama = String(rowMeta?.Nama_Santri || rowMeta?.Nama_Lengkap || '').trim().toUpperCase();
  const currentList = getLocalRegistrations();
  const filtered = currentList.filter(item => {
    if (targetRowIndex && item.rowIndex) {
      return Number(item.rowIndex) !== Number(targetRowIndex);
    }
    if (item.ID_Pendaftaran !== idPendaftaran) return true;
    if (matchNama) {
      return String(item.Nama_Lengkap || item.Nama_Santri || '').trim().toUpperCase() !== matchNama;
    }
    return false;
  });

  memoryStore.registrations = filtered;
  notifyDataChanged('registrations', { deletedId: idPendaftaran });

  addActivityLog('Hapus Santri', `Santri ${idPendaftaran} dihapus dari pendaftaran`, 'delete');

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    activeRegistrationMutations++;
    try {
      await postGas(
        {
          action: 'delete_santri',
          ID_Pendaftaran: idPendaftaran,
          ...(targetRowIndex ? { rowIndex: targetRowIndex } : {}),
          ...(matchNama ? { Match_Nama: matchNama } : {})
        },
        { includeAdminPin: true, requireSuccess: true }
      );
    } finally {
      activeRegistrationMutations = Math.max(0, activeRegistrationMutations - 1);
      lastRegistrationMutationAt = Date.now();
    }
  }

  return filtered;
};

/**
 * Undi Nomor Peserta Seluruh / Per Cabang Santri di Google Sheets
 */
export const generateRandomQueueNumbers = async (category = 'ALL', startNumber = 1) => {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) {
    return { success: false, message: 'URL Google Apps Script belum dikonfigurasi.' };
  }

  try {
    activeRegistrationMutations++;
    const json = await postGas(
      {
        action: 'undi_nomor',
        category: category || 'ALL',
        startNumber: Number(startNumber) || 1
      },
      { includeAdminPin: true, requireSuccess: true }
    );
    const fresh = await fetchRegistrations(true);
    notifyDataChanged('registrations', fresh);
    return {
      success: true,
      count: fresh.length,
      countAssigned: (json && typeof json.countAssigned === 'number') ? json.countAssigned : fresh.length
    };
  } catch (e) {
    console.warn('Undi nomor via Google Sheets gagal:', e);
    return { success: false, message: e.message || 'Gagal menghubungi Google Sheets.' };
  } finally {
    activeRegistrationMutations = Math.max(0, activeRegistrationMutations - 1);
    lastRegistrationMutationAt = Date.now();
  }
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
  const list = Array.isArray(memoryStore.waliKelas) && memoryStore.waliKelas.length > 0
    ? memoryStore.waliKelas
    : MASTER_WALI_KELAS;
  return list.map(u => ({ ...u, kontak: u.kontak ? normalizePhoneLocal08(u.kontak) : '' }));
};

/**
 * Mengambil master Ustadz / Wali Kelas langsung dari Google Sheets
 */
export const fetchWaliKelas = async () => {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) return getWaliKelasList();

  try {
    const url = buildGasUrl('get_ustadz');
    const resp = await fetch(url, { method: 'GET' });
    if (resp.ok) {
      const result = await resp.json();
      if (result.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
        const normalized = result.data.map(u => ({
          ...u,
          kontak: u.kontak ? normalizePhoneLocal08(u.kontak) : ''
        }));
        memoryStore.waliKelas = normalized;
        return normalized;
      }
    }
  } catch (err) {
    console.warn('Gagal ambil data Ustadz dari Google Sheets, menggunakan master bawaan:', err);
  }

  return getWaliKelasList();
};

export const saveWaliKelas = async (ustadzData) => {
  const list = getWaliKelasList();
  const id = ustadzData.id || `ust-${Date.now()}`;
  const newItem = {
    ...ustadzData,
    id,
    kontak: ustadzData.kontak ? normalizePhoneLocal08(ustadzData.kontak) : ''
  };
  const existingIdx = list.findIndex(u => u.id === id);

  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...list];
    updatedList[existingIdx] = newItem;
  } else {
    updatedList = [...list, newItem];
  }

  memoryStore.waliKelas = updatedList;
  notifyDataChanged('wali_kelas', newItem);

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    await postGas(
      {
        action: 'save_ustadz',
        ...newItem,
        kontak: toSheetPlainTextPhone(newItem.kontak)
      },
      { includeAdminPin: true, requireSuccess: true }
    );
  }

  return updatedList;
};

export const deleteWaliKelas = async (id) => {
  const list = getWaliKelasList();
  const filtered = list.filter(u => u.id !== id);

  memoryStore.waliKelas = filtered;
  notifyDataChanged('wali_kelas', { deletedId: id });

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    await postGas(
      { action: 'delete_ustadz', id },
      { includeAdminPin: true, requireSuccess: true }
    );
  }

  return filtered;
};

export const syncAllWaliKelasToGas = async () => {
  const list = getWaliKelasList();
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) throw new Error('URL Google Apps Script belum dikonfigurasi.');

  for (const item of list) {
    await postGas(
      {
        action: 'save_ustadz',
        ...item,
        kontak: toSheetPlainTextPhone(item.kontak || '')
      },
      { includeAdminPin: true, requireSuccess: true }
    );
  }

  return { success: true, count: list.length };
};

// =========================================================================
// 3. MASTER TINGKAT DAN KELAS DINIYAH (SHEET: Tingkat_dan_Kelas)
// =========================================================================

export const getTingkatList = () => TINGKAT_LIST;

export const getSubKelasByTingkat = () => {
  return memoryStore.subKelas || SUB_KELAS_BY_TINGKAT;
};

/**
 * Mengambil daftar Kelas Diniyah langsung dari Google Sheets
 */
export const fetchTingkatKelas = async () => {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) return getSubKelasByTingkat();

  try {
    const url = buildGasUrl('get_tingkat_kelas');
    const resp = await fetch(url, { method: 'GET' });
    if (resp.ok) {
      const result = await resp.json();
      if (result.status === 'success' && Array.isArray(result.data) && result.data.length > 0) {
        const grouped = { ula: [], wustho: [], ulya: [], mhq_juz: [] };
        result.data.forEach(item => {
          const tId = String(item.kodeTingkat || 'ula').toLowerCase().trim();
          if (!grouped[tId]) grouped[tId] = [];
          if (item.namaKelas && !grouped[tId].includes(item.namaKelas)) {
            grouped[tId].push(item.namaKelas);
          }
        });

        memoryStore.subKelas = grouped;
        return grouped;
      }
    }
  } catch (err) {
    console.warn('Gagal ambil data Kelas Diniyah dari Google Sheets, menggunakan master bawaan:', err);
  }

  return getSubKelasByTingkat();
};

export const addKelasToTingkat = async (tingkatId, namaKelas, keterangan = '') => {
  const current = getSubKelasByTingkat();
  const grouped = { ...current, [tingkatId]: [...(current[tingkatId] || [])] };
  if (!grouped[tingkatId].includes(namaKelas)) {
    grouped[tingkatId].push(namaKelas);
  }

  memoryStore.subKelas = grouped;
  notifyDataChanged('sub_kelas', { tingkatId, namaKelas });

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    await postGas(
      { action: 'save_kelas', tingkatId, namaKelas, keterangan },
      { includeAdminPin: true, requireSuccess: true }
    );
  }

  return grouped;
};

export const updateKelasInTingkat = async (tingkatId, oldName, newName, keterangan = '') => {
  const current = getSubKelasByTingkat();
  const grouped = {
    ...current,
    [tingkatId]: (current[tingkatId] || []).map(n => (n === oldName ? newName : n))
  };

  memoryStore.subKelas = grouped;
  notifyDataChanged('sub_kelas', { tingkatId, oldName, newName });

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    await postGas(
      { action: 'delete_kelas', namaKelas: oldName },
      { includeAdminPin: true, requireSuccess: false }
    );
    await postGas(
      { action: 'save_kelas', tingkatId, namaKelas: newName, keterangan },
      { includeAdminPin: true, requireSuccess: true }
    );
  }

  return grouped;
};

export const deleteKelasFromTingkat = async (tingkatId, namaKelas) => {
  const current = getSubKelasByTingkat();
  const grouped = {
    ...current,
    [tingkatId]: (current[tingkatId] || []).filter(n => n !== namaKelas)
  };

  memoryStore.subKelas = grouped;
  notifyDataChanged('sub_kelas', { tingkatId, deletedKelas: namaKelas });

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    await postGas(
      { action: 'delete_kelas', namaKelas },
      { includeAdminPin: true, requireSuccess: true }
    );
  }

  return grouped;
};

export const resetTingkatKelasToMaster = async () => {
  memoryStore.subKelas = SUB_KELAS_BY_TINGKAT;
  notifyDataChanged('sub_kelas', SUB_KELAS_BY_TINGKAT);

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    await postGas(
      { action: 'reset_30_kelas' },
      { includeAdminPin: true, requireSuccess: true }
    );
  }

  return SUB_KELAS_BY_TINGKAT;
};

export const syncAllTingkatKelasToGas = async (customData = null) => {
  const dataToSync = customData && typeof customData === 'object' ? customData : getSubKelasByTingkat();
  memoryStore.subKelas = dataToSync;
  notifyDataChanged('sub_kelas', dataToSync);

  const gasUrl = getStoredGasUrl();
  if (!gasUrl) throw new Error('URL Google Apps Script belum dikonfigurasi.');

  const res = await postGas(
    { action: 'sync_all_kelas', data: dataToSync },
    { includeAdminPin: true, requireSuccess: true }
  );
  return { success: true, message: res?.message };
};

// =========================================================================
// 4. JUARA LOMBA & KLASEMEN (SHEET: Juara_Lomba)
// =========================================================================

export const getJuaraList = () => {
  return Array.isArray(memoryStore.juara) ? memoryStore.juara : [];
};

export const fetchJuaraLomba = async () => {
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) return getJuaraList();

  try {
    const url = buildGasUrl('get_juara');
    const resp = await fetch(url, { method: 'GET' });
    if (resp.ok) {
      const result = await resp.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        memoryStore.juara = result.data;
        return result.data;
      }
    }
  } catch (e) {
    console.warn('Gagal ambil data Juara dari Google Sheets:', e);
  }

  return getJuaraList();
};

export const saveJuara = async (cabangKeyOrItem, optionalPayload = null) => {
  const list = getJuaraList();
  let updatedList;

  if (typeof cabangKeyOrItem === 'string' && optionalPayload && typeof optionalPayload === 'object') {
    const cabangLomba = optionalPayload.cabangLomba || cabangKeyOrItem.split('__')[0] || '';
    const kategoriTingkat = optionalPayload.tingkat || optionalPayload.kategoriTingkat || cabangKeyOrItem.split('__')[1] || '';
    const matchKey = `${cabangLomba}__${kategoriTingkat}`.toLowerCase();

    const remaining = list.filter(j => {
      const rowKey = `${j.cabangLomba || ''}__${j.kategoriTingkat || j.tingkat || ''}`.toLowerCase();
      return rowKey !== matchKey;
    });

    const newRows = [];
    [1, 2, 3].forEach(rank => {
      const detail = optionalPayload[`juara${rank}`];
      if (!detail || !detail.nama) return;
      const poin = SKEMA_POIN_JUARA[rank] ? SKEMA_POIN_JUARA[rank].poin : 1;
      newRows.push({
        idJuara: `JUR-${Date.now()}-${rank}`,
        cabangLomba,
        kategoriTingkat,
        juaraKe: `Juara ${rank}`,
        namaSantri: detail.nama,
        kelasDiniyah: detail.kelas || '',
        poin,
        santriId: detail.santriId || '',
        jenisKelamin: detail.jenisKelamin || ''
      });
    });

    updatedList = [...remaining, ...newRows];
    memoryStore.juara = updatedList;
    notifyDataChanged('juara', newRows);

    const gasUrl = getStoredGasUrl();
    if (gasUrl) {
      await postGas(
        { action: 'save_juara', isFullSync: true, data: updatedList },
        { includeAdminPin: true, requireSuccess: true }
      );
    }
    return updatedList;
  }

  const juaraItem = typeof cabangKeyOrItem === 'object' && cabangKeyOrItem !== null ? cabangKeyOrItem : {};
  const idJuara = juaraItem.idJuara || `JUR-${Date.now()}`;
  const newItem = { ...juaraItem, idJuara };
  const rank = parseInt(String(newItem.juaraKe || '').replace(/\D/g, ''), 10) || 1;
  newItem.poin = SKEMA_POIN_JUARA[rank] ? SKEMA_POIN_JUARA[rank].poin : 1;

  const existingIdx = list.findIndex(j => j.idJuara === idJuara);
  if (existingIdx >= 0) {
    updatedList = [...list];
    updatedList[existingIdx] = newItem;
  } else {
    updatedList = [...list, newItem];
  }

  memoryStore.juara = updatedList;
  notifyDataChanged('juara', newItem);

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    await postGas(
      { action: 'save_juara', ...newItem },
      { includeAdminPin: true, requireSuccess: true }
    );
  }

  return updatedList;
};

export const deleteJuara = async (idOrCabangKey) => {
  const list = getJuaraList();
  const keyLower = String(idOrCabangKey || '').toLowerCase();
  const filtered = list.filter(j => {
    if (j.idJuara === idOrCabangKey) return false;
    const rowKey = `${j.cabangLomba || ''}__${j.kategoriTingkat || j.tingkat || ''}`.toLowerCase();
    return rowKey !== keyLower;
  });

  memoryStore.juara = filtered;
  notifyDataChanged('juara', { deletedId: idOrCabangKey });

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    await postGas(
      { action: 'save_juara', isFullSync: true, data: filtered },
      { includeAdminPin: true, requireSuccess: true }
    );
  }

  return filtered;
};

export const calculateKlasemenJuara = (juaraList = []) => {
  const totalPoinByKelas = {};
  if (Array.isArray(juaraList)) {
    juaraList.forEach(item => {
      const k = item?.kelasDiniyah || item?.Kelas_Diniyah || '';
      const p = parseInt(item?.poin, 10) || 0;
      if (k) {
        totalPoinByKelas[k] = (totalPoinByKelas[k] || 0) + p;
      }
    });
  }
  return totalPoinByKelas;
};

// =========================================================================
// 5. RIWAYAT LOG AKTIVITAS (IN-MEMORY) & KONEKSI SISTEM
// =========================================================================

export const getActivityLogs = () => {
  return Array.isArray(memoryStore.activityLogs) ? memoryStore.activityLogs : [];
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

  memoryStore.activityLogs = [newLog, ...current].slice(0, 100);
  return newLog;
};

export const clearActivityLogs = () => {
  memoryStore.activityLogs = [];
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

// =========================================================================
// 6. INTEGRASI PENGATURAN MUSABAQAH LANGSUNG DARI SHEET "Pengaturan"
// =========================================================================

export const DEFAULT_PENGATURAN = {
  NAMA_KEGIATAN: 'Musabaqah Akhirussanah Pondok Pesantren Al-Falah Putak',
  TAHUN_AJARAN: '1447 H / 2026 M',
  STATUS_PENDAFTARAN: 'Buka',
  TANGGAL_PELAKSANAAN: '2026-11-20 s/d 2026-11-25',
  KUOTA_PER_CABANG: '3',
  TARGET_KUOTA_KELAS: '10'
};

export const getLocalPengaturan = () => {
  return memoryStore.pengaturan ? { ...DEFAULT_PENGATURAN, ...memoryStore.pengaturan } : { ...DEFAULT_PENGATURAN };
};

export const fetchPengaturan = async () => {
  const local = getLocalPengaturan();
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) return local;

  try {
    const url = buildGasUrl('get_pengaturan');
    const resp = await fetch(url, { method: 'GET' });
    if (resp.ok) {
      const result = await resp.json();
      if (result.status === 'success' && result.data && typeof result.data === 'object') {
        const merged = { ...DEFAULT_PENGATURAN, ...result.data };
        memoryStore.pengaturan = merged;
        return merged;
      }
    }
  } catch (err) {
    console.warn('Gagal fetch pengaturan dari Google Sheets:', err);
  }

  return local;
};

export const savePengaturan = async (settings) => {
  const merged = { ...getLocalPengaturan(), ...settings };
  memoryStore.pengaturan = merged;
  notifyDataChanged('pengaturan', merged);

  addActivityLog(
    'Update Pengaturan Sistem',
    'Pengaturan musabaqah diperbarui (Status: ' + (merged.STATUS_PENDAFTARAN || 'Buka') + ')',
    'system'
  );

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    await postGas(
      {
        action: 'save_pengaturan',
        settings: merged
      },
      { includeAdminPin: true, requireSuccess: true }
    );
  }

  return merged;
};

// =========================================================================
// 7. PENCATATAN PANITIA: PENGELUARAN & KEBUTUHAN SEBELUM HARI-H
// =========================================================================

export const getPengeluaranList = () => {
  return Array.isArray(memoryStore.pengeluaran) ? memoryStore.pengeluaran : [];
};

export const fetchPengeluaran = async () => {
  const local = getPengeluaranList();
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) return local;

  try {
    const url = buildGasUrl('get_pengeluaran', { adminPin: getActiveAdminPinForRequests() });
    const resp = await fetch(url, { method: 'GET' });
    if (resp.ok) {
      const result = await resp.json();
      if (
        result.status === 'success' &&
        result.sheet === 'Pencatatan_Pengeluaran' &&
        Array.isArray(result.data)
      ) {
        memoryStore.pengeluaran = result.data;
        return result.data;
      }
    }
  } catch (err) {
    console.warn('Gagal mengambil data Pengeluaran dari Google Sheets:', err);
  }

  return local;
};

export const savePengeluaran = async (itemData) => {
  const list = getPengeluaranList();
  const idPengeluaran = itemData.idPengeluaran || `OUT-${Date.now()}`;
  const hargaSatuan = Math.max(0, Number(itemData.hargaSatuan) || 0);
  const qty = Math.max(0, Number(itemData.qty) || 0);
  const computedTotal = hargaSatuan > 0 && qty > 0 ? hargaSatuan * qty : Math.max(0, Number(itemData.total) || 0);
  const total = itemData.manualTotal && Number(itemData.total) >= 0 ? Number(itemData.total) : computedTotal;

  const entry = {
    idPengeluaran,
    tanggal: itemData.tanggal || new Date().toISOString().slice(0, 10),
    namaAkun: String(itemData.namaAkun || '').trim(),
    satuan: String(itemData.satuan || 'Pcs').trim(),
    hargaSatuan,
    qty,
    total,
    keterangan: String(itemData.keterangan || '').trim(),
    updatedAt: new Date().toISOString()
  };

  const existingIdx = list.findIndex(x => x.idPengeluaran === idPengeluaran);
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...list];
    updatedList[existingIdx] = { ...updatedList[existingIdx], ...entry };
  } else {
    updatedList = [entry, ...list];
  }

  memoryStore.pengeluaran = updatedList;
  notifyDataChanged('pengeluaran', entry);
  addActivityLog(
    existingIdx >= 0 ? 'Perbarui Pengeluaran' : 'Catat Pengeluaran',
    `${entry.namaAkun} (${entry.qty} ${entry.satuan} = Rp ${entry.total.toLocaleString('id-ID')})`,
    'update'
  );

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    await postGas(
      { action: 'save_pengeluaran', ...entry },
      { includeAdminPin: true, requireSuccess: true }
    );
  }

  return updatedList;
};

export const deletePengeluaran = async (idPengeluaran) => {
  const list = getPengeluaranList();
  const target = list.find(x => x.idPengeluaran === idPengeluaran);
  const filtered = list.filter(x => x.idPengeluaran !== idPengeluaran);

  memoryStore.pengeluaran = filtered;
  notifyDataChanged('pengeluaran', { deletedId: idPengeluaran });
  if (target) {
    addActivityLog('Hapus Pengeluaran', `${target.namaAkun} dihapus dari pencatatan`, 'delete');
  }

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    await postGas(
      { action: 'delete_pengeluaran', idPengeluaran },
      { includeAdminPin: true, requireSuccess: true }
    );
  }

  return filtered;
};

export const getKebutuhanList = () => {
  return Array.isArray(memoryStore.kebutuhan) ? memoryStore.kebutuhan : [];
};

export const fetchKebutuhan = async () => {
  const local = getKebutuhanList();
  const gasUrl = getStoredGasUrl();
  if (!gasUrl) return local;

  try {
    const url = buildGasUrl('get_kebutuhan', { adminPin: getActiveAdminPinForRequests() });
    const resp = await fetch(url, { method: 'GET' });
    if (resp.ok) {
      const result = await resp.json();
      if (
        result.status === 'success' &&
        result.sheet === 'Pencatatan_Kebutuhan' &&
        Array.isArray(result.data)
      ) {
        memoryStore.kebutuhan = result.data;
        return result.data;
      }
    }
  } catch (err) {
    console.warn('Gagal mengambil data Kebutuhan dari Google Sheets:', err);
  }

  return local;
};

export const saveKebutuhan = async (itemData) => {
  const list = getKebutuhanList();
  const idKebutuhan = itemData.idKebutuhan || `KEB-${Date.now()}`;
  const qty = Math.max(0, Number(itemData.qty) || 0);

  const entry = {
    idKebutuhan,
    namaKebutuhan: String(itemData.namaKebutuhan || '').trim(),
    kategori: String(itemData.kategori || 'Perlengkapan').trim(),
    qty: qty > 0 ? qty : 1,
    satuan: String(itemData.satuan || 'Pcs').trim(),
    targetTanggal: String(itemData.targetTanggal || '').trim(),
    penanggungJawab: String(itemData.penanggungJawab || '').trim(),
    status: itemData.status || 'Belum Siap',
    keterangan: String(itemData.keterangan || '').trim(),
    updatedAt: new Date().toISOString()
  };

  const existingIdx = list.findIndex(x => x.idKebutuhan === idKebutuhan);
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...list];
    updatedList[existingIdx] = { ...updatedList[existingIdx], ...entry };
  } else {
    updatedList = [entry, ...list];
  }

  memoryStore.kebutuhan = updatedList;
  notifyDataChanged('kebutuhan', entry);
  addActivityLog(
    existingIdx >= 0 ? 'Perbarui Kebutuhan' : 'Catat Kebutuhan',
    `${entry.namaKebutuhan} (${entry.qty} ${entry.satuan} • ${entry.status})`,
    'update'
  );

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    await postGas(
      { action: 'save_kebutuhan', ...entry },
      { includeAdminPin: true, requireSuccess: true }
    );
  }

  return updatedList;
};

export const deleteKebutuhan = async (idKebutuhan) => {
  const list = getKebutuhanList();
  const target = list.find(x => x.idKebutuhan === idKebutuhan);
  const filtered = list.filter(x => x.idKebutuhan !== idKebutuhan);

  memoryStore.kebutuhan = filtered;
  notifyDataChanged('kebutuhan', { deletedId: idKebutuhan });
  if (target) {
    addActivityLog('Hapus Kebutuhan', `${target.namaKebutuhan} dihapus dari daftar`, 'delete');
  }

  const gasUrl = getStoredGasUrl();
  if (gasUrl) {
    await postGas(
      { action: 'delete_kebutuhan', idKebutuhan },
      { includeAdminPin: true, requireSuccess: true }
    );
  }

  return filtered;
};
