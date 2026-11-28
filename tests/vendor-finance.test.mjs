import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let vite
let previewTransactions
let readTransactionFilters
let filterTransactions
let formatJalaliDateRange
let previewFinanceSource
let vendorFinanceSource
let normalizeSheba
let validatePayout

// Checksum-valid synthetic IBAN; not a bank account.
const exampleIban = 'IR490000000000000000000000'

before(async () => {
  process.env.VITE_API_BASE_URL = '/api'
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key) => (key === 'access_token' ? 'finance-token' : null) },
  })
  vite = await createServer({ server: { middlewareMode: true, watch: null, hmr: false } })
  ;({ previewTransactions } = await vite.ssrLoadModule(
    '/src/features/vendor-finance/previewTransactions.ts',
  ))
  ;({ readTransactionFilters, filterTransactions } = await vite.ssrLoadModule(
    '/src/features/vendor-finance/transactions.ts',
  ))
  ;({ formatJalaliDateRange } = await vite.ssrLoadModule('/src/lib/vendorDates.ts'))
  ;({ previewFinanceSource } = await vite.ssrLoadModule(
    '/src/features/vendor-finance/previewFinance.ts',
  ))
  ;({ vendorFinanceSource } = await vite.ssrLoadModule('/src/services/vendor/financeService.ts'))
  ;({ validatePayout, normalizeSheba } = await vite.ssrLoadModule(
    '/src/features/vendor-finance/payoutValidation.ts',
  ))
})

after(async () => {
  await vite?.close()
  delete globalThis.localStorage
})

const results = (query) => {
  const { records, periods } = previewTransactions
  return filterTransactions(records, readTransactionFilters(new URLSearchParams(query), periods))
}

test('shows all eight records in the default period, including both boundaries', () => {
  const records = results('')
  assert.equal(records.length, 8)
  assert.equal(records[0].date, previewTransactions.periods[0].to)
  assert.equal(records[7].date, previewTransactions.periods[0].from)
  assert.equal(records[7].amount, 0)
  assert.equal(formatJalaliDateRange('2026-09-23', '2026-10-19'), '۱ تا ۲۷ مهر ۱۴۰۵')
})

test('combines status, kind and date range, including an empty result', () => {
  assert.equal(results('period=day').length, 4)
  assert.equal(results('period=week').length, 7)
  assert.deepEqual(
    results('period=week&type=settlement&status=pending').map(({ id }) => id),
    ['settlement-request'],
  )
  assert.deepEqual(results('period=day&type=settlement&status=pending'), [])
  assert.equal(results('period=all&type=subscription').length, 1)
})

test('ignores invalid or inherited filter values in shared URLs', () => {
  assert.deepEqual(results('period=missing&type=constructor&status=__proto__'), results(''))
})

test('uses one sample balance for the overview, payout history, and ledger', async () => {
  const overview = await previewFinanceSource.load('overview')
  const { totals, settlements, transactions, reservations, sales } = overview
  assert.deepEqual(totals, {
    gross: 2000000,
    commission: 200000,
    net: 1800000,
    paid: 1000000,
    pending: 500000,
    available: 300000,
  })
  assert.equal(
    sales.reduce((sum, interval) => sum + interval.amount, 0),
    totals.gross,
  )
  assert.equal(
    reservations.reduce((sum, order) => sum + order.amount, 0),
    120000,
  )
  for (const { id, date, amount, status } of settlements) {
    const row = transactions.records.find((record) => record.id === id)
    assert.deepEqual(
      { date: row.date, amount: row.amount, status: row.status },
      { date, amount, status },
    )
  }
})

