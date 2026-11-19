/**
 * =========================================================================
 * BACKEND GOOGLE APPS SCRIPT LENGKAP & TERINTEGRASI (6 LEMBAR KERJA)
 * MUSABAQAH AKHIRUSSANAH PONDOK PESANTREN AL-FALAH PUTAK
 * =========================================================================
 * 
 * 6 LEMBAR KERJA RESMI:
 * 1. Sheet "Admin"             -> Akun & PIN Login Panitia
 * 2. Sheet "Pendaftaran"       -> Data Peserta Santri (12 Kolom)
 * 3. Sheet "Tingkat_dan_Kelas" -> Master Jenjang & 30 Kelas Diniyah (4 Kolom)
 * 4. Sheet "Ustadz"            -> Data Wali Kelas & Asatidz (5 Kolom)
 * 5. Sheet "Juara_Lomba"       -> Rekapitulasi Juara & Poin Juara Umum (7 Kolom)
 * 6. Sheet "Pengaturan"        -> Konfigurasi Musabaqah (3 Kolom)
 * =========================================================================
 */

// NAMA RESMI 6 LEMBAR KERJA
const SHEET_ADMIN = 'Admin';
const SHEET_PENDAFTARAN = 'Pendaftaran';
const SHEET_TINGKAT_KELAS = 'Tingkat_dan_Kelas';
const SHEET_USTADZ = 'Ustadz';
const SHEET_DATA_GURU_FALLBACK = 'Data_Guru'; // Dukungan kompatibilitas jika sheet lama bernama Data_Guru
const SHEET_JUARA = 'Juara_Lomba';
const SHEET_PENGATURAN = 'Pengaturan';

// 1. HEADER SHEET ADMIN (6 KOLOM)
const HEADERS_ADMIN = [
  'ID_Admin',
  'Username',
  'PIN_Password',
  'Nama_Panitia',
  'Role',
  'Status_Aktif'
];

// 2. HEADER SHEET PENDAFTARAN SANTRI (12 KOLOM)
const HEADERS_PENDAFTARAN = [
  'Timestamp',
  'Wali_Kelas',
  'ID_Pendaftaran',
  'Nomor_Urut',
  'Nama_Lengkap',
  'Jenis_Kelamin',
  'Tingkat',
  'Kelas_Kategori',
  'Cabang_Lomba',
  'Nomor_WA',
  'Status',
  'Catatan'
];

// 3. HEADER SHEET TINGKAT DAN KELAS DINIYAH (4 KOLOM)
const HEADERS_TINGKAT_KELAS = [
  'Kode_Tingkat',
  'Nama_Tingkat',
  'Nama_Kelas_Diniyah',
  'Keterangan'
];

// 4. HEADER SHEET DATA USTADZ / WALI KELAS (5 KOLOM)
const HEADERS_USTADZ = [
  'ID_Ustadz',
  'Nama_Ustadz',
  'Tingkat',
  'Kelas_Diampu',
  'Kontak_WA'
];

// 5. HEADER SHEET JUARA LOMBA (7 KOLOM)
const HEADERS_JUARA = [
  'ID_Juara',
  'Cabang_Lomba',
  'Kategori_Tingkat',
  'Juara_Ke',
  'Nama_Santri',
  'Kelas_Diniyah',
  'Poin'
];

// 6. HEADER SHEET PENGATURAN (3 KOLOM)
const HEADERS_PENGATURAN = [
  'Kunci_Pengaturan',
  'Nilai_Pengaturan',
  'Keterangan'
];

// DATA AWAL MASTER ADMIN
const MASTER_ADMIN_AWAL = [
  ['ADM-001', 'admin', 'admin123', 'Ustadz Admin Panitia', 'Super Admin', 'Aktif']
];

