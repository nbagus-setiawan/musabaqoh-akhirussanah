/**
 * =========================================================================
 * BACKEND GOOGLE APPS SCRIPT LENGKAP & TERINTEGRASI (8 LEMBAR KERJA)
 * MUSABAQAH AKHIRUSSANAH PONDOK PESANTREN AL-FALAH PUTAK
 * =========================================================================
 * 
 * 8 LEMBAR KERJA RESMI:
 * 1. Sheet "Admin"                  -> Akun & PIN Login Panitia
 * 2. Sheet "Pendaftaran"            -> Data Peserta Santri (13 Kolom Rapi & Bersih)
 * 3. Sheet "Tingkat_dan_Kelas"      -> Master Jenjang & 30 Kelas Diniyah (4 Kolom)
 * 4. Sheet "Ustadz"                 -> Data Wali Kelas & Asatidz (5 Kolom)
 * 5. Sheet "Juara_Lomba"            -> Rekapitulasi Juara & Poin (7 Kolom)
 * 6. Sheet "Pengaturan"             -> Konfigurasi Musabaqah (3 Kolom)
 * 7. Sheet "Pencatatan_Pengeluaran" -> Pencatatan Pengeluaran Panitia (8 Kolom)
 * 8. Sheet "Pencatatan_Kebutuhan"   -> Pencatatan Kebutuhan Sebelum Hari-H (9 Kolom)
 * =========================================================================
 */

// NAMA RESMI 8 LEMBAR KERJA
const SHEET_ADMIN = 'Admin';
const SHEET_PENDAFTARAN = 'Pendaftaran';
const SHEET_TINGKAT_KELAS = 'Tingkat_dan_Kelas';
const SHEET_USTADZ = 'Ustadz';
const SHEET_DATA_GURU_FALLBACK = 'Data_Guru'; // Dukungan kompatibilitas jika sheet bernama Data_Guru
const SHEET_JUARA = 'Juara_Lomba';
const SHEET_PENGATURAN = 'Pengaturan';
const SHEET_PENGELUARAN = 'Pencatatan_Pengeluaran';
const SHEET_KEBUTUHAN = 'Pencatatan_Kebutuhan';

// 1. HEADER SHEET ADMIN (6 KOLOM)
const HEADERS_ADMIN = [
  'ID_Admin',
  'Username',
  'PIN_Password',
  'Nama_Panitia',
  'Role',
  'Status_Aktif'
];

// 2. HEADER SHEET PENDAFTARAN SANTRI (13 KOLOM RESMI & RAPI)
const HEADERS_PENDAFTARAN = [
  'Timestamp',
  'Wali_Kelas',
  'Nomor_WA',
  'ID_Pendaftaran',
  'Nomor_Urut',
  'Nama_Santri',
  'Jenis_Kelamin',
  'Tingkat',
  'Kelas_Diniyah',
  'Cabang_Lomba',
  'Detail_Cabang',
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

// 7. HEADER SHEET PENCATATAN PENGELUARAN (8 KOLOM)
const HEADERS_PENGELUARAN = [
  'ID_Pengeluaran',
  'Tanggal',
  'Nama_Akun',
  'Satuan',
  'Harga_Satuan',
  'Qty',
  'Total',
  'Keterangan'
];

// 8. HEADER SHEET PENCATATAN KEBUTUHAN (9 KOLOM)
const HEADERS_KEBUTUHAN = [
  'ID_Kebutuhan',
  'Nama_Kebutuhan',
  'Kategori',
  'Qty',
  'Satuan',
  'Target_Hari',
  'Penanggung_Jawab',
  'Status',
  'Keterangan'
];

function normalizePhoneLocal08_(rawPhone) {
  if (rawPhone === undefined || rawPhone === null) return '';
  let digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0062')) {
    const rest = digits.slice(4).replace(/^0+/, '');
    return rest ? '0' + rest : '';
  }
  if (digits.startsWith('62') && digits.length >= 10) {
    const rest = digits.slice(2).replace(/^0+/, '');
    return rest ? '0' + rest : '';
  }
  if (digits.startsWith('8') && digits.length >= 9) {
    return '0' + digits;
  }
  if (digits.startsWith('0')) {
    const rest = digits.slice(1).replace(/^0+/, '');
    return rest ? '0' + rest : '0';
  }
  return digits;
}

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
    .addItem('1. Buat / Siapkan Seluruh Lembar Kerja (8 Sheet)', 'inisialisasiEnamLembarKerja')
    .addItem('2. Isi Master Data Awal (30 Kelas Diniyah & 24 Ustadz)', 'isiMasterDataAwal')
    .addItem('3. Perbarui Header Tabel Pendaftaran (13 Kolom Rapi)', 'perbaruiHeaderTabelPendaftaran')
    .addItem('4. Rapikan Format Tampilan Semua Sheet', 'formatSeluruhLembarKerja')
    .addSeparator()
    .addItem('5. Undi Nomor Peserta (Beregu: 1 Nomor Peserta Per Regu)', 'undiNomorUrutOtomatis')
    .addItem('6. Rekapitulasi Poin & Juara Umum', 'hitungRekapJuaraUmum')
    .addItem('7. Perbaiki Format Nomor WA (08...)', 'perbaikiSemuaNomorWA')
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
      sheet.getRange('C2:E').setNumberFormat('@'); // Nomor_WA, ID_Pendaftaran, Nomor_Urut
      sheet.getRange('C2:E').setHorizontalAlignment('center');
      sheet.getRange('G2:G').setHorizontalAlignment('center');
      sheet.getRange('L2:L').setHorizontalAlignment('center');
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
      MASTER_USTADZ_24.forEach(r => sheet.appendRow(r));
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
    else if (sheetName === SHEET_PENGELUARAN) {
      sheet.appendRow(HEADERS_PENGELUARAN);
      applyHeaderStyle(sheet, HEADERS_PENGELUARAN);
      sheet.getRange('A2:B').setHorizontalAlignment('center');
      sheet.getRange('B2:B').setNumberFormat('@');
      sheet.getRange('E2:G').setNumberFormat('#,##0');
    }
    else if (sheetName === SHEET_KEBUTUHAN) {
      sheet.appendRow(HEADERS_KEBUTUHAN);
      applyHeaderStyle(sheet, HEADERS_KEBUTUHAN);
      sheet.getRange('A2:A').setHorizontalAlignment('center');
      sheet.getRange('D2:D').setHorizontalAlignment('center');
      sheet.getRange('H2:H').setHorizontalAlignment('center');
    }
  }

  return sheet;
}

/**
 * Inisialisasi Seluruh 8 Lembar Kerja Sekaligus
 */
