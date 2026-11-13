// Demo-Modus: simuliert Supabase (Auth, Tabellen, RPCs, Edge Functions, Realtime) im Browser.
// Aktiv, wenn VITE_DEMO=1 gesetzt ist. Nur für Mockups/Vorführungen – keine echten Daten.

const uid = () => crypto.randomUUID()
const DEMO_USER = { id: 'demo-user', email: 'demo@fckirchberg.ch' }
const listeners = new Set()
const notify = () => listeners.forEach(fn => setTimeout(fn, 60))

// ---- Daten ----
const db = {
  profiles: [
    { id: DEMO_USER.id, full_name: 'Stefan Moser', phone: '079 689 64 55', team: 'Vorstand', is_admin: true, helper_code: '4711', created_at: '2026-11-12T22:06:14Z' },
    { id: 'u2', full_name: 'Nadine Schneider', phone: '079 000 00 02', team: '1. Mannschaft', is_admin: false, helper_code: '2203', created_at: '2026-11-12T20:00:00Z' },
    { id: 'u3', full_name: 'Reto Käser', phone: '079 000 00 03', team: 'Senioren', is_admin: false, helper_code: '3150', created_at: '2026-11-12T20:00:00Z' },
    { id: 'u4', full_name: 'Lea Burri', phone: '079 000 00 04', team: 'Junioren D–G (Eltern)', is_admin: false, helper_code: '8864', created_at: '2026-11-12T20:00:00Z' },
  ],
  shifts: [], shift_signups: [], matches: [], tables: [], menu_categories: [], menu_items: [],
  orders: [], order_items: [], print_jobs: [], deposit_returns: [], helper_credits: [], helper_consumptions: [], accounts: [], account_bookings: [], account_invoices: [],
  settings: [{ key: 'signup_mode', value: 'wishes' }, { key: 'assignment_note', value: 'Die Zuteilung erfolgt im Januar 2027. Bis dahin kannst du Wünsche jederzeit ändern.' }, { key: 'helper_credit_per_shift', value: 22 }, { key: 'helper_credit_days', value: ['2027-07-16', '2027-07-17', '2027-07-18'] }, { key: 'helper_credit_note', value: '2 Getränke + 1 Essen pro Schicht' }, { key: 'invoice_iban', value: 'CH93 0076 2011 6238 5295 7' }, { key: 'invoice_creditor', value: { name: 'FC Kirchberg', street: 'Postfach', zip: '3422', city: 'Kirchberg BE' } }, { key: 'invoice_footer', value: 'Zahlbar innert 30 Tagen. Besten Dank für die Unterstützung des FC Beizli «Home of Football».' }],
}