// DATA AWAL MASTER 24 USTADZ / WALI KELAS (URUT DARI ULA SIFIR HINGGA WUSTHO ALFIYAH)
const MASTER_USTADZ_24 = [
  // 1. Tingkat Ula (16 Ustadz / Ustadzah)
  ['ust-01', 'UST. TRI ESNANDI,S.Pd', 'ula', 'Sifir A Putra', ''],
  ['ust-02', 'USTZH. SOFIANA NUR JANAH,S.Pd', 'ula', 'Sifir A Putri', ''],
  ['ust-03', 'UST. ALDO FERDIANSYAH', 'ula', 'Sifir B Putra', ''],
  ['ust-04', 'USTZH. SITI ROWIYAH', 'ula', 'Sifir B Putri', ''],
  ['ust-05', 'UST. IRHAM SYAROF', 'ula', 'Matan Jurumiyah A Putra', ''],
  ['ust-06', 'USTZH. ANISATUL KHOLISOH', 'ula', 'Matan Jurumiyah A Putri', ''],
  ['ust-07', 'UST. SAMSUL ARIFIN,S.Pd', 'ula', 'Matan Jurumiyah B Putra', ''],
  ['ust-08', 'USTZH. NIA ANISA DELA', 'ula', 'Matan Jurumiyah B Putri', ''],
  ['ust-09', 'UST. MUHAMMAD SENDI', 'ula', 'Matan Jurumiyah C Putra', ''],
  ['ust-10', 'USTZH. FEBRI NUR AINI', 'ula', 'Matan Jurumiyah C Putri', ''],
  ['ust-11', 'UST. RABIL AFRAJA', 'ula', 'Jurumiyah A Putra', ''],
  ['ust-12', 'USTZH. LESTARI', 'ula', 'Jurumiyah A Putri', ''],
  ['ust-13', 'UST. DANIL ALI SABILA', 'ula', 'Jurumiyah B Putra', ''],
  ['ust-14', 'USTZH. LILIS ASRIYANI', 'ula', 'Jurumiyah B Putri', ''],
  ['ust-15', 'UST. ROBUL INSAN', 'ula', 'Jurumiyah C Putra', ''],
  ['ust-16', 'USTZH. NUHA MAULA AFIFAH', 'ula', 'Jurumiyah C Putri', ''],

  // 2. Tingkat Wustho (8 Ustadz / Ustadzah)
  ['ust-17', 'UST. MUHAMMAD MAJID', 'wustho', 'Imrithi A Putra', ''],
  ['ust-18', 'UST. AGUNG PERMADI,S.Pd', 'wustho', 'Imrithi A Putri', ''],
  ['ust-19', 'UST. MASRURO,S.Pd', 'wustho', 'Imrithi B Putra', ''],
  ['ust-20', 'USTZH. LINA LAFIFATUL \'ALIYAH', 'wustho', 'Imrithi B Putri', ''],
  ['ust-21', 'UST. NURUL FALAH', 'wustho', 'Alfiyah Awwal Putra', ''],
  ['ust-22', 'UST. AGUS MANSYUR AL-HAMID', 'wustho', 'Alfiyah Awwal Putri', ''],
  ['ust-23', 'UST. IMAM QURTHUBI,S.Pd', 'wustho', 'Alfiyah Tsani Putra', ''],
  ['ust-24', 'UST. IMAM QUSYAIRI', 'wustho', 'Alfiyah Tsani Putri', '']
];

// DATA AWAL MASTER 30 KELAS DINIYAH RESMI
const MASTER_TINGKAT_KELAS_30 = [
  // Tingkat Ula (16 Kelas Diniyah)
  ['ula', 'Tingkat Ula', 'Sifir A Putra', 'Tingkat Ula (Santri Putra)'],
  ['ula', 'Tingkat Ula', 'Sifir A Putri', 'Tingkat Ula (Santri Putri)'],
  ['ula', 'Tingkat Ula', 'Sifir B Putra', 'Tingkat Ula (Santri Putra)'],
  ['ula', 'Tingkat Ula', 'Sifir B Putri', 'Tingkat Ula (Santri Putri)'],
  ['ula', 'Tingkat Ula', 'Matan Jurumiyah A Putra', 'Tingkat Ula (Santri Putra)'],
  ['ula', 'Tingkat Ula', 'Matan Jurumiyah A Putri', 'Tingkat Ula (Santri Putri)'],
  ['ula', 'Tingkat Ula', 'Matan Jurumiyah B Putra', 'Tingkat Ula (Santri Putra)'],
  ['ula', 'Tingkat Ula', 'Matan Jurumiyah B Putri', 'Tingkat Ula (Santri Putri)'],
  ['ula', 'Tingkat Ula', 'Matan Jurumiyah C Putra', 'Tingkat Ula (Santri Putra)'],
  ['ula', 'Tingkat Ula', 'Matan Jurumiyah C Putri', 'Tingkat Ula (Santri Putri)'],
  ['ula', 'Tingkat Ula', 'Jurumiyah A Putra', 'Tingkat Ula (Santri Putra)'],
  ['ula', 'Tingkat Ula', 'Jurumiyah A Putri', 'Tingkat Ula (Santri Putri)'],
  ['ula', 'Tingkat Ula', 'Jurumiyah B Putra', 'Tingkat Ula (Santri Putra)'],
  ['ula', 'Tingkat Ula', 'Jurumiyah B Putri', 'Tingkat Ula (Santri Putri)'],
  ['ula', 'Tingkat Ula', 'Jurumiyah C Putra', 'Tingkat Ula (Santri Putra)'],
  ['ula', 'Tingkat Ula', 'Jurumiyah C Putri', 'Tingkat Ula (Santri Putri)'],

  // Tingkat Wustho (8 Kelas Diniyah)
  ['wustho', 'Tingkat Wustho', 'Imrithi A Putra', 'Tingkat Wustho (Santri Putra)'],
  ['wustho', 'Tingkat Wustho', 'Imrithi A Putri', 'Tingkat Wustho (Santri Putri)'],
  ['wustho', 'Tingkat Wustho', 'Imrithi B Putra', 'Tingkat Wustho (Santri Putra)'],
  ['wustho', 'Tingkat Wustho', 'Imrithi B Putri', 'Tingkat Wustho (Santri Putri)'],
  ['wustho', 'Tingkat Wustho', 'Alfiyah Awwal Putra', 'Tingkat Wustho (Santri Putra)'],
  ['wustho', 'Tingkat Wustho', 'Alfiyah Awwal Putri', 'Tingkat Wustho (Santri Putri)'],
  ['wustho', 'Tingkat Wustho', 'Alfiyah Tsani Putra', 'Tingkat Wustho (Santri Putra)'],
  ['wustho', 'Tingkat Wustho', 'Alfiyah Tsani Putri', 'Tingkat Wustho (Santri Putri)'],

  // Tingkat MHQ Berdasarkan Juz (6 Kategori)
  ['mhq_juz', 'Tingkat Hifdzil Qur\'an (MHQ)', '5 Juz', 'Khusus Cabang MHQ Berdasarkan Juz'],
  ['mhq_juz', 'Tingkat Hifdzil Qur\'an (MHQ)', '10 Juz', 'Khusus Cabang MHQ Berdasarkan Juz'],
  ['mhq_juz', 'Tingkat Hifdzil Qur\'an (MHQ)', '15 Juz', 'Khusus Cabang MHQ Berdasarkan Juz'],
  ['mhq_juz', 'Tingkat Hifdzil Qur\'an (MHQ)', '20 Juz', 'Khusus Cabang MHQ Berdasarkan Juz'],
  ['mhq_juz', 'Tingkat Hifdzil Qur\'an (MHQ)', '25 Juz', 'Khusus Cabang MHQ Berdasarkan Juz'],
  ['mhq_juz', 'Tingkat Hifdzil Qur\'an (MHQ)', '30 Juz', 'Khusus Cabang MHQ Berdasarkan Juz']
];

