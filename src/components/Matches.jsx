import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase.js'

const fmt = (iso) => {
  const d = new Date(iso)
  const day = d.toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'numeric', timeZone: 'Europe/Zurich' })
  const time = d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })
  return { day, time }
}

export default function Matches() {
  const [matches, setMatches] = useState(null)

  useEffect(() => {
    if (!supabaseConfigured) { setMatches([]); return }
    supabase.from('matches').select('*').order('kicks_off_at').then(({ data }) => setMatches(data ?? []))
  }, [])

  return (
    <section id="spiele" className="scroll-mt-20 bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid gap-10 md:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="text-4xl md:text-5xl">Live auf<br />dem Screen</h2>
          <p className="mt-6 text-ink/80 max-w-md">
            Während des Schnittersunnti läuft die Frauen-WM in Brasilien – die K.o.-Spiele fallen genau in unser
            Festwochenende. Anpfiff ist jeweils am Abend Schweizer Zeit: perfekt für die Brasilien-Bar.
          </p>
        </div>
        <div>
          {matches === null && <p className="text-ink/50">Lädt …</p>}
          {matches?.length === 0 && (
            <div className="border border-dashed border-ink/30 rounded-2xl p-8">
              <p className="font-display font-bold text-2xl">Spielplan folgt</p>
              <p className="mt-2 text-ink/70">Die FIFA legt die Partien nach der Auslosung fest. Sobald sie stehen, siehst du hier, was wir zeigen.</p>
            </div>
          )}
          {matches?.length > 0 && (
            <ul className="divide-y divide-line border-y border-line">
              {matches.map(m => {
                const { day, time } = fmt(m.kicks_off_at)
                return (
                  <li key={m.id} className="py-4 grid grid-cols-[5.5rem_1fr] gap-4 items-baseline">
                    <div>
                      <p className="text-sm text-ink/60">{day}</p>
                      <p className="font-display font-bold text-2xl text-orange-deep">{time}</p>
                    </div>
                    <div>
                      <p className="font-display font-bold text-xl leading-tight">{m.home} <span className="text-ink/40 font-normal">–</span> {m.away}</p>
                      <p className="text-sm text-ink/60 mt-0.5">{[m.competition, m.stage].filter(Boolean).join(' · ')}{m.note ? ` · ${m.note}` : ''}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
