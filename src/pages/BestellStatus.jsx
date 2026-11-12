import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { fetchOrder, checkPayment, startPayment, chf } from '../lib/orders.js'
import { Shell } from './Bestellen.jsx'

const texts = {
  open: ['Zahlung ausstehend', 'Die Bestellung ist noch nicht bezahlt.'],
  paid: ['Bezahlt – wird vorbereitet', 'Danke! Deine Bestellung ist in der Küche bzw. an der Bar.'],
  in_progress: ['In Arbeit', 'Gleich fertig.'],
  ready: ['Unterwegs', 'Deine Bestellung ist fertig und kommt gleich an den Tisch.'],
  delivered: ['Serviert', 'En Guete und Prost!'],
  cancelled: ['Storniert', 'Diese Bestellung wurde storniert.'],
}

export default function BestellStatus() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const token = sp.get('t'); const r = sp.get('r')
  const [o, setO] = useState(null)
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    try { setO(await fetchOrder(id, token)) } catch (e) { setErr(e.message) }
  }

  useEffect(() => {
    load()
    // Nach Rückkehr von Payrexx: aktiv nachfragen, bis bezahlt (Webhook kann ein paar Sekunden brauchen)
    let tries = 0
    const t = setInterval(async () => {
      const cur = await fetchOrder(id, token).catch(() => null)
      if (cur && cur.status !== 'open') { setO(cur); clearInterval(t); return }
      if (r === 'ok' && tries < 10) { await checkPayment(id, token); tries++ } else if (tries >= 10) clearInterval(t)
    }, 2500)
    const ch = supabase.channel('order-' + id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, load)
      .subscribe()
    return () => { clearInterval(t); supabase.removeChannel(ch) }
  }, [id, token, r])

  async function retry() {
    setBusy(true)
    try { window.location.href = await startPayment(id, token) } catch (e) { setErr(e.message); setBusy(false) }
  }

  if (err) return <Shell title="Bestellung"><p className="text-orange-deep">{err}</p></Shell>
  if (!o) return <Shell title="Bestellung"><p className="text-ink/60">Lädt …</p></Shell>
  const [h, p] = texts[o.status]
  const ready = o.status === 'ready'

  return (
    <Shell>
      <div className={`rounded-3xl p-8 text-center ${ready ? 'bg-rasen text-white' : o.status === 'open' ? 'bg-stroh' : 'bg-ink text-white'}`}>
        <p className="text-sm opacity-70">Bestellung für {o.table_label}</p>
        <p className="font-display font-extrabold text-8xl leading-none mt-2 tabular-nums">{o.number}</p>
        <p className="font-display font-bold text-2xl mt-5">{h}</p>
        <p className="mt-1 opacity-80">{p}</p>
        {o.status === 'open' && (
          <button onClick={retry} disabled={busy} className="btn btn-dark mt-5">{busy ? '…' : 'Jetzt bezahlen'}</button>
        )}
      </div>

      <ul className="mt-6 divide-y divide-line border-y border-line text-[15px]">
        {o.items?.map((i, k) => <li key={k} className="py-2 flex justify-between"><span>{i.qty}× {i.name}</span><span className="tabular-nums">{chf(i.qty * i.price)}</span></li>)}
        {Number(o.deposit_chf) > 0 && <li className="py-2 flex justify-between text-ink/70"><span>Depot</span><span className="tabular-nums">{chf(o.deposit_chf)}</span></li>}
        <li className="py-2 flex justify-between font-bold"><span>Total</span><span className="tabular-nums">{chf(o.total_chf)}</span></li>
      </ul>

      {Number(o.deposit_chf) > 0 && o.status !== 'open' && (
        <div className="mt-6 rounded-xl border border-line p-4">
          <p className="font-semibold">Depot zurückgeben</p>
          <p className="text-sm text-ink/70 mt-1">Zeig diese Seite an der Theke. Offen: <b>{chf(Number(o.deposit_chf) - Number(o.deposit_returned_chf))}</b> – bar oder zurück auf dein Twint/Karte.</p>
        </div>
      )}

      <Link to="/bestellen" className="btn btn-ghost w-full mt-6">Nochmals bestellen</Link>
    </Shell>
  )
}