// DATA AWAL MASTER PENGATURAN
const MASTER_PENGATURAN_AWAL = [
  ['NAMA_KEGIATAN', 'Musabaqah Akhirussanah Pondok Pesantren Al-Falah Putak', 'Nama resmi agenda musabaqah'],
  ['TAHUN_AJARAN', '1447 H / 2026 M', 'Tahun ajaran pelaksanaan perlombaan'],
  ['STATUS_PENDAFTARAN', 'Buka', 'Status pendaftaran (Buka / Tutup)'],
  ['TANGGAL_PELAKSANAAN', '2026-11-20 s/d 2026-11-25', 'Rentang tanggal pelaksanaan lomba'],
  ['KUOTA_PER_CABANG', '3', 'Batas maksimal delegasi per cabang lomba per kelas']
];

/**
 * =========================================================================
 * MENU KHUSUS DI GOOGLE SPREADSHEET (MUNCUL OTOMATIS SAAT SPREADSHEET DIBUKA)
 * =========================================================================
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Menu Musabaqah Al-Falah')
    .addItem('1. Buat / Siapkan Seluruh Lembar Kerja (6 Sheet)', 'inisialisasiEnamLembarKerja')
    .addItem('2. Isi Master Data Awal (30 Kelas Diniyah & Pengaturan)', 'isiMasterDataAwal')
    .addItem('3. Rapikan Format Tampilan Semua Sheet', 'formatSeluruhLembarKerja')
    .addSeparator()
    .addItem('4. Undi Nomor Urut Seluruh Santri', 'undiNomorUrutOtomatis')
    .addItem('5. Rekapitulasi Poin & Juara Umum', 'hitungRekapJuaraUmum')
    .addToUi();
}

/**
 * Styling Header: Hijau Zamrud (#063323), Teks Putih Tebal, Rata Tengah
 */
function applyHeaderStyle(sheet, headers) {
  const range = sheet.getRange(1, 1, 1, headers.length);
  range
    .setFontWeight('bold')
    .setBackground('#063323')
    .setFontColor('#ffffff')
    .setFontFamily('Arial')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);
}

/**
 * Dapatkan lembar kerja dengan nama tertentu, buat jika belum ada
 */
