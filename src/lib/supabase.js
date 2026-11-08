import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && key)

export const supabase = supabaseConfigured
  ? createClient(url, key)
  : null

export const EVENT = {
  year: 2027,
  days: [
    { key: '2027-07-16', label: 'Freitag', date: '16. Juli', hours: '19:00 – 02:00' },
    { key: '2027-07-17', label: 'Samstag', date: '17. Juli', hours: '17:00 – 03:00' },
    { key: '2027-07-18', label: 'Sonntag', date: '18. Juli', hours: '09:00 – 23:30' },
  ],
  signupDeadline: '28. Februar 2027',
  contact: {
    phone: '+41 79 689 64 55',
    email: 'info_schnittersunnti_fck@bluewin.ch',
    address: ['FC Kirchberg', 'Birkenring, Postfach', '3422 Kirchberg BE'],
  },
}

export const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })

export const fmtDay = (isoDate) =>
  new Date(isoDate + 'T12:00:00').toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Zurich' })
