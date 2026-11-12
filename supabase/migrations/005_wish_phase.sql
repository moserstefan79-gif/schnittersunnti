-- Phasen: 'wishes' (Wunschschichten sammeln) oder 'open' (verbindliche Selbstanmeldung)
create table public.settings (key text primary key, value jsonb not null);
alter table public.settings enable row level security;
create policy "settings: read" on public.settings for select to anon, authenticated using (true);
create policy "settings: admin write" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
insert into public.settings values ('signup_mode', '"wishes"'), ('assignment_note', '"Die Zuteilung erfolgt im Januar 2027. Bis dahin kannst du Wünsche jederzeit ändern."');

alter table public.shift_signups add column status text not null default 'confirmed' check (status in ('wish', 'confirmed'));
create index shift_signups_status_idx on public.shift_signups(shift_id, status);

create or replace function public.check_shift_capacity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cap int; cnt int; mode text;
begin
  select value #>> '{}' into mode from public.settings where key = 'signup_mode';
  if tg_op = 'INSERT' and not public.is_admin() then
    new.status := case when mode = 'open' then 'confirmed' else 'wish' end;
  end if;
  if new.status = 'confirmed' and (tg_op = 'INSERT' or old.status <> 'confirmed') then
    select capacity into cap from public.shifts where id = new.shift_id for update;
    select count(*) into cnt from public.shift_signups where shift_id = new.shift_id and status = 'confirmed' and id <> new.id;
    if cnt >= cap then raise exception 'Schicht ist bereits voll' using errcode = 'P0001'; end if;
  end if;
  return new;
end $$;
drop trigger if exists shift_signups_capacity on public.shift_signups;
create trigger shift_signups_capacity before insert or update on public.shift_signups
  for each row execute function public.check_shift_capacity();
revoke execute on function public.check_shift_capacity() from anon, authenticated, public;

create policy "signups: admin update" on public.shift_signups for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop view public.shift_overview;
create view public.shift_overview with (security_invoker = true) as
select s.*,
  (select count(*) from public.shift_signups su where su.shift_id = s.id and su.status = 'confirmed')::int as taken,
  (select count(*) from public.shift_signups su where su.shift_id = s.id and su.status = 'wish')::int as wishes,
  s.capacity - (select count(*) from public.shift_signups su where su.shift_id = s.id and su.status = 'confirmed')::int as free,
  exists (select 1 from public.shift_signups su where su.shift_id = s.id and su.user_id = auth.uid()) as mine,
  (select su.status from public.shift_signups su where su.shift_id = s.id and su.user_id = auth.uid()) as mine_status
from public.shifts s;
grant select on public.shift_overview to authenticated;

drop view public.shift_roster;
create view public.shift_roster with (security_invoker = true) as
select su.shift_id, su.user_id, su.status, su.note, su.created_at, p.full_name, p.phone, p.team
from public.shift_signups su join public.profiles p on p.id = su.user_id;
grant select on public.shift_roster to authenticated;

create or replace function public.assign_wishes()
returns table (confirmed int, left_open int)
language plpgsql security definer set search_path = public as $$
declare r record; cap int; cnt int; c int := 0; l int := 0;
begin
  if not public.is_admin() then raise exception 'Nur Admin'; end if;
  for r in select su.id, su.shift_id from public.shift_signups su where su.status = 'wish' order by su.created_at loop
    select capacity into cap from public.shifts where id = r.shift_id;
    select count(*) into cnt from public.shift_signups where shift_id = r.shift_id and status = 'confirmed';
    if cnt < cap then update public.shift_signups set status = 'confirmed' where id = r.id; c := c + 1; else l := l + 1; end if;
  end loop;
  return query select c, l;
end $$;
revoke execute on function public.assign_wishes() from anon, public;
grant execute on function public.assign_wishes() to authenticated;

-- Preise 2027 (Vorstandsbeschluss): Fish & Chips 18.–, Bier und Softgetränke +0.50
update public.menu_items set price_chf = 18.00 where article_no = 103;
update public.menu_items set price_chf = price_chf + 0.50 where article_no in (301, 302, 401, 402, 403, 404, 405);