// Schichten wie im Seed
const blocks = [
  ['2027-07-15', '18:00', '23:00', [['Aufbau', 'Zelte aufstellen', 8]]],
  ['2027-07-16', '14:00', '18:00', [['Aufbau', 'Zelt, Bänke, Theke und Technik aufstellen', 5]]],
  ['2027-07-16', '18:30', '22:30', [['Theke', 'Getränkeausgabe im Biergarten', 3], ['Küche', 'Älplermagronen, Fleischkäse, Fish & Chips', 2], ['Service', 'Bringen an die Tische, Abräumen, Becher', 3], ['Bar', 'Brasil-Bar – Drinks & Cocktails', 3], ['Kasse', 'Kasse & Depot', 2]]],
  ['2027-07-16', '22:00', '02:30', [['Theke', 'Getränkeausgabe im Biergarten', 3], ['Küche', 'Älplermagronen, Fleischkäse, Fish & Chips', 2], ['Service', 'Bringen an die Tische, Abräumen, Becher', 2], ['Bar', 'Brasil-Bar – Drinks & Cocktails', 2], ['Kasse', 'Kasse & Depot', 1]]],
  ['2027-07-17', '16:30', '20:30', [['Theke', 'Getränkeausgabe im Biergarten', 3], ['Küche', 'Älplermagronen, Fleischkäse, Fish & Chips', 3], ['Service', 'Bringen an die Tische, Abräumen, Becher', 3], ['Bar', 'Brasil-Bar – Drinks & Cocktails', 2], ['Kasse', 'Kasse & Depot', 2]]],
  ['2027-07-17', '20:00', '00:00', [['Theke', 'Getränkeausgabe im Biergarten', 4], ['Küche', 'Älplermagronen, Fleischkäse, Fish & Chips', 3], ['Service', 'Bringen an die Tische, Abräumen, Becher', 4], ['Bar', 'Brasil-Bar – Drinks & Cocktails', 4], ['Kasse', 'Kasse & Depot', 2]]],
  ['2027-07-17', '23:30', '03:30', [['Theke', 'Getränkeausgabe im Biergarten', 2], ['Küche', 'Älplermagronen, Fleischkäse, Fish & Chips', 1], ['Service', 'Bringen an die Tische, Abräumen, Becher', 2], ['Bar', 'Brasil-Bar – Drinks & Cocktails', 2], ['Kasse', 'Kasse & Depot', 1]]],
  ['2027-07-18', '08:30', '12:30', [['Theke', 'Kaffee & Getränkeausgabe', 3], ['Küche', 'Mittagsbetrieb vorbereiten', 3], ['Service', 'Bringen an die Tische, Abräumen, Becher', 3], ['Kasse', 'Kasse & Depot', 1]]],
  ['2027-07-18', '12:00', '15:30', [['Theke', 'Getränkeausgabe im Biergarten', 3], ['Küche', 'Älplermagronen, Fleischkäse, Fish & Chips', 3], ['Service', 'Bringen an die Tische, Abräumen, Becher', 4], ['Bar', 'Brasil-Bar – Drinks & Cocktails', 1], ['Kasse', 'Kasse & Depot', 2]]],
  ['2027-07-18', '15:00', '18:30', [['Theke', 'Getränkeausgabe im Biergarten', 2], ['Küche', 'Älplermagronen, Fleischkäse, Fish & Chips', 2], ['Service', 'Bringen an die Tische, Abräumen, Becher', 2], ['Bar', 'Brasil-Bar – Drinks & Cocktails', 1], ['Kasse', 'Kasse & Depot', 1]]],
  ['2027-07-18', '18:00', '21:00', [['Abbau', 'Leergut, Kühlmaterial und Becher-Boxen zurückstellen, Küche reinigen', 5]]],
  ['2027-07-19', '08:00', '12:00', [['Abbau', 'Zelte und Mobiliar abbauen, Materialrückgabe', 5]]],
]
for (const [d, s, e, posts] of blocks) {
  const end = e > s ? d : new Date(new Date(d + 'T12:00:00Z').getTime() + 864e5).toISOString().slice(0, 10)
  for (const [area, description, capacity] of posts)
    db.shifts.push({ id: uid(), day: d, starts_at: `${d}T${s}:00+02:00`, ends_at: `${end}T${e}:00+02:00`, area, description, capacity })
}
// ein paar Anmeldungen
const pick = (i) => db.shifts[i].id
;[[1, 'u2'], [1, 'u3'], [2, 'u4'], [6, 'u2'], [8, DEMO_USER.id], [20, 'u3'], [20, 'u4'], [31, DEMO_USER.id], [0, 'u2'], [0, 'u3'], [0, 'u4']]
  .forEach(([i, u], k) => db.shift_signups.push({ id: uid(), shift_id: pick(i), user_id: u, status: k % 3 === 0 ? 'confirmed' : 'wish', attendance: k === 0 ? 'present' : null, checked_at: null, checked_by: null, created_at: new Date().toISOString() }))

// Helfer-Konsumationskarte: Nadine hat eine Schicht geleistet und ein Bier bezogen
db.helper_credits.push({ id: uid(), user_id: 'u2', shift_id: db.shift_signups[0].shift_id, amount_chf: 22, reason: 'Schicht', created_by: DEMO_USER.id, created_at: new Date().toISOString() })
db.helper_credits.push({ id: uid(), user_id: DEMO_USER.id, shift_id: null, amount_chf: 44, reason: 'Vorstand / OK', created_by: DEMO_USER.id, created_at: new Date().toISOString() })
db.helper_consumptions.push({ id: uid(), user_id: 'u2', menu_item_id: null, name: 'Bier im Chübeli 3 dl', qty: 1, unit_price_chf: 4.5, amount_chf: 4.5, station: 'theke', booked_by: DEMO_USER.id, created_at: new Date().toISOString() })

