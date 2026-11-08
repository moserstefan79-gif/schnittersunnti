import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabaseConfigured } from '../lib/supabase.js'
import { fetchMenu, fetchTable, placeOrder, startPayment, chf, remember, recall } from '../lib/orders.js'

export default function Bestellen() {
  const { code } = useParams()                 // QR: /bestellen/T12  oder /bestellen (Abholung)
  const [table, setTable] = useState(undefined)
  const [menu, setMenu] = useState([])
  const [cart, setCart] = useState({})          // item_id -> qty
  const [step, setStep] = useState('menu')      // menu | checkout
  const [fulfillment, setFulfillment] = useState('pickup')
  const [guest, setGuest] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const last = recall()

  useEffect(() => {
    if (!supabaseConfigured) return
    fetchMenu().then(setMenu)
    if (code) fetchTable(code.toUpperCase()).then(t => { setTable(t); if (t?.delivery_allowed) setFulfillment('table') })
    else setTable(null)
  }, [code])

  const items = useMemo(() => Object.fromEntries(menu.flatMap(c => c.items).map(i => [i.id, i])), [menu])
  const lines = Object.entries(cart).filter(([, q]) => q > 0).map(([id, qty]) => ({ ...items[id], qty }))
  const total = lines.reduce((a, l) => a + l.qty * (Number(l.price_chf) + Number(l.deposit_chf)), 0)
  const deposit = lines.reduce((a, l) => a + l.qty * Number(l.deposit_chf), 0)
  const count = lines.reduce((a, l) => a + l.qty, 0)
  const add = (id, d) => setCart(c => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + d) }))

  async function pay() {
    setBusy(true); setErr(null)
    try {
      const o = await placeOrder({ fulfillment, tableCode: fulfillment === 'table' ? table.code : null, guestName: guest, note, cart: lines })
      remember({ id: o.order_id, token: o.client_token, number: o.number })
      const link = await startPayment(o.order_id, o.client_token)
      window.location.href = link
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  if (!supabaseConfigured) return <Shell><p className="text-ink/60">Bestellsystem ist noch nicht angeschlossen.</p></Shell>

  if (step === 'checkout') {
    return (
      <Shell title="Fast fertig" table={table}>
        <ul className="divide-y divide-line border-y border-line">
          {lines.map(l => (
            <li key={l.id} className="py-3 flex justify-between gap-4">
              <span><span className="font-semibold tabular-nums">{l.qty}×</span> {l.name}{l.variant ? <span className="text-ink/60"> {l.variant}</span> : ''}</span>
              <span className="tabular-nums">{chf(l.qty * Number(l.price_chf))}</span>
            </li>
          ))}
          {deposit > 0 && <li className="py-3 flex justify-between text-ink/70"><span>Depot Becher/Glas ({deposit / 2} × CHF 2.–)</span><span className="tabular-nums">{chf(deposit)}</span></li>}
          <li className="py-3 flex justify-between font-display font-bold text-xl"><span>Total</span><span className="tabular-nums">{chf(total)}</span></li>
        </ul>
        {deposit > 0 && <p className="mt-3 text-sm text-ink/60">Depot bekommst du an der Theke zurück – bar oder auf dein Zahlungsmittel.</p>}

        {table?.delivery_allowed && (
          <fieldset className="mt-6">
            <legend className="font-semibold">Wie möchtest du es?</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[['table', `An ${table.label} bringen`], ['pickup', 'Selbst abholen']].map(([v, l]) => (
                <label key={v} className={`cursor-pointer rounded-xl border-2 px-4 py-3 text-center font-semibold ${fulfillment === v ? 'border-orange bg-orange/10' : 'border-line'}`}>
                  <input type="radio" className="sr-only" name="f" value={v} checked={fulfillment === v} onChange={() => setFulfillment(v)} />{l}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {fulfillment === 'pickup' && <p className="mt-4 text-ink/70">Du bekommst eine Nummer. Sobald sie auf der Tafel leuchtet, holst du an der Theke ab.</p>}

        <label className="block mt-5"><span className="text-sm font-medium">Dein Vorname (für die Lieferung)</span>
          <input className="field mt-1" value={guest} onChange={e => setGuest(e.target.value)} placeholder="z.B. Stefan" /></label>
        <label className="block mt-3"><span className="text-sm font-medium">Bemerkung (optional)</span>
          <input className="field mt-1" value={note} onChange={e => setNote(e.target.value)} placeholder="ohne Apfelmus …" /></label>

        {err && <p className="mt-4 rounded-lg bg-orange/15 text-orange-deep px-4 py-3">{err}</p>}
        <div className="mt-6 flex gap-3">
          <button onClick={() => setStep('menu')} className="btn btn-ghost">Zurück</button>
          <button onClick={pay} disabled={busy || count === 0} className="btn btn-primary flex-1 text-lg disabled:opacity-60">
            {busy ? 'Einen Moment …' : `Mit Twint oder Karte bezahlen · ${chf(total)}`}
          </button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell title={table ? table.label : 'Bestellen & abholen'} table={table}>
      {last && <Link to={`/bestellen/status/${last.id}?t=${last.token}`} className="block mb-6 rounded-xl bg-stroh px-4 py-3 text-sm">Deine letzte Bestellung <b>#{last.number}</b> ansehen →</Link>}
      {menu.map(c => (
        <section key={c.id} className="mb-8">
          <h2 className="text-2xl md:text-3xl">{c.name}</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {c.items.map(i => (
              <li key={i.id} className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold leading-tight">{i.name}{i.variant ? <span className="text-ink/60 font-normal"> · {i.variant}</span> : ''}</p>
                  <p className="text-sm text-ink/60">{chf(i.price_chf)}{Number(i.deposit_chf) > 0 ? ' + Depot 2.–' : ''}{i.description ? ` · ${i.description}` : ''}</p>
                </div>
                <div className="flex items-center gap-1">
                  {cart[i.id] > 0 && <>
                    <button onClick={() => add(i.id, -1)} className="h-11 w-11 rounded-full border border-ink/30 text-xl" aria-label="weniger">−</button>
                    <span className="w-7 text-center font-bold tabular-nums">{cart[i.id]}</span>
                  </>}
                  <button onClick={() => add(i.id, 1)} className="h-11 w-11 rounded-full bg-ink text-white text-xl" aria-label="mehr">+</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {count > 0 && (
        <div className="sticky bottom-4">
          <button onClick={() => setStep('checkout')} className="btn btn-primary w-full text-lg shadow-xl justify-between px-6">
            <span>{count} {count === 1 ? 'Artikel' : 'Artikel'}</span><span>Weiter · {chf(total)}</span>
          </button>
        </div>
      )}
    </Shell>
  )
}

export function Shell({ title, table, children }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-28">
      <div className="flex items-center gap-3">
        <img src="/logo-small.png" alt="" className="h-12 w-auto" />
        <div>
          <p className="text-sm text-ink/60">Home of Football · FC Beizli</p>
          {title && <h1 className="text-2xl leading-none">{title}</h1>}
        </div>
      </div>
      {table === null && title && <p className="mt-2 text-sm text-ink/60">Du bestellst zum Abholen an der Theke.</p>}
      <div className="mt-6">{children}</div>
    </div>
  )
}
