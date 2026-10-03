# Security Audit & Privacy Documentation — Critical Mass Makassar

Dokumen ini memvalidasi postur keamanan aplikasi, kebijakan Row-Level Security (RLS), mitigasi kerentanan, dan perlindungan privasi data lokasi GPS.

---

## 1. Perlindungan Privasi Data Lokasi (GPS Privacy)

1. **Sifat Ephemeral (Tidak Ada Riwayat GPS Permanen):**
   - Aplikasi **TIDAK menyimpan jejak GPS historis**.
   - Tabel `live_locations` hanya menyimpan 1 baris per pesepeda per event melalui `UNIQUE(event_id, user_id)`.
   - Ketika pengguna menekan **"STOP SHARING LOCATION"**, baris lokasi di tabel `live_locations` langsung dihapus dari database.

2. **Mode Anonim Pesepeda:**
   - Pengguna dapat mengaktifkan fitur *Mode Anonim* melalui halaman Profil atau saat konfirmasi kehadiran.
   - Jika aktif, nama tampilan diganti menjadi **"Rider"** dan username disamarkan, sehingga lokasi publik di peta tidak dapat diasosiasikan dengan identitas pribadi.

3. **Batasan Payload Data Publik & Realtime:**
   - Payload pesan siaran realtime (`event:{eventId}:live`) hanya memuat:
     `rider_id`, `latitude`, `longitude`, `accuracy`, `speed`, `heading`, `recorded_at`, `status`, `display_name`.
   - **Email, nomor telepon, dan identitas otentikasi internal TIDAK PERNAH disertakan** dalam siaran publik maupun query halaman publik.

4. **Keterbatasan Pelacakan di Latar Belakang (Disclosure):**
   - Aplikasi secara transparan memberi tahu pengguna:  
     *"Live location works while this page is active. Background tracking may be limited by your browser or phone."*

---

## 2. Row Level Security (RLS) Audit

Seluruh tabel database di skema `public` memiliki RLS aktif (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`):

| Tabel | Operasi Publik (SELECT) | Izin INSERT / UPDATE | Izin DELETE |
| :--- | :--- | :--- | :--- |
| `profiles` | Publik (hanya username & display_name) | Pengguna pemilik (`auth.uid() = id`) | Dibatasi cascading user auth |
| `events` | Publik jika status `published`/`live`/`completed` | Hanya Admin (`public.is_admin()`) | Hanya Admin (`public.is_admin()`) |
| `event_locations` | Publik | Hanya Admin (`public.is_admin()`) | Hanya Admin (`public.is_admin()`) |
| `event_routes` | Publik | Hanya Admin (`public.is_admin()`) | Hanya Admin (`public.is_admin()`) |
| `event_attendees` | Publik | Pengguna terdaftar (`auth.uid() = user_id`) | Pengguna terdaftar (`auth.uid() = user_id`) |
| `meeting_points` | Publik untuk status `ACTIVE` | Pembuat Tikum (`auth.uid() = creator_id`) | Pembuat Tikum atau Admin |
| `meeting_point_members` | Publik | Pengguna terdaftar (`auth.uid() = user_id`) | Pengguna terdaftar (`auth.uid() = user_id`) |
| `live_locations` | Publik saat pelacakan aktif | Pengguna terdaftar (`auth.uid() = user_id`) | Pengguna terdaftar atau Admin |

---

## 3. Audit Rahasia & Kunci Lingkungan (Environment Secrets)

1. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`:**
   - Hanya memiliki izin anonim tingkat klien yang dilindungi oleh RLS PostgreSQL.
2. **`SUPABASE_SERVICE_ROLE_KEY`:**
   - **TIDAK PERNAH diekspos ke kode klien/browser**.
   - Tidak pernah diprefiks dengan `NEXT_PUBLIC_`.
3. **Kredensial Peta:**
   - Menggunakan OpenFreeMap publik tanpa token berbayar rahasia pada kode sumber.

---

## 4. Validasi Input & Pencegahan Serangan Web

- **SQL Injection:** Dicegah secara menyeluruh dengan menggunakan parameterized queries Supabase / PostgREST.
- **Cross-Site Scripting (XSS):** Semua teks dari pengguna di-escape secara otomatis oleh React JSX.
- **CSRF & Session Hijacking:** Sesi Supabase Auth dikelola menggunakan token berbasis PKCE dan LocalStorage terproteksi.
- **Manipulasi Tikum Pengguna Lain:** RLS memblokir upaya update atau delete Tikum yang bukan milik pengguna yang sedang login (`auth.uid() = creator_id`).
- **Manipulasi Lokasi Pengguna Lain:** RLS memblokir upaya memalsukan atau mengupdate koordinat `live_locations` milik pengguna lain (`auth.uid() = user_id`).
