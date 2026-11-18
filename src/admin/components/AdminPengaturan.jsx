import React, { useState, useEffect } from 'react';
import { 
  Settings,
  Database, 
  Link2, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  RefreshCw, 
  Copy, 
  Check, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  Terminal, 
  ShieldCheck, 
  FileSpreadsheet, 
  Download, 
  HardDrive, 
  Sparkles, 
  HelpCircle, 
  ExternalLink,
  Layers,
  Activity,
  Cpu,
  Save,
  Info
} from 'lucide-react';
import { 
  getStoredGasUrl, 
  setStoredGasUrl, 
  getAdminPin, 
  setAdminPin,
  addActivityLog,
  fetchRegistrations,
  getActivityLogs
} from '../../shared/services/api';
import rawScriptCode from '../../../google-apps-script/Code.gs?raw';

export default function AdminPengaturan({ onRefresh }) {
  // Navigation Tabs inside Settings
  const [activeTab, setActiveTab] = useState('sheets'); // 'sheets' | 'script' | 'security' | 'maintenance'

  // Google Apps Script URL State
  const [gasUrl, setGasUrl] = useState(() => getStoredGasUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // PIN Admin State
  const [currentPin, setCurrentPin] = useState(() => getAdminPin());
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pinMessage, setPinMessage] = useState(null);

  // Backup & Maintenance State
  const [isExporting, setIsExporting] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [totalLogsCount, setTotalLogsCount] = useState(0);

  useEffect(() => {
    try {
      const logs = getActivityLogs() || [];
      setTotalLogsCount(logs.length);
    } catch (e) {
      setTotalLogsCount(0);
    }
  }, []);

  const handleSaveGasUrl = () => {
    setStoredGasUrl(gasUrl.trim());
    setSaveSuccess(true);
    addActivityLog('Pengaturan Sheets', `URL Web App Google Apps Script diperbarui`, 'system');
    setTimeout(() => setSaveSuccess(false), 2500);
    if (onRefresh) onRefresh();
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
      // 1. Coba ping multi-sheet
      let response = await fetch(gasUrl.trim() + '?action=ping', { method: 'GET' });
      let data = null;
      if (response.ok) {
        data = await response.json();
      } else {
        response = await fetch(gasUrl.trim() + '?action=get_all', { method: 'GET' });
        if (response.ok) data = await response.json();
      }

      if (data && data.status === 'success') {
        const santriCount = data.totalSantri !== undefined ? data.totalSantri : (Array.isArray(data.data) ? data.data.length : 0);
        const guruCount = data.totalGuru !== undefined ? data.totalGuru : '-';
        const kelasCount = data.totalKelas !== undefined ? data.totalKelas : '-';
        const ssName = data.spreadsheetName ? `"${data.spreadsheetName}"` : 'Google Spreadsheet Panitia';

        setTestResult({
          success: true,
          message: `Alhamdulillah! Terhubung ke ${ssName}. Ketiga sheet resmi aktif & tersinkronisasi: "Pendaftaran" (${santriCount} data santri), "Data_Guru" (${guruCount} wali kelas), dan "Tingkat_dan_Kelas" (${kelasCount} rombel).`
        });
        addActivityLog('Tes Koneksi Sheets', `Koneksi 3 sheet sukses tersambung ke ${ssName}`, 'system');
      } else {
        setTestResult({
          success: false,
          message: `Koneksi tersambung, namun respons script belum sesuai: ${data?.message || 'Pastikan kode Apps Script terbaru sudah dideploy.'}`
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Koneksi gagal atau terblokir CORS: ' + err.message + '. Pastikan URL deployment Web App berakhiran "/exec" dan opsi Who has access diset ke "Anyone".'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleUpdatePin = (e) => {
    e.preventDefault();
    setPinMessage(null);

    const trimmedNew = newPin.trim();
    const trimmedConfirm = confirmPin.trim();

    if (!trimmedNew || trimmedNew.length < 4) {
      setPinMessage({ success: false, text: 'PIN baru minimal harus 4 karakter / angka.' });
      return;
    }

    if (trimmedNew !== trimmedConfirm) {
      setPinMessage({ success: false, text: 'Konfirmasi PIN tidak cocok dengan PIN baru.' });
      return;
    }

    setAdminPin(trimmedNew);
    setCurrentPin(trimmedNew);
    setNewPin('');
    setConfirmPin('');
    setPinMessage({ success: true, text: 'Alhamdulillah! PIN Akses Admin berhasil diperbarui.' });
    addActivityLog('Keamanan Admin', 'PIN Akses Admin berhasil diubah oleh panitia', 'security');
    setTimeout(() => setPinMessage(null), 3500);
  };

  const handleDownloadBackup = async () => {
    try {
      setIsExporting(true);
      const data = await fetchRegistrations();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const nowStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `backup_pendaftaran_santri_${nowStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 2500);
      addActivityLog('Backup Data', `Panitia mengunduh file cadangan offline JSON (${data.length} santri)`, 'backup');
    } catch (e) {
      alert('Gagal mengekspor data cadangan: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const scriptCode = rawScriptCode;

  const copyScript = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const [selectedSheetTab, setSelectedSheetTab] = useState('Pendaftaran');

  const sheetsDefinition = [
    {
      id: 'Pendaftaran',
      title: 'Sheet 1: "Pendaftaran"',
      tag: 'Data Transaksional Santri',
      totalCols: 12,
      desc: 'Menyimpan seluruh data pendaftaran santri riil, nomor undian (mulai 050), status verifikasi panitia, dan catatan lomba.',
      columns: [
        { name: 'Timestamp', desc: 'Waktu Pendaftaran' },
        { name: 'Wali_Kelas', desc: 'Wali Kelas Pembina' },
        { name: 'ID_Pendaftaran', desc: 'ID Unik (AKH-001)' },
        { name: 'Nomor_Urut', desc: 'No. Undi (Mulai 050)' },
        { name: 'Nama_Lengkap', desc: 'Nama Santri' },
        { name: 'Jenis_Kelamin', desc: 'L (Putra) / P (Putri)' },
        { name: 'Tingkat', desc: 'Ula / Wustho / Ulya / MHQ' },
        { name: 'Kelas_Kategori', desc: 'Rombel Belajar' },
        { name: 'Cabang_Lomba', desc: '10 Cabang Musabaqah' },
        { name: 'Nomor_WA', desc: 'Nomor WhatsApp Aktif' },
        { name: 'Status', desc: 'Pending / Terverifikasi / Ditolak' },
        { name: 'Catatan', desc: 'Keterangan Tambahan' }
      ]
    },
    {
      id: 'Data_Guru',
      title: 'Sheet 2: "Data_Guru"',
      tag: 'Master Wali Kelas',
      totalCols: 5,
      desc: 'Menyimpan master data Ustadz / Ustadzah wali kelas pembina dan nomor kontak resmi Pondok Pesantren.',
      columns: [
        { name: 'ID_Guru', desc: 'ID Unik Guru (wk-1, dst)' },
        { name: 'Nama_Guru', desc: 'Nama Lengkap Asatidz' },
        { name: 'Tingkat', desc: 'Jenjang (ula / wustho / ulya)' },
        { name: 'Kelas_Diampu', desc: 'Rombel Kelas yang Diampu' },
        { name: 'Kontak_WA', desc: 'Nomor WhatsApp Aktif' }
      ]
    },
    {
      id: 'Tingkat_dan_Kelas',
      title: 'Sheet 3: "Tingkat_dan_Kelas"',
      tag: 'Master Jenjang & Rombel',
      totalCols: 4,
      desc: 'Menyimpan daftar jenjang pendidikan pesantren dan rombongan belajar (kelas) yang dipertandingkan.',
      columns: [
        { name: 'Kode_Tingkat', desc: 'Kode (ula, wustho, ulya, mhq_juz)' },
        { name: 'Nama_Tingkat', desc: 'Nama Lengkap Jenjang' },
        { name: 'Nama_Kelas_Rombel', desc: 'Nama Kelas / Rombel' },
        { name: 'Keterangan', desc: 'Keterangan Jenjang' }
      ]
    }
  ];

  const activeSheetDef = sheetsDefinition.find(s => s.id === selectedSheetTab) || sheetsDefinition[0];

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        {/* Subtle accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800" />

        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-sm shrink-0">
            <Settings className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Pengaturan Sistem & Database</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                gasUrl 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${gasUrl ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'}`}></span>
                <span>{gasUrl ? 'Tersambung Google Sheets' : 'Koneksi Belum Terpasang'}</span>
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola sinkronisasi Google Sheets, salin kode Apps Script, konfigurasi PIN panitia, dan pemeliharaan data.
            </p>
          </div>
        </div>

        {/* Quick Help Button */}
        <div className="flex items-center space-x-2 shrink-0">
          <a
            href="https://script.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Buka Google Script</span>
          </a>
        </div>
      </div>

      {/* 2. STATISTIC / HEALTH METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Status Database */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Database Integrasi
            </span>
            <span className="text-base font-black text-slate-900 mt-1 block">
              {gasUrl ? 'Google Sheets' : 'Local Cache'}
            </span>
            <span className={`text-[11px] font-medium mt-0.5 block ${gasUrl ? 'text-emerald-700' : 'text-slate-500'}`}>
              {gasUrl ? 'Sinkron Cloud Aktif' : 'Penyimpanan Offline'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100/80">
            <FileSpreadsheet className="w-5 h-5 text-emerald-800" />
          </div>
        </div>

        {/* Status Webhook */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Webhook Endpoint
            </span>
            <span className="text-base font-black text-slate-900 mt-1 block">
              {gasUrl ? 'Terpasang' : 'Kosong'}
            </span>
            <span className="text-[11px] font-medium text-slate-500 mt-0.5 block truncate max-w-[130px]">
              {gasUrl ? gasUrl.replace('https://script.google.com/macros/s/', '').slice(0, 16) + '...' : 'Belum diisi'}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100/80">
            <Link2 className="w-5 h-5 text-teal-800" />
          </div>
        </div>

        {/* Keamanan PIN */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Keamanan Akses
            </span>
            <span className="text-base font-black text-slate-900 mt-1 block">
              PIN Terproteksi
            </span>
            <span className="text-[11px] font-medium text-emerald-700 mt-0.5 block">
              Otentikasi Aktif
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-800 flex items-center justify-center border border-sky-100/80">
            <ShieldCheck className="w-5 h-5 text-sky-800" />
          </div>
        </div>

        {/* Log Aktivitas */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Log Riwayat Sistem
            </span>
            <span className="text-base font-black text-slate-900 mt-1 block">
              {totalLogsCount} Aktivitas
            </span>
            <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
              Audit trail panitia
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100/80">
            <Activity className="w-5 h-5 text-amber-800" />
          </div>
        </div>

      </div>

      {/* 3. MAIN SETTINGS CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Navigation Tabs Bar */}
        <div className="border-b border-slate-100 px-4 sm:px-6 pt-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-3 w-full sm:w-auto scrollbar-none">
            
            <button
              onClick={() => setActiveTab('sheets')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'sheets'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Integrasi Google Sheets</span>
            </button>

            <button
              onClick={() => setActiveTab('script')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'script'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Panduan & Kode Script</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Keamanan PIN Admin</span>
            </button>

            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'maintenance'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Backup & Pemeliharaan</span>
            </button>

          </div>
        </div>

        {/* 4A. TAB 1: INTEGRASI GOOGLE SHEETS */}
        {activeTab === 'sheets' && (
          <div className="p-5 sm:p-7 space-y-6">
            
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Konfigurasi Web App Deployment Google Apps Script</span>
              </h3>
              <p className="text-xs text-slate-500">
                Hubungkan formulir pendaftaran langsung ke lembar kerja Google Sheets panitia untuk penyimpanan data terpusat dan generator nomor urut.
              </p>
            </div>

            {/* Input URL Box */}
            <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-emerald-800" />
                <span>Web App URL (Deployment Exec URL):</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-emerald-800 focus:bg-white bg-white shadow-2xs transition-all"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-900 text-[11px] leading-relaxed flex items-start space-x-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Penting untuk Panitia:</strong> Pastikan pada saat <em>New Deployment</em> di Google Apps Script, opsi <strong>Who has access (Siapa yang memiliki akses)</strong> dipilih ke <strong>Anyone (Siapa saja)</strong> agar formulir dapat mengirimkan pendaftaran santri tanpa login Google.
                </div>
              </div>
            </div>

            {/* 3 Sheets Architecture Preview in Tab 1 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>Arsitektur 3 Lembar Kerja (Sheets) Resmi di Google Sheets</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200 w-fit">
                  Multi-Sheet Terintegrasi Otomatis
                </span>
              </div>

              <p className="text-[11px] text-emerald-950/80 leading-relaxed">
                Backend Google Apps Script mengelola <strong>3 lembar kerja (tab)</strong> sekaligus dalam 1 file Spreadsheet Panitia Al-Falah Putak:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                {sheetsDefinition.map((s) => (
                  <div key={s.id} className="p-3.5 rounded-xl bg-white border border-emerald-200/70 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{s.id}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {s.totalCols} Kolom
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-1 flex items-start space-x-2 text-[11px] text-emerald-900 leading-relaxed">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Kenapa di spreadsheet baru hanya muncul sheet Pendaftaran?</strong><br />
                  Jika spreadsheet baru Anda belum memunculkan sheet <strong>Data_Guru</strong> dan <strong>Tingkat_dan_Kelas</strong>, cukup klik tombol <strong>"Uji Koneksi Spreadsheet Sekarang"</strong> di bawah atau jalankan fungsi <code>inisialisasiTigaLembarKerja</code> di Apps Script. Script akan otomatis membuat dan melengkapi ketiga sheet seketika!
                </div>
              </div>
            </div>

            {/* Status Feedback Alerts */}
            {saveSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Pengaturan URL Google Apps Script berhasil disimpan dan tersinkronisasi!</span>
              </div>
            )}

            {testResult && (
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start space-x-2.5 animate-in fade-in ${
                testResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="block font-bold">{testResult.success ? 'Koneksi Berhasil!' : 'Koneksi Bermasalah!'}</strong>
                  <span>{testResult.message}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleSaveGasUrl}
                className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4 text-emerald-300" />
                <span>Simpan Pengaturan URL</span>
              </button>

              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200/80 shadow-2xs flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 text-slate-600 ${isTesting ? 'animate-spin text-emerald-800' : ''}`} />
                <span>{isTesting ? 'Sedang Menguji Koneksi...' : 'Uji Koneksi Spreadsheet Sekarang'}</span>
              </button>
            </div>

          </div>
        )}

        {/* 4B. TAB 2: PANDUAN & KODE SCRIPT */}
        {activeTab === 'script' && (
          <div className="p-5 sm:p-7 space-y-6">
            
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Panduan Praktis Deployment & Kode Google Apps Script
              </h3>
              <p className="text-xs text-slate-500">
                Ikuti 3 langkah mudah berikut untuk menghubungkan Google Spreadsheet panitia secara otomatis.
              </p>
            </div>

            {/* 4 Step Practical Guide Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-800 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                  1
                </span>
                <h4 className="font-bold text-slate-900 text-xs">Buat Spreadsheet Baru</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Buka Google Drive panitia, buat Spreadsheet baru beri nama <strong>"Musabaqah Akhirussanah 1447 H"</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-800 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                  2
                </span>
                <h4 className="font-bold text-slate-900 text-xs">Tempelkan Kode Script</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Buka menu <strong>Extensions &gt; Apps Script</strong>. Hapus isi bawaan, lalu salin dan tempelkan seluruh kode di bawah.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-emerald-950 space-y-2 shadow-2xs">
                <span className="w-7 h-7 rounded-xl bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                  3
                </span>
                <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <span>MUNCULKAN 3 SHEET</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-800 text-white uppercase">Penting</span>
                </h4>
                <p className="text-emerald-900 text-[11px] leading-relaxed">
                  Di dropdown fungsi atas editor, pilih <strong>"inisialisasiTigaLembarKerja"</strong> lalu klik ▶ <strong>Run (Jalankan)</strong>. Seketika 3 sheet otomatis dibuat!
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-800 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                  4
                </span>
                <h4 className="font-bold text-slate-900 text-xs">Deploy Sebagai Web App</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Klik <strong>Deploy &gt; New deployment &gt; Web app</strong>. Pilih Who has access: <strong>Anyone</strong>, lalu salin Web App URL ke tab pertama.
                </p>
              </div>
            </div>

            {/* Code Box Container */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-md">
              <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-slate-200">
                    Code.gs (Google Apps Script Backend Multi-Sheet Resmi)
                  </span>
                </div>

                <button
                  onClick={copyScript}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Kode Script'}</span>
                </button>
              </div>

              <div className="p-4 max-h-80 overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed scrollbar-thin">
                <pre>{scriptCode}</pre>
              </div>
            </div>

            {/* 3 Sheets Header Specification with Tabs */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Struktur Kolom Header di 3 Lembar Kerja Google Sheets:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Pilih tab di samping untuk memeriksa nama kolom resmi tiap sheet:
                  </span>
                </div>

                {/* Sheet Selector Pills */}
                <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                  {sheetsDefinition.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSheetTab(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedSheetTab === s.id
                          ? 'bg-white text-emerald-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {s.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Sheet Detail Card */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span>{activeSheetDef.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {activeSheetDef.tag}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {activeSheetDef.desc}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 bg-white px-3 py-1 rounded-xl border border-slate-200/70 shadow-2xs shrink-0 self-start sm:self-auto">
                    Total: {activeSheetDef.totalCols} Kolom
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {activeSheetDef.columns.map((col, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200/70 text-xs flex flex-col shadow-2xs">
                      <span className="font-mono font-bold text-emerald-900 text-[11px]">
                        {idx + 1}. {col.name}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        {col.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 4C. TAB 3: KEAMANAN AKSES & PIN ADMIN */}
        {activeTab === 'security' && (
          <div className="p-5 sm:p-7 space-y-6">
            
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-800" />
                <span>Pengaturan Keamanan Akses Portal Panitia</span>
              </h3>
              <p className="text-xs text-slate-500">
                Ubah PIN otentikasi login admin secara berkala untuk menjaga keamanan data santri dan keabsahan pengundian nomor urut.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between max-w-lg">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Status PIN Saat Ini
                </span>
                <span className="text-sm font-mono font-bold text-slate-800 mt-0.5 block">
                  {showPassword ? currentPin : '••••••••'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Sembunyikan' : 'Perlihatkan'}</span>
              </button>
            </div>

            {/* Form Ganti PIN */}
            <form onSubmit={handleUpdatePin} className="max-w-lg space-y-4 pt-2">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                  PIN Baru Panitia <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 4 karakter / angka"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-semibold outline-none focus:border-emerald-800 focus:bg-white bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
                  Konfirmasi PIN Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ulangi PIN baru"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-semibold outline-none focus:border-emerald-800 focus:bg-white bg-slate-50/50"
                    required
                  />
                </div>
              </div>

              {pinMessage && (
                <div className={`p-3.5 rounded-2xl text-xs font-medium flex items-center space-x-2 ${
                  pinMessage.success 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}>
                  {pinMessage.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{pinMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Perbarui PIN Akses Admin
              </button>
            </form>

            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 text-xs text-slate-500 space-y-1 max-w-lg">
              <span className="font-bold text-slate-800 block">Saran Keamanan Panitia:</span>
              <p className="text-[11px] leading-relaxed">
                Gunakan PIN yang mudah diingat oleh dewan panitia inti namun sulit ditebak oleh peserta. Bawaan sistem awal adalah <code className="bg-slate-200 px-1 py-0.2 rounded font-mono text-slate-800 font-bold">admin123</code>.
              </p>
            </div>

          </div>
        )}

        {/* 4D. TAB 4: PEMELIHARAAN & BACKUP DATA */}
        {activeTab === 'maintenance' && (
          <div className="p-5 sm:p-7 space-y-6">
            
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-800" />
                <span>Cadangan Offline & Pemeliharaan Sistem</span>
              </h3>
              <p className="text-xs text-slate-500">
                Amankan seluruh data pendaftaran santri secara berkala dalam format cadangan lokal (JSON).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Backup Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3.5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Unduh Backup Data Santri (JSON)</h4>
                    <p className="text-[11px] text-slate-400">Simpan salinan data pendaftaran ke komputer panitia</p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  File JSON berisi seluruh riwayat pendaftaran santri, nomor urut yang sudah diundi, dan status verifikasi terkini.
                </p>

                {backupSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>File cadangan offline berhasil diunduh!</span>
                  </div>
                )}

                <button
                  onClick={handleDownloadBackup}
                  disabled={isExporting}
                  className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-300" />
                  <span>{isExporting ? 'Mengekspor Data...' : 'Unduh Cadangan Offline Sekarang'}</span>
                </button>
              </div>

              {/* Info Lingkungan & Versi */}
              <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3">
                <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs border-b border-slate-200/70 pb-2">
                  <Cpu className="w-4 h-4 text-emerald-800" />
                  <span>Informasi Rilis & Lingkungan Sistem</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Nama Acara:</span>
                    <span className="font-semibold text-slate-800">Musabaqah Akhirussanah</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Tahun Hijriyah / M:</span>
                    <span className="font-semibold text-slate-800">1447 H / 2026 M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Pondok Pesantren:</span>
                    <span className="font-semibold text-slate-800">Al-Falah Putak Gelumbang</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Versi Portal:</span>
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      v1.0.0 (Production)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Nomor Urut Standar:</span>
                    <span className="font-mono font-bold text-slate-800">
                      Mulai dari 050
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