// Rechnungskonto Club 92 mit offenen Buchungen
db.accounts.push({ id: 'a1', name: 'Club 92', code: '9201', contact: 'Präsident', street: 'Postfach', zip: '3422', city: 'Kirchberg BE', email: null, limit_chf: null, active: true, created_at: new Date().toISOString() })
;[['Fish & Chips', 3, 18], ['Fleischkäse im Mütschli', 2, 9], ['Bier im Chübeli 3 dl', 6, 4.5]].forEach(([name, qty, price]) =>
  db.account_bookings.push({ id: uid(), account_id: 'a1', invoice_id: null, menu_item_id: null, name, qty, unit_price_chf: price, amount_chf: qty * price, station: 'theke', consumer: 'Tisch Vorstand', booked_by: DEMO_USER.id, created_at: new Date().toISOString() }))

db.matches = [
  { id: uid(), kicks_off_at: '2027-07-16T21:00:00+02:00', competition: 'Frauen-WM 2027', stage: 'Viertelfinal', home: 'Sieger Achtelfinal 1', away: 'Sieger Achtelfinal 2', note: 'Brasil-Bar bis 02:00', is_published: true },
  { id: uid(), kicks_off_at: '2027-07-17T22:00:00+02:00', competition: 'Frauen-WM 2027', stage: 'Viertelfinal', home: 'Brasilien', away: 'offen', note: 'Caipirinha-Happy-Hour', is_published: true },
]

db.tables = [
  ...[1, 2, 3, 4, 5, 6].map(n => ({ code: `T${n}`, label: `Tisch ${n}`, zone: 'Festzelt', delivery_allowed: true, active: true })),
  ...[1, 2, 3].map(n => ({ code: `G${n}`, label: `Biergarten ${n}`, zone: 'Biergarten', delivery_allowed: true, active: true })),
]
const cats = [['Essen', 'kueche'], ['Getränke', 'theke'], ['Bierschenke', 'theke'], ['Wein', 'theke'], ['Brasil-Bar', 'bar']]
cats.forEach(([name, station], i) => db.menu_categories.push({ id: 'c' + i, name, sort: i + 1, station }))
const C = (n) => db.menu_categories.find(c => c.name === n)
const items = [
  ['Essen', 103, 'Fish & Chips', null, null, 18, 0], ['Essen', 101, 'Älplermagronen mit Apfelmus', null, 'vegetarisch', 12, 0], ['Essen', 102, 'Fleischkäse im Mütschli', null, null, 9, 0], ['Essen', 104, 'Chips', 'einzeln', null, 6, 0],
  ['Bierschenke', 301, 'Bier im Chübeli', '3 dl', null, 4.5, 2], ['Bierschenke', 302, 'Alkoholfreies Bier', '5 dl', null, 5, 2], ['Bierschenke', 303, 'Brezel', null, null, 4, 0],
  ['Getränke', 401, 'Mineralwasser ohne', 'PET 5 dl', null, 5, 0], ['Getränke', 402, 'Mineralwasser mit', 'PET 5 dl', null, 5, 0], ['Getränke', 403, 'Eistee', 'PET 5 dl', null, 5, 0], ['Getränke', 404, 'Rivella rot', 'PET 5 dl', null, 5, 0], ['Getränke', 405, 'Pepsi zero', 'PET 5 dl', null, 5, 0], ['Getränke', 501, 'Kaffee', null, null, 4, 0],
  ['Wein', 201, 'Weisswein Legio Julius', 'Glas 1 dl', 'Chasselas-Arvine-Arneis (CH)', 5, 2], ['Wein', 202, 'Weisswein Legio Julius', 'Flasche 75 cl', null, 35, 2],
  ['Wein', 205, 'Roséwein Legio Julius', 'Glas 1 dl', 'Pinot Noir-Lagrein (CH)', 5, 2], ['Wein', 206, 'Roséwein Legio Julius', 'Flasche 75 cl', null, 35, 2],
  ['Wein', 203, 'Rotwein Legio Julius', 'Glas 1 dl', 'Merlot-Primitivo (CH)', 5, 2], ['Wein', 204, 'Rotwein Legio Julius', 'Flasche 75 cl', null, 35, 2],
  ['Brasil-Bar', 601, 'Batida de Coco', 'ohne Alkohol', null, 8, 2], ['Brasil-Bar', 602, 'Batida de Coco', 'mit Alkohol', null, 10, 2],
  ['Brasil-Bar', 603, 'Ipanema', 'ohne Alkohol', null, 8, 2], ['Brasil-Bar', 604, 'Ipanema', 'mit Alkohol', null, 10, 2],
]
items.forEach(([cat, no, name, variant, description, price, dep], i) =>
  db.menu_items.push({ id: 'i' + no, category_id: C(cat).id, article_no: no, name, variant, description, price_chf: price, deposit_chf: dep, station: C(cat).station, available: true, sort: i }))