test('accepts Persian and Arabic digits in whole-toman amounts and a checked Iranian IBAN', () => {
  assert.equal(normalizeSheba('ir۴۹ ۰۰۰۰-۰۰۰۰ ۰۰۰۰ ۰۰۰۰ ۰۰۰۰ ۰۰'), exampleIban)
  const { input, errors } = validatePayout(
    { amount: ' ١٢٥٬۰۰۰ ', accountHolder: ' حساب آزمایشی ', iban: exampleIban.slice(2) },
    300000,
  )
  assert.deepEqual(input, { amount: 125000, accountHolder: 'حساب آزمایشی', iban: exampleIban })
  assert.deepEqual(errors, {})
})

test('rejects a non-positive, unsafe, fractional, ambiguous, or over-balance payout', () => {
  const fields = { accountHolder: 'نام آزمایشی', iban: exampleIban }
  for (const amount of ['0', '-1', '۲۵۰۰٫۵', '۱۲,۳', '1e3', '9007199254740992', '۳۰۱٬۰۰۰']) {
    const { input, errors } = validatePayout({ ...fields, amount }, 300000)
    assert.equal(input, null, amount)
    assert.ok(errors.amount, amount)
  }
  assert.equal(normalizeSheba('DE49' + exampleIban.slice(4)), null)
  assert.equal(normalizeSheba(exampleIban.slice(0, -1) + '1'), null)
  assert.equal(normalizeSheba(exampleIban.slice(0, -1)), null)
  const { errors } = validatePayout({ amount: '300000', accountHolder: '   ', iban: '' }, 300000)
  assert.deepEqual(Object.keys(errors).sort(), ['accountHolder', 'iban'])
})

test('preview upgrade replaces only the pending request and leaves the subscription active', async () => {
  await assert.rejects(previewFinanceSource.requestUpgrade('basic'))
  await assert.rejects(previewFinanceSource.requestUpgrade('professional'))
  const { plans } = await previewFinanceSource.requestUpgrade('premium')
  assert.equal(plans.current.offer.id, 'basic')
  assert.equal(plans.current.pendingUpgrade.id, 'premium')
  assert.equal(plans.history.filter(({ status }) => status === 'pending').length, 1)
  assert.deepEqual((await previewFinanceSource.load('overview')).plans, plans)
})

test('preview payout cannot overdraw and does not retain the supplied bank details', async () => {
  const payout = { amount: 125000, accountHolder: 'حساب مخصوص آزمون', iban: exampleIban }
  await assert.rejects(previewFinanceSource.requestPayout({ ...payout, amount: 300001 }))
  const snapshot = await previewFinanceSource.requestPayout(payout)
  assert.equal(snapshot.totals.available, 175000)
  assert.equal(snapshot.totals.pending, 625000)
  const [request] = snapshot.settlements
  assert.equal(request.status, 'pending')
  assert.equal(request.amount, payout.amount)
  assert.equal(snapshot.transactions.records[0].id, request.id)
  assert.deepEqual((await previewFinanceSource.load('overview')).totals, snapshot.totals)
  assert.ok(!JSON.stringify(snapshot).includes(payout.accountHolder))
  assert.ok(!JSON.stringify(snapshot).includes(payout.iban))
  await previewFinanceSource.requestPayout({ ...payout, amount: 175000 })
  await assert.rejects(previewFinanceSource.requestPayout({ ...payout, amount: 1 }))
})