function getSheetByName(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  // Khusus Ustadz: jika sheet "Ustadz" belum ada tapi ada "Data_Guru", gunakan Data_Guru
  if (!sheet && sheetName === SHEET_USTADZ) {
    sheet = ss.getSheetByName(SHEET_DATA_GURU_FALLBACK);
    if (sheet) return sheet;
  }

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0) {
    if (sheetName === SHEET_ADMIN) {
      sheet.appendRow(HEADERS_ADMIN);
      applyHeaderStyle(sheet, HEADERS_ADMIN);
      MASTER_ADMIN_AWAL.forEach(r => sheet.appendRow(r));
      sheet.getRange('A2:A').setHorizontalAlignment('center');
      sheet.getRange('C2:C').setNumberFormat('@');
      sheet.getRange('F2:F').setHorizontalAlignment('center');
    }
    else if (sheetName === SHEET_PENDAFTARAN) {
      sheet.appendRow(HEADERS_PENDAFTARAN);
      applyHeaderStyle(sheet, HEADERS_PENDAFTARAN);
      sheet.getRange('C2:D').setNumberFormat('@');
      sheet.getRange('J2:J').setNumberFormat('@');
      sheet.getRange('D2:D').setHorizontalAlignment('center');
      sheet.getRange('F2:F').setHorizontalAlignment('center');
      sheet.getRange('K2:K').setHorizontalAlignment('center');
    }
    else if (sheetName === SHEET_TINGKAT_KELAS) {
      sheet.appendRow(HEADERS_TINGKAT_KELAS);
      applyHeaderStyle(sheet, HEADERS_TINGKAT_KELAS);
      sheet.getRange('A2:A').setHorizontalAlignment('center');
      MASTER_TINGKAT_KELAS_30.forEach(r => sheet.appendRow(r));
    }
    else if (sheetName === SHEET_USTADZ || sheetName === SHEET_DATA_GURU_FALLBACK) {
      sheet.appendRow(HEADERS_USTADZ);
      applyHeaderStyle(sheet, HEADERS_USTADZ);
      sheet.getRange('A2:A').setHorizontalAlignment('center');
      sheet.getRange('C2:C').setHorizontalAlignment('center');
      sheet.getRange('E2:E').setNumberFormat('@');
    }
    else if (sheetName === SHEET_JUARA) {
      sheet.appendRow(HEADERS_JUARA);
      applyHeaderStyle(sheet, HEADERS_JUARA);
      sheet.getRange('A2:A').setHorizontalAlignment('center');
      sheet.getRange('D2:D').setHorizontalAlignment('center');
      sheet.getRange('G2:G').setHorizontalAlignment('center');
    }
    else if (sheetName === SHEET_PENGATURAN) {
      sheet.appendRow(HEADERS_PENGATURAN);
      applyHeaderStyle(sheet, HEADERS_PENGATURAN);
      MASTER_PENGATURAN_AWAL.forEach(r => sheet.appendRow(r));
      sheet.getRange('A2:A').setHorizontalAlignment('center');
    }
  }

  return sheet;
}

/**
 * Inisialisasi Seluruh 6 Lembar Kerja Sekaligus
 */
function inisialisasiEnamLembarKerja() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  getSheetByName(SHEET_ADMIN);
  getSheetByName(SHEET_PENDAFTARAN);
  getSheetByName(SHEET_TINGKAT_KELAS);
  getSheetByName(SHEET_USTADZ);
  getSheetByName(SHEET_JUARA);
  getSheetByName(SHEET_PENGATURAN);

  // Hapus sheet kosong default jika ada
  const sheets = ss.getSheets();
  sheets.forEach(s => {
    const sName = s.getName();
    if ((sName === 'Sheet1' || sName === 'Sheet 1') && s.getLastRow() === 0) {
      try { ss.deleteSheet(s); } catch (e) {}
    }
  });

  formatSeluruhLembarKerja();
  SpreadsheetApp.getActiveSpreadsheet().toast('Seluruh 6 lembar kerja resmi siap digunakan.', 'Sukses', 5);
}

/**
 * Isi Master Data Awal (30 Kelas Diniyah, Admin, dan Pengaturan)
 */
function isiMasterDataAwal() {
  // 1. Reset & Isi 30 Kelas Diniyah
  const sheetKelas = getSheetByName(SHEET_TINGKAT_KELAS);
  const lastRowKelas = sheetKelas.getLastRow();
  if (lastRowKelas > 1) {
    sheetKelas.deleteRows(2, lastRowKelas - 1);
  }
  MASTER_TINGKAT_KELAS_30.forEach(row => sheetKelas.appendRow(row));

  // 2. Reset & Isi 24 Ustadz / Wali Kelas Sesuai Urutan Jenjang
  const sheetUstadz = getSheetByName(SHEET_USTADZ);
  const lastRowUstadz = sheetUstadz.getLastRow();
  if (lastRowUstadz > 1) {
    sheetUstadz.deleteRows(2, lastRowUstadz - 1);
  }
  MASTER_USTADZ_24.forEach(row => sheetUstadz.appendRow(row));

  // 3. Cek Admin
  const sheetAdmin = getSheetByName(SHEET_ADMIN);
  if (sheetAdmin.getLastRow() <= 1) {
    MASTER_ADMIN_AWAL.forEach(row => sheetAdmin.appendRow(row));
  }

  // 4. Cek Pengaturan
  const sheetPengaturan = getSheetByName(SHEET_PENGATURAN);
  if (sheetPengaturan.getLastRow() <= 1) {
    MASTER_PENGATURAN_AWAL.forEach(row => sheetPengaturan.appendRow(row));
  }

  formatSeluruhLembarKerja();
  SpreadsheetApp.getActiveSpreadsheet().toast('Master 30 Kelas Diniyah, 24 Ustadz, dan Pengaturan berhasil dimuat urut.', 'Sukses', 5);
}

/**
 * Rapikan Format Seluruh Lembar Kerja
 */
function formatSeluruhLembarKerja() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  sheets.forEach(sheet => {
    try {
      sheet.autoResizeColumns(1, Math.min(sheet.getLastColumn(), 15));
    } catch (e) {}
  });
}