function inisialisasiEnamLembarKerja() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  getSheetByName(SHEET_ADMIN);
  getSheetByName(SHEET_PENDAFTARAN);
  getSheetByName(SHEET_TINGKAT_KELAS);
  getSheetByName(SHEET_USTADZ);
  getSheetByName(SHEET_JUARA);
  getSheetByName(SHEET_PENGATURAN);
  getSheetByName(SHEET_PENGELUARAN);
  getSheetByName(SHEET_KEBUTUHAN);

  // Hapus sheet kosong default jika ada
  const sheets = ss.getSheets();
  sheets.forEach(s => {
    const sName = s.getName();
    if ((sName === 'Sheet1' || sName === 'Sheet 1') && s.getLastRow() === 0) {
      try { ss.deleteSheet(s); } catch (e) {}
    }
  });

  formatSeluruhLembarKerja();
  SpreadsheetApp.getActiveSpreadsheet().toast('Seluruh 8 lembar kerja resmi siap digunakan.', 'Sukses', 5);
}

/**
 * Perbarui Struktur Header Tabel Pendaftaran Menjadi 13 Kolom Rapi & Bersih
 * Otomatis memigrasi data santri yang sudah ada agar tidak berantakan
 */
function perbaruiHeaderTabelPendaftaran() {
  const sheet = getSheetByName(SHEET_PENDAFTARAN);
  const rows = sheet.getDataRange().getValues();
  if (rows.length === 0) return;

  const oldHeaders = rows[0].map(h => String(h).trim());
  const isOldFormat = oldHeaders.indexOf('Detail_Cabang') === -1;

  if (isOldFormat && rows.length > 1) {
    const newRows = [];
    newRows.push(HEADERS_PENDAFTARAN);

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0] && !r[2] && !r[4]) continue;

      // Ambil nilai dari kolom lama
      const timestamp = r[0] || '';
      const waliKelas = r[1] || '';
      const idPendaftaran = r[2] || '';
      const nomorUrut = r[3] || '';
      const namaSantri = r[4] || '';
      const jenisKelamin = r[5] || 'L';
      const tingkat = r[6] || '';
      const kelasRaw = String(r[7] || '').trim();
      const cabangLomba = r[8] || '';
      const nomorWA = r[9] || '';
      const status = r[10] || 'Pending';
      const catatan = r[11] || '';

      // Bersihkan nama kelas diniyah dari embel-embel
      let cleanKelas = kelasRaw;
      let detailCabang = 'Individu';
      const matchParen = kelasRaw.match(/^(.*?)\s*\((.*?)\)$/);
      if (matchParen) {
        cleanKelas = matchParen[1].trim();
        detailCabang = matchParen[2].trim();
      }

      newRows.push([
        timestamp,
        waliKelas,
        String(nomorWA),
        idPendaftaran,
        nomorUrut,
        namaSantri,
        jenisKelamin,
        tingkat,
        cleanKelas,
        cabangLomba,
        detailCabang,
        status,
        catatan
      ]);
    }

    sheet.clearContents();
    sheet.getRange(1, 1, newRows.length, HEADERS_PENDAFTARAN.length).setValues(newRows);
  } else {
    sheet.getRange(1, 1, 1, HEADERS_PENDAFTARAN.length).setValues([HEADERS_PENDAFTARAN]);
  }

  applyHeaderStyle(sheet, HEADERS_PENDAFTARAN);
  sheet.getRange('C2:E').setNumberFormat('@');
  sheet.getRange('C2:E').setHorizontalAlignment('center');
  sheet.getRange('G2:G').setHorizontalAlignment('center');
  sheet.getRange('L2:L').setHorizontalAlignment('center');

  formatSeluruhLembarKerja();
  perbaikiSemuaNomorWA();
  SpreadsheetApp.getActiveSpreadsheet().toast('Alhamdulillah! Tabel pendaftaran berhasil dimigrasi ke 13 kolom rapi.', 'Sukses', 5);
}

/**
 * Isi Master Data Awal (30 Kelas Diniyah, 24 Ustadz, Admin, dan Pengaturan)
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
 * Perbaiki seluruh baris Nomor_WA (Pendaftaran) & Kontak_WA (Ustadz) agar berformat teks 08...
 */
function perbaikiSemuaNomorWA() {
  let fixedCount = 0;

  try {
    const sPendaftaran = getSheetByName(SHEET_PENDAFTARAN);
    const lastRow = sPendaftaran.getLastRow();
    if (lastRow > 1) {
      const headers = sPendaftaran.getRange(1, 1, 1, sPendaftaran.getLastColumn()).getValues()[0].map(h => String(h).trim());
      const colWa = headers.findIndex(h => h.toLowerCase() === 'nomor_wa');
      const waColNum = colWa !== -1 ? colWa + 1 : 3;
      const waRange = sPendaftaran.getRange(2, waColNum, lastRow - 1, 1);
      waRange.setNumberFormat('@');
      const vals = waRange.getValues();
      const fixedVals = vals.map(r => {
        const raw = r[0];
        const norm = normalizePhoneLocal08_(raw);
        if (norm && String(raw) !== norm) fixedCount++;
        return [norm];
      });
      waRange.setValues(fixedVals);
    }
  } catch (e) {}

  try {
    const sUstadz = getSheetByName(SHEET_USTADZ);
    const lastUstadzRow = sUstadz.getLastRow();
    if (lastUstadzRow > 1) {
      const waRange = sUstadz.getRange(2, 5, lastUstadzRow - 1, 1);
      waRange.setNumberFormat('@');
      const vals = waRange.getValues();
      const fixedVals = vals.map(r => {
        const raw = r[0];
        const norm = normalizePhoneLocal08_(raw);
        if (norm && String(raw) !== norm) fixedCount++;
        return [norm];
      });
      waRange.setValues(fixedVals);
    }
  } catch (e) {}

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Format Nomor WA selesai diperiksa. ' + fixedCount + ' baris diperbaiki ke format teks 08...',
      'Perbaikan Nomor WA',
      5
    );
  } catch (e) {}
  return fixedCount;
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
  perbaikiSemuaNomorWA();
}

/**
 * Mask nomor WA untuk konsumsi publik (menyembunyikan digit tengah)
 */
function maskPhonePublic_(rawPhone) {
  const norm = normalizePhoneLocal08_(rawPhone);
  if (!norm) return '';
  if (norm.length <= 6) return norm.slice(0, 2) + '***';
  return norm.slice(0, 4) + '****' + norm.slice(-3);
}

/**
 * Verifikasi PIN Admin langsung terhadap Sheet "Admin"
 */
function verifyAdminPin_(pinInput) {
  const cleanPin = String(pinInput || '').trim();
  if (!cleanPin) return false;
  const sheet = getSheetByName(SHEET_ADMIN);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const p = String(rows[i][2] || '').trim();
    const status = String(rows[i][5] || 'Aktif').trim().toLowerCase();
    if (p && p === cleanPin && status === 'aktif') {
      return true;
    }
  }
  return false;
}

/**
 * Undi Nomor Peserta Seluruh / Per Cabang Santri Terverifikasi Otomatis di Google Sheets
 * Aturan Mutlak:
 * 1. Hanya santri berstatus "Terverifikasi" yang diundi.
 * 2. BEBAS DUPLIKAT DI SELURUH CABANG & DALAM CABANG (tetap menjaga nomor cabang lain bila undi per cabang).
 * 3. LOMBA BEREGU (Syarhil Qur'an, CCM, Cerdas Cermat, Kreasi Nadzom, Nadzom):
 *    Seluruh anggota dalam satu regu/tim yang sama MENDAPATKAN NOMOR PESERTA YANG SAMA PERSIS.
 */