let orderNo = 100
function mkOrder({ status, fulfillment, table_code, guest_name, lines, minsAgo, note }) {
  const o = { id: uid(), number: ++orderNo, status, fulfillment, table_code, guest_name, note: note ?? null, total_chf: 0, deposit_chf: 0, deposit_returned_chf: 0,
    payrexx_gateway_id: 1000 + orderNo, payrexx_transaction_id: status === 'open' ? null : 5000 + orderNo,
    paid_at: status === 'open' ? null : new Date(Date.now() - minsAgo * 60000).toISOString(), ready_at: null, delivered_at: null,
    client_token: uid(), created_at: new Date(Date.now() - (minsAgo + 2) * 60000).toISOString() }
  db.orders.push(o)
  for (const [itemId, qty, done] of lines) {
    const m = db.menu_items.find(i => i.id === itemId)
    db.order_items.push({ id: uid(), order_id: o.id, item_id: m.id, name: m.name + (m.variant ? ' ' + m.variant : ''), station: m.station, unit_price_chf: m.price_chf, deposit_chf: m.deposit_chf, qty, done: !!done })
  }
  recalc(o.id)
  if (status === 'ready') o.ready_at = new Date(Date.now() - 2 * 60000).toISOString()
  return o
}
function recalc(orderId) {
  const o = db.orders.find(x => x.id === orderId); const li = db.order_items.filter(i => i.order_id === orderId)
  o.total_chf = li.reduce((a, i) => a + i.qty * (Number(i.unit_price_chf) + Number(i.deposit_chf)), 0)
  o.deposit_chf = li.reduce((a, i) => a + i.qty * Number(i.deposit_chf), 0)
}
mkOrder({ status: 'paid', fulfillment: 'table', table_code: 'T3', guest_name: 'Anna', lines: [['i103', 2], ['i301', 2]], minsAgo: 3 })
mkOrder({ status: 'in_progress', fulfillment: 'pickup', table_code: null, guest_name: 'Marco', lines: [['i101', 1, true], ['i604', 2]], minsAgo: 9, note: 'ohne Apfelmus' })
mkOrder({ status: 'paid', fulfillment: 'table', table_code: 'G2', guest_name: 'Familie Hug', lines: [['i102', 3], ['i404', 2], ['i301', 1]], minsAgo: 17 })
mkOrder({ status: 'ready', fulfillment: 'pickup', table_code: null, guest_name: 'Sven', lines: [['i301', 3, true]], minsAgo: 12 })
mkOrder({ status: 'delivered', fulfillment: 'table', table_code: 'T1', guest_name: 'Petra', lines: [['i201', 2, true], ['i303', 2, true]], minsAgo: 40 })
db.deposit_returns.push({ id: uid(), order_id: db.orders[4].id, pieces: 1, amount_chf: 2, method: 'cash', by_user: DEMO_USER.id, created_at: new Date().toISOString() })
db.orders[4].deposit_returned_chf = 2

