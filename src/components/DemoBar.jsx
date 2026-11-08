import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

// Navigationsleiste für das klickbare Mockup – führt durch alle Bereiche
const stops = [
  ['/', 'Website'],
  ['/helfer', 'Helfer-Login'],
  ['/bestellen/T3', 'Gast: Tisch 3'],
  ['/station/kueche', 'Küche'],
  ['/station/theke', 'Theke & Depot'],
  ['/tafel', 'Abholtafel'],
  ['/admin', 'Admin'],
]

export default function DemoBar() {
  const [open, setOpen] = useState(true)
  const { pathname } = useLocation()
  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 max-w-[96vw]">
      {open ? (
        <div className="flex items-center gap-1 rounded-full bg-ink/90 backdrop-blur text-white px-2 py-1.5 shadow-2xl ring-1 ring-white/20 overflow-x-auto">
          <span className="px-2 text-[11px] uppercase tracking-wide text-orange font-bold whitespace-nowrap">Demo</span>
          {stops.map(([to, l]) => (
            <Link key={to} to={to} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${pathname === to ? 'bg-orange text-ink font-semibold' : 'hover:bg-white/15'}`}>{l}</Link>
          ))}
          <button onClick={() => setOpen(false)} className="ml-1 h-7 w-7 rounded-full hover:bg-white/15 text-white/70" aria-label="Leiste ausblenden">×</button>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="rounded-full bg-ink/90 text-orange text-xs font-bold px-3 py-1.5 shadow-xl ring-1 ring-white/20">Demo</button>
      )}
    </div>
  )
}
