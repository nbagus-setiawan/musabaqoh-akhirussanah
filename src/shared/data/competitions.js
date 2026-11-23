// Konfigurasi Master Data Lomba Akhirusanah Pondok Pesantren Al-Falah Putak

export const STARTING_QUEUE_NUMBER = 50; // Nomor Urut Pemanggilan dimulai dari 050

export const TINGKAT_LIST = [
  { id: 'ula', name: 'Tingkat Ula', desc: 'Santri Tingkat Ula (Sifir & Jurumiyah)' },
  { id: 'wustho', name: 'Tingkat Wustho', desc: 'Santri Tingkat Wustho (Imrithi & Alfiyah)' },
  { id: 'mhq_juz', name: 'Tingkat Hifdzil Qur\'an (MHQ)', desc: 'Khusus Cabang MHQ Berdasarkan Juz' }
];

export const SUB_KELAS_BY_TINGKAT = {
  ula: [
    'Sifir A Putra',
    'Sifir A Putri',
    'Sifir B Putra',
    'Sifir B Putri',
    'Matan Jurumiyah A Putra',
    'Matan Jurumiyah A Putri',
    'Matan Jurumiyah B Putra',
    'Matan Jurumiyah B Putri',
    'Matan Jurumiyah C Putra',
    'Matan Jurumiyah C Putri',
    'Jurumiyah A Putra',
    'Jurumiyah A Putri',
    'Jurumiyah B Putra',
    'Jurumiyah B Putri',
    'Jurumiyah C Putra',
    'Jurumiyah C Putri'
  ],
  wustho: [
    'Imrithi A Putra',
    'Imrithi A Putri',
    'Imrithi B Putra',
    'Imrithi B Putri',
    'Alfiyah Awwal Putra',
    'Alfiyah Awwal Putri',
    'Alfiyah Tsani Putra',
    'Alfiyah Tsani Putri'
  ],
  mhq_juz: [
    '5 Juz',
    '10 Juz',
    '15 Juz',
    '20 Juz',
    '25 Juz',
    '30 Juz'
  ]
};

// Skema Bobot Poin Juara Umum Kelas (Skema: 5 - 3 - 1)
export const SKEMA_POIN_JUARA = {
  1: { poin: 5, label: 'Juara 1', rank: 1, title: 'Juara I' },
  2: { poin: 3, label: 'Juara 2', rank: 2, title: 'Juara II' },
  3: { poin: 1, label: 'Juara 3', rank: 3, title: 'Juara III' }
};

// Helper Deteksi Gender Kelas ('L' untuk Putra, 'P' untuk Putri)
export const getGenderFromKelas = (namaKelas) => {
  if (!namaKelas || typeof namaKelas !== 'string') return null;
  const lower = namaKelas.toLowerCase();
  if (lower.includes('putri') || lower.includes(' pi') || lower.endsWith('pi')) {
    return 'P';
  }
  if (lower.includes('putra') || lower.includes(' pa') || lower.endsWith('pa')) {
    return 'L';
  }
  return null;
};

export const PILIHAN_BAHASA = [
  'Bahasa Indonesia',
  'Bahasa Arab',
  'Bahasa Inggris'
];

export const PILIHAN_JUZ_MHQ = [
  '5 Juz',
  '10 Juz',
  '15 Juz',
  '20 Juz',
  '25 Juz',
  '30 Juz'
];