// ---- Views ----
const views = {
  shift_overview: () => db.shifts.map(s => {
    const taken = db.shift_signups.filter(x => x.shift_id === s.id && x.status === 'confirmed').length
    const wishes = db.shift_signups.filter(x => x.shift_id === s.id && x.status === 'wish').length
    const my = db.shift_signups.find(x => x.shift_id === s.id && x.user_id === session?.user.id)
    return { ...s, taken, wishes, free: s.capacity - taken, mine: !!my, mine_status: my?.status ?? null, mine_attendance: my?.attendance ?? null }
  }),
  shift_roster: () => db.shift_signups.map(su => ({ ...su, ...pickProfile(su.user_id) })),
  helper_summary: () => db.profiles.map(p => {
    const mine = db.shift_signups.filter(su => su.user_id === p.id)
    const hrs = mine.filter(su => su.attendance === 'present').reduce((a, su) => { const s = db.shifts.find(x => x.id === su.shift_id); return a + (new Date(s.ends_at) - new Date(s.starts_at)) / 36e5 }, 0)
    return { user_id: p.id, full_name: p.full_name, team: p.team, phone: p.phone, assigned: mine.filter(su => su.status === 'confirmed').length, present: mine.filter(su => su.attendance === 'present').length, absent: mine.filter(su => su.attendance === 'absent').length, hours_present: hrs.toFixed(1) }
  }),
  helper_balance: () => db.profiles.map(p => {
    const credited = db.helper_credits.filter(c => c.user_id === p.id).reduce((a, c) => a + Number(c.amount_chf), 0)
    const consumed = db.helper_consumptions.filter(c => c.user_id === p.id).reduce((a, c) => a + Number(c.amount_chf), 0)
    return { user_id: p.id, full_name: p.full_name, team: p.team, helper_code: p.helper_code, credited, consumed, balance: credited - consumed }
  }),
  account_balance: () => db.accounts.map(a => {
    const open = db.account_bookings.filter(b => b.account_id === a.id && !b.invoice_id)
    const inv = db.account_invoices.filter(i => i.account_id === a.id)
    return { ...a, open_chf: open.reduce((s, b) => s + Number(b.amount_chf), 0), open_items: open.length, invoiced_open_chf: inv.filter(i => i.status === 'open').reduce((s, i) => s + Number(i.total_chf), 0), paid_chf: inv.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total_chf), 0) }
  }),
  pickup_board: () => db.orders.filter(o => ['paid', 'in_progress', 'ready'].includes(o.status) && o.fulfillment === 'pickup').map(o => ({ number: o.number, status: o.status, fulfillment: o.fulfillment, ready_at: o.ready_at })),
}
const pickProfile = (id) => { const p = db.profiles.find(p => p.id === id) ?? {}; return { full_name: p.full_name, phone: p.phone, team: p.team } }

