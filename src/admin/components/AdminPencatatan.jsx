import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import {
  ClipboardList,
  Receipt,
  ListChecks,
  Plus,
  Edit3,
  Trash2,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Search,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wallet,
  Package,
  Calendar,
  User,
  Calculator
} from 'lucide-react';
import {
  getPengeluaranList,
  fetchPengeluaran,
  savePengeluaran,
  deletePengeluaran,
  getKebutuhanList,
  fetchKebutuhan,
  saveKebutuhan,
  deleteKebutuhan,
  subscribeDataChanged
} from '../../shared/services/api';
import {
  formatRupiah,
  formatTanggalId,
  terbilangRupiah,
  downloadPengeluaranPdf,
  downloadKebutuhanPdf
} from '../../shared/utils/pencatatanPdf';

const SATUAN_PRESETS = ['Pcs', 'Box', 'Rim', 'Paket', 'Buah', 'Set', 'Dus', 'Lembar', 'Orang', 'Ls'];
const KEBUTUHAN_KATEGORI = [
  'Perlengkapan',
  'Kesekretariatan',
  'Konsumsi',
  'Acara & Lomba',
  'Dekorasi & Dokumentasi',
  'Hadiah & Sertifikat',
  'Kebersihan & Keamanan',
  'Lainnya'
];
const TARGET_HARI_PRESETS = [
  'H-7 Sebelum Acara',
  'H-5 Sebelum Acara',
  'H-3 Sebelum Acara',
  'H-2 Sebelum Acara',
  'H-1 Sebelum Acara',
  'H-1 Malam',
  'Pagi Hari-H'
];
const STATUS_KEBUTUHAN_OPTIONS = ['Belum Siap', 'Dalam Proses', 'Sudah Siap'];

const getTodayIso = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Wrapper native <dialog> yang mengelola showModal(), Esc, focus restoration,
 * dan fallback light-dismiss bila ClosedBy belum tersedia di browser target.
 */
