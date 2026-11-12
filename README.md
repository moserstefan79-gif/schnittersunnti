# Schnittersunnti – FC Beizli Kirchberg

Website für das FC Beizli am Schnittersunnti mit eigener Helferverwaltung (Login, Schichtplan, Admin-Übersicht).

Stack: Vite + React + Tailwind v4 + Supabase (Auth, Postgres, RLS).

## Setup

1. **Supabase-Projekt**: `schnittersunnti` (Ref `etvuxfgvhrojfthvkcte`, Region Zürich) – Migrationen 001–004 sind eingespielt (Stand 12.11.2026).
2. **Migrationen ausführen** im SQL-Editor, in dieser Reihenfolge:
   - `supabase/migrations/001_schema.sql` – Tabellen, Trigger, Views, RLS
   - `supabase/migrations/002_seed_shifts_2027.sql` – 42 Schichten / 107 Plätze für 16.–18. Juli 2027
   - `supabase/migrations/003_matches.sql` – Tabelle `matches` für die Spiele auf dem Screen (Admins pflegen sie unter `/admin`)
   - `supabase/migrations/004_order_and_pay.sql` – Order & Pay: Karte 2026 (payfix-Artikelnummern), Tische, Bestellungen, Depot, Druckjobs
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

## Order & Pay (Bestellen am Tisch, Twint via Payrexx, Bon-Drucker, Depot)

**Ablauf Gast:** QR am Tisch → `/bestellen/T3` → Karte → Warenkorb → Payrexx (Twint/Karte) → Statusseite mit Bestellnummer. Alles wird an den Tisch gebracht (keine Abholung). Depot CHF 2.– pro Becher/Glas wird mitbezahlt.

**Ablauf Betrieb:**
- `/station/kueche`, `/station/theke`, `/station/bar` – Live-Boards pro Station (Login mit Helferkonto). Positionen abhaken, «Alles bereit», Springer tippt «Geliefert». Bestellungen > 15 min werden orange.
- `/station/theke` → Tab **Depot**: Bestellnummer eingeben, Stückzahl, «Bar auszahlen» oder «Auf Twint/Karte» (Teil-Refund via Payrexx). Becher ohne Bestellbezug: nur bar.
- `/admin` – Karte (ausverkauft, Preise, Depot), Tische + QR-Karten als A6-Druck, Online-Umsatz.
- Bar-/Kartenzahlung direkt an der Theke läuft weiterhin über **payfix (Dinaco)**; gleicher Artikelstamm (Spalte `article_no`), getrennte Umsätze.

**Payrexx einrichten**
1. Konto auf payrexx.com (Verein als Vertragspartner, Twint aktivieren). Instanzname = Subdomain (`fckirchberg.payrexx.com` → `fckirchberg`).
2. Unter API-Keys einen Schlüssel erstellen.
3. Edge Functions deployen und Secrets setzen:
   ```
   supabase functions deploy payrexx-create payrexx-webhook payrexx-check payrexx-refund
   supabase secrets set PAYREXX_INSTANCE=fckirchberg PAYREXX_API_SECRET=...
   ```
   `payrexx-webhook` muss ohne JWT erreichbar sein: in `supabase/config.toml` `[functions.payrexx-webhook] verify_jwt = false` (gilt auch für `payrexx-create` und `payrexx-check`, die der anonyme Gast aufruft).
4. In Payrexx unter Webhooks die URL `https://<projekt>.supabase.co/functions/v1/payrexx-webhook` eintragen (Ereignis: Transaktion).
5. Testmodus in Payrexx nutzen, bis der erste echte Durchlauf sitzt.

**Bon-Drucker** (`tools/print-agent`): Netzwerkdrucker mit ESC/POS auf Port 9100 (Epson TM-m30/TM-T20, Star mC-Print, viele 80-mm-Geräte). Ein Laptop oder Raspberry Pi im selben Netz führt den Agenten aus:
```
cd tools/print-agent && npm install && cp .env.example .env   # URL, Service-Role-Key, Drucker-IPs eintragen
npm run test       # Testbon
npm start          # läuft während des Fests
```
Pro bezahlte Bestellung druckt jede beteiligte Station ihren Bon (Nummer gross, Tisch/Abholung, Positionen, Bemerkung). `PRINT_GUEST_COPY=theke` druckt zusätzlich einen Gastbon mit Total und Depot. Fehlgeschlagene Drucke bleiben offen und werden alle 5 s erneut versucht.

**Netz am Fest:** eigener Router (4G/5G) mit WLAN für Drucker, Stationen-Tablets und Tafel; Gäste bestellen über ihr Mobilnetz. Druckerfeste IPs vergeben.

## Deploy (GitHub + Netlify)

1. Repo `moserstefan79-gif/schnittersunnti` auf GitHub anlegen (leer, ohne README) und pushen:
   ```
   git remote add origin git@github.com:moserstefan79-gif/schnittersunnti.git
   git push -u origin main
   ```
2. Netlify → «Add new site» → «Import from Git» → das Repo wählen. Build-Befehl und Publish-Ordner kommen aus `netlify.toml`.
3. Unter Site configuration → Environment variables `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` setzen, dann «Trigger deploy».
4. Domain `schnittersunnti.ch` unter Domain management hinzufügen; bei Wix/Registrar die DNS-Einträge gemäss Netlify-Anleitung setzen (A/ALIAS auf Netlify, `www` als CNAME). Netlify stellt das SSL-Zertifikat automatisch aus.
5. In Supabase die Netlify-URL (und später `https://www.schnittersunnti.ch`) als Site-URL/Redirect eintragen.

Jeder Push auf `main` löst danach automatisch ein Deploy aus.

## Struktur

```
src/
  pages/Home.jsx        Landingpage (Hero, Angebot, Geschichte, Verein, Partner)
  pages/Helfer.jsx      Login + Schichtplan + «Meine Schichten»
  pages/Admin.jsx       Admin-Übersicht, CSV-Export, Spiele, Karte, Tische/QR, Umsatz
  pages/Bestellen.jsx   Gast: Karte + Warenkorb + Checkout
  pages/BestellStatus.jsx  Gast: Nummer, Status, Depot
  pages/Station.jsx     Küche/Theke/Bar-Boards + Depot-Rückgabe
  components/           Layout, AuthProvider, AuthForm, Matches, MatchEditor, OrderAdmin
  lib/supabase.js       Client + Eventdaten;  lib/orders.js  Bestell-API
supabase/migrations/    Schema + Seed
supabase/functions/     payrexx-create, payrexx-webhook, payrexx-check, payrexx-refund
tools/print-agent/      Bon-Drucker-Agent (Node, ESC/POS)
```

Jahreswechsel: Daten in `src/lib/supabase.js` (EVENT) anpassen, neue Schichten seeden, alte Anmeldungen leeren.