// ---- Query Builder ----
class Query {
  constructor(table) { this.table = table; this.filters = []; this.op = 'select'; this.orders = []; this._single = false; this.lim = null; this.sel = '*' }
  select(sel = '*') { if (this.op === 'select') this.sel = sel; return this }
  insert(v) { this.op = 'insert'; this.payload = Array.isArray(v) ? v : [v]; return this }
  update(v) { this.op = 'update'; this.payload = v; return this }
  delete() { this.op = 'delete'; return this }
  eq(k, v) { this.filters.push(r => String(r[k]) === String(v)); return this }
  neq(k, v) { this.filters.push(r => String(deep(r, k)) !== String(v)); return this }
  in(k, arr) { this.filters.push(r => arr.map(String).includes(String(r[k]))); return this }
  is(k, v) { this.filters.push(r => r[k] == v); return this }
  order(k, o = {}) { this.orders.push([k, o.ascending === false ? -1 : 1]); return this }
  limit(n) { this.lim = n; return this }
  maybeSingle() { this._single = 'maybe'; return this }
  single() { this._single = true; return this }
  rows() { return (views[this.table] ? views[this.table]() : db[this.table]) ?? [] }
  run() {
    let rows = this.rows()
    if (this.op === 'insert') {
      const out = this.payload.map(v => ({ id: uid(), created_at: new Date().toISOString(), ...v }))
      if (this.table === 'shift_signups') for (const v of out) {
        const mode = db.settings.find(x => x.key === 'signup_mode').value
        v.status = mode === 'open' ? 'confirmed' : 'wish'
        const s = db.shifts.find(s => s.id === v.shift_id); const taken = db.shift_signups.filter(x => x.shift_id === v.shift_id && x.status === 'confirmed').length
        if (v.status === 'confirmed' && taken >= s.capacity) return { data: null, error: { message: 'Schicht ist bereits voll' } }
      }
      if (this.table === 'deposit_returns') for (const v of out) { const o = db.orders.find(o => o.id === v.order_id); if (o) o.deposit_returned_chf = Number(o.deposit_returned_chf) + Number(v.amount_chf) }
      db[this.table].push(...out); notify(); return { data: out, error: null }
    }
    let m = rows.filter(r => this.filters.every(f => f(r)))
    if (this.op === 'update') { m.forEach(r => Object.assign(r, this.table === 'settings' ? { value: JSON.parse(this.payload.value) } : this.payload));
      if (this.table === 'shift_signups' && 'attendance' in this.payload) for (const su of m) {
        const s = db.shifts.find(x => x.id === su.shift_id); const days = db.settings.find(x => x.key === 'helper_credit_days').value
        const has = db.helper_credits.find(c => c.user_id === su.user_id && c.shift_id === su.shift_id)
        if (su.attendance === 'present' && !has && days.includes(s.day)) db.helper_credits.push({ id: uid(), user_id: su.user_id, shift_id: su.shift_id, amount_chf: Number(db.settings.find(x => x.key === 'helper_credit_per_shift').value), reason: 'Schicht', created_by: DEMO_USER.id, created_at: new Date().toISOString() })
        if (su.attendance !== 'present' && has) db.helper_credits = db.helper_credits.filter(c => c !== has)
      } if (this.table === 'orders' && this.payload.status === 'paid') onPaid(m); notify(); return { data: m, error: null } }
    if (this.op === 'delete') { db[this.table] = db[this.table].filter(r => !m.includes(r)); notify(); return { data: null, error: null } }
    m = m.map(r => embed(this.table, this.sel, r))
    if (this.sel.includes('orders!inner')) m = m.filter(r => this.filters.every(f => f(r)))
    for (const [k, dir] of [...this.orders].reverse()) m.sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * dir)
    if (this.lim) m = m.slice(0, this.lim)
    if (this._single) return m.length ? { data: m[0], error: null } : (this._single === 'maybe' ? { data: null, error: null } : { data: null, error: { message: 'Nicht gefunden' } })
    return { data: m, error: null }
  }
  then(res, rej) { return Promise.resolve(this.run()).then(res, rej) }
}
const deep = (r, k) => k.split('.').reduce((a, p) => a?.[p], r)
function embed(table, sel, r) {
  const out = { ...r }
  if (table === 'orders' && sel.includes('order_items')) out.order_items = db.order_items.filter(i => i.order_id === r.id)
  if (table === 'orders' && sel.includes('tables')) out.tables = db.tables.find(t => t.code === r.table_code) ?? null
  if (table === 'order_items' && sel.includes('orders')) out.orders = db.orders.find(o => o.id === r.order_id)
  if (table === 'account_invoices' && sel.includes('accounts')) out.accounts = db.accounts.find(a => a.id === r.account_id) ?? null
  if (table === 'menu_items' && sel.includes('menu_categories')) out.menu_categories = db.menu_categories.find(c => c.id === r.category_id) ?? null
  return out
}
function onPaid(orders) {
  for (const o of orders) {
    o.paid_at = o.paid_at ?? new Date().toISOString(); o.payrexx_transaction_id = 5000 + o.number
    const li = db.order_items.filter(i => i.order_id === o.id)
    for (const st of new Set(li.map(i => i.station))) db.print_jobs.push({ id: uid(), order_id: o.id, station: st, payload: {}, printed_at: null, created_at: new Date().toISOString() })
  }
}

// ---- Auth ----
let session = null
try { if (localStorage.getItem('fck-demo-session')) session = { user: DEMO_USER } } catch {}
const authCbs = new Set()
const setSession = (s) => { session = s; try { s ? localStorage.setItem('fck-demo-session', '1') : localStorage.removeItem('fck-demo-session') } catch {}; authCbs.forEach(cb => cb('CHANGE', s)) }

