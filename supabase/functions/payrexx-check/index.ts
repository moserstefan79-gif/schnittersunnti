// Fallback: die Statusseite des Gasts fragt nach der Rückkehr von Payrexx aktiv nach,
// falls der Webhook noch nicht angekommen ist.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { cors } from '../_shared/payrexx.ts'
import { confirmGateway } from '../payrexx-webhook/index.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { order_id, client_token } = await req.json()
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: o } = await admin.from('orders').select('id, status, client_token, payrexx_gateway_id').eq('id', order_id).single()
    if (!o || o.client_token !== client_token) throw new Error('Nicht gefunden')
    if (o.status !== 'open') return Response.json({ status: o.status }, { headers: cors })
    if (!o.payrexx_gateway_id) return Response.json({ status: 'open' }, { headers: cors })
    const r = await confirmGateway(admin, o.payrexx_gateway_id)
    return Response.json({ status: r.paid ? 'paid' : 'open', payrexx: r.status }, { headers: cors })
  } catch (e) {
    return Response.json({ error: String((e as Error).message ?? e) }, { status: 400, headers: cors })
  }
})
