import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

// Admin-Übersicht: Besucherzähler und Benachrichtigungen
export default function Besucher({ profiles }) {
  const [daily, setDaily] = useState([])
  const [paths, setPaths] = useState([])
  const [topic, setTopic] = useState('')
  const [notify, setNotify] = useState(true)
  const [msg, setMsg] = useState(null)

  async function load() {
    const [{ data: d }, { data: p }, { data: st }] = await Promise.all([
      supabase.from('page_stats_daily').select('*').limit(30),
      supabase.from('page_stats_paths').select('*').limit(8),
      supabase.from('settings').select('key,value').in('key', ['notify_ntfy_topic', 'notify_on_register']),
    ])
    setDaily(d ?? []); setPaths(p ?? [])
    for (const r of st ?? []) { if (r.key === 'notify_ntfy_topic') setTopic(r.value); if (r.key === 'notify_on_register') setNotify(Boolean(r.value)) }
  }
  useEffect(() => { load() }, [])

  const today = new Date().toISOString().slice(0, 10)
  const sum = (days, f) => daily.filter(r => r.day >= new Date(Date.now() - days * 864e5).toISOString().slice(0, 10)).reduce((a, r) => a + Number(r[f]), 0)
  const todayRow = daily.find(r => r.day === today)
  const regs7 = profiles.filter(p => new Date(p.created_at) > new Date(Date.now() - 7 * 864e5)).length
  const max = Math.max(1, ...daily.slice(0, 14).map(r => Number(r.visitors)))
  const last14 = [...Array(14)].map((_, i) => { const d = new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10); return daily.find(r => r.day === d) ?? { day: d, visitors: 0, views: 0 } })

  async function toggleNotify() {
    await supabase.from('settings').update({ value: JSON.stringify(!notify) }).eq('key', 'notify_on_register'); setNotify(!notify)
  }
  async function test() {
    const { error } = await supabase.rpc('notify_test'); setMsg(error ? error.message : 'Testmeldung gesendet – sie sollte in wenigen Sekunden auf dem Handy erscheinen.')
  }
  const pathLabel = (p) => ({ '/': 'Startseite', '/helfer': 'Helferportal', '/rueckblick-2026': 'Rückblick 2026' })[p] ?? p

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="rounded-2xl border border-line p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display font-bold text-xl">Besucher</h2>
          <p className="text-sm text-ink/60">ohne Cookies · eine Sitzung = ein Besuch</p>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[['Heute', todayRow?.visitors ?? 0], ['7 Tage', sum(7, 'visitors')], ['30 Tage', sum(30, 'visitors')], ['Registriert (7 Tage)', regs7]].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-stroh/60 p-3"><p className="text-xs text-ink/60">{l}</p><p className="font-display font-bold text-2xl">{v}</p></div>
          ))}
        </div>
        <div className="mt-5 flex items-end gap-1 h-24">
          {last14.map(r => (
            <div key={r.day} className="flex-1 flex flex-col items-center justify-end h-full" title={`${new Date(r.day).toLocaleDateString('de-CH')}: ${r.visitors} Besucher, ${r.views} Aufrufe`}>
              <div className="w-full rounded-t bg-orange" style={{ height: `${Math.max(2, (Number(r.visitors) / max) * 100)}%`, opacity: r.visitors ? 1 : 0.25 }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[11px] text-ink/50 mt-1"><span>{new Date(last14[0].day).toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })}</span><span>heute</span></div>
        {paths.length > 0 && (
          <ul className="mt-4 text-sm divide-y divide-line">
            {paths.map(p => <li key={p.path} className="flex justify-between py-1.5"><span>{pathLabel(p.path)}</span><span className="tabular-nums text-ink/70">{p.visitors} Besucher · {p.views} Aufrufe</span></li>)}
          </ul>
        )}
        {daily.length === 0 && <p className="mt-4 text-sm text-ink/60">Noch keine Aufrufe gezählt – der Zähler läuft ab dem nächsten Deploy.</p>}
      </div>

      <div className="rounded-2xl border border-line p-6">
        <h2 className="font-display font-bold text-xl">Benachrichtigungen</h2>
        <p className="mt-2 text-sm text-ink/70">Bei jeder Registrierung schickt die Datenbank eine Push-Meldung über <b>ntfy</b> aufs Handy.</p>
        <ol className="mt-3 text-sm space-y-1.5 list-decimal pl-5 text-ink/80">
          <li>App «ntfy» installieren (App Store / Play Store, gratis).</li>
          <li>In der App «Thema abonnieren» und diesen Namen eingeben:</li>
        </ol>
        <p className="mt-2 rounded-lg bg-ink text-white font-mono text-sm px-3 py-2 break-all select-all">{topic}</p>
        <p className="mt-1 text-xs text-ink/50">Der Name ist das Passwort – nicht weitergeben. Jeder im Vorstand kann das Thema zusätzlich abonnieren.</p>
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <button onClick={test} className="btn btn-dark !py-2">Testmeldung senden</button>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={notify} onChange={toggleNotify} /> Bei Registrierung melden</label>
        </div>
        {msg && <p className="mt-3 text-sm text-rasen font-medium">{msg}</p>}
      </div>
    </div>
  )
}
