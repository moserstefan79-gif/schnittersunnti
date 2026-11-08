import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase.js'

// Abholtafel – Vollbild auf einem Fernseher/Tablet an der Theke
export default function Tafel() {
  const [rows, setRows] = useState([])
  async function load() {
    const { data } = await supabase.from('pickup_board').select('*')
    setRows(data ?? [])
  }
  useEffect(() => {
    if (!supabaseConfigured) return
    load()
    const ch = supabase.channel('tafel').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load).subscribe()
    const t = setInterval(load, 20000)
    return () => { supabase.removeChannel(ch); clearInterval(t) }
  }, [])
  const ready = rows.filter(r => r.status === 'ready').sort((a, b) => a.ready_at.localeCompare(b.ready_at))
  const prep = rows.filter(r => r.status !== 'ready').sort((a, b) => a.number - b.number)

  return (
    <div className="min-h-screen bg-ink text-white grid grid-cols-[1.4fr_1fr]">
      <section className="p-8 bg-rasen">
        <h1 className="font-display font-bold text-4xl">Bereit zum Abholen</h1>
        <ul className="mt-6 flex flex-wrap gap-4">
          {ready.map(r => <li key={r.number} className="font-display font-extrabold text-8xl tabular-nums bg-white text-rasen rounded-3xl px-8 py-4">{r.number}</li>)}
          {ready.length === 0 && <li className="text-white/70 text-2xl">Gleich geht's weiter …</li>}
        </ul>
      </section>
      <section className="p-8">
        <h2 className="font-display font-bold text-3xl text-white/70">In Arbeit</h2>
        <ul className="mt-6 flex flex-wrap gap-3">
          {prep.map(r => <li key={r.number} className="font-display font-bold text-5xl tabular-nums border-2 border-white/30 rounded-2xl px-5 py-2">{r.number}</li>)}
        </ul>
        <img src="/logo-small.png" alt="" className="absolute bottom-6 right-6 h-20 bg-white rounded-xl p-1" />
      </section>
    </div>
  )
}
