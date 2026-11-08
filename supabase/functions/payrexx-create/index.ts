// Erzeugt für eine offene Bestellung eine Payrexx-Zahlungsseite und gibt den Link zurück.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { createGateway, cors } from '../_shared/payrexx.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { order_id, client_token, return_base } = await req.json()
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: o, error } = await admin.from('orders').select('id, number, status, total_chf, client_token, table_code, fulfillment')
      .eq('id', order_id).single()
    if (error || !o) throw new Error('Bestellung nicht gefunden')
    if (o.client_token !== client_token) throw new Error('Ungültiges Token')
    if (o.status !== 'open') throw new Error('Bestellung ist nicht mehr offen')
    if (Number(o.total_chf) <= 0) throw new Error('Betrag ist 0')

    const base = (return_base as string).replace(/\/$/, '')
    const ret = `${base}/bestellen/status/${o.id}?t=${o.client_token}`
    const gw = await createGateway({
      amountCents: Math.round(Number(o.total_chf) * 100),
      referenceId: o.id,
      purpose: `FC Beizli Bestellung #${o.number}${o.fulfillment === 'table' ? ' ' + o.table_code : ''}`,
      successUrl: ret + '&r=ok', failedUrl: ret + '&r=failed', cancelUrl: ret + '&r=cancel',
    })

    await admin.from('orders').update({ payrexx_gateway_id: gw.id }).eq('id', o.id)
    return Response.json({ link: gw.link }, { headers: cors })
  } catch (e) {
    return Response.json({ error: String((e as Error).message ?? e) }, { status: 400, headers: cors })
  }
})
