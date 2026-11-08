# Schnittersunnti – FC Beizli Kirchberg

Website für das FC Beizli am Schnittersunnti mit eigener Helferverwaltung (Login, Schichtplan, Admin-Übersicht).

Stack: Vite + React + Tailwind v4 + Supabase (Auth, Postgres, RLS).

## Setup

1. **Supabase-Projekt anlegen** (Region Zürich `eu-central-2`).
2. **Migrationen ausführen** im SQL-Editor, in dieser Reihenfolge:
   - `supabase/migrations/001_schema.sql` – Tabellen, Trigger, Views, RLS
   - `supabase/migrations/002_seed_shifts_2027.sql` – 46 Schichten / 108 Plätze für 16.–18. Juli 2027
   - `supabase/migrations/003_matches.sql` – Tabelle `matches` für die Spiele auf dem Screen (Admins pflegen sie unter `/admin`)
3. **Auth**: Authentication → Providers → Email aktiviert lassen. «Confirm email» nach Wunsch (für den Vereinsgebrauch darf es auch aus sein).
   Unter Authentication → URL Configuration die Site-URL (z.B. `https://www.schnittersunnti.ch`) und `…/helfer` als Redirect eintragen.
4. **`.env`** aus `.env.example` kopieren, `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` (Publishable Key) eintragen.
5. `npm install && npm run dev`

## Admin freischalten

Nach dem ersten Login im SQL-Editor:

```sql
update public.profiles set is_admin = true where id = (select id from auth.users where email = 'deine@mail.ch');
```

Admins sehen unter `/admin` den vollständigen Plan mit Namen, Telefon und Mannschaft, können nach offenen Schichten filtern und als CSV exportieren.

## Schichten anpassen

Direkt in der Tabelle `shifts` (Supabase Table Editor) – `capacity` erhöhen, Zeiten ändern, Posten ergänzen. Die Kapazität wird beim Anmelden datenbankseitig geprüft (kein Überbuchen).

## Deploy

`npm run build` → `dist/` auf Netlify/Vercel/Cloudflare Pages. SPA-Routing: alle Pfade auf `index.html` umleiten (Netlify: `_redirects` mit `/* /index.html 200`).

## Struktur

```
src/
  pages/Home.jsx        Landingpage (Hero, Angebot, Geschichte, Verein, Partner)
  pages/Helfer.jsx      Login + Schichtplan + «Meine Schichten»
  pages/Admin.jsx       Admin-Übersicht, CSV-Export
  components/           Layout, AuthProvider, AuthForm, Matches (öffentlich), MatchEditor (Admin)
  lib/supabase.js       Client + Eventdaten (Daten/Zeiten/Kontakt zentral hier)
supabase/migrations/    Schema + Seed
```

Jahreswechsel: Daten in `src/lib/supabase.js` (EVENT) anpassen, neue Schichten seeden, alte Anmeldungen leeren.
