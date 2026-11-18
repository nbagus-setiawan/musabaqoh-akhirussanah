/**
 * =========================================================================
 * BACKEND GOOGLE APPS SCRIPT (MULTI-SHEET RESMI & SIAP PRODUKSI)
 * MUSABAQAH AKHIRUSSANAH PONDOK PESANTREN AL-FALAH PUTAK
 * Tahun Ajaran 1447 H / 2026 M
 * =========================================================================
 * Deskripsi:
 * Script ini secara otomatis mengelola 3 LEMBAR KERJA (SHEET / TAB) di Google Spreadsheet:
 * 1. Sheet "Pendaftaran"       -> Data Pendaftaran Santri Riil (12 Kolom)
 * 2. Sheet "Data_Guru"         -> Master Data Asatidz / Wali Kelas (5 Kolom)
 * 3. Sheet "Tingkat_dan_Kelas" -> Master Jenjang Pendidikan & Rombel Belajar (4 Kolom)
 *
 * PANDUAN PEMASANGAN OLEH PANITIA:
 * 1. Buat Google Spreadsheet baru di Google Drive Panitia Al-Falah Putak.
 *    Beri nama Spreadsheet: "Musabaqah Akhirussanah 1447 H - Al-Falah Putak"
 * 2. Buka menu: Extensions (Ekstensi) > Apps Script
 * 3. Hapus seluruh kode bawaan yang ada di editor, lalu paste seluruh isi script ini.
 * 4. Klik tombol "Save" (ikon disket).
 * 5. CARA CEPAT MUNCULKAN 3 SHEET SEKETIKA:
 *    - Pada dropdown pilihan fungsi di atas editor Apps Script, pilih "inisialisasiTigaLembarKerja".
 *    - Klik tombol ▶ "Run" (Jalankan).
 *    - Seketika di Google Sheets akan muncul 3 TAB Sheet:
 *      * Pendaftaran (12 kolom)
 *      * Data_Guru (5 kolom & 16 asatidz)
 *      * Tingkat_dan_Kelas (4 kolom & 22 rombel)
 * 6. Klik tombol "Deploy" (kanan atas) > "New deployment"
 * 7. Klik ikon gerigi (Select type) > Pilih "Web app"
 * 8. Konfigurasi Deployment:
 *    - Description: "Musabaqah Webhook Multi-Sheet v2"
 *    - Execute as: "Me (email panitia)"
 *    - Who has access: "Anyone" (WAJIB dipilih "Anyone" agar formulir dapat mengirim data tanpa login akun Google)
 * 9. Klik "Deploy". Jika muncul "Authorize access", berikan izin akses ke spreadsheet Anda.
 * 10. Salin "Web app URL" (akhiran /exec) dan tempelkan ke menu Pengaturan di Panel Admin aplikasi web.
 *
 * DAFTAR OPERASI CRUD RESMI YANG DIDUKUNG:
 * A. Sheet "Pendaftaran" (Santri):
 *    - CREATE : action: 'register'
 *    - READ   : action: 'get_all'
 *    - EDIT   : action: 'edit_santri' / 'update_santri' (Dapat mengedit semua 12 kolom santri)
 *    - DELETE : action: 'delete_single' (Hapus baris pendaftaran santri)
 * B. Sheet "Data_Guru" (Wali Kelas):
 *    - CREATE : action: 'save_guru' (Tambah wali kelas baru)
 *    - READ   : action: 'get_guru'
 *    - EDIT   : action: 'edit_guru' / 'update_guru' / 'save_guru' (Edit nama, rombel, nomor WA)
 *    - DELETE : action: 'delete_guru' / 'hapus_guru' (Hapus data wali kelas)
 * C. Sheet "Tingkat_dan_Kelas" (Jenjang & Rombel):
 *    - CREATE : action: 'save_kelas' (Tambah rombel baru ke tingkat)
 *    - READ   : action: 'get_tingkat_kelas'
 *    - EDIT   : action: 'edit_kelas' / 'update_kelas' / 'save_kelas' (Ganti nama rombel/keterangan)
 *    - DELETE : action: 'delete_kelas' / 'hapus_kelas' (Hapus rombel kelas)
 * =========================================================================
 */

