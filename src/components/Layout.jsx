import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider.jsx'
import { supabase, EVENT, asset } from '../lib/supabase.js'

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 group" aria-label="Startseite">
      <img src={asset("/logo-small.png")} alt="" width="200" height="228" className="h-11 w-auto" />
      <span className="font-display font-bold text-lg leading-none">Home of Football<span className="block text-xs font-sans font-medium text-ink/60 mt-0.5">FC Beizli · Schnittersunnti Kirchberg</span></span>
    </Link>
  )
}

const links = [
  { to: '/#angebot', label: 'Angebot' },
  { to: '/#spiele', label: 'Spiele' },
  { to: '/#schnittersunnti', label: 'Schnittersunnti' },
  { to: '/#verein', label: 'FC Kirchberg' },
  { to: '/#partner', label: 'Partner' },
]

export default function Layout() {
  const { session, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const { pathname, hash } = useLocation()

  useEffect(() => {
    setOpen(false)
    if (hash) {
      const el = document.querySelector(hash)
      if (el) setTimeout(() => el.scrollIntoView({ block: 'start' }), 0)
    } else window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
          <Logo />
          <nav className="hidden md:flex items-center gap-7 text-[15px] font-medium">
            {links.map(l => <Link key={l.to} to={l.to} className="hover:text-orange-deep">{l.label}</Link>)}
            <NavLink to="/helfer" className={({ isActive }) => `btn ${isActive ? 'btn-primary' : 'btn-dark'} !py-2 !px-4 text-sm`}>
              {session ? (profile?.full_name?.split(' ')[0] || 'Mein Einsatz') : 'Helfereinsatz'}
            </NavLink>
          </nav>
          <button className="md:hidden p-2 -mr-2" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label="Menü">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 7h18M3 12h18M3 17h18" />}
            </svg>
          </button>
        </div>
        {open && (
          <nav className="md:hidden border-t border-line bg-paper px-4 py-4 flex flex-col gap-3 text-lg">
            {links.map(l => <Link key={l.to} to={l.to}>{l.label}</Link>)}
            <Link to="/helfer" className="btn btn-dark mt-2">Helfereinsatz</Link>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-ink text-white">
        <div className="hero-rule" />
        <div className="mx-auto max-w-6xl px-4 py-12 grid gap-10 md:grid-cols-3">
          <div className="flex gap-5 items-start">
            <div className="shrink-0 rounded-xl bg-white p-2"><img src={asset("/logo-small.png")} alt="Home of Football" width="200" height="228" className="h-20 w-auto" loading="lazy" /></div>
            <div>
              <p className="font-display font-bold text-2xl leading-tight">Home of Football</p>
              <p className="mt-2 text-white/70 max-w-xs">Das FC Beizli des FC Kirchberg am Schnittersunnti – seit Jahrzehnten mitten im Dorf.</p>
            </div>
          </div>
          <div className="text-white/80">
            {EVENT.contact.address.map(l => <p key={l}>{l}</p>)}
            <p className="mt-3"><a href={`tel:${EVENT.contact.phone.replace(/\s/g, '')}`} className="hover:text-orange">{EVENT.contact.phone}</a></p>
            <p><a href={`mailto:${EVENT.contact.email}`} className="hover:text-orange break-all">{EVENT.contact.email}</a></p>
          </div>
          <div className="text-white/80 flex flex-col gap-2">
            <a href="https://www.fc-kirchberg.ch/" target="_blank" rel="noreferrer" className="hover:text-orange">fc-kirchberg.ch</a>
            <a href="https://www.kirchberg-be.ch/" target="_blank" rel="noreferrer" className="hover:text-orange">Gemeinde Kirchberg BE</a>
            <Link to="/helfer" className="hover:text-orange">Helfereinsatz</Link>
            {profile?.is_admin && <Link to="/admin" className="hover:text-orange">Admin</Link>}
            {session && supabase && (
              <button onClick={() => supabase.auth.signOut()} className="text-left hover:text-orange">Abmelden</button>
            )}
          </div>
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-8 text-sm text-white/50">© {new Date().getFullYear()} FC Kirchberg · 1924 gegründet · Orange und Schwarz</p>
      </footer>
    </div>
  )
}
