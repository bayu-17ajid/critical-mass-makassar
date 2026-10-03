# Panduan Deployment — Critical Mass Makassar

Dokumen ini menjelaskan langkah-langkah implementasi skema Supabase dan penyebaran (*deployment*) ke platform **Vercel**.

---

## 1. Konfigurasi Proyek Supabase

1. Buat proyek baru di [database.new](https://database.new) atau dashboard Supabase Anda.
2. Buka menu **SQL Editor** pada dashboard Supabase.
3. Jalankan script migrasi skema database dari file:
   [`supabase/migrations/20260926000001_initial_schema.sql`](file:///supabase/migrations/20260926000001_initial_schema.sql).
4. (Opsional untuk data uji coba) Jalankan script seed data:
   [`supabase/migrations/20260926000002_seed_data.sql`](file:///supabase/migrations/20260926000002_seed_data.sql).
5. Pada menu **Project Settings > API**, salin:
   - **Project URL**
   - **anon / public key**
6. Pada menu **Database > Replication**, pastikan publikasi `supabase_realtime` telah mencakup tabel `live_locations`, `event_attendees`, dan `meeting_point_members`.

---

## 2. Deployment ke Vercel

### Metode A: Melalui Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```

### Metode B: Melalui Dashboard Vercel (GitHub/GitLab) — Direkomendasikan
1. Buat repository baru di [github.com/new](https://github.com/new) (misal: `critical-mass-makassar`).
2. Jalankan perintah git untuk menghubungkan dan push kode:
   ```bash
   git add .
   git commit -m "feat: complete Critical Mass Makassar app with high-scale live GPS"
   git remote add origin https://github.com/USERNAME/critical-mass-makassar.git
   git branch -M main
   git push -u origin main
   ```
3. Buka [vercel.com/new](https://vercel.com/new) dan klik **Import** pada repositori `critical-mass-makassar`.
4. Framework Preset: **Next.js** (otomatis terdeteksi).
5. Buka bagian **Environment Variables** dan tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL proyek Supabase Anda (misal `https://xxxx.supabase.co`).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Kunci anon/public Supabase Anda.
   - `NEXT_PUBLIC_ADMIN_PIN`: PIN rahasia untuk admin (misal `karebosi2026`).
6. Klik tombol **Deploy**. Aplikasi akan otomatis online dalam ~1 menit!
---

## 3. Verifikasi Pasca-Deployment

Setelah deployment selesai di Vercel:
1. Akses URL deployment di perangkat seluler dan desktop.
2. Verifikasi perhitungan tanggal Jumat terakhir di Beranda dan Countdown.
3. Coba lakukan pendaftaran kehadiran (klik **I'M ATTENDING**).
4. Buat satu Tikum baru untuk menguji pemilihan titik koordinat di peta.
5. Uji fitur **"ON THE WAY"** pada halaman Live Map untuk memastikan izin GPS browser bekerja.
