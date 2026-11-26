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
