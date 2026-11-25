import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  RotateCcw,
  Send,
  Users,
  X
} from 'lucide-react';
import WhatsAppIcon from '../../shared/components/WhatsAppIcon';
import { buildWaUrl, normalizePhoneLocal08 } from '../../shared/utils/phone';

const STATUS_LABEL_MAP = {
  Terverifikasi: 'DITERIMA / TERVERIFIKASI',
  Pending: 'MENUNGGU VERIFIKASI (PENDING)',
  Ditolak: 'TIDAK LOLOS / DITOLAK'
};

const SYSTEM_FOOTER_2026 =
  '_Pesan ini dikirim otomatis dari sistem penerimaan Musabaqah Akhirussanah 2026. Jangan balas pesan ini, silakan hubungi panitia jika ada kendala._';

const DEFAULT_EXTRA_NOTE =
  'Nomor Peserta di atas akan dicetak oleh Panitia Musabaqah Akhirussanah 2026 dan dibagikan kepada Wali Kelas setelah proses pencetakan selesai. Apabila terdapat kesalahan penulisan nama santri maupun cabang perlombaan, dimohon untuk segera mengonfirmasikannya kepada Panitia.';

function formatWaliSection(items) {
  const accepted = items.filter(s => s.Status === 'Terverifikasi');
  const pending = items.filter(s => (s.Status || 'Pending') === 'Pending');
  const rejected = items.filter(s => s.Status === 'Ditolak');

  const sections = [];

  if (accepted.length > 0) {
    const lines = accepted.map((s, i) => {
      const nama = s.Nama_Lengkap || s.Nama_Santri || '-';
      const cabang = s.Cabang_Lomba || '-';
      const noPeserta = s.Nomor_Urut ? `*${s.Nomor_Urut}*` : '_Belum Diundi_';
      return `${i + 1}. No. Peserta: ${noPeserta} | *${nama}* - Cabang: ${cabang}`;
    });
    sections.push(`*A. SANTRI DITERIMA / TERVERIFIKASI (${accepted.length} Santri):*\n${lines.join('\n')}`);
  }

  if (pending.length > 0) {
    const lines = pending.map((s, i) => {
      const nama = s.Nama_Lengkap || s.Nama_Santri || '-';
      const cabang = s.Cabang_Lomba || '-';
      return `${i + 1}. *${nama}* - Cabang: ${cabang} (Status: Pending)`;
    });
    sections.push(`*B. SANTRI MENUNGGU VERIFIKASI / PENDING (${pending.length} Santri):*\n${lines.join('\n')}`);
  }

  if (rejected.length > 0) {
    const lines = rejected.map((s, i) => {
      const nama = s.Nama_Lengkap || s.Nama_Santri || '-';
      const cabang = s.Cabang_Lomba || '-';
      return `${i + 1}. *${nama}* - Cabang: ${cabang} (Status: Ditolak)`;
    });
    sections.push(`*C. SANTRI DITOLAK (${rejected.length} Santri):*\n${lines.join('\n')}`);
  }

  return { accepted, pending, rejected, sections };
}

/**
 * Dialog native <dialog> untuk mengirim WhatsApp massal penerimaan santri.
 * Merangkum seluruh santri binaan per Wali Kelas (Diterima + No. Peserta, Pending, Ditolak)
 * dalam satu pesan terpadu, maupun 1 pesan rekap gabungan untuk dibagikan ke Grup WA.
 */