const dashboardPayload = {
  active_store: {
    id: 'store-1',
    name: 'نانوایی بهار',
    address: 'تهران، انقلاب',
    status: 'approved',
    accepts_orders: true,
    created_at: '2026-10-01T08:00:00Z',
  },
  stores: [
    {
      id: 'store-1',
      name: 'نانوایی بهار',
      address: 'تهران، انقلاب',
      status: 'approved',
      accepts_orders: true,
      created_at: '2026-10-01T08:00:00Z',
    },
  ],
  pending_store_requests: [],
  kpis: { received_revenue: 1000000, reserved_packages: 3, available_packages: 4, active_offers: 2 },
  reservation_counts: {
    pending_payment: 0,
    paid: 2,
    ready: 1,
    completed: 8,
    cancelled: 1,
    expired: 0,
    no_show: 0,
    active: 3,
    total: 12,
  },
  today: { reservations_count: 1, packages_reserved: 2, completed_count: 1, revenue: 80000 },
  financial: {
    received_payout: 1000000,
    net_period_revenue: 1500000,
    pending_payout: 500000,
    available_balance: 1000000,
    plan: {
      name: 'پایه · رایگان',
      commission_rate: 15,
      period_start: '2026-10-01T00:00:00Z',
      period_end: '2026-11-01T00:00:00Z',
      remaining_days: 12,
    },
  },
  nearest_reservation: null,
  recent_reservations: [
    {
      id: 'recent-1',
      status: 'paid',
      payment_status: 'succeeded',
      pickup_code: '1234',
      customer_name: 'سارا رضایی',
      store_id: 'store-1',
      store_name: 'نانوایی بهار',
      items: [{ title: 'بسته نان', offer_type: 'surprise_bag', quantity: 2, unit_price: 45000 }],
      items_total: 90000,
      total_amount: 90000,
      vendor_payout: 76500,
      pickup_start: '2026-10-19T14:30:00Z',
      pickup_end: '2026-10-19T15:30:00Z',
      created_at: '2026-10-19T10:00:00Z',
    },
    {
      id: 'recent-done',
      status: 'completed',
      payment_status: 'succeeded',
      pickup_code: '5678',
      customer_name: 'علی محمدی',
      store_id: 'store-1',
      store_name: 'نانوایی بهار',
      items: [{ title: 'بسته شیرینی', offer_type: 'surprise_bag', quantity: 1, unit_price: 60000 }],
      items_total: 60000,
      total_amount: 60000,
      vendor_payout: 51000,
      pickup_start: '2026-10-18T14:30:00Z',
      pickup_end: '2026-10-18T15:30:00Z',
      created_at: '2026-10-18T10:00:00Z',
    },
  ],
}

test('live finance combines GET /vendor/dashboard financials/plan with active reservations', async (t) => {
  const { signal } = new AbortController()
  const fetch = t.mock.method(globalThis, 'fetch', async (url, init) => {
    const endpoint = new URL(url, 'http://test.invalid')
    assert.equal(init.signal, signal)
    assert.equal(init.headers.get('Authorization'), 'Bearer finance-token')
    if (endpoint.pathname === '/api/vendor/dashboard') {
      return Response.json(dashboardPayload)
    }
    if (endpoint.pathname === '/api/vendor/orders') {
      return Response.json({
        orders: [
          {
            id: 'ord-1',
            order_number: 'TG-101',
            customer: { name: 'سارا رضایی' },
            package: { id: 'offer-1', title: 'بسته نان' },
            quantity: 2,
            total_price: 90000,
            status: 'active',
            pickup_date: '2026-10-19',
            pickup_time_slot: { start_time: '09:00', end_time: '11:00' },
          },
        ],
        pagination: { page: 1, total_pages: 1 },
      })
    }
    throw new Error(`unexpected endpoint: ${endpoint.pathname}`)
  })

  const overview = await vendorFinanceSource.load('overview', signal)
  assert.equal(overview.storeName, 'نانوایی بهار')
  assert.deepEqual(overview.totals, {
    net: 1500000,
    paid: 1000000,
    pending: 500000,
    available: 1000000,
  })
  assert.equal(overview.plans.current.offer.name, 'پایه · رایگان')
  assert.equal(overview.plans.current.offer.commission, 15)
  assert.equal(overview.plans.current.from, '2026-10-01')
  assert.equal(overview.plans.current.to, '2026-11-01')
  assert.equal(overview.plans.current.daysLeft, 12)
  assert.deepEqual(overview.plans.options, [])
  assert.deepEqual(overview.plans.history, [])
  assert.deepEqual(overview.reservations, [
    { id: 'ord-1', customer: 'سارا رضایی', quantity: 2, amount: 90000 },
  ])

  const plans = await vendorFinanceSource.load('plans', signal)
  assert.deepEqual(plans.plans, overview.plans)
  assert.equal(plans.totals, undefined)

  const settlements = await vendorFinanceSource.load('settlements', signal)
  assert.deepEqual(settlements.totals, overview.totals)
  assert.equal(settlements.settlements, undefined)

  assert.deepEqual(await vendorFinanceSource.load('transactions', signal), {})
  assert.equal(vendorFinanceSource.requestUpgrade, undefined)
  assert.equal(vendorFinanceSource.requestPayout, undefined)
  assert.equal(fetch.mock.callCount(), 4)
})