function undiNomorUrutOtomatis(optStartNumber, optCategory) {
  const sheet = getSheetByName(SHEET_PENDAFTARAN);
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) {
    try { SpreadsheetApp.getActiveSpreadsheet().toast('Belum ada data pendaftaran santri.', 'Informasi', 5); } catch (e) {}
    return 0;
  }

  let startNumber = (typeof optStartNumber === 'number' && optStartNumber > 0) ? optStartNumber : null;
  if (startNumber === null) {
    try {
      const ui = SpreadsheetApp.getUi();
      const response = ui.prompt(
        'Undi Nomor Peserta Musabaqah (Format 3 Digit)',
        'Masukkan nomor peserta awal (Ketik angka, misal: 001 atau 050):',
        ui.ButtonSet.OK_CANCEL
      );
      if (response.getSelectedButton() === ui.Button.CANCEL) {
        return 0;
      }
      const val = parseInt(response.getResponseText().trim(), 10);
      startNumber = (!isNaN(val) && val > 0) ? val : 1;
    } catch (e) {
      startNumber = 1;
    }
  }

  const targetCategory = String(optCategory || 'ALL').trim();
  const isAllCategories = !targetCategory || targetCategory.toUpperCase() === 'ALL';

  const headers = rows[0].map(h => String(h || '').trim());
  const colIndexCabang = headers.findIndex(h => /cabang/i.test(h));
  const colIndexKelas = headers.findIndex(h => /kelas/i.test(h));
  const colIndexDetail = headers.findIndex(h => /detail/i.test(h));
  const colIndexCatatan = headers.findIndex(h => /catatan/i.test(h));
  const colIndexNoUrut = headers.findIndex(h => /(nomor_urut|no_urut|nomor_undian|undian)/i.test(h));
  const colIndexNama = headers.findIndex(h => /(nama_santri|nama_lengkap|nama)/i.test(h));
  const colIndexStatus = headers.findIndex(h => /status/i.test(h));

  if (colIndexCabang === -1 || colIndexNoUrut === -1) {
    try { SpreadsheetApp.getActiveSpreadsheet().toast('Kolom Cabang_Lomba atau Nomor_Urut tidak ditemukan.', 'Error', 5); } catch (e) {}
    return 0;
  }

  const cabangBeregu = ["syarhil", "ccm", "cerdas cermat", "kreasi nadzom", "nadzom"];
  const units = [];
  const teamMap = {};
  const preservedUsedNumbers = {};

  for (let i = 1; i < rows.length; i++) {
    const rowIndex = i + 1;
    const row = rows[i];

    const nama = colIndexNama !== -1 ? String(row[colIndexNama] || '').trim() : 'Santri';
    const cabang = String(row[colIndexCabang] || '').trim();
    if (!cabang || !nama) continue;

    const status = colIndexStatus !== -1 ? String(row[colIndexStatus] || '').trim().toLowerCase() : 'terverifikasi';
    const matchesCategory = isAllCategories || cabang.toLowerCase() === targetCategory.toLowerCase();

    // Catat nomor peserta yang tetap dipertahankan pada cabang lain / di luar target agar bebas duplikat global
    if (!matchesCategory || status !== 'terverifikasi') {
      const existingNo = String(row[colIndexNoUrut] || '').trim();
      if (existingNo && !isNaN(existingNo) && Number(existingNo) > 0) {
        preservedUsedNumbers[String(Number(existingNo)).padStart(3, '0')] = true;
      }
      continue;
    }

    const kelas = colIndexKelas !== -1 ? String(row[colIndexKelas] || '').trim() : '';
    const detail = colIndexDetail !== -1 ? String(row[colIndexDetail] || '').trim() : '';
    const catatan = colIndexCatatan !== -1 ? String(row[colIndexCatatan] || '').trim() : '';

    const isBeregu = cabangBeregu.some(cb => cabang.toLowerCase().includes(cb));

    if (isBeregu) {
      const combinedText = `${detail} ${catatan} ${kelas}`;
      const matchRegu = combinedText.match(/(regu\s*[a-z0-9]+|tim\s*[a-z0-9]+)/i);
      const reguLabel = matchRegu ? matchRegu[0].toUpperCase() : 'REGU 1';
      const kelasClean = kelas
        .replace(/\s*\([^)]*regu[^)]*\)/gi, '')
        .replace(/\s*\([^)]*bahasa[^)]*\)/gi, '')
        .trim();

      const teamKey = `${cabang.toLowerCase().trim()}___${kelasClean.toLowerCase().trim()}___${reguLabel.toLowerCase().trim()}`;

      if (teamMap[teamKey] !== undefined) {
        units[teamMap[teamKey]].rows.push(rowIndex);
      } else {
        teamMap[teamKey] = units.length;
        units.push({
          type: 'team',
          key: teamKey,
          cabang: cabang,
          rows: [rowIndex]
        });
      }
    } else {
      units.push({
        type: 'individual',
        key: 'indiv_' + rowIndex,
        cabang: cabang,
        rows: [rowIndex]
      });
    }
  }

  if (units.length === 0) {
    try { SpreadsheetApp.getActiveSpreadsheet().toast('Tidak ada peserta Terverifikasi yang sesuai untuk diundi.', 'Informasi', 5); } catch (e) {}
    return 0;
  }

  // Buat pool nomor peserta unik global melewati nomor yang masih terpakai di cabang lain
  const numbersPool = [];
  let candidate = startNumber;
  while (numbersPool.length < units.length) {
    const formattedCandidate = String(candidate).padStart(3, '0');
    if (!preservedUsedNumbers[formattedCandidate]) {
      numbersPool.push(candidate);
    }
    candidate++;
  }

  for (let j = numbersPool.length - 1; j > 0; j--) {
    const k = Math.floor(Math.random() * (j + 1));
    const temp = numbersPool[j];
    numbersPool[j] = numbersPool[k];
    numbersPool[k] = temp;
  }

  const noUrutRange = sheet.getRange(2, colIndexNoUrut + 1, rows.length - 1, 1);
  const noUrutValues = noUrutRange.getValues();

  noUrutRange.setNumberFormat('@');
  noUrutRange.setHorizontalAlignment('center');

  let totalRowsAssigned = 0;
  units.forEach((unit, idx) => {
    const rawNum = numbersPool[idx];
    const nomorUndian3Digit = String(rawNum).padStart(3, '0');
    unit.rows.forEach(rIdx => {
      noUrutValues[rIdx - 2][0] = nomorUndian3Digit;
      totalRowsAssigned++;
    });
  });

  noUrutRange.setValues(noUrutValues);

  const pesanSukses = 'Pengundian selesai! Total ' + units.length + ' nomor peserta unik (' + totalRowsAssigned + ' baris santri Terverifikasi).';
  try { SpreadsheetApp.getActiveSpreadsheet().toast(pesanSukses, 'Sukses', 5); } catch (e) {}
  return units.length;
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
      const sPengeluaran = getSheetByName(SHEET_PENGELUARAN);
      const sKebutuhan = getSheetByName(SHEET_KEBUTUHAN);

      return jsonResponse({
        status: 'success',
        message: 'Koneksi 8 Sheet Aktif 100%',
        spreadsheetName: ss.getName(),
        sheets: [
          SHEET_ADMIN,
          SHEET_PENDAFTARAN,
          SHEET_TINGKAT_KELAS,
          SHEET_USTADZ,
          SHEET_JUARA,
          SHEET_PENGATURAN,
          SHEET_PENGELUARAN,
          SHEET_KEBUTUHAN
        ],
        totalSantri: Math.max(0, sPendaftaran.getLastRow() - 1),
        totalKelas: Math.max(0, sKelas.getLastRow() - 1),
        totalUstadz: Math.max(0, sUstadz.getLastRow() - 1),
        totalJuara: Math.max(0, sJuara.getLastRow() - 1),
        totalAdmin: Math.max(0, sAdmin.getLastRow() - 1),
        totalPengeluaran: Math.max(0, sPengeluaran.getLastRow() - 1),
        totalKebutuhan: Math.max(0, sKebutuhan.getLastRow() - 1),
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'repair_wa') {
      const adminPinParam = (e && e.parameter && e.parameter.adminPin) ? e.parameter.adminPin : '';
      if (!verifyAdminPin_(adminPinParam)) {
        return jsonResponse({ status: 'error', code: 'UNAUTHORIZED', message: 'Akses ditolak: PIN Admin tidak valid.' });
      }
      const fixedCount = perbaikiSemuaNomorWA();
      return jsonResponse({
        status: 'success',
        message: 'Berhasil memperbaiki ' + fixedCount + ' baris Nomor WA menjadi format teks 08...',
        fixedCount: fixedCount
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
          kontak: normalizePhoneLocal08_(r[4])
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

    // 5B. Ambil Pencatatan Pengeluaran Panitia (Khusus Admin)
    if (action === 'get_pengeluaran') {
      const adminPinParam = (e && e.parameter && e.parameter.adminPin) ? e.parameter.adminPin : '';
      if (!verifyAdminPin_(adminPinParam)) {
        return jsonResponse({ status: 'error', code: 'UNAUTHORIZED', message: 'Akses ditolak: PIN Admin tidak valid.' });
      }
      const sheet = getSheetByName(SHEET_PENGELUARAN);
      const rows = sheet.getDataRange().getValues();
      const list = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r[0] && !r[2]) continue;
        let tanggalVal = r[1];
        if (tanggalVal instanceof Date) {
          tanggalVal = Utilities.formatDate(tanggalVal, 'Asia/Jakarta', 'yyyy-MM-dd');
        }
        const hargaSatuan = Number(r[4]) || 0;
        const qty = Number(r[5]) || 0;
        const total = Number(r[6]) || (hargaSatuan * qty);

        list.push({
          idPengeluaran: String(r[0] || 'OUT-' + i).trim(),
          tanggal: String(tanggalVal || '').trim(),
          namaAkun: String(r[2] || '').trim(),
          satuan: String(r[3] || '').trim(),
          hargaSatuan: hargaSatuan,
          qty: qty,
          total: total,
          keterangan: String(r[7] || '').trim()
        });
      }
      return jsonResponse({ status: 'success', sheet: SHEET_PENGELUARAN, total: list.length, data: list });
    }

    // 5C. Ambil Pencatatan Kebutuhan Sebelum Hari-H (Khusus Admin)
    if (action === 'get_kebutuhan') {
      const adminPinParam = (e && e.parameter && e.parameter.adminPin) ? e.parameter.adminPin : '';
      if (!verifyAdminPin_(adminPinParam)) {
        return jsonResponse({ status: 'error', code: 'UNAUTHORIZED', message: 'Akses ditolak: PIN Admin tidak valid.' });
      }
      const sheet = getSheetByName(SHEET_KEBUTUHAN);
      const rows = sheet.getDataRange().getValues();
      const list = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r[0] && !r[1]) continue;
        let targetVal = r[5];
        if (targetVal instanceof Date) {
          targetVal = Utilities.formatDate(targetVal, 'Asia/Jakarta', 'yyyy-MM-dd');
        }
        list.push({
          idKebutuhan: String(r[0] || 'KEB-' + i).trim(),
          namaKebutuhan: String(r[1] || '').trim(),
          kategori: String(r[2] || 'Perlengkapan').trim(),
          qty: Number(r[3]) || 1,
          satuan: String(r[4] || 'Pcs').trim(),
          targetTanggal: String(targetVal || '').trim(),
          penanggungJawab: String(r[6] || '').trim(),
          status: String(r[7] || 'Belum Siap').trim(),
          keterangan: String(r[8] || '').trim()
        });
      }
      return jsonResponse({ status: 'success', sheet: SHEET_KEBUTUHAN, total: list.length, data: list });
    }

    // 5D. Pencarian Status Publik Aman (Hanya kembalikan baris yang cocok & mask Nomor_WA)
    if (action === 'search_status') {
      const rawQuery = (e && e.parameter && e.parameter.q) ? String(e.parameter.q).trim() : '';
      if (rawQuery.length < 3) {
        return jsonResponse({ status: 'success', total: 0, data: [] });
      }
      const qLower = rawQuery.toLowerCase();
      const qNormPhone = normalizePhoneLocal08_(rawQuery);
      const sheet = getSheetByName(SHEET_PENDAFTARAN);
      const rows = sheet.getDataRange().getValues();
      const headers = rows[0];
      const results = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0] && !row[2] && !row[4]) continue;
        const item = { rowIndex: i + 1 };
        headers.forEach(function(header, idx) {
          let val = row[idx];
          if (val instanceof Date) {
            val = Utilities.formatDate(val, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
          }
          val = val !== undefined && val !== null ? String(val).trim() : '';
          if (header === 'Nomor_Urut' && val && !isNaN(val) && Number(val) > 0) {
            val = String(val).padStart(3, '0');
          }
          if (header === 'Nomor_WA' && val) {
            val = normalizePhoneLocal08_(val);
          }
          item[header] = val;
        });

        if (!item.Nama_Lengkap && item.Nama_Santri) item.Nama_Lengkap = item.Nama_Santri;
        if (!item.Nama_Santri && item.Nama_Lengkap) item.Nama_Santri = item.Nama_Lengkap;
        if (!item.Kelas_Diniyah && item.Kelas_Kategori) item.Kelas_Diniyah = item.Kelas_Kategori;
        if (!item.Kelas_Kategori && item.Kelas_Diniyah) item.Kelas_Kategori = item.Kelas_Diniyah;

        const matchId = String(item.ID_Pendaftaran || '').toLowerCase().includes(qLower);
        const matchUrut = String(item.Nomor_Urut || '').toLowerCase().includes(qLower);
        const matchNama = String(item.Nama_Lengkap || '').toLowerCase().includes(qLower);
        const matchWa = qNormPhone.length >= 6 && String(item.Nomor_WA || '').includes(qNormPhone);

        if (matchId || matchUrut || matchNama || matchWa) {
          item.Nomor_WA = maskPhonePublic_(item.Nomor_WA);
          results.push(item);
        }
      }

      return jsonResponse({ status: 'success', total: results.length, data: results });
    }

    // 6. Default: Ambil Seluruh Data Santri di Sheet Pendaftaran
    const adminPinParam = (e && e.parameter && e.parameter.adminPin) ? e.parameter.adminPin : '';
    const isAdminAuthorized = verifyAdminPin_(adminPinParam);

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
        val = val !== undefined && val !== null ? String(val).trim() : '';

        // Pastikan Nomor_Urut selalu dipad 3 digit (misal: "1" -> "001", "10" -> "010")
        if (header === 'Nomor_Urut' && val && !isNaN(val) && Number(val) > 0) {
          val = String(val).padStart(3, '0');
        }
        if (header === 'Nomor_WA' && val) {
          const normWa = normalizePhoneLocal08_(val);
          val = isAdminAuthorized ? normWa : maskPhonePublic_(normWa);
        }

        item[header] = val;
      });

      // Penyelarasan kompatibilitas nama properti:
      if (!item.Nama_Lengkap && item.Nama_Santri) item.Nama_Lengkap = item.Nama_Santri;
      if (!item.Nama_Santri && item.Nama_Lengkap) item.Nama_Santri = item.Nama_Lengkap;
      if (!item.Kelas_Diniyah && item.Kelas_Kategori) item.Kelas_Diniyah = item.Kelas_Kategori;
      if (!item.Kelas_Kategori && item.Kelas_Diniyah) item.Kelas_Kategori = item.Kelas_Diniyah;

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
    // 1. AUTENTIKASI ADMIN (LOGIN PIN & USERNAME TANPA BACKDOOR)
    // -------------------------------------------------------------------------
    if (action === 'login_admin') {
      const sheet = getSheetByName(SHEET_ADMIN);
      const rows = sheet.getDataRange().getValues();
      const usernameInput = String(contents.username || '').trim().toLowerCase();
      const pinInput = String(contents.pin || contents.password || '').trim();

      if (!pinInput) {
        return jsonResponse({ status: 'error', message: 'PIN Admin wajib diisi.' });
      }

      for (let i = 1; i < rows.length; i++) {
        const u = String(rows[i][1] || '').trim().toLowerCase();
        const p = String(rows[i][2] || '').trim();
        const status = String(rows[i][5] || 'Aktif').trim().toLowerCase();

        const userMatch = !usernameInput || u === usernameInput;
        if (userMatch && p && p === pinInput && status === 'aktif') {
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

      return jsonResponse({
        status: 'error',
        message: 'PIN Admin tidak valid.'
      });
    }

    // -------------------------------------------------------------------------
    // 1B. UBAH PIN ADMIN LANGSUNG KE SHEET "Admin"
    // -------------------------------------------------------------------------
    if (action === 'change_admin_pin') {
      const oldPin = String(contents.oldPin || contents.adminPin || '').trim();
      const newPin = String(contents.newPin || '').trim();

      if (!verifyAdminPin_(oldPin)) {
        return jsonResponse({ status: 'error', code: 'UNAUTHORIZED', message: 'PIN Admin saat ini tidak valid.' });
      }
      if (!newPin || newPin.length < 4) {
        return jsonResponse({ status: 'error', message: 'PIN baru minimal harus 4 karakter / angka.' });
      }

      const sheet = getSheetByName(SHEET_ADMIN);
      const rows = sheet.getDataRange().getValues();
      let updated = false;
      for (let i = 1; i < rows.length; i++) {
        const p = String(rows[i][2] || '').trim();
        const status = String(rows[i][5] || 'Aktif').trim().toLowerCase();
        if (p === oldPin && status === 'aktif') {
          sheet.getRange(i + 1, 3).setNumberFormat('@').setValue(newPin);
          updated = true;
          break;
        }
      }

      if (!updated) {
        return jsonResponse({ status: 'error', message: 'Akun admin aktif tidak ditemukan.' });
      }
      SpreadsheetApp.flush();
      return jsonResponse({ status: 'success', message: 'PIN Admin berhasil diperbarui di Google Sheets.' });
    }

    // -------------------------------------------------------------------------
    // 2. PENDAFTARAN SANTRI (SINGLE & BATCH MULTI-STEP - 13 KOLOM)
    // -------------------------------------------------------------------------
    if (action === 'register' || action === 'batch_register') {
      // Validasi STATUS_PENDAFTARAN dari Sheet Pengaturan
      try {
        const sPengaturan = getSheetByName(SHEET_PENGATURAN);
        const pRows = sPengaturan.getDataRange().getValues();
        for (let i = 1; i < pRows.length; i++) {
          if (String(pRows[i][0] || '').trim() === 'STATUS_PENDAFTARAN') {
            const st = String(pRows[i][1] || 'Buka').trim().toLowerCase();
            if (st === 'tutup') {
              return jsonResponse({
                status: 'error',
                code: 'REGISTRATION_CLOSED',
                message: 'Pendaftaran peserta saat ini sedang ditutup oleh Panitia.'
              });
            }
            break;
          }
        }
      } catch (errCheck) {}

      const sheet = getSheetByName(SHEET_PENDAFTARAN);
      const entries = Array.isArray(contents.entries) ? contents.entries : [contents];
      const now = new Date();
      const formattedTimestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
      const added = [];

      const existingRows = sheet.getDataRange().getValues();
      const usedIds = {};
      let maxNum = 0;
      for (let r = 1; r < existingRows.length; r++) {
        const eid = String(existingRows[r][3] || '').trim();
        if (eid) {
          usedIds[eid] = true;
          const m = eid.match(/\d+/);
          if (m) {
            const num = parseInt(m[0], 10);
            if (num > maxNum) maxNum = num;
          }
        }
      }

      entries.forEach(item => {
        const namaSantri = String(item.Nama_Santri || item.Nama_Lengkap || item.namaSantri || '').trim().toUpperCase();
        if (!namaSantri) return;

        let idPendaftaran = String(item.ID_Pendaftaran || '').trim();
        if (!idPendaftaran || usedIds[idPendaftaran]) {
          maxNum++;
          idPendaftaran = 'AKH-' + String(maxNum).padStart(3, '0');
        }
        usedIds[idPendaftaran] = true;

        const waNormalized = normalizePhoneLocal08_(item.Nomor_WA || contents.Nomor_WA || '');

        const rowData = [
          item.Timestamp || formattedTimestamp,
          item.Wali_Kelas || contents.Wali_Kelas || '',
          waNormalized,
          idPendaftaran,
          item.Nomor_Urut || '',
          namaSantri,
          item.Jenis_Kelamin || item.jenisKelamin || 'L',
          item.Tingkat || contents.Tingkat || '',
          item.Kelas_Diniyah || item.Kelas_Kategori || contents.Kelas_Diniyah || contents.Kelas_Kategori || '',
          item.Cabang_Lomba || item.cabangLomba || '',
          item.Detail_Cabang || item.detailCabang || 'Individu',
          item.Status || 'Pending',
          item.Catatan || item.catatan || ''
        ];

        sheet.appendRow(rowData);
        if (waNormalized) {
          sheet.getRange(sheet.getLastRow(), 3).setNumberFormat('@').setValue(waNormalized);
        }
        added.push(idPendaftaran);
      });

      SpreadsheetApp.flush();

      return jsonResponse({
        status: 'success',
        message: 'Berhasil mendaftarkan ' + added.length + ' santri.',
        total: added.length,
        ids: added
      });
    }

    // -------------------------------------------------------------------------
    // GUARD KEAMANAN: Semua aksi modifikasi setelah titik ini wajib PIN Admin
    // -------------------------------------------------------------------------
    if (!verifyAdminPin_(contents.adminPin)) {
      return jsonResponse({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Akses ditolak: PIN Admin tidak valid atau sesi telah berakhir.'
      });
    }

    // -------------------------------------------------------------------------
    // 3. EDIT & UPDATE SANTRI
    // -------------------------------------------------------------------------
    if (action === 'edit_santri' || action === 'update_santri' || action === 'update_single') {
      const sheet = getSheetByName(SHEET_PENDAFTARAN);
      const rows = sheet.getDataRange().getValues();
      const headers = rows[0].map(h => String(h).trim());
      const idPendaftaran = String(contents.ID_Pendaftaran || '').trim();
      const targetRowIdx = contents.rowIndex ? parseInt(contents.rowIndex, 10) : 0;
      const hintNama = String(contents.Match_Nama || contents.Nama_Santri || contents.Nama_Lengkap || '').trim().toUpperCase();
      const hintCabang = String(contents.Match_Cabang || contents.Cabang_Lomba || '').trim().toLowerCase();
      let updated = false;

      const colId = headers.findIndex(h => h.toLowerCase() === 'id_pendaftaran');
      const colNama = headers.findIndex(h => h.toLowerCase() === 'nama_santri' || h.toLowerCase() === 'nama_lengkap');
      const colCabang = headers.findIndex(h => h.toLowerCase() === 'cabang_lomba');
      const colStatus = headers.findIndex(h => h.toLowerCase() === 'status');

      const HEADER_ALIASES = {
        nama_lengkap: 'nama_santri',
        nama_santri: 'nama_lengkap',
        kelas_kategori: 'kelas_diniyah',
        kelas_diniyah: 'kelas_kategori'
      };

      const applyRowUpdate = (rowNum) => {
        if (action === 'update_single') {
          if (colStatus !== -1 && contents.Status !== undefined) {
            sheet.getRange(rowNum, colStatus + 1).setValue(String(contents.Status).trim());
            updated = true;
          }
          return;
        }
        const skipKeys = { action: 1, rowindex: 1, match_nama: 1, match_cabang: 1, adminpin: 1 };
        Object.keys(contents).forEach(key => {
          const lk = key.toLowerCase();
          if (skipKeys[lk]) return;
          let cIdx = headers.findIndex(h => h.toLowerCase() === lk);
          if (cIdx === -1 && HEADER_ALIASES[lk]) {
            cIdx = headers.findIndex(h => h.toLowerCase() === HEADER_ALIASES[lk]);
          }
          if (cIdx !== -1) {
            let val = contents[key];
            if (lk === 'nama_santri' || lk === 'nama_lengkap') {
              val = String(val || '').trim().toUpperCase();
            } else if (lk === 'nomor_wa') {
              val = normalizePhoneLocal08_(val);
              sheet.getRange(rowNum, cIdx + 1).setNumberFormat('@').setValue(val);
              return;
            } else if (lk === 'nomor_urut') {
              const strUrut = String(val || '').trim();
              val = (strUrut && !isNaN(strUrut) && Number(strUrut) > 0) ? strUrut.padStart(3, '0') : strUrut;
              sheet.getRange(rowNum, cIdx + 1).setNumberFormat('@').setValue(val);
              return;
            }
            sheet.getRange(rowNum, cIdx + 1).setValue(val);
          }
        });
        updated = true;
      };

      // Prioritas 1: Cocokkan berdasarkan rowIndex tepat jika tersedia & valid
      if (targetRowIdx >= 2 && targetRowIdx <= rows.length) {
        const r = rows[targetRowIdx - 1];
        const rowId = colId !== -1 ? String(r[colId] || '').trim() : '';
        const rowNama = colNama !== -1 ? String(r[colNama] || '').trim().toUpperCase() : '';
        if ((idPendaftaran && rowId === idPendaftaran) || (hintNama && rowNama === hintNama)) {
          applyRowUpdate(targetRowIdx);
        }
      }

      // Prioritas 2: Fallback mencari berdasarkan ID_Pendaftaran (dan hint Nama/Cabang lama jika ada duplikat ID)
      if (!updated && colId !== -1 && idPendaftaran) {
        for (let i = 1; i < rows.length; i++) {
          if (String(rows[i][colId]).trim() === idPendaftaran) {
            const rowNama = colNama !== -1 ? String(rows[i][colNama] || '').trim().toUpperCase() : '';
            const rowCabang = colCabang !== -1 ? String(rows[i][colCabang] || '').trim().toLowerCase() : '';
            const namaMatch = !hintNama || !rowNama || rowNama === hintNama;
            const cabangMatch = !hintCabang || !rowCabang || rowCabang === hintCabang;

            if (namaMatch && cabangMatch) {
              applyRowUpdate(i + 1);
              if (action !== 'update_single') break;
            }
          }
        }
      }

      SpreadsheetApp.flush();
      return jsonResponse({
        status: updated ? 'success' : 'not_found',
        message: updated ? 'Data santri berhasil diperbarui.' : 'ID Pendaftaran tidak ditemukan.'
      });
    }

    // 3B. BATCH UPDATE STATUS SANTRI (VERIFIKASI MASSAL CEPAT & AKURAT BERBASIS BARIS)
    if (action === 'batch_update_status') {
      const sheet = getSheetByName(SHEET_PENDAFTARAN);
      const rows = sheet.getDataRange().getValues();
      const headers = rows[0].map(h => String(h).trim());
      const items = Array.isArray(contents.items) ? contents.items : [];
      const ids = Array.isArray(contents.ids) ? contents.ids.map(id => String(id).trim()) : [];
      const newStatus = String(contents.status || 'Terverifikasi').trim();
      let count = 0;

      const colId = headers.findIndex(h => h.toLowerCase() === 'id_pendaftaran');
      const colNama = headers.findIndex(h => h.toLowerCase() === 'nama_santri' || h.toLowerCase() === 'nama_lengkap');
      const colStatus = headers.findIndex(h => h.toLowerCase() === 'status');

      if (colStatus !== -1) {
        const updatedRows = {};
        if (items.length > 0) {
          items.forEach(meta => {
            const targetRowIdx = meta && meta.rowIndex ? parseInt(meta.rowIndex, 10) : 0;
            const targetId = String(meta?.ID_Pendaftaran || '').trim();
            const hintNama = String(meta?.Nama_Santri || meta?.Nama_Lengkap || '').trim().toUpperCase();
            let hit = false;

            if (targetRowIdx >= 2 && targetRowIdx <= rows.length && !updatedRows[targetRowIdx]) {
              const r = rows[targetRowIdx - 1];
              const rowId = colId !== -1 ? String(r[colId] || '').trim() : '';
              const rowNama = colNama !== -1 ? String(r[colNama] || '').trim().toUpperCase() : '';
              if ((targetId && rowId === targetId) || (hintNama && rowNama === hintNama)) {
                sheet.getRange(targetRowIdx, colStatus + 1).setValue(newStatus);
                updatedRows[targetRowIdx] = true;
                count++;
                hit = true;
              }
            }

            if (!hit && colId !== -1 && targetId) {
              for (let i = 1; i < rows.length; i++) {
                const rIdx = i + 1;
                if (updatedRows[rIdx]) continue;
                if (String(rows[i][colId]).trim() === targetId) {
                  const rowNama = colNama !== -1 ? String(rows[i][colNama] || '').trim().toUpperCase() : '';
                  if (!hintNama || !rowNama || rowNama === hintNama) {
                    sheet.getRange(rIdx, colStatus + 1).setValue(newStatus);
                    updatedRows[rIdx] = true;
                    count++;
                    break;
                  }
                }
              }
            }
          });
        } else if (colId !== -1 && ids.length > 0) {
          const idSet = {};
          ids.forEach(id => { idSet[id] = true; });
          for (let i = 1; i < rows.length; i++) {
            const rowId = String(rows[i][colId]).trim();
            if (idSet[rowId]) {
              sheet.getRange(i + 1, colStatus + 1).setValue(newStatus);
              count++;
            }
          }
        }
      }

      SpreadsheetApp.flush();
      return jsonResponse({
        status: 'success',
        updatedCount: count,
        message: count + ' santri berhasil diperbarui statusnya.'
      });
    }

    // -------------------------------------------------------------------------
    // 4. HAPUS SANTRI
    // -------------------------------------------------------------------------
    if (action === 'delete_single' || action === 'delete_santri') {
      const sheet = getSheetByName(SHEET_PENDAFTARAN);
      const rows = sheet.getDataRange().getValues();
      const headers = rows[0].map(h => String(h).trim());
      const colId = headers.findIndex(h => h.toLowerCase() === 'id_pendaftaran');
      const colNama = headers.findIndex(h => h.toLowerCase() === 'nama_santri' || h.toLowerCase() === 'nama_lengkap');
      const idPendaftaran = String(contents.ID_Pendaftaran || '').trim();
      const targetRowIdx = contents.rowIndex ? parseInt(contents.rowIndex, 10) : 0;
      const hintNama = String(contents.Match_Nama || contents.Nama_Santri || contents.Nama_Lengkap || '').trim().toUpperCase();
      let deleted = false;

      if (targetRowIdx >= 2 && targetRowIdx <= rows.length) {
        const r = rows[targetRowIdx - 1];
        const rowId = colId !== -1 ? String(r[colId] || '').trim() : '';
        const rowNama = colNama !== -1 ? String(r[colNama] || '').trim().toUpperCase() : '';
        if ((idPendaftaran && rowId === idPendaftaran) || (hintNama && rowNama === hintNama)) {
          sheet.deleteRow(targetRowIdx);
          deleted = true;
        }
      }

      if (!deleted && colId !== -1 && idPendaftaran) {
        for (let i = 1; i < rows.length; i++) {
          if (String(rows[i][colId]).trim() === idPendaftaran) {
            const rowNama = colNama !== -1 ? String(rows[i][colNama] || '').trim().toUpperCase() : '';
            if (!hintNama || !rowNama || rowNama === hintNama) {
              sheet.deleteRow(i + 1);
              deleted = true;
              break;
            }
          }
        }
      }

      SpreadsheetApp.flush();
      return jsonResponse({
        status: deleted ? 'success' : 'not_found',
        message: deleted ? 'Data santri berhasil dihapus.' : 'Data tidak ditemukan.'
      });
    }

    // -------------------------------------------------------------------------
    // 5. UNDI NOMOR PESERTA
    // -------------------------------------------------------------------------
    if (action === 'undi_nomor') {
      const startNum = contents.startNumber ? parseInt(contents.startNumber, 10) : 1;
      const category = contents.category ? String(contents.category).trim() : 'ALL';
      const count = undiNomorUrutOtomatis(startNum, category);
      return jsonResponse({
        status: 'success',
        countAssigned: count,
        message: 'Pengundian nomor peserta selesai (' + count + ' undian unik, tanpa duplikat di seluruh cabang).'
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
      const kontak = normalizePhoneLocal08_(contents.kontak || '');

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
        sheet.getRange(foundIndex, 5).setNumberFormat('@').setValue(kontak);
      } else {
        const newId = id || ('ust-' + (sheet.getLastRow()));
        sheet.appendRow([newId, nama, tingkat, kelas, kontak]);
        if (kontak) {
          sheet.getRange(sheet.getLastRow(), 5).setNumberFormat('@').setValue(kontak);
        }
      }

      SpreadsheetApp.flush();

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

      if (deleted) SpreadsheetApp.flush();

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

      SpreadsheetApp.flush();

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

      if (deleted) SpreadsheetApp.flush();

      return jsonResponse({
        status: deleted ? 'success' : 'not_found',
        message: deleted ? 'Kelas diniyah berhasil dihapus.' : 'Kelas tidak ditemukan.'
      });
    }

    // Sinkronkan Kelas Diniyah custom atau Reset ke 30 Kelas Diniyah Resmi
    if (action === 'sync_all_kelas') {
      if (contents.data && typeof contents.data === 'object' && !Array.isArray(contents.data)) {
        const sheet = getSheetByName(SHEET_TINGKAT_KELAS);
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          sheet.deleteRows(2, lastRow - 1);
        }
        const labelMap = {
          ula: 'Tingkat Ula',
          wustho: 'Tingkat Wustho',
          ulya: 'Tingkat Ulya',
          mhq_juz: 'Tingkat Hifdzil Qur\'an (MHQ)'
        };
        let totalWritten = 0;
        Object.keys(contents.data).forEach(tKey => {
          const tingkatId = String(tKey || '').trim().toLowerCase();
          const list = Array.isArray(contents.data[tKey]) ? contents.data[tKey] : [];
          const namaTingkat = labelMap[tingkatId] || ('Tingkat ' + tingkatId.toUpperCase());
          list.forEach(namaKelas => {
            const cleanName = String(namaKelas || '').trim();
            if (!cleanName) return;
            const ket = tingkatId === 'mhq_juz'
              ? 'Khusus Cabang MHQ Berdasarkan Juz'
              : namaTingkat + (cleanName.toLowerCase().includes('putri') ? ' (Santri Putri)' : ' (Santri Putra)');
            sheet.appendRow([tingkatId, namaTingkat, cleanName, ket]);
            totalWritten++;
          });
        });
        SpreadsheetApp.flush();
        return jsonResponse({
          status: 'success',
          total: totalWritten,
          message: 'Seluruh ' + totalWritten + ' Kelas Diniyah berhasil disinkronkan ke Google Sheets.'
        });
      }
      isiMasterDataAwal();
      return jsonResponse({
        status: 'success',
        message: 'Seluruh 30 Kelas Diniyah dan 24 Ustadz resmi berhasil disinkronkan ke Google Sheets.'
      });
    }

    if (action === 'reset_30_kelas') {
      isiMasterDataAwal();
      return jsonResponse({
        status: 'success',
        message: 'Seluruh 30 Kelas Diniyah dan 24 Ustadz resmi berhasil dipulihkan ke Google Sheets.'
      });
    }

    // -------------------------------------------------------------------------
    // 8. CRUD JUARA LOMBA
    // -------------------------------------------------------------------------
    if (action === 'save_juara') {
      const sheet = getSheetByName(SHEET_JUARA);
      const entries = Array.isArray(contents.data) ? contents.data : [contents];
      
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

    // -------------------------------------------------------------------------
    // 10. CRUD PENCATATAN PENGELUARAN (SHEET: Pencatatan_Pengeluaran)
    // -------------------------------------------------------------------------
    if (action === 'save_pengeluaran') {
      const sheet = getSheetByName(SHEET_PENGELUARAN);
      const entries = Array.isArray(contents.data) ? contents.data : [contents];

      if (contents.isFullSync) {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          sheet.deleteRows(2, lastRow - 1);
        }
        entries.forEach((item, idx) => {
          const id = String(item.idPengeluaran || ('OUT-' + (idx + 1))).trim();
          const hargaSatuan = Number(item.hargaSatuan) || 0;
          const qty = Number(item.qty) || 0;
          const total = Number(item.total) || (hargaSatuan * qty);
          sheet.appendRow([
            id,
            String(item.tanggal || '').trim(),
            String(item.namaAkun || '').trim(),
            String(item.satuan || '').trim(),
            hargaSatuan,
            qty,
            total,
            String(item.keterangan || '').trim()
          ]);
        });
      } else {
        const rows = sheet.getDataRange().getValues();
        const item = entries[0] || {};
        const id = String(item.idPengeluaran || ('OUT-' + Date.now())).trim();
        const hargaSatuan = Number(item.hargaSatuan) || 0;
        const qty = Number(item.qty) || 0;
        const total = Number(item.total) || (hargaSatuan * qty);

        let foundRow = -1;
        for (let i = 1; i < rows.length; i++) {
          if (String(rows[i][0]).trim() === id) {
            foundRow = i + 1;
            break;
          }
        }
        const rowData = [
          id,
          String(item.tanggal || '').trim(),
          String(item.namaAkun || '').trim(),
          String(item.satuan || '').trim(),
          hargaSatuan,
          qty,
          total,
          String(item.keterangan || '').trim()
        ];
        if (foundRow > 0) {
          sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
        } else {
          sheet.appendRow(rowData);
        }
      }

      sheet.getRange('E2:G').setNumberFormat('#,##0');
      SpreadsheetApp.flush();
      return jsonResponse({
        status: 'success',
        sheet: SHEET_PENGELUARAN,
        message: 'Data pengeluaran berhasil disimpan ke Google Sheets.'
      });
    }

    if (action === 'delete_pengeluaran') {
      const sheet = getSheetByName(SHEET_PENGELUARAN);
      const rows = sheet.getDataRange().getValues();
      const id = String(contents.idPengeluaran || '').trim();
      let deleted = false;
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === id) {
          sheet.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }
      SpreadsheetApp.flush();
      return jsonResponse({
        status: deleted ? 'success' : 'not_found',
        sheet: SHEET_PENGELUARAN,
        message: deleted ? 'Pengeluaran berhasil dihapus.' : 'Data tidak ditemukan.'
      });
    }

    // -------------------------------------------------------------------------
    // 11. CRUD PENCATATAN KEBUTUHAN SEBELUM HARI-H (SHEET: Pencatatan_Kebutuhan)
    // -------------------------------------------------------------------------
    if (action === 'save_kebutuhan') {
      const sheet = getSheetByName(SHEET_KEBUTUHAN);
      const entries = Array.isArray(contents.data) ? contents.data : [contents];

      if (contents.isFullSync) {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          sheet.deleteRows(2, lastRow - 1);
        }
        entries.forEach((item, idx) => {
          const id = String(item.idKebutuhan || ('KEB-' + (idx + 1))).trim();
          sheet.appendRow([
            id,
            String(item.namaKebutuhan || '').trim(),
            String(item.kategori || 'Perlengkapan').trim(),
            Number(item.qty) || 1,
            String(item.satuan || 'Pcs').trim(),
            String(item.targetTanggal || '').trim(),
            String(item.penanggungJawab || '').trim(),
            String(item.status || 'Belum Siap').trim(),
            String(item.keterangan || '').trim()
          ]);
        });
      } else {
        const rows = sheet.getDataRange().getValues();
        const item = entries[0] || {};
        const id = String(item.idKebutuhan || ('KEB-' + Date.now())).trim();

        let foundRow = -1;
        for (let i = 1; i < rows.length; i++) {
          if (String(rows[i][0]).trim() === id) {
            foundRow = i + 1;
            break;
          }
        }
        const rowData = [
          id,
          String(item.namaKebutuhan || '').trim(),
          String(item.kategori || 'Perlengkapan').trim(),
          Number(item.qty) || 1,
          String(item.satuan || 'Pcs').trim(),
          String(item.targetTanggal || '').trim(),
          String(item.penanggungJawab || '').trim(),
          String(item.status || 'Belum Siap').trim(),
          String(item.keterangan || '').trim()
        ];
        if (foundRow > 0) {
          sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
        } else {
          sheet.appendRow(rowData);
        }
      }

      SpreadsheetApp.flush();
      return jsonResponse({
        status: 'success',
        sheet: SHEET_KEBUTUHAN,
        message: 'Data kebutuhan berhasil disimpan ke Google Sheets.'
      });
    }

    if (action === 'delete_kebutuhan') {
      const sheet = getSheetByName(SHEET_KEBUTUHAN);
      const rows = sheet.getDataRange().getValues();
      const id = String(contents.idKebutuhan || '').trim();
      let deleted = false;
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === id) {
          sheet.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }
      SpreadsheetApp.flush();
      return jsonResponse({
        status: deleted ? 'success' : 'not_found',
        sheet: SHEET_KEBUTUHAN,
        message: deleted ? 'Kebutuhan berhasil dihapus.' : 'Data tidak ditemukan.'
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
