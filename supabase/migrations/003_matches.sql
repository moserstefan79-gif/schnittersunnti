-- Spiele, die im Beizli auf dem Screen gezeigt werden (öffentlich sichtbar)
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  kicks_off_at timestamptz not null,
  competition text not null,            -- z.B. "Frauen-WM 2027"
  stage text,                           -- z.B. "Viertelfinal"
  home text not null,                   -- Team oder Platzhalter ("Sieger Gruppe A")
  away text not null,
  note text,                            -- z.B. "mit Caipirinha-Happy-Hour"
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create index matches_kickoff_idx on public.matches(kicks_off_at);

alter table public.matches enable row level security;

create policy "matches: public read" on public.matches for select to anon, authenticated
  using (is_published);
create policy "matches: admin write" on public.matches for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Beispiel (Platzhalter bis der FIFA-Spielplan steht):
-- insert into public.matches (kicks_off_at, competition, stage, home, away, note) values
--   ('2027-07-16 21:00+02', 'Frauen-WM 2027', 'Viertelfinal', 'offen', 'offen', 'Brasilien-Bar bis 02:00');
