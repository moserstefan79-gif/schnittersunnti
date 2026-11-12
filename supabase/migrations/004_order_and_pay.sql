-- Order & Pay: Karte, Tische, Bestellungen, Zahlungen (Payrexx), Druckjobs

-- Stationen: wo wird zubereitet / wo druckt der Bon
create type public.station as enum ('kueche', 'theke', 'bar');
create type public.order_status as enum ('open', 'paid', 'in_progress', 'ready', 'delivered', 'cancelled');
create type public.fulfillment as enum ('pickup', 'table');

-- Tische / Standorte (QR-Code zeigt auf /bestellen/<code>)
create table public.tables (
  code text primary key,                 -- z.B. "T12", "BAR", "GARTEN3"
  label text not null,                   -- "Tisch 12", "Biergarten 3"
  zone text,                             -- "Festzelt", "Biergarten", "Bar"
  delivery_allowed boolean not null default true,
  active boolean not null default true
);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort int not null default 0,
  station public.station not null default 'theke'
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  article_no int unique,                 -- Nummer aus dem payfix-Artikelstamm
  name text not null,
  variant text,                          -- "Glas 1 dl", "mit Alkohol"
  description text,
  price_chf numeric(8,2) not null check (price_chf >= 0),
  deposit_chf numeric(8,2) not null default 0,   -- Depot pro Stück (Becher/Glas)
  station public.station not null,
  available boolean not null default true,
  sort int not null default 0
);

create sequence public.order_number_seq start 100;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number int not null default nextval('public.order_number_seq'),  -- Abhol-/Bonnummer
  status public.order_status not null default 'open',
  fulfillment public.fulfillment not null,
  table_code text references public.tables(code),
  guest_name text,
  note text,
  total_chf numeric(8,2) not null default 0,       -- inkl. Depot
  deposit_chf numeric(8,2) not null default 0,     -- davon Depot
  deposit_returned_chf numeric(8,2) not null default 0,
  payrexx_gateway_id bigint,
  payrexx_transaction_id bigint,
  paid_at timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz,
  client_token uuid not null default gen_random_uuid(),   -- Gast darf seine Bestellung damit lesen
  created_at timestamptz not null default now()
);
create index orders_status_idx on public.orders(status, created_at);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_id uuid references public.menu_items(id),
  name text not null,                    -- Snapshot
  station public.station not null,
  unit_price_chf numeric(8,2) not null,
  deposit_chf numeric(8,2) not null default 0,
  qty int not null check (qty > 0),
  done boolean not null default false
);
create index order_items_order_idx on public.order_items(order_id);

-- Druckjobs: pro bezahlte Bestellung ein Bon je Station (+ optional Gastbon)
create table public.print_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  station public.station not null,
  payload jsonb not null,
  printed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
create index print_jobs_pending_idx on public.print_jobs(created_at) where printed_at is null;

-- Wenn eine Bestellung bezahlt wird: Druckjobs erzeugen
create or replace function public.on_order_paid()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  st public.station;
begin
  if new.status = 'paid' and (old.status is distinct from 'paid') then
    for st in
      select distinct station from public.order_items where order_id = new.id
    loop
      insert into public.print_jobs (order_id, station, payload)
      values (new.id, st, jsonb_build_object(
        'number', new.number,
        'fulfillment', new.fulfillment,
        'table', (select label from public.tables where code = new.table_code),
        'guest', new.guest_name,
        'note', new.note,
        'paid_at', new.paid_at,
        'total', new.total_chf,
        'deposit', new.deposit_chf,
        'deposit_pieces', (select coalesce(sum(qty),0) from public.order_items where order_id = new.id and deposit_chf > 0),
        'items', (select jsonb_agg(jsonb_build_object('name', name, 'qty', qty) order by name)
                  from public.order_items where order_id = new.id and station = st)
      ));
    end loop;
  end if;
  return new;
end $$;

create trigger orders_paid_print
  after update on public.orders
  for each row execute function public.on_order_paid();

-- Gesamtbetrag serverseitig berechnen
create or replace function public.recalc_order_total()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.orders set
    total_chf = coalesce((select sum(qty * (unit_price_chf + deposit_chf)) from public.order_items where order_id = coalesce(new.order_id, old.order_id)), 0),
    deposit_chf = coalesce((select sum(qty * deposit_chf) from public.order_items where order_id = coalesce(new.order_id, old.order_id)), 0)
  where id = coalesce(new.order_id, old.order_id);
  return null;
end $$;
create trigger order_items_total after insert or update or delete on public.order_items
  for each row execute function public.recalc_order_total();

