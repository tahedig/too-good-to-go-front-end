import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

let vite
let vendorApi
let VendorOrdersPage
let VendorReservationsPage
let OrderDateSelector
let VendorOrderCard
let formatJalaliDate

before(async () => {
  process.env.VITE_API_BASE_URL = '/api'
  const storeMap = new Map([['access_token', 'vendor-token']])
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => storeMap.get(key) ?? null,
      setItem: (key, val) => storeMap.set(key, String(val)),
      removeItem: (key) => storeMap.delete(key),
    },
  })
  vite = await createServer({
    server: { middlewareMode: true, watch: null, hmr: false },
    ssr: { external: ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'jalaali-js'] },
  })
  ;({ vendorApi } = await vite.ssrLoadModule('/src/features/vendor/api/vendorApi.ts'))
  ;({ default: VendorOrdersPage } = await vite.ssrLoadModule('/src/pages/vendor/OrdersPage.tsx'))
  ;({ default: VendorReservationsPage } = await vite.ssrLoadModule(
    '/src/pages/vendor/ReservationsPage.tsx',
  ))
  ;({ OrderDateSelector } = await vite.ssrLoadModule(
    '/src/features/vendor/components/OrderDateSelector.tsx',
  ))
  ;({ VendorOrderCard } = await vite.ssrLoadModule(
    '/src/features/vendor/components/VendorOrderCard.tsx',
  ))
  ;({ formatJalaliDate } = await vite.ssrLoadModule('/src/features/vendor/utils/dateUtils.ts'))
})

after(async () => {
  await vite?.close()
  delete globalThis.localStorage
})

test('PR #19 vendorApi hits /vendor/store, /vendor/orders, /vendor/orders/summary, and verify-pickup', async (t) => {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    const parsed = new URL(url, 'http://test.invalid')
    calls.push({ method: init?.method ?? 'GET', path: parsed.pathname + parsed.search })
    if (parsed.pathname === '/api/vendor/store') {
      return Response.json({
        id: 's1',
        name: 'نان صبحگاهی',
        address: 'تهران',
        phone: '021',
        is_active: true,
      })
    }
    if (parsed.pathname === '/api/vendor/orders') {
      return Response.json({
        orders: [],
        pagination: { page: 1, limit: 20, total_items: 0, total_pages: 0 },
      })
    }
    if (parsed.pathname === '/api/vendor/orders/summary') {
      return Response.json({
        date: '1405-07-27',
        total_reserved_packages: 0,
        active_reservations_count: 0,
        delivered_packages_count: 0,
        total_revenue: 0,
      })
    }
    if (parsed.pathname === '/api/vendor/orders/ord-1/verify-pickup') {
      return Response.json({
        success: true,
        order_id: 'ord-1',
        status: 'delivered',
        delivered_at: '2026-10-19T15:00:00Z',
        message: 'ok',
      })
    }
    throw new Error(`unexpected ${parsed.pathname}`)
  })

  await vendorApi.getStore()
  await vendorApi.listOrders({ date: '1405-07-27', status: 'active' })
  await vendorApi.getSummary('1405-07-27')
  await vendorApi.verifyPickup('ord-1', { pickup_code: '1234' })

  assert.deepEqual(calls, [
    { method: 'GET', path: '/api/vendor/store' },
    { method: 'GET', path: '/api/vendor/orders?date=1405-07-27&status=active' },
    { method: 'GET', path: '/api/vendor/orders/summary?date=1405-07-27' },
    { method: 'POST', path: '/api/vendor/orders/ord-1/verify-pickup' },
  ])
})

test('PR #19 VendorOrdersPage and VendorReservationsPage render cleanly on SSR', () => {
  const ordersHtml = renderToStaticMarkup(
    React.createElement(MemoryRouter, null, React.createElement(VendorOrdersPage)),
  )
  const reservationsHtml = renderToStaticMarkup(
    React.createElement(MemoryRouter, null, React.createElement(VendorReservationsPage)),
  )
  assert.match(ordersHtml, /سفارشات/)
  assert.match(ordersHtml, /aria-haspopup="dialog"/)
  assert.match(reservationsHtml, /رزروها/)
  assert.match(reservationsHtml, /aria-haspopup="dialog"/)
})

test('OrderDateSelector uses themed VendorDatePicker and formats ISO pickup dates in Jalali', () => {
  assert.equal(formatJalaliDate('2026-11-26'), '۵ آذر ۱۴۰۵')

  const selectorHtml = renderToStaticMarkup(
    React.createElement(OrderDateSelector, {
      selectedDate: '2026-11-26',
      onDateChange: () => {},
      allowClear: true,
    }),
  )
  assert.match(selectorHtml, /aria-haspopup="dialog"/)
  assert.match(selectorHtml, /۵ آذر ۱۴۰۵/)
  assert.match(selectorHtml, /همه تاریخ‌ها/)
  assert.doesNotMatch(selectorHtml, /<select/)

  const cardHtml = renderToStaticMarkup(
    React.createElement(VendorOrderCard, {
      order: {
        id: 'ord-1',
        order_number: 'TG-0001',
        customer: { id: 'c1', name: 'لیلا علیزاده', phone: '09121112233' },
        package: { id: 'p1', title: 'بسته صبحانه', image_url: '' },
        quantity: 1,
        unit_price: 45000,
        total_price: 45000,
        status: 'active',
        pickup_date: '2026-11-26',
        pickup_time_slot: { start_time: '18:00', end_time: '19:00' },
        created_at: '2026-11-26T10:00:00Z',
      },
      onVerifyPickup: () => {},
    }),
  )
  assert.match(cardHtml, /۵ آذر ۱۴۰۵/)
})
