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

// 10 Cabang Perlombaan Resmi Al-Falah Putak
export const CABANG_LOMBA_LIST = [
  {
    id: 'mqk',
    name: 'MQK',
    fullName: 'MQK (Musabaqoh Qiro\'atil Kutub)',
    tingkatAllowed: ['ula', 'wustho', 'ulya'],
    description: 'Lomba membaca, memahami, dan menerangkan kitab kuning.'
  },
  {
    id: 'mhn',
    name: 'MHN',
    fullName: 'MHN (Musabaqoh Hifdzil Nadzom)',
    tingkatAllowed: ['ula', 'wustho', 'ulya'],
    description: 'Lomba hafalan bait-bait nadzom gramatika & aqidah.'
  },
  {
    id: 'pidato',
    name: 'PIDATO',
    fullName: 'PIDATO',
    tingkatAllowed: ['ula', 'wustho', 'ulya'],
    description: 'Lomba orasi dakwah Islamiyah (Bahasa Arab/Indonesia/Inggris).'
  },
  {
    id: 'mc',
    name: 'MC',
    fullName: 'MC (Master of Ceremony)',
    tingkatAllowed: ['ula', 'wustho', 'ulya'],
    description: 'Lomba pembawa acara formal & non-formal Islami.'
  },
  {
    id: 'syarhil',
    name: 'Syarhil Qur\'an',
    fullName: 'Syarhil Qur\'an',
    tingkatAllowed: ['ula', 'wustho', 'ulya'],
    description: 'Lomba beregu pensyarah, tilawah, dan penterjemah Al-Qur\'an.'
  },
  {
    id: 'tilawah',
    name: 'Tilawah',
    fullName: 'Tilawah',
    tingkatAllowed: ['ula', 'wustho', 'ulya'],
    description: 'Lomba seni membaca Al-Qur\'an dengan lagu dan tajwid.'
  },
  {
    id: 'kaligrafi',
    name: 'Khot/Kaligrafi',
    fullName: 'Khot/Kaligrafi',
    tingkatAllowed: ['ula', 'wustho', 'ulya'],
    description: 'Lomba seni penulisan mushaf dan hiasan dekorasi kaligrafi.'
  },
  {
    id: 'mhq',
    name: 'MHQ (Musabaqoh Hifdzil Qur\'an)',
    fullName: 'MHQ (Musabaqoh Hifdzil Qur\'an 5, 10, 15, 20, 25, 30 Juz)',
    tingkatAllowed: ['ula', 'wustho', 'ulya', 'mhq_juz'],
    isMHQ: true,
    juzCategories: [
      '5 Juz',
      '10 Juz',
      '15 Juz',
      '20 Juz',
      '25 Juz',
      '30 Juz'
    ],
    description: 'Lomba hafalan Al-Qur\'an kategori 5, 10, 15, 20, 25, dan 30 Juz.'
  },
  {
    id: 'adzan',
    name: 'Adzan',
    fullName: 'Adzan',
    tingkatAllowed: ['ula', 'wustho', 'ulya'],
    description: 'Lomba lantunan adzan subuh dan umum dengan makhroj & nada terbaik.'
  },
  {
    id: 'kreasi_nadzom',
    name: 'Kreasi Nadzom',
    fullName: 'Kreasi Nadzom',
    tingkatAllowed: ['ula', 'wustho', 'ulya'],
    description: 'Lomba kreasi aransemen lagu & lantunan nadzom pesantren.'
  }
];

// Daftar Master Awal Wali Kelas (Murni Kosong, Diisi Sesuai Tambahan Panitia / Input Wali Kelas)
export const MASTER_WALI_KELAS = [];