-- Bestellung anlegen (Gast, anonym): nimmt Positionen als JSON, prüft Preise gegen die Karte
create or replace function public.place_order(
  p_fulfillment public.fulfillment,
  p_table_code text,
  p_guest_name text,
  p_note text,
  p_items jsonb              -- [{"item_id": "...", "qty": 2}, ...]
) returns table (order_id uuid, client_token uuid, number int, total_chf numeric)
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  r record;
begin
  if p_fulfillment = 'table' then
    if p_table_code is null or not exists (select 1 from public.tables where code = p_table_code and active and delivery_allowed) then
      raise exception 'Tischlieferung an diesem Standort nicht möglich';
    end if;
  end if;
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'Warenkorb ist leer';
  end if;

  insert into public.orders (fulfillment, table_code, guest_name, note)
  values (p_fulfillment, p_table_code, nullif(trim(p_guest_name), ''), nullif(trim(p_note), ''))
  returning * into v_order;

  for r in select (e->>'item_id')::uuid as item_id, (e->>'qty')::int as qty from jsonb_array_elements(p_items) e loop
    insert into public.order_items (order_id, item_id, name, station, unit_price_chf, deposit_chf, qty)
    select v_order.id, m.id, m.name || coalesce(' ' || m.variant, ''), m.station, m.price_chf, m.deposit_chf, r.qty
    from public.menu_items m where m.id = r.item_id and m.available;
    if not found then raise exception 'Artikel nicht verfügbar'; end if;
  end loop;

  select * into v_order from public.orders where id = v_order.id;
  return query select v_order.id, v_order.client_token, v_order.number, v_order.total_chf;
end $$;

grant execute on function public.place_order(public.fulfillment, text, text, text, jsonb) to anon, authenticated;

-- Gast liest seine Bestellung über das Token
create or replace function public.get_order(p_order_id uuid, p_token uuid)
returns table (id uuid, number int, status public.order_status, fulfillment public.fulfillment, table_label text,
               total_chf numeric, deposit_chf numeric, deposit_returned_chf numeric, paid_at timestamptz, ready_at timestamptz, items jsonb)
language sql security definer set search_path = public stable as $$
  select o.id, o.number, o.status, o.fulfillment, t.label, o.total_chf, o.deposit_chf, o.deposit_returned_chf, o.paid_at, o.ready_at,
         (select jsonb_agg(jsonb_build_object('name', name, 'qty', qty, 'price', unit_price_chf, 'deposit', deposit_chf)) from public.order_items where order_id = o.id)
  from public.orders o left join public.tables t on t.code = o.table_code
  where o.id = p_order_id and o.client_token = p_token
$$;
grant execute on function public.get_order(uuid, uuid) to anon, authenticated;

-- Depot-Rückgaben (bar an der Theke oder Refund via Payrexx)
create type public.refund_method as enum ('cash', 'payrexx');
create table public.deposit_returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,   -- null = Becher ohne Bestellbezug (bar)
  pieces int not null check (pieces > 0),
  amount_chf numeric(8,2) not null,
  method public.refund_method not null,
  payrexx_refund_id bigint,
  by_user uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create or replace function public.on_deposit_return()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.order_id is not null then
    update public.orders set deposit_returned_chf = deposit_returned_chf + new.amount_chf where id = new.order_id;
  end if;
  return new;
end $$;
create trigger deposit_returns_apply after insert on public.deposit_returns
  for each row execute function public.on_deposit_return();

-- Helferrolle für Küche/Bar/Theke: jedes eingeloggte Profil darf Bestellungen bearbeiten
-- (am Fest meldet sich ein Helfer pro Station einmal an)
alter table public.tables enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.print_jobs enable row level security;
alter table public.deposit_returns enable row level security;
create policy "deposit: staff" on public.deposit_returns for select to authenticated using (true);
create policy "deposit: staff insert" on public.deposit_returns for insert to authenticated with check (method = 'cash' and by_user = auth.uid());

create policy "tables: public read" on public.tables for select to anon, authenticated using (active);
create policy "tables: admin" on public.tables for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "cats: public read" on public.menu_categories for select to anon, authenticated using (true);
create policy "cats: admin" on public.menu_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "items: public read" on public.menu_items for select to anon, authenticated using (true);
create policy "items: admin" on public.menu_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "orders: staff read" on public.orders for select to authenticated using (true);
create policy "orders: staff update" on public.orders for update to authenticated using (true) with check (true);
create policy "order_items: staff read" on public.order_items for select to authenticated using (true);
create policy "order_items: staff update" on public.order_items for update to authenticated using (true) with check (true);
create policy "print_jobs: admin" on public.print_jobs for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Realtime für Küchen-/Bar-Screen und Abholtafel
alter publication supabase_realtime add table public.orders, public.order_items;

-- Öffentliche Abholtafel: nur Nummern mit Status
create or replace view public.pickup_board with (security_invoker = false) as
  select number, status, fulfillment, ready_at
  from public.orders
  where status in ('paid', 'in_progress', 'ready') and fulfillment = 'pickup'
    and created_at > now() - interval '6 hours';
