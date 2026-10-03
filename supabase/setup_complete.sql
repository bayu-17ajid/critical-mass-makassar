-- ==============================================================================
-- CRITICAL MASS MAKASSAR - PRODUCTION DATABASE SETUP (100% IDEMPOTENT & RE-RUNNABLE)
-- Aman dijalankan berulang kali tanpa error "policy already exists"
-- ==============================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. TABEL PROFILES
create table if not exists public.profiles (
  id text primary key,
  username text,
  display_name text not null default 'Rider',
  avatar_url text,
  role text not null default 'user',
  bike_type text,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
drop policy if exists "Allow all profiles read" on public.profiles;
drop policy if exists "Allow all profiles insert" on public.profiles;
drop policy if exists "Allow all profiles update" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Allow all profiles read" on public.profiles for select using (true);
create policy "Allow all profiles insert" on public.profiles for insert with check (true);
create policy "Allow all profiles update" on public.profiles for update using (true);

-- 3. TABEL EVENTS
create table if not exists public.events (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  description text,
  event_date date not null,
  start_time timestamptz not null,
  finish_time timestamptz not null,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events enable row level security;
drop policy if exists "Allow all events read" on public.events;
drop policy if exists "Allow all events insert" on public.events;
drop policy if exists "Allow all events update" on public.events;
drop policy if exists "Published or completed events are viewable by everyone" on public.events;
drop policy if exists "Admins can insert events" on public.events;
drop policy if exists "Admins can update events" on public.events;
drop policy if exists "Admins can delete events" on public.events;

create policy "Allow all events read" on public.events for select using (true);
create policy "Allow all events insert" on public.events for insert with check (true);
create policy "Allow all events update" on public.events for update using (true);

-- 4. TABEL EVENT LOCATIONS (Start, Finish)
create table if not exists public.event_locations (
  id text primary key default gen_random_uuid()::text,
  event_id text not null,
  type text not null,
  name text not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  meeting_time text,
  created_at timestamptz not null default now()
);

alter table public.event_locations enable row level security;
drop policy if exists "Allow all event_locations read" on public.event_locations;
drop policy if exists "Allow all event_locations insert" on public.event_locations;
drop policy if exists "Allow all event_locations update" on public.event_locations;
drop policy if exists "Allow all event_locations delete" on public.event_locations;
drop policy if exists "Event locations are viewable by everyone" on public.event_locations;

create policy "Allow all event_locations read" on public.event_locations for select using (true);
create policy "Allow all event_locations insert" on public.event_locations for insert with check (true);
create policy "Allow all event_locations update" on public.event_locations for update using (true);
create policy "Allow all event_locations delete" on public.event_locations for delete using (true);

-- 5. TABEL EVENT RUNDOWNS
create table if not exists public.event_rundowns (
  id text primary key default gen_random_uuid()::text,
  event_id text not null,
  time text not null,
  title text not null,
  description text,
  display_order integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.event_rundowns enable row level security;
drop policy if exists "Allow all event_rundowns read" on public.event_rundowns;
drop policy if exists "Allow all event_rundowns insert" on public.event_rundowns;
drop policy if exists "Allow all event_rundowns update" on public.event_rundowns;
drop policy if exists "Allow all event_rundowns delete" on public.event_rundowns;
drop policy if exists "Event rundowns are viewable by everyone" on public.event_rundowns;

create policy "Allow all event_rundowns read" on public.event_rundowns for select using (true);
create policy "Allow all event_rundowns insert" on public.event_rundowns for insert with check (true);
create policy "Allow all event_rundowns update" on public.event_rundowns for update using (true);
create policy "Allow all event_rundowns delete" on public.event_rundowns for delete using (true);

-- 6. TABEL MEETING POINTS (Tikum)
create table if not exists public.meeting_points (
  id text primary key default gen_random_uuid()::text,
  event_id text not null,
  creator_id text not null,
  name text not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  meeting_time text not null,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meeting_points enable row level security;
drop policy if exists "Allow all meeting_points read" on public.meeting_points;
drop policy if exists "Allow all meeting_points insert" on public.meeting_points;
drop policy if exists "Allow all meeting_points update" on public.meeting_points;
drop policy if exists "Allow all meeting_points delete" on public.meeting_points;
drop policy if exists "Meeting points are viewable by everyone" on public.meeting_points;

create policy "Allow all meeting_points read" on public.meeting_points for select using (true);
create policy "Allow all meeting_points insert" on public.meeting_points for insert with check (true);
create policy "Allow all meeting_points update" on public.meeting_points for update using (true);
create policy "Allow all meeting_points delete" on public.meeting_points for delete using (true);

-- 7. TABEL MEETING POINT MEMBERS
create table if not exists public.meeting_point_members (
  id text primary key default gen_random_uuid()::text,
  meeting_point_id text not null references public.meeting_points(id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default now(),
  constraint mp_members_unique unique (meeting_point_id, user_id)
);

alter table public.meeting_point_members enable row level security;
drop policy if exists "Allow all meeting_point_members read" on public.meeting_point_members;
drop policy if exists "Allow all meeting_point_members insert" on public.meeting_point_members;
drop policy if exists "Allow all meeting_point_members delete" on public.meeting_point_members;

create policy "Allow all meeting_point_members read" on public.meeting_point_members for select using (true);
create policy "Allow all meeting_point_members insert" on public.meeting_point_members for insert with check (true);
create policy "Allow all meeting_point_members delete" on public.meeting_point_members for delete using (true);

-- 8. TABEL EVENT ATTENDEES (Peserta Gowes)
create table if not exists public.event_attendees (
  id text primary key default gen_random_uuid()::text,
  event_id text not null,
  user_id text not null,
  status text not null default 'ATTENDING',
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_attendee_unique unique (event_id, user_id)
);

alter table public.event_attendees enable row level security;
drop policy if exists "Allow all event_attendees read" on public.event_attendees;
drop policy if exists "Allow all event_attendees insert" on public.event_attendees;
drop policy if exists "Allow all event_attendees update" on public.event_attendees;
drop policy if exists "Allow all event_attendees delete" on public.event_attendees;

create policy "Allow all event_attendees read" on public.event_attendees for select using (true);
create policy "Allow all event_attendees insert" on public.event_attendees for insert with check (true);
create policy "Allow all event_attendees update" on public.event_attendees for update using (true);
create policy "Allow all event_attendees delete" on public.event_attendees for delete using (true);

-- 9. TABEL LIVE LOCATIONS (High-Scale GPS Sharing)
create table if not exists public.live_locations (
  id text primary key default gen_random_uuid()::text,
  event_id text not null,
  user_id text not null,
  latitude double precision not null,
  longitude double precision not null,
  accuracy_meters numeric,
  speed_mps numeric,
  heading numeric,
  status text default 'ON_THE_WAY',
  display_name text default 'Rider',
  avatar_url text,
  is_anonymous boolean not null default false,
  recorded_at timestamptz not null default now(),
  constraint live_location_unique unique (event_id, user_id)
);

create index if not exists idx_live_locations_event on public.live_locations(event_id);
create index if not exists idx_live_locations_user on public.live_locations(user_id);
create index if not exists idx_live_locations_recorded on public.live_locations(recorded_at);

alter table public.live_locations enable row level security;
drop policy if exists "Allow all live_locations read" on public.live_locations;
drop policy if exists "Allow all live_locations insert" on public.live_locations;
drop policy if exists "Allow all live_locations update" on public.live_locations;
drop policy if exists "Allow all live_locations delete" on public.live_locations;
drop policy if exists "Live locations are viewable by everyone" on public.live_locations;

create policy "Allow all live_locations read" on public.live_locations for select using (true);
create policy "Allow all live_locations insert" on public.live_locations for insert with check (true);
create policy "Allow all live_locations update" on public.live_locations for update using (true);
create policy "Allow all live_locations delete" on public.live_locations for delete using (true);

-- 10. SETUP SUPABASE REALTIME REPLICATION
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'live_locations') then
    alter publication supabase_realtime add table public.live_locations;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'event_attendees') then
    alter publication supabase_realtime add table public.event_attendees;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'meeting_point_members') then
    alter publication supabase_realtime add table public.meeting_point_members;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'meeting_points') then
    alter publication supabase_realtime add table public.meeting_points;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'event_rundowns') then
    alter publication supabase_realtime add table public.event_rundowns;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'event_locations') then
    alter publication supabase_realtime add table public.event_locations;
  end if;
