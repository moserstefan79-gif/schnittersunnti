import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

const teams = ['1. Mannschaft', '2. Mannschaft', 'Senioren', 'Junioren A/B/C', 'Junioren D–G (Eltern)', 'Vorstand', 'Freunde des FCK']

export default function AuthForm() {
  const [mode, setMode] = useState('login') // login | register | reset
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '', team: teams[0] })
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        if (error) throw error
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { data: { full_name: form.full_name, phone: form.phone, team: form.team } },
        })
        if (error) throw error
        setMsg({ ok: true, text: 'Konto erstellt. Falls du eine Bestätigungsmail erhältst, klicke den Link darin – dann kannst du dich anmelden.' })
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: window.location.origin + '/helfer' })
        if (error) throw error
        setMsg({ ok: true, text: 'Wir haben dir einen Link zum Zurücksetzen geschickt.' })
      }
    } catch (err) {
      setMsg({ ok: false, text: translate(err.message) })
    } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="flex gap-6 border-b border-line text-lg font-display font-bold">
        {[['login', 'Anmelden'], ['register', 'Konto erstellen']].map(([m, l]) => (
          <button key={m} onClick={() => { setMode(m); setMsg(null) }}
            className={`pb-3 -mb-px border-b-4 ${mode === m ? 'border-orange' : 'border-transparent text-ink/50 hover:text-ink'}`}>
            {l}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        {mode === 'register' && (
          <>
            <label className="block"><span className="text-sm font-medium">Vor- und Nachname</span>
              <input required className="field mt-1" value={form.full_name} onChange={set('full_name')} autoComplete="name" /></label>
            <label className="block"><span className="text-sm font-medium">Telefon</span>
              <input required className="field mt-1" value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="079 …" /></label>
            <label className="block"><span className="text-sm font-medium">Mannschaft / Gruppe</span>
              <select className="field mt-1" value={form.team} onChange={set('team')}>
                {teams.map(t => <option key={t}>{t}</option>)}
              </select></label>
          </>
        )}
        <label className="block"><span className="text-sm font-medium">E-Mail</span>
          <input required type="email" className="field mt-1" value={form.email} onChange={set('email')} autoComplete="email" /></label>
        {mode !== 'reset' && (
          <label className="block"><span className="text-sm font-medium">Passwort</span>
            <input required type="password" minLength={8} className="field mt-1" value={form.password} onChange={set('password')}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
        )}

        {msg && <p className={`rounded-lg px-4 py-3 text-sm ${msg.ok ? 'bg-rasen/10 text-rasen' : 'bg-orange/15 text-orange-deep'}`}>{msg.text}</p>}

        <button disabled={busy} className="btn btn-dark mt-2 disabled:opacity-60">
          {busy ? 'Einen Moment …' : mode === 'login' ? 'Anmelden' : mode === 'register' ? 'Konto erstellen' : 'Link senden'}
        </button>

        {mode === 'login' && (
          <button type="button" onClick={() => setMode('reset')} className="text-sm text-ink/60 hover:text-ink self-start">Passwort vergessen?</button>
        )}
        {mode === 'reset' && (
          <button type="button" onClick={() => setMode('login')} className="text-sm text-ink/60 hover:text-ink self-start">Zurück zur Anmeldung</button>
        )}
      </form>
    </div>
  )
}

function translate(m = '') {
  if (/invalid login/i.test(m)) return 'E-Mail oder Passwort stimmt nicht.'
  if (/already registered/i.test(m)) return 'Mit dieser E-Mail gibt es bereits ein Konto – melde dich an.'
  if (/password/i.test(m) && /short|least/i.test(m)) return 'Das Passwort braucht mindestens 8 Zeichen.'
  if (/email not confirmed/i.test(m)) return 'Bitte bestätige zuerst deine E-Mail-Adresse über den Link in der Mail.'
  if (/rate limit/i.test(m)) return 'Zu viele Versuche – bitte in ein paar Minuten nochmals.'
  return m || 'Das hat nicht geklappt. Versuche es nochmals.'
}