grant select on public.pickup_board to anon, authenticated;

-- Karte 2026 (Artikelnummern = payfix-Artikelstamm), Depot CHF 2.– auf Becher/Gläser
insert into public.menu_categories (name, sort, station) values
  ('Essen', 1, 'kueche'), ('Getränke', 2, 'theke'), ('Bierschenke', 3, 'theke'), ('Wein', 4, 'theke'), ('Brasil-Bar', 5, 'bar');

insert into public.menu_items (category_id, article_no, name, variant, description, price_chf, deposit_chf, station, sort)
select c.id, i.no, i.name, i.variant, i.description, i.price, i.dep, c.station, i.sort
from (values
  ('Essen', 103, 'Fish & Chips', null, null, 16.00, 0, 1),
  ('Essen', 101, 'Älplermagronen mit Apfelmus', null, 'vegetarisch', 12.00, 0, 2),
  ('Essen', 102, 'Fleischkäse im Mütschli', null, null, 9.00, 0, 3),
  ('Essen', 104, 'Chips', 'einzeln', null, 6.00, 0, 4),
  ('Bierschenke', 301, 'Bier im Chübeli', '3 dl', null, 4.00, 2, 1),
  ('Bierschenke', 302, 'Alkoholfreies Bier', '5 dl', null, 4.50, 2, 2),
  ('Bierschenke', 303, 'Brezel', null, null, 4.00, 0, 3),
  ('Getränke', 401, 'Mineralwasser ohne', 'PET 5 dl', null, 4.50, 0, 1),
  ('Getränke', 402, 'Mineralwasser mit', 'PET 5 dl', null, 4.50, 0, 2),
  ('Getränke', 403, 'Eistee', 'PET 5 dl', null, 4.50, 0, 3),
  ('Getränke', 404, 'Rivella rot', 'PET 5 dl', null, 4.50, 0, 4),
  ('Getränke', 405, 'Pepsi zero', 'PET 5 dl', null, 4.50, 0, 5),
  ('Getränke', 501, 'Kaffee', null, null, 4.00, 0, 6),
  ('Wein', 201, 'Weisswein Legio Julius', 'Glas 1 dl', 'Chasselas-Arvine-Arneis (CH)', 5.00, 2, 1),
  ('Wein', 202, 'Weisswein Legio Julius', 'Flasche 75 cl', 'Chasselas-Arvine-Arneis (CH)', 35.00, 2, 2),
  ('Wein', 205, 'Roséwein Legio Julius', 'Glas 1 dl', 'Pinot Noir-Lagrein (CH)', 5.00, 2, 3),
  ('Wein', 206, 'Roséwein Legio Julius', 'Flasche 75 cl', 'Pinot Noir-Lagrein (CH)', 35.00, 2, 4),
  ('Wein', 203, 'Rotwein Legio Julius', 'Glas 1 dl', 'Merlot-Primitivo (CH)', 5.00, 2, 5),
  ('Wein', 204, 'Rotwein Legio Julius', 'Flasche 75 cl', 'Merlot-Primitivo (CH)', 35.00, 2, 6),
  ('Brasil-Bar', 601, 'Batida de Coco', 'ohne Alkohol', null, 8.00, 2, 1),
  ('Brasil-Bar', 602, 'Batida de Coco', 'mit Alkohol', null, 10.00, 2, 2),
  ('Brasil-Bar', 603, 'Ipanema', 'ohne Alkohol', null, 8.00, 2, 3),
  ('Brasil-Bar', 604, 'Ipanema', 'mit Alkohol', null, 10.00, 2, 4)
) as i(cat, no, name, variant, description, price, dep, sort)
join public.menu_categories c on c.name = i.cat;

insert into public.tables (code, label, zone) values
  ('T1', 'Tisch 1', 'Festzelt'), ('T2', 'Tisch 2', 'Festzelt'), ('T3', 'Tisch 3', 'Festzelt'),
  ('T4', 'Tisch 4', 'Festzelt'), ('T5', 'Tisch 5', 'Festzelt'), ('T6', 'Tisch 6', 'Festzelt'),
  ('G1', 'Biergarten 1', 'Biergarten'), ('G2', 'Biergarten 2', 'Biergarten'), ('G3', 'Biergarten 3', 'Biergarten');

-- Härtung (Supabase-Advisor)
revoke execute on function public.on_order_paid() from anon, authenticated, public;
revoke execute on function public.on_deposit_return() from anon, authenticated, public;
revoke execute on function public.recalc_order_total() from anon, authenticated, public;
revoke execute on function public.place_order(public.fulfillment, text, text, text, jsonb) from public;
revoke execute on function public.get_order(uuid, uuid) from public;