end;
$$;

-- 11. DATA AWAL (INITIAL SEED DATA)
-- Event Utama Critical Mass Makassar
insert into public.events (id, title, description, event_date, start_time, finish_time, status)
values (
  'cm-mks-event-01',
  'Critical Mass Makassar',
  'Gerakan pesepeda merayakan kota Makassar, mengampanyekan ruang jalan yang aman, tertib, dan inklusif bagi seluruh pesepeda.',
  '2026-10-30',
  '2026-10-30 18:30:00+08',
  '2026-10-30 21:00:00+08',
  'published'
) on conflict (id) do nothing;

-- Titik Start & Finish
insert into public.event_locations (id, event_id, type, name, description, latitude, longitude, meeting_time)
values 
(
  'loc-start-01',
  'cm-mks-event-01',
  'MAIN_START',
  'Anjungan Pantai Losari',
  'Titik kumpul utama seluruh pesepeda Makassar sebelum konvoi dimulai.',
  -5.1437,
  119.4069,
  '18:30'
),
(
  'loc-finish-01',
  'cm-mks-event-01',
  'FINISH',
  'Taman Karebosi',
  'Titik akhir konvoi rute Critical Mass. Santai bareng dan sesi foto komunitas.',
  -5.1348,
  119.4124,
  '20:30'
) on conflict (id) do nothing;

