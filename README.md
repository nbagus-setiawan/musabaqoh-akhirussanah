# 🏆 Portal Pendaftaran Digital Lomba Akhirusanah

Sistem pendaftaran lomba Akhirusanah berbasis web interaktif modern (**React + Tailwind CSS**) dengan arsitektur terpisah antara modul **Publik** dan modul **Admin Panitia**.

Desain antarmuka panel admin diadaptasi dari referensi dashboard modern (**SRMS - Student Management System**) bernuansa biru & kartu pastel.

---

## 📂 Struktur Modul & Folder Proyek

```
src/
├── public/                     # 🌐 MODUL PUBLIK (SANTRI & WALI KELAS)
│   ├── components/
│   │   ├── PublicNavbar.jsx    # Navbar bersih (Hanya Form & Cek Status)
│   │   ├── Hero.jsx            # Banner info acara & tema Akhirusanah
│   │   ├── RegistrationForm.jsx# Form interaktif berjenjang (Wali Kelas -> Kelas -> Lomba)
│   │   ├── SuccessTicket.jsx   # Kartu bukti pendaftaran digital (E-Tiket & Cetak PDF)
│   │   └── CheckStatus.jsx     # Pencarian status & nomor urut mandiri
│   └── PublicApp.jsx           # Entry point halaman publik
│
├── admin/                      # 🔐 MODUL ADMIN (PANITIA) - DILINDUNGI PIN
│   ├── components/
│   │   ├── AdminSidebar.jsx    # Sidebar ala SRMS Dashboard
│   │   ├── AdminHeader.jsx     # Search bar, notifikasi, dan profil panitia
│   │   ├── AdminDashboard.jsx  # Welcome banner, 5 kartu pastel, tabel santri, undian no 050
│   │   ├── AdminLogin.jsx      # Layar login PIN khusus panitia
│   │   └── GoogleSheetGuideModal.jsx # Panduan 3 langkah Google Sheet (HANYA ADA DI ADMIN)
│   └── AdminApp.jsx            # Entry point dashboard panitia
│
├── shared/                     # 📦 DATA & LAYANAN BERSAMA
│   ├── data/competitions.js    # Master 10 cabang lomba, tingkat, kelas, & wali kelas
│   └── services/api.js         # Koneksi Google Sheets & generator nomor urut acak
│
├── App.jsx                     # Master Router (Deteksi URL: Publik vs #admin)
├── index.css
└── main.jsx
```

---

## 🔒 Pemisahan Akses & Keamanan

1. **Halaman Publik (Bebas Akses Tanpa Login)**:
   - URL: `http://localhost:3000/`
   - Sama sekali **tidak ada tombol Admin**, tidak ada tombol Google Sheet, dan tidak ada teks teknis database.
   - Pendaftar hanya fokus mendaftarkan santri, mencetak kartu bukti tiket, dan mengecek nomor urut.

2. **Panel Admin Panitia (Akses Rahasia & Dilindungi PIN)**:
   - URL Rahasia: `http://localhost:3000/#admin`
   - Meminta **PIN Panitia** (Default PIN: `admin123`).
   - Panduan 3 Langkah Google Sheets dan pengaturan spreadsheet hanya bisa dibuka dari dalam panel admin ini.

---

## 🎲 Sistem Nomor Urut Pemanggilan (Mulai dari 050)

- Diundi secara acak (*random lottery*) oleh panitia di Panel Admin melalui tombol:
  **"🎲 Undi Nomor Urut (Mulai dari 050)"**.
- Santri yang berstatus **Terverifikasi** akan mendapatkan 3 digit nomor urut berurutan tanpa duplikat (`050`, `051`, `052`, dst).
- Tersedia opsi undian untuk seluruh cabang sekaligus (Global) atau per cabang lomba tertentu.
- Terdapat fitur **Cetak Lembar Juri & MC** yang otomatis mengurutkan peserta dari nomor urut terkecil ke terbesar.

---

## 🚀 Menjalankan Aplikasi

1. Buka terminal di folder proyek:
   ```bash
   npm run dev
   ```
2. Buka di browser:
   - Halaman Publik: `http://localhost:3000/`
   - Panel Admin: `http://localhost:3000/#admin`
