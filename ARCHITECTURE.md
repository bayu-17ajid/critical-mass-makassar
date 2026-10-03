# Architecture Documentation — Critical Mass Makassar

## 1. High-Level System Architecture

Critical Mass Makassar dirancang dengan arsitektur modern berorientasi performa tinggi, efisiensi konsumsi baterai perangkat seluler (*mobile-first*), serta privasi lokasi peserta secara menyeluruh.

```
                      +---------------------------------------+
                      |           Next.js 16 Client           |
                      |  (App Router, Tailwind v4, MapLibre)  |
                      +-------------------+-------------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
              [HTTP / REST / RLS]                [WebSockets Realtime]
                        |                                   |
                        v                                   v
             +--------------------+              +--------------------+
             |   Supabase Auth    |              |  Supabase Channel  |
             |   & PostgreSQL     |              |  Broadcast Engine  |
             |  (Persistent Data) |              |  (Live Positions)  |
             +--------------------+              +--------------------+
```

---

## 2. Directory Structure & Separation of Concerns

```
Critical Mass Makassar/
├── app/                         # Next.js App Router (Page views & layout)
│   ├── layout.tsx               # Root layout, dark theme tokens, PWA tags
│   ├── page.tsx                 # Home hero, countdown, stats, previews
│   ├── event/page.tsx           # Rundown, attendance confirmation, attendee list
│   ├── tikum/page.tsx           # Community meeting points & creation modal
│   ├── live/page.tsx            # Live map & GPS tracking dashboard
│   ├── profile/page.tsx         # Rider profile, privacy settings (anonymity mode)
│   └── admin/page.tsx           # Event admin, route editor, tikum moderation
├── components/
│   ├── ui/                      # Reusable atoms & molecules
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── StatCard.tsx
│   │   ├── Badge.tsx
│   │   ├── Countdown.tsx        # Hydration-safe ticking timer
│   │   ├── EventTimeline.tsx    # Chronological rundown
│   │   ├── LocationCard.tsx     # Start & Finish cards
│   │   ├── RiderStatusBadge.tsx # Attending, On The Way, Di Tikum, Arrived
│   │   ├── BottomSheet.tsx      # Mobile map interactive drawer
│   │   └── MapOverlay.tsx       # Map controls and legend
│   ├── map/                     # MapLibre GL JS integration
│   │   ├── MapView.tsx          # OpenFreeMap client wrapper with dark filter
│   │   ├── RouteLayer.tsx       # GeoJSON LineString glowing render
│   │   ├── StartMarker.tsx      # Official Losari start marker
│   │   ├── FinishMarker.tsx     # Official Karebosi finish marker
│   │   ├── TikumMarker.tsx      # Purple meeting point markers
│   │   ├── RiderMarker.tsx      # Bike marker with radar pulsation
│   │   ├── LocationPicker.tsx   # Interactive map coordinate selector
│   │   └── RouteEditor.tsx      # Interactive line editor with distance calculator
│   ├── layout/                  # Desktop navbar & mobile bottom navigation
│   └── auth/                    # Auth modal with instant demo fast-login
├── hooks/
│   ├── useLiveGps.ts            # Throttled browser GPS watcher
│   └── useRealtimeRiders.ts     # Supabase Realtime broadcast subscriber
├── lib/
│   ├── event/date.ts            # Last Friday monthly scheduler logic
│   ├── map/maplibre.ts          # Safe MapLibre class exports
│   └── supabase/
│       ├── client.ts            # Supabase singleton client
│       ├── auth-context.tsx     # Global auth state & demo user provider
│       ├── service.ts           # Centralized database & local fallback repository
│       └── mock-data.ts         # High-fidelity development seed data
├── supabase/
│   └── migrations/              # PostgreSQL schema, RLS policies, and triggers
└── public/                      # Static assets, hero photography, PWA manifest
```

---

## 3. Realtime Broadcast Architecture

Untuk mendukung **100–500 pesepeda aktif secara simultan** tanpa membebani database PostgreSQL dengan ribuan `UPDATE` per detik:
1. **Saluran Realtime Khusus:** `event:{eventId}:live`
2. **Arsitektur Broadcast:** Pembaruan koordinat GPS dikirim melalui saluran siaran ringan (*broadcast*) antar-klien.
3. **Throttling Cerdas:** Browser membatasi transmisi maksimal satu kali per 5–10 detik, kecuali terdapat perpindahan posisi signifikan (>15 meter).
4. **State Ephemeral:** Hanya posisi terkini yang disimpan di tabel `live_locations` untuk inisialisasi awal. Begitu pelacakan dihentikan (*Stop Sharing Location*), data posisi seketika dihapus.

---

## 4. Map Architecture (OpenFreeMap + MapLibre)

- **Vector Tiles:** Menggunakan style resmi OpenFreeMap Dark (`https://tiles.openfreemap.org/styles/dark`).
- **Zero Cost / No Paid APIs:** Tidak memerlukan API Key dari Google Maps maupun Mapbox.
- **Native Dark Theme:** Menggunakan vector dark matter styling asli dari OpenFreeMap tanpa CSS filter canvas, menjamin nol kedipan (flicker-free), performa GPU 60 FPS halus, dan kontras visual optimal.
- **Client-Side Only:** Seluruh inisialisasi MapLibre dieksekusi di lingkungan browser (`useEffect`) dengan web worker lokal dan fallback skeleton untuk mencegah kegagalan SSR.
