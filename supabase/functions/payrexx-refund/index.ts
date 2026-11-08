// Depot-Rückerstattung auf das Zahlungsmittel des Gasts (Teil-Refund der Payrexx-Transaktion).
// Nur für eingeloggte Helfer (JWT wird geprüft).
import { createClient } from 'npm:@supabase/supabase-js@2'
import { cors } from '../_shared/payrexx.ts'

const INSTANCE = Deno.env.get('PAYREXX_INSTANCE')!
const SECRET = Deno.env.get('PAYREXX_API_SECRET')!

async function sign(query: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(query))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const auth = req.headers.get('Authorization') ?? ''
    const user = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
    const { data: { user: u } } = await user.auth.getUser()
    if (!u) throw new Error('Nicht angemeldet')

    const { order_id, pieces } = await req.json()
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: o } = await admin.from('orders').select('id, deposit_chf, deposit_returned_chf, payrexx_transaction_id, status').eq('id', order_id).single()
    if (!o) throw new Error('Bestellung nicht gefunden')
    if (!o.payrexx_transaction_id) throw new Error('Keine Payrexx-Transaktion – bar auszahlen')

    const perPiece = 2.00
    const amount = Math.round(Number(pieces) * perPiece * 100) / 100
    const open = Number(o.deposit_chf) - Number(o.deposit_returned_chf)
    if (amount <= 0 || amount > open + 0.001) throw new Error(`Maximal CHF ${open.toFixed(2)} Depot offen`)

    const query = `amount=${Math.round(amount * 100)}`
    const body = query + '&ApiSignature=' + encodeURIComponent(await sign(query))
    const res = await fetch(`https://api.payrexx.com/v1.0/Transaction/${o.payrexx_transaction_id}/refund/?instance=${INSTANCE}`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
    })
    const json = await res.json()
    if (json.status !== 'success') throw new Error('Payrexx Refund: ' + (json.message ?? JSON.stringify(json)))

    await admin.from('deposit_returns').insert({
      order_id: o.id, pieces: Number(pieces), amount_chf: amount, method: 'payrexx',
      payrexx_refund_id: json.data?.[0]?.id ?? null, by_user: u.id,
    })
    return Response.json({ ok: true, amount }, { headers: cors })
  } catch (e) {
    return Response.json({ error: String((e as Error).message ?? e) }, { status: 400, headers: cors })
  }
})