export default function BulkWhatsAppDialog({
  isOpen,
  onClose,
  registrations = [],
  selectedIds = new Set()
}) {
  const titleId = useId();
  const scopeSelectId = useId();
  const tingkatSelectId = useId();
  const noteInputId = useId();
  const dialogRef = useRef(null);

  const [scope, setScope] = useState(selectedIds.size > 0 ? 'SELECTED' : 'ALL');
  const [tingkatFilter, setTingkatFilter] = useState('ALL');
  const [groupMode, setGroupMode] = useState('WALI_KELAS'); // 'WALI_KELAS' | 'REKAP_GRUP' | 'INDIVIDU'
  const [extraNote, setExtraNote] = useState(DEFAULT_EXTRA_NOTE);
  const [sentKeys, setSentKeys] = useState(() => new Set());
  const [copiedKey, setCopiedKey] = useState('');
  const [previewKey, setPreviewKey] = useState('');

  // Reset default scope saat modal dibuka sesuai konteks seleksi saat ini
  useEffect(() => {
    if (isOpen) {
      setScope(selectedIds.size > 0 ? 'SELECTED' : 'ALL');
      setTingkatFilter('ALL');
      setCopiedKey('');
    }
  }, [isOpen, selectedIds.size]);

  // Sinkronkan native <dialog>.showModal() / close()
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.returnValue = '';
      dialog.close();
    }
  }, [isOpen]);

  // Fallback light-dismiss klik di luar dialog untuk browser tanpa closedby="any" (Safari)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return undefined;

    const outside = (e) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };

    let pressedOutside = false;
    const onPointerDown = (e) => {
      pressedOutside = outside(e);
    };
    const onPointerUp = (e) => {
      if (pressedOutside && outside(e)) {
        dialog.close();
      }
      pressedOutside = false;
    };

    dialog.addEventListener('pointerdown', onPointerDown);
    dialog.addEventListener('pointerup', onPointerUp);
    return () => {
      dialog.removeEventListener('pointerdown', onPointerDown);
      dialog.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  const scopedRegistrations = useMemo(() => {
    return registrations.filter((item) => {
      if (scope === 'SELECTED') {
        if (!selectedIds.has(item.ID_Pendaftaran)) return false;
      } else if (scope !== 'ALL') {
        if ((item.Status || 'Pending') !== scope) return false;
      }

      if (tingkatFilter !== 'ALL') {
        const lower = String(item.Tingkat || '').toLowerCase();
        if (!lower.includes(tingkatFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [registrations, scope, selectedIds, tingkatFilter]);

  const recipients = useMemo(() => {
    if (groupMode === 'INDIVIDU') {
      return scopedRegistrations.map((item, idx) => {
        const phone08 = normalizePhoneLocal08(item.Nomor_WA);
        const key = `ind-${item.ID_Pendaftaran || idx}-${idx}`;
        const statusText = STATUS_LABEL_MAP[item.Status] || item.Status || 'Terdaftar';
        const message =
          `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n` +
          `Yth. *${item.Wali_Kelas || 'Wali Kelas'}* / Ananda *${item.Nama_Lengkap || item.Nama_Santri}*\n\n` +
          `Informasi Penerimaan Peserta *Musabaqah Akhirussanah 2026* YPPS Al-Falah Putak:\n` +
          `- ID Pendaftaran: ${item.ID_Pendaftaran || '-'}\n` +
          `- Nama Santri: *${item.Nama_Lengkap || item.Nama_Santri || '-'}*\n` +
          `- Kelas Diniyah: ${item.Tingkat || '-'} - ${item.Kelas_Kategori || item.Kelas_Diniyah || '-'}\n` +
          `- Cabang Lomba: ${item.Cabang_Lomba || '-'}\n` +
          `- Status Penerimaan: *${statusText}*\n` +
          `- Nomor Peserta: ${item.Nomor_Urut ? `*${item.Nomor_Urut}*` : '_Belum Diundi_'}\n` +
          (extraNote.trim() ? `\n${extraNote.trim()}\n` : '\n') +
          `\nSyukron Katsiron.\nWassalamu'alaikum Warahmatullahi Wabarakatuh.\n` +
          `*Panitia Musabaqah Akhirussanah 2026 YPPS Al-Falah Putak*\n\n` +
          `${SYSTEM_FOOTER_2026}`;

        return {
          key,
          title: item.Nama_Lengkap || item.Nama_Santri || 'Santri',
          subtitle: `${item.Wali_Kelas || '-'} (${item.Kelas_Kategori || item.Kelas_Diniyah || '-'})`,
          phone08,
          count: 1,
          items: [item],
          message
        };
      });
    }

    // Kelompokkan santri berdasarkan Nomor WA + Nama Wali Kelas
    const map = new Map();
    scopedRegistrations.forEach((item) => {
      const phone08 = normalizePhoneLocal08(item.Nomor_WA);
      const waliName = String(item.Wali_Kelas || 'Wali Kelas').trim();
      const mapKey = `${phone08 || 'NO_WA'}::${waliName.toUpperCase()}`;

      if (!map.has(mapKey)) {
        map.set(mapKey, {
          key: `grp-${mapKey}`,
          waliName,
          phone08,
          classes: new Set(),
          items: []
        });
      }
      const entry = map.get(mapKey);
      const kelas = item.Kelas_Kategori || item.Kelas_Diniyah || '';
      if (kelas) entry.classes.add(kelas);
      entry.items.push(item);
    });

    const groupedList = Array.from(map.values());

    // Mode REKAP_GRUP: 1 pesan gabungan seluruh wali kelas untuk langsung dishare ke Grup WA / teruskan banyak kontak
    if (groupMode === 'REKAP_GRUP') {
      if (groupedList.length === 0) return [];
      const blocks = groupedList.map((grp, idx) => {
        const classLabel = Array.from(grp.classes).join(', ') || '-';
        const { accepted, pending, rejected, sections } = formatWaliSection(grp.items);
        return (
          `*${idx + 1}. ${grp.waliName}* (Kelas Diniyah: ${classLabel})\n` +
          `Ringkasan: Total ${grp.items.length} | Diterima: ${accepted.length}` +
          (pending.length > 0 ? ` | Pending: ${pending.length}` : '') +
          (rejected.length > 0 ? ` | Ditolak: ${rejected.length}` : '') +
          `\n${sections.join('\n')}`
        );
      });

      const message =
        `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
        `Yth. Bapak/Ibu Ustadz/Ustadzah Wali Kelas Diniyah\n` +
        `Pondok Pesantren YPPS Al-Falah Putak\n\n` +
        `Berikut kami sampaikan *Rekapitulasi Resmi Penerimaan & Nomor Peserta Musabaqah Akhirussanah 2026* (${scopedRegistrations.length} Santri):\n\n` +
        `${blocks.join('\n\n------------------------------\n\n')}\n` +
        (extraNote.trim() ? `\n${extraNote.trim()}\n` : '\n') +
        `\nAtas perhatian dan kerja sama Ustadz/Ustadzah, kami ucapkan Syukron Katsiron.\n` +
        `Wassalamu'alaikum Warahmatullahi Wabarakatuh.\n` +
        `*Panitia Musabaqah Akhirussanah 2026 YPPS Al-Falah Putak*\n\n` +
        `${SYSTEM_FOOTER_2026}`;

      return [{
        key: 'rekap-grup-all',
        isBroadcast: true,
        title: `Rekap Gabungan Semua Kelas (${groupedList.length} Wali Kelas)`,
        subtitle: `Merangkum ${scopedRegistrations.length} santri siap bagikan ke Grup WA`,
        phone08: '',
        count: scopedRegistrations.length,
        items: scopedRegistrations,
        message
      }];
    }

    // Mode WALI_KELAS: 1 pesan terpadu per Wali Kelas merangkum Diterima (+No.Peserta), Pending, dan Ditolak
    return groupedList.map((grp) => {
      const classLabel = Array.from(grp.classes).join(', ') || '-';
      const { accepted, pending, rejected, sections } = formatWaliSection(grp.items);

      const message =
        `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
        `Kepada Yth. *${grp.waliName}*\n` +
        `Wali Kelas Diniyah: *${classLabel}*\n\n` +
        `Berikut rangkuman resmi status pendaftaran & penerimaan santri yang Ustadz/Ustadzah daftarkan pada *Musabaqah Akhirussanah 2026* YPPS Al-Falah Putak:\n` +
        `Total Didaftarkan: *${grp.items.length} Santri*` +
        ` (Diterima: ${accepted.length}` +
        (pending.length > 0 ? `, Pending: ${pending.length}` : '') +
        (rejected.length > 0 ? `, Ditolak: ${rejected.length}` : '') +
        `)\n\n` +
        `${sections.join('\n\n')}\n` +
        (extraNote.trim() ? `\n${extraNote.trim()}\n` : '\n') +
        `\nAtas perhatian dan kerja sama Ustadz/Ustadzah, kami ucapkan Syukron Katsiron.\n` +
        `Wassalamu'alaikum Warahmatullahi Wabarakatuh.\n` +
        `*Panitia Musabaqah Akhirussanah 2026 YPPS Al-Falah Putak*\n\n` +
        `${SYSTEM_FOOTER_2026}`;

      return {
        key: grp.key,
        title: grp.waliName,
        subtitle: `Kelas Diniyah: ${classLabel} | Total ${grp.items.length} (Diterima: ${accepted.length}${pending.length ? `, Pending: ${pending.length}` : ''}${rejected.length ? `, Ditolak: ${rejected.length}` : ''})`,
        phone08: grp.phone08,
        count: grp.items.length,
        items: grp.items,
        message
      };
    });
  }, [scopedRegistrations, groupMode, extraNote]);

  const activePreviewRecipient = useMemo(() => {
    if (recipients.length === 0) return null;
    return recipients.find(r => r.key === previewKey) || recipients[0];
  }, [recipients, previewKey]);

  const validRecipients = useMemo(
    () => recipients.filter(r => r.isBroadcast || (r.phone08 && r.phone08.length >= 9)),
    [recipients]
  );

  const sentValidCount = useMemo(
    () => validRecipients.filter(r => sentKeys.has(r.key)).length,
    [validRecipients, sentKeys]
  );

  const nextUnsentRecipient = useMemo(
    () => validRecipients.find(r => !sentKeys.has(r.key)) || null,
    [validRecipients, sentKeys]
  );

  const handleOpenWhatsApp = (recipient) => {
    if (!recipient || (!recipient.isBroadcast && !recipient.phone08)) return;
    const url = buildWaUrl(recipient.isBroadcast ? '' : recipient.phone08, recipient.message);
    window.open(url, '_blank', 'noopener,noreferrer');
    setSentKeys(prev => {
      const next = new Set(prev);
      next.add(recipient.key);
      return next;
    });
    setPreviewKey(recipient.key);
  };

  const handleToggleSent = (key) => {
    setSentKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCopyMessage = async (recipient) => {
    if (!recipient?.message) return;
    try {
      await navigator.clipboard.writeText(recipient.message);
      setCopiedKey(recipient.key);
      setTimeout(() => setCopiedKey(k => (k === recipient.key ? '' : k)), 2000);
    } catch {
      // Fallback jika clipboard API dibatasi browser
    }
  };

  const handleDialogClose = () => {
    if (dialogRef.current) {
      dialogRef.current.returnValue = '';
    }
    if (onClose) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby={titleId}
      onClose={handleDialogClose}
      className="alfalah-dialog alfalah-dialog-wide"
    >
      <div className="bg-white rounded-3xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90dvh] relative">
        <div className="h-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-500 shrink-0" />

        {/* Header Modal */}
        <div className="px-5 py-4 sm:px-6 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <WhatsAppIcon variant="brand" className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 id={titleId} className="text-base font-bold text-slate-900 tracking-tight truncate">
                Kirim WhatsApp Massal Penerimaan Santri
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Format nomor otomatis dinormalisasi ke standar Indonesia (<span className="font-mono font-bold text-emerald-700">08...</span> / <span className="font-mono font-bold text-emerald-700">wa.me/628...</span>).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Bar Filter & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
            <div className="space-y-1">
              <label htmlFor={scopeSelectId} className="block font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                Target Penerima
              </label>
              <select
                id={scopeSelectId}
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 outline-none focus:border-emerald-700 cursor-pointer"
              >
                {selectedIds.size > 0 && (
                  <option value="SELECTED">Santri Terpilih ({selectedIds.size})</option>
                )}
                <option value="ALL">Semua Status (Diterima + Pending + Ditolak)</option>
                <option value="Terverifikasi">Hanya Diterima / Terverifikasi</option>
                <option value="Pending">Hanya Menunggu Verifikasi (Pending)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor={tingkatSelectId} className="block font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                Filter Tingkat
              </label>
              <select
                id={tingkatSelectId}
                value={tingkatFilter}
                onChange={(e) => setTingkatFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 outline-none focus:border-emerald-700 cursor-pointer"
              >
                <option value="ALL">Semua Tingkat</option>
                <option value="Ula">Tingkat Ula</option>
                <option value="Wustho">Tingkat Wustho</option>
                <option value="MHQ">Tingkat MHQ</option>
              </select>
            </div>

            <fieldset className="space-y-1">
              <legend className="block font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-1">
                Mode Pengiriman
              </legend>
              <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setGroupMode('WALI_KELAS')}
                  className={`px-2 py-1.5 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer ${
                    groupMode === 'WALI_KELAS'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Per Wali Kelas
                </button>
                <button
                  type="button"
                  onClick={() => setGroupMode('REKAP_GRUP')}
                  className={`px-2 py-1.5 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer ${
                    groupMode === 'REKAP_GRUP'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  1 Pesan Grup
                </button>
                <button
                  type="button"
                  onClick={() => setGroupMode('INDIVIDU')}
                  className={`px-2 py-1.5 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer ${
                    groupMode === 'INDIVIDU'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Per Santri
                </button>
              </div>
            </fieldset>
          </div>

          {/* Catatan / Informasi Tambahan Panitia */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={noteInputId} className="text-xs font-bold text-slate-700">
                Catatan / Keterangan Nomor Peserta
              </label>
              <span className="text-[11px] text-slate-400">
                Otomatis disisipkan sebelum penutup resmi
              </span>
            </div>
            <textarea
              id={noteInputId}
              rows={2}
              value={extraNote}
              onChange={(e) => setExtraNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-800 bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 outline-none"
              placeholder="Tulis keterangan nomor peserta atau informasi tambahan dari panitia..."
            />
          </div>

          {/* Progress & Quick Next Bar */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-emerald-950">
                  {recipients.length} Target Chat ({scopedRegistrations.length} Santri)
                </p>
                <p className="text-[11px] text-emerald-800">
                  Terkirim sesi ini: <span className="font-bold">{sentValidCount}</span> dari <span className="font-bold">{validRecipients.length}</span> target siap kirim
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {sentKeys.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSentKeys(new Set())}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-bold flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Status Kirim</span>
                </button>
              )}

              <button
                type="button"
                disabled={!nextUnsentRecipient}
                onClick={() => handleOpenWhatsApp(nextUnsentRecipient)}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {nextUnsentRecipient
                    ? (nextUnsentRecipient.isBroadcast
                      ? 'Bagikan ke Grup WA Sekarang'
                      : `Kirim WA Berikutnya (${sentValidCount + 1}/${validRecipients.length})`)
                    : 'Semua Target Aktif Terkirim'}
                </span>
              </button>
            </div>
          </div>

          {/* Grid Daftar Penerima + Preview Pesan */}
          {recipients.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-1.5">
              <p className="text-xs font-bold text-slate-700">
                Tidak ada santri yang sesuai dengan filter di atas
              </p>
              <p className="text-[11px] text-slate-400">
                Ubah pilihan Target Penerima atau Filter Tingkat untuk melihat daftar antrean WhatsApp.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Daftar Penerima */}
              <div className="lg:col-span-7 border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
                {recipients.map((rec, idx) => {
                  const isSent = sentKeys.has(rec.key);
                  const isActive = activePreviewRecipient?.key === rec.key;
                  const canSend = rec.isBroadcast || Boolean(rec.phone08 && rec.phone08.length >= 9);

                  return (
                    <div
                      key={rec.key}
                      onClick={() => setPreviewKey(rec.key)}
                      className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                        isActive ? 'bg-emerald-50/50' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {rec.title}
                          </span>
                          {isSent && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Terkirim
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {rec.subtitle}
                        </p>
                        <div className="flex items-center gap-2 text-[11px]">
                          {rec.isBroadcast ? (
                            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                              Siap dibagikan ke Grup WA atau diteruskan banyak kontak
                            </span>
                          ) : canSend ? (
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                              {rec.phone08}
                            </span>
                          ) : (
                            <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              Nomor WA belum valid / kosong
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(rec)}
                          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                          title="Salin teks pesan"
                        >
                          {copiedKey === rec.key ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {canSend && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleSent(rec.key)}
                              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer ${
                                isSent
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                              title="Tandai manual sudah/belum dikirim"
                            >
                              {isSent ? 'Sudah' : 'Tandai'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenWhatsApp(rec)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                                isSent
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                              }`}
                            >
                              <WhatsAppIcon variant={isSent ? 'brand' : 'white'} className="w-3.5 h-3.5 shrink-0" />
                              <span>{rec.isBroadcast ? 'Bagikan WA' : (isSent ? 'Kirim Ulang' : 'Kirim WA')}</span>
                              <ExternalLink className="w-3 h-3 opacity-80" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Preview Pesan Aktif */}
              <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Pratinjau Pesan
                    </span>
                    {activePreviewRecipient?.phone08 && (
                      <span className="text-[11px] font-mono font-bold text-emerald-700">
                        Tujuan: {activePreviewRecipient.phone08}
                      </span>
                    )}
                  </div>
                  <pre className="text-[11px] leading-relaxed font-sans whitespace-pre-wrap text-slate-700 bg-white p-3 rounded-xl border border-slate-200 max-h-[250px] overflow-y-auto">
                    {activePreviewRecipient?.message || ''}
                  </pre>
                </div>

                {activePreviewRecipient && (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(activePreviewRecipient)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedKey === activePreviewRecipient.key ? 'Tersalin' : 'Salin Teks'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3.5 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-500">
            Klik <strong>Kirim WA</strong> atau <strong>Kirim WA Berikutnya</strong> untuk membuka WhatsApp satu per satu dengan aman tanpa diblokir pop-up browser.
          </p>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs transition-colors cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>
      </div>
    </dialog>
  );
}
