import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { 
  Settings,
  Database, 
  Link2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  FileSpreadsheet, 
  Download, 
  ExternalLink,
  Layers,
  Save,
  Sliders,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Info,
  FileText,
  FolderDown,
  FileDown,
  Table,
  CheckCircle
} from 'lucide-react';
import { 
  getStoredGasUrl, 
  setStoredGasUrl, 
  getAdminPin, 
  changeAdminPin,
  addActivityLog,
  fetchRegistrations,
  getActivityLogs,
  fetchPengaturan,
  savePengaturan,
  getLocalPengaturan,
  DEFAULT_PENGATURAN,
  testGasConnection,
  fetchWaliKelas,
  fetchTingkatKelas,
  fetchJuaraLomba,
  fetchPengeluaran,
  fetchKebutuhan
} from '../../shared/services/api';
import { getGenderFromKelas } from '../../shared/data/competitions';

// Helper Format Tanggal ISO YYYY-MM-DD
const getTodayIso = () => {
  try {
    return new Date().toISOString().slice(0, 10);
  } catch (e) {
    return '2026-11-26';
  }
};

// Helper Escape RFC 4180 untuk Kolom CSV
const escapeCsvCell = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Helper Trigger Download Berkas CSV UTF-8 dengan BOM (Bebas Rusak Karakter di Excel)
const triggerCsvDownload = (filename, headers, rows) => {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const rowLines = rows.map(r => r.map(escapeCsvCell).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default function AdminPengaturan({ onRefresh }) {
  // Navigation Tabs: Default 'musabaqah' | 'sheets' | 'security' | 'export'
  const [activeTab, setActiveTab] = useState('musabaqah');

  // =========================================================
  // 1. STATE PENGATURAN MUSABAQAH DARI SHEET "Pengaturan"
  // =========================================================
  const [settingsForm, setSettingsForm] = useState(() => getLocalPengaturan());
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    const loadSettingsFromCloud = async () => {
      setIsLoadingSettings(true);
      try {
        const cloudSettings = await fetchPengaturan();
        setSettingsForm(cloudSettings);
      } catch (e) {
        console.warn('Gagal load pengaturan cloud:', e);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    loadSettingsFromCloud();
  }, []);

  const handleSettingsChange = (key, value) => {
    setSettingsForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setIsSavingSettings(true);
    try {
      await savePengaturan(settingsForm);
      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      }).fire({
        icon: 'success',
        title: 'Pengaturan Sheet Berhasil Disimpan!'
      });
      if (onRefresh) onRefresh(false);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.message || 'Terjadi kesalahan saat menyimpan pengaturan.'
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleReloadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const data = await fetchPengaturan();
      setSettingsForm(data);
      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true
      }).fire({
        icon: 'info',
        title: 'Pengaturan Disinkronkan dari Google Sheets'
      });
    } catch (e) {
      Swal.fire('Gagal!', 'Tidak dapat memuat pengaturan dari sheet: ' + e.message, 'error');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // =========================================================
  // 2. STATE KONEKSI GOOGLE SHEETS
  // =========================================================
  const [gasUrl, setGasUrl] = useState(() => getStoredGasUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedSheetTab, setSelectedSheetTab] = useState('Pengaturan');

  const handleSaveGasUrl = () => {
    setStoredGasUrl(gasUrl.trim());
    addActivityLog('Pengaturan Sheets', 'URL Web App Google Apps Script diperbarui', 'system');
    Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    }).fire({
      icon: 'success',
      title: 'URL Google Apps Script Disimpan'
    });
    if (onRefresh) onRefresh(false);
  };

  const handleTestConnection = async () => {
    if (!gasUrl.trim()) {
      setTestResult({ 
        success: false, 
        message: 'URL Google Apps Script belum dimasukkan. Masukkan URL Web App terlebih dahulu.' 
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testGasConnection(gasUrl.trim());
      if (res.success) {
        setTestResult({
          success: true,
          message: `Alhamdulillah! Terhubung ke ${res.spreadsheetName ? `"${res.spreadsheetName}"` : 'Google Spreadsheet Panitia'}. Seluruh 8 lembar kerja resmi aktif & tersinkronisasi termasuk Pendaftaran, Tingkat_dan_Kelas, Ustadz, Juara_Lomba, Pencatatan_Pengeluaran, Pencatatan_Kebutuhan, Pengaturan, dan Admin.`
        });
        addActivityLog('Tes Koneksi Sheets', 'Koneksi Google Sheets sukses tersambung', 'system');
      } else {
        setTestResult({
          success: false,
          message: res.message || 'Respon dari Google Apps Script belum valid.'
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Koneksi gagal atau terblokir CORS: ' + err.message + '. Pastikan opsi Who has access diset ke "Anyone".'
      });
    } finally {
      setIsTesting(false);
    }
  };

  // =========================================================
  // 3. STATE KEAMANAN PIN ADMIN
  // =========================================================
  const [currentPin, setCurrentPin] = useState(() => getAdminPin());
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleUpdatePin = async (e) => {
    e.preventDefault();
    const trimmedNew = newPin.trim();
    const trimmedConfirm = confirmPin.trim();

    if (!trimmedNew || trimmedNew.length < 4) {
      Swal.fire('Perhatian', 'PIN baru minimal harus 4 karakter / angka.', 'warning');
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      Swal.fire('Perhatian', 'Konfirmasi PIN tidak cocok dengan PIN baru.', 'warning');
      return;
    }

    try {
      const result = await changeAdminPin(trimmedNew);
      setCurrentPin(trimmedNew);
      setNewPin('');
      setConfirmPin('');
      Swal.fire({
        icon: 'success',
        title: 'PIN Berhasil Diperbarui',
        text: result.syncedToSheets
          ? 'PIN Akses Admin berhasil diperbarui dan disinkronkan ke Sheet Admin Google Sheets.'
          : 'PIN Akses Admin berhasil diperbarui secara lokal.',
        timer: 2200,
        showConfirmButton: false
      });
      addActivityLog('Keamanan Admin', 'PIN Akses Admin berhasil diubah oleh panitia', 'security');
    } catch (err) {
      Swal.fire('Gagal Memperbarui PIN', err.message || 'Gagal menyinkronkan PIN ke Google Sheets.', 'error');
    }
  };

  // =========================================================
  // 4. EKSPOR & UNDUH CSV SELURUH LEMBAR KERJA DATABASE
  // =========================================================
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [exportingSheetId, setExportingSheetId] = useState(null);
  const [totalLogsCount, setTotalLogsCount] = useState(0);

  useEffect(() => {
    try {
      const logs = getActivityLogs() || [];
      setTotalLogsCount(logs.length);
    } catch (e) {
      setTotalLogsCount(0);
    }
  }, []);

  const copyScript = async () => {
    try {
      const { default: rawScriptCode } = await import('../../../google-apps-script/Code.gs?raw');
      await navigator.clipboard.writeText(rawScriptCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      Swal.fire('Gagal Menyalin', 'Tidak dapat menyalin file Code.gs secara otomatis.', 'error');
    }
  };

  // Ambil data resmi per lembar kerja untuk diekspor ke CSV murni
  const getSheetDataset = async (sheetId) => {
    const today = getTodayIso();
    const yearTag = '1447H';
    const ver = 'v1.0';

    if (sheetId === 'Pendaftaran') {
      const data = await fetchRegistrations(false);
      const headers = [
        'Timestamp', 'Wali_Kelas', 'Nomor_WA', 'ID_Pendaftaran', 'Nomor_Urut',
        'Nama_Santri', 'Jenis_Kelamin', 'Tingkat', 'Kelas_Diniyah',
        'Cabang_Lomba', 'Detail_Cabang', 'Status', 'Catatan'
      ];
      const rows = (data || []).map(item => [
        item.Timestamp || item.timestamp || '',
        item.Wali_Kelas || item.waliKelas || '',
        item.Nomor_WA || item.nomorWa || '',
        item.ID_Pendaftaran || item.idPendaftaran || '',
        item.Nomor_Urut || item.nomorUrut || '',
        item.Nama_Santri || item.Nama_Lengkap || item.namaSantri || item.namaLengkap || '',
        item.Jenis_Kelamin || item.jenisKelamin || '',
        item.Tingkat || item.tingkat || '',
        item.Kelas_Diniyah || item.Kelas_Kategori || item.kelasDiniyah || item.kelasKategori || '',
        item.Cabang_Lomba || item.cabangLomba || '',
        item.Detail_Cabang || item.detailCabang || '',
        item.Status || item.status || 'Pending',
        item.Catatan || item.catatan || ''
      ]);
      return {
        sheetId: 'Pendaftaran',
        sheetName: 'Pendaftaran',
        filename: `Sheet_Pendaftaran_${yearTag}_${today}_${ver}.csv`,
        headers,
        rows,
        total: rows.length
      };
    }

    if (sheetId === 'Tingkat_dan_Kelas') {
      const subKelas = await fetchTingkatKelas();
      const headers = ['Kode_Tingkat', 'Nama_Tingkat', 'Nama_Kelas_Diniyah', 'Keterangan'];
      const tingkatLabels = {
        ula: 'Tingkat Ula',
        wustho: 'Tingkat Wustho',
        ulya: 'Tingkat Ulya',
        mhq_juz: 'Tingkat Hifdzil Qur\'an (MHQ)'
      };
      const rows = [];
      Object.entries(subKelas || {}).forEach(([kode, list]) => {
        if (Array.isArray(list)) {
          list.forEach(kelasName => {
            const gender = getGenderFromKelas(kelasName);
            const ket = gender === 'L' ? 'Santri Putra' : gender === 'P' ? 'Santri Putri' : 'Umum / Delegasi';
            rows.push([
              kode,
              tingkatLabels[kode] || kode.toUpperCase(),
              kelasName,
              ket
            ]);
          });
        }
      });
      return {
        sheetId: 'Tingkat_dan_Kelas',
        sheetName: 'Tingkat_dan_Kelas',
        filename: `Sheet_Tingkat_dan_Kelas_${yearTag}_${today}_${ver}.csv`,
        headers,
        rows,
        total: rows.length
      };
    }

    if (sheetId === 'Ustadz') {
      const list = await fetchWaliKelas();
      const headers = ['ID_Ustadz', 'Nama_Ustadz', 'Tingkat', 'Kelas_Diniyah', 'Nomor_WA'];
      const rows = (list || []).map(u => [
        u.id || u.ID_Ustadz || '',
        u.nama || u.Nama_Ustadz || '',
        u.tingkat || u.Tingkat || '',
        u.kelas || u.Kelas_Diniyah || '',
        u.kontak || u.Nomor_WA || ''
      ]);
      return {
        sheetId: 'Ustadz',
        sheetName: 'Ustadz',
        filename: `Sheet_Ustadz_${yearTag}_${today}_${ver}.csv`,
        headers,
        rows,
        total: rows.length
      };
    }

    if (sheetId === 'Juara_Lomba') {
      const list = await fetchJuaraLomba();
      const headers = ['ID_Juara', 'Cabang_Lomba', 'Tingkat', 'Juara_Ke', 'Nama_Santri', 'Kelas_Diniyah', 'Poin'];
      const rows = (list || []).map((j, idx) => [
        j.idJuara || j.id || `JUR-${idx + 1}`,
        j.cabangLomba || j.cabang || '',
        j.tingkat || '',
        j.juaraKe || j.juara || '',
        j.namaSantri || j.nama || '',
        j.kelasDiniyah || j.kelas || '',
        j.poin !== undefined ? j.poin : (j.juaraKe === 1 ? 5 : j.juaraKe === 2 ? 3 : 1)
      ]);
      return {
        sheetId: 'Juara_Lomba',
        sheetName: 'Juara_Lomba',
        filename: `Sheet_Juara_Lomba_${yearTag}_${today}_${ver}.csv`,
        headers,
        rows,
        total: rows.length
      };
    }

    if (sheetId === 'Pencatatan_Pengeluaran') {
      const list = await fetchPengeluaran();
      const headers = ['ID_Pengeluaran', 'Tanggal', 'Nama_Akun', 'Satuan', 'Harga_Satuan', 'Qty', 'Total', 'Keterangan'];
      const rows = (list || []).map(p => [
        p.idPengeluaran || p.id || '',
        p.tanggal || '',
        p.namaAkun || p.nama || '',
        p.satuan || 'Pcs',
        p.hargaSatuan || 0,
        p.qty || 0,
        p.total || 0,
        p.keterangan || ''
      ]);
      return {
        sheetId: 'Pencatatan_Pengeluaran',
        sheetName: 'Pencatatan_Pengeluaran',
        filename: `Sheet_Pencatatan_Pengeluaran_${yearTag}_${today}_${ver}.csv`,
        headers,
        rows,
        total: rows.length
      };
    }

    if (sheetId === 'Pencatatan_Kebutuhan') {
      const list = await fetchKebutuhan();
      const headers = ['ID_Kebutuhan', 'Nama_Kebutuhan', 'Kategori', 'Qty', 'Satuan', 'Target_Hari', 'Penanggung_Jawab', 'Status', 'Keterangan'];
      const rows = (list || []).map(k => [
        k.idKebutuhan || k.id || '',
        k.namaKebutuhan || k.nama || '',
        k.kategori || '',
        k.qty || 0,
        k.satuan || 'Pcs',
        k.targetHari || '',
        k.penanggungJawab || '',
        k.status || 'Belum Siap',
        k.keterangan || ''
      ]);
      return {
        sheetId: 'Pencatatan_Kebutuhan',
        sheetName: 'Pencatatan_Kebutuhan',
        filename: `Sheet_Pencatatan_Kebutuhan_${yearTag}_${today}_${ver}.csv`,
        headers,
        rows,
        total: rows.length
      };
    }

    if (sheetId === 'Pengaturan') {
      const cfg = await fetchPengaturan();
      const headers = ['Kunci_Pengaturan', 'Nilai_Pengaturan', 'Keterangan'];
      const rows = [
        ['NAMA_KEGIATAN', cfg.NAMA_KEGIATAN || DEFAULT_PENGATURAN.NAMA_KEGIATAN, 'Nama resmi agenda musabaqah'],
        ['TAHUN_AJARAN', cfg.TAHUN_AJARAN || DEFAULT_PENGATURAN.TAHUN_AJARAN, 'Tahun ajaran pelaksanaan perlombaan'],
        ['STATUS_PENDAFTARAN', cfg.STATUS_PENDAFTARAN || 'Buka', 'Status pendaftaran (Buka / Tutup)'],
        ['TANGGAL_PELAKSANAAN', cfg.TANGGAL_PELAKSANAAN || DEFAULT_PENGATURAN.TANGGAL_PELAKSANAAN, 'Rentang tanggal pelaksanaan lomba'],
        ['KUOTA_PER_CABANG', String(cfg.KUOTA_PER_CABANG || DEFAULT_PENGATURAN.KUOTA_PER_CABANG), 'Batas maksimal delegasi per cabang lomba per kelas'],
        ['TARGET_KUOTA_KELAS', String(cfg.TARGET_KUOTA_KELAS || DEFAULT_PENGATURAN.TARGET_KUOTA_KELAS), 'Target kuota delegasi lengkap per Kelas Diniyah']
      ];
      return {
        sheetId: 'Pengaturan',
        sheetName: 'Pengaturan',
        filename: `Sheet_Pengaturan_${yearTag}_${today}_${ver}.csv`,
        headers,
        rows,
        total: rows.length
      };
    }

    if (sheetId === 'Admin') {
      const headers = ['ID_Admin', 'Username', 'PIN_Password', 'Nama_Panitia', 'Role', 'Status_Aktif'];
      const rows = [
        ['ADM-001', 'admin', '••••••', 'Panitia Musabaqah Akhirussanah Al-Falah', 'Super Admin', 'Aktif']
      ];
      return {
        sheetId: 'Admin',
        sheetName: 'Admin',
        filename: `Sheet_Admin_${yearTag}_${today}_${ver}.csv`,
        headers,
        rows,
        total: rows.length
      };
    }

    return null;
  };

  // Unduh 1 Lembar Kerja Tunggal sebagai CSV
  const handleDownloadSingleSheetCsv = async (sheetId, sheetLabel) => {
    try {
      setExportingSheetId(sheetId);
      const ds = await getSheetDataset(sheetId);
      if (!ds) throw new Error('Data lembar kerja tidak ditemukan.');
      triggerCsvDownload(ds.filename, ds.headers, ds.rows);
      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      }).fire({
        icon: 'success',
        title: `CSV ${sheetLabel} Berhasil Diunduh!`,
        text: `${ds.total} baris tersimpan.`
      });
      addActivityLog('Unduh CSV', `Panitia mengunduh berkas CSV ${sheetLabel} (${ds.total} baris)`, 'backup');
    } catch (e) {
      Swal.fire('Gagal Mengunduh', e.message || 'Terjadi kesalahan saat mengekspor CSV.', 'error');
    } finally {
      setExportingSheetId(null);
    }
  };

  // Unduh Seluruh 8 Lembar Kerja Sekaligus sebagai Berkas CSV Terpisah
  const handleDownloadAllSheetsCsv = async () => {
    const sheetIds = [
      'Pendaftaran',
      'Tingkat_dan_Kelas',
      'Ustadz',
      'Juara_Lomba',
      'Pencatatan_Pengeluaran',
      'Pencatatan_Kebutuhan',
      'Pengaturan',
      'Admin'
    ];

    setIsExportingCsv(true);
    let successCount = 0;

    try {
      Swal.fire({
        title: 'Mengekspor Seluruh Sheet CSV...',
        text: 'Mengunduh 8 lembar kerja database ke perangkat Anda secara berurutan.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      for (let i = 0; i < sheetIds.length; i++) {
        const id = sheetIds[i];
        const ds = await getSheetDataset(id);
        if (ds) {
          triggerCsvDownload(ds.filename, ds.headers, ds.rows);
          successCount++;
        }
        // Jeda 250ms agar browser dapat mengunduh berkas secara tertib tanpa diblokir
        await new Promise(r => setTimeout(r, 250));
      }

      Swal.fire({
        icon: 'success',
        title: 'Unduh Berhasil!',
        text: `Alhamdulillah! Berhasil mengunduh seluruh ${successCount} lembar kerja resmi database dalam format CSV murni.`,
        timer: 2500,
        showConfirmButton: false
      });

      addActivityLog('Unduh Semua CSV', `Panitia mengunduh seluruh 8 lembar kerja database ke CSV`, 'backup');
    } catch (e) {
      Swal.fire('Gagal!', 'Gagal mengunduh berkas CSV: ' + e.message, 'error');
    } finally {
      setIsExportingCsv(false);
    }
  };

  // Unduh Buku Kerja Spreadsheet Lengkap (.xlsx Multi-Sheet)
  const handleDownloadFullExcelWorkbook = async () => {
    const sheetIds = [
      'Pendaftaran',
      'Tingkat_dan_Kelas',
      'Ustadz',
      'Juara_Lomba',
      'Pencatatan_Pengeluaran',
      'Pencatatan_Kebutuhan',
      'Pengaturan',
      'Admin'
    ];

    setIsExportingCsv(true);

    try {
      Swal.fire({
        title: 'Menyiapkan Buku Kerja Excel...',
        text: 'Menggabungkan 8 lembar kerja resmi ke dalam satu file spreadsheet .xlsx.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const wb = XLSX.utils.book_new();

      for (let i = 0; i < sheetIds.length; i++) {
        const id = sheetIds[i];
        const ds = await getSheetDataset(id);
        if (ds) {
          const aoa = [ds.headers, ...ds.rows];
          const ws = XLSX.utils.aoa_to_sheet(aoa);
          XLSX.utils.book_append_sheet(wb, ws, ds.sheetName.slice(0, 31));
        }
      }

      const today = getTodayIso();
      const filename = `Database_Musabaqah_Akhirussanah_1447H_${today}_v1.0.xlsx`;
      XLSX.writeFile(wb, filename);

      Swal.fire({
        icon: 'success',
        title: 'Buku Kerja Excel Siap!',
        text: `File spreadsheet lengkap multi-sheet "${filename}" berhasil diunduh.`,
        timer: 2500,
        showConfirmButton: false
      });

      addActivityLog('Unduh Excel Lengkap', `Panitia mengunduh Buku Kerja Spreadsheet Excel 8 Sheet (${filename})`, 'backup');
    } catch (e) {
      Swal.fire('Gagal!', 'Gagal membuat buku kerja Excel: ' + e.message, 'error');
    } finally {
      setIsExportingCsv(false);
    }
  };

  // Definisi 8 Lembar Kerja Resmi di Google Spreadsheet
  const sheetsDefinition = [
    {
      id: 'Pengaturan',
      title: 'Sheet 6: "Pengaturan"',
      tag: 'Konfigurasi Sistem',
      totalCols: 3,
      desc: 'Menyimpan konfigurasi utama kegiatan musabaqah, status pendaftaran (Buka/Tutup), tahun ajaran, dan kuota delegasi.',
      columns: [
        { name: 'Kunci_Pengaturan', desc: 'Nama Kunci Konfigurasi (NAMA_KEGIATAN, TAHUN_AJARAN, dll)' },
        { name: 'Nilai_Pengaturan', desc: 'Isi Nilai Konfigurasi' },
        { name: 'Keterangan', desc: 'Deskripsi Kegunaan Pengaturan' }
      ]
    },
    {
      id: 'Pendaftaran',
      title: 'Sheet 2: "Pendaftaran"',
      tag: 'Data Transaksional Santri',
      totalCols: 13,
      desc: 'Menyimpan seluruh data pendaftaran santri delegasi, nomor peserta 3 digit unik global, cabang lomba, dan status verifikasi.',
      columns: [
        { name: 'Timestamp', desc: 'Waktu Pendaftaran' },
        { name: 'Wali_Kelas', desc: 'Wali Kelas Pembina' },
        { name: 'Nomor_WA', desc: 'Nomor WhatsApp Aktif' },
        { name: 'ID_Pendaftaran', desc: 'ID Unik (AKH-001)' },
        { name: 'Nomor_Urut', desc: 'Nomor Peserta 3 Digit (001)' },
        { name: 'Nama_Santri', desc: 'Nama Lengkap Santri' },
        { name: 'Jenis_Kelamin', desc: 'L (Putra) / P (Putri)' },
        { name: 'Tingkat', desc: 'Jenjang Tingkat Santri' },
        { name: 'Kelas_Diniyah', desc: 'Kelas Diniyah Santri' },
        { name: 'Cabang_Lomba', desc: 'Cabang Musabaqah' },
        { name: 'Detail_Cabang', desc: 'Detail Bahasa / Regu' },
        { name: 'Status', desc: 'Pending / Terverifikasi / Ditolak' },
        { name: 'Catatan', desc: 'Catatan Khusus Delegasi' }
      ]
    },
    {
      id: 'Tingkat_dan_Kelas',
      title: 'Sheet 3: "Tingkat_dan_Kelas"',
      tag: 'Master Jenjang & Kelas Diniyah',
      totalCols: 4,
      desc: 'Menyimpan daftar master 30 Kelas Diniyah santri putra dan santri putri terpisah rapi serta jenjang tingkat pendidikan.',
      columns: [
        { name: 'Kode_Tingkat', desc: 'Kode (ula, wustho, mhq_juz)' },
        { name: 'Nama_Tingkat', desc: 'Nama Lengkap Jenjang' },
        { name: 'Nama_Kelas_Diniyah', desc: 'Nama Kelas Diniyah' },
        { name: 'Keterangan', desc: 'Keterangan Santri Putra / Putri' }
      ]
    },
    {
      id: 'Ustadz',
      title: 'Sheet 4: "Ustadz"',
      tag: 'Master Ustadz Wali Kelas',
      totalCols: 5,
      desc: 'Menyimpan 24 Ustadz / Ustadzah wali kelas pembina yang diurutkan rapi dari jenjang Ula Sifir hingga Wustho Alfiyah.',
      columns: [
        { name: 'ID_Ustadz', desc: 'ID Unik Ustadz (ust-01, dst)' },
        { name: 'Nama_Ustadz', desc: 'Nama Lengkap Asatidz' },
        { name: 'Tingkat', desc: 'Jenjang (ula / wustho)' },
        { name: 'Kelas_Diniyah', desc: 'Kelas Diniyah yang Diampu' },
        { name: 'Nomor_WA', desc: 'Nomor WhatsApp Resmi' }
      ]
    },
    {
      id: 'Juara_Lomba',
      title: 'Sheet 5: "Juara_Lomba"',
      tag: 'Rekap Juara & Klasemen',
      totalCols: 7,
      desc: 'Menyimpan daftar peraih Juara 1, 2, dan 3 di setiap cabang lomba untuk akumulasi skor Juara Umum Kelas.',
      columns: [
        { name: 'ID_Juara', desc: 'ID Unik Juara' },
        { name: 'Cabang_Lomba', desc: 'Mata Perlombaan' },
        { name: 'Tingkat', desc: 'Kategori Tingkat' },
        { name: 'Juara_Ke', desc: 'Peringkat (1, 2, atau 3)' },
        { name: 'Nama_Santri', desc: 'Nama Lengkap Pemenang' },
        { name: 'Kelas_Diniyah', desc: 'Kelas Diniyah Pemenang' },
        { name: 'Poin', desc: 'Poin Juara (5, 3, atau 1)' }
      ]
    },
    {
      id: 'Pencatatan_Pengeluaran',
      title: 'Sheet 7: "Pencatatan_Pengeluaran"',
      tag: 'Keuangan & Pengeluaran',
      totalCols: 8,
      desc: 'Menyimpan pencatatan akun pengeluaran panitia, satuan, harga satuan, qty, total biaya, dan catatan.',
      columns: [
        { name: 'ID_Pengeluaran', desc: 'ID Unik Transaksi' },
        { name: 'Tanggal', desc: 'Tanggal Transaksi (YYYY-MM-DD)' },
        { name: 'Nama_Akun', desc: 'Nama Akun / Item Pengeluaran' },
        { name: 'Satuan', desc: 'Satuan Unit (Pcs, Box, Paket, Rim)' },
        { name: 'Harga_Satuan', desc: 'Harga Satuan dalam Rupiah' },
        { name: 'Qty', desc: 'Jumlah Kuantitas' },
        { name: 'Total', desc: 'Total Biaya (Harga Satuan x Qty)' },
        { name: 'Keterangan', desc: 'Catatan / Nomor Nota' }
      ]
    },
    {
      id: 'Pencatatan_Kebutuhan',
      title: 'Sheet 8: "Pencatatan_Kebutuhan"',
      tag: 'Persiapan Sebelum Hari-H',
      totalCols: 9,
      desc: 'Menyimpan daftar perlengkapan & kebutuhan sebelum Hari-H beserta seksi, qty, target waktu, PJ, dan status kesiapan.',
      columns: [
        { name: 'ID_Kebutuhan', desc: 'ID Unik Kebutuhan' },
        { name: 'Nama_Kebutuhan', desc: 'Nama Barang / Perlengkapan' },
        { name: 'Kategori', desc: 'Seksi Panitia (Perlengkapan, Konsumsi, dll)' },
        { name: 'Qty', desc: 'Jumlah Dibutuhkan' },
        { name: 'Satuan', desc: 'Satuan Unit' },
        { name: 'Target_Hari', desc: 'Target Persiapan Sebelum Hari-H' },
        { name: 'Penanggung_Jawab', desc: 'Nama PJ / Koordinator Seksi' },
        { name: 'Status', desc: 'Belum Siap / Dalam Proses / Sudah Siap' },
        { name: 'Keterangan', desc: 'Catatan Spesifikasi Tambahan' }
      ]
    },
    {
      id: 'Admin',
      title: 'Sheet 1: "Admin"',
      tag: 'Otentikasi & Akun Panitia',
      totalCols: 6,
      desc: 'Menyimpan kredensial login panitia, PIN otentikasi, peran hak akses, dan status keaktifan panitia.',
      columns: [
        { name: 'ID_Admin', desc: 'ID Unik Admin (ADM-001)' },
        { name: 'Username', desc: 'Username Login Panitia' },
        { name: 'PIN_Password', desc: 'PIN Password Akses' },
        { name: 'Nama_Panitia', desc: 'Nama Lengkap Panitia' },
        { name: 'Role', desc: 'Super Admin / Panitia' },
        { name: 'Status_Aktif', desc: 'Aktif / Nonaktif' }
      ]
    }
  ];

  const activeSheetDef = sheetsDefinition.find(s => s.id === selectedSheetTab) || sheetsDefinition[0];

  // Daftar ringkasan lembar kerja untuk Tab Ekspor CSV
  const exportSheetList = [
    {
      id: 'Pendaftaran',
      title: 'Sheet 2: Pendaftaran Santri',
      badge: '13 Kolom',
      desc: 'Seluruh peserta santri, nomor urut 3 digit, cabang musabaqah, dan status verifikasi.',
      filenameDesc: 'Sheet_Pendaftaran_1447H_YYYYMMDD_v1.0.csv'
    },
    {
      id: 'Tingkat_dan_Kelas',
      title: 'Sheet 3: Tingkat & Kelas Diniyah',
      badge: 'Master 30 Kelas',
      desc: 'Master 30 Kelas Diniyah (Ula Sifir - Wustho Alfiyah) santri putra dan santri putri.',
      filenameDesc: 'Sheet_Tingkat_dan_Kelas_1447H_YYYYMMDD_v1.0.csv'
    },
    {
      id: 'Ustadz',
      title: 'Sheet 4: Ustadz & Wali Kelas',
      badge: '24 Asatidz',
      desc: 'Master 24 Ustadz / Ustadzah wali kelas pembina dan nomor kontak resmi WhatsApp.',
      filenameDesc: 'Sheet_Ustadz_1447H_YYYYMMDD_v1.0.csv'
    },
    {
      id: 'Juara_Lomba',
      title: 'Sheet 5: Juara & Rekap Lomba',
      badge: '7 Kolom',
      desc: 'Rekapitulasi peraih Juara 1, 2, dan 3 di setiap cabang lomba untuk poin klasemen kelas.',
      filenameDesc: 'Sheet_Juara_Lomba_1447H_YYYYMMDD_v1.0.csv'
    },
    {
      id: 'Pencatatan_Pengeluaran',
      title: 'Sheet 7: Pencatatan Pengeluaran',
      badge: 'Keuangan',
      desc: 'Buku kas rincian transaksi nota, satuan unit, harga satuan, dan total pengeluaran panitia.',
      filenameDesc: 'Sheet_Pencatatan_Pengeluaran_1447H_YYYYMMDD_v1.0.csv'
    },
    {
      id: 'Pencatatan_Kebutuhan',
      title: 'Sheet 8: Pencatatan Kebutuhan',
      badge: 'Logistik',
      desc: 'Rincian barang/perlengkapan sebelum Hari-H, seksi panitia, target waktu, dan status.',
      filenameDesc: 'Sheet_Pencatatan_Kebutuhan_1447H_YYYYMMDD_v1.0.csv'
    },
    {
      id: 'Pengaturan',
      title: 'Sheet 6: Pengaturan Musabaqah',
      badge: 'Konfigurasi',
      desc: 'Parameter resmi nama kegiatan, tahun ajaran 1447 H, batas kuota delegasi, dan portal.',
      filenameDesc: 'Sheet_Pengaturan_1447H_YYYYMMDD_v1.0.csv'
    },
    {
      id: 'Admin',
      title: 'Sheet 1: Admin & Hak Akses',
      badge: 'Otentikasi',
      desc: 'Struktur akun admin, status keaktifan panitia, dan konfigurasi hak akses.',
      filenameDesc: 'Sheet_Admin_1447H_YYYYMMDD_v1.0.csv'
    }
  ];

  return (
    <div className="p-3.5 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 max-w-7xl mx-auto bg-[#F4F7FC]">
      
      {/* =========================================================
          1. HEADER RINGKAS PENGATURAN (HIJAU AL-FALAH PUTAK)
          ========================================================= */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4.5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-[#054736] border border-emerald-100/80 flex items-center justify-center shrink-0 shadow-2xs">
            <Settings className="w-5 h-5 text-[#054736]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                Pengaturan Musabaqah & Integrasi Sheet
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                gasUrl 
                  ? 'bg-emerald-50 text-[#054736] border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {gasUrl ? 'Sinkron: Google Sheets' : 'Mode Offline'}
              </span>
            </div>
            <p className="hidden sm:block text-xs text-slate-500 mt-0.5 truncate">
              Konfigurasi kegiatan, koneksi lembar kerja resmi, keamanan PIN, dan ekspor CSV database lengkap.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
          <button
            onClick={handleReloadSettings}
            disabled={isLoadingSettings}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
            title="Muat ulang pengaturan dari Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoadingSettings ? 'animate-spin' : ''}`} />
            <span>Muat dari Sheet</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          2. TAB NAVIGATION BAR (COMPACT SEGMENTED PILLS)
          ========================================================= */}
      <div className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 overflow-x-auto scrollbar-none border border-slate-200/60">
        
        {/* TAB 1: PENGATURAN MUSABAQAH */}
        <button
          onClick={() => setActiveTab('musabaqah')}
          className={`px-3 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
            activeTab === 'musabaqah'
              ? 'bg-[#054736] text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 shrink-0" />
          <span>Pengaturan Musabaqah</span>
        </button>

        {/* TAB 2: KONEKSI GOOGLE SHEETS */}
        <button
          onClick={() => setActiveTab('sheets')}
          className={`px-3 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
            activeTab === 'sheets'
              ? 'bg-[#054736] text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
          }`}
        >
          <Database className="w-3.5 h-3.5 shrink-0" />
          <span>Koneksi Sheets (8)</span>
        </button>

        {/* TAB 3: KEAMANAN PIN ADMIN */}
        <button
          onClick={() => setActiveTab('security')}
          className={`px-3 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
            activeTab === 'security'
              ? 'bg-[#054736] text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
          }`}
        >
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>PIN Admin</span>
        </button>

        {/* TAB 4: EKSPOR & UNDUH CSV DATABASE */}
        <button
          onClick={() => setActiveTab('export')}
          className={`px-3 sm:px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
            activeTab === 'export'
              ? 'bg-[#054736] text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
          <span>Unduh CSV Database</span>
        </button>

      </div>

      {/* =========================================================
          TAB 1: PENGATURAN MUSABAQAH LANGSUNG DARI SHEET "Pengaturan"
          ========================================================= */}
      {activeTab === 'musabaqah' && (
        <div className="space-y-4 sm:space-y-5">
          
          {/* Form Pengaturan Musabaqah */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4 sm:space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Parameter Lembar Kerja "Pengaturan"
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Setiap perubahan di form ini akan otomatis tersimpan ke tab <strong>Pengaturan</strong> di Google Sheets Anda.
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 ${
                  settingsForm.STATUS_PENDAFTARAN === 'Buka'
                    ? 'bg-emerald-50 text-[#054736] border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${settingsForm.STATUS_PENDAFTARAN === 'Buka' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span>Pendaftaran: {settingsForm.STATUS_PENDAFTARAN || 'Buka'}</span>
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              
              {/* Field 1: Nama Kegiatan (NAMA_KEGIATAN) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Nama Resmi Kegiatan Musabaqah</span>
                  <span className="text-[10px] font-mono text-slate-400 font-normal">Kunci: NAMA_KEGIATAN</span>
                </label>
                <input
                  type="text"
                  value={settingsForm.NAMA_KEGIATAN || ''}
                  onChange={(e) => handleSettingsChange('NAMA_KEGIATAN', e.target.value)}
                  placeholder="Contoh: Musabaqah Akhirussanah Pondok Pesantren Al-Falah Putak"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-[#054736] focus:ring-1 focus:ring-[#054736]/20 bg-slate-50/60 focus:bg-white transition-all text-slate-900"
                />
              </div>

              {/* Grid 2 Kolom: Tahun Ajaran & Status Pendaftaran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                
                {/* Field 2: Tahun Ajaran (TAHUN_AJARAN) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Tahun Ajaran / Hijriyah</span>
                    <span className="text-[10px] font-mono text-slate-400 font-normal">TAHUN_AJARAN</span>
                  </label>
                  <input
                    type="text"
                    value={settingsForm.TAHUN_AJARAN || ''}
                    onChange={(e) => handleSettingsChange('TAHUN_AJARAN', e.target.value)}
                    placeholder="Contoh: 1447 H / 2026 M"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-[#054736] focus:ring-1 focus:ring-[#054736]/20 bg-slate-50/60 focus:bg-white transition-all text-slate-900"
                  />
                </div>

                {/* Field 3: Status Pendaftaran (STATUS_PENDAFTARAN) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Status Portal Pendaftaran</span>
                    <span className="text-[10px] font-mono text-slate-400 font-normal">STATUS_PENDAFTARAN</span>
                  </label>
                  <select
                    value={settingsForm.STATUS_PENDAFTARAN || 'Buka'}
                    onChange={(e) => handleSettingsChange('STATUS_PENDAFTARAN', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-none focus:border-[#054736] focus:ring-1 focus:ring-[#054736]/20 bg-white transition-all text-slate-900 cursor-pointer"
                  >
                    <option value="Buka">Buka (Formulir Menerima Pendaftaran Delegasi)</option>
                    <option value="Tutup">Tutup (Formulir Dinonaktifkan / Masa Pendaftaran Selesai)</option>
                  </select>
                </div>

              </div>

              {/* Grid 3 Kolom: Tanggal Pelaksanaan, Kuota Cabang, Target Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                
                {/* Field 4: Tanggal Pelaksanaan (TANGGAL_PELAKSANAAN) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Rentang Pelaksanaan</span>
                    <span className="text-[10px] font-mono text-slate-400 font-normal">TANGGAL_PELAKSANAAN</span>
                  </label>
                  <input
                    type="text"
                    value={settingsForm.TANGGAL_PELAKSANAAN || ''}
                    onChange={(e) => handleSettingsChange('TANGGAL_PELAKSANAAN', e.target.value)}
                    placeholder="Contoh: 2026-11-20 s/d 2026-11-25"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold outline-none focus:border-[#054736] focus:ring-1 focus:ring-[#054736]/20 bg-slate-50/60 focus:bg-white transition-all text-slate-900"
                  />
                </div>

                {/* Field 5: Kuota Per Cabang Lomba (KUOTA_PER_CABANG) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Kuota / Cabang Lomba</span>
                    <span className="text-[10px] font-mono text-slate-400 font-normal">KUOTA_PER_CABANG</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settingsForm.KUOTA_PER_CABANG || '3'}
                    onChange={(e) => handleSettingsChange('KUOTA_PER_CABANG', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold font-mono outline-none focus:border-[#054736] focus:ring-1 focus:ring-[#054736]/20 bg-slate-50/60 focus:bg-white transition-all text-slate-900"
                  />
                </div>

                {/* Field 6: Target Kuota Minimal Per Kelas Diniyah */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Target Kuota / Kelas</span>
                    <span className="text-[10px] font-mono text-slate-400 font-normal">TARGET_KUOTA_KELAS</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settingsForm.TARGET_KUOTA_KELAS || '10'}
                    onChange={(e) => handleSettingsChange('TARGET_KUOTA_KELAS', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold font-mono outline-none focus:border-[#054736] focus:ring-1 focus:ring-[#054736]/20 bg-slate-50/60 focus:bg-white transition-all text-slate-900"
                  />
                </div>

              </div>

              {/* Tombol Simpan Pengaturan */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Data otomatis disinkronkan ke sheet <strong>Pengaturan</strong>.
                </span>

                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="px-4 py-2 rounded-xl bg-[#054736] hover:bg-[#075B45] active:scale-95 text-white font-bold text-xs transition-all flex items-center space-x-1.5 shadow-2xs cursor-pointer disabled:opacity-60"
                >
                  {isSavingSettings ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Menyimpan ke Sheet...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-white" />
                      <span>Simpan Pengaturan Sheet</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>

          {/* =========================================================
              Tabel Live Data Sheet "Pengaturan" (RESPONSIF BEBAS BENGKAK)
              ========================================================= */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-[#054736]" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Tabel Live Lembar Kerja: Sheet "Pengaturan" (3 Kolom)
                </h3>
              </div>
              <span className="hidden sm:inline-block text-[10.5px] font-mono text-slate-400">
                Kolom A: Kunci | Kolom B: Nilai | Kolom C: Keterangan
              </span>
            </div>

            {/* TAMPILAN MOBILE: KARTU ADAPTIF BERSIH BEBAS BENGKAK */}
            <div className="block sm:hidden divide-y divide-slate-100 bg-white">
              
              {/* Row 2: NAMA_KEGIATAN */}
              <div className="py-2.5 first:pt-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-900">NAMA_KEGIATAN</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-500">Baris #2</span>
                </div>
                <div className="text-xs font-bold text-[#054736]">
                  {settingsForm.NAMA_KEGIATAN || DEFAULT_PENGATURAN.NAMA_KEGIATAN}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Nama resmi agenda musabaqah
                </p>
              </div>

              {/* Row 3: TAHUN_AJARAN */}
              <div className="py-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-900">TAHUN_AJARAN</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-500">Baris #3</span>
                </div>
                <div className="text-xs font-bold text-[#054736]">
                  {settingsForm.TAHUN_AJARAN || DEFAULT_PENGATURAN.TAHUN_AJARAN}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Tahun ajaran pelaksanaan perlombaan
                </p>
              </div>

              {/* Row 4: STATUS_PENDAFTARAN */}
              <div className="py-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-900">STATUS_PENDAFTARAN</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-500">Baris #4</span>
                </div>
                <div>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10.5px] ${
                    settingsForm.STATUS_PENDAFTARAN === 'Buka'
                      ? 'bg-emerald-50 text-[#054736] border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {settingsForm.STATUS_PENDAFTARAN || 'Buka'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Status pendaftaran (Buka / Tutup)
                </p>
              </div>

              {/* Row 5: TANGGAL_PELAKSANAAN */}
              <div className="py-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-900">TANGGAL_PELAKSANAAN</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-500">Baris #5</span>
                </div>
                <div className="text-xs font-bold text-[#054736]">
                  {settingsForm.TANGGAL_PELAKSANAAN || DEFAULT_PENGATURAN.TANGGAL_PELAKSANAAN}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Rentang tanggal pelaksanaan lomba
                </p>
              </div>

              {/* Row 6: KUOTA_PER_CABANG */}
              <div className="py-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-900">KUOTA_PER_CABANG</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-500">Baris #6</span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-800">
                  {settingsForm.KUOTA_PER_CABANG || DEFAULT_PENGATURAN.KUOTA_PER_CABANG}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Batas maksimal delegasi per cabang lomba per kelas
                </p>
              </div>

              {/* Row 7: TARGET_KUOTA_KELAS */}
              <div className="py-2.5 last:pb-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-slate-900">TARGET_KUOTA_KELAS</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-500">Baris #7</span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-800">
                  {settingsForm.TARGET_KUOTA_KELAS || DEFAULT_PENGATURAN.TARGET_KUOTA_KELAS}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Target kuota delegasi lengkap per Kelas Diniyah
                </p>
              </div>

            </div>

            {/* TAMPILAN DESKTOP: TABEL LENGKAP */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">Baris</th>
                    <th className="py-2.5 px-3 w-56">Kunci_Pengaturan (A)</th>
                    <th className="py-2.5 px-3">Nilai_Pengaturan (B)</th>
                    <th className="py-2.5 px-3">Keterangan (C)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">2</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">NAMA_KEGIATAN</td>
                    <td className="py-2.5 px-3 font-semibold text-[#054736]">{settingsForm.NAMA_KEGIATAN || DEFAULT_PENGATURAN.NAMA_KEGIATAN}</td>
                    <td className="py-2.5 px-3 text-slate-500">Nama resmi agenda musabaqah</td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">3</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">TAHUN_AJARAN</td>
                    <td className="py-2.5 px-3 font-semibold text-[#054736]">{settingsForm.TAHUN_AJARAN || DEFAULT_PENGATURAN.TAHUN_AJARAN}</td>
                    <td className="py-2.5 px-3 text-slate-500">Tahun ajaran pelaksanaan perlombaan</td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">4</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">STATUS_PENDAFTARAN</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10.5px] ${
                        settingsForm.STATUS_PENDAFTARAN === 'Buka'
                          ? 'bg-emerald-50 text-[#054736] border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {settingsForm.STATUS_PENDAFTARAN || 'Buka'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">Status pendaftaran (Buka / Tutup)</td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">5</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">TANGGAL_PELAKSANAAN</td>
                    <td className="py-2.5 px-3 font-semibold text-[#054736]">{settingsForm.TANGGAL_PELAKSANAAN || DEFAULT_PENGATURAN.TANGGAL_PELAKSANAAN}</td>
                    <td className="py-2.5 px-3 text-slate-500">Rentang tanggal pelaksanaan lomba</td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">6</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">KUOTA_PER_CABANG</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{settingsForm.KUOTA_PER_CABANG || DEFAULT_PENGATURAN.KUOTA_PER_CABANG}</td>
                    <td className="py-2.5 px-3 text-slate-500">Batas maksimal delegasi per cabang lomba per kelas</td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">7</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">TARGET_KUOTA_KELAS</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{settingsForm.TARGET_KUOTA_KELAS || DEFAULT_PENGATURAN.TARGET_KUOTA_KELAS}</td>
                    <td className="py-2.5 px-3 text-slate-500">Target kuota delegasi lengkap per Kelas Diniyah</td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================
          TAB 2: KONEKSI GOOGLE SHEETS (WEB APP URL & 8 LEMBAR KERJA)
          ========================================================= */}
      {activeTab === 'sheets' && (
        <div className="space-y-4 sm:space-y-5">
          
          {/* Card URL Web App */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                URL Web App Google Apps Script
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Masukkan URL Web App hasil deployment Google Apps Script. Perubahan di kolom ini berlaku untuk sesi tab aktif (untuk perubahan permanen lintas perangkat, perbarui variabel <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">VITE_GAS_URL</code> di <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">.env</code> / Vercel).
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-semibold outline-none focus:border-[#054736] focus:ring-1 focus:ring-[#054736]/20 bg-slate-50/60 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSaveGasUrl}
                  className="px-3.5 py-2 rounded-xl bg-[#054736] hover:bg-[#075B45] text-white font-bold text-xs transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <Save className="w-3.5 h-3.5 text-white" />
                  <span>Simpan URL Web App</span>
                </button>

                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Menguji Koneksi...' : 'Tes Koneksi 8 Sheet'}</span>
                </button>

                <button
                  onClick={copyScript}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer ml-auto"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedCode ? 'Tersalin!' : 'Salin Kode Script (Code.gs)'}</span>
                </button>
              </div>

              {testResult && (
                <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  testResult.success
                    ? 'bg-emerald-50 text-[#054736] border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  <div className="flex items-start space-x-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Struktur 8 Lembar Kerja Resmi */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Struktur 8 Lembar Kerja Resmi di Google Spreadsheet
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pastikan nama sheet dan kolom di spreadsheet Anda sesuai dengan spesifikasi resmi sistem:
              </p>
            </div>

            {/* Pills Sheet Selector */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              {sheetsDefinition.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSheetTab(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedSheetTab === s.id
                      ? 'bg-[#054736] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>

            {/* Active Sheet Detail Card */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    {activeSheetDef.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {activeSheetDef.desc}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-[#054736] border border-emerald-200 shrink-0">
                  {activeSheetDef.totalCols} Kolom
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                {activeSheetDef.columns.map((col, idx) => (
                  <div key={col.name} className="p-2.5 bg-white rounded-lg border border-slate-200/70 text-xs shadow-2xs">
                    <span className="font-mono font-bold text-slate-900 block truncate">
                      {idx + 1}. {col.name}
                    </span>
                    <span className="text-[10.5px] text-slate-400 block mt-0.5 truncate">
                      {col.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================
          TAB 3: KEAMANAN PIN ADMIN
          ========================================================= */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4 max-w-xl">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Ubah PIN Akses Admin Panitia
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              PIN ini digunakan untuk masuk ke panel administrasi panitia.
            </p>
          </div>

          <form onSubmit={handleUpdatePin} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                PIN Admin Saat Ini
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled
                  value={currentPin}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-100 text-slate-600 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                PIN Baru (Minimal 4 Angka/Karakter)
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Masukkan PIN baru..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50/60 focus:bg-white focus:border-[#054736] focus:ring-1 focus:ring-[#054736]/20 outline-none transition-all text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Konfirmasi PIN Baru
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Ulangi PIN baru..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50/60 focus:bg-white focus:border-[#054736] focus:ring-1 focus:ring-[#054736]/20 outline-none transition-all text-slate-900"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#054736] hover:bg-[#075B45] text-white font-bold text-xs transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Key className="w-3.5 h-3.5 text-white" />
                <span>Simpan PIN Baru</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================
          TAB 4: EKSPOR & UNDUH CSV DATABASE (SEMUA LEMBAR KERJA RESMI)
          ========================================================= */}
      {activeTab === 'export' && (
        <div className="space-y-4 sm:space-y-5">
          
          {/* Header Aksi Utama: Unduh Semua Sheet CSV / Excel Lengkap */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    Ekspor Seluruh Lembar Kerja Database (CSV / Excel)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-[#054736]/10 text-[#054736] border border-[#054736]/20">
                    Versi 1447 H • v1.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Unduh seluruh data tabel resmi musabaqah langsung dari database sistem ke dalam berkas CSV murni (sesuai format Google Sheets) atau Buku Kerja Excel multi-sheet.
                </p>
              </div>

              {/* Tombol Aksi Masal */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  onClick={handleDownloadAllSheetsCsv}
                  disabled={isExportingCsv}
                  className="px-3.5 py-2 rounded-xl bg-[#054736] hover:bg-[#075B45] text-white font-bold text-xs transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer active:scale-95 disabled:opacity-60"
                  title="Unduh seluruh 8 lembar kerja ke berkas CSV terpisah"
                >
                  <FolderDown className="w-4 h-4 text-white" />
                  <span>{isExportingCsv ? 'Mengekspor...' : 'Unduh Semua Sheet (CSV)'}</span>
                </button>

                <button
                  onClick={handleDownloadFullExcelWorkbook}
                  disabled={isExportingCsv}
                  className="px-3.5 py-2 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-[#054736] font-bold text-xs transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer active:scale-95 disabled:opacity-60"
                  title="Unduh seluruh lembar kerja dalam 1 file Excel multi-tab (.xlsx)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#054736]" />
                  <span>Buku Kerja Lengkap (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Catatan Kompatibilitas Excel UTF-8 BOM */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-[#054736] shrink-0 mt-0.5" />
              <span>
                Seluruh berkas CSV diekspor menggunakan standar <strong>UTF-8 dengan tanda BOM</strong> sehingga dapat langsung dibuka di Microsoft Excel, Google Sheets, atau LibreOffice tanpa resiko karakter rusak, dan nomor telepon 08 tetap terjaga rapi.
              </span>
            </div>
          </div>

          {/* Daftar Lembar Kerja Tersedia untuk Diunduh Satuan */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              Daftar Lembar Kerja Resmi Database (Unduh Satuan)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
              {exportSheetList.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-3 hover:border-[#054736]/40 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {item.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold bg-slate-100 text-slate-600 shrink-0">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                      {item.desc}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400 truncate pt-0.5">
                      Nama Berkas: {item.filenameDesc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10.5px] font-semibold text-emerald-800">
                      Format: CSV (RFC 4180)
                    </span>

                    <button
                      onClick={() => handleDownloadSingleSheetCsv(item.id, item.title)}
                      disabled={exportingSheetId === item.id || isExportingCsv}
                      className="px-3 py-1.5 rounded-lg bg-[#054736] hover:bg-[#075B45] text-white font-bold text-xs transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer active:scale-95 disabled:opacity-60"
                    >
                      <Download className={`w-3.5 h-3.5 text-white ${exportingSheetId === item.id ? 'animate-bounce' : ''}`} />
                      <span>{exportingSheetId === item.id ? 'Menyiapkan...' : 'Unduh CSV'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Log Aktivitas Audit Trail */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Riwayat Audit Trail Sistem ({totalLogsCount} Entri)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Catatan aktivitas pembaruan data, verifikasi santri, dan ekspor database.
                </p>
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 divide-y divide-slate-100 pr-1">
              {(getActivityLogs() || []).slice(0, 15).map(log => (
                <div key={log.id} className="pt-1.5 flex items-start justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate">{log.action}</span>
                    <span className="text-slate-500 text-[11px] block truncate">{log.detail}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{log.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
