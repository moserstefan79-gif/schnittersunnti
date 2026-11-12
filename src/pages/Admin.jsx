import { useEffect, useMemo, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider.jsx'
import { supabase, supabaseConfigured, fmtTime, fmtDay } from '../lib/supabase.js'
import MatchEditor from '../components/MatchEditor.jsx'
import OrderAdmin from '../components/OrderAdmin.jsx'

export default function Admin() {
  const { profile, loading, session } = useAuth()
  const [shifts, setShifts] = useState([])
  const [roster, setRoster] = useState([])
  const [filter, setFilter] = useState('alle') // alle | offen
  const [mode, setMode] = useState('open')
  const [profiles, setProfiles] = useState([])
  const [summary, setSummary] = useState([])
  const [msg, setMsg] = useState(null)

  async function load() {
    const [{ data: sh }, { data: ro }, { data: st }, { data: pr }] = await Promise.all([
      supabase.from('shift_overview').select('*').order('starts_at').order('area'),
      supabase.from('shift_roster').select('*'),
      supabase.from('settings').select('key,value').eq('key', 'signup_mode').maybeSingle(),
      supabase.from('profiles').select('id, full_name, phone, team, is_admin, created_at').order('created_at', { ascending: false }),
    ])
    setShifts(sh ?? []); setRoster(ro ?? []); if (st) setMode(st.value); setProfiles(pr ?? [])
    const { data: su } = await supabase.from('helper_summary').select('*').order('full_name'); setSummary(su ?? [])
  }
  useEffect(() => { if (supabaseConfigured && profile?.is_admin) load() }, [profile])

  async function switchMode(next) {
    if (!confirm(next === 'open'
      ? 'Phase «Zuteilung» starten? Ab jetzt sind Anmeldungen verbindlich und Plätze begrenzt.'
      : 'Zurück zur Wunschphase? Neue Anmeldungen zählen dann wieder als Wünsche.')) return
    await supabase.from('settings').update({ value: JSON.stringify(next) }).eq('key', 'signup_mode'); load()
  }
  async function assign() {
    if (!confirm('Alle Wünsche in Reihenfolge der Anmeldung zuteilen, bis die Schichten voll sind?')) return
    const { data, error } = await supabase.rpc('assign_wishes')
    if (error) setMsg(error.message)
    else setMsg(`${data[0].confirmed} Wünsche zugeteilt, ${data[0].left_open} bleiben offen (Schicht voll).`)
    load()
  }
  async function setStatus(r, status) {
    await supabase.from('shift_signups').update({ status }).eq('shift_id', r.shift_id).eq('user_id', r.user_id); load()
  }

  const byShift = useMemo(() => {
    const m = {}
    for (const r of roster) (m[r.shift_id] ||= []).push(r)
    return m
  }, [roster])

  if (!supabaseConfigured || loading) return null
  if (!session || !profile?.is_admin) return <Navigate to="/helfer" replace />

  const visible = filter === 'offen' ? shifts.filter(s => s.free > 0) : shifts
  const total = shifts.reduce((a, s) => a + s.capacity, 0)
  const taken = shifts.reduce((a, s) => a + s.taken, 0)
  const helpers = new Set(roster.map(r => r.user_id)).size
  const wishes = roster.filter(r => r.status === 'wish').length

  function exportCsv() {
    const rows = [['Tag', 'Von', 'Bis', 'Posten', 'Name', 'Telefon', 'Mannschaft', 'Status']]
    for (const s of shifts) for (const r of byShift[s.id] ?? [])
      rows.push([s.day, fmtTime(s.starts_at), fmtTime(s.ends_at), s.area, r.full_name, r.phone ?? '', r.team ?? '', r.status === 'confirmed' ? 'zugeteilt' : 'Wunsch'])
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    a.download = 'schichtplan-schnittersunnti.csv'
    a.click()
  }

  let lastDay = null
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-6xl">Schichtplan</h1>
          <p className="mt-4 text-ink/75">{taken} von {total} Plätzen zugeteilt · {wishes} offene Wünsche · {helpers} Helferinnen und Helfer</p>
          <p className="mt-2 text-sm">Phase: <b>{mode === 'wishes' ? 'Wunschschichten sammeln' : 'Zuteilung / verbindliche Anmeldung'}</b></p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter(f => f === 'alle' ? 'offen' : 'alle')} className="btn btn-ghost">{filter === 'alle' ? 'Nur offene zeigen' : 'Alle zeigen'}</button>
          <button onClick={exportCsv} className="btn btn-dark">CSV exportieren</button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 items-center">
        {mode === 'wishes'
          ? <><button onClick={assign} className="btn btn-primary">Wünsche zuteilen</button><button onClick={() => switchMode('open')} className="btn btn-ghost">Phase «Zuteilung» starten</button></>
          : <><button onClick={assign} className="btn btn-primary">Offene Wünsche zuteilen</button><button onClick={() => switchMode('wishes')} className="btn btn-ghost">Zurück zur Wunschphase</button></>}
        {msg && <span className="text-sm text-rasen font-medium">{msg}</span>}
      </div>
      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <span className="text-ink/60 self-center">Betrieb am Fest:</span>
        {[['/praesenz', 'Präsenzkontrolle'], ['/station/kueche', 'Küche'], ['/station/theke', 'Theke & Depot'], ['/station/bar', 'Brasil-Bar'], ['/bestellen', 'Gast-Ansicht']].map(([to, l]) => (
          <Link key={to} to={to} target="_blank" className="btn btn-ghost !py-1.5">{l}</Link>
        ))}
      </div>

      <div className="mt-10 overflow-x-auto">
        <table className="w-full text-[15px]">
          <thead className="text-left text-ink/60 border-b border-line">
            <tr><th className="py-2 pr-4 font-medium">Zeit</th><th className="py-2 pr-4 font-medium">Posten</th><th className="py-2 pr-4 font-medium">Belegt</th><th className="py-2 font-medium">Wer</th></tr>
          </thead>
          <tbody>
            {visible.map(s => {
              const dayRow = s.day !== lastDay; lastDay = s.day
              return (
                <Row key={s.id} s={s} people={byShift[s.id] ?? []} dayRow={dayRow} onStatus={setStatus} />
              )
            })}
          </tbody>
        </table>
      </div>

      <section className="mt-16">
        <h2 className="text-3xl">Registrierte Helferinnen und Helfer</h2>
        <p className="mt-2 text-ink/70">{profiles.length} Konten. Name und Mannschaft sind direkt editierbar (Feld verlassen = gespeichert).</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[15px]">
            <thead className="text-left text-ink/60 border-b border-line">
              <tr><th className="py-2 pr-4 font-medium">Name</th><th className="py-2 pr-4 font-medium">Mannschaft</th><th className="py-2 pr-4 font-medium">Telefon</th><th className="py-2 pr-4 font-medium">Schichten</th><th className="py-2 pr-4 font-medium">Registriert</th><th className="py-2 font-medium">Admin</th></tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const mine = roster.filter(r => r.user_id === p.id)
                const patch = (f) => async (e) => { if (e.target.value !== (p[f] ?? '')) { await supabase.from('profiles').update({ [f]: e.target.value }).eq('id', p.id); load() } }
                return (
                  <tr key={p.id} className="border-t border-line">
                    <td className="py-2 pr-4"><input className="field !py-1 !px-2 w-44" defaultValue={p.full_name} onBlur={patch('full_name')} /></td>
                    <td className="py-2 pr-4"><input className="field !py-1 !px-2 w-44" defaultValue={p.team ?? ''} onBlur={patch('team')} /></td>
                    <td className="py-2 pr-4 whitespace-nowrap">{p.phone ?? '—'}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{mine.filter(r => r.status === 'confirmed').length} zugeteilt · {mine.filter(r => r.status === 'wish').length} Wünsche</td>
                    <td className="py-2 pr-4 whitespace-nowrap text-ink/60">{new Date(p.created_at).toLocaleDateString('de-CH')}</td>
                    <td className="py-2">
                      <button onClick={async () => { if (confirm(`${p.full_name} ${p.is_admin ? 'Admin-Rechte entziehen' : 'zum Admin machen'}?`)) { await supabase.from('profiles').update({ is_admin: !p.is_admin }).eq('id', p.id); load() } }}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.is_admin ? 'bg-ink text-white' : 'bg-ink/10 text-ink/60'}`}>{p.is_admin ? 'Admin' : 'Helfer'}</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Einsatzbilanz summary={summary} roster={roster} shifts={shifts} />

      <MatchEditor />
      <OrderAdmin />
    </div>
  )
}

function Row({ s, people, dayRow, onStatus }) {
  return (
    <>
      {dayRow && (
        <tr><td colSpan={4} className="pt-8 pb-2 font-display font-bold text-2xl">{fmtDay(s.day)}</td></tr>
      )}
      <tr className="border-t border-line align-top">
        <td className="py-3 pr-4 whitespace-nowrap tabular-nums">{fmtTime(s.starts_at)} – {fmtTime(s.ends_at)}</td>
        <td className="py-3 pr-4 font-semibold">{s.area}</td>
        <td className="py-3 pr-4 whitespace-nowrap">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-sm ${s.free <= 0 ? 'bg-rasen/15 text-rasen' : 'bg-orange/20 text-orange-deep'}`}>{s.taken}/{s.capacity}</span>
          {s.wishes > 0 && <span className="ml-1 text-xs text-ink/50">+{s.wishes} W</span>}
        </td>
        <td className="py-3">
          {people.length === 0 ? <span className="text-ink/40">—</span> : (
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {people.map(p => (
                <li key={p.user_id} className="flex items-center gap-2">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${p.status === 'confirmed' ? 'bg-rasen' : 'bg-orange'}`} title={p.status === 'confirmed' ? 'zugeteilt' : 'Wunsch'} />
                  {p.full_name} <span className="text-ink/50 text-sm">{p.team}{p.phone ? ` · ${p.phone}` : ''}</span>
                  <button onClick={() => onStatus(p, p.status === 'confirmed' ? 'wish' : 'confirmed')} className="text-xs underline text-ink/50 hover:text-orange-deep">{p.status === 'confirmed' ? 'auf Wunsch' : 'zuteilen'}</button>
                </li>
              ))}
            </ul>
          )}
        </td>
      </tr>
    </>
  )
}

// Einsatzbilanz nach dem Fest – für den Vorstand
function Einsatzbilanz({ summary, roster, shifts }) {
  const checked = roster.filter(r => r.attendance).length
  if (checked === 0) return (
    <section className="mt-16">
      <h2 className="text-3xl">Einsatzbilanz</h2>
      <p className="mt-2 text-ink/70">Erscheint, sobald am Fest Präsenzen erfasst sind (Seite «Präsenzkontrolle» auf dem Handy).</p>
    </section>
  )
  const byTeam = Object.values(summary.reduce((m, h) => {
    const k = h.team || 'ohne Mannschaft'; (m[k] ||= { team: k, helpers: 0, assigned: 0, present: 0, absent: 0, hours: 0 })
    m[k].helpers++; m[k].assigned += h.assigned; m[k].present += h.present; m[k].absent += h.absent; m[k].hours += Number(h.hours_present); return m
  }, {})).sort((a, b) => b.hours - a.hours)
  const totalHours = summary.reduce((a, h) => a + Number(h.hours_present), 0)
  const noShows = summary.filter(h => h.absent > 0)

  function exportCsv() {
    const rows = [['Name', 'Mannschaft', 'Telefon', 'Zugeteilt', 'Anwesend', 'Nicht erschienen', 'Stunden']]
    for (const h of summary.filter(h => h.assigned > 0)) rows.push([h.full_name, h.team ?? '', h.phone ?? '', h.assigned, h.present, h.absent, h.hours_present])
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })); a.download = 'einsatzbilanz-schnittersunnti.csv'; a.click()
  }

  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="text-3xl">Einsatzbilanz für den Vorstand</h2>
          <p className="mt-2 text-ink/70">{summary.filter(h => h.present > 0).length} Helfende im Einsatz · {totalHours.toFixed(0)} Stunden geleistet · {checked} von {roster.filter(r => r.status === 'confirmed').length} Schichten kontrolliert</p></div>
        <button onClick={exportCsv} className="btn btn-dark">Bilanz als CSV</button>
      </div>
      <table className="mt-4 w-full text-[15px]">
        <thead className="text-left text-ink/60 border-b border-line"><tr><th className="py-2 pr-4 font-medium">Mannschaft</th><th className="py-2 pr-4 font-medium">Helfende</th><th className="py-2 pr-4 font-medium">Schichten</th><th className="py-2 pr-4 font-medium">Anwesend</th><th className="py-2 pr-4 font-medium">Fehlend</th><th className="py-2 font-medium">Stunden</th></tr></thead>
        <tbody>{byTeam.map(t => <tr key={t.team} className="border-t border-line"><td className="py-2 pr-4 font-semibold">{t.team}</td><td className="py-2 pr-4">{t.helpers}</td><td className="py-2 pr-4">{t.assigned}</td><td className="py-2 pr-4 text-rasen">{t.present}</td><td className="py-2 pr-4 text-orange-deep">{t.absent}</td><td className="py-2 tabular-nums">{t.hours.toFixed(1)}</td></tr>)}</tbody>
      </table>
      {noShows.length > 0 && (
        <p className="mt-4 text-sm text-ink/70">Nicht erschienen: {noShows.map(h => `${h.full_name} (${h.absent})`).join(', ')}</p>
      )}
    </section>
  )
}
