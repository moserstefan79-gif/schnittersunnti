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

  useEffect(() => {
    if (!supabaseConfigured || !profile?.is_admin) return
    supabase.from('shift_overview').select('*').order('starts_at').order('area').then(({ data }) => setShifts(data ?? []))
    supabase.from('shift_roster').select('*').then(({ data }) => setRoster(data ?? []))
  }, [profile])

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

  function exportCsv() {
    const rows = [['Tag', 'Von', 'Bis', 'Posten', 'Name', 'Telefon', 'Mannschaft']]
    for (const s of shifts) for (const r of byShift[s.id] ?? [])
      rows.push([s.day, fmtTime(s.starts_at), fmtTime(s.ends_at), s.area, r.full_name, r.phone ?? '', r.team ?? ''])
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
          <p className="mt-4 text-ink/75">{taken} von {total} Plätzen besetzt · {helpers} Helferinnen und Helfer</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter(f => f === 'alle' ? 'offen' : 'alle')} className="btn btn-ghost">{filter === 'alle' ? 'Nur offene zeigen' : 'Alle zeigen'}</button>
          <button onClick={exportCsv} className="btn btn-dark">CSV exportieren</button>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <span className="text-ink/60 self-center">Betrieb am Fest:</span>
        {[['/station/kueche', 'Küche'], ['/station/theke', 'Theke & Depot'], ['/station/bar', 'Brasil-Bar'], ['/tafel', 'Abholtafel'], ['/bestellen', 'Gast-Ansicht']].map(([to, l]) => (
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
                <Row key={s.id} s={s} people={byShift[s.id] ?? []} dayRow={dayRow} />
              )
            })}
          </tbody>
        </table>
      </div>

      <MatchEditor />
      <OrderAdmin />
    </div>
  )
}

function Row({ s, people, dayRow }) {
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
        </td>
        <td className="py-3">
          {people.length === 0 ? <span className="text-ink/40">—</span> : (
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {people.map(p => <li key={p.user_id}>{p.full_name} <span className="text-ink/50 text-sm">{p.team}{p.phone ? ` · ${p.phone}` : ''}</span></li>)}
            </ul>
          )}
        </td>
      </tr>
    </>
  )
}
