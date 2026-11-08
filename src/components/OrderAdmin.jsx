import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../lib/supabase.js'
import { chf } from '../lib/orders.js'

export default function OrderAdmin() {
  return (
    <>
      <MenuAdmin />
      <TablesAdmin />
      <SalesSummary />
    </>
  )
}

function MenuAdmin() {
  const [items, setItems] = useState([])
  const [cats, setCats] = useState([])
  async function load() {
    const [{ data: c }, { data: i }] = await Promise.all([
      supabase.from('menu_categories').select('*').order('sort'),
      supabase.from('menu_items').select('*').order('sort'),
    ])
    setCats(c ?? []); setItems(i ?? [])
  }
  useEffect(() => { load() }, [])
  async function patch(id, p) { await supabase.from('menu_items').update(p).eq('id', id); load() }

  return (
    <section className="mt-16">
      <h2 className="text-3xl">Karte</h2>
      <p className="mt-2 text-ink/70">Artikel ausblenden, wenn etwas ausgeht. Preise und Depot direkt ändern. Artikelnummern entsprechen dem payfix-Stamm.</p>
      {cats.map(c => (
        <div key={c.id} className="mt-6">
          <h3 className="font-display font-bold text-xl">{c.name} <span className="text-ink/50 text-base font-sans font-normal">· {c.station}</span></h3>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {items.filter(i => i.category_id === c.id).map(i => (
              <li key={i.id} className={`py-2 grid grid-cols-[3rem_1fr_6rem_6rem_7rem] gap-3 items-center ${i.available ? '' : 'opacity-50'}`}>
                <span className="text-sm text-ink/50 tabular-nums">{i.article_no}</span>
                <span>{i.name}{i.variant ? <span className="text-ink/60"> · {i.variant}</span> : ''}</span>
                <label className="text-sm">CHF <input type="number" step="0.5" className="field !py-1 !px-2 w-20" defaultValue={i.price_chf} onBlur={e => Number(e.target.value) !== Number(i.price_chf) && patch(i.id, { price_chf: e.target.value })} /></label>
                <label className="text-sm">Depot <input type="number" step="1" className="field !py-1 !px-2 w-14" defaultValue={i.deposit_chf} onBlur={e => Number(e.target.value) !== Number(i.deposit_chf) && patch(i.id, { deposit_chf: e.target.value })} /></label>
                <button onClick={() => patch(i.id, { available: !i.available })} className={`btn !py-1 text-sm ${i.available ? 'btn-ghost' : 'btn-primary'}`}>{i.available ? 'Ausverkauft' : 'Wieder da'}</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}

function TablesAdmin() {
  const [tables, setTables] = useState([])
  const [form, setForm] = useState({ code: '', label: '', zone: 'Festzelt' })
  async function load() { const { data } = await supabase.from('tables').select('*').order('code'); setTables(data ?? []) }
  useEffect(() => { load() }, [])

  async function add(e) {
    e.preventDefault()
    await supabase.from('tables').insert({ code: form.code.toUpperCase().trim(), label: form.label, zone: form.zone })
    setForm({ code: '', label: '', zone: form.zone }); load()
  }
  async function printQr() {
    const base = window.location.origin
    const cards = await Promise.all(tables.filter(t => t.active).map(async t => {
      const url = `${base}/bestellen/${t.code}`
      const svg = await QRCode.toString(url, { type: 'svg', margin: 1, width: 300, color: { dark: '#0E1114' } })
      return `<div class="card"><img src="/logo-small.png"><h1>${t.label}</h1>${svg}<p>Scannen · bestellen · Twint</p><small>${url.replace(/^https?:\/\//, '')}</small></div>`
    }))
    const w = window.open('', '_blank')
    w.document.write(`<!doctype html><html><head><title>QR-Karten</title><style>
      body{font-family:system-ui;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:0}
      .card{break-inside:avoid;height:148mm;box-sizing:border-box;padding:10mm;text-align:center;border:1px dashed #ccc;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4mm}
      .card img{height:22mm}.card h1{margin:0;font-size:26pt}.card svg{width:70mm;height:70mm}.card p{margin:0;font-weight:600}.card small{color:#666}
      @media print{.card{border:none}}</style></head><body>${cards.join('')}</body></html>`)
    w.document.close(); setTimeout(() => w.print(), 500)
  }

  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="text-3xl">Tische & QR-Codes</h2><p className="mt-2 text-ink/70">Jeder Tisch bekommt einen QR-Code auf <code>/bestellen/CODE</code>. «ABHOLEN» ist der Code für Theke/Bierdeckel ohne Lieferung.</p></div>
        <button onClick={printQr} className="btn btn-dark">QR-Karten drucken (A6)</button>
      </div>
      <form onSubmit={add} className="mt-4 flex flex-wrap gap-2 items-end">
        <label className="text-sm font-medium">Code<input className="field mt-1 w-28" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="T7" required /></label>
        <label className="text-sm font-medium">Bezeichnung<input className="field mt-1 w-48" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Tisch 7" required /></label>
        <label className="text-sm font-medium">Zone<input className="field mt-1 w-40" value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} /></label>
        <button className="btn btn-ghost">Hinzufügen</button>
      </form>
      <ul className="mt-4 flex flex-wrap gap-2">
        {tables.map(t => (
          <li key={t.code} className={`rounded-full border px-3 py-1 text-sm ${t.active ? 'border-ink/30' : 'border-line text-ink/40 line-through'}`}>
            <b>{t.code}</b> {t.label}{!t.delivery_allowed && ' · nur Abholung'}
            <button onClick={async () => { await supabase.from('tables').update({ active: !t.active }).eq('code', t.code); load() }} className="ml-2 text-ink/50 hover:text-orange-deep">{t.active ? '×' : '↺'}</button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function SalesSummary() {
  const [s, setS] = useState(null)
  useEffect(() => {
    (async () => {
      const { data: o } = await supabase.from('orders').select('status, total_chf, deposit_chf, deposit_returned_chf, fulfillment').in('status', ['paid', 'in_progress', 'ready', 'delivered'])
      const { data: li } = await supabase.from('order_items').select('name, qty, unit_price_chf, orders!inner(status)').neq('orders.status', 'open').neq('orders.status', 'cancelled')
      const top = Object.values((li ?? []).reduce((m, l) => { (m[l.name] ||= { name: l.name, qty: 0, chf: 0 }); m[l.name].qty += l.qty; m[l.name].chf += l.qty * Number(l.unit_price_chf); return m }, {})).sort((a, b) => b.chf - a.chf)
      setS({
        n: o?.length ?? 0,
        total: (o ?? []).reduce((a, x) => a + Number(x.total_chf), 0),
        deposit: (o ?? []).reduce((a, x) => a + Number(x.deposit_chf), 0),
        returned: (o ?? []).reduce((a, x) => a + Number(x.deposit_returned_chf), 0),
        table: (o ?? []).filter(x => x.fulfillment === 'table').length,
        top,
      })
    })()
  }, [])
  if (!s) return null
  return (
    <section className="mt-16">
      <h2 className="text-3xl">Online-Umsatz</h2>
      <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line">
        {[['Bestellungen', s.n], ['Umsatz inkl. Depot', chf(s.total)], ['Depot offen', chf(s.deposit - s.returned)], ['davon Tischlieferung', s.table]].map(([l, v]) => (
          <div key={l} className="bg-paper p-4"><dt className="text-sm text-ink/60">{l}</dt><dd className="font-display font-bold text-2xl mt-1">{v}</dd></div>
        ))}
      </dl>
      <ul className="mt-4 divide-y divide-line border-y border-line text-[15px]">
        {s.top.slice(0, 10).map(t => <li key={t.name} className="py-2 flex justify-between"><span>{t.qty}× {t.name}</span><span className="tabular-nums">{chf(t.chf)}</span></li>)}
      </ul>
      <p className="mt-2 text-sm text-ink/60">Bar- und Kartenzahlungen an der Theke laufen über payfix und sind hier nicht enthalten.</p>
    </section>
  )
}