// NAMA RESMI 3 LEMBAR KERJA (SHEET)
const SHEET_PENDAFTARAN = 'Pendaftaran';
const SHEET_DATA_GURU = 'Data_Guru';
const SHEET_TINGKAT_KELAS = 'Tingkat_dan_Kelas';

// 1. HEADER SHEET PENDAFTARAN SANTRI (12 KOLOM)
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

// 2. HEADER SHEET DATA GURU / WALI KELAS (5 KOLOM)
const HEADERS_GURU = [
  'ID_Guru',
  'Nama_Guru',
  'Tingkat',
  'Kelas_Diampu',
  'Kontak_WA'
];

// 3. HEADER SHEET TINGKAT DAN KELAS ROMBEL (4 KOLOM)
const HEADERS_TINGKAT_KELAS = [
  'Kode_Tingkat',
  'Nama_Tingkat',
  'Nama_Kelas_Rombel',
  'Keterangan'
];

// DATA AWAL MASTER WALI KELAS (Kosong murni - Data riil diinput via Admin / Formulir)
const MASTER_GURU_AWAL = [];

// DATA AWAL MASTER TINGKAT & ROMBEL KELAS RESMI (Format Opsi A: Putra & Putri Terpisah Rapi)
const MASTER_TINGKAT_KELAS_AWAL = [
  // Tingkat Ula (Dasar / TPA)
  ['ula', 'Tingkat Ula', 'TPA Kelas 1 Putra', 'Santri Tingkat Dasar / TPA (Putra)'],
  ['ula', 'Tingkat Ula', 'TPA Kelas 1 Putri', 'Santri Tingkat Dasar / TPA (Putri)'],
  ['ula', 'Tingkat Ula', 'TPA Kelas 2 Putra', 'Santri Tingkat Dasar / TPA (Putra)'],
  ['ula', 'Tingkat Ula', 'TPA Kelas 2 Putri', 'Santri Tingkat Dasar / TPA (Putri)'],
  ['ula', 'Tingkat Ula', 'TPA Kelas 3 Putra', 'Santri Tingkat Dasar / TPA (Putra)'],
  ['ula', 'Tingkat Ula', 'TPA Kelas 3 Putri', 'Santri Tingkat Dasar / TPA (Putri)'],
  ['ula', 'Tingkat Ula', 'TPA Kelas 4 Putra', 'Santri Tingkat Dasar / TPA (Putra)'],
  ['ula', 'Tingkat Ula', 'TPA Kelas 4 Putri', 'Santri Tingkat Dasar / TPA (Putri)'],

  // Tingkat Wustho (Menengah: Sifir & Jurumiyah)
  ['wustho', 'Tingkat Wustho', 'Sifir A Putra', 'Santri Tingkat Menengah (Sifir & Jurumiyah Putra)'],
  ['wustho', 'Tingkat Wustho', 'Sifir A Putri', 'Santri Tingkat Menengah (Sifir & Jurumiyah Putri)'],
  ['wustho', 'Tingkat Wustho', 'Sifir B Putra', 'Santri Tingkat Menengah (Sifir & Jurumiyah Putra)'],
  ['wustho', 'Tingkat Wustho', 'Sifir B Putri', 'Santri Tingkat Menengah (Sifir & Jurumiyah Putri)'],
  ['wustho', 'Tingkat Wustho', 'Matan Jurumiyah A Putra', 'Santri Tingkat Menengah (Sifir & Jurumiyah Putra)'],
  ['wustho', 'Tingkat Wustho', 'Matan Jurumiyah A Putri', 'Santri Tingkat Menengah (Sifir & Jurumiyah Putri)'],
  ['wustho', 'Tingkat Wustho', 'Matan Jurumiyah B Putra', 'Santri Tingkat Menengah (Sifir & Jurumiyah Putra)'],
  ['wustho', 'Tingkat Wustho', 'Matan Jurumiyah B Putri', 'Santri Tingkat Menengah (Sifir & Jurumiyah Putri)'],
  ['wustho', 'Tingkat Wustho', 'Matan Jurumiyah C Putra', 'Santri Tingkat Menengah (Sifir & Jurumiyah Putra)'],
  ['wustho', 'Tingkat Wustho', 'Matan Jurumiyah C Putri', 'Santri Tingkat Menengah (Sifir & Jurumiyah Putri)'],
  ['wustho', 'Tingkat Wustho', 'Jurumiyah A Putra', 'Santri Tingkat Menengah (Sifir & Jurumiyah Putra)'],
  ['wustho', 'Tingkat Wustho', 'Jurumiyah A Putri', 'Santri Tingkat Menengah (Sifir & Jurumiyah Putri)'],
  ['wustho', 'Tingkat Wustho', 'Jurumiyah B Putra', 'Santri Tingkat Menengah (Sifir & Jurumiyah Putra)'],
  ['wustho', 'Tingkat Wustho', 'Jurumiyah B Putri', 'Santri Tingkat Menengah (Sifir & Jurumiyah Putri)'],
  ['wustho', 'Tingkat Wustho', 'Jurumiyah C Putra', 'Santri Tingkat Menengah (Sifir & Jurumiyah Putra)'],
  ['wustho', 'Tingkat Wustho', 'Jurumiyah C Putri', 'Santri Tingkat Menengah (Sifir & Jurumiyah Putri)'],

  // Tingkat Ulya (Atas: Imrithi & Alfiyah)
  ['ulya', 'Tingkat Ulya', 'Imrithi A Putra', 'Santri Tingkat Atas (Imrithi & Alfiyah Putra)'],
  ['ulya', 'Tingkat Ulya', 'Imrithi A Putri', 'Santri Tingkat Atas (Imrithi & Alfiyah Putri)'],
  ['ulya', 'Tingkat Ulya', 'Imrithi B Putra', 'Santri Tingkat Atas (Imrithi & Alfiyah Putra)'],
  ['ulya', 'Tingkat Ulya', 'Imrithi B Putri', 'Santri Tingkat Atas (Imrithi & Alfiyah Putri)'],
  ['ulya', 'Tingkat Ulya', 'Alfiyah Awwal Putra', 'Santri Tingkat Atas (Imrithi & Alfiyah Putra)'],
  ['ulya', 'Tingkat Ulya', 'Alfiyah Awwal Putri', 'Santri Tingkat Atas (Imrithi & Alfiyah Putri)'],
  ['ulya', 'Tingkat Ulya', 'Alfiyah Tsani Putra', 'Santri Tingkat Atas (Imrithi & Alfiyah Putra)'],
  ['ulya', 'Tingkat Ulya', 'Alfiyah Tsani Putri', 'Santri Tingkat Atas (Imrithi & Alfiyah Putri)'],

  // Tingkat MHQ Berdasarkan Juz
  ['mhq_juz', 'Tingkat Hifdzil Qur\'an (MHQ)', '5 Juz', 'Khusus Cabang MHQ Berdasarkan Juz'],
  ['mhq_juz', 'Tingkat Hifdzil Qur\'an (MHQ)', '10 Juz', 'Khusus Cabang MHQ Berdasarkan Juz'],
  ['mhq_juz', 'Tingkat Hifdzil Qur\'an (MHQ)', '15 Juz', 'Khusus Cabang MHQ Berdasarkan Juz'],
  ['mhq_juz', 'Tingkat Hifdzil Qur\'an (MHQ)', '20 Juz', 'Khusus Cabang MHQ Berdasarkan Juz'],
  ['mhq_juz', 'Tingkat Hifdzil Qur\'an (MHQ)', '25 Juz', 'Khusus Cabang MHQ Berdasarkan Juz'],
  ['mhq_juz', 'Tingkat Hifdzil Qur\'an (MHQ)', '30 Juz', 'Khusus Cabang MHQ Berdasarkan Juz']
];