// 11 Cabang Perlombaan Resmi Al-Falah Putak (Urutan Sesuai Alur Pendaftaran)
export const CABANG_LOMBA_LIST = [
  {
    id: 'mqk',
    name: 'MQK',
    fullName: 'MQK (Musabaqoh Qiro\'atil Kutub)',
    tingkatAllowed: ['ula', 'wustho'],
    description: 'Lomba membaca, memahami, dan menerangkan kitab kuning (Maksimal 3 Santri).',
    type: 'individual',
    maxSantri: 3,
    tatibUrl: '/tatib-mqk-2026.pdf'
  },
  {
    id: 'mhn',
    name: 'MHN',
    fullName: 'MHN (Musabaqoh Hifdzil Nadzom)',
    tingkatAllowed: ['ula', 'wustho'],
    description: 'Lomba hafalan bait nadhom fan tauhid, shorof, dan nahwu sesuai kelas diniyah (Maksimal 3 Santri).',
    type: 'individual',
    maxSantri: 3,
    tatibUrl: '/tatib-hifdil-nadhom-2026.pdf'
  },
  {
    id: 'pidato',
    name: 'PIDATO',
    fullName: 'PIDATO (3 Bahasa: Indonesia, Arab, Inggris)',
    tingkatAllowed: ['ula', 'wustho'],
    description: 'Lomba orasi dakwah Islamiyah (Tersedia pilihan Bahasa Indonesia, Arab, atau Inggris - Maksimal 3 Santri).',
    type: 'language',
    maxSantri: 3,
    tatibUrl: '/tatib-khitobah-2026.pdf'
  },
  {
    id: 'mc',
    name: 'MC',
    fullName: 'MC (Master of Ceremony / Pembawa Acara 3 Bahasa)',
    tingkatAllowed: ['ula', 'wustho'],
    description: 'Lomba pembawa acara formal & non-formal Islami (Tersedia pilihan Bahasa Indonesia, Arab, atau Inggris - Maksimal 3 Santri).',
    type: 'language',
    maxSantri: 3,
    tatibUrl: '/tatib-mc-2026.pdf'
  },
  {
    id: 'syarhil',
    name: 'Syarhil Qur\'an',
    fullName: 'Syarhil Qur\'an',
    tingkatAllowed: ['ula', 'wustho'],
    description: 'Lomba beregu pensyarah, tilawah, dan penterjemah Al-Qur\'an (Maksimal 3 Regu - Tersedia tombol Tambah Regu).',
    type: 'regu',
    membersPerRegu: 3,
    tatibUrl: '/tatib-syarhil-quran-2026.pdf'
  },
  {
    id: 'tilawah',
    name: 'Tilawah',
    fullName: 'Tilawah Al-Qur\'an',
    tingkatAllowed: ['ula', 'wustho'],
    description: 'Lomba seni membaca Al-Qur\'an dengan lagu dan tajwid (Maksimal 3 Santri).',
    type: 'individual',
    maxSantri: 3,
    tatibUrl: '/tatib-tilawah-2026.pdf'
  },
  {
    id: 'kaligrafi',
    name: 'Khot/Kaligrafi',
    fullName: 'Khot / Kaligrafi',
    tingkatAllowed: ['ula', 'wustho'],
    description: 'Lomba seni penulisan mushaf dan hiasan dekorasi kaligrafi (Maksimal 3 Santri).',
    type: 'individual',
    maxSantri: 3,
    tatibUrl: '/tatib-kaligrafi-2026.pdf'
  },
  {
    id: 'mhq',
    name: 'MHQ',
    fullName: 'MHQ (Musabaqoh Hifdzil Qur\'an)',
    tingkatAllowed: ['ula', 'wustho', 'mhq_juz'],
    isMHQ: true,
    juzCategories: PILIHAN_JUZ_MHQ,
    description: 'Lomba hafalan Al-Qur\'an pilihan 5, 10, 15, 20, 25, dan 30 Juz (Maksimal 3 Santri).',
    type: 'mhq',
    maxSantri: 3,
    tatibUrl: '/tatib-mhq-2026.pdf'
  },
  {
    id: 'adzan',
    name: 'Adzan',
    fullName: 'Adzan',
    tingkatAllowed: ['ula', 'wustho'],
    genderExclusive: 'L',
    description: 'Lomba lantunan adzan subuh dan umum (Khusus santri putra - Maksimal 3 Santri).',
    type: 'individual',
    maxSantri: 3,
    tatibUrl: '/tatib-adzan-2026.pdf'
  },
  {
    id: 'ccm',
    name: 'CCM',
    fullName: 'CCM (Cerdas Cermat Musabaqoh)',
    tingkatAllowed: ['ula', 'wustho'],
    description: 'Lomba cerdas cermat keagamaan & wawasan kepesantrenan beregu (Maksimal 3 Regu - Tersedia tombol Tambah Regu).',
    type: 'regu',
    membersPerRegu: 3,
    tatibUrl: '/tatib-cerdas-cermat-2026.pdf'
  },
  {
    id: 'kreasi_nadzom',
    name: 'Kreasi Nadzom',
    fullName: 'Kreasi Nadzom',
    tingkatAllowed: ['ula', 'wustho'],
    description: 'Lomba aransemen & kreasi nadzom pesantren beregu (Format Ketua Tim & Jumlah Anggota).',
    type: 'kreasi_nadzom',
    tatibUrl: '/tatib-kreasi-nadhom-2026.pdf'
  }
];

