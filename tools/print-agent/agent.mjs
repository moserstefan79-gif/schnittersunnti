// Bon-Drucker-Agent: holt bezahlte Bestellungen aus Supabase und druckt sie als ESC/POS-Bon
// auf Netzwerkdrucker (Port 9100, z.B. Epson TM-m30/TM-T20, Star mC-Print, viele günstige 80-mm-Drucker).
// Läuft auf einem Laptop/Raspberry Pi im Festnetz:  node agent.mjs
//
// .env (gleiches Verzeichnis):
//   SUPABASE_URL=https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=...            (nur hier, nie im Browser!)
//   PRINTER_KUECHE=192.168.1.50
//   PRINTER_THEKE=192.168.1.51
//   PRINTER_BAR=192.168.1.51                 (Bar und Theke dürfen denselben Drucker teilen)
//   PRINT_GUEST_COPY=theke                   (optional: Station, die zusätzlich einen Gastbon druckt)

import net from 'node:net'
import { readFileSync, existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

if (existsSync('.env')) for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
}
const env = (k, d) => process.env[k] ?? d
const sb = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
const printers = { kueche: env('PRINTER_KUECHE'), theke: env('PRINTER_THEKE'), bar: env('PRINTER_BAR', env('PRINTER_THEKE')) }
const STATION = { kueche: 'KÜCHE', theke: 'THEKE', bar: 'BRASIL-BAR' }

// ---- ESC/POS ----
const ESC = '\x1b', GS = '\x1d'
const enc = (s) => Buffer.from(s.normalize('NFC'), 'latin1')   // CP858/latin1 reicht für ä ö ü
const cmd = {
  init: ESC + '@', center: ESC + 'a1', left: ESC + 'a0',
  bold: (on) => ESC + 'E' + (on ? '\x01' : '\x00'),
  size: (w, h) => GS + '!' + String.fromCharCode(((w - 1) << 4) | (h - 1)),
  cut: GS + 'V\x41\x10', feed: (n) => ESC + 'd' + String.fromCharCode(n),
  codepage: ESC + 't\x13',   // CP858 (Euro) – bei Problemen \x10 (CP1252) oder \x02 (CP850)
}
const line = (s = '') => s + '\n'
const pad = (l, r, w = 42) => l.slice(0, w - r.length - 1).padEnd(w - r.length) + r

function bon(job) {
  const p = job.payload; const t = new Date(p.paid_at)
  const time = t.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })
  let out = cmd.init + cmd.codepage
  out += cmd.center + cmd.bold(true) + cmd.size(1, 1) + line(STATION[job.station]) + cmd.bold(false)
  out += cmd.size(3, 3) + line(String(p.number)) + cmd.size(1, 1)
  out += cmd.bold(true) + cmd.size(2, 2) + line(p.fulfillment === 'table' ? `-> ${p.table}` : 'ABHOLUNG') + cmd.size(1, 1) + cmd.bold(false)
  if (p.guest) out += line(p.guest)
  out += line(time) + line('-'.repeat(42)) + cmd.left
  for (const it of p.items) out += cmd.bold(true) + cmd.size(1, 2) + line(`${String(it.qty).padStart(2)} x ${it.name}`) + cmd.size(1, 1) + cmd.bold(false)
  if (p.note) out += line('-'.repeat(42)) + cmd.bold(true) + line('!! ' + p.note) + cmd.bold(false)
  out += line('-'.repeat(42)) + cmd.feed(3) + cmd.cut
  return enc(out)
}

function guestBon(job) {
  const p = job.payload
  let out = cmd.init + cmd.codepage + cmd.center
  out += cmd.bold(true) + line('FC BEIZLI - HOME OF FOOTBALL') + cmd.bold(false) + line('Schnittersunnti Kirchberg')
  out += cmd.size(2, 2) + line(`Nr. ${p.number}`) + cmd.size(1, 1) + line('-'.repeat(42)) + cmd.left
  for (const it of p.items) out += line(`${String(it.qty).padStart(2)} x ${it.name}`)
  if (Number(p.deposit) > 0) out += line(pad(`Depot ${p.deposit_pieces} Stk.`, `CHF ${Number(p.deposit).toFixed(2)}`))
  out += line('-'.repeat(42)) + cmd.bold(true) + line(pad('TOTAL bezahlt (Twint/Karte)', `CHF ${Number(p.total).toFixed(2)}`)) + cmd.bold(false)
  if (Number(p.deposit) > 0) out += line('Depot an der Theke zurueck: bar oder Refund')
  out += cmd.center + line('Merci & en Guete!') + cmd.feed(3) + cmd.cut
  return enc(out)
}

function send(host, data) {
  return new Promise((res, rej) => {
    const s = net.createConnection({ host, port: 9100 }, () => s.end(data))
    s.setTimeout(5000, () => { s.destroy(); rej(new Error('timeout ' + host)) })
    s.on('close', res); s.on('error', rej)
  })
}

async function processJob(job) {
  const host = printers[job.station]
  if (!host) throw new Error(`Kein Drucker für ${job.station} konfiguriert`)
  await send(host, bon(job))
  if (env('PRINT_GUEST_COPY') === job.station) await send(host, guestBon(job))
}

async function tick() {
  const { data: jobs, error } = await sb.from('print_jobs').select('*').is('printed_at', null).order('created_at').limit(20)
  if (error) { console.error('DB', error.message); return }
  for (const j of jobs) {
    try {
      await processJob(j)
      await sb.from('print_jobs').update({ printed_at: new Date().toISOString(), error: null }).eq('id', j.id)
      console.log(`✓ #${j.payload.number} → ${j.station}`)
    } catch (e) {
      console.error(`✗ #${j.payload.number} ${j.station}: ${e.message}`)
      await sb.from('print_jobs').update({ error: e.message }).eq('id', j.id)   // bleibt offen, wird erneut versucht
    }
  }
}

console.log('Print-Agent läuft. Drucker:', printers)
sb.channel('print').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'print_jobs' }, tick).subscribe()
setInterval(tick, 5000); tick()

// Testbon:  node agent.mjs --test kueche
if (process.argv[2] === '--test') {
  const st = process.argv[3] ?? 'theke'
  processJob({ station: st, payload: { number: 999, fulfillment: 'table', table: 'Tisch 3', guest: 'Test', note: 'Testdruck', paid_at: new Date().toISOString(), total: 21.5, deposit: 2, deposit_pieces: 1, items: [{ name: 'Fish & Chips', qty: 1 }, { name: 'Bier im Chübeli 3 dl', qty: 1 }] } })
    .then(() => { console.log('Testbon gesendet'); process.exit(0) }).catch(e => { console.error(e.message); process.exit(1) })
}
