import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, supabaseConfigured, asset, EVENT } from '../lib/supabase.js'
import { useAuth } from '../components/AuthProvider.jsx'
import { chf } from '../lib/orders.js'

// Druckbare Rechnung für ein Rechnungskonto, mit Schweizer QR-Zahlteil (A4, Zahlteil unten)
export default function Rechnung() {
  const { id } = useParams()
  const { profile, loading } = useAuth()
  const [inv, setInv] = useState(null)
  const [lines, setLines] = useState([])
  const [pay, setPay] = useState(null)
  const [qr, setQr] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!supabaseConfigured || !profile?.is_admin) return
    ;(async () => {
      const [{ data: i }, { data: b }, { data: st }] = await Promise.all([
        supabase.from('account_invoices').select('*, accounts(*)').eq('id', id).maybeSingle(),
        supabase.from('account_bookings').select('name, qty, unit_price_chf, amount_chf').eq('invoice_id', id),
        supabase.from('settings').select('key,value').in('key', ['invoice_iban', 'invoice_creditor', 'invoice_footer']),
      ])
      if (!i) { setErr('Rechnung nicht gefunden.'); return }
      setInv(i); setLines(b ?? [])
      const p = {}; for (const r of st ?? []) p[r.key] = r.value; setPay(p)
    })()
  }, [id, profile])

  const grouped = useMemo(() => {
    const m = new Map()
    for (const l of lines) { const k = `${l.name}|${l.unit_price_chf}`; const r = m.get(k) ?? { name: l.name, price: Number(l.unit_price_chf), qty: 0, amount: 0 }; r.qty += l.qty; r.amount += Number(l.amount_chf); m.set(k, r) }
    return [...m.values()].sort((a, b) => b.amount - a.amount)
  }, [lines])

  // QR-Zahlteil (swissqrbill) – nur wenn eine gültige IBAN hinterlegt ist
  useEffect(() => {
    if (!inv || !pay) return
    const iban = String(pay.invoice_iban ?? '').replace(/\s/g, '')
    if (!/^CH\d{19}$/.test(iban) || /^CH0{19}$/.test(iban)) { setQr(null); return }
    import('swissqrbill/svg').then(({ SwissQRBill }) => {
      try {
        const c = pay.invoice_creditor ?? {}
        const a = inv.accounts
        const svg = new SwissQRBill({
          currency: 'CHF', amount: Number(inv.total_chf),
          creditor: { name: c.name, address: c.street, zip: c.zip, city: c.city, account: iban, country: 'CH' },
          debtor: a.street && a.zip && a.city ? { name: a.name, address: a.street, zip: a.zip, city: a.city, country: 'CH' } : undefined,
          message: `Rechnung ${inv.number} · Konsumation Schnittersunnti ${EVENT.year}`,
        }, { language: 'DE' }).toString()
        setQr(svg)
      } catch (e) { setQr(null); setErr('QR-Zahlteil: ' + e.message) }
    })
  }, [inv, pay])

  if (!supabaseConfigured || loading) return null
  if (!profile?.is_admin) return <div className="p-8">Nur für Admins. <Link to="/helfer" className="underline">Anmelden</Link></div>
  if (err && !inv) return <div className="p-8">{err}</div>
  if (!inv || !pay) return null

  const a = inv.accounts
  const c = pay.invoice_creditor ?? {}
  return (
    <div className="min-h-screen bg-stone-200 print:bg-white py-8 print:py-0">
      <div className="mx-auto max-w-[210mm] flex gap-3 mb-4 print:hidden px-4">
        <button onClick={() => window.print()} className="btn btn-primary">Drucken / als PDF sichern</button>
        <Link to="/admin" className="btn btn-ghost">Zurück zum Admin</Link>
        {!qr && <p className="self-center text-sm text-orange-deep">Kein QR-Zahlteil: IBAN im Admin unter «Zahlungsangaben» hinterlegen.</p>}
      </div>
      <div className="mx-auto bg-white text-ink w-[210mm] min-h-[297mm] relative print:shadow-none shadow-xl" style={{ fontSize: '11pt' }}>
        <div className="px-[20mm] pt-[15mm]">
          <div className="flex justify-between items-start">
            <img src={asset('/logo.png')} alt="" className="h-20 w-auto" />
            <div className="text-right text-sm leading-snug">
              <p className="font-display font-bold text-base">FC Beizli «Home of Football»</p>
              <p>{c.name}</p><p>{c.street}</p><p>{c.zip} {c.city}</p>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-2">
            <div className="leading-snug">
              <p className="font-semibold">{a.name}</p>
              {a.contact && <p>{a.contact}</p>}
              {a.street && <p>{a.street}</p>}
              {(a.zip || a.city) && <p>{a.zip} {a.city}</p>}
            </div>
            <div className="text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 self-start">
              <span className="text-ink/60">Rechnungs-Nr.</span><span className="font-semibold">{inv.number}</span>
              <span className="text-ink/60">Rechnungsdatum</span><span>{new Date(inv.issued_at).toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span className="text-ink/60">Leistung</span><span>Konsumation Schnittersunnti {EVENT.year}</span>
              <span className="text-ink/60">Zahlbar bis</span><span>{new Date(inv.due_at).toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          <h1 className="font-display font-bold text-2xl mt-10">Rechnung</h1>
          <table className="mt-4 w-full">
            <thead className="text-left text-xs uppercase tracking-wide text-ink/60 border-b border-ink">
              <tr><th className="py-2 font-medium">Position</th><th className="py-2 font-medium text-right">Anzahl</th><th className="py-2 font-medium text-right">Einzelpreis</th><th className="py-2 font-medium text-right">Betrag CHF</th></tr>
            </thead>
            <tbody>
              {grouped.map(r => <tr key={r.name + r.price} className="border-b border-ink/10"><td className="py-2">{r.name}</td><td className="py-2 text-right tabular-nums">{r.qty}</td><td className="py-2 text-right tabular-nums">{r.price.toFixed(2)}</td><td className="py-2 text-right tabular-nums">{r.amount.toFixed(2)}</td></tr>)}
            </tbody>
            <tfoot><tr><td colSpan={3} className="pt-3 text-right font-display font-bold text-lg">Total</td><td className="pt-3 text-right font-display font-bold text-lg tabular-nums">{chf(inv.total_chf)}</td></tr></tfoot>
          </table>
          <p className="mt-6 text-sm text-ink/80 max-w-prose">{pay.invoice_footer}</p>
          {!qr && <p className="mt-4 text-sm">IBAN {pay.invoice_iban} · {c.name}, {c.zip} {c.city} · Vermerk: Rechnung {inv.number}</p>}
        </div>
        {qr && <div className="absolute bottom-0 left-0 w-[210mm] h-[105mm] border-t border-dashed border-ink/40" dangerouslySetInnerHTML={{ __html: qr }} />}
      </div>
      <style>{`@media print { @page { size: A4; margin: 0 } body { background: white } }`}</style>
    </div>
  )
}
