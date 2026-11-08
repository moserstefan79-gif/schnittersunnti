-- Schnittersunnti FC Beizli – Helferverwaltung
-- Tabellen: profiles, shifts, shift_signups

create extension if not exists pgcrypto;

-- Profil pro Helfer (1:1 zu auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  team text,                         -- Mannschaft / Gruppe (z.B. "1. Mannschaft", "Senioren", "Freunde")
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Schichten
create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  area text not null,                -- Theke, Küche, Service, Bar, Kasse, Aufbau, Abbau
  description text,
  capacity int not null check (capacity > 0),
  created_at timestamptz not null default now()
);
create index shifts_day_idx on public.shifts(day, starts_at);

-- Anmeldungen
create table public.shift_signups (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (shift_id, user_id)
);
create index shift_signups_user_idx on public.shift_signups(user_id);

-- Profil automatisch beim Signup anlegen
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, team)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'team'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Kapazität prüfen (Race-Condition-sicher via Row-Lock auf shift)
create or replace function public.check_shift_capacity()
returns trigger language plpgsql as $$
declare
  cap int; cnt int;
begin
  select capacity into cap from public.shifts where id = new.shift_id for update;
  select count(*) into cnt from public.shift_signups where shift_id = new.shift_id;
  if cnt >= cap then
    raise exception 'Schicht ist bereits voll' using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger shift_signups_capacity
  before insert on public.shift_signups
  for each row execute function public.check_shift_capacity();

-- Admin-Helfer
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- Übersicht: Schichten mit Belegung (für alle eingeloggten sichtbar)
create or replace view public.shift_overview
with (security_invoker = true) as
select
  s.*,
  (select count(*) from public.shift_signups su where su.shift_id = s.id)::int as taken,
  s.capacity - (select count(*) from public.shift_signups su where su.shift_id = s.id)::int as free,
  exists (select 1 from public.shift_signups su where su.shift_id = s.id and su.user_id = auth.uid()) as mine
from public.shifts s;

-- Belegung mit Namen (für Admins und für eigene Schichten)
create or replace view public.shift_roster
with (security_invoker = true) as
select su.shift_id, su.user_id, su.note, su.created_at, p.full_name, p.phone, p.team
from public.shift_signups su
join public.profiles p on p.id = su.user_id;

-- RLS
alter table public.profiles enable row level security;
alter table public.shifts enable row level security;
alter table public.shift_signups enable row level security;

-- profiles: eigenes lesen/ändern, Admin alles
create policy "profiles: own read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin()
         or exists (select 1 from public.shift_signups a join public.shift_signups b on a.shift_id = b.shift_id
                    where a.user_id = auth.uid() and b.user_id = profiles.id));
create policy "profiles: own update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and is_admin = (select is_admin from public.profiles where id = auth.uid()));
create policy "profiles: admin update" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- shifts: alle eingeloggten lesen, Admin schreiben
create policy "shifts: read" on public.shifts for select to authenticated using (true);
create policy "shifts: admin write" on public.shifts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- signups: eigene lesen/anlegen/löschen, Admin alles; Zähler für alle über view (count braucht select)
create policy "signups: read" on public.shift_signups for select to authenticated using (true);
create policy "signups: own insert" on public.shift_signups for insert to authenticated
  with check (user_id = auth.uid());
create policy "signups: own delete" on public.shift_signups for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "signups: admin insert" on public.shift_signups for insert to authenticated
  with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.shift_overview, public.shift_roster to authenticated;
