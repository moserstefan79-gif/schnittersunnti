import { supabase } from './supabase.js'

export const DEPOSIT_CHF = 2

export const chf = (n) => `CHF ${Number(n).toFixed(2)}`

export async function fetchMenu() {
  const [{ data: cats }, { data: items }] = await Promise.all([
    supabase.from('menu_categories').select('*').order('sort'),
    supabase.from('menu_items').select('*').eq('available', true).order('sort'),
  ])
  return (cats ?? []).map(c => ({ ...c, items: (items ?? []).filter(i => i.category_id === c.id) })).filter(c => c.items.length)
}

export async function fetchTable(code) {
  const { data } = await supabase.from('tables').select('*').eq('code', code).maybeSingle()
  return data
}

export async function placeOrder({ fulfillment, tableCode, guestName, note, cart }) {
  const { data, error } = await supabase.rpc('place_order', {
    p_fulfillment: fulfillment, p_table_code: tableCode, p_guest_name: guestName, p_note: note,
    p_items: cart.map(c => ({ item_id: c.id, qty: c.qty })),
  })
  if (error) throw new Error(error.message)
  return data[0]
}

export async function startPayment(orderId, token) {
  const { data, error } = await supabase.functions.invoke('payrexx-create', {
    body: { order_id: orderId, client_token: token, return_base: window.location.origin },
  })
  if (error || data?.error) throw new Error(data?.error ?? error.message)
  return data.link
}

export async function fetchOrder(orderId, token) {
  const { data, error } = await supabase.rpc('get_order', { p_order_id: orderId, p_token: token })
  if (error) throw new Error(error.message)
  return data?.[0] ?? null
}

export async function checkPayment(orderId, token) {
  const { data } = await supabase.functions.invoke('payrexx-check', { body: { order_id: orderId, client_token: token } })
  return data
}

// localStorage: letzte Bestellung des Gasts (um die Statusseite wiederzufinden)
export const remember = (o) => { try { localStorage.setItem('fck-order', JSON.stringify(o)) } catch {} }
export const recall = () => { try { return JSON.parse(localStorage.getItem('fck-order')) } catch { return null } }
