-- Junioren-Schichten: Küche und Service, Ende spätestens 20:30 Uhr – für Juniorinnen und Junioren ab 12 Jahren geeignet
alter table public.shifts add column if not exists junior_ok boolean not null default false;

update public.shifts set junior_ok = true
where area in ('Küche', 'Service')
  and day between '2027-07-16' and '2027-07-18'
  and (ends_at at time zone 'Europe/Zurich')::time <= time '20:30'
  and (ends_at at time zone 'Europe/Zurich')::date = day;   -- keine Nachtschichten, die nach Mitternacht enden

-- shift_overview neu aufbauen, damit junior_ok mitkommt (s.* wird beim Anlegen der View eingefroren)
drop view if exists public.shift_overview;
create view public.shift_overview with (security_invoker = true) as
select s.*,
  (select count(*) from public.shift_signups su where su.shift_id = s.id and su.status = 'confirmed')::int as taken,
  (select count(*) from public.shift_signups su where su.shift_id = s.id and su.status = 'wish')::int as wishes,
  s.capacity - (select count(*) from public.shift_signups su where su.shift_id = s.id and su.status = 'confirmed')::int as free,
  exists (select 1 from public.shift_signups su where su.shift_id = s.id and su.user_id = auth.uid()) as mine,
  (select su.status from public.shift_signups su where su.shift_id = s.id and su.user_id = auth.uid()) as mine_status,
  (select su.attendance from public.shift_signups su where su.shift_id = s.id and su.user_id = auth.uid()) as mine_attendance
from public.shifts s;
grant select on public.shift_overview to authenticated;

-- Admin darf das Label pro Schicht setzen (shifts: Admin-Update-Policy besteht bereits oder hier ergänzt)
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'shifts' and policyname = 'shifts: admin update') then
    create policy "shifts: admin update" on public.shifts for update to authenticated using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

-- Öffentliche Kennzahlen für die Startseite (ohne Login)
create or replace function public.public_shift_stats()
returns table (places int, junior_shifts int, junior_places int, junior_dows int[], open_places int)
language sql security definer set search_path = public stable as $$
  select
    coalesce(sum(capacity), 0)::int,
    count(*) filter (where junior_ok)::int,
    coalesce(sum(capacity) filter (where junior_ok), 0)::int,
    coalesce((select array_agg(d order by d) from (select distinct extract(dow from day)::int as d from public.shifts where junior_ok) x), '{}'),
    (coalesce(sum(capacity), 0) - (select count(*) from public.shift_signups where status = 'confirmed'))::int
  from public.shifts;
$$;
revoke execute on function public.public_shift_stats() from public;
grant execute on function public.public_shift_stats() to anon, authenticated;
