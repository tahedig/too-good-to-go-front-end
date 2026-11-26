import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let vite
let loadVendorDashboard
let verifyVendorPickup
let toStorePickupWindow

before(async () => {
  process.env.VITE_API_BASE_URL = '/api'
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key) => (key === 'access_token' ? 'test-token' : null) },
  })
  vite = await createServer({ server: { middlewareMode: true, watch: null, hmr: false } })
  ;({ loadVendorDashboard } = await vite.ssrLoadModule('/src/services/vendor/dashboardService.ts'))
  ;({ verifyVendorPickup } = await vite.ssrLoadModule('/src/services/vendor/ordersService.ts'))
  ;({ toStorePickupWindow } = await vite.ssrLoadModule('/src/lib/vendorReservations.ts'))
})

after(async () => {
  await vite?.close()
  delete globalThis.localStorage
})

function mockApi(t, respond) {
  return t.mock.method(globalThis, 'fetch', async (url, init) => {
    const request = new URL(url, 'http://test.invalid')
    assert.equal(request.origin, 'http://test.invalid')
    assert.equal(init.headers.get('Authorization'), 'Bearer test-token')
    return respond(request, init)
  })
}

const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10)

function order(id, pickupDate, status, quantity, offerId = 'offer-a') {
  return {
    id,
    customer: { name: 'فروش نمونه' },
    order_number: `TG-${id}`,
    package: { id: offerId, title: 'بستهٔ رزروشده', image_url: '/image.jpg' },
    status,
    quantity,
    total_price: quantity * 40000,
    pickup_date: pickupDate,
    pickup_time_slot: { start_time: '14:30', end_time: '15:30' },
  }
}

function store(id, products = 1, status = 'approved') {
  return { public_id: id, name: id, active_products_count: products, approval_status: status }
}

function request(id, status, createdAt) {
  return { public_id: id, store_name: id, status, created_at: createdAt }
}

function offer(id, quantity) {
  return { id, quantity_available: quantity }
}

test('maps dashboard API responses and selects the nearest open pickup across pages', async (t) => {
  const signal = new AbortController().signal
  const fetch = mockApi(t, ({ pathname, searchParams }, init) => {
    assert.equal(init.signal, signal)
    if (pathname === '/api/vendor/stores') {
      return Response.json({
        stores: [store('first'), store('second', 2), store('hidden', 5, 'suspended')],
      })
    }
    if (pathname === '/api/vendor/store-requests') {
      return Response.json({
        requests: [
          request('old', 'pending', '2026-10-01T09:00:00Z'),
          request('recent', 'pending', '2026-10-02T09:00:00Z'),
          request('rejected', 'rejected', '2026-10-03T09:00:00Z'),
        ],
      })
    }
    if (pathname === '/api/vendor/orders') {
      assert.equal(searchParams.get('status'), 'all')
      const page = Number(searchParams.get('page'))
      const orders =
        page === 1
          ? [
              order('cancelled', day(1), 'cancelled', 10),
              order('late', day(4), 'active', 2, 'offer-b'),
              order('overdue', day(-2), 'active', 1),
            ]
          : [
              order('delivered', day(1), 'delivered', 10),
              order('nearest', day(2), 'ready_for_pickup', 3),
            ]
      return Response.json({ orders, pagination: { page, total_pages: 2 } })
    }
    if (pathname === '/api/stores/first/offers') {
      if (searchParams.get('cursor') === 'next') {
        return Response.json({ items: [offer('offer-b', 4)], has_more: false, next_cursor: null })
      }
      return Response.json({ items: [offer('offer-a', 3)], has_more: true, next_cursor: 'next' })
    }
    if (pathname === '/api/stores/second/offers') {
      return Response.json({ items: [offer('offer-c', 2)], has_more: false, next_cursor: null })
    }
    throw new Error(`unexpected request: ${pathname}`)
  })

  const dashboard = await loadVendorDashboard(signal)
  assert.equal(fetch.mock.callCount(), 7)
  assert.deepEqual(
    dashboard.stores.value.map(({ productsCount }) => productsCount),
    [1, 2],
  )
  assert.equal(dashboard.pendingStore.value.id, 'recent')
  assert.equal(dashboard.inventory.value.available, 9)
  assert.equal(dashboard.reservations.value.nearest.id, 'nearest')
  assert.equal(dashboard.reservations.value.nearest.startTime, '18:00')
  assert.equal(dashboard.reservations.value.reserved, 6)
  assert.equal(dashboard.reservations.value.reservedForNearestOffer, 4)
  assert.equal(dashboard.reservations.value.publishedForNearestOffer, null)
  assert.equal(dashboard.finance, null, 'order amounts are not vendor payouts')
})

