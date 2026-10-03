# Critical Mass Makassar 🚴‍♂️🌊

> **"Bergerak Bersama, Merayakan Kota"**  
> Platform komunitas pesepeda untuk event bulanan Critical Mass di Kota Makassar, Sulawesi Selatan. Diselenggarakan setiap **Jumat terakhir setiap bulan**.

---

## 🌟 Fitur Utama

1. **Jadwal & Countdown Otomatis (Last Friday Engine)**
   - Algoritma dinamis yang otomatis menghitung tanggal Jumat terakhir setiap bulan tanpa hardcoding.
   - Live Countdown (Hari, Jam, Menit, Detik) dengan proteksi anti-hydration mismatch.

2. **Official Route, Start, & Finish**
   - **Tikum Utama / Start:** Anjungan Pantai Losari (18:30 WITA).
   - **Official Finish:** Taman Karebosi (20:30 WITA).
   - **Rute Resmi:** Konvoi melingkar ~12.4 km melewati jalanan protokol Kota Makassar.

3. **Sistem Tikum Komunitas (Meeting Points)**
   - Pesepeda dapat melihat titik kumpul di wilayah masing-masing (Panakkukang, Pettarani, Tamalanrea, Losari, Manggala).
   - Buat Tikum baru dengan menentukan titik koordinat langsung di peta tanpa ketergantungan API geocoding berbayar.
   - Gabung / keluar dari Tikum untuk koordinasi gowes bersama menuju Anjungan Losari.

4. **Live Map & Realtime Tracking**
   - Menggunakan **MapLibre GL JS** dengan vector tile **OpenFreeMap Liberty Style**.
   - Marker pesepeda berbentuk sepeda dengan animasi radar berdenyut (*pulsing radar*).
   - Visualisasi rute resmi, titik kumpul komunitas, dan garis finish secara simultan.
   - Deteksi sinyal stale: jika lokasi tidak terupdate >60 detik, indikator akan memudar.

5. **Pelacakan GPS Browser Ramah Baterai**
   - Tombol tracking **"ON THE WAY"** mengaktifkan `navigator.geolocation.watchPosition`.
   - Update ditransmisikan secara **throttled** (setiap 5–10 detik atau jika ada perpindahan >15 meter).
   - Pengguna dapat mematikan pelacakan kapan saja (*Stop Sharing Location*).
   - **Pemberitahuan privasi:** Tidak ada riwayat GPS permanen yang disimpan di database. Tabel `live_locations` bersifat ephemeral (live state sementara).

6. **Admin Operations Dashboard (`/admin`)**
   - Manajemen publikasi event (Draft, Published, Live, Completed).
   - **Interactive Route Editor:** Klik titik-titik di peta untuk menyambungkan rute GeoJSON LineString resmi tanpa API routing berbayar.
   - Moderasi Tikum yang dibuat komunitas.
   - Live Rider Monitor: memantau kecepatan, status, dan akurasi GPS peserta secara realtime.

7. **Privasi & Keamanan Terjamin**
   - **Mode Anonim:** Pesepeda dapat memilih untuk tampil sebagai "Rider" anonim di live map.
   - Email dan data privat tidak pernah dibocorkan ke payload publik atau realtime broadcast.
   - Row-Level Security (RLS) diaktifkan secara ketat pada seluruh tabel PostgreSQL Supabase.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React 19)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS v4 (Custom Dark Cycling Palette)
- **Database & Realtime:** Supabase (PostgreSQL, Realtime Broadcast, Supabase Auth, Row Level Security)
- **Mapping:** MapLibre GL JS + OpenFreeMap (100% Free & Open-Source, No Google Maps / Mapbox API)
- **Icons:** Lucide React

---

## 🚀 Memulai Proyek (Quick Start)

### 1. Prasyarat
- Node.js v18+ atau v20+
- Akun Supabase (opsional untuk mode online, aplikasi sudah dilengkapi fallback mock database otomatis untuk mode dev lokal)

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment
Salin template konfigurasi:
```bash
cp .env.example .env.local
```
Isi variabel dengan kredensial Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

### 5. Typecheck, Lint, & Build
```bash
npm run typecheck
npm run lint
npm run build
```

---

## 📱 Jalur Rute Web (Routes)

- `/` — Halaman Beranda (Hero, Countdown, Lokasi Start/Finish, Preview Rute, Tikum Populer)
- `/event` — Detail Event Lengkap, Rundown Acara, Konfirmasi Kehadiran, Daftar Peserta
- `/tikum` — Direktori Titik Kumpul Peserta, Modal Buat Tikum, Peta Lokasi
- `/live` — Live Map Realtime, Panel Status Rider, GPS Watcher
- `/profile` — Profil Pesepeda, Pengaturan Mode Anonim, Keluar Akun
- `/admin` — Admin Dashboard, Route Editor, Moderasi Tikum, Monitor Operasional

---

## 📄 Lisensi & Hak Cipta
Dibuat untuk komunitas pesepeda Kota Makassar. Bebas digunakan untuk mendukung mobilitas perkotaan yang sehat, inklusif, dan ramah lingkungan.