/**
 * Undi Nomor Urut Seluruh Santri Otomatis di Google Sheets
 */
function undiNomorUrutOtomatis() {
  const sheet = getSheetByName(SHEET_PENDAFTARAN);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Belum ada data pendaftaran santri.', 'Informasi', 5);
    return;
  }

  // Kelompokkan santri per cabang lomba
  const byCabang = {};
  for (let i = 1; i < rows.length; i++) {
    const cabang = String(rows[i][8] || 'Lainnya').trim();
    if (!byCabang[cabang]) byCabang[cabang] = [];
    byCabang[cabang].push(i + 1); // Simpan row index (1-indexed)
  }

  // Acak nomor urut untuk setiap cabang
  Object.keys(byCabang).forEach(cabang => {
    const rowIndices = byCabang[cabang];
    // Shuffle array (Fisher-Yates)
    for (let j = rowIndices.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      const temp = rowIndices[j];
      rowIndices[j] = rowIndices[k];
      rowIndices[k] = temp;
    }
    // Tulis nomor urut ke Kolom D (Kolom ke-4)
    rowIndices.forEach((rowIdx, noUrut) => {
      sheet.getRange(rowIdx, 4).setValue(String(noUrut + 1).padStart(2, '0'));
    });
  });

  SpreadsheetApp.getActiveSpreadsheet().toast('Pengundian nomor urut seluruh cabang lomba selesai.', 'Sukses', 5);
}

/**
 * Rekapitulasi Poin Juara Umum
 */
function hitungRekapJuaraUmum() {
  const sheetJuara = getSheetByName(SHEET_JUARA);
  const rows = sheetJuara.getDataRange().getValues();
  if (rows.length <= 1) {
    SpreadsheetApp.getActiveSpreadsheet().toast('Belum ada data pemenang di Sheet Juara_Lomba.', 'Informasi', 5);
    return;
  }

  const poinPerKelas = {};
  for (let i = 1; i < rows.length; i++) {
    const kelas = String(rows[i][5] || '').trim();
    const poin = parseInt(rows[i][6], 10) || 0;
    if (kelas) {
      poinPerKelas[kelas] = (poinPerKelas[kelas] || 0) + poin;
    }
  }

  SpreadsheetApp.getActiveSpreadsheet().toast('Rekapitulasi poin berhasil dihitung.', 'Sukses', 5);
}

/**
 * =========================================================================
 * API HANDLER: GET REQUESTS (Mengambil Data Langsung dari Google Sheets)
 * =========================================================================
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'get_all';

    // 1. Ping / Cek Status Seluruh Sheet
    if (action === 'ping' || action === 'test') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sAdmin = getSheetByName(SHEET_ADMIN);
      const sPendaftaran = getSheetByName(SHEET_PENDAFTARAN);
      const sKelas = getSheetByName(SHEET_TINGKAT_KELAS);
      const sUstadz = getSheetByName(SHEET_USTADZ);
      const sJuara = getSheetByName(SHEET_JUARA);
      const sPengaturan = getSheetByName(SHEET_PENGATURAN);

      return jsonResponse({
        status: 'success',
        message: 'Koneksi 6 Sheet Aktif 100%',
        spreadsheetName: ss.getName(),
        sheets: [SHEET_ADMIN, SHEET_PENDAFTARAN, SHEET_TINGKAT_KELAS, SHEET_USTADZ, SHEET_JUARA, SHEET_PENGATURAN],
        totalSantri: Math.max(0, sPendaftaran.getLastRow() - 1),
        totalKelas: Math.max(0, sKelas.getLastRow() - 1),
        totalUstadz: Math.max(0, sUstadz.getLastRow() - 1),
        totalJuara: Math.max(0, sJuara.getLastRow() - 1),
        totalAdmin: Math.max(0, sAdmin.getLastRow() - 1),
        timestamp: new Date().toISOString()
      });
    }

    // 2. Ambil Data Ustadz / Wali Kelas
    if (action === 'get_ustadz' || action === 'get_guru' || action === 'get_wali_kelas') {
      const sheet = getSheetByName(SHEET_USTADZ);
      const rows = sheet.getDataRange().getValues();
      const list = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r[1]) continue;
        list.push({
          id: String(r[0] || 'ust-' + i).trim(),
          nama: String(r[1] || '').trim(),
          tingkat: String(r[2] || 'ula').trim().toLowerCase(),
          kelas: String(r[3] || '').trim(),
          kontak: String(r[4] || '').trim()
        });
      }
      return jsonResponse({ status: 'success', total: list.length, data: list });
    }

    // 3. Ambil Master 30 Kelas Diniyah
    if (action === 'get_tingkat_kelas') {
      const sheet = getSheetByName(SHEET_TINGKAT_KELAS);
      const rows = sheet.getDataRange().getValues();
      const list = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r[2]) continue;
        list.push({
          kodeTingkat: String(r[0] || '').trim().toLowerCase(),
          namaTingkat: String(r[1] || '').trim(),
          namaKelas: String(r[2] || '').trim(),
          keterangan: String(r[3] || '').trim()
        });
      }
      return jsonResponse({ status: 'success', total: list.length, data: list });
    }

    // 4. Ambil Data Juara Lomba & Klasemen Juara Umum
    if (action === 'get_juara') {
      const sheet = getSheetByName(SHEET_JUARA);
      const rows = sheet.getDataRange().getValues();
      const list = [];
      const klasemen = {};

      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r[1] && !r[4]) continue;
        const poin = parseInt(r[6], 10) || 0;
        const kelas = String(r[5] || '').trim();

        list.push({
          idJuara: String(r[0] || '').trim(),
          cabangLomba: String(r[1] || '').trim(),
          kategoriTingkat: String(r[2] || '').trim(),
          juaraKe: String(r[3] || '').trim(),
          namaSantri: String(r[4] || '').trim(),
          kelasDiniyah: kelas,
          poin: poin
        });

        if (kelas) {
          klasemen[kelas] = (klasemen[kelas] || 0) + poin;
        }
      }

      return jsonResponse({
        status: 'success',
        total: list.length,
        data: list,
        klasemen: klasemen
      });
    }

    // 5. Ambil Pengaturan Musabaqah
    if (action === 'get_pengaturan') {
      const sheet = getSheetByName(SHEET_PENGATURAN);
      const rows = sheet.getDataRange().getValues();
      const settings = {};
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r[0]) continue;
        settings[String(r[0]).trim()] = String(r[1] || '').trim();
      }
      return jsonResponse({ status: 'success', data: settings });
    }

    // 6. Default: Ambil Seluruh Data Santri di Sheet Pendaftaran
    const sheet = getSheetByName(SHEET_PENDAFTARAN);
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const data = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0] && !row[2] && !row[4]) continue;

      const item = { rowIndex: i + 1 };
      headers.forEach(function(header, idx) {
        let val = row[idx];
        if (val instanceof Date) {
          val = Utilities.formatDate(val, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
        }
        item[header] = val !== undefined && val !== null ? String(val).trim() : '';
      });
      data.push(item);
    }

    return jsonResponse({
      status: 'success',
      total: data.length,
      data: data
    });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * =========================================================================
 * API HANDLER: POST REQUESTS (Menulis Data Langsung ke Google Sheets)
 * =========================================================================
 */
