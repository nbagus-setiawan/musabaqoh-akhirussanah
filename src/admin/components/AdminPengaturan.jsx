import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
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
  Info
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
  testGasConnection
} from '../../shared/services/api';

export default function AdminPengaturan({ onRefresh }) {
  // Navigation Tabs: Default adalah 'musabaqah' (Sheet Pengaturan)
  const [activeTab, setActiveTab] = useState('musabaqah'); // 'musabaqah' | 'sheets' | 'security' | 'maintenance'

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
          message: `Alhamdulillah! Terhubung ke ${res.spreadsheetName ? `"${res.spreadsheetName}"` : 'Google Spreadsheet Panitia'}. Lembar kerja resmi aktif & tersinkronisasi termasuk Pendaftaran, Tingkat_dan_Kelas, Ustadz, Pencatatan_Pengeluaran, Pencatatan_Kebutuhan, dan Pengaturan.`
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
  // 4. BACKUP & PEMELIHARAAN DATA
  // =========================================================
  const [isExporting, setIsExporting] = useState(false);
  const [totalLogsCount, setTotalLogsCount] = useState(0);

  useEffect(() => {
    try {
      const logs = getActivityLogs() || [];
      setTotalLogsCount(logs.length);
    } catch (e) {
      setTotalLogsCount(0);
    }
  }, []);

  const handleDownloadBackup = async () => {
    try {
      setIsExporting(true);
      const data = await fetchRegistrations(false);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const nowStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `backup_pendaftaran_santri_${nowStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      Swal.fire({
        icon: 'success',
        title: 'File Backup Siap',
        text: `Berhasil mengunduh berkas cadangan offline (${data.length} santri).`,
        timer: 2000,
        showConfirmButton: false
      });
      addActivityLog('Backup Data', `Panitia mengunduh file cadangan offline JSON (${data.length} santri)`, 'backup');
    } catch (e) {
      Swal.fire('Gagal!', 'Gagal mengekspor data cadangan: ' + e.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

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

  // 6 Lembar Kerja Resmi di Google Spreadsheet
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
      desc: 'Menyimpan seluruh data pendaftaran santri delegasi, nomor peserta 3 digit (unik global), cabang lomba, dan status verifikasi.',
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

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6 max-w-7xl mx-auto bg-[#F4F7FC]">
      
      {/* =========================================================
          1. HEADER SAMBUTAN PENGATURAN
          ========================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/70 shrink-0">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Pengaturan Musabaqah & Integrasi Sheet
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border ${
                gasUrl 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {gasUrl ? 'Sinkron Sheet: Pengaturan' : 'Mode Offline Lokal'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola nilai konfigurasi kegiatan yang sinkron langsung dengan lembar kerja <strong>Pengaturan</strong> di Google Sheets.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleReloadSettings}
            disabled={isLoadingSettings}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
            title="Muat ulang pengaturan dari Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoadingSettings ? 'animate-spin' : ''}`} />
            <span>Muat dari Sheet</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          2. TAB NAVIGATION BAR (MODERN PASTEL SQUIRCLE)
          ========================================================= */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        
        {/* TAB 1: PENGATURAN MUSABAQAH (SHEET) */}
        <button
          onClick={() => setActiveTab('musabaqah')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'musabaqah'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Pengaturan Musabaqah (Sheet)</span>
        </button>

        {/* TAB 2: KONEKSI GOOGLE SHEETS */}
        <button
          onClick={() => setActiveTab('sheets')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'sheets'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Koneksi Google Sheets (8 Sheet)</span>
        </button>

        {/* TAB 3: KEAMANAN PIN ADMIN */}
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Keamanan PIN Admin</span>
        </button>

        {/* TAB 4: BACKUP & PEMELIHARAAN */}
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeTab === 'maintenance'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Backup & Audit Trail</span>
        </button>

      </div>

      {/* =========================================================
          TAB 1: PENGATURAN MUSABAQAH LANGSUNG DARI SHEET "Pengaturan"
          ========================================================= */}
      {activeTab === 'musabaqah' && (
        <div className="space-y-6">
          
          {/* Form Pengaturan Musabaqah */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Parameter Lembar Kerja "Pengaturan"
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap perubahan di form ini akan otomatis tersimpan ke tab <strong>Pengaturan</strong> di Google Sheets Anda.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center space-x-1.5 ${
                  settingsForm.STATUS_PENDAFTARAN === 'Buka'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${settingsForm.STATUS_PENDAFTARAN === 'Buka' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span>Pendaftaran: {settingsForm.STATUS_PENDAFTARAN || 'Buka'}</span>
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              
              {/* Field 1: Nama Kegiatan (NAMA_KEGIATAN) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Nama Resmi Kegiatan Musabaqah</span>
                  <span className="text-[10.5px] font-mono text-slate-400 font-normal">Kunci Sheet: NAMA_KEGIATAN</span>
                </label>
                <input
                  type="text"
                  value={settingsForm.NAMA_KEGIATAN || ''}
                  onChange={(e) => handleSettingsChange('NAMA_KEGIATAN', e.target.value)}
                  placeholder="Contoh: Musabaqah Akhirussanah Pondok Pesantren Al-Falah Putak"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200/90 text-xs font-semibold outline-none focus:border-blue-600 focus:bg-white bg-slate-50/70 transition-all text-slate-900"
                />
              </div>

              {/* Grid 2 Kolom: Tahun Ajaran & Status Pendaftaran */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Field 2: Tahun Ajaran (TAHUN_AJARAN) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Tahun Ajaran / Hijriyah</span>
                    <span className="text-[10.5px] font-mono text-slate-400 font-normal">TAHUN_AJARAN</span>
                  </label>
                  <input
                    type="text"
                    value={settingsForm.TAHUN_AJARAN || ''}
                    onChange={(e) => handleSettingsChange('TAHUN_AJARAN', e.target.value)}
                    placeholder="Contoh: 1447 H / 2026 M"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200/90 text-xs font-semibold outline-none focus:border-blue-600 focus:bg-white bg-slate-50/70 transition-all text-slate-900"
                  />
                </div>

                {/* Field 3: Status Pendaftaran (STATUS_PENDAFTARAN) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Status Portal Pendaftaran</span>
                    <span className="text-[10.5px] font-mono text-slate-400 font-normal">STATUS_PENDAFTARAN</span>
                  </label>
                  <select
                    value={settingsForm.STATUS_PENDAFTARAN || 'Buka'}
                    onChange={(e) => handleSettingsChange('STATUS_PENDAFTARAN', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200/90 text-xs font-bold outline-none focus:border-blue-600 focus:bg-white bg-white transition-all text-slate-900 cursor-pointer"
                  >
                    <option value="Buka">Buka (Formulir Menerima Pendaftaran Delegasi)</option>
                    <option value="Tutup">Tutup (Formulir Dinonaktifkan / Masa Pendaftaran Selesai)</option>
                  </select>
                </div>

              </div>

              {/* Grid 3 Kolom: Tanggal Pelaksanaan, Kuota Cabang, Target Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Field 4: Tanggal Pelaksanaan (TANGGAL_PELAKSANAAN) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Rentang Pelaksanaan</span>
                    <span className="text-[10.5px] font-mono text-slate-400 font-normal">TANGGAL_PELAKSANAAN</span>
                  </label>
                  <input
                    type="text"
                    value={settingsForm.TANGGAL_PELAKSANAAN || ''}
                    onChange={(e) => handleSettingsChange('TANGGAL_PELAKSANAAN', e.target.value)}
                    placeholder="Contoh: 2026-11-20 s/d 2026-11-25"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200/90 text-xs font-semibold outline-none focus:border-blue-600 focus:bg-white bg-slate-50/70 transition-all text-slate-900"
                  />
                </div>

                {/* Field 5: Kuota Per Cabang Lomba (KUOTA_PER_CABANG) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Kuota / Cabang Lomba</span>
                    <span className="text-[10.5px] font-mono text-slate-400 font-normal">KUOTA_PER_CABANG</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settingsForm.KUOTA_PER_CABANG || '3'}
                    onChange={(e) => handleSettingsChange('KUOTA_PER_CABANG', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200/90 text-xs font-bold font-mono outline-none focus:border-blue-600 focus:bg-white bg-slate-50/70 transition-all text-slate-900"
                  />
                </div>

                {/* Field 6: Target Kuota Minimal Per Kelas Diniyah */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Target Kuota / Kelas</span>
                    <span className="text-[10.5px] font-mono text-slate-400 font-normal">TARGET_KUOTA_KELAS</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settingsForm.TARGET_KUOTA_KELAS || '10'}
                    onChange={(e) => handleSettingsChange('TARGET_KUOTA_KELAS', e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200/90 text-xs font-bold font-mono outline-none focus:border-blue-600 focus:bg-white bg-slate-50/70 transition-all text-slate-900"
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
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs transition-all flex items-center space-x-2 shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isSavingSettings ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Menyimpan ke Sheet...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-white" />
                      <span>Simpan Pengaturan Sheet</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>

          {/* Tabel Live Data Sheet "Pengaturan" */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Tabel Live Lembar Kerja: Sheet "Pengaturan" (3 Kolom)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Kolom A: Kunci | Kolom B: Nilai | Kolom C: Keterangan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Baris</th>
                    <th className="py-3 px-4 w-60">Kunci_Pengaturan (A)</th>
                    <th className="py-3 px-4">Nilai_Pengaturan (B)</th>
                    <th className="py-3 px-4">Keterangan (C)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  
                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-center font-mono text-slate-400">2</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">NAMA_KEGIATAN</td>
                    <td className="py-3 px-4 font-semibold text-blue-700">{settingsForm.NAMA_KEGIATAN || DEFAULT_PENGATURAN.NAMA_KEGIATAN}</td>
                    <td className="py-3 px-4 text-slate-500">Nama resmi agenda musabaqah</td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-center font-mono text-slate-400">3</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">TAHUN_AJARAN</td>
                    <td className="py-3 px-4 font-semibold text-blue-700">{settingsForm.TAHUN_AJARAN || DEFAULT_PENGATURAN.TAHUN_AJARAN}</td>
                    <td className="py-3 px-4 text-slate-500">Tahun ajaran pelaksanaan perlombaan</td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-center font-mono text-slate-400">4</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">STATUS_PENDAFTARAN</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10.5px] ${
                        settingsForm.STATUS_PENDAFTARAN === 'Buka'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {settingsForm.STATUS_PENDAFTARAN || 'Buka'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">Status pendaftaran (Buka / Tutup)</td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-center font-mono text-slate-400">5</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">TANGGAL_PELAKSANAAN</td>
                    <td className="py-3 px-4 font-semibold text-blue-700">{settingsForm.TANGGAL_PELAKSANAAN || DEFAULT_PENGATURAN.TANGGAL_PELAKSANAAN}</td>
                    <td className="py-3 px-4 text-slate-500">Rentang tanggal pelaksanaan lomba</td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-center font-mono text-slate-400">6</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">KUOTA_PER_CABANG</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{settingsForm.KUOTA_PER_CABANG || DEFAULT_PENGATURAN.KUOTA_PER_CABANG}</td>
                    <td className="py-3 px-4 text-slate-500">Batas maksimal delegasi per cabang lomba per kelas</td>
                  </tr>

                  <tr className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-center font-mono text-slate-400">7</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">TARGET_KUOTA_KELAS</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{settingsForm.TARGET_KUOTA_KELAS || DEFAULT_PENGATURAN.TARGET_KUOTA_KELAS}</td>
                    <td className="py-3 px-4 text-slate-500">Target kuota delegasi lengkap per Kelas Diniyah</td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================
          TAB 2: KONEKSI GOOGLE SHEETS (WEB APP URL & 6 LEMBAR KERJA)
          ========================================================= */}
      {activeTab === 'sheets' && (
        <div className="space-y-6">
          
          {/* Card URL Web App */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                URL Web App Google Apps Script
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Masukkan URL Web App hasil deployment Google Apps Script. Perubahan di kolom ini berlaku untuk sesi tab aktif (untuk perubahan permanen lintas perangkat, perbarui variabel <code className="font-mono text-slate-700">VITE_GAS_URL</code> di <code className="font-mono text-slate-700">.env</code> / Vercel).
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200/90 text-xs font-mono font-semibold outline-none focus:border-blue-600 focus:bg-white bg-slate-50/70 transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSaveGasUrl}
                  className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <Save className="w-3.5 h-3.5 text-white" />
                  <span>Simpan URL Web App</span>
                </button>

                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Menguji Koneksi...' : 'Tes Koneksi 8 Sheet'}</span>
                </button>

                <button
                  onClick={copyScript}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all shadow-2xs flex items-center space-x-1.5 cursor-pointer ml-auto"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedCode ? 'Tersalin!' : 'Salin Kode Script (Code.gs)'}</span>
                </button>
              </div>

              {testResult && (
                <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
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
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Struktur 8 Lembar Kerja Resmi di Google Spreadsheet
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pastikan nama sheet dan kolom di spreadsheet Anda sesuai dengan spesifikasi resmi sistem:
              </p>
            </div>

            {/* Pills Sheet Selector */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
              {sheetsDefinition.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSheetTab(s.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedSheetTab === s.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>

            {/* Active Sheet Detail Card */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    {activeSheetDef.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {activeSheetDef.desc}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                  {activeSheetDef.totalCols} Kolom
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
                {activeSheetDef.columns.map((col, idx) => (
                  <div key={col.name} className="p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs">
                    <span className="font-mono font-bold text-slate-900 block truncate">
                      {idx + 1}. {col.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
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
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5 max-w-xl">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Ubah PIN Akses Admin Panitia
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              PIN ini digunakan untuk masuk ke panel administrasi panitia.
            </p>
          </div>

          <form onSubmit={handleUpdatePin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                PIN Admin Saat Ini
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled
                  value={currentPin}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-mono font-bold bg-slate-100 text-slate-600 outline-none"
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                PIN Baru (Minimal 4 Angka/Karakter)
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Masukkan PIN baru..."
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200/90 text-xs font-mono font-bold bg-slate-50/70 focus:bg-white focus:border-blue-600 outline-none transition-all text-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Konfirmasi PIN Baru
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Ulangi PIN baru..."
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200/90 text-xs font-mono font-bold bg-slate-50/70 focus:bg-white focus:border-blue-600 outline-none transition-all text-slate-900"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Key className="w-3.5 h-3.5 text-white" />
                <span>Simpan PIN Baru</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================
          TAB 4: BACKUP & PEMELIHARAAN DATA
          ========================================================= */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Cadangan Data Offline (JSON)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Unduh seluruh data pendaftaran santri ke dalam file JSON lokal untuk antisipasi darurat atau arsip offline panitia.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleDownloadBackup}
                disabled={isExporting}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <Download className="w-4 h-4 text-white" />
                <span>{isExporting ? 'Mengekspor Data...' : 'Unduh Cadangan JSON'}</span>
              </button>
            </div>
          </div>

          {/* Log Aktivitas Audit Trail */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Riwayat Audit Trail Sistem ({totalLogsCount} Entri)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Catatan aktivitas pembaruan data, verifikasi santri, dan sinkronisasi.
                </p>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-slate-100 pr-1">
              {(getActivityLogs() || []).slice(0, 15).map(log => (
                <div key={log.id} className="pt-2 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{log.action}</span>
                    <span className="text-slate-500 text-[11px] block">{log.detail}</span>
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
