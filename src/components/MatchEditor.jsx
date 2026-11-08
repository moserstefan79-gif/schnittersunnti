import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const empty = { date: '2027-07-16', time: '21:00', competition: 'Frauen-WM 2027', stage: 'Viertelfinal', home: '', away: '', note: '' }

export default function MatchEditor() {
  const [list, setList] = useState([])
  const [form, setForm] = useState(empty)
  const [err, setErr] = useState(null)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function load() {
    const { data } = await supabase.from('matches').select('*').order('kicks_off_at')
    setList(data ?? [])
  }
  useEffect(() => { load() }, [])

  async function add(e) {
    e.preventDefault(); setErr(null)
    const kicks_off_at = new Date(`${form.date}T${form.time}:00+02:00`).toISOString()
    const { error } = await supabase.from('matches').insert({
      kicks_off_at, competition: form.competition, stage: form.stage || null,
      home: form.home, away: form.away, note: form.note || null,
    })
    if (error) setErr(error.message); else { setForm(f => ({ ...f, home: '', away: '', note: '' })); load() }
  }

  async function remove(id) {
    await supabase.from('matches').delete().eq('id', id); load()
  }
  async function togglePublished(m) {
    await supabase.from('matches').update({ is_published: !m.is_published }).eq('id', m.id); load()
  }

  return (
    <section className="mt-16">
      <h2 className="text-3xl">Spiele auf dem Screen</h2>
      <p className="mt-2 text-ink/70">Was hier steht, erscheint auf der Startseite unter «Live auf dem Screen». Zeiten in Schweizer Zeit.</p>

      <form onSubmit={add} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
        <label className="block text-sm font-medium">Datum<input type="date" className="field mt-1" value={form.date} onChange={set('date')} required /></label>
        <label className="block text-sm font-medium">Anpfiff<input type="time" className="field mt-1" value={form.time} onChange={set('time')} required /></label>
        <label className="block text-sm font-medium">Wettbewerb<input className="field mt-1" value={form.competition} onChange={set('competition')} required /></label>
        <label className="block text-sm font-medium">Runde<input className="field mt-1" value={form.stage} onChange={set('stage')} placeholder="Viertelfinal" /></label>
        <label className="block text-sm font-medium">Heim<input className="field mt-1" value={form.home} onChange={set('home')} placeholder="Brasilien" required /></label>
        <label className="block text-sm font-medium">Gast<input className="field mt-1" value={form.away} onChange={set('away')} placeholder="Schweiz" required /></label>
        <label className="block text-sm font-medium">Hinweis<input className="field mt-1" value={form.note} onChange={set('note')} placeholder="Caipirinha-Happy-Hour" /></label>
        <button className="btn btn-dark">Spiel eintragen</button>
      </form>
      {err && <p className="mt-3 rounded-lg bg-orange/15 text-orange-deep px-4 py-3">{err}</p>}

      <ul className="mt-6 divide-y divide-line border-y border-line">
        {list.length === 0 && <li className="py-4 text-ink/50">Noch keine Spiele eingetragen.</li>}
        {list.map(m => (
          <li key={m.id} className="py-3 flex flex-wrap items-center gap-x-6 gap-y-1">
            <span className="tabular-nums w-40">{new Date(m.kicks_off_at).toLocaleString('de-CH', { weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })}</span>
            <span className="font-semibold">{m.home} – {m.away}</span>
            <span className="text-ink/60 text-sm">{[m.competition, m.stage, m.note].filter(Boolean).join(' · ')}</span>
            <span className="ml-auto flex gap-3 text-sm">
              <button onClick={() => togglePublished(m)} className="underline hover:text-orange-deep">{m.is_published ? 'Verbergen' : 'Veröffentlichen'}</button>
              <button onClick={() => remove(m.id)} className="underline text-ink/60 hover:text-orange-deep">Löschen</button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