test('a backend without TEAM-48 does not use a vendor’s purchases as reservations', async (t) => {
  const seen = []
  mockApi(t, ({ pathname }) => {
    seen.push(pathname)
    if (pathname === '/api/vendor/stores') return Response.json({ stores: [] })
    if (pathname === '/api/vendor/store-requests') return Response.json({ requests: [] })
    return Response.json({ error: { message: 'route not found' } }, { status: 404 })
  })

  const dashboard = await loadVendorDashboard()
  assert.deepEqual(dashboard.stores, { ok: true, value: [] })
  assert.deepEqual(dashboard.inventory, { ok: true, value: { available: 0, offers: [] } })
  assert.deepEqual(dashboard.reservations, { ok: false, status: 404 })
  assert.deepEqual(dashboard.pendingStore, { ok: true, value: null })
  assert.deepEqual(seen.sort(), [
    '/api/vendor/orders',
    '/api/vendor/store-requests',
    '/api/vendor/stores',
  ])
})

test('loads the active store using TEAM-48 when store management is not mounted', async (t) => {
  mockApi(t, ({ pathname }) => {
    if (pathname === '/api/vendor/store') {
      return Response.json({ id: 'first', name: 'فروشگاه', address: 'تهران', is_active: true })
    }
    if (pathname === '/api/stores/first/offers') {
      return Response.json({ items: [offer('offer-a', 5)], has_more: false, next_cursor: null })
    }
    if (pathname === '/api/vendor/orders') {
      return Response.json({ orders: [], pagination: { page: 1, total_pages: 0 } })
    }
    return Response.json({}, { status: 404 })
  })

  const dashboard = await loadVendorDashboard()
  assert.equal(dashboard.stores.value[0].id, 'first')
  assert.equal(dashboard.stores.value[0].productsCount, null)
  assert.equal(dashboard.inventory.value.available, 5)
  assert.deepEqual(dashboard.pendingStore, { ok: false, status: 404 })
})

test('a failed inventory source does not erase the store or fabricate stock', async (t) => {
  mockApi(t, ({ pathname }) => {
    if (pathname === '/api/vendor/stores') return Response.json({ stores: [store('first')] })
    if (pathname === '/api/vendor/store-requests') return Response.json({ requests: [] })
    if (pathname === '/api/vendor/orders') {
      return Response.json({ orders: [], pagination: { page: 1, total_pages: 0 } })
    }
    return Response.json({}, { status: 503 })
  })

  const dashboard = await loadVendorDashboard()
  assert.equal(dashboard.stores.value[0].id, 'first')
  assert.deepEqual(dashboard.inventory, { ok: false, status: 503 })
  assert.equal(dashboard.reservations.value.nearest, null)
  assert.equal(dashboard.reservations.value.reserved, 0)
})

test('never submits a blank pickup code and requires a confirmed backend result', async (t) => {
  const fetch = mockApi(t, ({ pathname }, init) => {
    assert.equal(pathname, '/api/vendor/orders/order-1/verify-pickup')
    assert.equal(init.method, 'POST')
    const { pickup_code: code } = JSON.parse(init.body)
    if (code === '1122') return Response.json({ success: false })
    assert.equal(code, '0123')
    return Response.json({ success: true, status: 'delivered', order_id: 'order-1' })
  })
  await assert.rejects(verifyVendorPickup('order-1', ''), { status: 400 })
  assert.equal(fetch.mock.callCount(), 0)
  await assert.rejects(verifyVendorPickup('order-1', '1122'), /تأیید نشد/)
  await verifyVendorPickup('order-1', '0123')
  assert.equal(fetch.mock.callCount(), 2)
})

test('converts overnight UTC pickup windows into Tehran date and times', () => {
  const window = toStorePickupWindow('2026-10-18', '22:00', '01:30')
  assert.equal(window.pickupDate, '2026-10-19')
  assert.equal(window.startTime, '01:30')
  assert.equal(window.endTime, '05:00')
  assert.equal(window.pickupEndsAt, Date.parse('2026-10-19T01:30:00Z'))
})
