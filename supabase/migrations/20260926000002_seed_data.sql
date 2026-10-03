-- ==============================================================================
-- CRITICAL MASS MAKASSAR - DEVELOPMENT SEED DATA
-- Fictional development seed for testing & demonstration
-- ==============================================================================

-- 1. Create a Primary Event for testing
insert into public.events (
  id,
  title,
  description,
  event_date,
  start_time,
  finish_time,
  status
) values (
  '00000000-0000-0000-0000-000000000001',
  'Critical Mass Makassar #Oktober',
  'Gerakan pesepeda merayakan kota, mengampanyekan ruang jalan yang aman dan inklusif bagi seluruh pesepeda di Kota Makassar.',
  '2026-10-30',
  '2026-10-30 18:30:00+08',
  '2026-10-30 21:00:00+08',
  'published'
) on conflict (id) do nothing;

-- 2. Event Locations (Main Start & Finish)
insert into public.event_locations (id, event_id, type, name, description, latitude, longitude, meeting_time)
values 
(
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  'MAIN_START',
  'Anjungan Pantai Losari',
  'Titik kumpul utama seluruh pesepeda Makassar sebelum konvoi dimulai.',
  -5.1437,
  119.4069,
  '2026-10-30 18:30:00+08'
),
(
  '00000000-0000-0000-0000-000000000012',
  '00000000-0000-0000-0000-000000000001',
  'FINISH',
  'Taman Karebosi',
  'Titik akhir konvoi rute Critical Mass. Santai bareng dan sesi foto komunitas.',
  -5.1348,
  119.4124,
  '2026-10-30 20:30:00+08'
) on conflict (id) do nothing;

-- 3. Event Rundown
insert into public.event_rundowns (event_id, time, title, description, display_order)
values
  ('00000000-0000-0000-0000-000000000001', '17:30', 'Kumpul di Tikum Peserta', 'Pesepeda berkumpul di Tikum wilayah masing-masing untuk gowes bersama menuju Losari.', 1),
  ('00000000-0000-0000-0000-000000000001', '18:30', 'Kumpul di Tikum Utama (Anjungan Losari)', 'Briefing jalur, keselamatan berkendara (safety riding), dan cek perlengkapan lampu.', 2),
  ('00000000-0000-0000-0000-000000000001', '19:00', 'Start Gowes Critical Mass', 'Konvoi tertib mengelilingi rute jalan protokol Kota Makassar.', 3),
  ('00000000-0000-0000-0000-000000000001', '20:30', 'Finish di Taman Karebosi', 'Seluruh pesepeda tiba di Lapangan Karebosi, istirahat dan hidrasi.', 4),
  ('00000000-0000-0000-0000-000000000001', '21:00', 'Selesai & Gowes Pulang Mandiri', 'Penutupan acara resmi dan kepulangan rombongan peserta.', 5)
on conflict do nothing;

-- 4. Official Route (12.4 km cycling path around Makassar)
insert into public.event_routes (id, event_id, name, geojson, distance_meters)
values (
  '00000000-0000-0000-0000-000000000031',
  '00000000-0000-0000-0000-000000000001',
  'Rute Resmi Critical Mass Makassar (~12.4 KM)',
  '{
    "type": "LineString",
    "coordinates": [
      [119.4069, -5.1437],
      [119.4062, -5.1485],
      [119.4112, -5.1520],
      [119.4185, -5.1550],
      [119.4320, -5.1510],
      [119.4410, -5.1450],
      [119.4350, -5.1360],
      [119.4260, -5.1320],
      [119.4180, -5.1330],
      [119.4124, -5.1348]
    ]
  }'::jsonb,
  12400
) on conflict (id) do nothing;