// Daftar Awal Wali Kelas (Sebagai fallback inisialisasi awal ke sheet Ustadz)
export const MASTER_WALI_KELAS = [
  { id: "ust-01", nama: "UST. TRI ESNANDI,S.Pd", tingkat: "ula", kelas: "Sifir A Putra", kontak: "" },
  { id: "ust-02", nama: "USTZH. SOFIANA NUR JANAH,S.Pd", tingkat: "ula", kelas: "Sifir A Putri", kontak: "" },
  { id: "ust-03", nama: "UST. ALDO FERDIANSYAH", tingkat: "ula", kelas: "Sifir B Putra", kontak: "" },
  { id: "ust-04", nama: "USTZH. SITI ROWIYAH", tingkat: "ula", kelas: "Sifir B Putri", kontak: "" },
  { id: "ust-05", nama: "UST. IRHAM SYAROF", tingkat: "ula", kelas: "Matan Jurumiyah A Putra", kontak: "" },
  { id: "ust-06", nama: "USTZH. ANISATUL KHOLISOH", tingkat: "ula", kelas: "Matan Jurumiyah A Putri", kontak: "" },
  { id: "ust-07", nama: "UST. SAMSUL ARIFIN,S.Pd", tingkat: "ula", kelas: "Matan Jurumiyah B Putra", kontak: "" },
  { id: "ust-08", nama: "USTZH. NIA ANISA DELA", tingkat: "ula", kelas: "Matan Jurumiyah B Putri", kontak: "" },
  { id: "ust-09", nama: "UST. MUHAMMAD SENDI", tingkat: "ula", kelas: "Matan Jurumiyah C Putra", kontak: "" },
  { id: "ust-10", nama: "USTZH. FEBRI NUR AINI", tingkat: "ula", kelas: "Matan Jurumiyah C Putri", kontak: "" },
  { id: "ust-11", nama: "UST. RABIL AFRAJA", tingkat: "ula", kelas: "Jurumiyah A Putra", kontak: "" },
  { id: "ust-12", nama: "USTZH. LESTARI", tingkat: "ula", kelas: "Jurumiyah A Putri", kontak: "" },
  { id: "ust-13", nama: "UST. DANIL ALI SABILA", tingkat: "ula", kelas: "Jurumiyah B Putra", kontak: "" },
  { id: "ust-14", nama: "USTZH. LILIS ASRIYANI", tingkat: "ula", kelas: "Jurumiyah B Putri", kontak: "" },
  { id: "ust-15", nama: "UST. ROBUL INSAN", tingkat: "ula", kelas: "Jurumiyah C Putra", kontak: "" },
  { id: "ust-16", nama: "USTZH. NUHA MAULA AFIFAH", tingkat: "ula", kelas: "Jurumiyah C Putri", kontak: "" },
  { id: "ust-17", nama: "UST. MUHAMMAD MAJID", tingkat: "wustho", kelas: "Imrithi A Putra", kontak: "" },
  { id: "ust-18", nama: "UST. AGUNG PERMADI,S.Pd", tingkat: "wustho", kelas: "Imrithi A Putri", kontak: "" },
  { id: "ust-19", nama: "UST. MASRURO,S.Pd", tingkat: "wustho", kelas: "Imrithi B Putra", kontak: "" },
  { id: "ust-20", nama: "USTZH. LINA LAFIFATUL 'ALIYAH", tingkat: "wustho", kelas: "Imrithi B Putri", kontak: "" },
  { id: "ust-21", nama: "UST. NURUL FALAH", tingkat: "wustho", kelas: "Alfiyah Awwal Putra", kontak: "" },
  { id: "ust-22", nama: "UST. AGUS MANSYUR AL-HAMID", tingkat: "wustho", kelas: "Alfiyah Awwal Putri", kontak: "" },
  { id: "ust-23", nama: "UST. IMAM QURTHUBI,S.Pd", tingkat: "wustho", kelas: "Alfiyah Tsani Putra", kontak: "" },
  { id: "ust-24", nama: "UST. IMAM QUSYAIRI", tingkat: "wustho", kelas: "Alfiyah Tsani Putri", kontak: "" }
];