test('live finance overview falls back to dashboard recent_reservations when /vendor/orders is 404', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    const endpoint = new URL(url, 'http://test.invalid')
    if (endpoint.pathname === '/api/vendor/dashboard') {
      return Response.json(dashboardPayload)
    }
    return Response.json({}, { status: 404 })
  })

  const overview = await vendorFinanceSource.load('overview')
  assert.deepEqual(overview.reservations, [
    { id: 'recent-1', customer: 'سارا رضایی', quantity: 2, amount: 90000 },
  ])
  assert.deepEqual(overview.totals, {
    net: 1500000,
    paid: 1000000,
    pending: 500000,
    available: 1000000,
  })
})

test('live finance propagates 401 errors from GET /vendor/dashboard on plans and settlements', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({}, { status: 401 }))
  await assert.rejects(vendorFinanceSource.load('plans'), { status: 401 })
  await assert.rejects(vendorFinanceSource.load('settlements'), { status: 401 })
  await assert.rejects(vendorFinanceSource.load('overview'), { status: 401 })
})

test('live finance falls back to vendor reservations when GET /vendor/dashboard is 404', async (t) => {
  const { signal } = new AbortController()
  const order = (id, status, quantity, name = '') => ({
    id,
    order_number: `TG-${id}`,
    customer: { name },
    package: { id: 'offer', title: 'بسته آزمایشی' },
    quantity,
    total_price: quantity * 40000,
    status,
    pickup_date: '2026-10-19',
    pickup_time_slot: { start_time: '09:00', end_time: '11:00' },
  })
  const fetch = t.mock.method(globalThis, 'fetch', async (url, init) => {
    const endpoint = new URL(url, 'http://test.invalid')
    assert.equal(init.signal, signal)
    assert.equal(init.headers.get('Authorization'), 'Bearer finance-token')
    if (endpoint.pathname === '/api/vendor/dashboard') {
      return Response.json({}, { status: 404 })
    }
    assert.equal(endpoint.pathname, '/api/vendor/orders')
    const page = Number(endpoint.searchParams.get('page'))
    const orders =
      page === 1
        ? [order('one', 'active', 2, ' فروش نمونه '), order('done', 'delivered', 10)]
        : [order('two', 'ready_for_pickup', 1), order('cancelled', 'cancelled', 3)]
    return Response.json({ orders, pagination: { page, total_pages: 2 } })
  })
  const overview = await vendorFinanceSource.load('overview', signal)
  assert.deepEqual(overview, {
    reservations: [
      { id: 'one', customer: 'فروش نمونه', quantity: 2, amount: 80000 },
      { id: 'two', customer: 'سفارش TG-two', quantity: 1, amount: 40000 },
    ],
  })
  for (const section of ['plans', 'transactions', 'settlements']) {
    assert.deepEqual(await vendorFinanceSource.load(section, signal), {})
  }
  assert.equal(vendorFinanceSource.requestUpgrade, undefined)
  assert.equal(vendorFinanceSource.requestPayout, undefined)
  assert.equal(fetch.mock.callCount(), 5)
})

test('a missing vendor-order and dashboard endpoint stays unavailable, with no demo fallback', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({}, { status: 404 }))
  await assert.rejects(vendorFinanceSource.load('overview'), { status: 404 })
  assert.equal(fetch.mock.callCount(), 2)
})
