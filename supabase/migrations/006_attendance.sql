-- Anwesenheitskontrolle am Fest
alter table public.shift_signups
  add column attendance text check (attendance in ('present', 'absent')),
  add column checked_at timestamptz,
  add column checked_by uuid references public.profiles(id);

drop view public.shift_roster;
create view public.shift_roster with (security_invoker = true) as
select su.shift_id, su.user_id, su.status, su.attendance, su.checked_at, su.note, su.created_at, p.full_name, p.phone, p.team
from public.shift_signups su join public.profiles p on p.id = su.user_id;
grant select on public.shift_roster to authenticated;

drop view public.shift_overview;
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

-- Einsatzbilanz pro Helfer (Admin)
create view public.helper_summary with (security_invoker = true) as
select p.id as user_id, p.full_name, p.team, p.phone,
  count(*) filter (where su.status = 'confirmed') as assigned,
  count(*) filter (where su.attendance = 'present') as present,
  count(*) filter (where su.attendance = 'absent') as absent,
  coalesce(sum(extract(epoch from (s.ends_at - s.starts_at)) / 3600) filter (where su.attendance = 'present'), 0)::numeric(6,1) as hours_present
from public.profiles p
left join public.shift_signups su on su.user_id = p.id
left join public.shifts s on s.id = su.shift_id
group by p.id, p.full_name, p.team, p.phone;
grant select on public.helper_summary to authenticated;
