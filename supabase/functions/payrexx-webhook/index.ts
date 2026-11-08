// Payrexx-Webhook: Zahlung bestätigt → Bestellung auf "paid" (löst Druckjobs aus).
// Der Webhook selbst ist nicht signiert; wir verifizieren den Status direkt bei Payrexx.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { getGateway } from '../_shared/payrexx.ts'

export async function confirmGateway(admin: ReturnType<typeof createClient>, gatewayId: number) {
  const g = await getGateway(gatewayId)
  if (g.status !== 'confirmed') return { status: g.status, paid: false }
  const { data: o } = await admin.from('orders').select('id, status').eq('id', g.referenceId).eq('payrexx_gateway_id', gatewayId).single()
  if (!o) throw new Error('Bestellung zur Zahlung nicht gefunden')
  if (o.status === 'open') {
    await admin.from('orders').update({ status: 'paid', paid_at: new Date().toISOString(), payrexx_transaction_id: g.transactionId ?? null }).eq('id', o.id)
  }
  return { status: g.status, paid: true }
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}))
    // Payrexx sendet { transaction: { id, status, referenceId, invoice: { paymentRequestId, ... } } }
    const tx = body?.transaction
    const gatewayId = Number(tx?.invoice?.paymentRequestId ?? tx?.invoice?.gatewayId ?? body?.gateway?.id)
    if (!gatewayId) return new Response('ignored', { status: 200 })

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    await confirmGateway(admin, gatewayId)
    return new Response('ok', { status: 200 })
  } catch (e) {
    console.error(e)
    return new Response('error', { status: 500 })
  }
})
