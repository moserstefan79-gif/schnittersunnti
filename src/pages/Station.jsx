import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { supabase, supabaseConfigured, asset } from '../lib/supabase.js'
import { useAuth } from '../components/AuthProvider.jsx'
import AuthForm from '../components/AuthForm.jsx'
import { chf } from '../lib/orders.js'

const STATIONS = { kueche: 'Küche', theke: 'Theke', bar: 'Brasil-Bar' }

export default function Station() {
  const { station } = useParams()
  const { session, loading } = useAuth()
  if (!STATIONS[station]) return <Navigate to="/station/theke" replace />
  if (!supabaseConfigured || loading) return null
  if (!session) return <div className="mx-auto max-w-md px-4 py-12"><h1 className="text-3xl mb-6">Station {STATIONS[station]}</h1><AuthForm /></div>
  return <Board station={station} userId={session.user.id} />
}

function Board({ station, userId }) {
  const [orders, setOrders] = useState([])
  const [tab, setTab] = useState('offen')   // offen | bereit | depot
  const [clock, setClock] = useState(Date.now())

  async function load() {
    const { data } = await supabase.from('orders')
      .select('*, order_items(*), tables(label)')
      .in('status', ['paid', 'in_progress', 'ready'])
      .order('paid_at', { ascending: true })
    setOrders(data ?? [])
  }
  useEffect(() => {
    load()
    const ch = supabase.channel('station-' + station)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, load)
      .subscribe()
    const t = setInterval(() => setClock(Date.now()), 15000)
    return () => { supabase.removeChannel(ch); clearInterval(t) }
  }, [station])

  // Für diese Station relevante Bestellungen: enthält mind. eine Position der Station
  const mine = useMemo(() => orders
    .map(o => ({ ...o, lines: o.order_items.filter(i => i.station === station) }))
    .filter(o => o.lines.length), [orders, station])
  const open = mine.filter(o => o.lines.some(l => !l.done))
  const done = mine.filter(o => o.lines.every(l => l.done))

  async function toggleLine(l) {
    await supabase.from('order_items').update({ done: !l.done }).eq('id', l.id)
  }
  async function stationDone(o) {
    await supabase.from('order_items').update({ done: true }).in('id', o.lines.map(l => l.id))
    const { data: all } = await supabase.from('order_items').select('done').eq('order_id', o.id)
    if (all.every(i => i.done)) await supabase.from('orders').update({ status: 'ready', ready_at: new Date().toISOString() }).eq('id', o.id)
    else if (o.status === 'paid') await supabase.from('orders').update({ status: 'in_progress' }).eq('id', o.id)
  }
  async function delivered(o) {
    await supabase.from('orders').update({ status: 'delivered', delivered_at: new Date().toISOString() }).eq('id', o.id)
  }

  const age = (iso) => Math.max(0, Math.round((clock - new Date(iso).getTime()) / 60000))

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-10 bg-ink/95 backdrop-blur border-b border-white/10 px-4 h-14 flex items-center gap-4">
        <img src={asset("/logo-small.png")} alt="" className="h-9 w-auto rounded bg-white p-0.5" />
        <h1 className="font-display font-bold text-xl">{STATIONS[station]}</h1>
        <nav className="ml-auto flex gap-1 text-sm">
          {Object.entries(STATIONS).map(([k, v]) => <Link key={k} to={`/station/${k}`} className={`px-3 py-1.5 rounded-full ${k === station ? 'bg-orange text-ink font-semibold' : 'text-white/60 hover:text-white'}`}>{v}</Link>)}
        </nav>
      </header>

      <div className="px-4 pt-4 flex gap-2">
        {[['offen', `Offen (${open.length})`], ['bereit', `Bereit (${done.length})`], ...(station === 'theke' ? [['depot', 'Depot']] : [])].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`btn !py-2 ${tab === k ? 'btn-primary' : 'border border-white/30 text-white'}`}>{l}</button>
        ))}
      </div>

      {tab === 'depot' ? <Depot userId={userId} /> : (
        <ul className="p-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(tab === 'offen' ? open : done).length === 0 && <li className="text-white/50">Nichts offen.</li>}
          {(tab === 'offen' ? open : done).map(o => {
            const m = age(o.paid_at); const late = m >= 15
            return (
              <li key={o.id} className={`rounded-2xl bg-white text-ink p-4 flex flex-col gap-3 border-4 ${late && tab === 'offen' ? 'border-orange' : 'border-transparent'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-display font-extrabold text-4xl leading-none tabular-nums">{o.number}</p>
                    <p className="mt-1 font-semibold">{o.fulfillment === 'table' ? `→ ${o.tables?.label}` : 'Abholung'}{o.guest_name ? ` · ${o.guest_name}` : ''}</p>
                  </div>
                  <span className={`text-sm tabular-nums ${late ? 'text-orange-deep font-bold' : 'text-ink/60'}`}>{m} min</span>
                </div>
                {o.note && <p className="text-sm bg-stroh rounded-lg px-3 py-2">«{o.note}»</p>}
                <ul className="divide-y divide-line border-y border-line">
                  {o.lines.map(l => (
                    <li key={l.id}>
                      <button onClick={() => toggleLine(l)} className={`w-full py-2 flex items-center gap-3 text-left ${l.done ? 'line-through text-ink/40' : ''}`}>
                        <span className={`h-6 w-6 rounded border-2 grid place-items-center ${l.done ? 'bg-rasen border-rasen text-white' : 'border-ink/40'}`}>{l.done ? '✓' : ''}</span>
                        <span className="font-bold text-lg tabular-nums">{l.qty}×</span><span className="text-lg">{l.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {o.order_items.some(i => i.station !== station) && (
                  <p className="text-xs text-ink/50">Weitere Positionen bei: {[...new Set(o.order_items.filter(i => i.station !== station).map(i => STATIONS[i.station]))].join(', ')}</p>
                )}
                {tab === 'offen'
                  ? <button onClick={() => stationDone(o)} className="btn btn-dark w-full">Alles bereit</button>
                  : (o.status === 'ready' && <button onClick={() => delivered(o)} className="btn bg-rasen text-white w-full">{o.fulfillment === 'table' ? 'Geliefert' : 'Abgeholt'}</button>)}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Depot({ userId }) {
  const [number, setNumber] = useState('')
  const [order, setOrder] = useState(null)
  const [pieces, setPieces] = useState(1)
  const [msg, setMsg] = useState(null)
  const [stats, setStats] = useState(null)

  async function loadStats() {
    const { data } = await supabase.from('deposit_returns').select('pieces, amount_chf, method')
    const cash = (data ?? []).filter(d => d.method === 'cash')
    setStats({ pieces: (data ?? []).reduce((a, d) => a + d.pieces, 0), cash: cash.reduce((a, d) => a + Number(d.amount_chf), 0) })
  }
  useEffect(() => { loadStats() }, [])

  async function find(e) {
    e.preventDefault(); setMsg(null)
    const { data } = await supabase.from('orders').select('id, number, deposit_chf, deposit_returned_chf, payrexx_transaction_id, paid_at').eq('number', Number(number)).maybeSingle()
    setOrder(data ?? false)
    if (data) setPieces(Math.max(1, Math.round((Number(data.deposit_chf) - Number(data.deposit_returned_chf)) / 2)))
  }
  const open = order ? Number(order.deposit_chf) - Number(order.deposit_returned_chf) : 0

  async function refund(method) {
    setMsg(null)
    const amount = pieces * 2
    if (order && amount > open + 0.001) { setMsg({ ok: false, t: `Nur ${chf(open)} offen.` }); return }
    if (method === 'cash') {
      const { error } = await supabase.from('deposit_returns').insert({ order_id: order?.id ?? null, pieces, amount_chf: amount, method: 'cash', by_user: userId })
      if (error) { setMsg({ ok: false, t: error.message }); return }
      setMsg({ ok: true, t: `${chf(amount)} bar auszahlen.` })
    } else {
      const { data, error } = await supabase.functions.invoke('payrexx-refund', { body: { order_id: order.id, pieces } })
      if (error || data?.error) { setMsg({ ok: false, t: data?.error ?? error.message }); return }
      setMsg({ ok: true, t: `${chf(amount)} werden dem Gast zurückerstattet (1–3 Tage).` })
    }
    if (order) find({ preventDefault() {} })
    loadStats()
  }

  return (
    <div className="p-4 max-w-xl">
      <form onSubmit={find} className="flex gap-2">
        <input inputMode="numeric" className="field !text-2xl !py-3 flex-1" placeholder="Bestellnummer" value={number} onChange={e => setNumber(e.target.value)} />
        <button className="btn btn-primary">Suchen</button>
      </form>
      {order === false && <p className="mt-3 text-white/70">Keine Bestellung mit dieser Nummer.</p>}
      {order && (
        <div className="mt-4 rounded-2xl bg-white text-ink p-5">
          <p className="font-display font-extrabold text-3xl">#{order.number}</p>
          <p className="mt-1">Depot bezahlt {chf(order.deposit_chf)} · zurückgegeben {chf(order.deposit_returned_chf)} · <b>offen {chf(open)}</b></p>
        </div>
      )}
      <div className="mt-6 rounded-2xl bg-white text-ink p-5">
        <p className="font-semibold">{order ? 'Becher/Gläser zurück' : 'Becher ohne Bestellbezug (nur bar)'}</p>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={() => setPieces(p => Math.max(1, p - 1))} className="h-12 w-12 rounded-full border border-ink/30 text-2xl">−</button>
          <span className="font-display font-extrabold text-4xl w-16 text-center tabular-nums">{pieces}</span>
          <button onClick={() => setPieces(p => p + 1)} className="h-12 w-12 rounded-full bg-ink text-white text-2xl">+</button>
          <span className="ml-auto font-bold text-xl">{chf(pieces * 2)}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => refund('cash')} className="btn btn-dark">Bar auszahlen</button>
          <button onClick={() => refund('payrexx')} disabled={!order?.payrexx_transaction_id} className="btn btn-ghost disabled:opacity-40">Auf Twint/Karte</button>
        </div>
        {msg && <p className={`mt-3 rounded-lg px-3 py-2 text-sm ${msg.ok ? 'bg-rasen/10 text-rasen' : 'bg-orange/15 text-orange-deep'}`}>{msg.t}</p>}
      </div>
      {stats && <p className="mt-4 text-sm text-white/60">Heute zurückgenommen: {stats.pieces} Stück · bar ausbezahlt {chf(stats.cash)}</p>}
    </div>
  )
}
