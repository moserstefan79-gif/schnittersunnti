-- Rechnungskonten: Konsumation auf Rechnung (z.B. Club 92, Gemeinde). Buchung an der Station per Code, Rechnung nach dem Fest.

insert into public.settings values
  ('invoice_iban', '"CH00 0000 0000 0000 0000 0"'),
  ('invoice_creditor', '{"name":"FC Kirchberg","street":"Postfach","zip":"3422","city":"Kirchberg BE"}'),
  ('invoice_footer', '"Zahlbar innert 30 Tagen. Besten Dank für die Unterstützung des FC Beizli «Home of Football»."')
on conflict (key) do nothing;

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,                       -- 4-stellig, beginnt mit 9 (Helfercodes 1000–8999)
  contact text,
  street text,
  zip text,
  city text,
  email text,
  limit_chf numeric(8,2),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.account_invoices (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  number text not null unique,
  issued_at date not null default current_date,
  due_at date not null default current_date + 30,
  total_chf numeric(10,2) not null,
  status text not null default 'open' check (status in ('open', 'paid', 'void')),
  paid_at date,
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.account_bookings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  invoice_id uuid references public.account_invoices(id) on delete set null,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  qty int not null check (qty > 0),
  unit_price_chf numeric(8,2) not null,
  amount_chf numeric(8,2) not null,
  station text,
  consumer text,                           -- wer bezogen hat (freiwillig)
  booked_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index account_bookings_acc_idx on public.account_bookings(account_id, created_at);

alter table public.accounts enable row level security;
alter table public.account_invoices enable row level security;
alter table public.account_bookings enable row level security;
create policy "accounts: admin" on public.accounts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "invoices: admin" on public.account_invoices for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "bookings: admin" on public.account_bookings for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.gen_account_code()
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  loop
    c := (9000 + floor(random() * 1000))::int::text;
    exit when not exists (select 1 from public.accounts where code = c) and not exists (select 1 from public.profiles where helper_code = c);
  end loop;
  return c;
end $$;
revoke execute on function public.gen_account_code() from anon, authenticated, public;
create or replace function public.set_account_code()
returns trigger language plpgsql security definer set search_path = public as $$
begin if new.code is null then new.code := public.gen_account_code(); end if; return new; end $$;
revoke execute on function public.set_account_code() from anon, authenticated, public;
create trigger accounts_code before insert on public.accounts for each row execute function public.set_account_code();

-- Saldo pro Konto
create view public.account_balance with (security_invoker = true) as
select a.*,
  coalesce((select sum(b.amount_chf) from public.account_bookings b where b.account_id = a.id and b.invoice_id is null), 0)::numeric(10,2) as open_chf,
  coalesce((select sum(i.total_chf) from public.account_invoices i where i.account_id = a.id and i.status = 'open'), 0)::numeric(10,2) as invoiced_open_chf,
  coalesce((select sum(i.total_chf) from public.account_invoices i where i.account_id = a.id and i.status = 'paid'), 0)::numeric(10,2) as paid_chf,
  (select count(*) from public.account_bookings b where b.account_id = a.id and b.invoice_id is null)::int as open_items
from public.accounts a;
grant select on public.account_balance to authenticated;

-- Station: Konto per Code nachschlagen
create or replace function public.account_lookup(p_code text)
returns table (account_id uuid, name text, contact text, limit_chf numeric, open_chf numeric, recent jsonb)
language sql security definer set search_path = public stable as $$
  select a.id, a.name, a.contact, a.limit_chf, b.open_chf,
    coalesce((select jsonb_agg(jsonb_build_object('name', k.name, 'qty', k.qty, 'amount', k.amount_chf, 'consumer', k.consumer, 'at', k.created_at) order by k.created_at desc)
              from (select * from public.account_bookings k where k.account_id = a.id order by k.created_at desc limit 8) k), '[]'::jsonb)
  from public.accounts a join public.account_balance b on b.id = a.id
  where auth.uid() is not null and a.active and a.code = p_code;
$$;
revoke execute on function public.account_lookup(text) from public;
grant execute on function public.account_lookup(text) to authenticated;

-- Station: auf Rechnung buchen
create or replace function public.book_account(p_code text, p_items jsonb, p_station text default null, p_consumer text default null)
returns table (open_chf numeric)
language plpgsql security definer set search_path = public as $$
declare acc uuid; total numeric; lim numeric; cur numeric;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  select id, limit_chf into acc, lim from public.accounts where code = p_code and active;
  if acc is null then raise exception 'Code unbekannt'; end if;
  select coalesce(sum(m.price_chf * (x->>'qty')::int), 0) into total
    from jsonb_array_elements(p_items) x join public.menu_items m on m.id = (x->>'item_id')::uuid;
  if total <= 0 then raise exception 'Nichts ausgewählt'; end if;
  select b.open_chf into cur from public.account_balance b where b.id = acc;
  if lim is not null and cur + total > lim + 0.001 then raise exception 'Limite von % Fr. überschritten (offen %)', lim, cur using errcode = 'P0001'; end if;
  insert into public.account_bookings (account_id, menu_item_id, name, qty, unit_price_chf, amount_chf, station, consumer, booked_by)
    select acc, m.id, m.name || coalesce(' ' || m.variant, ''), (x->>'qty')::int, m.price_chf, m.price_chf * (x->>'qty')::int, p_station, nullif(trim(p_consumer), ''), auth.uid()
    from jsonb_array_elements(p_items) x join public.menu_items m on m.id = (x->>'item_id')::uuid;
  return query select (cur + total)::numeric;
end $$;
revoke execute on function public.book_account(text, jsonb, text, text) from public;
grant execute on function public.book_account(text, jsonb, text, text) to authenticated;

-- Admin: Rechnung aus allen offenen Buchungen erstellen (Nummer JJJJ-NN)
create or replace function public.create_account_invoice(p_account uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv uuid; total numeric; n int; num text;
begin
  if not public.is_admin() then raise exception 'Nur Admin'; end if;
  select coalesce(sum(amount_chf), 0) into total from public.account_bookings where account_id = p_account and invoice_id is null;
  if total <= 0 then raise exception 'Keine offenen Buchungen'; end if;
  select count(*) + 1 into n from public.account_invoices where number like to_char(current_date, 'YYYY') || '-%';
  num := to_char(current_date, 'YYYY') || '-' || lpad(n::text, 2, '0');
  insert into public.account_invoices (account_id, number, total_chf, created_by) values (p_account, num, total, auth.uid()) returning id into inv;
  update public.account_bookings set invoice_id = inv where account_id = p_account and invoice_id is null;
  return inv;
end $$;
revoke execute on function public.create_account_invoice(uuid) from public;
grant execute on function public.create_account_invoice(uuid) to authenticated;