/**
 * Format Header Baris 1: Hijau Zamrud (#063323), Teks Putih Tebal, Rata Tengah
 */
function applyHeaderStyle(sheet, headerArray) {
  const range = sheet.getRange(1, 1, 1, headerArray.length);
  range.setFontWeight('bold')
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
 * Mendapatkan dan Menginisialisasi Lembar Kerja (Sheet) Berdasarkan Nama
 */
function getSheetByName(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Jika sheet masih baru dan kosong, inisialisasi header & data awal
  if (sheet.getLastRow() === 0) {
    if (sheetName === SHEET_PENDAFTARAN) {
      sheet.appendRow(HEADERS_PENDAFTARAN);
      applyHeaderStyle(sheet, HEADERS_PENDAFTARAN);
      // Format Kolom Teks: C & D (ID & No Urut), J (No WA)
      sheet.getRange('C2:D').setNumberFormat('@');
      sheet.getRange('J2:J').setNumberFormat('@');
      sheet.getRange('D2:D').setHorizontalAlignment('center');
      sheet.getRange('F2:F').setHorizontalAlignment('center');
      sheet.getRange('K2:K').setHorizontalAlignment('center');
    } 
    else if (sheetName === SHEET_DATA_GURU) {
      sheet.appendRow(HEADERS_GURU);
      applyHeaderStyle(sheet, HEADERS_GURU);
      sheet.getRange('E2:E').setNumberFormat('@'); // Nomor WA format text
      sheet.getRange('A2:A').setHorizontalAlignment('center');
      sheet.getRange('C2:C').setHorizontalAlignment('center');
      // Sheet Data_Guru murni bersih hanya header, data riil bertambah saat ustadz mendaftar atau ditambah via admin
    } 
    else if (sheetName === SHEET_TINGKAT_KELAS) {
      sheet.appendRow(HEADERS_TINGKAT_KELAS);
      applyHeaderStyle(sheet, HEADERS_TINGKAT_KELAS);
      sheet.getRange('A2:A').setHorizontalAlignment('center');
      // Isi data awal tingkat & kelas jika masih kosong
      MASTER_TINGKAT_KELAS_AWAL.forEach(function(row) {
        sheet.appendRow(row);
      });
    }
  }

  return sheet;
}

/**
 * =========================================================================
 * FUNGSI UTAMA: JALANKAN INI DI EDITOR APPS SCRIPT UNTUK MEMBUAT 3 LEMBAR KERJA!
 * =========================================================================
 * Panitia dapat langsung memilih fungsi "inisialisasiTigaLembarKerja" pada
 * dropdown di atas editor Apps Script, lalu klik tombol ▶ "Run" (Jalankan).
 * Seketika 3 Sheet resmi akan terbentuk rapi di Google Sheets:
 *  1. Sheet "Pendaftaran"       (12 Kolom Header Hijau Zamrud)
 *  2. Sheet "Data_Guru"         (5 Kolom Header Bersih Siap Pakai)
 *  3. Sheet "Tingkat_dan_Kelas" (4 Kolom Header + Master 22 Rombel Belajar)
 */
function inisialisasiTigaLembarKerja() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Inisialisasi Sheet Pendaftaran
  const sPendaftaran = getSheetByName(SHEET_PENDAFTARAN);
  
  // 2. Inisialisasi Sheet Data Guru
  const sGuru = getSheetByName(SHEET_DATA_GURU);
  
  // 3. Inisialisasi Sheet Tingkat dan Kelas
  const sTingkat = getSheetByName(SHEET_TINGKAT_KELAS);
  
  // Hapus sheet kosong bawaan ("Sheet1" atau "Sheet 1") jika belum terpakai
  const sheets = ss.getSheets();
  sheets.forEach(function(s) {
    const sName = s.getName();
    if ((sName === 'Sheet1' || sName === 'Sheet 1') && s.getLastRow() === 0) {
      try {
        ss.deleteSheet(s);
      } catch (err) {}
    }
  });

  Logger.log("=================================================");
  Logger.log("✅ ALHAMDULILLAH! 3 LEMBAR KERJA RESMI BERHASIL DIBUAT:");
  Logger.log(" 1. " + SHEET_PENDAFTARAN + " -> " + sPendaftaran.getLastRow() + " baris");
  Logger.log(" 2. " + SHEET_DATA_GURU + " -> " + sGuru.getLastRow() + " baris");
  Logger.log(" 3. " + SHEET_TINGKAT_KELAS + " -> " + sTingkat.getLastRow() + " baris");
  Logger.log("=================================================");
}

