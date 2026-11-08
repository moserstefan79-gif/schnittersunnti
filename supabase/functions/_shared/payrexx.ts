// Payrexx REST API v1.0 – Signatur: Base64(HMAC-SHA256(query, apiSecret))
// Doku: https://developers.payrexx.com/reference

const INSTANCE = Deno.env.get('PAYREXX_INSTANCE')!   // z.B. "fckirchberg" (aus fckirchberg.payrexx.com)
const SECRET = Deno.env.get('PAYREXX_API_SECRET')!
const BASE = 'https://api.payrexx.com/v1.0'

async function sign(query: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(query))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

function encode(params: Record<string, string | number | undefined>): string {
  // Payrexx erwartet http_build_query-Format
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
}

export async function createGateway(p: {
  amountCents: number; referenceId: string; purpose: string;
  successUrl: string; failedUrl: string; cancelUrl: string;
}) {
  const params = {
    amount: p.amountCents,
    currency: 'CHF',
    purpose: p.purpose,
    referenceId: p.referenceId,
    successRedirectUrl: p.successUrl,
    failedRedirectUrl: p.failedUrl,
    cancelRedirectUrl: p.cancelUrl,
    skipResultPage: 1,
    preAuthorization: 0,
    reservation: 0,
  }
  const query = encode(params)
  const body = query + '&ApiSignature=' + encodeURIComponent(await sign(query))
  const res = await fetch(`${BASE}/Gateway/?instance=${INSTANCE}`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
  })
  const json = await res.json()
  if (json.status !== 'success') throw new Error('Payrexx: ' + JSON.stringify(json))
  const g = json.data[0]
  return { id: g.id as number, link: g.link as string }
}

export async function getGateway(id: number) {
  const sig = await sign('')
  const res = await fetch(`${BASE}/Gateway/${id}/?instance=${INSTANCE}&ApiSignature=${encodeURIComponent(sig)}`)
  const json = await res.json()
  if (json.status !== 'success') throw new Error('Payrexx: ' + JSON.stringify(json))
  const g = json.data[0]
  return {
    id: g.id as number,
    status: g.status as string,                // waiting | confirmed | authorized | reserved | cancelled | declined
    referenceId: g.referenceId as string,
    transactionId: g.invoices?.[0]?.transactions?.[0]?.id as number | undefined,
  }
}

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
