-- Helfer-Konsumationskarte: CHF-Guthaben pro geleisteter Schicht (Fr/Sa/So), Abbuchung an den Stationen
-- Regel: Gutschrift, sobald die Schicht in der Präsenzkontrolle auf «anwesend» steht. Gilt während des ganzen Fests.

insert into public.settings values
  ('helper_credit_per_shift', '22'),
  ('helper_credit_days', '["2027-07-16","2027-07-17","2027-07-18"]'),
  ('helper_credit_note', '"2 Getränke + 1 Essen pro Schicht"')
on conflict (key) do nothing;

-- 4-stelliger Helfercode für die Abbuchung an der Theke
alter table public.profiles add column if not exists helper_code text unique;

create or replace function public.gen_helper_code()
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  loop
    c := lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');
    exit when not exists (select 1 from public.profiles where helper_code = c);
  end loop;
  return c;
end $$;
revoke execute on function public.gen_helper_code() from anon, authenticated, public;

create or replace function public.set_helper_code()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.helper_code is null then new.helper_code := public.gen_helper_code(); end if;
  return new;
end $$;
revoke execute on function public.set_helper_code() from anon, authenticated, public;
drop trigger if exists profiles_helper_code on public.profiles;
create trigger profiles_helper_code before insert on public.profiles for each row execute function public.set_helper_code();
update public.profiles set helper_code = public.gen_helper_code() where helper_code is null;

-- Gutschriften (pro Schicht automatisch, oder manuell durch Admin: Vorstand-Pauschale, Gäste)
create table public.helper_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  shift_id uuid references public.shifts(id) on delete cascade,
  amount_chf numeric(8,2) not null,
  reason text not null default 'Schicht',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create unique index helper_credits_shift_once on public.helper_credits(user_id, shift_id) where shift_id is not null;
create index helper_credits_user_idx on public.helper_credits(user_id);

-- Konsumationen (Abbuchungen an den Stationen)
create table public.helper_consumptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  qty int not null check (qty > 0),
  unit_price_chf numeric(8,2) not null,
  amount_chf numeric(8,2) not null,
  station text,
  booked_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index helper_consumptions_user_idx on public.helper_consumptions(user_id, created_at);

alter table public.helper_credits enable row level security;
alter table public.helper_consumptions enable row level security;
create policy "credits: own read" on public.helper_credits for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "credits: admin write" on public.helper_credits for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "consumptions: own read" on public.helper_consumptions for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "consumptions: admin write" on public.helper_consumptions for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Gutschrift beim Präsenz-Häkchen (nur an den Festtagen gemäss Einstellung)
create or replace function public.credit_on_attendance()
returns trigger language plpgsql security definer set search_path = public as $$
declare amt numeric; d date; ok boolean;
begin
  select day into d from public.shifts where id = new.shift_id;
  select exists (select 1 from public.settings s, jsonb_array_elements_text(s.value) v where s.key = 'helper_credit_days' and v = d::text) into ok;
  if new.attendance = 'present' and old.attendance is distinct from 'present' and ok then
    select (value #>> '{}')::numeric into amt from public.settings where key = 'helper_credit_per_shift';
    insert into public.helper_credits (user_id, shift_id, amount_chf, reason, created_by)
      values (new.user_id, new.shift_id, coalesce(amt, 0), 'Schicht', auth.uid())
      on conflict do nothing;
  elsif old.attendance = 'present' and new.attendance is distinct from 'present' then
    delete from public.helper_credits where user_id = new.user_id and shift_id = new.shift_id;
  end if;
  return new;
end $$;
revoke execute on function public.credit_on_attendance() from anon, authenticated, public;
drop trigger if exists shift_signups_credit on public.shift_signups;
create trigger shift_signups_credit after update of attendance on public.shift_signups
  for each row execute function public.credit_on_attendance();

-- Saldo pro Helfer
create view public.helper_balance with (security_invoker = true) as
select p.id as user_id, p.full_name, p.team, p.helper_code,
  coalesce((select sum(amount_chf) from public.helper_credits c where c.user_id = p.id), 0)::numeric(8,2) as credited,
  coalesce((select sum(amount_chf) from public.helper_consumptions k where k.user_id = p.id), 0)::numeric(8,2) as consumed,
  (coalesce((select sum(amount_chf) from public.helper_credits c where c.user_id = p.id), 0)
   - coalesce((select sum(amount_chf) from public.helper_consumptions k where k.user_id = p.id), 0))::numeric(8,2) as balance
from public.profiles p;
grant select on public.helper_balance to authenticated;

-- Station: Helfer per Code nachschlagen (jedes eingeloggte Helferkonto an der Station darf das)
create or replace function public.helper_lookup(p_code text)
returns table (user_id uuid, full_name text, team text, credited numeric, consumed numeric, balance numeric, recent jsonb)
language sql security definer set search_path = public stable as $$
  select b.user_id, b.full_name, b.team, b.credited, b.consumed, b.balance,
    coalesce((select jsonb_agg(jsonb_build_object('name', k.name, 'qty', k.qty, 'amount', k.amount_chf, 'at', k.created_at) order by k.created_at desc)
              from (select * from public.helper_consumptions k where k.user_id = b.user_id order by k.created_at desc limit 8) k), '[]'::jsonb)
  from public.helper_balance b
  where auth.uid() is not null and b.helper_code = p_code;
$$;
revoke execute on function public.helper_lookup(text) from public;
grant execute on function public.helper_lookup(text) to authenticated;

-- Station: Konsumation abbuchen. p_items = [{"item_id": uuid, "qty": 2}, ...]
-- p_topup = true: reicht das Guthaben nicht, zahlt der Helfer den Rest bar/Karte; die Differenz wird als Gutschrift «Aufzahlung» verbucht (Saldo 0)
create or replace function public.book_helper_consumption(p_code text, p_items jsonb, p_station text default null, p_topup boolean default false)
returns table (balance numeric, topup numeric)
language plpgsql security definer set search_path = public as $$
declare uid uuid; total numeric := 0; bal numeric; diff numeric := 0;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  select id into uid from public.profiles where helper_code = p_code;
  if uid is null then raise exception 'Code unbekannt'; end if;
  select coalesce(sum(m.price_chf * (x->>'qty')::int), 0) into total
    from jsonb_array_elements(p_items) x join public.menu_items m on m.id = (x->>'item_id')::uuid;
  if total <= 0 then raise exception 'Nichts ausgewählt'; end if;
  select b.balance into bal from public.helper_balance b where b.user_id = uid;
  if total > bal + 0.001 then
    if not p_topup then raise exception 'Guthaben reicht nicht (noch % Fr.)', bal using errcode = 'P0001'; end if;
    diff := round(total - bal, 2);
    insert into public.helper_credits (user_id, amount_chf, reason, created_by) values (uid, diff, 'Aufzahlung bar/Karte', auth.uid());
  end if;
  insert into public.helper_consumptions (user_id, menu_item_id, name, qty, unit_price_chf, amount_chf, station, booked_by)
    select uid, m.id, m.name || coalesce(' ' || m.variant, ''), (x->>'qty')::int, m.price_chf, m.price_chf * (x->>'qty')::int, p_station, auth.uid()
    from jsonb_array_elements(p_items) x join public.menu_items m on m.id = (x->>'item_id')::uuid;
  return query select (bal + diff - total)::numeric, diff;
end $$;
revoke execute on function public.book_helper_consumption(text, jsonb, text, boolean) from public;
grant execute on function public.book_helper_consumption(text, jsonb, text, boolean) to authenticated;
