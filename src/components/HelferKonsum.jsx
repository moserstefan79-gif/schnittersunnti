import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { chf } from '../lib/orders.js'

// Admin: Helfer-Konsumationskarte – Einstellungen, manuelle Gutschriften, Auswertung für den Vorstand
export default function HelferKonsum({ profiles, userId }) {
  const [balances, setBalances] = useState([])
  const [cons, setCons] = useState([])
  const [credits, setCredits] = useState([])
  const [amount, setAmount] = useState('22')
  const [days, setDays] = useState('')
  const [note, setNote] = useState('')
  const [manual, setManual] = useState({ user_id: '', amount: '22', reason: 'Vorstand / OK' })
  const [msg, setMsg] = useState(null)

  async function load() {
    const [{ data: b }, { data: c }, { data: k }, { data: st }] = await Promise.all([
      supabase.from('helper_balance').select('*').order('full_name'),
      supabase.from('helper_consumptions').select('*').order('created_at', { ascending: false }),
      supabase.from('helper_credits').select('*').order('created_at', { ascending: false }),
      supabase.from('settings').select('key,value'),
    ])
    setBalances(b ?? []); setCons(c ?? []); setCredits(k ?? [])
    for (const r of st ?? []) {
      if (r.key === 'helper_credit_per_shift') setAmount(String(r.value))
      if (r.key === 'helper_credit_days') setDays((Array.isArray(r.value) ? r.value : []).join(', '))
      if (r.key === 'helper_credit_note') setNote(r.value)
    }
  }
  useEffect(() => { load() }, [])

  async function saveSettings() {
    const list = days.split(',').map(s => s.trim()).filter(Boolean)
    await Promise.all([
      supabase.from('settings').update({ value: JSON.stringify(Number(amount)) }).eq('key', 'helper_credit_per_shift'),
      supabase.from('settings').update({ value: JSON.stringify(list) }).eq('key', 'helper_credit_days'),
      supabase.from('settings').update({ value: JSON.stringify(note) }).eq('key', 'helper_credit_note'),
    ])
    setMsg('Einstellungen gespeichert – gilt für neue Gutschriften.'); load()
  }
  async function addCredit(e) {
    e.preventDefault()
    if (!manual.user_id) return
    const { error } = await supabase.from('helper_credits').insert({ user_id: manual.user_id, amount_chf: Number(manual.amount), reason: manual.reason, created_by: userId })
    setMsg(error ? error.message : 'Gutschrift erfasst.'); load()
  }

  const byItem = useMemo(() => {
    const m = new Map()
    for (const c of cons) { const r = m.get(c.name) ?? { name: c.name, qty: 0, amount: 0 }; r.qty += c.qty; r.amount += Number(c.amount_chf); m.set(c.name, r) }
    return [...m.values()].sort((a, b) => b.amount - a.amount)
  }, [cons])
  const byTeam = useMemo(() => {
    const m = new Map()
    for (const b of balances) { const t = b.team || '–'; const r = m.get(t) ?? { team: t, helpers: 0, credited: 0, consumed: 0 }; if (Number(b.credited) > 0) r.helpers++; r.credited += Number(b.credited); r.consumed += Number(b.consumed); m.set(t, r) }
    return [...m.values()].sort((a, b) => b.consumed - a.consumed)
  }, [balances])
  const totalCredited = balances.reduce((a, b) => a + Number(b.credited), 0)
  const totalConsumed = balances.reduce((a, b) => a + Number(b.consumed), 0)
  const topups = credits.filter(c => /Aufzahlung/.test(c.reason)).reduce((a, c) => a + Number(c.amount_chf), 0)
  const shiftCredits = credits.filter(c => c.shift_id).reduce((a, c) => a + Number(c.amount_chf), 0)

  function exportCsv() {
    const rows = [['Name', 'Mannschaft', 'Code', 'Gutgeschrieben', 'Bezogen', 'Rest'], ...balances.map(b => [b.full_name, b.team ?? '', b.helper_code, b.credited, b.consumed, b.balance])]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })); a.download = 'helferkonsum-schnittersunnti.csv'; a.click()
  }

  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl">Helfer-Konsumationskarte</h2>
          <p className="mt-2 text-ink/70">
            {chf(totalCredited)} gutgeschrieben ({chf(shiftCredits)} aus Schichten) · {chf(totalConsumed)} bezogen · {chf(totalConsumed - topups)} echter Helferkonsum · {chf(topups)} aufgezahlt · {chf(totalCredited - totalConsumed)} offen
          </p>
        </div>
        <button onClick={exportCsv} className="btn btn-dark">Guthaben als CSV</button>
      </div>
      {msg && <p className="mt-3 text-sm font-semibold text-rasen">{msg}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line p-5">
          <h3 className="font-display font-bold text-lg">Regel</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr]">
            <label className="text-sm">Guthaben pro Schicht<input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" className="field mt-1" /></label>
            <label className="text-sm">Festtage mit Guthaben (JJJJ-MM-TT, Komma)<input value={days} onChange={e => setDays(e.target.value)} className="field mt-1" /></label>
            <label className="text-sm sm:col-span-2">Text für Helfer<input value={note} onChange={e => setNote(e.target.value)} className="field mt-1" /></label>
          </div>
          <p className="mt-2 text-xs text-ink/60">Gutschrift beim ✓ in der Präsenzkontrolle. Donnerstag (Aufbau) und Montag (Abbau) sind ausgenommen – dort ist die Verpflegung organisiert. Kein Bargeld zurück, Rest verfällt am Festende.</p>
          <button onClick={saveSettings} className="btn btn-dark mt-3 !py-2">Speichern</button>
        </div>

        <form onSubmit={addCredit} className="rounded-2xl border border-line p-5">
          <h3 className="font-display font-bold text-lg">Manuelle Gutschrift</h3>
          <p className="text-sm text-ink/60 mt-1">Für Vorstand/OK-Pauschalen, Gäste oder Korrekturen.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <select value={manual.user_id} onChange={e => setManual({ ...manual, user_id: e.target.value })} className="field sm:col-span-3" required>
              <option value="">Helfer wählen …</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}{p.team ? ` · ${p.team}` : ''}</option>)}
            </select>
            <input value={manual.amount} onChange={e => setManual({ ...manual, amount: e.target.value })} inputMode="decimal" className="field" placeholder="Betrag" />
            <input value={manual.reason} onChange={e => setManual({ ...manual, reason: e.target.value })} className="field sm:col-span-2" placeholder="Grund" />
          </div>
          <button className="btn btn-primary mt-3 !py-2">Gutschreiben</button>
        </form>
      </div>

      {cons.length > 0 && (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="font-display font-bold text-lg">Nach Artikel</h3>
            <table className="mt-2 w-full text-[15px]">
              <thead className="text-left text-ink/60 border-b border-line"><tr><th className="py-2 pr-4 font-medium">Artikel</th><th className="py-2 pr-4 font-medium">Stück</th><th className="py-2 font-medium">Wert</th></tr></thead>
              <tbody>{byItem.map(r => <tr key={r.name} className="border-t border-line"><td className="py-2 pr-4">{r.name}</td><td className="py-2 pr-4 tabular-nums">{r.qty}</td><td className="py-2 tabular-nums">{chf(r.amount)}</td></tr>)}</tbody>
            </table>
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Nach Mannschaft</h3>
            <table className="mt-2 w-full text-[15px]">
              <thead className="text-left text-ink/60 border-b border-line"><tr><th className="py-2 pr-4 font-medium">Mannschaft</th><th className="py-2 pr-4 font-medium">Helfende</th><th className="py-2 pr-4 font-medium">Guthaben</th><th className="py-2 font-medium">Bezogen</th></tr></thead>
              <tbody>{byTeam.filter(t => t.credited > 0).map(t => <tr key={t.team} className="border-t border-line"><td className="py-2 pr-4 font-semibold">{t.team}</td><td className="py-2 pr-4">{t.helpers}</td><td className="py-2 pr-4 tabular-nums">{chf(t.credited)}</td><td className="py-2 tabular-nums">{chf(t.consumed)}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