export const mockClient = {
  from: (t) => new Query(t),
  auth: {
    getSession: async () => ({ data: { session } }),
    getUser: async () => ({ data: { user: session?.user ?? null } }),
    onAuthStateChange: (cb) => { authCbs.add(cb); return { data: { subscription: { unsubscribe: () => authCbs.delete(cb) } } } },
    signInWithPassword: async () => { setSession({ user: DEMO_USER }); return { error: null } },
    signUp: async ({ options }) => { Object.assign(db.profiles[0], { full_name: options?.data?.full_name || 'Stefan Moser' }); setSession({ user: DEMO_USER }); return { error: null } },
    signOut: async () => { setSession(null); return { error: null } },
    resetPasswordForEmail: async () => ({ error: null }),
  },
  rpc: async (fn, p) => {
    if (fn === 'place_order') {
      const lines = p.p_items.map(x => [x.item_id, x.qty])
      if (!lines.length) return { data: null, error: { message: 'Warenkorb ist leer' } }
      const o = mkOrder({ status: 'open', fulfillment: p.p_fulfillment, table_code: p.p_table_code, guest_name: p.p_guest_name || null, note: p.p_note || null, lines, minsAgo: 0 })
      notify(); return { data: [{ order_id: o.id, client_token: o.client_token, number: o.number, total_chf: o.total_chf }], error: null }
    }
    if (fn === 'get_order') {
      const o = db.orders.find(o => o.id === p.p_order_id && o.client_token === p.p_token)
      if (!o) return { data: [], error: null }
      return { data: [{ ...o, table_label: db.tables.find(t => t.code === o.table_code)?.label, items: db.order_items.filter(i => i.order_id === o.id).map(i => ({ name: i.name, qty: i.qty, price: i.unit_price_chf, deposit: i.deposit_chf })) }], error: null }
    }
    if (fn === 'helper_lookup') {
      const b = views.helper_balance().find(x => x.helper_code === p.p_code)
      if (!b) return { data: [], error: null }
      const recent = db.helper_consumptions.filter(c => c.user_id === b.user_id).slice(-8).reverse().map(c => ({ name: c.name, qty: c.qty, amount: c.amount_chf, at: c.created_at }))
      return { data: [{ ...b, recent }], error: null }
    }
    if (fn === 'book_helper_consumption') {
      const b = views.helper_balance().find(x => x.helper_code === p.p_code)
      if (!b) return { data: null, error: { message: 'Code unbekannt' } }
      const lines = p.p_items.map(x => ({ it: db.menu_items.find(i => i.id === x.item_id), qty: x.qty }))
      const total = lines.reduce((a, l) => a + Number(l.it.price_chf) * l.qty, 0)
      let topup = 0
      if (total > b.balance + 0.001) {
        if (!p.p_topup) return { data: null, error: { message: `Guthaben reicht nicht (noch ${b.balance.toFixed(2)} Fr.)` } }
        topup = Math.round((total - b.balance) * 100) / 100
        db.helper_credits.push({ id: uid(), user_id: b.user_id, shift_id: null, amount_chf: topup, reason: 'Aufzahlung bar/Karte', created_by: DEMO_USER.id, created_at: new Date().toISOString() })
      }
      for (const l of lines) db.helper_consumptions.push({ id: uid(), user_id: b.user_id, menu_item_id: l.it.id, name: l.it.name + (l.it.variant ? ' ' + l.it.variant : ''), qty: l.qty, unit_price_chf: l.it.price_chf, amount_chf: Number(l.it.price_chf) * l.qty, station: p.p_station, booked_by: DEMO_USER.id, created_at: new Date().toISOString() })
      notify(); return { data: [{ balance: b.balance + topup - total, topup }], error: null }
    }
    if (fn === 'account_lookup') {
      const b = views.account_balance().find(x => x.code === p.p_code && x.active)
      if (!b) return { data: [], error: null }
      const recent = db.account_bookings.filter(c => c.account_id === b.id).slice(-8).reverse().map(c => ({ name: c.name, qty: c.qty, amount: c.amount_chf, consumer: c.consumer, at: c.created_at }))
      return { data: [{ account_id: b.id, name: b.name, contact: b.contact, limit_chf: b.limit_chf, open_chf: b.open_chf, recent }], error: null }
    }
    if (fn === 'book_account') {
      const b = views.account_balance().find(x => x.code === p.p_code && x.active)
      if (!b) return { data: null, error: { message: 'Code unbekannt' } }
      let total = 0
      for (const x of p.p_items) { const it = db.menu_items.find(i => i.id === x.item_id); total += Number(it.price_chf) * x.qty; db.account_bookings.push({ id: uid(), account_id: b.id, invoice_id: null, menu_item_id: it.id, name: it.name + (it.variant ? ' ' + it.variant : ''), qty: x.qty, unit_price_chf: it.price_chf, amount_chf: Number(it.price_chf) * x.qty, station: p.p_station, consumer: p.p_consumer || null, booked_by: DEMO_USER.id, created_at: new Date().toISOString() }) }
      notify(); return { data: [{ open_chf: b.open_chf + total }], error: null }
    }
    if (fn === 'create_account_invoice') {
      const open = db.account_bookings.filter(b => b.account_id === p.p_account && !b.invoice_id)
      if (!open.length) return { data: null, error: { message: 'Keine offenen Buchungen' } }
      const id = uid(); const n = db.account_invoices.length + 1; const today = new Date(); const due = new Date(Date.now() + 30 * 864e5)
      db.account_invoices.push({ id, account_id: p.p_account, number: `${today.getFullYear()}-${String(n).padStart(2, '0')}`, issued_at: today.toISOString().slice(0, 10), due_at: due.toISOString().slice(0, 10), total_chf: open.reduce((s, b) => s + Number(b.amount_chf), 0), status: 'open', paid_at: null, created_at: today.toISOString() })
      open.forEach(b => { b.invoice_id = id }); notify(); return { data: id, error: null }
    }
    if (fn === 'assign_wishes') {
      let c = 0, l = 0
      for (const su of db.shift_signups.filter(x => x.status === 'wish')) {
        const s = db.shifts.find(s => s.id === su.shift_id); const taken = db.shift_signups.filter(x => x.shift_id === su.shift_id && x.status === 'confirmed').length
        if (taken < s.capacity) { su.status = 'confirmed'; c++ } else l++
      }
      notify(); return { data: [{ confirmed: c, left_open: l }], error: null }
    }
    return { data: null, error: { message: 'unbekannte Funktion ' + fn } }
  },
  functions: {
    invoke: async (name, { body }) => {
      if (name === 'payrexx-create') {
        const o = db.orders.find(o => o.id === body.order_id)
        // Simulierte Payrexx-Seite: nach 2 s "bezahlt" und zurück zur Statusseite
        setTimeout(() => { if (o.status === 'open') { o.status = 'paid'; onPaid([o]); notify() } }, 2500)
        return { data: { link: `${body.return_base}/#/demo-pay/${o.id}?t=${o.client_token}` }, error: null }
      }
      if (name === 'payrexx-check') { const o = db.orders.find(o => o.id === body.order_id); return { data: { status: o?.status ?? 'open' }, error: null } }
      if (name === 'payrexx-refund') {
        const o = db.orders.find(o => o.id === body.order_id); const amount = body.pieces * 2
        if (amount > Number(o.deposit_chf) - Number(o.deposit_returned_chf) + 0.001) return { data: { error: 'Zu viel Depot' }, error: null }
        db.deposit_returns.push({ id: uid(), order_id: o.id, pieces: body.pieces, amount_chf: amount, method: 'payrexx', by_user: DEMO_USER.id, created_at: new Date().toISOString() })
        o.deposit_returned_chf = Number(o.deposit_returned_chf) + amount; notify(); return { data: { ok: true, amount }, error: null }
      }
      return { data: { error: 'unbekannt' }, error: null }
    },
  },
  channel: () => { const h = { cbs: [], on(_, __, cb) { h.cbs.push(cb); return h }, subscribe() { h.cbs.forEach(cb => listeners.add(cb)); return h } }; return h },
  removeChannel: (h) => h?.cbs?.forEach(cb => listeners.delete(cb)),
}