/**
 * Pastikan Ketiga Sheet Sudah Siap di Spreadsheet
 */
function ensureAllSheetsExist() {
  inisialisasiTigaLembarKerja();
}

/**
 * =========================================================================
 * HANDLER GET (Tarik Data Pendaftaran, Data Guru, Tingkat & Kelas)
 * =========================================================================
 */
function doGet(e) {
  try {
    ensureAllSheetsExist();
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'get_all';

    // 1. Aksi Ping / Uji Koneksi dari Panel Admin
    if (action === 'ping' || action === 'test') {
      const sheetPendaftaran = getSheetByName(SHEET_PENDAFTARAN);
      const sheetGuru = getSheetByName(SHEET_DATA_GURU);
      const sheetTingkat = getSheetByName(SHEET_TINGKAT_KELAS);
      
      return jsonResponse({
        status: 'success',
        message: 'Koneksi 3 Sheet (Pendaftaran, Data_Guru, Tingkat_dan_Kelas) aktif!',
        spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
        sheets: [SHEET_PENDAFTARAN, SHEET_DATA_GURU, SHEET_TINGKAT_KELAS],
        totalSantri: Math.max(0, sheetPendaftaran.getLastRow() - 1),
        totalGuru: Math.max(0, sheetGuru.getLastRow() - 1),
        totalKelas: Math.max(0, sheetTingkat.getLastRow() - 1),
        timestamp: new Date().toISOString()
      });
    }

    // 2. Aksi Ambil Master Data Guru (Wali Kelas)
    if (action === 'get_guru' || action === 'get_wali_kelas') {
      const sheetGuru = getSheetByName(SHEET_DATA_GURU);
      const rows = sheetGuru.getDataRange().getValues();
      const guruList = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r[1]) continue;
        guruList.push({
          id: String(r[0] || 'wk-' + i).trim(),
          nama: String(r[1] || '').trim(),
          tingkat: String(r[2] || 'ula').trim().toLowerCase(),
          kelas: String(r[3] || '').trim(),
          kontak: String(r[4] || '').trim()
        });
      }
      return jsonResponse({
        status: 'success',
        total: guruList.length,
        data: guruList
      });
    }

    // 3. Aksi Ambil Master Tingkat dan Kelas Rombel
    if (action === 'get_tingkat_kelas') {
      const sheetTingkat = getSheetByName(SHEET_TINGKAT_KELAS);
      const rows = sheetTingkat.getDataRange().getValues();
      const tingkatKelasList = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r[2]) continue;
        tingkatKelasList.push({
          kodeTingkat: String(r[0] || '').trim().toLowerCase(),
          namaTingkat: String(r[1] || '').trim(),
          namaKelas: String(r[2] || '').trim(),
          keterangan: String(r[3] || '').trim()
        });
      }
      return jsonResponse({
        status: 'success',
        total: tingkatKelasList.length,
        data: tingkatKelasList
      });
    }

    // 4. Default: Ambil Seluruh Data Pendaftaran Santri Riil (Sheet Pendaftaran)
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

  } catch (error) {
    return jsonResponse({
      status: 'error',
      message: error.toString()
    });
  }
}

