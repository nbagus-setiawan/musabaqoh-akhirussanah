// Konfigurasi Master Data Lomba Akhirusanah

export const STARTING_QUEUE_NUMBER = 50; // Nomor Urut Pemanggilan dimulai dari 050

export const TINGKAT_LIST = [
  { id: 'ula', name: 'Tingkat Ula', desc: 'Santri Tingkat Dasar / TPA' },
  { id: 'wustho', name: 'Tingkat Wustho', desc: 'Santri Tingkat Menengah (Sifir & Jurumiyah)' },
  { id: 'ulya', name: 'Tingkat Ulya', desc: 'Santri Tingkat Atas (Imrithi & Alfiyah)' },
  { id: 'mhq_juz', name: 'Tingkat Hifdzil Qur\'an (MHQ)', desc: 'Khusus Cabang MHQ Berdasarkan Juz' }
];

export const SUB_KELAS_BY_TINGKAT = {
  ula: [
    'TPA Kelas 1 Putra',
    'TPA Kelas 1 Putri',
    'TPA Kelas 2 Putra',
    'TPA Kelas 2 Putri',
    'TPA Kelas 3 Putra',
    'TPA Kelas 3 Putri',
    'TPA Kelas 4 Putra',
    'TPA Kelas 4 Putri'
  ],
  wustho: [
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
  ulya: [
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

// Skema Bobot Poin Juara Umum Kelas (Skema A: 5 - 3 - 1)
export const SKEMA_POIN_JUARA = {
  1: { poin: 5, label: 'Juara 1', icon: '🥇', rank: 1, title: 'Juara I (Emas)' },
  2: { poin: 3, label: 'Juara 2', icon: '🥈', rank: 2, title: 'Juara II (Perak)' },
  3: { poin: 1, label: 'Juara 3', icon: '🥉', rank: 3, title: 'Juara III (Perunggu)' }
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

// 10 Cabang Perlombaan Resmi Al-Falah Putak (Urutan Sesuai Alur 12 Langkah Pendaftaran)
export const CABANG_LOMBA_LIST = [
  {
    id: 'mqk',
    name: 'MQK',
    fullName: 'MQK (Musabaqoh Qiro\'atil Kutub)',
    tingkatAllowed: ['ula', 'wustho', 'ulya'],
    description: 'Lomba membaca, memahami, dan menerangkan kitab kuning (Maksimal 3 Santri).',
    type: 'individual',
    maxSantri: 3
  },
  {
    id: 'pidato',
    name: 'PIDATO',
    fullName: 'PIDATO (3 Bahasa: Indonesia, Arab, Inggris)',
    tingkatAllowed: ['ula', 'wustho', 'ulya'],
    description: 'Lomba orasi dakwah Islamiyah (Tersedia pilihan Bahasa Indonesia, Arab, atau Inggris - Maksimal 3 Santri).',
    type: 'language',
    maxSantri: 3
  },
  {
    id: 'mc',
    name: 'MC',
    fullName: 'MC (Master of Ceremony / Pembawa Acara 3 Bahasa)',
    tingkatAllowed: ['ula', 'wustho', 'ulya'],
    description: 'Lomba pembawa acara formal & non-formal Islami (Tersedia pilihan Bahasa Indonesia, Arab, atau Inggris - Maksimal 3 Santri).',
    type: 'language',
    maxSantri: 3
  },
  {
    id: 'syarhil',
    name: 'Syarhil Qur\'an',
    fullName: 'Syarhil Qur\'an',
    tingkatAllowed: ['ula', 'wustho', 'ulya'],
    description: 'Lomba beregu pensyarah, tilawah, dan penterjemah Al-Qur\'an (Tersedia tombol Tambah Regu).',
    type: 'regu',
    membersPerRegu: 3
  },
  {
    id: 'tilawah',
    name: 'Tilawah',
    fullName: 'Tilawah Al-Qur\'an',
    tingkatAllowed: ['ula', 'wustho', 'ulya'],
    description: 'Lomba seni membaca Al-Qur\'an dengan lagu dan tajwid (Maksimal 3 Santri).',
    type: 'individual',
    maxSantri: 3
  },
  {
    id: 'kaligrafi',
    name: 'Khot/Kaligrafi',
    fullName: 'Khot / Kaligrafi',
    tingkatAllowed: ['ula', 'wustho', 'ulya'],
    description: 'Lomba seni penulisan mushaf dan hiasan dekorasi kaligrafi (Maksimal 3 Santri).',
    type: 'individual',
    maxSantri: 3
  },
  {
    id: 'mhq',
    name: 'MHQ',
    fullName: 'MHQ (Musabaqoh Hifdzil Qur\'an)',
    tingkatAllowed: ['ula', 'wustho', 'ulya', 'mhq_juz'],
    isMHQ: true,
    juzCategories: PILIHAN_JUZ_MHQ,
    description: 'Lomba hafalan Al-Qur\'an pilihan 5, 10, 15, 20, 25, dan 30 Juz (Maksimal 3 Santri).',
    type: 'mhq',
    maxSantri: 3
  },
  {
    id: 'adzan',
    name: 'Adzan',
    fullName: 'Adzan',
    tingkatAllowed: ['ula', 'wustho', 'ulya'],
    genderExclusive: 'L',
    description: 'Lomba lantunan adzan subuh dan umum (Khusus santri putra - Maksimal 3 Santri).',
    type: 'individual',
    maxSantri: 3
  },
  {
    id: 'ccm',
    name: 'CCM',
    fullName: 'CCM (Cerdas Cermat Musabaqoh)',
    tingkatAllowed: ['ula', 'wustho', 'ulya'],
    description: 'Lomba cerdas cermat keagamaan & wawasan kepesantrenan beregu (Tersedia tombol Tambah Regu).',
    type: 'regu',
    membersPerRegu: 3
  },
  {
    id: 'kreasi_nadzom',
    name: 'Kreasi Nadzom',
    fullName: 'Kreasi Nadzom',
    tingkatAllowed: ['ula', 'wustho', 'ulya'],
    description: 'Lomba aransemen & kreasi nadzom pesantren beregu (Format Ketua Tim & Jumlah Anggota).',
    type: 'kreasi_nadzom'
  }
];

// Daftar Master Resmi Wali Kelas Pondok Pesantren Al-Falah Putak (24 Asatidz Resmi)
export const MASTER_WALI_KELAS = [
  { id: "wk-1794912189019", nama: "UST. IMAM QUSYAIRI,S.Pd", tingkat: "ulya", kelas: "Alfiyah Tsani Putri", kontak: "" },
  { id: "wk-1794912254511", nama: "UST. AGUS MANSYUR AL-HAMID", tingkat: "ulya", kelas: "Alfiyah Awwal Putri", kontak: "" },
  { id: "wk-1794912307969", nama: "UST. AGUNG PERMADI,S.Pd", tingkat: "ulya", kelas: "Imrithi A Putri", kontak: "" },
  { id: "wk-1794912371168", nama: "USTZH. LINA LAFIFATUL 'ALIYAH", tingkat: "ulya", kelas: "Imrithi B Putri", kontak: "" },
  { id: "wk-1794912404618", nama: "USTZH. LESTARI", tingkat: "wustho", kelas: "Jurumiyah A Putri", kontak: "" },
  { id: "wk-1794912466616", nama: "USTZH. NUHA MAULA AFIFAH", tingkat: "wustho", kelas: "Jurumiyah C Putri", kontak: "" },
  { id: "wk-1794912521021", nama: "USTZH. LILIS ASRIYANI", tingkat: "wustho", kelas: "Jurumiyah B Putri", kontak: "" },
  { id: "wk-1794912614171", nama: "USTZH. ANISATUL KHOLISOH", tingkat: "wustho", kelas: "Jurumiyah A Putri", kontak: "" },
  { id: "wk-1794912656252", nama: "USTZH. NIA ANISA DELA", tingkat: "wustho", kelas: "Matan Jurumiyah B Putri", kontak: "" },
  { id: "wk-1794912691810", nama: "USTZH. FEBRI NUR AINI", tingkat: "wustho", kelas: "Matan Jurumiyah C Putri", kontak: "" },
  { id: "wk-1794912760292", nama: "USTZH. SOFIANA NUR JANAH,S.Pd", tingkat: "wustho", kelas: "Sifir A Putri", kontak: "" },
  { id: "wk-1794912799620", nama: "USTZH. SITI ROWIYAH", tingkat: "wustho", kelas: "Sifir B Putri", kontak: "" },
  { id: "wk-1794913857614", nama: "UST. IRHAM SYAROF", tingkat: "wustho", kelas: "Matan Jurumiyah A Putra", kontak: "" },
  { id: "wk-1794913889849", nama: "UST. ROBUL INSAN", tingkat: "wustho", kelas: "Jurumiyah C Putra", kontak: "" },
  { id: "wk-1794913908878", nama: "UST. DANIL ALI SABILA", tingkat: "wustho", kelas: "Jurumiyah B Putra", kontak: "" },
  { id: "wk-1794913946856", nama: "UST. RABIL AFRAJA", tingkat: "wustho", kelas: "Jurumiyah A Putra", kontak: "" },
  { id: "wk-1794913990479", nama: "UST. MUHAMMAD MAJID", tingkat: "ulya", kelas: "Imrithi A Putra", kontak: "" },
  { id: "wk-1794914021091", nama: "UST. MASRURO,S.Pd", tingkat: "ulya", kelas: "Imrithi B Putra", kontak: "" },
  { id: "wk-1794914048548", nama: "UST. NURUL FALAH", tingkat: "ulya", kelas: "Alfiyah Awwal Putra", kontak: "" },
  { id: "wk-1794914080366", nama: "UST. IMAM QURTHUBI,S.Pd", tingkat: "ulya", kelas: "Alfiyah Tsani Putra", kontak: "" },
  { id: "wk-1794914311435", nama: "UST. ALDO FERDIANSYAH", tingkat: "wustho", kelas: "Sifir B Putra", kontak: "" },
  { id: "wk-1794914366031", nama: "UST. TRI ESNANDI,S.Pd", tingkat: "wustho", kelas: "Sifir A Putra", kontak: "" },
  { id: "wk-1794914401184", nama: "UST. SAMSUL ARIFIN,S.Pd", tingkat: "wustho", kelas: "Matan Jurumiyah B Putra", kontak: "" },
  { id: "wk-1794914424489", nama: "UST. MUHAMMAD SENDI", tingkat: "wustho", kelas: "Matan Jurumiyah C Putra", kontak: "" }
];


