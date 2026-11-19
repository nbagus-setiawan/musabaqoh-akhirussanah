import React, { useState } from 'react';
import { FileSpreadsheet, Copy, Check, ExternalLink, X } from 'lucide-react';
import rawScriptCode from '../../../google-apps-script/Code.gs?raw';

export default function GoogleSheetGuideModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const scriptCode = rawScriptCode;

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