function doPost(e) {
  try {
    let contents = {};
    if (e.postData && e.postData.contents) {
      try {
        contents = JSON.parse(e.postData.contents);
      } catch (err) {
        contents = e.parameter || {};
      }
    } else if (e.parameter) {
      contents = e.parameter;
    }

    const action = contents.action || 'register';

    // -------------------------------------------------------------------------
    // 1. AUTENTIKASI ADMIN (LOGIN PIN & USERNAME)
    // -------------------------------------------------------------------------
    if (action === 'login_admin') {
      const sheet = getSheetByName(SHEET_ADMIN);
      const rows = sheet.getDataRange().getValues();
      const usernameInput = String(contents.username || '').trim().toLowerCase();
      const pinInput = String(contents.pin || contents.password || '').trim();

      for (let i = 1; i < rows.length; i++) {
        const u = String(rows[i][1] || '').trim().toLowerCase();
        const p = String(rows[i][2] || '').trim();
        const status = String(rows[i][5] || 'Aktif').trim();

        if (u === usernameInput && p === pinInput && status.toLowerCase() === 'aktif') {
          return jsonResponse({
            status: 'success',
            message: 'Login berhasil.',
            admin: {
              id: rows[i][0],
              username: rows[i][1],
              nama: rows[i][3],
              role: rows[i][4]
            }
          });
        }
      }

      // Default fallback jika sheet masih baru dan pin cocok dengan admin123
      if (pinInput === 'admin123') {
        return jsonResponse({
          status: 'success',
          message: 'Login default berhasil.',
          admin: {
            id: 'ADM-001',
            username: 'admin',
            nama: 'Ustadz Admin Panitia',
            role: 'Super Admin'
          }
        });
      }

      return jsonResponse({
        status: 'error',
        message: 'Username atau PIN Admin tidak valid.'
      });
    }

    // -------------------------------------------------------------------------
    // 2. PENDAFTARAN SANTRI (SINGLE & BATCH MULTI-STEP)
    // -------------------------------------------------------------------------
    if (action === 'register' || action === 'batch_register') {
      const sheet = getSheetByName(SHEET_PENDAFTARAN);
      const entries = Array.isArray(contents.entries) ? contents.entries : [contents];
      const now = new Date();
      const formattedTimestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
      const added = [];

      let curRow = Math.max(1, sheet.getLastRow());

      entries.forEach(item => {
        curRow++;
        const idPendaftaran = item.ID_Pendaftaran || ('AKH-' + String(curRow).padStart(3, '0'));
        const namaLengkap = String(item.Nama_Lengkap || item.namaSantri || '').trim().toUpperCase();
        if (!namaLengkap) return;

        const rowData = [
          item.Timestamp || formattedTimestamp,
          item.Wali_Kelas || contents.Wali_Kelas || '',
          idPendaftaran,
          item.Nomor_Urut || '',
          namaLengkap,
          item.Jenis_Kelamin || item.jenisKelamin || 'L',
          item.Tingkat || contents.Tingkat || '',
          item.Kelas_Kategori || contents.Kelas_Kategori || '',
          item.Cabang_Lomba || item.cabangLomba || '',
          item.Nomor_WA || contents.Nomor_WA || '',
          item.Status || 'Pending',
          item.Catatan || item.catatan || ''
        ];

        sheet.appendRow(rowData);
        added.push(idPendaftaran);
      });

      return jsonResponse({
        status: 'success',
        message: 'Berhasil mendaftarkan ' + added.length + ' santri.',
        total: added.length,
        ids: added
      });
    }

    // -------------------------------------------------------------------------
    // 3. EDIT & UPDATE SANTRI
    // -------------------------------------------------------------------------
    if (action === 'edit_santri' || action === 'update_santri' || action === 'update_single') {
      const sheet = getSheetByName(SHEET_PENDAFTARAN);
      const rows = sheet.getDataRange().getValues();
      const idPendaftaran = String(contents.ID_Pendaftaran || '').trim();
      let updated = false;

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][2]).trim() === idPendaftaran) {
          const rowNum = i + 1;
          if (contents.Wali_Kelas !== undefined) sheet.getRange(rowNum, 2).setValue(contents.Wali_Kelas);
          if (contents.Nomor_Urut !== undefined) sheet.getRange(rowNum, 4).setValue(contents.Nomor_Urut);
          if (contents.Nama_Lengkap !== undefined) sheet.getRange(rowNum, 5).setValue(String(contents.Nama_Lengkap).toUpperCase());
          if (contents.Jenis_Kelamin !== undefined) sheet.getRange(rowNum, 6).setValue(contents.Jenis_Kelamin);
          if (contents.Tingkat !== undefined) sheet.getRange(rowNum, 7).setValue(contents.Tingkat);
          if (contents.Kelas_Kategori !== undefined) sheet.getRange(rowNum, 8).setValue(contents.Kelas_Kategori);
          if (contents.Cabang_Lomba !== undefined) sheet.getRange(rowNum, 9).setValue(contents.Cabang_Lomba);
          if (contents.Nomor_WA !== undefined) sheet.getRange(rowNum, 10).setValue(contents.Nomor_WA);
          if (contents.Status !== undefined) sheet.getRange(rowNum, 11).setValue(contents.Status);
          if (contents.Catatan !== undefined) sheet.getRange(rowNum, 12).setValue(contents.Catatan);

          updated = true;
          break;
        }
      }

      return jsonResponse({
        status: updated ? 'success' : 'not_found',
        message: updated ? 'Data santri berhasil diperbarui.' : 'ID Pendaftaran tidak ditemukan.'
      });
    }

    // -------------------------------------------------------------------------
    // 4. HAPUS SANTRI
    // -------------------------------------------------------------------------
    if (action === 'delete_single' || action === 'delete_santri') {
      const sheet = getSheetByName(SHEET_PENDAFTARAN);
      const rows = sheet.getDataRange().getValues();
      const idPendaftaran = String(contents.ID_Pendaftaran || '').trim();
      let deleted = false;

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][2]).trim() === idPendaftaran) {
          sheet.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }

      return jsonResponse({
        status: deleted ? 'success' : 'not_found',
        message: deleted ? 'Data santri berhasil dihapus.' : 'Data tidak ditemukan.'
      });
    }

    // -------------------------------------------------------------------------
    // 5. UNDI NOMOR URUT
    // -------------------------------------------------------------------------
    if (action === 'undi_nomor') {
      undiNomorUrutOtomatis();
      return jsonResponse({
        status: 'success',
        message: 'Pengundian nomor urut selesai langsung di spreadsheet.'
      });
    }

    // -------------------------------------------------------------------------
    // 6. CRUD USTADZ / WALI KELAS
    // -------------------------------------------------------------------------
    if (action === 'save_ustadz' || action === 'save_guru') {
      const sheet = getSheetByName(SHEET_USTADZ);
      const rows = sheet.getDataRange().getValues();
      const id = String(contents.id || '').trim();
      const nama = String(contents.nama || '').trim();
      const tingkat = String(contents.tingkat || 'ula').trim().toLowerCase();
      const kelas = String(contents.kelas || '').trim();
      const kontak = String(contents.kontak || '').trim();

      let foundIndex = -1;
      if (id) {
        for (let i = 1; i < rows.length; i++) {
          if (String(rows[i][0]).trim() === id) {
            foundIndex = i + 1;
            break;
          }
        }
      }

      if (foundIndex > 0) {
        sheet.getRange(foundIndex, 2).setValue(nama);
        sheet.getRange(foundIndex, 3).setValue(tingkat);
        sheet.getRange(foundIndex, 4).setValue(kelas);
        sheet.getRange(foundIndex, 5).setValue(kontak);
      } else {
        const newId = id || ('ust-' + (sheet.getLastRow()));
        sheet.appendRow([newId, nama, tingkat, kelas, kontak]);
      }

      return jsonResponse({
        status: 'success',
        message: 'Data Ustadz berhasil disimpan.'
      });
    }

    if (action === 'delete_ustadz' || action === 'delete_guru') {
      const sheet = getSheetByName(SHEET_USTADZ);
      const rows = sheet.getDataRange().getValues();
      const id = String(contents.id || '').trim();
      let deleted = false;

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === id) {
          sheet.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }

      return jsonResponse({
        status: deleted ? 'success' : 'not_found',
        message: deleted ? 'Ustadz berhasil dihapus.' : 'Data tidak ditemukan.'
      });
    }

    // -------------------------------------------------------------------------
    // 7. CRUD TINGKAT DAN KELAS DINIYAH
    // -------------------------------------------------------------------------
    if (action === 'save_kelas') {
      const sheet = getSheetByName(SHEET_TINGKAT_KELAS);
      const rows = sheet.getDataRange().getValues();
      const tingkatId = String(contents.tingkatId || contents.kodeTingkat || 'ula').trim().toLowerCase();
      const namaTingkat = String(contents.namaTingkat || (tingkatId === 'wustho' ? 'Tingkat Wustho' : 'Tingkat Ula')).trim();
      const namaKelas = String(contents.namaKelas || '').trim();
      const keterangan = String(contents.keterangan || '').trim();

      let foundIndex = -1;
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim().toLowerCase() === tingkatId && String(rows[i][2]).trim() === namaKelas) {
          foundIndex = i + 1;
          break;
        }
      }

      if (foundIndex > 0) {
        sheet.getRange(foundIndex, 4).setValue(keterangan);
      } else {
        sheet.appendRow([tingkatId, namaTingkat, namaKelas, keterangan]);
      }

      return jsonResponse({
        status: 'success',
        message: 'Kelas diniyah berhasil disimpan.'
      });
    }

    if (action === 'delete_kelas') {
      const sheet = getSheetByName(SHEET_TINGKAT_KELAS);
      const rows = sheet.getDataRange().getValues();
      const namaKelas = String(contents.namaKelas || '').trim();
      let deleted = false;

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][2]).trim() === namaKelas) {
          sheet.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }

      return jsonResponse({
        status: deleted ? 'success' : 'not_found',
        message: deleted ? 'Kelas diniyah berhasil dihapus.' : 'Kelas tidak ditemukan.'
      });
    }

    // Reset ke 30 Kelas Diniyah Resmi
    if (action === 'sync_all_kelas' || action === 'reset_30_kelas') {
      isiMasterDataAwal();
      return jsonResponse({
        status: 'success',
        message: 'Seluruh 30 Kelas Diniyah resmi berhasil disinkronkan ke Google Sheets.'
      });
    }

    // -------------------------------------------------------------------------
    // 8. CRUD JUARA LOMBA
    // -------------------------------------------------------------------------
    if (action === 'save_juara') {
      const sheet = getSheetByName(SHEET_JUARA);
      const entries = Array.isArray(contents.data) ? contents.data : [contents];
      
      // Kosongkan dan tulis ulang rekapitulasi juara jika full sync
      if (contents.isFullSync) {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          sheet.deleteRows(2, lastRow - 1);
        }
      }

      entries.forEach((item, idx) => {
        const idJuara = item.idJuara || ('JUR-' + (sheet.getLastRow() + idx));
        sheet.appendRow([
          idJuara,
          item.cabangLomba || '',
          item.kategoriTingkat || '',
          item.juaraKe || '',
          item.namaSantri || '',
          item.kelasDiniyah || '',
          parseInt(item.poin, 10) || 0
        ]);
      });

      return jsonResponse({
        status: 'success',
        message: 'Data juara berhasil disimpan ke Google Sheets.'
      });
    }

    // -------------------------------------------------------------------------
    // 9. SIMPAN PENGATURAN
    // -------------------------------------------------------------------------
    if (action === 'save_pengaturan') {
      const sheet = getSheetByName(SHEET_PENGATURAN);
      const rows = sheet.getDataRange().getValues();
      const settings = contents.settings || {};

      Object.keys(settings).forEach(key => {
        let found = false;
        for (let i = 1; i < rows.length; i++) {
          if (String(rows[i][0]).trim() === key) {
            sheet.getRange(i + 1, 2).setValue(String(settings[key]));
            found = true;
            break;
          }
        }
        if (!found) {
          sheet.appendRow([key, String(settings[key]), '']);
        }
      });

      return jsonResponse({
        status: 'success',
        message: 'Pengaturan berhasil diperbarui di Google Sheets.'
      });
    }

    return jsonResponse({ status: 'error', message: 'Aksi tidak dikenali: ' + action });

  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * Helper JSON Response dengan Header Standar
 */
function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
