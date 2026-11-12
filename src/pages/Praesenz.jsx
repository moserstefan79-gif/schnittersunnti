import { useEffect, useMemo, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider.jsx'
import { supabase, supabaseConfigured, fmtTime, fmtDay, asset } from '../lib/supabase.js'

// Anwesenheitskontrolle am Fest – fürs Handy des OK / Fest-Paten
export default function Praesenz() {
  const { profile, loading, session } = useAuth()
  const [shifts, setShifts] = useState([])
  const [roster, setRoster] = useState([])
  const [day, setDay] = useState(null)
  const [busy, setBusy] = useState(null)

  async function load() {
    const [{ data: sh }, { data: ro }] = await Promise.all([
      supabase.from('shift_overview').select('*').order('starts_at').order('area'),
      supabase.from('shift_roster').select('*').eq('status', 'confirmed'),
    ])
    setShifts(sh ?? []); setRoster(ro ?? [])
  }
  useEffect(() => { if (supabaseConfigured && profile?.is_admin) load() }, [profile])

  const days = useMemo(() => [...new Set(shifts.map(s => s.day))], [shifts])
  // Standard: heutiger Festtag, sonst der erste
  const today = new Date().toISOString().slice(0, 10)
  const activeDay = day ?? (days.includes(today) ? today : days[0])
  const blocks = useMemo(() => {
    const m = new Map()
    for (const s of shifts.filter(s => s.day === activeDay)) {
      const k = `${s.starts_at}|${s.ends_at}`
      if (!m.has(k)) m.set(k, { starts_at: s.starts_at, ends_at: s.ends_at, shifts: [] })
      m.get(k).shifts.push(s)
    }
    return [...m.values()]
  }, [shifts, activeDay])

  if (!supabaseConfigured || loading) return null
  if (!session || !profile?.is_admin) return <Navigate to="/helfer" replace />

  async function mark(r, attendance) {
    setBusy(r.user_id + r.shift_id)
    const next = r.attendance === attendance ? null : attendance   // nochmals tippen = zurücksetzen
    await supabase.from('shift_signups').update({ attendance: next, checked_at: next ? new Date().toISOString() : null, checked_by: next ? session.user.id : null })
      .eq('shift_id', r.shift_id).eq('user_id', r.user_id)
    await load(); setBusy(null)
  }

  const dayRoster = roster.filter(r => shifts.find(s => s.id === r.shift_id)?.day === activeDay)
  const done = dayRoster.filter(r => r.attendance).length

  return (
    <div className="min-h-screen bg-stroh-light">
      <header className="sticky top-0 z-10 bg-ink text-white px-4 h-14 flex items-center gap-3">
        <img src={asset('/logo-small.png')} alt="" className="h-9 w-auto rounded bg-white p-0.5" />
        <h1 className="font-display font-bold text-xl">Präsenz</h1>
        <span className="ml-auto text-sm text-white/70">{done}/{dayRoster.length} erfasst</span>
        <Link to="/admin" className="text-sm text-white/70 hover:text-white">Admin</Link>
      </header>

      <div className="px-4 pt-4 flex gap-2 overflow-x-auto">
        {days.map(d => (
          <button key={d} onClick={() => setDay(d)} className={`btn !py-2 whitespace-nowrap ${d === activeDay ? 'btn-primary' : 'btn-ghost bg-white'}`}>{fmtDay(d).replace(/,.*/, '')}</button>
        ))}
      </div>

      <div className="px-4 py-4 flex flex-col gap-6">
        {blocks.map(b => (
          <section key={b.starts_at}>
            <h2 className="font-display font-bold text-2xl">{fmtTime(b.starts_at)} – {fmtTime(b.ends_at)}</h2>
            {b.shifts.map(s => {
              const people = roster.filter(r => r.shift_id === s.id).sort((a, c) => a.full_name.localeCompare(c.full_name))
              return (
                <div key={s.id} className="mt-3 rounded-2xl bg-white p-4">
                  <p className="font-semibold">{s.area} <span className="text-ink/50 font-normal text-sm">{people.length}/{s.capacity}</span></p>
                  {people.length === 0 && <p className="text-sm text-ink/50 mt-1">Niemand zugeteilt.</p>}
                  <ul className="mt-2 divide-y divide-line">
                    {people.map(r => (
                      <li key={r.user_id} className="py-2 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{r.full_name}</p>
                          <p className="text-xs text-ink/50">{r.team}{r.phone ? ` · ${r.phone}` : ''}</p>
                        </div>
                        <button onClick={() => mark(r, 'present')} disabled={busy === r.user_id + r.shift_id}
                          className={`h-11 w-11 rounded-full grid place-items-center text-lg font-bold ${r.attendance === 'present' ? 'bg-rasen text-white' : 'border border-ink/30 text-ink/60'}`} aria-label="anwesend">✓</button>
                        <button onClick={() => mark(r, 'absent')} disabled={busy === r.user_id + r.shift_id}
                          className={`h-11 w-11 rounded-full grid place-items-center text-lg font-bold ${r.attendance === 'absent' ? 'bg-orange-deep text-white' : 'border border-ink/30 text-ink/60'}`} aria-label="abwesend">✕</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </section>
        ))}
      </div>
    </div>
  )
}
