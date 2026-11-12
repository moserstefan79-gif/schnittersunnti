import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider.jsx'
import AuthForm from '../components/AuthForm.jsx'
import { supabase, supabaseConfigured, fmtTime, fmtDay, EVENT, asset } from '../lib/supabase.js'

const areaOrder = ['Aufbau', 'Theke', 'Küche', 'Service', 'Bar', 'Kasse', 'Abbau']

export default function Helfer() {
  const { session, profile, loading } = useAuth()

  if (!supabaseConfigured) {
    return (
      <Section title="Helfereinsatz" lead="Die Schichtanmeldung öffnet im Januar 2027. Bis dahin: Mannschaft informieren, Wochenende freihalten.">
        <div className="grid gap-6 md:grid-cols-3">
          {EVENT.days.map(d => (
            <div key={d.key} className="border border-line p-5">
              <p className="font-display font-bold text-2xl">{d.label}</p>
              <p className="text-ink/60">{d.date} {EVENT.year}</p>
              <p className="font-display text-orange-deep text-xl mt-3">{d.hours}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-ink/75 max-w-2xl">Rund 102 Helferplätze in Theke, Küche, Service, Bar und Kasse – plus Aufbau am Freitag, Abbau am Sonntagabend und Montagmorgen. Du wählst deine Schicht künftig hier selbst, mit eigenem Login. Fragen vorab an <a href={`mailto:${EVENT.contact.email}`} className="underline hover:text-orange-deep">{EVENT.contact.email}</a>.</p>
      </Section>
    )
  }
  if (loading) return <Section title="Helfereinsatz"><p className="text-ink/60">Lädt …</p></Section>
  if (!session) {
    return (
      <Section title="Helfereinsatz" lead={`Melde dich an, um deine Schicht zu wählen. Bis am ${EVENT.signupDeadline} ist die Auswahl frei.`}>
        <AuthForm />
      </Section>
    )
  }
  return <ShiftBoard profile={profile} userId={session.user.id} />
}

function Section({ title, lead, children, aside }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-end gap-5">
          <img src={asset("/logo-small.png")} alt="" width="200" height="228" className="hidden sm:block h-24 w-auto" />
          <div>
          <p className="font-display font-semibold text-orange-deep text-lg">Home of Football · Schnittersunnti {EVENT.year}</p>
          <h1 className="text-4xl md:text-6xl mt-1">{title}</h1>
          {lead && <p className="mt-4 max-w-2xl text-ink/75">{lead}</p>}
          </div>
        </div>
        {aside}
      </div>
      <div className="mt-10">{children}</div>
    </div>
  )
}

function ShiftBoard({ profile, userId }) {
  const [shifts, setShifts] = useState([])
  const [err, setErr] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [day, setDay] = useState(null)

  async function load() {
    const { data, error } = await supabase.from('shift_overview').select('*').order('starts_at').order('area')
    if (error) setErr(error.message); else setShifts(data)
  }
  useEffect(() => { load() }, [])

  const days = useMemo(() => [...new Set(shifts.map(s => s.day))], [shifts])
  const activeDay = day ?? days[0]
  const mine = shifts.filter(s => s.mine)
  const visible = shifts.filter(s => s.day === activeDay)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at) || areaOrder.indexOf(a.area) - areaOrder.indexOf(b.area))

  const groups = useMemo(() => {
    const m = new Map()
    for (const s of visible) {
      const k = `${s.starts_at}|${s.ends_at}`
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(s)
    }
    return [...m.entries()]
  }, [visible])

  async function toggle(s) {
    setBusyId(s.id); setErr(null)
    const q = s.mine
      ? supabase.from('shift_signups').delete().eq('shift_id', s.id).eq('user_id', userId)
      : supabase.from('shift_signups').insert({ shift_id: s.id, user_id: userId })
    const { error } = await q
    if (error) setErr(/voll/i.test(error.message) ? 'Diese Schicht ist inzwischen voll.' : error.message)
    await load()
    setBusyId(null)
  }

  const total = shifts.reduce((a, s) => a + s.capacity, 0)
  const taken = shifts.reduce((a, s) => a + s.taken, 0)

  return (
    <Section
      title={`Hoi ${profile?.full_name?.split(' ')[0] || ''}`}
      lead={`${taken} von ${total} Plätzen sind besetzt. Wähle eine oder mehrere Schichten – du kannst dich bis am ${EVENT.signupDeadline} jederzeit wieder abmelden.`}
      aside={profile?.is_admin && <Link to="/admin" className="btn btn-ghost">Admin-Übersicht</Link>}
    >
      {/* Meine Schichten */}
      <div className="rounded-2xl bg-ink text-white p-6 md:p-8">
        <h2 className="text-2xl">Meine Schichten</h2>
        {mine.length === 0 ? (
          <p className="mt-3 text-white/70">Noch keine. Wähle unten eine Schicht aus.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map(s => (
              <li key={s.id} className="rounded-xl border border-white/20 p-4 flex flex-col gap-1">
                <span className="font-display font-bold text-xl text-orange">{s.area}</span>
                <span>{fmtDay(s.day)}</span>
                <span className="text-white/70">{fmtTime(s.starts_at)} – {fmtTime(s.ends_at)}</span>
                <button onClick={() => toggle(s)} disabled={busyId === s.id} className="mt-2 self-start text-sm underline text-white/70 hover:text-white">Abmelden</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tagesauswahl */}
      <div className="mt-12 flex flex-wrap gap-2" role="tablist">
        {days.map(d => (
          <button key={d} role="tab" aria-selected={d === activeDay} onClick={() => setDay(d)}
            className={`btn ${d === activeDay ? 'btn-primary' : 'btn-ghost'}`}>
            {fmtDay(d)}
          </button>
        ))}
      </div>

      {err && <p className="mt-6 rounded-lg bg-orange/15 text-orange-deep px-4 py-3">{err}</p>}

      {/* Schichten */}
      <div className="mt-6 flex flex-col gap-8">
        {groups.map(([k, list]) => (
          <div key={k}>
            <h3 className="text-2xl display-wide">{fmtTime(list[0].starts_at)} – {fmtTime(list[0].ends_at)}</h3>
            <ul className="mt-3 grid gap-px bg-line border border-line sm:grid-cols-2 lg:grid-cols-3">
              {list.map(s => <ShiftCard key={s.id} s={s} busy={busyId === s.id} onToggle={() => toggle(s)} />)}
            </ul>
          </div>
        ))}
        {shifts.length === 0 && !err && <p className="text-ink/60">Noch keine Schichten eingetragen.</p>}
      </div>
    </Section>
  )
}

function ShiftCard({ s, busy, onToggle }) {
  const full = s.free <= 0 && !s.mine
  return (
    <li className={`p-5 flex flex-col gap-3 ${s.mine ? 'bg-stroh' : 'bg-paper'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display font-bold text-xl">{s.area}</p>
          {s.description && <p className="text-sm text-ink/65 mt-0.5">{s.description}</p>}
        </div>
        <span className="shrink-0 text-sm tabular-nums text-ink/70">{s.taken}/{s.capacity}</span>
      </div>
      <div className="h-2 rounded-full bg-ink/10 overflow-hidden" aria-hidden="true">
        <div className={`h-full ${s.free <= 0 ? 'bg-rasen' : 'bg-orange'}`} style={{ width: `${(s.taken / s.capacity) * 100}%` }} />
      </div>
      <button onClick={onToggle} disabled={busy || full}
        className={`btn !py-2 text-sm self-start ${s.mine ? 'btn-ghost' : full ? 'bg-ink/10 text-ink/50 cursor-not-allowed' : 'btn-dark'}`}>
        {busy ? '…' : s.mine ? 'Abmelden' : full ? 'Besetzt' : 'Ich übernehme'}
      </button>
    </li>
  )
}
