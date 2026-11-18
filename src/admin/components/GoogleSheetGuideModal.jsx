import React, { useState } from 'react';
import { FileSpreadsheet, Copy, Check, ExternalLink, X } from 'lucide-react';

export default function GoogleSheetGuideModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const scriptCode = `/**
 * BACKEND GOOGLE APPS SCRIPT
 * Pendaftaran Lomba Akhirusanah & Generator Nomor Urut (Mulai 050)
 */
const SHEET_NAME = 'Pendaftaran';

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      'Timestamp', 'Wali_Kelas', 'ID_Pendaftaran', 'Nomor_Urut', 
      'Nama_Lengkap', 'Jenis_Kelamin', 'Tingkat', 'Kelas_Kategori', 
      'Cabang_Lomba', 'Nomor_WA', 'Status', 'Catatan'
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#059669').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doGet(e) {
  try {
    const sheet = getSheet();
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0] && !row[2]) continue;
      const item = { rowIndex: i + 1 };
      headers.forEach((h, idx) => { item[h] = row[idx]; });
      data.push(item);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: data })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const sheet = getSheet();
    let contents = {};
    if (e.postData && e.postData.contents) contents = JSON.parse(e.postData.contents);
    else if (e.parameter) contents = e.parameter;
    const action = contents.action || 'register';

    if (action === 'register') {
      const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
      const idPendaftaran = contents.ID_Pendaftaran || ('AKH-' + String(sheet.getLastRow()).padStart(3, '0'));
      sheet.appendRow([
        timestamp, contents.Wali_Kelas || '', idPendaftaran, contents.Nomor_Urut || '',
        contents.Nama_Lengkap || '', contents.Jenis_Kelamin || 'L', contents.Tingkat || '',
        contents.Kelas_Kategori || '', contents.Cabang_Lomba || '', contents.Nomor_WA || '',
        contents.Status || 'Pending', contents.Catatan || ''
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: { ID_Pendaftaran: idPendaftaran } })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'batch_update' && Array.isArray(contents.updates)) {
      const rows = sheet.getDataRange().getValues();
      contents.updates.forEach(u => {
        for (let i = 1; i < rows.length; i++) {
          if (rows[i][2] == u.ID_Pendaftaran) {
            const rowNumber = i + 1;
            if (u.Nomor_Urut !== undefined) sheet.getRange(rowNumber, 4).setValue(u.Nomor_Urut);
            if (u.Status !== undefined) sheet.getRange(rowNumber, 11).setValue(u.Status);
            break;
          }
        }
      });
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'error' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto relative">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <FileSpreadsheet className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Panduan 3 Langkah Sambungkan Google Sheets</h3>
            <p className="text-xs text-slate-500">Khusus Panitia • 100% Gratis & langsung tersinkron secara real-time</p>
          </div>
        </div>

        <div className="space-y-4 mb-6 text-xs sm:text-sm text-slate-700">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-blue-800 text-sm mb-1">
              Langkah 1: Buat Spreadsheet Baru
            </h4>
            <p className="text-slate-600">
              Buka Google Drive panitia, buat file <strong>Google Sheets baru</strong>. Anda tidak perlu membuat kolom secara manual, script akan otomatis membuatkan header kolom yang rapi.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-blue-800 text-sm mb-1">
              Langkah 2: Buka Apps Script & Salin Kode
            </h4>
            <p className="text-slate-600 mb-2">
              Di Google Sheets, klik menu <strong>Extensions (Ekstensi) &gt; Apps Script</strong>. Hapus isi file lama, lalu tempelkan kode skrip berikut:
            </p>
            <div className="flex justify-end mb-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Kode Google Apps Script'}</span>
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] max-h-36 overflow-y-auto">
              {scriptCode}
            </pre>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-blue-800 text-sm mb-1">
              Langkah 3: Deploy sebagai Web App
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-600">
              <li>Klik tombol biru <strong>Deploy &gt; New deployment</strong> di pojok kanan atas Apps Script.</li>
              <li>Pilih tipe: <strong>Web app</strong>.</li>
              <li>Pada opsi <em>"Execute as"</em>, pilih: <strong>Me (email Anda)</strong>.</li>
              <li>Pada opsi <em>"Who has access"</em>, pilih: <strong>Anyone (Siapa saja)</strong>.</li>
              <li>Klik <strong>Deploy</strong>, salin URL Web App yang muncul, lalu tempelkan di menu <strong>Pengaturan Google Sheets</strong> di panel admin ini. Selesai!</li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm"
          >
            Mengerti & Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
