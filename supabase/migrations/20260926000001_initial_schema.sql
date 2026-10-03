-- ==============================================================================
-- CRITICAL MASS MAKASSAR - PRODUCTION DATABASE SCHEMA & RLS POLICIES
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- Helper function to check if current user is admin
-- ------------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------------------------
-- 2. EVENTS
-- ------------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  start_time timestamptz not null,
  finish_time timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'live', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Published or completed events are viewable by everyone"
  on public.events for select
  using (status in ('published', 'live', 'completed') or public.is_admin());

create policy "Admins can insert events"
  on public.events for insert
  with check (public.is_admin());

create policy "Admins can update events"
  on public.events for update
  using (public.is_admin());

create policy "Admins can delete events"
  on public.events for delete
  using (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. EVENT LOCATIONS (Main Start, Finish, Waypoints)
-- ------------------------------------------------------------------------------
create table if not exists public.event_locations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  type text not null check (type in ('MAIN_START', 'WAYPOINT', 'FINISH')),
  name text not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  meeting_time timestamptz,
  created_at timestamptz not null default now()
);

alter table public.event_locations enable row level security;

create policy "Event locations are viewable by everyone"
  on public.event_locations for select
  using (true);

create policy "Admins can manage event locations"
  on public.event_locations for all
  using (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. EVENT RUNDOWNS
-- ------------------------------------------------------------------------------
create table if not exists public.event_rundowns (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  time text not null,
  title text not null,
  description text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.event_rundowns enable row level security;

create policy "Event rundowns are viewable by everyone"
  on public.event_rundowns for select
  using (true);

create policy "Admins can manage event rundowns"
  on public.event_rundowns for all
  using (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. EVENT ROUTES
-- ------------------------------------------------------------------------------
create table if not exists public.event_routes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  geojson jsonb not null,
  distance_meters numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.event_routes enable row level security;

create policy "Event routes are viewable by everyone"
  on public.event_routes for select
  using (true);

create policy "Admins can manage event routes"
  on public.event_routes for all
  using (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. EVENT ATTENDEES
-- ------------------------------------------------------------------------------
create table if not exists public.event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'ATTENDING' check (status in ('ATTENDING', 'ON_THE_WAY', 'AT_TIKUM', 'ARRIVED', 'CANCELLED')),
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_user_unique unique (event_id, user_id)
);

alter table public.event_attendees enable row level security;

create policy "Event attendees are viewable by everyone"
  on public.event_attendees for select
  using (true);

create policy "Authenticated users can attend events"
  on public.event_attendees for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own attendance"
  on public.event_attendees for update
  using (auth.uid() = user_id);

create policy "Users can cancel their own attendance"
  on public.event_attendees for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 7. MEETING POINTS (TIKUM)
-- ------------------------------------------------------------------------------
create table if not exists public.meeting_points (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  meeting_time timestamptz not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'CANCELLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meeting_points enable row level security;

create policy "Active meeting points are viewable by everyone"
  on public.meeting_points for select
  using (status = 'ACTIVE' or creator_id = auth.uid() or public.is_admin());

create policy "Authenticated users can create meeting points"
  on public.meeting_points for insert
  with check (auth.uid() = creator_id);

create policy "Creators can update their own meeting points"
  on public.meeting_points for update
  using (auth.uid() = creator_id or public.is_admin());

create policy "Creators can delete their own meeting points"
  on public.meeting_points for delete
  using (auth.uid() = creator_id or public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. MEETING POINT MEMBERS
-- ------------------------------------------------------------------------------
create table if not exists public.meeting_point_members (
  id uuid primary key default gen_random_uuid(),
  meeting_point_id uuid not null references public.meeting_points(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint tikum_user_unique unique (meeting_point_id, user_id)
);

alter table public.meeting_point_members enable row level security;

create policy "Meeting point members are viewable by everyone"
  on public.meeting_point_members for select
  using (true);

create policy "Authenticated users can join meeting points"
  on public.meeting_point_members for insert
  with check (auth.uid() = user_id);

create policy "Users can leave meeting points"
  on public.meeting_point_members for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 9. LIVE LOCATIONS (Ephemeral Live GPS State)
-- ------------------------------------------------------------------------------
create table if not exists public.live_locations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  accuracy_meters numeric,
  speed_mps numeric,
  heading numeric,
  recorded_at timestamptz not null default now(),
  constraint live_location_event_user_unique unique (event_id, user_id)
);

-- Indexes for lightning fast live queries
create index if not exists idx_live_locations_event_id on public.live_locations(event_id);
create index if not exists idx_live_locations_user_id on public.live_locations(user_id);
create index if not exists idx_live_locations_recorded_at on public.live_locations(recorded_at);
create index if not exists idx_live_locations_event_user on public.live_locations(event_id, user_id);

alter table public.live_locations enable row level security;

create policy "Live locations are viewable by everyone"
  on public.live_locations for select
  using (true);

create policy "Users can insert their own live location"
  on public.live_locations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own live location"
  on public.live_locations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own live location"
  on public.live_locations for delete
  using (auth.uid() = user_id or public.is_admin());

-- ------------------------------------------------------------------------------
-- Automatic profile creation on auth.users signup
-- ------------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable Supabase Realtime on live_locations and meeting_point_members
alter publication supabase_realtime add table public.live_locations;
alter publication supabase_realtime add table public.event_attendees;
alter publication supabase_realtime add table public.meeting_point_members;
