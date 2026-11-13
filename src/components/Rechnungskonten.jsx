import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { chf } from '../lib/orders.js'

// Admin: Rechnungskonten (Konsumation auf Rechnung) – Konten, offene Buchungen, Rechnungen, Zahlungsangaben
export default function Rechnungskonten() {
  const [accounts, setAccounts] = useState([])
  const [invoices, setInvoices] = useState([])
  const [form, setForm] = useState({ name: '', contact: '', street: '', zip: '', city: '', email: '', limit_chf: '' })
  const [pay, setPay] = useState({ iban: '', creditor: { name: '', street: '', zip: '', city: '' }, footer: '' })
  const [msg, setMsg] = useState(null)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    const [{ data: a }, { data: i }, { data: st }] = await Promise.all([
      supabase.from('account_balance').select('*').order('name'),
      supabase.from('account_invoices').select('*, accounts(name)').order('created_at', { ascending: false }),
      supabase.from('settings').select('key,value').in('key', ['invoice_iban', 'invoice_creditor', 'invoice_footer']),
    ])
    setAccounts(a ?? []); setInvoices(i ?? [])
    const p = { ...pay }
    for (const r of st ?? []) { if (r.key === 'invoice_iban') p.iban = r.value; if (r.key === 'invoice_creditor') p.creditor = r.value; if (r.key === 'invoice_footer') p.footer = r.value }
    setPay(p)
  }
  useEffect(() => { load() }, [])

  async function createAccount(e) {
    e.preventDefault()
    const { error } = await supabase.from('accounts').insert({ ...form, limit_chf: form.limit_chf ? Number(form.limit_chf) : null })
    setMsg(error ? error.message : `Konto «${form.name}» angelegt.`)
    if (!error) { setForm({ name: '', contact: '', street: '', zip: '', city: '', email: '', limit_chf: '' }); setShowForm(false) }
    load()
  }
  async function toggleActive(a) {
    await supabase.from('accounts').update({ active: !a.active }).eq('id', a.id); load()
  }
  async function createInvoice(a) {
    if (!confirm(`Rechnung für «${a.name}» über ${chf(a.open_chf)} erstellen? Die offenen Buchungen werden damit abgerechnet.`)) return
    const { error } = await supabase.rpc('create_account_invoice', { p_account: a.id })
    setMsg(error ? error.message : 'Rechnung erstellt.'); load()
  }
  async function setStatus(inv, status) {
    await supabase.from('account_invoices').update({ status, paid_at: status === 'paid' ? new Date().toISOString().slice(0, 10) : null }).eq('id', inv.id); load()
  }
  async function savePay() {
    await Promise.all([
      supabase.from('settings').update({ value: JSON.stringify(pay.iban.trim()) }).eq('key', 'invoice_iban'),
      supabase.from('settings').update({ value: JSON.stringify(pay.creditor) }).eq('key', 'invoice_creditor'),
      supabase.from('settings').update({ value: JSON.stringify(pay.footer) }).eq('key', 'invoice_footer'),
    ])
    setMsg('Zahlungsangaben gespeichert.')
  }

  const openTotal = accounts.reduce((a, x) => a + Number(x.open_chf), 0)
  const invOpen = invoices.filter(i => i.status === 'open').reduce((a, i) => a + Number(i.total_chf), 0)
  const invPaid = invoices.filter(i => i.status === 'paid').reduce((a, i) => a + Number(i.total_chf), 0)

  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl">Rechnungskonten</h2>
          <p className="mt-2 text-ink/70">Konsumation auf Rechnung (z.B. Club 92). Station: Tab «Helfer», Code des Kontos eingeben. {chf(openTotal)} noch nicht fakturiert · {chf(invOpen)} in Rechnung gestellt · {chf(invPaid)} bezahlt</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn btn-dark">Neues Konto</button>
      </div>
      {msg && <p className="mt-3 text-sm font-semibold text-rasen">{msg}</p>}

      {showForm && (
        <form onSubmit={createAccount} className="mt-4 rounded-2xl border border-line p-5 grid gap-3 sm:grid-cols-3">
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name (z.B. Club 92)" className="field sm:col-span-2" />
          <input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="Kontaktperson" className="field" />
          <input value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} placeholder="Strasse / Postfach" className="field" />
          <input value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} placeholder="PLZ" className="field" />
          <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Ort" className="field" />
          <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="E-Mail (optional)" className="field sm:col-span-2" />
          <input value={form.limit_chf} onChange={e => setForm({ ...form, limit_chf: e.target.value })} placeholder="Limite CHF (optional)" inputMode="decimal" className="field" />
          <button className="btn btn-primary sm:col-span-3 justify-self-start">Konto anlegen</button>
        </form>
      )}

      {accounts.length > 0 && (
        <table className="mt-4 w-full text-[15px]">
          <thead className="text-left text-ink/60 border-b border-line"><tr><th className="py-2 pr-4 font-medium">Konto</th><th className="py-2 pr-4 font-medium">Code</th><th className="py-2 pr-4 font-medium">Offen</th><th className="py-2 pr-4 font-medium">Fakturiert</th><th className="py-2 pr-4 font-medium">Bezahlt</th><th className="py-2 font-medium"></th></tr></thead>
          <tbody>{accounts.map(a => (
            <tr key={a.id} className={`border-t border-line ${a.active ? '' : 'opacity-50'}`}>
              <td className="py-2 pr-4"><span className="font-semibold">{a.name}</span>{a.contact && <span className="text-ink/60"> · {a.contact}</span>}</td>
              <td className="py-2 pr-4 font-display font-bold tracking-widest">{a.code}</td>
              <td className="py-2 pr-4 tabular-nums">{chf(a.open_chf)}{a.open_items > 0 && <span className="text-ink/50 text-xs"> ({a.open_items})</span>}</td>
              <td className="py-2 pr-4 tabular-nums">{chf(a.invoiced_open_chf)}</td>
              <td className="py-2 pr-4 tabular-nums text-rasen">{chf(a.paid_chf)}</td>
              <td className="py-2 text-right whitespace-nowrap">
                {Number(a.open_chf) > 0 && <button onClick={() => createInvoice(a)} className="btn btn-primary !py-1.5 text-sm">Rechnung erstellen</button>}
                <button onClick={() => toggleActive(a)} className="ml-2 text-sm text-ink/60 hover:text-ink">{a.active ? 'Sperren' : 'Aktivieren'}</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      )}

      {invoices.length > 0 && (
        <>
          <h3 className="mt-8 font-display font-bold text-lg">Rechnungen</h3>
          <table className="mt-2 w-full text-[15px]">
            <thead className="text-left text-ink/60 border-b border-line"><tr><th className="py-2 pr-4 font-medium">Nr.</th><th className="py-2 pr-4 font-medium">Konto</th><th className="py-2 pr-4 font-medium">Datum</th><th className="py-2 pr-4 font-medium">Betrag</th><th className="py-2 pr-4 font-medium">Status</th><th className="py-2 font-medium"></th></tr></thead>
            <tbody>{invoices.map(i => (
              <tr key={i.id} className="border-t border-line">
                <td className="py-2 pr-4 font-semibold">{i.number}</td>
                <td className="py-2 pr-4">{i.accounts?.name}</td>
                <td className="py-2 pr-4">{new Date(i.issued_at).toLocaleDateString('de-CH')}</td>
                <td className="py-2 pr-4 tabular-nums">{chf(i.total_chf)}</td>
                <td className="py-2 pr-4"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${i.status === 'paid' ? 'bg-rasen text-white' : i.status === 'void' ? 'bg-ink/20' : 'bg-orange text-ink'}`}>{i.status === 'paid' ? 'Bezahlt' : i.status === 'void' ? 'Storniert' : 'Offen'}</span></td>
                <td className="py-2 text-right whitespace-nowrap">
                  <Link to={`/rechnung/${i.id}`} className="btn btn-dark !py-1.5 text-sm">Öffnen / Drucken</Link>
                  {i.status === 'open' && <button onClick={() => setStatus(i, 'paid')} className="ml-2 text-sm text-rasen font-semibold">Bezahlt</button>}
                  {i.status === 'paid' && <button onClick={() => setStatus(i, 'open')} className="ml-2 text-sm text-ink/60">Zurück auf offen</button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </>
      )}

      <details className="mt-8 rounded-2xl border border-line p-5">
        <summary className="font-display font-bold cursor-pointer">Zahlungsangaben für den QR-Zahlteil</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">IBAN (QR-IBAN oder IBAN des FCK-Kontos)<input value={pay.iban} onChange={e => setPay({ ...pay, iban: e.target.value })} className="field mt-1 font-mono" /></label>
          <label className="text-sm">Zahlungsempfänger<input value={pay.creditor.name} onChange={e => setPay({ ...pay, creditor: { ...pay.creditor, name: e.target.value } })} className="field mt-1" /></label>
          <label className="text-sm">Strasse / Postfach<input value={pay.creditor.street} onChange={e => setPay({ ...pay, creditor: { ...pay.creditor, street: e.target.value } })} className="field mt-1" /></label>
          <label className="text-sm">PLZ<input value={pay.creditor.zip} onChange={e => setPay({ ...pay, creditor: { ...pay.creditor, zip: e.target.value } })} className="field mt-1" /></label>
          <label className="text-sm">Ort<input value={pay.creditor.city} onChange={e => setPay({ ...pay, creditor: { ...pay.creditor, city: e.target.value } })} className="field mt-1" /></label>
          <label className="text-sm sm:col-span-2">Schlusstext<input value={pay.footer} onChange={e => setPay({ ...pay, footer: e.target.value })} className="field mt-1" /></label>
        </div>
        <button onClick={savePay} className="btn btn-dark mt-3 !py-2">Speichern</button>
      </details>
    </section>
  )
}
