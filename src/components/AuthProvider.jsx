import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthCtx = createContext({ session: null, profile: null, loading: true, recovery: false, setRecovery: () => {}, refreshProfile: () => {} })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [recovery, setRecovery] = useState(false)   // Nutzer kam über «Passwort zurücksetzen»-Link

  async function loadProfile(s) {
    if (!supabase || !s?.user) { setProfile(null); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', s.user.id).single()
    setProfile(data ?? null)
  }

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      loadProfile(data.session).finally(() => setLoading(false))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      setSession(s)
      loadProfile(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <AuthCtx.Provider value={{ session, profile, loading, recovery, setRecovery, refreshProfile: () => loadProfile(session) }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