function NativeModalDialog({ isOpen, onClose, labelledBy, maxWidthClass = 'max-w-lg', children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return undefined;

    let pressedOutside = false;
    const isOutside = (e) => {
      const rect = dialog.getBoundingClientRect();
      return e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;
    };

    const handlePointerDown = (e) => {
      if (dialog.open) pressedOutside = isOutside(e);
    };
    const handlePointerUp = (e) => {
      if (dialog.open && pressedOutside && isOutside(e)) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener('pointerdown', handlePointerDown);
    dialog.addEventListener('pointerup', handlePointerUp);
    return () => {
      dialog.removeEventListener('pointerdown', handlePointerDown);
      dialog.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const handleCloseEvent = () => {
    if (dialogRef.current) dialogRef.current.returnValue = '';
    if (onClose) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby={labelledBy}
      onClose={handleCloseEvent}
      className={`alfalah-dialog ${maxWidthClass}`}
    >
      {isOpen ? children : null}
    </dialog>
  );
}

export default function AdminPencatatan({
  activeSubMenu = 'pengeluaran',
  setActiveView,
  onRefresh
}) {
  const activeTab = activeSubMenu === 'kebutuhan' ? 'kebutuhan' : 'pengeluaran';

  const switchSubMenu = (tabId) => {
    if (setActiveView) {
      setActiveView(tabId === 'kebutuhan' ? 'pencatatan_kebutuhan' : 'pencatatan_pengeluaran');
    }
  };

  // =========================================================
  // 1. STATE DATA PENGELUARAN & KEBUTUHAN
  // =========================================================
  const [pengeluaranList, setPengeluaranList] = useState(() => getPengeluaranList());
  const [kebutuhanList, setKebutuhanList] = useState(() => getKebutuhanList());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAllPencatatan = async () => {
    setIsRefreshing(true);
    try {
      const [outData, kebData] = await Promise.all([
        fetchPengeluaran(),
        fetchKebutuhan()
      ]);
      setPengeluaranList(Array.isArray(outData) ? outData : []);
      setKebutuhanList(Array.isArray(kebData) ? kebData : []);
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  useEffect(() => {
    loadAllPencatatan();
    const unsub = subscribeDataChanged((evt) => {
      if (!evt || evt.type === 'pengeluaran' || evt.type === 'storage_change') {
        setPengeluaranList(getPengeluaranList());
      }
      if (!evt || evt.type === 'kebutuhan' || evt.type === 'storage_change') {
        setKebutuhanList(getKebutuhanList());
      }
    });
    return () => unsub();
  }, []);

  // =========================================================
  // 2. FILTER & PENCARIAN
  // =========================================================
  const [searchOut, setSearchOut] = useState('');
  const [sortOut, setSortOut] = useState('terbaru'); // 'terbaru' | 'terbesar' | 'terkecil' | 'nama'

  const [searchKeb, setSearchKeb] = useState('');
  const [filterStatusKeb, setFilterStatusKeb] = useState('ALL');
  const [filterKategoriKeb, setFilterKategoriKeb] = useState('ALL');

  const filteredPengeluaran = useMemo(() => {
    const q = searchOut.trim().toLowerCase();
    const base = q
      ? pengeluaranList.filter(it =>
          (it.namaAkun || '').toLowerCase().includes(q) ||
          (it.satuan || '').toLowerCase().includes(q) ||
          (it.keterangan || '').toLowerCase().includes(q)
        )
      : [...pengeluaranList];

    base.sort((a, b) => {
      if (sortOut === 'terbesar') return (Number(b.total) || 0) - (Number(a.total) || 0);
      if (sortOut === 'terkecil') return (Number(a.total) || 0) - (Number(b.total) || 0);
      if (sortOut === 'nama') return (a.namaAkun || '').localeCompare(b.namaAkun || '', 'id');
      return String(b.tanggal || '').localeCompare(String(a.tanggal || '')) ||
        String(b.idPengeluaran || '').localeCompare(String(a.idPengeluaran || ''));
    });

    return base;
  }, [pengeluaranList, searchOut, sortOut]);

  const filteredKebutuhan = useMemo(() => {
    const q = searchKeb.trim().toLowerCase();
    return kebutuhanList.filter(it => {
      if (filterStatusKeb !== 'ALL' && it.status !== filterStatusKeb) return false;
      if (filterKategoriKeb !== 'ALL' && it.kategori !== filterKategoriKeb) return false;
      if (q) {
        const hay = `${it.namaKebutuhan || ''} ${it.kategori || ''} ${it.penanggungJawab || ''} ${it.keterangan || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [kebutuhanList, searchKeb, filterStatusKeb, filterKategoriKeb]);

  // =========================================================
  // 3. METRIK KPI
  // =========================================================
  const statsOut = useMemo(() => {
    const totalNominal = pengeluaranList.reduce((s, it) => s + (Number(it.total) || 0), 0);
    const totalQty = pengeluaranList.reduce((s, it) => s + (Number(it.qty) || 0), 0);
    const filteredNominal = filteredPengeluaran.reduce((s, it) => s + (Number(it.total) || 0), 0);
    let maxItem = null;
    pengeluaranList.forEach(it => {
      if (!maxItem || (Number(it.total) || 0) > (Number(maxItem.total) || 0)) {
        maxItem = it;
      }
    });
    return {
      count: pengeluaranList.length,
      totalNominal,
      totalQty,
      filteredNominal,
      maxItem
    };
  }, [pengeluaranList, filteredPengeluaran]);

  const statsKeb = useMemo(() => {
    const total = kebutuhanList.length;
    const siap = kebutuhanList.filter(it => it.status === 'Sudah Siap').length;
    const proses = kebutuhanList.filter(it => it.status === 'Dalam Proses').length;
    const belum = kebutuhanList.filter(it => it.status !== 'Sudah Siap' && it.status !== 'Dalam Proses').length;
    const readyPct = total > 0 ? Math.round((siap / total) * 100) : 0;
    return { total, siap, proses, belum, readyPct };
  }, [kebutuhanList]);

  // =========================================================
  // 4. MODAL FORM PENGELUARAN
  // =========================================================
  const [outModalOpen, setOutModalOpen] = useState(false);
  const [outEditId, setOutEditId] = useState(null);
  const [outForm, setOutForm] = useState({
    tanggal: getTodayIso(),
    namaAkun: '',
    satuan: 'Pcs',
    hargaSatuan: '',
    qty: '1',
    manualTotal: false,
    totalOverride: '',
    keterangan: ''
  });
  const [outTouched, setOutTouched] = useState({});
  const [outError, setOutError] = useState('');
  const [isSavingOut, setIsSavingOut] = useState(false);

  const computedOutTotal = useMemo(() => {
    const harga = Math.max(0, Number(outForm.hargaSatuan) || 0);
    const qty = Math.max(0, Number(outForm.qty) || 0);
    if (outForm.manualTotal) {
      return Math.max(0, Number(outForm.totalOverride) || 0);
    }
    return harga * qty;
  }, [outForm.hargaSatuan, outForm.qty, outForm.manualTotal, outForm.totalOverride]);

  const openAddPengeluaran = () => {
    setOutEditId(null);
    setOutForm({
      tanggal: getTodayIso(),
      namaAkun: '',
      satuan: 'Pcs',
      hargaSatuan: '',
      qty: '1',
      manualTotal: false,
      totalOverride: '',
      keterangan: ''
    });
    setOutTouched({});
    setOutError('');
    setOutModalOpen(true);
  };

  const openEditPengeluaran = (item) => {
    const harga = Number(item.hargaSatuan) || 0;
    const qty = Number(item.qty) || 1;
    const total = Number(item.total) || 0;
    const isManual = harga * qty !== total;
    setOutEditId(item.idPengeluaran);
    setOutForm({
      tanggal: item.tanggal || getTodayIso(),
      namaAkun: item.namaAkun || '',
      satuan: item.satuan || 'Pcs',
      hargaSatuan: harga > 0 ? String(harga) : '',
      qty: String(qty),
      manualTotal: isManual,
      totalOverride: isManual ? String(total) : '',
      keterangan: item.keterangan || ''
    });
    setOutTouched({});
    setOutError('');
    setOutModalOpen(true);
  };

  const handleSubmitPengeluaran = async (e) => {
    e.preventDefault();
    setOutTouched({ namaAkun: true, qty: true, hargaSatuan: true });

    if (!outForm.namaAkun.trim()) {
      setOutError('Nama akun / item pengeluaran wajib diisi.');
      return;
    }
    const qtyNum = Number(outForm.qty) || 0;
    if (qtyNum <= 0) {
      setOutError('Qty (jumlah) wajib lebih besar dari 0.');
      return;
    }
    const hargaNum = Number(outForm.hargaSatuan) || 0;
    const finalTotal = outForm.manualTotal ? (Number(outForm.totalOverride) || 0) : (hargaNum * qtyNum);
    if (finalTotal <= 0) {
      setOutError('Masukkan harga satuan atau total pengeluaran lebih dari Rp 0.');
      return;
    }

    setIsSavingOut(true);
    setOutError('');
    try {
      const updated = await savePengeluaran({
        idPengeluaran: outEditId,
        tanggal: outForm.tanggal || getTodayIso(),
        namaAkun: outForm.namaAkun.trim(),
        satuan: outForm.satuan.trim() || 'Pcs',
        hargaSatuan: hargaNum,
        qty: qtyNum,
        manualTotal: outForm.manualTotal,
        total: finalTotal,
        keterangan: outForm.keterangan.trim()
      });
      setPengeluaranList(updated);
      setOutModalOpen(false);
      if (onRefresh) onRefresh(false);

      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      }).fire({
        icon: 'success',
        title: outEditId ? 'Pengeluaran diperbarui' : 'Pengeluaran dicatat'
      });
    } catch (err) {
      setOutError(err.message || 'Gagal menyimpan data pengeluaran.');
    } finally {
      setIsSavingOut(false);
    }
  };

  // =========================================================
  // 5. MODAL FORM KEBUTUHAN
  // =========================================================
  const [kebModalOpen, setKebModalOpen] = useState(false);
  const [kebEditId, setKebEditId] = useState(null);
  const [kebForm, setKebForm] = useState({
    namaKebutuhan: '',
    kategori: 'Perlengkapan',
    qty: '1',
    satuan: 'Pcs',
    targetTanggal: 'H-2 Sebelum Acara',
    penanggungJawab: '',
    status: 'Belum Siap',
    keterangan: ''
  });
  const [kebTouched, setKebTouched] = useState({});
  const [kebError, setKebError] = useState('');
  const [isSavingKeb, setIsSavingKeb] = useState(false);

  const openAddKebutuhan = () => {
    setKebEditId(null);
    setKebForm({
      namaKebutuhan: '',
      kategori: 'Perlengkapan',
      qty: '1',
      satuan: 'Pcs',
      targetTanggal: 'H-2 Sebelum Acara',
      penanggungJawab: '',
      status: 'Belum Siap',
      keterangan: ''
    });
    setKebTouched({});
    setKebError('');
    setKebModalOpen(true);
  };

  const openEditKebutuhan = (item) => {
    setKebEditId(item.idKebutuhan);
    setKebForm({
      namaKebutuhan: item.namaKebutuhan || '',
      kategori: item.kategori || 'Perlengkapan',
      qty: String(item.qty || 1),
      satuan: item.satuan || 'Pcs',
      targetTanggal: item.targetTanggal || '',
      penanggungJawab: item.penanggungJawab || '',
      status: item.status || 'Belum Siap',
      keterangan: item.keterangan || ''
    });
    setKebTouched({});
    setKebError('');
    setKebModalOpen(true);
  };

  const handleSubmitKebutuhan = async (e) => {
    e.preventDefault();
    setKebTouched({ namaKebutuhan: true, qty: true });

    if (!kebForm.namaKebutuhan.trim()) {
      setKebError('Nama kebutuhan / perlengkapan wajib diisi.');
      return;
    }
    const qtyNum = Number(kebForm.qty) || 0;
    if (qtyNum <= 0) {
      setKebError('Jumlah kebutuhan wajib lebih besar dari 0.');
      return;
    }

    setIsSavingKeb(true);
    setKebError('');
    try {
      const updated = await saveKebutuhan({
        idKebutuhan: kebEditId,
        namaKebutuhan: kebForm.namaKebutuhan.trim(),
        kategori: kebForm.kategori || 'Perlengkapan',
        qty: qtyNum,
        satuan: kebForm.satuan.trim() || 'Pcs',
        targetTanggal: kebForm.targetTanggal.trim(),
        penanggungJawab: kebForm.penanggungJawab.trim(),
        status: kebForm.status || 'Belum Siap',
        keterangan: kebForm.keterangan.trim()
      });
      setKebutuhanList(updated);
      setKebModalOpen(false);
      if (onRefresh) onRefresh(false);

      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      }).fire({
        icon: 'success',
        title: kebEditId ? 'Kebutuhan diperbarui' : 'Kebutuhan ditambahkan'
      });
    } catch (err) {
      setKebError(err.message || 'Gagal menyimpan data kebutuhan.');
    } finally {
      setIsSavingKeb(false);
    }
  };

  const handleCycleStatusKebutuhan = async (item) => {
    const idx = STATUS_KEBUTUHAN_OPTIONS.indexOf(item.status);
    const nextStatus = STATUS_KEBUTUHAN_OPTIONS[(idx + 1) % STATUS_KEBUTUHAN_OPTIONS.length];
    try {
      const updated = await saveKebutuhan({ ...item, status: nextStatus });
      setKebutuhanList(updated);
    } catch (err) {
      Swal.fire('Gagal Memperbarui Status', err.message || 'Gagal menyinkronkan status kebutuhan ke Google Sheets.', 'error');
    }
  };

  // =========================================================
  // 6. KONFIRMASI HAPUS (NATIVE DIALOG)
  // =========================================================
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'pengeluaran' | 'kebutuhan', item }
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'pengeluaran') {
        const updated = await deletePengeluaran(deleteTarget.item.idPengeluaran);
        setPengeluaranList(updated);
      } else {
        const updated = await deleteKebutuhan(deleteTarget.item.idKebutuhan);
        setKebutuhanList(updated);
      }
      setDeleteTarget(null);
      if (onRefresh) onRefresh(false);
      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true
      }).fire({
        icon: 'success',
        title: 'Data berhasil dihapus'
      });
    } catch (err) {
      Swal.fire('Gagal Menghapus Data', err.message || 'Terjadi kendala saat menghapus data dari Google Sheets.', 'error');
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // =========================================================
  // 7. UNDUH PDF RESMI BER-KOP & EXCEL
  // =========================================================
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfConfig, setPdfConfig] = useState(() => ({
    titleOut: 'LAPORAN PENCATATAN PENGELUARAN PANITIA',
    titleKeb: 'DAFTAR KEBUTUHAN & PERSIAPAN SEBELUM HARI-H',
    signerRoleOut: 'Bendahara Panitia',
    signerRoleKeb: 'Koordinator Perlengkapan',
    signerName: '',
    includeTerbilang: true,
    useActiveFilter: true
  }));

  const handleExecutePdf = async (e) => {
    e.preventDefault();
    const targetList = activeTab === 'pengeluaran'
      ? (pdfConfig.useActiveFilter ? filteredPengeluaran : pengeluaranList)
      : (pdfConfig.useActiveFilter ? filteredKebutuhan : kebutuhanList);

    if (targetList.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Belum Ada Data',
        text: activeTab === 'pengeluaran'
          ? 'Tidak ada catatan pengeluaran untuk dicetak ke PDF.'
          : 'Tidak ada daftar kebutuhan untuk dicetak ke PDF.',
        confirmButtonColor: '#075B45'
      });
      return;
    }

    setIsGeneratingPdf(true);
    try {
      if (activeTab === 'pengeluaran') {
        const filterDesc = pdfConfig.useActiveFilter && searchOut.trim()
          ? `Pencarian "${searchOut.trim()}"`
          : 'Semua Data Pengeluaran';
        await downloadPengeluaranPdf(targetList, {
          title: pdfConfig.titleOut,
          filterLabel: filterDesc,
          signerRole: pdfConfig.signerRoleOut,
          signerName: pdfConfig.signerName,
          includeTerbilang: pdfConfig.includeTerbilang
        });
      } else {
        const parts = [];
        if (pdfConfig.useActiveFilter && filterStatusKeb !== 'ALL') parts.push(`Status: ${filterStatusKeb}`);
        if (pdfConfig.useActiveFilter && filterKategoriKeb !== 'ALL') parts.push(`Seksi: ${filterKategoriKeb}`);
        if (pdfConfig.useActiveFilter && searchKeb.trim()) parts.push(`Cari: "${searchKeb.trim()}"`);
        await downloadKebutuhanPdf(targetList, {
          title: pdfConfig.titleKeb,
          filterLabel: parts.length > 0 ? parts.join(' | ') : 'Semua Status & Seksi Kebutuhan',
          signerRole: pdfConfig.signerRoleKeb,
          signerName: pdfConfig.signerName
        });
      }

      setPdfModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'PDF Resmi Berhasil Diunduh',
        text: 'Dokumen lengkap dengan KOP resmi dan tanda tangan siap dicetak.',
        confirmButtonColor: '#075B45',
        confirmButtonText: 'Selesai'
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Membuat PDF',
        text: err.message || 'Terjadi kesalahan saat menyusun PDF.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();
    if (activeTab === 'pengeluaran') {
      const rows = filteredPengeluaran.map((item, idx) => ({
        'No': idx + 1,
        'Tanggal': formatTanggalId(item.tanggal),
        'Nama Akun / Item': item.namaAkun,
        'Satuan': item.satuan,
        'Harga Satuan (Rp)': Number(item.hargaSatuan) || 0,
        'Qty': Number(item.qty) || 0,
        'Total (Rp)': Number(item.total) || 0,
        'Keterangan': item.keterangan || '-'
      }));
      const sheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, sheet, 'Pengeluaran Panitia');
      XLSX.writeFile(workbook, `Pencatatan_Pengeluaran_${getTodayIso()}.xlsx`);
    } else {
      const rows = filteredKebutuhan.map((item, idx) => ({
        'No': idx + 1,
        'Kategori / Seksi': item.kategori,
        'Kebutuhan / Barang': item.namaKebutuhan,
        'Qty': Number(item.qty) || 1,
        'Satuan': item.satuan,
        'Target Hari-H': item.targetTanggal || '-',
        'Penanggung Jawab': item.penanggungJawab || '-',
        'Status Kesiapan': item.status,
        'Catatan': item.keterangan || '-'
      }));
      const sheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, sheet, 'Kebutuhan Sebelum Hari-H');
      XLSX.writeFile(workbook, `Daftar_Kebutuhan_${getTodayIso()}.xlsx`);
    }
  };

  const renderStatusBadge = (status) => {
    if (status === 'Sudah Siap') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Sudah Siap</span>
        </span>
      );
    }
    if (status === 'Dalam Proses') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Dalam Proses</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>Belum Siap</span>
      </span>
    );
  };

  return (
    <div className="p-3 sm:p-5 lg:p-7 space-y-3 sm:space-y-4 max-w-7xl mx-auto">

      {/* =========================================================
          1. TOP HEADER BANNER (COMPACT & RAPI - 1 BARIS AKSI)
          ========================================================= */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4.5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 relative overflow-hidden">
        <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#EAF4F0] text-[#075B45] border border-[#075B45]/15 flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{activeTab === 'pengeluaran' ? 'Catat Pengeluaran Panitia' : 'Catat Kebutuhan Hari-H'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF4F0] text-[#054736] border border-[#075B45]/15 whitespace-nowrap">
                {activeTab === 'pengeluaran' ? `${statsOut.count} Akun` : `${statsKeb.total} Item`}
              </span>
            </h2>
            <p className="hidden sm:block text-xs text-slate-500 mt-0.5 leading-relaxed">
              {activeTab === 'pengeluaran'
                ? 'Catat nama akun pengeluaran, satuan, harga satuan, qty, dan total biaya serta unduh laporan PDF ber-KOP resmi.'
                : 'Susun daftar perlengkapan & persiapan sebelum Hari-H beserta status kesiapan dan penanggung jawab panitia.'}
            </p>
          </div>
        </div>

        {/* Toolbar Aksi - 1 Baris Rapi di HP */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={activeTab === 'pengeluaran' ? openAddPengeluaran : openAddKebutuhan}
            className="px-3 py-1.5 sm:py-2 rounded-xl bg-[#075B45] hover:bg-[#054736] active:scale-95 text-white font-bold text-xs shadow-2xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            <span>{activeTab === 'pengeluaran' ? '+ Pengeluaran' : '+ Kebutuhan'}</span>
          </button>

          <button
            type="button"
            onClick={() => setPdfModalOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-bold text-xs flex items-center justify-center space-x-1 transition-all shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
            title="Unduh Laporan PDF Resmi"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200/90 bg-white text-emerald-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer active:scale-95"
            title="Ekspor ke Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            type="button"
            onClick={loadAllPencatatan}
            disabled={isRefreshing}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer active:scale-95"
            title="Segarkan Data"
            aria-label="Segarkan Data Pencatatan"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin text-[#075B45]' : ''}`} />
          </button>
        </div>
      </div>

      {/* =========================================================
          PANEL 1: PENGELUARAN
          ========================================================= */}
      {activeTab === 'pengeluaran' && (
        <div className="space-y-3 sm:space-y-4">
          
          {/* KPI Summary Cards (Compact 2x2 on Mobile - Bebas Bengkak) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            
            {/* Card 1: Total Pengeluaran */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  Total Biaya
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg border flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1.5 sm:mt-2">
                <span className="text-base sm:text-xl font-black text-slate-900 tabular-nums block truncate">
                  {formatRupiah(statsOut.totalNominal)}
                </span>
                <span className="text-[10.5px] sm:text-xs text-emerald-700 font-semibold block truncate mt-0.5">
                  Akumulasi seluruh pos
                </span>
              </div>
            </div>

            {/* Card 2: Total Akun / Pos */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  Total Akun / Pos
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg border flex items-center justify-center shrink-0 bg-blue-50 text-blue-700 border-blue-200">
                  <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1.5 sm:mt-2">
                <span className="text-base sm:text-xl font-black text-slate-900 tabular-nums block">
                  {statsOut.count} <span className="text-xs font-normal text-slate-400">Item</span>
                </span>
                <span className="text-[10.5px] sm:text-xs text-blue-700 font-semibold block truncate mt-0.5">
                  Tersimpan di sistem
                </span>
              </div>
            </div>

            {/* Card 3: Akumulasi Kuantitas */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  Total Kuantitas
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg border flex items-center justify-center shrink-0 bg-amber-50 text-amber-700 border-amber-200">
                  <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1.5 sm:mt-2">
                <span className="text-base sm:text-xl font-black text-slate-900 tabular-nums block">
                  {statsOut.totalQty.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">Qty</span>
                </span>
                <span className="text-[10.5px] sm:text-xs text-amber-700 font-semibold block truncate mt-0.5">
                  Gabungan semua satuan
                </span>
              </div>
            </div>

            {/* Card 4: Pos Terbesar */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  Pos Terbesar
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg border flex items-center justify-center shrink-0 bg-purple-50 text-purple-700 border-purple-200">
                  <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1.5 sm:mt-2">
                <span className="text-base sm:text-xl font-black text-slate-900 tabular-nums block truncate">
                  {statsOut.maxItem ? formatRupiah(statsOut.maxItem.total) : 'Rp 0'}
                </span>
                <span className="text-[10.5px] sm:text-xs text-purple-700 font-semibold block truncate mt-0.5" title={statsOut.maxItem ? statsOut.maxItem.namaAkun : ''}>
                  {statsOut.maxItem ? statsOut.maxItem.namaAkun : 'Belum ada transaksi'}
                </span>
              </div>
            </div>

          </div>

          {/* Search & Sort Bar */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <label htmlFor="search-pengeluaran" className="sr-only">Cari akun pengeluaran</label>
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                id="search-pengeluaran"
                type="search"
                value={searchOut}
                onChange={(e) => setSearchOut(e.target.value)}
                placeholder="Cari akun atau catatan..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-[#075B45] focus:ring-1 focus:ring-[#075B45] outline-none text-xs font-medium text-slate-800 transition-all"
              />
              {searchOut && (
                <button
                  type="button"
                  onClick={() => setSearchOut('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <label htmlFor="sort-pengeluaran" className="text-xs font-bold text-slate-500 shrink-0">
                Urutkan:
              </label>
              <select
                id="sort-pengeluaran"
                value={sortOut}
                onChange={(e) => setSortOut(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="terbaru">Terbaru</option>
                <option value="terbesar">Terbesar</option>
                <option value="terkecil">Terkecil</option>
                <option value="nama">Nama (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Data List & Table Pengeluaran */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            {filteredPengeluaran.length === 0 ? (
              <div className="p-8 text-center space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 border border-slate-200/80 mx-auto flex items-center justify-center">
                  <Receipt className="w-6 h-6" />
                </div>
                <div className="space-y-0.5 max-w-md mx-auto">
                  <h3 className="text-xs font-bold text-slate-900">
                    {pengeluaranList.length === 0 ? 'Belum Ada Catatan Pengeluaran' : 'Tidak Ada Hasil yang Cocok'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {pengeluaranList.length === 0
                      ? 'Mulai catat pos pengeluaran panitia beserta harga satuan, qty, dan total biaya.'
                      : 'Coba ubah kata kunci pencarian.'}
                  </p>
                </div>
                {pengeluaranList.length === 0 && (
                  <button
                    type="button"
                    onClick={openAddPengeluaran}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Catat Pengeluaran Pertama</span>
                  </button>
                )}
              </div>
            ) : (
              <div>
                {/* Tampilan Kartu Khusus HP (block sm:hidden) - Anti Bengkak & Super Responsif */}
                <div className="block sm:hidden divide-y divide-slate-100 bg-white">
                  {filteredPengeluaran.map((item, idx) => (
                    <div key={item.idPengeluaran || idx} className="p-3 hover:bg-slate-50/80 transition-colors">
                      {/* Baris 1: No, Nama Akun, Tanggal */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-slate-400 text-[10px] font-semibold w-4 shrink-0 text-center">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 text-xs truncate block">
                              {item.namaAkun}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 shrink-0 tabular-nums">
                          {formatTanggalId(item.tanggal)}
                        </span>
                      </div>

                      {/* Baris 2: Qty x Harga Satuan & Total Biaya */}
                      <div className="flex items-center justify-between text-[11px] pt-1.5 mt-1.5 border-t border-slate-100">
                        <div className="text-slate-600 font-medium truncate mr-2">
                          <span>{item.qty} {item.satuan || 'Pcs'}</span>
                          <span className="text-slate-400 mx-1">@</span>
                          <span className="font-mono">{formatRupiah(item.hargaSatuan)}</span>
                        </div>
                        <span className="font-mono font-extrabold text-[#054736] text-xs shrink-0">
                          {formatRupiah(item.total)}
                        </span>
                      </div>

                      {/* Baris 3: Catatan & Aksi */}
                      <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-100 text-xs">
                        <div className="text-[10.5px] text-slate-400 italic truncate mr-2">
                          {item.keterangan || '-'}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditPengeluaran(item)}
                            aria-label={`Edit ${item.namaAkun}`}
                            title="Edit Pengeluaran"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ type: 'pengeluaran', item })}
                            aria-label={`Hapus ${item.namaAkun}`}
                            title="Hapus Pengeluaran"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Total Footer Ringkas di HP */}
                  <div className="p-3 bg-emerald-50/80 border-t border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-950">
                    <span>Total ({filteredPengeluaran.length} Item)</span>
                    <span className="font-mono font-black text-sm text-emerald-900">
                      {formatRupiah(statsOut.filteredNominal)}
                    </span>
                  </div>
                </div>

                {/* Tampilan Tabel Desktop (hidden sm:block) */}
                <div
                  tabIndex={0}
                  role="region"
                  aria-labelledby="tabel-pengeluaran-caption"
                  className="hidden sm:block overflow-x-auto"
                >
                  <table className="w-full text-left text-xs">
                    <caption id="tabel-pengeluaran-caption" className="sr-only">
                      Daftar pencatatan pengeluaran panitia Musabaqah Akhirussanah 1447 H
                    </caption>
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-4 text-center w-12">No.</th>
                        <th className="py-3 px-4 text-center w-28">Tanggal</th>
                        <th className="py-3 px-4">Nama Akun & Catatan</th>
                        <th className="py-3 px-4 text-center w-24">Satuan</th>
                        <th className="py-3 px-4 text-right w-32">Harga Satuan</th>
                        <th className="py-3 px-4 text-center w-20">Qty</th>
                        <th className="py-3 px-4 text-right w-36">Total</th>
                        <th className="py-3 px-4 text-center w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredPengeluaran.map((item, idx) => (
                        <tr key={item.idPengeluaran} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-slate-600 tabular-nums">
                            {formatTanggalId(item.tanggal)}
                          </td>
                          <th scope="row" className="py-3 px-4 font-bold text-slate-900 text-left">
                            <span className="block font-bold text-slate-900">{item.namaAkun}</span>
                            {item.keterangan && (
                              <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                                {item.keterangan}
                              </span>
                            )}
                          </th>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                              {item.satuan || 'Pcs'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-700 tabular-nums">
                            {formatRupiah(item.hargaSatuan)}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 tabular-nums">
                            {item.qty}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-[#054736] tabular-nums">
                            {formatRupiah(item.total)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditPengeluaran(item)}
                                aria-label={`Edit ${item.namaAkun}`}
                                title="Edit Pengeluaran"
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget({ type: 'pengeluaran', item })}
                                aria-label={`Hapus ${item.namaAkun}`}
                                title="Hapus Pengeluaran"
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-50/80 border-t-2 border-emerald-200 font-bold text-emerald-900">
                        <td colSpan={6} className="py-3 px-4 text-right text-xs uppercase tracking-wider">
                          Total Pengeluaran ({filteredPengeluaran.length} Item)
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sm sm:text-base font-black text-emerald-800 tabular-nums">
                          {formatRupiah(statsOut.filteredNominal)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          PANEL 2: KEBUTUHAN SEBELUM HARI-H
          ========================================================= */}
      {activeTab === 'kebutuhan' && (
        <div className="space-y-3 sm:space-y-4">
          
          {/* KPI Progress Kebutuhan (Compact 2x2 on Mobile - Bebas Bengkak) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            
            {/* Card 1: Kesiapan Persentase */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-slate-200/80 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Kesiapan
                </span>
                <span className="text-[10px] font-mono font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full shrink-0">
                  {statsKeb.readyPct}%
                </span>
              </div>
              <div className="text-base sm:text-xl font-black text-slate-900 tabular-nums">
                {statsKeb.siap} / {statsKeb.total} <span className="text-xs font-normal text-slate-400">Siap</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#075B45] rounded-full transition-all duration-300"
                  style={{ width: `${statsKeb.readyPct}%` }}
                />
              </div>
            </div>

            {/* Card 2: Sudah Siap */}
            <button
              type="button"
              onClick={() => setFilterStatusKeb(filterStatusKeb === 'Sudah Siap' ? 'ALL' : 'Sudah Siap')}
              className={`text-left rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] ${
                filterStatusKeb === 'Sudah Siap'
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40'
                  : 'bg-white border-slate-200/80 shadow-2xs hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase">Sudah Siap</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg border flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 border-emerald-200 group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1 sm:mt-1.5">
                <span className="text-base sm:text-xl font-black text-slate-900 tabular-nums block">{statsKeb.siap}</span>
                <span className="text-[10.5px] text-emerald-700 font-semibold block mt-0.5">Siap digunakan</span>
              </div>
            </button>

            {/* Card 3: Dalam Proses */}
            <button
              type="button"
              onClick={() => setFilterStatusKeb(filterStatusKeb === 'Dalam Proses' ? 'ALL' : 'Dalam Proses')}
              className={`text-left rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] ${
                filterStatusKeb === 'Dalam Proses'
                  ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40'
                  : 'bg-white border-slate-200/80 shadow-2xs hover:border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase">Dalam Proses</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg border flex items-center justify-center shrink-0 bg-amber-50 text-amber-600 border-amber-200 group-hover:scale-105 transition-transform">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1 sm:mt-1.5">
                <span className="text-base sm:text-xl font-black text-slate-900 tabular-nums block">{statsKeb.proses}</span>
                <span className="text-[10.5px] text-amber-700 font-semibold block mt-0.5">Sedang disiapkan</span>
              </div>
            </button>

            {/* Card 4: Belum Siap */}
            <button
              type="button"
              onClick={() => setFilterStatusKeb(filterStatusKeb === 'Belum Siap' ? 'ALL' : 'Belum Siap')}
              className={`text-left rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] ${
                filterStatusKeb === 'Belum Siap'
                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40'
                  : 'bg-white border-slate-200/80 shadow-2xs hover:border-rose-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase">Belum Siap</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg border flex items-center justify-center shrink-0 bg-rose-50 text-rose-600 border-rose-200 group-hover:scale-105 transition-transform">
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="mt-1 sm:mt-1.5">
                <span className="text-base sm:text-xl font-black text-slate-900 tabular-nums block">{statsKeb.belum}</span>
                <span className="text-[10.5px] text-rose-700 font-semibold block mt-0.5">Perlu tindak lanjut</span>
              </div>
            </button>

          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <label htmlFor="search-kebutuhan" className="sr-only">Cari daftar kebutuhan</label>
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                id="search-kebutuhan"
                type="search"
                value={searchKeb}
                onChange={(e) => setSearchKeb(e.target.value)}
                placeholder="Cari kebutuhan atau PJ..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-[#075B45] focus:ring-1 focus:ring-[#075B45] outline-none text-xs font-medium text-slate-800 transition-all"
              />
              {searchKeb && (
                <button
                  type="button"
                  onClick={() => setSearchKeb('')}
                  aria-label="Hapus pencarian kebutuhan"
                  className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <select
                aria-label="Filter status kebutuhan"
                value={filterStatusKeb}
                onChange={(e) => setFilterStatusKeb(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Status ({statsKeb.total})</option>
                {STATUS_KEBUTUHAN_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                aria-label="Filter kategori seksi"
                value={filterKategoriKeb}
                onChange={(e) => setFilterKategoriKeb(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kategori</option>
                {KEBUTUHAN_KATEGORI.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Data List & Table Kebutuhan */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            {filteredKebutuhan.length === 0 ? (
              <div className="p-8 text-center space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 border border-slate-200/80 mx-auto flex items-center justify-center">
                  <ListChecks className="w-6 h-6" />
                </div>
                <div className="space-y-0.5 max-w-md mx-auto">
                  <h3 className="text-xs font-bold text-slate-900">
                    {kebutuhanList.length === 0 ? 'Belum Ada Daftar Kebutuhan Hari-H' : 'Tidak Ada Kebutuhan yang Cocok'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {kebutuhanList.length === 0
                      ? 'Catat seluruh barang, perlengkapan lomba, konsumsi, dan tugas persiapan sebelum Hari-H.'
                      : 'Coba reset filter status atau kata kunci pencarian.'}
                  </p>
                </div>
                {kebutuhanList.length === 0 ? (
                  <button
                    type="button"
                    onClick={openAddKebutuhan}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Daftar Kebutuhan</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchKeb('');
                      setFilterStatusKeb('ALL');
                      setFilterKategoriKeb('ALL');
                    }}
                    className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <div>
                {/* Tampilan Kartu Khusus HP (block sm:hidden) - Anti Bengkak & Super Responsif */}
                <div className="block sm:hidden divide-y divide-slate-100 bg-white">
                  {filteredKebutuhan.map((item, idx) => (
                    <div key={item.idKebutuhan || idx} className="p-3 hover:bg-slate-50/80 transition-colors">
                      {/* Baris 1: No, Nama Kebutuhan, Status Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-slate-400 text-[10px] font-semibold w-4 shrink-0 text-center">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className={`block font-bold text-xs truncate ${item.status === 'Sudah Siap' ? 'text-emerald-900' : 'text-slate-900'}`}>
                              {item.namaKebutuhan}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCycleStatusKebutuhan(item)}
                          title="Klik untuk ubah status kesiapan"
                          className="cursor-pointer hover:opacity-85 active:scale-95 transition-all shrink-0"
                        >
                          {renderStatusBadge(item.status)}
                        </button>
                      </div>

                      {/* Baris 2: Kategori & Target Hari & PJ */}
                      <div className="flex items-center justify-between text-[11px] pt-1.5 mt-1.5 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-600 truncate mr-2">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 shrink-0">
                            {item.kategori}
                          </span>
                          <span className="font-bold text-slate-800 text-[10.5px] truncate">
                            {item.qty} {item.satuan}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-[10.5px] text-slate-500 shrink-0">
                          {item.penanggungJawab && (
                            <span className="flex items-center space-x-1">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[100px]">{item.penanggungJawab}</span>
                            </span>
                          )}
                          {item.targetTanggal && (
                            <span className="font-mono text-slate-400 text-[10px]">
                              ({item.targetTanggal})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Baris 3: Catatan & Aksi */}
                      <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-100 text-xs">
                        <div className="text-[10.5px] text-slate-400 italic truncate mr-2">
                          {item.keterangan || '-'}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditKebutuhan(item)}
                            aria-label={`Edit ${item.namaKebutuhan}`}
                            title="Edit Kebutuhan"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ type: 'kebutuhan', item })}
                            aria-label={`Hapus ${item.namaKebutuhan}`}
                            title="Hapus Kebutuhan"
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tampilan Tabel Desktop (hidden sm:block) */}
                <div
                  tabIndex={0}
                  role="region"
                  aria-labelledby="tabel-kebutuhan-caption"
                  className="hidden sm:block overflow-x-auto"
                >
                  <table className="w-full text-left text-xs">
                    <caption id="tabel-kebutuhan-caption" className="sr-only">
                      Daftar pencatatan kebutuhan dan persiapan sebelum Hari-H Musabaqah Akhirussanah
                    </caption>
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-4 text-center w-12">No.</th>
                        <th className="py-3 px-4 w-32">Seksi / Kategori</th>
                        <th className="py-3 px-4">Kebutuhan & Keterangan</th>
                        <th className="py-3 px-4 text-center w-24">Jumlah</th>
                        <th className="py-3 px-4 w-40">Target & PJ</th>
                        <th className="py-3 px-4 text-center w-36">Status (Klik Ubah)</th>
                        <th className="py-3 px-4 text-center w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredKebutuhan.map((item, idx) => (
                        <tr key={item.idKebutuhan} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                              {item.kategori}
                            </span>
                          </td>
                          <th scope="row" className="py-3 px-4 font-bold text-slate-900 text-left">
                            <span className={`block font-bold ${item.status === 'Sudah Siap' ? 'text-emerald-900' : 'text-slate-900'}`}>
                              {item.namaKebutuhan}
                            </span>
                            {item.keterangan && (
                              <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                                {item.keterangan}
                              </span>
                            )}
                          </th>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                            {item.qty} {item.satuan}
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-0.5 text-[11px] text-slate-600">
                              {item.targetTanggal && (
                                <span className="flex items-center space-x-1 font-semibold text-slate-800">
                                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{item.targetTanggal}</span>
                                </span>
                              )}
                              {item.penanggungJawab && (
                                <span className="flex items-center space-x-1 text-slate-500">
                                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{item.penanggungJawab}</span>
                                </span>
                              )}
                              {!item.targetTanggal && !item.penanggungJawab && <span>-</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleCycleStatusKebutuhan(item)}
                              title="Klik untuk ubah status kesiapan"
                              className="cursor-pointer hover:opacity-85 active:scale-95 transition-all"
                            >
                              {renderStatusBadge(item.status)}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditKebutuhan(item)}
                                aria-label={`Edit ${item.namaKebutuhan}`}
                                title="Edit Kebutuhan"
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget({ type: 'kebutuhan', item })}
                                aria-label={`Hapus ${item.namaKebutuhan}`}
                                title="Hapus Kebutuhan"
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          DIALOG 1: TAMBAH / EDIT PENGELUARAN
          ========================================================= */}
      <NativeModalDialog
        isOpen={outModalOpen}
        onClose={() => setOutModalOpen(false)}
        labelledBy="dialog-pengeluaran-title"
        maxWidthClass="max-w-lg"
      >
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
            <h1 id="dialog-pengeluaran-title" className="text-base font-bold text-slate-900">
              {outEditId ? 'Edit Data Pengeluaran' : 'Catat Pengeluaran Baru'}
            </h1>
            <button
              type="button"
              onClick={() => setOutModalOpen(false)}
              aria-label="Tutup dialog"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmitPengeluaran} noValidate className="p-6 space-y-4 overflow-y-auto">
            {outError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{outError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="out-nama-akun" className="block text-xs font-bold text-slate-800">
                Nama Akun / Uraian Pengeluaran <span aria-hidden="true" className="text-rose-600">*</span>
              </label>
              <input
                id="out-nama-akun"
                name="namaAkun"
                type="text"
                autoFocus
                required
                aria-invalid={outTouched.namaAkun && !outForm.namaAkun.trim() ? 'true' : undefined}
                value={outForm.namaAkun}
                onBlur={() => setOutTouched(prev => ({ ...prev, namaAkun: true }))}
                onChange={(e) => {
                  setOutForm(prev => ({ ...prev, namaAkun: e.target.value }));
                  if (outError) setOutError('');
                }}
                placeholder="Contoh: Konsumsi Dewan Juri / Spanduk Panggung"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15 outline-none text-base sm:text-sm font-semibold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label htmlFor="out-tanggal" className="block text-xs font-bold text-slate-800">
                  Tanggal Transaksi
                </label>
                <input
                  id="out-tanggal"
                  name="tanggal"
                  type="date"
                  value={outForm.tanggal}
                  onChange={(e) => setOutForm(prev => ({ ...prev, tanggal: e.target.value }))}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 outline-none text-base sm:text-sm font-medium text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="out-satuan" className="block text-xs font-bold text-slate-800">
                  Satuan Unit
                </label>
                <input
                  id="out-satuan"
                  name="satuan"
                  type="text"
                  list="satuan-unit-list"
                  value={outForm.satuan}
                  onChange={(e) => setOutForm(prev => ({ ...prev, satuan: e.target.value }))}
                  placeholder="Pcs, Box, Rim, Paket..."
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 outline-none text-base sm:text-sm font-medium text-slate-900"
                />
                <datalist id="satuan-unit-list">
                  {SATUAN_PRESETS.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label htmlFor="out-harga" className="block text-xs font-bold text-slate-800">
                  Harga Satuan (Rp)
                </label>
                <input
                  id="out-harga"
                  name="hargaSatuan"
                  type="text"
                  inputMode="numeric"
                  value={outForm.hargaSatuan}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setOutForm(prev => ({ ...prev, hargaSatuan: digits, manualTotal: false }));
                    if (outError) setOutError('');
                  }}
                  placeholder="Contoh: 25000"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 outline-none text-base sm:text-sm font-mono font-bold text-slate-900"
                />
                <span className="text-[11px] font-semibold text-slate-500 block">
                  {formatRupiah(Number(outForm.hargaSatuan) || 0)} per {outForm.satuan || 'Satuan'}
                </span>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="out-qty" className="block text-xs font-bold text-slate-800">
                  Qty (Jumlah) <span aria-hidden="true" className="text-rose-600">*</span>
                </label>
                <input
                  id="out-qty"
                  name="qty"
                  type="text"
                  inputMode="numeric"
                  required
                  value={outForm.qty}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setOutForm(prev => ({ ...prev, qty: digits, manualTotal: false }));
                    if (outError) setOutError('');
                  }}
                  placeholder="1"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 outline-none text-base sm:text-sm font-mono font-bold text-slate-900"
                />
                <span className="text-[11px] text-slate-500 block">
                  Jumlah unit ({outForm.qty || 0} {outForm.satuan || 'Satuan'})
                </span>
              </div>
            </div>

            {/* Kotak Total Otomatis / Manual */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-900">
                  Total Biaya Pengeluaran
                </span>
                <label className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={outForm.manualTotal}
                    onChange={(e) => setOutForm(prev => ({
                      ...prev,
                      manualTotal: e.target.checked,
                      totalOverride: e.target.checked ? String(computedOutTotal) : ''
                    }))}
                    className="rounded accent-emerald-700 w-4 h-4"
                  />
                  <span>Input Total Manual</span>
                </label>
              </div>

              {outForm.manualTotal ? (
                <input
                  id="out-total-manual"
                  type="text"
                  inputMode="numeric"
                  value={outForm.totalOverride}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setOutForm(prev => ({ ...prev, totalOverride: digits }));
                    if (outError) setOutError('');
                  }}
                  placeholder="Masukkan nominal total..."
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-emerald-300 bg-white font-mono font-black text-base text-emerald-900 outline-none"
                />
              ) : (
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-emerald-700 font-mono">
                    {outForm.qty || 0} x {formatRupiah(Number(outForm.hargaSatuan) || 0)}
                  </span>
                  <span className="text-xl font-black font-mono text-emerald-800 tabular-nums">
                    {formatRupiah(computedOutTotal)}
                  </span>
                </div>
              )}
              <p className="text-[11px] italic text-emerald-800/90">
                Terbilang: {terbilangRupiah(computedOutTotal)}
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="out-keterangan" className="block text-xs font-bold text-slate-800">
                Keterangan / Catatan Tambahan (Opsional)
              </label>
              <textarea
                id="out-keterangan"
                rows={2}
                value={outForm.keterangan}
                onChange={(e) => setOutForm(prev => ({ ...prev, keterangan: e.target.value }))}
                placeholder="Misal: Toko Berkah Putak, Pembayaran Lunas..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 outline-none text-base sm:text-xs font-medium text-slate-800"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setOutModalOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSavingOut}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isSavingOut ? 'Menyimpan...' : (outEditId ? 'Simpan Perubahan' : 'Simpan Pengeluaran')}
              </button>
            </div>
          </form>
        </div>
      </NativeModalDialog>

      {/* =========================================================
          DIALOG 2: TAMBAH / EDIT KEBUTUHAN SEBELUM HARI-H
          ========================================================= */}
      <NativeModalDialog
        isOpen={kebModalOpen}
        onClose={() => setKebModalOpen(false)}
        labelledBy="dialog-kebutuhan-title"
        maxWidthClass="max-w-lg"
      >
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
            <h1 id="dialog-kebutuhan-title" className="text-base font-bold text-slate-900">
              {kebEditId ? 'Edit Daftar Kebutuhan' : 'Tambah Kebutuhan Sebelum Hari-H'}
            </h1>
            <button
              type="button"
              onClick={() => setKebModalOpen(false)}
              aria-label="Tutup dialog"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmitKebutuhan} noValidate className="p-6 space-y-4 overflow-y-auto">
            {kebError && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{kebError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="keb-nama" className="block text-xs font-bold text-slate-800">
                Nama Kebutuhan / Perlengkapan <span aria-hidden="true" className="text-rose-600">*</span>
              </label>
              <input
                id="keb-nama"
                type="text"
                autoFocus
                required
                aria-invalid={kebTouched.namaKebutuhan && !kebForm.namaKebutuhan.trim() ? 'true' : undefined}
                value={kebForm.namaKebutuhan}
                onBlur={() => setKebTouched(prev => ({ ...prev, namaKebutuhan: true }))}
                onChange={(e) => {
                  setKebForm(prev => ({ ...prev, namaKebutuhan: e.target.value }));
                  if (kebError) setKebError('');
                }}
                placeholder="Contoh: Cetak Kartu Nomor Peserta & ID Panitia"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/15 outline-none text-base sm:text-sm font-semibold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-1 space-y-1.5">
                <label htmlFor="keb-kategori" className="block text-xs font-bold text-slate-800">
                  Seksi / Kategori
                </label>
                <select
                  id="keb-kategori"
                  value={kebForm.kategori}
                  onChange={(e) => setKebForm(prev => ({ ...prev, kategori: e.target.value }))}
                  className="w-full min-h-[44px] px-3 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none text-base sm:text-xs font-bold text-slate-800 bg-white"
                >
                  {KEBUTUHAN_KATEGORI.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="keb-qty" className="block text-xs font-bold text-slate-800">
                  Qty <span aria-hidden="true" className="text-rose-600">*</span>
                </label>
                <input
                  id="keb-qty"
                  type="text"
                  inputMode="numeric"
                  value={kebForm.qty}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setKebForm(prev => ({ ...prev, qty: digits }));
                    if (kebError) setKebError('');
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none text-base sm:text-sm font-mono font-bold text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="keb-satuan" className="block text-xs font-bold text-slate-800">
                  Satuan
                </label>
                <input
                  id="keb-satuan"
                  type="text"
                  list="satuan-unit-list"
                  value={kebForm.satuan}
                  onChange={(e) => setKebForm(prev => ({ ...prev, satuan: e.target.value }))}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none text-base sm:text-sm font-medium text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label htmlFor="keb-target" className="block text-xs font-bold text-slate-800">
                  Target Persiapan Sebelum Hari-H
                </label>
                <input
                  id="keb-target"
                  type="text"
                  list="target-hari-list"
                  value={kebForm.targetTanggal}
                  onChange={(e) => setKebForm(prev => ({ ...prev, targetTanggal: e.target.value }))}
                  placeholder="Contoh: H-2 Sebelum Acara"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none text-base sm:text-xs font-medium text-slate-900"
                />
                <datalist id="target-hari-list">
                  {TARGET_HARI_PRESETS.map(p => <option key={p} value={p} />)}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="keb-pj" className="block text-xs font-bold text-slate-800">
                  Penanggung Jawab (PJ)
                </label>
                <input
                  id="keb-pj"
                  type="text"
                  value={kebForm.penanggungJawab}
                  onChange={(e) => setKebForm(prev => ({ ...prev, penanggungJawab: e.target.value }))}
                  placeholder="Contoh: Sie Perlengkapan / Ust. ..."
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none text-base sm:text-xs font-medium text-slate-900"
                />
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-slate-800">
                Status Kesiapan Saat Ini
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_KEBUTUHAN_OPTIONS.map((statusOpt) => {
                  const selected = kebForm.status === statusOpt;
                  const tone = statusOpt === 'Sudah Siap'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : statusOpt === 'Dalam Proses'
                      ? 'border-amber-500 bg-amber-50 text-amber-900'
                      : 'border-rose-500 bg-rose-50 text-rose-900';
                  return (
                    <label
                      key={statusOpt}
                      className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-center text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        selected ? tone : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="kebStatus"
                        value={statusOpt}
                        checked={selected}
                        onChange={() => setKebForm(prev => ({ ...prev, status: statusOpt }))}
                        className="accent-emerald-700"
                      />
                      <span>{statusOpt}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-1.5">
              <label htmlFor="keb-keterangan" className="block text-xs font-bold text-slate-800">
                Catatan / Spesifikasi Tambahan (Opsional)
              </label>
              <textarea
                id="keb-keterangan"
                rows={2}
                value={kebForm.keterangan}
                onChange={(e) => setKebForm(prev => ({ ...prev, keterangan: e.target.value }))}
                placeholder="Misal: Ukuran meja juri 6 buah, warna taplak hijau..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-none text-base sm:text-xs font-medium text-slate-800"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setKebModalOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSavingKeb}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-60"
              >
                {isSavingKeb ? 'Menyimpan...' : (kebEditId ? 'Simpan Perubahan' : 'Simpan Kebutuhan')}
              </button>
            </div>
          </form>
        </div>
      </NativeModalDialog>

      {/* =========================================================
          DIALOG 3: KONFIGURASI & UNDUH PDF RESMI BER-KOP
          ========================================================= */}
      <NativeModalDialog
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        labelledBy="dialog-pdf-title"
        maxWidthClass="max-w-lg"
      >
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
          <div className="px-6 py-4 border-b border-emerald-800 flex items-center justify-between bg-[#075B45] text-white shrink-0">
            <div className="flex items-center space-x-2.5">
              <FileText className="w-5 h-5 text-[#D9B45B]" />
              <h1 id="dialog-pdf-title" className="text-base font-bold">
                Unduh Laporan PDF Resmi (Dengan KOP)
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setPdfModalOpen(false)}
              aria-label="Tutup dialog PDF"
              className="p-1.5 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleExecutePdf} className="p-6 space-y-4 overflow-y-auto">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <span className="font-bold block">
                Format Dokumen: Kertas A4 + KOP Resmi YPPS Al-Falah Putak
              </span>
              <span className="text-[11px] text-emerald-800 block">
                {activeTab === 'pengeluaran'
                  ? `Akan mencetak ${(pdfConfig.useActiveFilter ? filteredPengeluaran : pengeluaranList).length} data pengeluaran dengan total ${formatRupiah((pdfConfig.useActiveFilter ? filteredPengeluaran : pengeluaranList).reduce((s, it) => s + (Number(it.total) || 0), 0))}.`
                  : `Akan mencetak ${(pdfConfig.useActiveFilter ? filteredKebutuhan : kebutuhanList).length} item daftar kebutuhan sebelum Hari-H beserta status kesiapan.`}
              </span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pdf-title-input" className="block text-xs font-bold text-slate-800">
                Judul Dokumen pada PDF
              </label>
              <input
                id="pdf-title-input"
                type="text"
                autoFocus
                value={activeTab === 'pengeluaran' ? pdfConfig.titleOut : pdfConfig.titleKeb}
                onChange={(e) => setPdfConfig(prev => ({
                  ...prev,
                  [activeTab === 'pengeluaran' ? 'titleOut' : 'titleKeb']: e.target.value
                }))}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 focus:border-[#075B45] outline-none text-base sm:text-xs font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label htmlFor="pdf-signer-role" className="block text-xs font-bold text-slate-800">
                  Jabatan Penandatangan Kanan
                </label>
                <input
                  id="pdf-signer-role"
                  type="text"
                  value={activeTab === 'pengeluaran' ? pdfConfig.signerRoleOut : pdfConfig.signerRoleKeb}
                  onChange={(e) => setPdfConfig(prev => ({
                    ...prev,
                    [activeTab === 'pengeluaran' ? 'signerRoleOut' : 'signerRoleKeb']: e.target.value
                  }))}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 focus:border-[#075B45] outline-none text-base sm:text-xs font-medium text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="pdf-signer-name" className="block text-xs font-bold text-slate-800">
                  Nama Petugas / Bendahara (Opsional)
                </label>
                <input
                  id="pdf-signer-name"
                  type="text"
                  value={pdfConfig.signerName}
                  onChange={(e) => setPdfConfig(prev => ({ ...prev, signerName: e.target.value }))}
                  placeholder="Kosongkan untuk garis TTD manual"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 focus:border-[#075B45] outline-none text-base sm:text-xs font-medium text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pdfConfig.useActiveFilter}
                  onChange={(e) => setPdfConfig(prev => ({ ...prev, useActiveFilter: e.target.checked }))}
                  className="w-4 h-4 rounded accent-[#075B45]"
                />
                <span>Ikuti filter / pencarian yang sedang aktif di tabel</span>
              </label>

              {activeTab === 'pengeluaran' && (
                <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pdfConfig.includeTerbilang}
                    onChange={(e) => setPdfConfig(prev => ({ ...prev, includeTerbilang: e.target.checked }))}
                    className="w-4 h-4 rounded accent-[#075B45]"
                  />
                  <span>Sertakan kotak nominal Terbilang Rupiah</span>
                </label>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPdfModalOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isGeneratingPdf}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#075B45] hover:bg-[#054736] text-white font-bold text-xs shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
              >
                <FileText className="w-4 h-4 text-[#D9B45B]" />
                <span>{isGeneratingPdf ? 'Menyusun PDF...' : 'Unduh PDF Sekarang'}</span>
              </button>
            </div>
          </form>
        </div>
      </NativeModalDialog>

      {/* =========================================================
          DIALOG 4: KONFIRMASI HAPUS (DESTRUCTIVE CONFIRMATION)
          ========================================================= */}
      <NativeModalDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        labelledBy="dialog-delete-title"
        maxWidthClass="max-w-md"
      >
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h1 id="dialog-delete-title" className="text-base font-bold text-slate-900">
                Hapus Data Pencatatan?
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                Data <strong>
                  {deleteTarget?.type === 'pengeluaran'
                    ? deleteTarget.item?.namaAkun
                    : deleteTarget?.item?.namaKebutuhan}
                </strong> akan dihapus permanen dari daftar.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer disabled:opacity-60"
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => setDeleteTarget(null)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      </NativeModalDialog>

    </div>
  );
}