// Daftar Berkas Tata Tertib Resmi Musabaqah Akhirussanah 1447 H / 2026 M (Akses Langsung Tanpa Unduh)
export const DAFTAR_TATA_TERTIB_RESMI = [
  {
    id: 'tatib-mqk',
    judul: 'Tata Tertib MQK (Musabaqoh Qiro\'atil Kutub) 2026',
    kategori: 'Individu • Ula & Wustho',
    deskripsi: 'Ketentuan materi fan fiqih (Safinah, Sulam Munajat, Taqrib, Fathul Qorib, Fathul Mu\'in), durasi 8 menit, dan teknis maqro\'.',
    url: '/tatib-mqk-2026.pdf',
    fileName: 'tatib-mqk-2026.pdf'
  },
  {
    id: 'tatib-mhn',
    judul: 'Tata Tertib Hifdzil Nadhom 2026',
    kategori: 'Individu • Ula & Wustho',
    deskripsi: 'Ketentuan materi nadhom (Aqidatul Awam, Tasrif Tsulasi Mujarrod, Matan Jurumiyyah, Imrithi, Alfiyyah Ibnu Malik), dan durasi 8 menit.',
    url: '/tatib-hifdil-nadhom-2026.pdf',
    fileName: 'tatib-hifdil-nadhom-2026.pdf'
  },
  {
    id: 'tatib-ccm',
    judul: 'Tata Tertib Cerdas Cermat Musabaqoh (CCM) 2026',
    kategori: 'Regu (3 Santri) • Sistem Gugur',
    deskripsi: 'Ketentuan babak penyisihan (10 soal wajib, 30 detik) dan babak rebutan (10 soal, benar +100, salah -50 poin).',
    url: '/tatib-cerdas-cermat-2026.pdf',
    fileName: 'tatib-cerdas-cermat-2026.pdf'
  },
  {
    id: 'tatib-kaligrafi',
    judul: 'Tata Tertib Lomba Khot / Kaligrafi 2026',
    kategori: 'Individu • Maks. 3 Delegasi/Kelas',
    deskripsi: 'Khot naskah bebas (Naskhi, Diwani, Tsuluts, Riq\'ah, Diwani Jali, Farisi, Kufi) dengan durasi pengerjaan maksimal 5 jam.',
    url: '/tatib-kaligrafi-2026.pdf',
    fileName: 'tatib-kaligrafi-2026.pdf'
  },
  {
    id: 'tatib-khitobah',
    judul: 'Tata Tertib Pidato / Khitobah 3 Bahasa 2026',
    kategori: 'Individu • Indonesia, Arab, Inggris',
    deskripsi: 'Ketentuan materi pidato dakwah Islamiyah bebas, durasi maksimal 10 menit dengan isyarat lampu penanda waktu.',
    url: '/tatib-khitobah-2026.pdf',
    fileName: 'tatib-khitobah-2026.pdf'
  },
  {
    id: 'tatib-kreasi-nadhom',
    judul: 'Tata Tertib Kreasi Nadhom Beregu 2026',
    kategori: 'Beregu (1 Tim per Kelas Diniyah)',
    deskripsi: 'Aransemen bernuansa islami materi Alala, Aqidatul Awam, Imrithi, atau Alfiyyah dengan kriteria vokal, penampilan, dan adab.',
    url: '/tatib-kreasi-nadhom-2026.pdf',
    fileName: 'tatib-kreasi-nadhom-2026.pdf'
  },
  {
    id: 'tatib-mc',
    judul: 'Tata Tertib MC (Pembawa Acara 3 Bahasa) 2026',
    kategori: 'Individu/Kelompok • Durasi 7 Menit',
    deskripsi: 'Membawakan susunan acara formal & non-formal keagamaan dengan durasi maksimal 7 menit.',
    url: '/tatib-mc-2026.pdf',
    fileName: 'tatib-mc-2026.pdf'
  },
  {
    id: 'tatib-syarhil-quran',
    judul: 'Tata Tertib Syarhil Qur\'an (MSQ) 2026',
    kategori: 'Beregu (Pensyarah, Tilawah, Terjemah)',
    deskripsi: 'Ketentuan penyampaian pensyarahan Al-Qur\'an beregu dengan durasi maksimal 10 menit.',
    url: '/tatib-syarhil-quran-2026.pdf',
    fileName: 'tatib-syarhil-quran-2026.pdf'
  },
  {
    id: 'tatib-tilawah',
    judul: 'Tata Tertib Tilawah Al-Qur\'an 2026',
    kategori: 'Individu • Bin-Nadzor',
    deskripsi: 'Seni tilawatil Qur\'an maqro bebas dengan durasi maksimal 7 menit bertempat di panggung utama musabaqah.',
    url: '/tatib-tilawah-2026.pdf',
    fileName: 'tatib-tilawah-2026.pdf'
  },
  {
    id: 'tatib-adzan',
    judul: 'Tata Tertib Lomba Adzan 2026',
    kategori: 'Individu • Khusus Putra (Maks. 3 Santri)',
    deskripsi: 'Ketentuan materi lafadz adzan lengkap dengan lagu bebas, bertempat di panggung utama musabaqah dengan durasi maksimal 5 menit.',
    url: '/tatib-adzan-2026.pdf',
    fileName: 'tatib-adzan-2026.pdf'
  },
  {
    id: 'tatib-mhq',
    judul: 'Tata Tertib MHQ (Musabaqoh Hifdzil Qur\'an) 2026',
    kategori: 'Individu • 6 Kategori Juz',
    deskripsi: 'Ketentuan 6 kategori hafalan (5, 10, 15, 20, 25, dan 30 Juz) dengan kriteria penilaian tahfidz, fashohah, dan adab.',
    url: '/tatib-mhq-2026.pdf',
    fileName: 'tatib-mhq-2026.pdf'
  }
];
