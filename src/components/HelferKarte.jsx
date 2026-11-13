import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { chf } from '../lib/orders.js'

// Station-Tab «Helfer»: Helfercode eingeben, Artikel antippen, vom Guthaben abbuchen
export default function HelferKarte({ station }) {
  const [code, setCode] = useState('')
  const [helper, setHelper] = useState(null)
  const [items, setItems] = useState([])
  const [cart, setCart] = useState({})          // item_id -> qty
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from('menu_items').select('id, name, variant, price_chf, station, available, sort, menu_categories(name, sort)')
      .eq('available', true).order('sort')
      .then(({ data }) => setItems((data ?? []).sort((a, b) => (a.menu_categories?.sort ?? 0) - (b.menu_categories?.sort ?? 0) || a.sort - b.sort)))
  }, [])

  async function lookup(c = code) {
    setMsg(null); setHelper(null); setCart({})
    if (!/^\d{4}$/.test(c)) return
    const { data, error } = await supabase.rpc('helper_lookup', { p_code: c })
    if (error) { setMsg(error.message); return }
    if (!data?.length) { setMsg('Code unbekannt – Helfer soll sein Portal öffnen, der Code steht bei «Mein Guthaben».'); return }
    setHelper(data[0])
  }
  function onCode(v) {
    const c = v.replace(/\D/g, '').slice(0, 4); setCode(c)
    if (c.length === 4) lookup(c)
  }

  const total = Object.entries(cart).reduce((a, [id, q]) => a + q * Number(items.find(i => i.id === id)?.price_chf ?? 0), 0)
  const add = (id, d) => setCart(c => { const n = Math.max(0, (c[id] ?? 0) + d); const x = { ...c }; if (n) x[id] = n; else delete x[id]; return x })

  const diff = helper ? Math.max(0, Math.round((total - Number(helper.balance)) * 100) / 100) : 0

  async function book(topup = false) {
    setBusy(true); setMsg(null)
    const p_items = Object.entries(cart).map(([item_id, qty]) => ({ item_id, qty }))
    const { data, error } = await supabase.rpc('book_helper_consumption', { p_code: code, p_items, p_station: station, p_topup: topup })
    setBusy(false)
    if (error) { setMsg(error.message.replace(/^.*?:\s*/, '')); return }
    const t = Number(data[0].topup ?? 0)
    setMsg(t > 0 ? `Abgebucht: ${chf(total - t)} Guthaben – ${chf(t)} bar/Karte kassieren. Guthaben jetzt ${chf(data[0].balance)}.` : `Abgebucht: ${chf(total)} – Restguthaben ${chf(data[0].balance)}`)
    setCart({}); lookup(code)
  }

  const mine = items.filter(i => i.station === station)
  const others = items.filter(i => i.station !== station)

  return (
    <div className="p-4 grid gap-4 lg:grid-cols-[360px_1fr]">
      <div className="rounded-2xl bg-white text-ink p-5">
        <h2 className="font-display font-bold text-xl">Helfer-Konsumationskarte</h2>
        <p className="text-sm text-ink/60 mt-1">Helfer zeigt seinen 4-stelligen Code (im Portal unter «Mein Guthaben»).</p>
        <input value={code} onChange={e => onCode(e.target.value)} inputMode="numeric" placeholder="Code" autoFocus
          className="field mt-3 text-3xl tracking-[0.4em] text-center font-display font-bold" />
        {helper && (
          <div className="mt-4 rounded-xl bg-stroh p-4">
            <p className="font-display font-bold text-lg">{helper.full_name}</p>
            <p className="text-sm text-ink/70">{helper.team}</p>
            <p className="mt-2 text-3xl font-display font-bold">{chf(helper.balance)}</p>
            <p className="text-xs text-ink/60">Guthaben {chf(helper.credited)} · bezogen {chf(helper.consumed)}</p>
            {helper.recent?.length > 0 && (
              <ul className="mt-3 text-xs text-ink/70 space-y-0.5">
                {helper.recent.slice(0, 5).map((r, i) => <li key={i}>{r.qty}× {r.name} · {chf(r.amount)} · {new Date(r.at).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })}</li>)}
              </ul>
            )}
          </div>
        )}
        {msg && <p className={`mt-3 text-sm font-semibold ${/Abgebucht/.test(msg) ? 'text-rasen' : 'text-orange-deep'}`}>{msg}</p>}
        {helper && diff <= 0 && (
          <button disabled={!total || busy} onClick={() => book(false)} className="btn btn-primary w-full mt-4 disabled:opacity-40">Abbuchen {chf(total)}</button>
        )}
        {helper && diff > 0 && (
          <div className="mt-4 rounded-xl border-2 border-orange p-3">
            <p className="text-sm">Guthaben reicht nicht: <b>{chf(helper.balance)}</b> anrechnen, <b>{chf(diff)}</b> bar oder mit Karte an der Theke kassieren.</p>
            <button disabled={busy} onClick={() => book(true)} className="btn btn-primary w-full mt-3">Guthaben anrechnen, {chf(diff)} kassieren</button>
          </div>
        )}
        <p className="mt-3 text-xs text-ink/50">Kein Bargeld zurück. Restguthaben verfällt am Festende.</p>
      </div>

      <div className={`rounded-2xl bg-white/10 p-4 ${helper ? '' : 'opacity-40 pointer-events-none'}`}>
        {[['Diese Station', mine], ['Andere Stationen', others]].map(([label, list]) => list.length > 0 && (
          <div key={label} className="mb-4">
            <p className="text-xs uppercase tracking-wide text-white/60 mb-2">{label}</p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {list.map(i => {
                const q = cart[i.id] ?? 0
                return (
                  <div key={i.id} className={`rounded-xl p-3 flex items-center gap-3 ${q ? 'bg-orange text-ink' : 'bg-white text-ink'}`}>
                    <button onClick={() => add(i.id, 1)} className="flex-1 text-left">
                      <p className="font-semibold leading-tight">{i.name}{i.variant ? <span className="font-normal text-ink/60"> · {i.variant}</span> : null}</p>
                      <p className="text-sm text-ink/70">{chf(i.price_chf)}</p>
                    </button>
                    {q > 0 && <>
                      <button onClick={() => add(i.id, -1)} className="h-9 w-9 rounded-full bg-ink text-white font-bold">−</button>
                      <span className="font-display font-bold text-xl w-6 text-center">{q}</span>
                      <button onClick={() => add(i.id, 1)} className="h-9 w-9 rounded-full bg-ink text-white font-bold">+</button>
                    </>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
