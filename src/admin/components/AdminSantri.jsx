import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Users, 
  Dices, 
  Search, 
  MessageSquare, 
  Eye, 
  X,
  RotateCcw,
  FileText,
  Layers,
  Trophy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  updateStatus, 
  batchUpdateStatus,
  generateRandomQueueNumbers,
  getWaliKelasList,
  updateRegistration,
  deleteRegistration,
  getSubKelasByTingkat,
  isSantriPutri
} from '../../shared/services/api';
import { CABANG_LOMBA_LIST } from '../../shared/data/competitions';

// Helper load base64 image dari URL untuk KOP PDF
const getBase64Image = async (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
  });
};

export default function AdminSantri({ 
  registrations = [], 
  onRefresh, 
  searchTerm: parentSearch = '',
  setSearchTerm
}) {
  const [localSearch, setLocalSearch] = useState('');
  const [filterTingkat, setFilterTingkat] = useState('ALL');
  const [filterWaliKelas, setFilterWaliKelas] = useState('ALL');
  const [statusTab, setStatusTab] = useState('ALL');
  const [filterGender, setFilterGender] = useState('ALL');
  const [filterLottery, setFilterLottery] = useState('ALL'); // 'ALL' | 'ASSIGNED' | 'UNASSIGNED'

  // Pagination State (Default 25 Data Per Halaman untuk kenyamanan operasional panitia)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [statusProcessingId, setStatusProcessingId] = useState(null);

  // Modal Detail Santri
  const [selectedSantri, setSelectedSantri] = useState(null);

  // Modal Unduh PDF Modern
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadTingkat, setDownloadTingkat] = useState('ALL');
  const [downloadCabang, setDownloadCabang] = useState('ALL');
  const [isDownloading, setIsDownloading] = useState(false);

  // Modal Edit Santri State
  const [editingSantri, setEditingSantri] = useState(null);
  const [editForm, setEditForm] = useState({
    Nama_Lengkap: '',
    Jenis_Kelamin: 'L',
    Tingkat: 'Ula',
    Kelas_Kategori: '',
    Cabang_Lomba: '',
    Wali_Kelas: '',
    Nomor_WA: '',
    Nomor_Urut: '',
    Status: 'Pending',
    Catatan: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const subKelasData = useMemo(() => {
    try {
      return getSubKelasByTingkat();
    } catch (e) {
      return {};
    }
  }, []);

  const handleOpenEdit = (item) => {
    setEditingSantri(item);
    setEditForm({
      Nama_Lengkap: item.Nama_Lengkap || '',
      Jenis_Kelamin: item.Jenis_Kelamin || 'L',
      Tingkat: item.Tingkat || 'Ula',
      Kelas_Kategori: item.Kelas_Kategori || '',
      Cabang_Lomba: item.Cabang_Lomba || '',
      Wali_Kelas: item.Wali_Kelas || '',
      Nomor_WA: item.Nomor_WA || '',
      Nomor_Urut: item.Nomor_Urut || '',
      Status: item.Status || 'Pending',
      Catatan: item.Catatan || ''
    });
    setEditError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.Nama_Lengkap.trim()) {
      setEditError('Nama lengkap santri tidak boleh kosong.');
      return;
    }
    try {
      setIsSavingEdit(true);
      setEditError('');
      const cleanForm = {
        ...editForm,
        Nama_Lengkap: editForm.Nama_Lengkap.trim().toUpperCase()
      };
      await updateRegistration(editingSantri.ID_Pendaftaran, cleanForm);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil Diedit!',
        text: `Data ${cleanForm.Nama_Lengkap} (${editingSantri.ID_Pendaftaran}) telah diperbarui.`,
        timer: 2000,
        showConfirmButton: false
      });
      setEditingSantri(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setEditError('Gagal menyimpan perubahan: ' + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteSantri = async (item) => {
    const result = await Swal.fire({
      title: 'Hapus Santri?',
      html: `Apakah Anda yakin ingin menghapus santri <strong>${item.Nama_Lengkap}</strong> (${item.ID_Pendaftaran})?<br/><span class="text-xs text-rose-600">Data juga akan terhapus dari Google Sheets.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus Data',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await deleteRegistration(item.ID_Pendaftaran);
        Swal.fire({
          icon: 'success',
          title: 'Terhapus!',
          text: `Data ${item.Nama_Lengkap} telah dihapus.`,
          timer: 1800,
          showConfirmButton: false
        });
        if (onRefresh) onRefresh();
      } catch (err) {
        Swal.fire('Gagal!', err.message, 'error');
      }
    }
  };

  const effectiveSearch = localSearch || parentSearch;

  // Daftar Semua Wali Kelas (Master + Data Registrasi)
  const allWaliKelas = useMemo(() => {
    let list = [];
    try {
      const fromApi = getWaliKelasList() || [];
      list = fromApi.map(item => (typeof item === 'string' ? item : item.nama)).filter(Boolean);
    } catch (e) {
      console.error(e);
    }
    const fromRegs = registrations.map(r => r.Wali_Kelas).filter(Boolean);
    return Array.from(new Set([...list, ...fromRegs])).sort((a, b) => a.localeCompare(b, 'id'));
  }, [registrations]);

  // Daftar Opsi Wali Kelas yang relevan dengan Tingkat yang dipilih
  const filteredWaliOptions = useMemo(() => {
    if (filterTingkat === 'ALL') return allWaliKelas;
    const tLower = filterTingkat.toLowerCase();

    const master = getWaliKelasList() || [];
    const matchingMaster = master
      .filter(w => (w.tingkat || '').toLowerCase().includes(tLower) || tLower.includes((w.tingkat || '').toLowerCase()))
      .map(w => w.nama);

    const matchingRegs = registrations
      .filter(r => (r.Tingkat || '').toLowerCase().includes(tLower))
      .map(r => r.Wali_Kelas);

    const combined = Array.from(new Set([...matchingMaster, ...matchingRegs])).filter(Boolean).sort((a, b) => a.localeCompare(b, 'id'));
    return combined.length > 0 ? combined : allWaliKelas;
  }, [filterTingkat, allWaliKelas, registrations]);

  // Handler Ganti Tingkat: reset Wali Kelas jika tidak ada dalam opsi relevan
  const handleTingkatChange = (newTingkat) => {
    setFilterTingkat(newTingkat);
    if (filterWaliKelas !== 'ALL' && newTingkat !== 'ALL') {
      const tLower = newTingkat.toLowerCase();
      const master = getWaliKelasList() || [];
      const isRelevant = master.some(w => 
        w.nama === filterWaliKelas && 
        ((w.tingkat || '').toLowerCase().includes(tLower) || tLower.includes((w.tingkat || '').toLowerCase()))
      );
      if (!isRelevant) {
        setFilterWaliKelas('ALL');
      }
    }
  };

  // Status apakah ada filter aktif
  const isFilterActive = filterTingkat !== 'ALL' || filterWaliKelas !== 'ALL' || filterGender !== 'ALL' || filterLottery !== 'ALL' || localSearch.trim() !== '' || parentSearch.trim() !== '' || statusTab !== 'ALL';

  const handleResetFilters = () => {
    setLocalSearch('');
    if (setSearchTerm) setSearchTerm('');
    setFilterTingkat('ALL');
    setFilterWaliKelas('ALL');
    setFilterGender('ALL');
    setFilterLottery('ALL');
    setStatusTab('ALL');
    setSelectedIds(new Set());
  };

  // Filter Data
  const filteredData = registrations.filter(item => {
    if (effectiveSearch) {
      const q = effectiveSearch.toLowerCase();
      const matchText = (
        (item.Nama_Lengkap || '').toLowerCase().includes(q) ||
        (item.Wali_Kelas || '').toLowerCase().includes(q) ||
        (item.ID_Pendaftaran || '').toLowerCase().includes(q) ||
        (item.Nomor_Urut || '').includes(q) ||
        (item.Cabang_Lomba || '').toLowerCase().includes(q) ||
        (item.Kelas_Kategori || '').toLowerCase().includes(q)
      );
      if (!matchText) return false;
    }

    if (filterTingkat !== 'ALL') {
      const t = (item.Tingkat || '').toLowerCase();
      if (!t.includes(filterTingkat.toLowerCase())) return false;
    }

    if (filterWaliKelas !== 'ALL') {
      if ((item.Wali_Kelas || '').trim() !== filterWaliKelas.trim()) return false;
    }

    if (statusTab !== 'ALL') {
      if (item.Status !== statusTab) return false;
    }

    if (filterGender !== 'ALL') {
      if (item.Jenis_Kelamin !== filterGender) return false;
    }

    if (filterLottery === 'ASSIGNED') {
      if (!item.Nomor_Urut || String(item.Nomor_Urut).trim() === '') return false;
    } else if (filterLottery === 'UNASSIGNED') {
      if (item.Nomor_Urut && String(item.Nomor_Urut).trim() !== '') return false;
    }

    return true;
  });

  // Reset halaman ke 1 jika filter atau pencarian berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [effectiveSearch, filterTingkat, filterWaliKelas, statusTab, filterGender, filterLottery, itemsPerPage]);

  // Hitung total halaman & slice data per halaman
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const startIndex = filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredData.length);

  const countAll = registrations.length;
  const countVerified = registrations.filter(r => r.Status === 'Terverifikasi').length;
  const countPending = registrations.filter(r => r.Status === 'Pending').length;
  const countRejected = registrations.filter(r => r.Status === 'Ditolak').length;

  const handleQuickStatus = async (idPendaftaran, newStatus) => {
    if (!idPendaftaran) return;
    const cleanId = String(idPendaftaran).trim();
    setStatusProcessingId(cleanId);
    try {
      await updateStatus(cleanId, newStatus);
      const isAccepted = newStatus === 'Terverifikasi';

      Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true
      }).fire({
        icon: isAccepted ? 'success' : 'info',
        title: isAccepted ? 'Santri Diterima (Terverifikasi)' : 'Status Dikembalikan ke Pending'
      });

      if (selectedSantri && selectedSantri.ID_Pendaftaran === cleanId) {
        setSelectedSantri(prev => prev ? { ...prev, Status: newStatus } : null);
      }

      if (onRefresh) onRefresh();
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memperbarui Status',
        text: e.message || 'Terjadi kendala saat memperbarui status santri.'
      });
    } finally {
      setStatusProcessingId(null);
    }
  };

  // Bulk Action Handlers
  const handleToggleSelectAllVisible = () => {
    const visibleIds = paginatedData.map(d => d.ID_Pendaftaran).filter(Boolean);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
    
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach(id => next.delete(id));
      } else {
        visibleIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkVerify = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    try {
      const ids = Array.from(selectedIds);
      await batchUpdateStatus(ids, 'Terverifikasi');
      setSelectedIds(new Set());
      Swal.fire({
        icon: 'success',
        title: 'Verifikasi Berhasil!',
        text: `${ids.length} santri berhasil diverifikasi serentak.`,
        timer: 2000,
        showConfirmButton: false
      });
      if (onRefresh) onRefresh();
    } catch (e) {
      Swal.fire('Gagal!', 'Terjadi kesalahan saat verifikasi: ' + e.message, 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkPending = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    try {
      const ids = Array.from(selectedIds);
      await batchUpdateStatus(ids, 'Pending');
      setSelectedIds(new Set());
      Swal.fire({
        icon: 'success',
        title: 'Status Diperbarui!',
        text: `${ids.length} santri dikembalikan ke status Pending.`,
        timer: 2000,
        showConfirmButton: false
      });
      if (onRefresh) onRefresh();
    } catch (e) {
      Swal.fire('Gagal!', 'Terjadi kesalahan: ' + e.message, 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirm = await Swal.fire({
      title: `Hapus ${selectedIds.size} Santri Terpilih?`,
      html: `Apakah Anda yakin ingin menghapus <strong>${selectedIds.size} santri</strong> terpilih?<br/><span class="text-xs text-rose-600">Data akan dihapus permanen dari sistem dan Google Sheets.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus Data',
      cancelButtonText: 'Batal'
    });

    if (confirm.isConfirmed) {
      setIsBulkProcessing(true);
      try {
        const ids = Array.from(selectedIds);
        let count = 0;
        for (const id of ids) {
          await deleteRegistration(id);
          count++;
        }
        setSelectedIds(new Set());
        Swal.fire({
          icon: 'success',
          title: 'Terhapus!',
          text: `${count} santri telah dihapus dari sistem.`,
          timer: 2000,
          showConfirmButton: false
        });
        if (onRefresh) onRefresh();
      } catch (e) {
        Swal.fire('Gagal!', 'Sebagian data gagal dihapus: ' + e.message, 'error');
      } finally {
        setIsBulkProcessing(false);
      }
    }
  };

  // ==========================================
  // 1. PENGUNDIAN NOMOR URUT DENGAN SWEETALERT2
  // ==========================================
  const handleOpenLotteryModal = async () => {
    const verifiedList = registrations.filter(r => r.Status === 'Terverifikasi');

    if (verifiedList.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Belum Ada Santri Terverifikasi',
        text: 'Hanya santri dengan status "Terverifikasi" yang dapat diundi nomor urutnya. Silakan verifikasi pendaftaran terlebih dahulu.',
        confirmButtonColor: '#065f46',
        confirmButtonText: 'Mengerti'
      });
      return;
    }

    const existingNums = registrations.map(r => Number(r.Nomor_Urut)).filter(n => !isNaN(n) && n > 0);
    const defaultStart = 1;

    const { value: formValues } = await Swal.fire({
      title: 'Undi Nomor Urut',
      html: `
        <div style="text-align: left; font-size: 13px; color: #475569; margin-top: 8px;">
          <p style="margin-bottom: 12px; color: #334155;">
            Pengundian acak untuk santri berstatus <strong>Terverifikasi</strong>.
          </p>
          <label style="display: block; font-weight: 600; margin-bottom: 4px; color: #1e293b;">
            Nomor Urut Dimulai Dari (3 Digit):
          </label>
          <input id="swal-start-num" type="text" value="001" placeholder="Contoh: 001 atau 050" style="width: 100%; box-sizing: border-box; padding: 9px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: bold; font-family: monospace; font-size: 15px; margin-bottom: 4px;" />
          <p style="font-size: 11px; color: #047857; margin-bottom: 14px;">Format 3 digit resmi (misal: 001, 002, dst). Bebas duplikat di seluruh cabang lomba (Lomba beregu: 1 nomor urut per regu).</p>
          
          <label style="display: block; font-weight: 600; margin-bottom: 4px; color: #1e293b;">
            Pilih Cabang Perlombaan:
          </label>
          <select id="swal-category" style="width: 100%; box-sizing: border-box; padding: 9px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; background-color: #fff;">
            <option value="ALL">Semua Cabang Perlombaan (Global)</option>
            ${CABANG_LOMBA_LIST.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Mulai Undi',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#065f46',
      cancelButtonColor: '#94a3b8',
      preConfirm: () => {
        const start = document.getElementById('swal-start-num').value.trim();
        const cat = document.getElementById('swal-category').value;
        const numVal = parseInt(start, 10);
        if (isNaN(numVal) || numVal < 1) {
          Swal.showValidationMessage('Nomor awal harus berupa angka valid minimal 1 (contoh: 001)!');
          return false;
        }
        return { startNumber: numVal, category: cat };
      }
    });

    if (formValues) {
      try {
        Swal.fire({
          title: 'Sedang Mengundi...',
          text: 'Mengacak nomor urut pemanggilan santri...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const result = await generateRandomQueueNumbers(formValues.category, formValues.startNumber);
        if (onRefresh) onRefresh();

        Swal.hideLoading();
        Swal.close();

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}

        Swal.fire({
          icon: 'success',
          title: 'Pengundian Selesai!',
          text: `Berhasil mengundi nomor urut untuk ${result.countAssigned} santri terverifikasi (dimulai dari nomor ${String(formValues.startNumber).padStart(3, '0')}).`,
          confirmButtonColor: '#065f46',
          confirmButtonText: 'Alhamdulillah',
          showConfirmButton: true,
          didOpen: () => {
            Swal.hideLoading();
          }
        });
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Gagal Mengundi',
          text: err.message,
          confirmButtonColor: '#dc2626'
        });
      }
    }
  };

  // ==========================================
  // 2. UNDUH REKAP PDF RESMI DENGAN KOP & TTD
  // ==========================================
  const generateAndDownloadPdf = async (selectedTingkat = 'ALL', selectedCabang = 'ALL') => {
    try {
      // Filter Data Berdasarkan Tingkat & Cabang yang Dipilih
      let targetSantri = [...registrations];
      if (selectedTingkat && selectedTingkat !== 'ALL') {
        const tLower = selectedTingkat.toLowerCase();
        targetSantri = targetSantri.filter(item => 
          (item.Tingkat || '').toLowerCase().includes(tLower) || 
          tLower.includes((item.Tingkat || '').toLowerCase())
        );
      }

      if (selectedCabang && selectedCabang !== 'ALL') {
        const cLower = selectedCabang.toLowerCase();
        targetSantri = targetSantri.filter(item =>
          (item.Cabang_Lomba || '').toLowerCase().includes(cLower) ||
          cLower.includes((item.Cabang_Lomba || '').toLowerCase())
        );
      }

      if (targetSantri.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Tidak Ada Data',
          text: `Belum ada santri terdaftar pada filter yang dipilih (${selectedTingkat !== 'ALL' ? selectedTingkat : 'Semua Tingkat'}${selectedCabang !== 'ALL' ? ` - ${selectedCabang}` : ''}).`,
          confirmButtonColor: '#065f46'
        });
        return;
      }

      // Kelompokkan data peserta: Per Cabang dan Per Tingkat
      // Di dalam setiap kelompok: urutkan secara acak berselang-seling dimulai dari PUTRI lalu PUTRA
      const groupMap = new Map();
      targetSantri.forEach(item => {
        const key = `${item.Cabang_Lomba || 'Semua Cabang'}___${item.Tingkat || 'Semua Tingkat'}`;
        if (!groupMap.has(key)) {
          groupMap.set(key, []);
        }
        groupMap.get(key).push({ ...item });
      });

      // Kumpulkan nomor urut yang sudah terpakai agar tidak ada nomor ganda sama sekali
      const existingUsedNumbers = new Set(
        registrations
          .map(it => it.Nomor_Urut && String(it.Nomor_Urut).trim())
          .filter(Boolean)
      );

      let finalOrderedSantri = [];
      let runningStartNumber = 50;

      groupMap.forEach((itemsInGroup) => {
        // Pisahkan Putri dan Putra
        const putriList = [];
        const putraList = [];

        itemsInGroup.forEach(it => {
          if (isSantriPutri(it)) {
            putriList.push(it);
          } else {
            putraList.push(it);
          }
        });

        // Acak urutan masing-masing grup secara independen dengan algoritma Fisher-Yates
        for (let i = putriList.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [putriList[i], putriList[j]] = [putriList[j], putriList[i]];
        }
        for (let i = putraList.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [putraList[i], putraList[j]] = [putraList[j], putraList[i]];
        }

        // Gabungkan berselang-seling: Dimulai dari PUTRI, lalu PUTRA, lalu PUTRI, dst.
        const interleaved = [];
        const maxLen = Math.max(putriList.length, putraList.length);
        for (let i = 0; i < maxLen; i++) {
          if (i < putriList.length) interleaved.push(putriList[i]);
          if (i < putraList.length) interleaved.push(putraList[i]);
        }

        // Hitung berapa peserta yang belum punya nomor urut
        const unassignedCount = interleaved.filter(it => !it.Nomor_Urut || String(it.Nomor_Urut).trim() === '').length;

        // Siapkan pool nomor urut acak yang belum terpakai oleh peserta manapun
        const poolNumbers = [];
        while (poolNumbers.length < unassignedCount) {
          const formatted = String(runningStartNumber).padStart(3, '0');
          if (!existingUsedNumbers.has(formatted)) {
            poolNumbers.push(formatted);
          }
          runningStartNumber++;
        }

        // Acak pool nomor urut dengan Fisher-Yates agar nomor undian tidak berurutan
        for (let i = poolNumbers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [poolNumbers[i], poolNumbers[j]] = [poolNumbers[j], poolNumbers[i]];
        }

        // Tetapkan nomor urut acak untuk tabel PDF jika belum memiliki nomor urut resmi
        let poolIdx = 0;
        interleaved.forEach((it) => {
          if (!it.Nomor_Urut || String(it.Nomor_Urut).trim() === '') {
            it.Nomor_Urut = poolNumbers[poolIdx++];
            existingUsedNumbers.add(it.Nomor_Urut);
          }
        });

        finalOrderedSantri.push(...interleaved);
      });

      targetSantri = finalOrderedSantri;

      // SweetAlert2 Loading
      Swal.fire({
        title: 'Menyiapkan PDF...',
        text: 'Menyusun KOP resmi, data peserta, dan ruang tanda tangan...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const leftMargin = 14.5;
      const rightMargin = 14.5;
      const pageWidth = 210;
      const rightEdge = pageWidth - rightMargin; // 195.5 mm

      // 1. Logo Resmi Pesantren Al-Falah Putak (Ukuran & Posisi pas di samping KOP)
      const logoBase64 = await getBase64Image('/logo.png');
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'PNG', 15.0, 10.5, 26, 23.8);
        } catch (e) {
          console.warn('Gagal render logo di PDF:', e);
        }
      }

      // 2. KOP Surat Resmi (Digeser ke kiri dari 120.9 ke 115 mm agar pas di tengah halaman)
      const kopCenterX = 115;

      // Line 1: Yayasan (Bold, 11.5 pt)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(0, 0, 0);
      doc.text('YAYASAN PONDOK PESANTREN SALAFIYAH AL-FALAH PUTAK', kopCenterX, 15.5, { align: 'center' });

      // Line 2: Panitia Musabaqoh (Bold, 14 pt)
      doc.setFontSize(14);
      doc.text('PANITIA MUSABAQOH AKHIRUSSANAH', kopCenterX, 22, { align: 'center' });

      // Line 3: Alamat (Normal, 10 pt)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Dusun II Ds. Putak Kec. Gelumbang Kab. Muara Enim Sumatera Selatan Kode Pos 31171', kopCenterX, 27.5, { align: 'center' });

      // Line 4: Kontak (Normal, 9.5 pt)
      doc.setFontSize(9.5);
      doc.text('Telp. : 082118702717 | E-mail : ponpesalfalahputak@gmail.com', kopCenterX, 32.5, { align: 'center' });

      // 3. Garis Ganda Pembatas KOP (Tebal atas ~0.8mm, tipis bawah ~0.25mm)
      doc.setLineWidth(0.8);
      doc.setDrawColor(0, 0, 0);
      doc.line(leftMargin, 36.8, rightEdge, 36.8);

      doc.setLineWidth(0.25);
      doc.line(leftMargin, 38.0, rightEdge, 38.0);

      // 4. Judul Dokumen & Keterangan Tingkat & Cabang (Center x = 105 mm)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('DAFTAR PESERTA MUSABAQOH AKHIRUSSANAH 1447 H / 2026 M', 105, 45.5, { align: 'center' });

      // Format nama tingkat: tanpa pengulangan kata 'Tingkat' (satu penulisan saja)
      const namaTingkatLabel = (!selectedTingkat || selectedTingkat === 'ALL')
        ? 'SEMUA' 
        : selectedTingkat.replace(/tingkat\s*/gi, '').trim().toUpperCase();

      // Format nama cabang: jika ALL tampilkan SEMUA CABANG atau nama cabang lomba
      const namaCabangLabel = (!selectedCabang || selectedCabang === 'ALL')
        ? 'SEMUA CABANG'
        : selectedCabang.toUpperCase();

      const subtitleText = `TINGKAT : ${namaTingkatLabel} | CABANG : ${namaCabangLabel}`;
      doc.setFontSize(10);
      if (doc.getTextWidth(subtitleText) > 170) {
        doc.setFontSize(8.5);
      }
      doc.text(subtitleText, 105, 51.5, { align: 'center' });

      // 5. Tabel Peserta (Garis tabel sedikit diperjelas / lebih tegas)
      const tableRows = targetSantri.map((item, idx) => [
        String(idx + 1),
        item.Nomor_Urut ? String(item.Nomor_Urut) : '-',
        item.Kelas_Kategori || item.Tingkat || '-',
        item.Nama_Lengkap || '-'
      ]);

      autoTable(doc, {
        startY: 56.5,
        margin: { left: leftMargin, right: rightMargin },
        head: [['NO.', 'NO URUT', 'KELAS', 'NAMA SANTRI']],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [11, 93, 69], // #0B5D45
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          fontSize: 10,
          minCellHeight: 8,
          cellPadding: 2.2,
          lineColor: [51, 65, 85], // Garis tabel diperjelas
          lineWidth: 0.35
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 16, fontStyle: 'normal' },
          1: { halign: 'center', cellWidth: 34, fontStyle: 'bold' },
          2: { halign: 'center', cellWidth: 48, fontStyle: 'normal' },
          3: { halign: 'center', cellWidth: 83, fontStyle: 'bold' }
        },
        bodyStyles: {
          fontSize: 10,
          textColor: [0, 0, 0],
          valign: 'middle',
          minCellHeight: 7.5,
          cellPadding: 2.2,
          lineColor: [71, 85, 105], // Garis tabel diperjelas
          lineWidth: 0.35
        },
        alternateRowStyles: {
          fillColor: [232, 240, 246] // #E8F0F6
        }
      });

      // 6. Ruang Tanda Tangan (TTD): Ketua Panitia Musabaqoh (Ust. Danil Ali Sabila)
      let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 110;
      if (finalY > 230) {
        doc.addPage();
        finalY = 25;
      }

      const sigCenter = 158;
      const ttdY = finalY + 12;
      const todayStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(`Putak, ${todayStr}`, sigCenter, ttdY, { align: 'center' });
      doc.text('Ketua Panitia Musabaqoh,', sigCenter, ttdY + 5.5, { align: 'center' });

      // Ruang tanda tangan / stempel panitia (~24 mm)
      const nameY = ttdY + 29.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Ust. Danil Ali Sabila', sigCenter, nameY, { align: 'center' });

      // Garis bawah nama penandatangan
      const nameWidth = doc.getTextWidth('Ust. Danil Ali Sabila');
      doc.setLineWidth(0.3);
      doc.setDrawColor(0, 0, 0);
      doc.line(sigCenter - (nameWidth / 2), nameY + 1, sigCenter + (nameWidth / 2), nameY + 1);

      // Simpan File PDF
      const cleanTingkat = (selectedTingkat || 'Semua').replace(/[^a-zA-Z0-9]/g, '_');
      const cleanCabang = (selectedCabang || 'Semua').replace(/[^a-zA-Z0-9]/g, '_');
      const cleanFileName = `Daftar_Peserta_${cleanTingkat}_${cleanCabang}_Musabaqoh_1447H.pdf`;
      doc.save(cleanFileName);

      Swal.hideLoading();
      Swal.close();

      const filterSummary = `${selectedTingkat === 'ALL' ? 'Semua Tingkat' : selectedTingkat}${selectedCabang !== 'ALL' ? ` (${selectedCabang})` : ''}`;
      Swal.fire({
        icon: 'success',
        title: 'Berhasil Diunduh!',
        text: `Dokumen PDF untuk ${filterSummary} berhasil diunduh.`,
        confirmButtonColor: '#065f46',
        confirmButtonText: 'Selesai',
        showConfirmButton: true,
        didOpen: () => {
          Swal.hideLoading();
        }
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Membuat PDF',
        text: err.message,
        confirmButtonColor: '#dc2626'
      });
    }
  };

  // Buka Modal Unduh PDF Modern
  const handleOpenDownloadPdfModal = () => {
    if (filterTingkat !== 'ALL') {
      const match = filterTingkat.toLowerCase().includes('ula') ? 'Tingkat Ula' :
        filterTingkat.toLowerCase().includes('wustho') ? 'Tingkat Wustho' :
        filterTingkat.toLowerCase().includes('ulya') ? 'Tingkat Ulya' :
        filterTingkat.toLowerCase().includes('mhq') ? 'Tingkat Hifdzil Qur\'an (MHQ)' : 'ALL';
      setDownloadTingkat(match);
    } else {
      setDownloadTingkat('ALL');
    }
    setDownloadCabang('ALL');
    setIsDownloadModalOpen(true);
  };

  // Kumpulan opsi cabang unik untuk modal unduh PDF
  const uniqueCabangOptions = useMemo(() => {
    return Array.from(
      new Set([
        ...CABANG_LOMBA_LIST.map(c => c.name),
        ...registrations.map(r => r.Cabang_Lomba).filter(Boolean)
      ])
    ).sort((a, b) => a.localeCompare(b, 'id'));
  }, [registrations]);

  // Preview hitung jumlah santri yang match secara real-time
  const downloadPreviewStats = useMemo(() => {
    let filtered = [...registrations];
    if (downloadTingkat !== 'ALL') {
      const tLower = downloadTingkat.toLowerCase();
      filtered = filtered.filter(item =>
        (item.Tingkat || '').toLowerCase().includes(tLower) ||
        tLower.includes((item.Tingkat || '').toLowerCase())
      );
    }
    if (downloadCabang !== 'ALL') {
      const cLower = downloadCabang.toLowerCase();
      filtered = filtered.filter(item =>
        (item.Cabang_Lomba || '').toLowerCase().includes(cLower) ||
        cLower.includes((item.Cabang_Lomba || '').toLowerCase())
      );
    }
    const putriCount = filtered.filter(isSantriPutri).length;
    const putraCount = filtered.length - putriCount;
    return {
      total: filtered.length,
      putri: putriCount,
      putra: putraCount
    };
  }, [registrations, downloadTingkat, downloadCabang]);

  const downloadPreviewCount = downloadPreviewStats.total;

  // Eksekusi Unduh PDF dari Modal Modern
  const handleExecuteDownload = async () => {
    setIsDownloading(true);
    try {
      await generateAndDownloadPdf(downloadTingkat, downloadCabang);
      setIsDownloadModalOpen(false);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendWA = (item) => {
    const phone = (item.Nomor_WA || '').replace(/^0/, '62').replace(/\D/g, '');
    const pesan = encodeURIComponent(
      `Assalamu'alaikum Wr. Wb. Yth. Ust/Usth ${item.Wali_Kelas} / Ananda ${item.Nama_Lengkap}.\n\n` +
      `Konfirmasi Pendaftaran Musabaqah Akhirussanah YPPS Al-Falah Putak:\n` +
      `• ID Pendaftaran: ${item.ID_Pendaftaran}\n` +
      `• Cabang Lomba: ${item.Cabang_Lomba}\n` +
      `• Jenjang & Kelas: ${item.Tingkat} - ${item.Kelas_Kategori}\n` +
      `• Status: ${item.Status}\n` +
      (item.Nomor_Urut ? `• NOMOR URUT PEMANGGILAN: ${item.Nomor_Urut}\n\n` : `\n`) +
      `Harap hadir tepat waktu sesuai jadwal musabaqah. Syukron Katsiron.`
    );
    window.open(`https://wa.me/${phone}?text=${pesan}`, '_blank');
  };

  const tabPills = [
    { id: 'ALL', label: 'Semua Peserta', count: countAll },
    { id: 'Terverifikasi', label: 'Terverifikasi', count: countVerified },
    { id: 'Pending', label: 'Pending', count: countPending },
    { id: 'Ditolak', label: 'Ditolak', count: countRejected }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        {/* Subtle accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800" />

        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shadow-sm shrink-0">
            <Users className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Data Peserta Santri</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                {countAll} Santri
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola pendaftaran santri, verifikasi berkas, dan pengundian nomor urut (format 3 digit, bebas duplikat seluruh cabang lomba).
            </p>
          </div>
        </div>

        {/* Toolbar Aksi (Undi & Unduh PDF) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleOpenLotteryModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-xs flex items-center space-x-2 transition-colors cursor-pointer active:scale-95"
            title="Undi nomor urut santri"
          >
            <Dices className="w-4 h-4 text-emerald-300" />
            <span>Undi Nomor Urut</span>
          </button>

          <button
            onClick={handleOpenDownloadPdfModal}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 font-semibold text-xs flex items-center space-x-2 transition-colors shadow-2xs cursor-pointer active:scale-95"
            title="Pilih tingkat lalu unduh PDF"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* 2. KARTU METRIK KPI STATISTIK */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* KPI 1: Total Santri */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center space-x-3.5 hover:border-emerald-200 transition-all">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block leading-tight">Total Pendaftar</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{countAll}</span>
            <span className="text-[10.5px] text-slate-400 block mt-0.5">Semua delegasi masuk</span>
          </div>
        </div>

        {/* KPI 2: Terverifikasi */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center space-x-3.5 hover:border-emerald-200 transition-all">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block leading-tight">Lolos Verifikasi</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-800 leading-none">{countVerified}</span>
            <span className="text-[10.5px] text-emerald-600 font-medium block mt-0.5">Siap diundi / tanding</span>
          </div>
        </div>

        {/* KPI 3: Menunggu Verifikasi */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center space-x-3.5 hover:border-amber-200 transition-all">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block leading-tight">Menunggu Verifikasi</span>
            <span className="text-xl sm:text-2xl font-black text-amber-700 leading-none">{countPending}</span>
            <span className="text-[10.5px] text-amber-600 font-medium block mt-0.5">Perlu dicek panitia</span>
          </div>
        </div>

        {/* KPI 4: Ditolak */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex items-center space-x-3.5 hover:border-rose-200 transition-all">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 block leading-tight">Ditolak / Batal</span>
            <span className="text-xl sm:text-2xl font-black text-rose-700 leading-none">{countRejected}</span>
            <span className="text-[10.5px] text-rose-500 font-medium block mt-0.5">Tidak memenuhi syarat</span>
          </div>
        </div>
      </div>

      {/* 3. TAB NAVIGATION PILLS */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        {tabPills.map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusTab(tab.id)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
              statusTab === tab.id
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-extrabold ${
              statusTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 4. MAIN TABLE CONTAINER */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">

        {/* Filter Bar (Search + Tingkat + Wali Kelas + Gender + Reset) */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Input Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari santri, no. urut, cabang..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-emerald-700 focus:bg-white bg-slate-50/60 transition-all placeholder:text-slate-400"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Group Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Filter 1: Tingkat */}
            <div className="relative">
              <select
                value={filterTingkat}
                onChange={(e) => handleTingkatChange(e.target.value)}
                className={`pl-3 pr-8 py-2 rounded-xl border text-xs font-medium outline-none bg-white transition-all cursor-pointer ${
                  filterTingkat !== 'ALL' 
                    ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40 font-semibold' 
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <option value="ALL">Semua Tingkat</option>
                <option value="Ula">Tingkat Ula</option>
                <option value="Wustho">Tingkat Wustho</option>
                <option value="MHQ">Tingkat MHQ</option>
              </select>
            </div>

            {/* Filter 2: Wali Kelas (Permintaan Khusus) */}
            <div className="relative">
              <select
                value={filterWaliKelas}
                onChange={(e) => setFilterWaliKelas(e.target.value)}
                className={`pl-3 pr-8 py-2 rounded-xl border text-xs font-medium outline-none bg-white transition-all cursor-pointer max-w-[210px] truncate ${
                  filterWaliKelas !== 'ALL' 
                    ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40 font-semibold' 
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
                title="Filter berdasarkan Wali Kelas"
              >
                <option value="ALL">Semua Wali Kelas ({filteredWaliOptions.length})</option>
                {filteredWaliOptions.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Gender */}
            <div className="relative">
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className={`pl-3 pr-8 py-2 rounded-xl border text-xs font-medium outline-none bg-white transition-all cursor-pointer ${
                  filterGender !== 'ALL' 
                    ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40 font-semibold' 
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <option value="ALL">Semua Gender</option>
                <option value="L">Putra</option>
                <option value="P">Putri</option>
              </select>
            </div>

            {/* Filter 4: Status Nomor Undian (3 Digit) */}
            <div className="relative">
              <select
                value={filterLottery}
                onChange={(e) => setFilterLottery(e.target.value)}
                className={`pl-3 pr-8 py-2 rounded-xl border text-xs font-medium outline-none bg-white transition-all cursor-pointer ${
                  filterLottery !== 'ALL' 
                    ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40 font-semibold' 
                    : 'border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <option value="ALL">Semua Undian</option>
                <option value="ASSIGNED">Sudah Diundi (3 Digit)</option>
                <option value="UNASSIGNED">Belum Diundi</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="Reset semua filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

          </div>
        </div>

        {/* Responsive Table yang Halus */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200/60">
              <tr>
                <th className="py-3.5 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && paginatedData.every(d => selectedIds.has(d.ID_Pendaftaran))}
                    onChange={handleToggleSelectAllVisible}
                    className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-700 w-4 h-4 cursor-pointer"
                    title="Pilih Semua di Halaman Ini"
                  />
                </th>
                <th className="py-3.5 px-4 text-center w-28">No. Urut</th>
                <th className="py-3.5 px-4">Nama Santri</th>
                <th className="py-3.5 px-4">Cabang Perlombaan</th>
                <th className="py-3.5 px-4">Jenjang & Kelas</th>
                <th className="py-3.5 px-4">Wali Kelas</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">
                        Tidak ditemukan data santri yang cocok
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Coba sesuaikan filter Tingkat, Wali Kelas, atau kata kunci pencarian.
                      </p>
                      {isFilterActive && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-medium border border-emerald-200 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          <span>Reset Semua Filter</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={item.ID_Pendaftaran || idx} className={`transition-colors ${selectedIds.has(item.ID_Pendaftaran) ? 'bg-emerald-50/50' : 'hover:bg-slate-50/60'}`}>
                    
                    {/* Checkbox Pilihan Baris */}
                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.ID_Pendaftaran)}
                        onChange={() => handleToggleSelectOne(item.ID_Pendaftaran)}
                        className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-700 w-4 h-4 cursor-pointer"
                      />
                    </td>

                    {/* Nomor Urut (Format 3 Digit Monospace) */}
                    <td className="py-3.5 px-4 text-center">
                      {item.Nomor_Urut && String(item.Nomor_Urut).trim() !== '' ? (
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-mono font-bold text-xs border border-emerald-200">
                          {String(item.Nomor_Urut).padStart(3, '0')}
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">
                          Belum Diundi
                        </span>
                      )}
                    </td>

                    {/* Nama Santri */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 leading-tight">
                        {item.Nama_Lengkap}
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                          item.Jenis_Kelamin === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {item.Jenis_Kelamin === 'L' ? 'Putra' : 'Putri'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.ID_Pendaftaran}
                        </span>
                      </div>
                    </td>

                    {/* Cabang Lomba */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-emerald-800 leading-tight">
                        {item.Cabang_Lomba}
                      </div>
                    </td>

                    {/* Jenjang & Kelas */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 font-medium text-slate-800">
                        <span>{item.Kelas_Kategori}</span>
                        {item.Jenis_Kelamin === 'P' || (item.Kelas_Kategori && item.Kelas_Kategori.toLowerCase().includes('putri')) ? (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">Putri</span>
                        ) : (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">Putra</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.Tingkat}</div>
                    </td>

                    {/* Wali Kelas */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 font-medium">{item.Wali_Kelas}</div>
                      <button
                        onClick={() => handleSendWA(item)}
                        className="text-[10px] text-emerald-700 hover:underline flex items-center space-x-1 mt-0.5"
                      >
                        <MessageSquare className="w-2.5 h-2.5" />
                        <span>Chat WA</span>
                      </button>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.Status === 'Terverifikasi'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                          : item.Status === 'Ditolak'
                          ? 'bg-rose-50 text-rose-800 border border-rose-100'
                          : 'bg-amber-50 text-amber-800 border border-amber-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          item.Status === 'Terverifikasi' ? 'bg-emerald-600' : item.Status === 'Ditolak' ? 'bg-rose-600' : 'bg-amber-500'
                        }`}></span>
                        {item.Status}
                      </span>
                    </td>

                    {/* Aksi Panitia */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        
                        {item.Status !== 'Terverifikasi' ? (
                          <button
                            type="button"
                            disabled={statusProcessingId === item.ID_Pendaftaran}
                            onClick={() => handleQuickStatus(item.ID_Pendaftaran, 'Terverifikasi')}
                            title="Verifikasi / Terima Santri"
                            className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-semibold text-[10px] transition-all cursor-pointer shadow-2xs flex items-center space-x-1 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {statusProcessingId === item.ID_Pendaftaran ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin text-emerald-200" />
                                <span>Memproses...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                                <span>Terima</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={statusProcessingId === item.ID_Pendaftaran}
                            onClick={() => handleQuickStatus(item.ID_Pendaftaran, 'Pending')}
                            title="Kembalikan ke status Pending"
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-medium text-[10px] border border-slate-200 transition-all cursor-pointer flex items-center space-x-1 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {statusProcessingId === item.ID_Pendaftaran ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
                                <span>Memproses...</span>
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-3 h-3 text-slate-500" />
                                <span>Reset</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Tombol Detail */}
                        <button
                          onClick={() => setSelectedSantri(item)}
                          title="Lihat Detail Santri"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Tombol Edit Santri (Pembaruan Riil) */}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Lengkap Data Santri"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Tombol Hapus Santri */}
                        <button
                          onClick={() => handleDeleteSantri(item)}
                          title="Hapus Data Santri"
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium text-center sm:text-left flex flex-wrap items-center gap-2">
            <span>
              Menampilkan <strong className="text-slate-800">{startIndex} - {endIndex}</strong> dari total <strong className="text-slate-800">{filteredData.length}</strong> santri
            </span>
            <div className="flex items-center space-x-1.5 ml-1">
              <span className="text-[11px] text-slate-400 font-medium">Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-2 py-0.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white outline-none cursor-pointer hover:border-slate-300"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={Math.max(1000, filteredData.length)}>Semua ({filteredData.length})</option>
              </select>
              <span className="text-[11px] text-slate-400 font-medium">/ halaman</span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Tombol Sebelumnya */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1 shadow-2xs cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            {/* Nomor Halaman */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                if (
                  totalPages > 6 &&
                  page !== 1 &&
                  page !== totalPages &&
                  Math.abs(page - currentPage) > 1
                ) {
                  if (page === 2 || page === totalPages - 1) {
                    return <span key={page} className="px-1 text-slate-400 font-bold">...</span>;
                  }
                  return null;
                }

                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-xl font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${
                      isActive
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Tombol Berikutnya */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || filteredData.length === 0}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center space-x-1 shadow-2xs cursor-pointer"
              title="Halaman Berikutnya"
            >
              <span>Berikutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>



      {/* MODAL DETAIL SANTRI */}
      {selectedSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800" />

            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shrink-0 shadow-2xs">
                  <Users className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Detail Data Santri
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Informasi lengkap data delegasi santri
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSantri(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-medium">ID Pendaftaran</span>
                  <span className="font-mono font-semibold text-slate-800 text-sm">{selectedSantri.ID_Pendaftaran}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 block font-medium">Nomor Urut</span>
                  <span className="font-mono font-bold text-emerald-900 text-sm">
                    {selectedSantri.Nomor_Urut || 'Belum Diundi'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-medium">Nama Lengkap</span>
                <span className="text-sm font-semibold text-slate-900 block">{selectedSantri.Nama_Lengkap}</span>
                <span className="text-slate-500 block text-[11px]">
                  Jenis Kelamin: {selectedSantri.Jenis_Kelamin === 'L' ? 'Putra' : 'Putri'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-medium">Cabang Lomba</span>
                  <span className="font-semibold text-slate-800">{selectedSantri.Cabang_Lomba}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-medium">Tingkat & Kelas</span>
                  <span className="font-semibold text-slate-800">{selectedSantri.Kelas_Kategori}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-medium">Wali Kelas</span>
                <span className="font-semibold text-slate-800">{selectedSantri.Wali_Kelas}</span>
                <div className="font-mono text-slate-500 text-[11px] mt-0.5">WA: {selectedSantri.Nomor_WA}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-medium">Catatan Khusus</span>
                <p className="text-slate-600 italic mt-0.5">
                  {selectedSantri.Catatan || 'Tidak ada catatan tambahan.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                {selectedSantri.Status !== 'Terverifikasi' ? (
                  <button
                    type="button"
                    disabled={statusProcessingId === selectedSantri.ID_Pendaftaran}
                    onClick={() => handleQuickStatus(selectedSantri.ID_Pendaftaran, 'Terverifikasi')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white font-semibold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {statusProcessingId === selectedSantri.ID_Pendaftaran ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-200" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                    )}
                    <span>{statusProcessingId === selectedSantri.ID_Pendaftaran ? 'Memproses...' : 'Terima Santri'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={statusProcessingId === selectedSantri.ID_Pendaftaran}
                    onClick={() => handleQuickStatus(selectedSantri.ID_Pendaftaran, 'Pending')}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 border border-slate-200 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {statusProcessingId === selectedSantri.ID_Pendaftaran ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>{statusProcessingId === selectedSantri.ID_Pendaftaran ? 'Memproses...' : 'Kembalikan Pending'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const target = selectedSantri;
                    setSelectedSantri(null);
                    handleOpenEdit(target);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Data</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSantri(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT DATA SANTRI LENGKAP */}
      {editingSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 relative max-h-[90vh] overflow-y-auto">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800" />

            {/* Header Modal */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shrink-0 shadow-2xs">
                  <Edit3 className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Edit Data Santri</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                      {editingSantri.ID_Pendaftaran}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Perbarui identitas, kelas, cabang lomba, wali kelas, atau status verifikasi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSantri(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              
              {/* Row 1: Nama Lengkap & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-700">Nama Lengkap Santri <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={editForm.Nama_Lengkap}
                    onChange={(e) => setEditForm(prev => ({ ...prev, Nama_Lengkap: e.target.value.toUpperCase() }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold uppercase text-slate-800 focus:border-emerald-700 outline-none bg-slate-50/50 focus:bg-white transition-all placeholder:normal-case"
                    placeholder="NAMA LENGKAP SANTRI..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jenis Kelamin</label>
                  <select
                    value={editForm.Jenis_Kelamin}
                    onChange={(e) => setEditForm(prev => ({ ...prev, Jenis_Kelamin: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:border-emerald-700 outline-none bg-white cursor-pointer"
                  >
                    <option value="L">Putra</option>
                    <option value="P">Putri</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Tingkat & Kelas Diniyah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jenjang Tingkat</label>
                  <select
                    value={editForm.Tingkat}
                    onChange={(e) => {
                      const newT = e.target.value;
                      const avail = subKelasData[newT.toLowerCase()] || [];
                      setEditForm(prev => ({ 
                        ...prev, 
                        Tingkat: newT, 
                        Kelas_Kategori: avail[0] || prev.Kelas_Kategori 
                      }));
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:border-emerald-700 outline-none bg-white cursor-pointer"
                  >
                    <option value="Ula">Tingkat Ula</option>
                    <option value="Wustho">Tingkat Wustho</option>
                    <option value="Ulya">Tingkat Ulya</option>
                    <option value="MHQ">Tingkat MHQ (Hifdzil Qur'an)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kelas Diniyah</label>
                  <input
                    type="text"
                    value={editForm.Kelas_Kategori}
                    onChange={(e) => setEditForm(prev => ({ ...prev, Kelas_Kategori: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:border-emerald-700 outline-none bg-slate-50/50 focus:bg-white transition-all"
                    placeholder="Contoh: Sifir A / Imrithi B..."
                  />
                </div>
              </div>

              {/* Row 3: Cabang Lomba & Wali Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Cabang Lomba</label>
                  <select
                    value={editForm.Cabang_Lomba}
                    onChange={(e) => setEditForm(prev => ({ ...prev, Cabang_Lomba: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:border-emerald-700 outline-none bg-white cursor-pointer"
                  >
                    {CABANG_LOMBA_LIST.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Wali Kelas</label>
                  <select
                    value={editForm.Wali_Kelas}
                    onChange={(e) => setEditForm(prev => ({ ...prev, Wali_Kelas: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:border-emerald-700 outline-none bg-white cursor-pointer"
                  >
                    <option value="">-- Pilih Wali Kelas --</option>
                    {allWaliKelas.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Nomor WA & Nomor Urut */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nomor WhatsApp Aktif</label>
                  <input
                    type="tel"
                    value={editForm.Nomor_WA}
                    onChange={(e) => setEditForm(prev => ({ ...prev, Nomor_WA: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-slate-800 focus:border-emerald-700 outline-none bg-slate-50/50 focus:bg-white transition-all"
                    placeholder="081234567890"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nomor Urut Undian (3 Digit)</label>
                  <input
                    type="text"
                    value={editForm.Nomor_Urut}
                    onChange={(e) => setEditForm(prev => ({ ...prev, Nomor_Urut: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-emerald-900 focus:border-emerald-700 outline-none bg-slate-50/50 focus:bg-white transition-all"
                    placeholder="Contoh: 001"
                  />
                </div>
              </div>

              {/* Row 5: Status Verifikasi & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Status Verifikasi</label>
                  <select
                    value={editForm.Status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, Status: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold outline-none bg-white cursor-pointer text-slate-800"
                  >
                    <option value="Pending">Pending (Menunggu)</option>
                    <option value="Terverifikasi">Terverifikasi (Diterima)</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-slate-700">Catatan Khusus Panitia</label>
                  <input
                    type="text"
                    value={editForm.Catatan}
                    onChange={(e) => setEditForm(prev => ({ ...prev, Catatan: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:border-emerald-700 outline-none bg-slate-50/50 focus:bg-white transition-all"
                    placeholder="Catatan pendaftaran, dispensasi, dsb..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setEditingSantri(null)}
                  disabled={isSavingEdit}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-sm transition-colors flex items-center space-x-2 cursor-pointer disabled:opacity-60"
                >
                  <Save className={`w-4 h-4 text-emerald-200 ${isSavingEdit ? 'animate-spin' : ''}`} />
                  <span>{isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL UNDUH REKAP PDF MODERN & INTERAKTIF */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-800" />

            {/* Header Modal */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shrink-0 shadow-2xs">
                  <FileText className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Unduh Rekap PDF Peserta
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Filter dokumen resmi daftar peserta musabaqoh
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              
              {/* Field 1: Tingkat */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tingkat Perlombaan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-700">
                    <Layers className="w-4 h-4" />
                  </div>
                  <select
                    value={downloadTingkat}
                    onChange={(e) => setDownloadTingkat(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="ALL">Semua Tingkat</option>
                    <option value="Tingkat Ula">Tingkat Ula (Dasar / TPA)</option>
                    <option value="Tingkat Wustho">Tingkat Wustho (Sifir & Jurumiyah)</option>
                    <option value="Tingkat Ulya">Tingkat Ulya (Imrithi & Alfiyah)</option>
                    <option value="Tingkat Hifdzil Qur'an (MHQ)">Tingkat Hifdzil Qur'an (MHQ)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Field 2: Cabang */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Cabang Perlombaan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-700">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <select
                    value={downloadCabang}
                    onChange={(e) => setDownloadCabang(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="ALL">Semua Cabang Lomba</option>
                    {uniqueCabangOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Live Preview Summary Card */}
              <div className={`p-3.5 rounded-2xl border transition-all ${
                downloadPreviewCount > 0 
                  ? 'bg-emerald-50/70 border-emerald-100 text-emerald-950' 
                  : 'bg-amber-50/70 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      downloadPreviewCount > 0 ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
                    }`} />
                    <span className="font-medium text-xs">
                      {downloadPreviewCount > 0 ? 'Jumlah santri terdata:' : 'Belum ada santri:'}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    downloadPreviewCount > 0 ? 'bg-emerald-800 text-white shadow-2xs' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {downloadPreviewCount} Peserta
                  </span>
                </div>
                {downloadPreviewCount > 0 && (
                  <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-900">
                    <span className="font-medium">Komposisi:</span>
                    <span className="font-semibold">
                      {downloadPreviewStats.putri} Putri • {downloadPreviewStats.putra} Putra
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end space-x-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDownloadModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={downloadPreviewCount === 0 || isDownloading}
                onClick={handleExecuteDownload}
                className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs shadow-sm flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-300" />
                <span>{isDownloading ? 'Menyusun PDF...' : 'Unduh PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. STICKY FLOATING BULK ACTION BAR */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex flex-wrap items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold font-mono">
              {selectedIds.size} Santri Terpilih
            </span>
          </div>

          <div className="hidden sm:block h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkVerify}
              disabled={isBulkProcessing}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verifikasi Terpilih</span>
            </button>

            <button
              onClick={handleBulkPending}
              disabled={isBulkProcessing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-600 transition-colors cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending</span>
            </button>

            <button
              onClick={handleBulkDelete}
              disabled={isBulkProcessing}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus</span>
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Batalkan pilihan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
