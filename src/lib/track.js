import { supabase, supabaseConfigured, DEMO } from './supabase.js'

// Cookiefreier Seitenzähler: zufällige Sitzungs-ID (nur sessionStorage), kein IP, kein Fingerprint.
// Zählt nur öffentliche Seiten; Admin-, Stations- und Bestellseiten bleiben aussen vor.
function sessionId() {
  try {
    let s = sessionStorage.getItem('fck_sid')
    if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('fck_sid', s) }
    return s
  } catch { return null }
}

export function track(pathname) {
  if (DEMO || !supabaseConfigured) return
  if (typeof navigator !== 'undefined' && navigator.webdriver) return
  if (/^\/(admin|station|praesenz|rechnung|bestellen)/.test(pathname)) return
  const sid = sessionId(); if (!sid) return
  const ref = (() => { try { const r = document.referrer; return r && !r.includes(location.host) ? new URL(r).host : null } catch { return null } })()
  const device = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
  supabase.rpc('track_view', { p_path: pathname, p_session: sid, p_referrer: ref, p_device: device }).then(() => {}, () => {})
}