/**
 * =========================================================================
 * HANDLER POST (Pendaftaran Santri, Undian, CRUD Guru & CRUD Rombel Kelas)
 * =========================================================================
 */
function doPost(e) {
  try {
    ensureAllSheetsExist();
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
    // A. OPERASI SHEET: PENDAFTARAN SANTRI
    // -------------------------------------------------------------------------

    // A1. Registrasi Santri Baru
    if (action === 'register') {
      const sheet = getSheetByName(SHEET_PENDAFTARAN);
      const timestamp = contents.Timestamp || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');
      const waliKelas = contents.Wali_Kelas || '';
      const rowCount = Math.max(1, sheet.getLastRow());
      const idPendaftaran = contents.ID_Pendaftaran || ('AKH-' + String(rowCount).padStart(3, '0'));
      const nomorUrut = contents.Nomor_Urut || '';
      const namaLengkap = String(contents.Nama_Lengkap || '').trim().toUpperCase();
      const jenisKelamin = contents.Jenis_Kelamin || 'L';
      const tingkat = contents.Tingkat || '';
      const kelasKategori = contents.Kelas_Kategori || '';
      const cabangLomba = contents.Cabang_Lomba || '';
      const nomorWA = contents.Nomor_WA || '';
      const status = contents.Status || 'Pending';
      const catatan = contents.Catatan || '';

      sheet.appendRow([
        timestamp,
        waliKelas,
        idPendaftaran,
        nomorUrut,
        namaLengkap,
        jenisKelamin,
        tingkat,
        kelasKategori,
        cabangLomba,
        nomorWA,
        status,
        catatan
      ]);

      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, 3).setNumberFormat('@'); // ID
      sheet.getRange(lastRow, 4).setNumberFormat('@'); // Nomor Urut
      sheet.getRange(lastRow, 10).setNumberFormat('@'); // Nomor WA

      return jsonResponse({
        status: 'success',
        message: 'Pendaftaran santri berhasil disimpan ke Google Sheets!',
        data: {
          ID_Pendaftaran: idPendaftaran,
          Nomor_Urut: nomorUrut,
          Timestamp: timestamp,
          rowIndex: lastRow
        }
      });
    }

    // A2. Batch Update Nomor Urut Undian Peserta
    if (action === 'batch_update' && Array.isArray(contents.updates)) {
      const sheet = getSheetByName(SHEET_PENDAFTARAN);
      const rows = sheet.getDataRange().getValues();
      let updatedCount = 0;

      contents.updates.forEach(function(u) {
        if (!u.ID_Pendaftaran) return;
        for (let i = 1; i < rows.length; i++) {
          if (String(rows[i][2]).trim() === String(u.ID_Pendaftaran).trim()) {
            const rowNumber = i + 1;
            if (u.Nomor_Urut !== undefined) {
              const cellNomor = sheet.getRange(rowNumber, 4);
              cellNomor.setNumberFormat('@');
              cellNomor.setValue(String(u.Nomor_Urut));
            }
            if (u.Status !== undefined) {
              sheet.getRange(rowNumber, 11).setValue(String(u.Status));
            }
            updatedCount++;
            break;
          }
        }
      });

      return jsonResponse({
        status: 'success',
        message: 'Pengundian nomor urut berhasil disinkronkan ke Google Sheets!',
        updatedCount: updatedCount
      });
    }

    // A3. Edit / Update Data Pendaftaran Santri (Lengkap Semua Kolom)
    if ((action === 'edit_santri' || action === 'update_santri' || action === 'update_single' || action === 'edit_single') && (contents.ID_Pendaftaran || contents.id)) {
      const targetId = String(contents.ID_Pendaftaran || contents.id).trim();
      const sheet = getSheetByName(SHEET_PENDAFTARAN);
      const rows = sheet.getDataRange().getValues();
      let found = false;

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][2]).trim() === targetId) {
          const rowNumber = i + 1;

          // Kolom 2: Wali_Kelas
          if (contents.Wali_Kelas !== undefined || contents.waliKelas !== undefined) {
            sheet.getRange(rowNumber, 2).setValue(String(contents.Wali_Kelas || contents.waliKelas || ''));
          }
          // Kolom 4: Nomor_Urut
          if (contents.Nomor_Urut !== undefined || contents.nomorUrut !== undefined) {
            const val = contents.Nomor_Urut !== undefined ? contents.Nomor_Urut : contents.nomorUrut;
            const cellNomor = sheet.getRange(rowNumber, 4);
            cellNomor.setNumberFormat('@');
            cellNomor.setValue(val ? String(val).padStart(3, '0') : '');
          }
          // Kolom 5: Nama_Lengkap (Selalu Huruf Besar / UPPERCASE)
          if (contents.Nama_Lengkap !== undefined || contents.nama !== undefined) {
            sheet.getRange(rowNumber, 5).setValue(String(contents.Nama_Lengkap || contents.nama || '').trim().toUpperCase());
          }
          // Kolom 6: Jenis_Kelamin
          if (contents.Jenis_Kelamin !== undefined || contents.gender !== undefined) {
            sheet.getRange(rowNumber, 6).setValue(String(contents.Jenis_Kelamin || contents.gender || 'L').toUpperCase());
          }
          // Kolom 7: Tingkat
          if (contents.Tingkat !== undefined || contents.tingkat !== undefined) {
            sheet.getRange(rowNumber, 7).setValue(String(contents.Tingkat || contents.tingkat || ''));
          }
          // Kolom 8: Kelas_Kategori
          if (contents.Kelas_Kategori !== undefined || contents.kelas !== undefined) {
            sheet.getRange(rowNumber, 8).setValue(String(contents.Kelas_Kategori || contents.kelas || ''));
          }
          // Kolom 9: Cabang_Lomba
          if (contents.Cabang_Lomba !== undefined || contents.cabang !== undefined) {
            sheet.getRange(rowNumber, 9).setValue(String(contents.Cabang_Lomba || contents.cabang || ''));
          }
          // Kolom 10: Nomor_WA
          if (contents.Nomor_WA !== undefined || contents.wa !== undefined) {
            const cellWa = sheet.getRange(rowNumber, 10);
            cellWa.setNumberFormat('@');
            cellWa.setValue(String(contents.Nomor_WA || contents.wa || ''));
          }
          // Kolom 11: Status
          if (contents.Status !== undefined || contents.status !== undefined) {
            sheet.getRange(rowNumber, 11).setValue(String(contents.Status || contents.status || 'Pending'));
          }
          // Kolom 12: Catatan
          if (contents.Catatan !== undefined || contents.catatan !== undefined) {
            sheet.getRange(rowNumber, 12).setValue(String(contents.Catatan || contents.catatan || ''));
          }

          found = true;
          break;
        }
      }

      return jsonResponse({
        status: found ? 'success' : 'not_found',
        message: found ? 'Data santri berhasil diedit / diperbarui di Google Sheets.' : 'ID pendaftaran santri tidak ditemukan.'
      });
    }

    // A4. Hapus Baris Pendaftaran Santri
    if (action === 'delete_single' && contents.ID_Pendaftaran) {
      const sheet = getSheetByName(SHEET_PENDAFTARAN);
      const rows = sheet.getDataRange().getValues();
      let deleted = false;

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][2]).trim() === String(contents.ID_Pendaftaran).trim()) {
          sheet.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }

      return jsonResponse({
        status: deleted ? 'success' : 'not_found',
        message: deleted ? 'Baris santri berhasil dihapus dari Google Sheets.' : 'ID tidak ditemukan.'
      });
    }

    // -------------------------------------------------------------------------
    // B. OPERASI SHEET: DATA GURU / WALI KELAS
    // -------------------------------------------------------------------------

    // B1. Tambah / Edit Wali Kelas
    if (action === 'save_guru' || action === 'edit_guru' || action === 'update_guru') {
      const sheet = getSheetByName(SHEET_DATA_GURU);
      const rows = sheet.getDataRange().getValues();
      const guruId = contents.id || ('wk-' + Date.now());
      const nama = contents.nama || '';
      const tingkat = (contents.tingkat || 'ula').toLowerCase();
      const kelas = contents.kelas || '';
      const kontak = contents.kontak || '';
      let updated = false;

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === String(guruId).trim()) {
          const rowNumber = i + 1;
          sheet.getRange(rowNumber, 2).setValue(nama);
          sheet.getRange(rowNumber, 3).setValue(tingkat);
          sheet.getRange(rowNumber, 4).setValue(kelas);
          sheet.getRange(rowNumber, 5).setNumberFormat('@').setValue(kontak);
          updated = true;
          break;
        }
      }

      if (!updated) {
        sheet.appendRow([guruId, nama, tingkat, kelas, kontak]);
        const lastRow = sheet.getLastRow();
        sheet.getRange(lastRow, 5).setNumberFormat('@');
      }

      return jsonResponse({
        status: 'success',
        message: updated ? 'Data wali kelas berhasil diedit / diperbarui di Google Sheets.' : 'Wali kelas baru berhasil ditambahkan ke Google Sheets.',
        id: guruId
      });
    }

    // B2. Hapus Wali Kelas
    if ((action === 'delete_guru' || action === 'hapus_guru') && contents.id) {
      const sheet = getSheetByName(SHEET_DATA_GURU);
      const rows = sheet.getDataRange().getValues();
      let deleted = false;

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === String(contents.id).trim()) {
          sheet.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }

      return jsonResponse({
        status: deleted ? 'success' : 'not_found',
        message: deleted ? 'Wali kelas berhasil dihapus dari Google Sheets.' : 'ID Guru tidak ditemukan.'
      });
    }

    // -------------------------------------------------------------------------
    // C. OPERASI SHEET: TINGKAT DAN KELAS ROMBEL
    // -------------------------------------------------------------------------

    // C1. Tambah / Edit Kelas Rombel
    if (action === 'save_kelas' || action === 'edit_kelas' || action === 'update_kelas') {
      const sheet = getSheetByName(SHEET_TINGKAT_KELAS);
      const rows = sheet.getDataRange().getValues();
      const tingkatId = (contents.tingkatId || 'ula').toLowerCase();
      const namaTingkat = contents.namaTingkat || ('Tingkat ' + tingkatId.toUpperCase());
      const namaKelas = contents.namaKelas || '';
      const oldKelasName = contents.oldKelasName || '';
      const keterangan = contents.keterangan || '';
      let updated = false;

      if (oldKelasName) {
        for (let i = 1; i < rows.length; i++) {
          if (String(rows[i][0]).trim() === tingkatId && String(rows[i][2]).trim() === String(oldKelasName).trim()) {
            sheet.getRange(i + 1, 3).setValue(namaKelas);
            if (keterangan) sheet.getRange(i + 1, 4).setValue(keterangan);
            updated = true;
            break;
          }
        }
      }

      if (!updated) {
        sheet.appendRow([tingkatId, namaTingkat, namaKelas, keterangan]);
      }

      return jsonResponse({
        status: 'success',
        message: updated ? 'Rombel kelas berhasil diupdate di Google Sheets.' : 'Rombel kelas baru berhasil ditambahkan ke Google Sheets.'
      });
    }

    // C2. Hapus Kelas Rombel
    if (action === 'delete_kelas' || action === 'hapus_kelas') {
      const sheet = getSheetByName(SHEET_TINGKAT_KELAS);
      const rows = sheet.getDataRange().getValues();
      const tingkatId = (contents.tingkatId || '').toLowerCase();
      const namaKelas = contents.namaKelas || '';
      let deleted = false;

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]).trim() === tingkatId && String(rows[i][2]).trim() === String(namaKelas).trim()) {
          sheet.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }

      return jsonResponse({
        status: deleted ? 'success' : 'not_found',
        message: deleted ? 'Rombel berhasil dihapus dari Google Sheets.' : 'Rombel tidak ditemukan.'
      });
    }

    // C3. Sinkronisasi Penuh Seluruh Kelas Rombel dari Web (Push Seluruh Rombel)
    if (action === 'sync_all_kelas' && Array.isArray(contents.data)) {
      const sheet = getSheetByName(SHEET_TINGKAT_KELAS);
      const lastRow = sheet.getLastRow();
      // Hapus data lama mulai dari baris 2 jika ada
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }

      // Tulis seluruh baris baru yang dikirim dari web
      contents.data.forEach(function(item) {
        const kId = String(item.kodeTingkat || item.tingkatId || 'ula').toLowerCase().trim();
        const nTingkat = String(item.namaTingkat || '').trim();
        const nKelas = String(item.namaKelas || '').trim();
        const ket = String(item.keterangan || '').trim();
        if (nKelas) {
          sheet.appendRow([kId, nTingkat, nKelas, ket]);
        }
      });

      sheet.getRange('A2:A').setHorizontalAlignment('center');

      return jsonResponse({
        status: 'success',
        message: 'Alhamdulillah! ' + contents.data.length + ' rombel kelas berhasil disinkronkan ke Google Sheets.',
        total: contents.data.length
      });
    }

    return jsonResponse({
      status: 'error',
      message: 'Parameter aksi tidak dikenali: ' + action
    });

  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: err.toString()
    });
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