-- Rundown Acara
insert into public.event_rundowns (id, event_id, time, title, description, display_order)
values
  ('rd-01', 'cm-mks-event-01', '17:30', 'Kumpul di Tikum Masing-Masing', 'Pesepeda berkumpul di Tikum wilayah untuk gowes bersama menuju Losari.', 1),
  ('rd-02', 'cm-mks-event-01', '18:30', 'Kumpul di Anjungan Pantai Losari', 'Briefing jalur, keselamatan berkendara (safety riding), dan cek lampu.', 2),
  ('rd-03', 'cm-mks-event-01', '19:00', 'Start Gowes Bersama', 'Konvoi santai dan tertib mengelilingi rute jalan protokol Makassar.', 3),
  ('rd-04', 'cm-mks-event-01', '20:30', 'Finish di Lapangan Karebosi', 'Tiba di garis akhir, istirahat santai, hidrasi, dan ramah tamah komunitas.', 4),
  ('rd-05', 'cm-mks-event-01', '21:00', 'Selesai & Pulang Mandiri', 'Penutupan dan perjalanan pulang tetap berkelompok dan aman.', 5)
on conflict (id) do nothing;

-- Titik Kumpul (Tikum) Wilayah Awal
insert into public.meeting_points (id, event_id, creator_id, name, description, latitude, longitude, meeting_time, status)
values
  ('tk-01', 'cm-mks-event-01', 'admin-01', 'Tikum CPI (Masjid 99 Kubah)', 'Kumpul di pelataran depan jembatan CPI sebelum meluncur ke Losari.', -5.1550, 119.4020, '17:45', 'ACTIVE'),
  ('tk-02', 'cm-mks-event-01', 'admin-01', 'Tikum Hertasning (Depan PLN)', 'Rombongan pesepeda area Panakkukang & Hertasning.', -5.1630, 119.4450, '17:30', 'ACTIVE'),
  ('tk-03', 'cm-mks-event-01', 'admin-01', 'Tikum Boulevard (Mall Panakkukang)', 'Kumpul di depan trotoar MP Jl. Boulevard.', -5.1520, 119.4440, '17:30', 'ACTIVE')
on conflict (id) do nothing;
