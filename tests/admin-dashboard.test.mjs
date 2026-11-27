import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

let vite
let adminDashboardApi
let ApiError
let AdminDashboardPage

before(async () => {
  process.env.VITE_API_BASE_URL = '/api'
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key) => (key === 'access_token' ? 'admin-token' : null) },
  })
  vite = await createServer({
    server: { middlewareMode: true, watch: null, hmr: false },
    ssr: { external: ['react', 'react-dom', 'react-router-dom', 'lucide-react'] },
  })
  ;({ adminDashboardApi } = await vite.ssrLoadModule('/src/features/admin/api/adminDashboardApi.ts'))
  ;({ ApiError } = await vite.ssrLoadModule('/src/lib/api/client.ts'))
  ;({ default: AdminDashboardPage } = await vite.ssrLoadModule('/src/pages/admin/DashboardPage.tsx'))
})

after(async () => {
  await vite?.close()
  delete globalThis.localStorage
})

test('rejects HTML 200 responses with a descriptive 502 ApiError instead of crashing with TypeError', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => {
    return new Response('<!doctype html><html></html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    })
  })

  await assert.rejects(adminDashboardApi.getSummary(), (error) => {
    assert.ok(error instanceof ApiError)
    assert.equal(error.status, 502)
    assert.match(error.message, /پاسخ دریافتی از سرور معتبر نیست/)
    return true
  })
})

test('normalizes empty-database GET /admin/dashboard responses with zero counts and empty activity', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    const req = new URL(url, 'http://test.invalid')
    assert.equal(req.pathname, '/api/admin/dashboard')
    return Response.json({
      totals: {
        customers: 0,
        vendors: 0,
        registered_stores: 0,
        active_stores: 0,
        active_offers: 0,
        pending_applications: 0,
        total_reservations: 0,
        active_reservations: 0,
        completed_reservations: 0,
        platform_commission: 0,
      },
      applications: { pending: 0, approved: 0, rejected: 0, suspended: 0 },
      reservations: {
        pending_payment: 0,
        paid: 0,
        ready: 0,
        completed: 0,
        cancelled: 0,
        expired: 0,
        no_show: 0,
        active: 0,
        total: 0,
      },
      recent_activity: [],
    })
  })

  const data = await adminDashboardApi.getSummary()
  assert.equal(data.metrics.registeredStores, 0)
  assert.equal(data.metrics.knownCustomers, 0)
  assert.deepEqual(data.recentActivity, [])
})

test('falls back to GET /admin/vendors when GET /admin/dashboard returns 404', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    const req = new URL(url, 'http://test.invalid')
    if (req.pathname === '/api/admin/dashboard') {
      return Response.json({ error: { message: 'not found' } }, { status: 404 })
    }
    if (req.pathname === '/api/admin/vendors') {
      return Response.json({
        items: [],
        total: 0,
        page: 1,
        page_size: 5,
        counts: { pending: 0, approved: 0, rejected: 0, suspended: 0 },
      })
    }
    throw new Error(`unexpected ${req.pathname}`)
  })

  const data = await adminDashboardApi.getSummary()
  assert.equal(data.metrics.registeredStores, 0)
  assert.deepEqual(data.recentActivity, [])
})

test('AdminDashboardPage renders dashboard shell cleanly', () => {
  const html = renderToStaticMarkup(
    React.createElement(MemoryRouter, null, React.createElement(AdminDashboardPage)),
  )
  assert.match(html, /داشبورد مدیریت/)
})
