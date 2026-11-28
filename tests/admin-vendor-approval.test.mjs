import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { after, before, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

let vite
let httpVendorApprovalApi
let describeError
let ApiError
let VendorListPage
let VendorReviewPage

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
  ;({ httpVendorApprovalApi } = await vite.ssrLoadModule(
    '/src/features/vendor-approval/api/httpVendorApprovalApi.ts',
  ))
  ;({ describeError } = await vite.ssrLoadModule('/src/features/vendor-approval/errors.ts'))
  ;({ ApiError } = await vite.ssrLoadModule('/src/lib/api/client.ts'))
  ;({ default: VendorListPage } = await vite.ssrLoadModule('/src/pages/admin/VendorListPage.tsx'))
  ;({ default: VendorReviewPage } = await vite.ssrLoadModule(
    '/src/pages/admin/VendorReviewPage.tsx',
  ))
})

after(async () => {
  await vite?.close()
  delete globalThis.localStorage
})

test('httpVendorApprovalApi calls /admin/vendors endpoints and maps DTOs + field errors', async (t) => {
  const calls = []
  const sampleVendorDto = {
    id: 'v-1',
    store_name: 'نان صبحگاهی',
    owner_name: 'آیدا کریمی',
    category: 'نانوایی',
    address: 'خیابان شریعتی، پلاک ۲۴',
    phone: '+989121111111',
    email: null,
    description: 'نان روز',
    image_url: null,
    submitted_at: '2026-10-19T08:30:00Z',
    status: 'pending',
    status_updated_at: null,
    decision: null,
  }

  t.mock.method(globalThis, 'fetch', async (url, init) => {
    const parsed = new URL(url, 'http://test.invalid')
    calls.push({
      method: init?.method ?? 'GET',
      path: parsed.pathname + parsed.search,
      body: init?.body ? JSON.parse(init.body) : null,
    })

    if (parsed.pathname === '/api/admin/vendors') {
      return Response.json({
        items: [sampleVendorDto],
        total: 1,
        page: 1,
        page_size: 20,
        counts: { pending: 1, approved: 2, rejected: 0, suspended: 0 },
      })
    }
    if (parsed.pathname === '/api/admin/vendors/v-1') {
      return Response.json(sampleVendorDto)
    }
    if (parsed.pathname === '/api/admin/vendors/v-1/approve') {
      return Response.json({ ...sampleVendorDto, status: 'approved' })
    }
    if (parsed.pathname === '/api/admin/vendors/v-1/reject') {
      return Response.json(
        {
          error: {
            message: 'دلیل نامعتبر',
            details: [{ field: 'reason_code', message: 'دلیل را انتخاب کنید.' }],
          },
        },
        { status: 422 },
      )
    }
    if (parsed.pathname === '/api/admin/vendors/v-1/suspend') {
      return Response.json({ ...sampleVendorDto, status: 'suspended' })
    }
    if (parsed.pathname === '/api/admin/vendors/v-1/reactivate') {
      return Response.json({ ...sampleVendorDto, status: 'approved' })
    }
    throw new Error(`unexpected ${parsed.pathname}`)
  })

  const list = await httpVendorApprovalApi.list({ statuses: ['pending'], search: 'نان', page: 1 })
  assert.equal(list.items[0].storeName, 'نان صبحگاهی')
  assert.equal(list.counts.approved, 2)

  const detail = await httpVendorApprovalApi.get('v-1')
  assert.equal(detail.ownerName, 'آیدا کریمی')

  const approved = await httpVendorApprovalApi.approve('v-1')
  assert.equal(approved.status, 'approved')

  await assert.rejects(
    httpVendorApprovalApi.reject('v-1', {
      reasonCode: '',
      message: 'متن کافی برای رد درخواست فروشگاه.',
    }),
    (err) => {
      assert.ok(err instanceof ApiError)
      assert.equal(err.status, 422)
      assert.deepEqual(err.fieldErrors.reasonCode, ['دلیل را انتخاب کنید.'])
      return true
    },
  )

  await httpVendorApprovalApi.suspend('v-1', {
    reasonCode: 'customer_complaints',
    message: 'به دلیل شکایات متعدد فروشگاه موقتاً تعلیق شد.',
  })
  await httpVendorApprovalApi.reactivate('v-1')

  assert.deepEqual(
    calls.map((c) => `${c.method} ${c.path}`),
    [
      'GET /api/admin/vendors?page=1&page_size=20&status=pending&search=%D9%86%D8%A7%D9%86',
      'GET /api/admin/vendors/v-1',
      'POST /api/admin/vendors/v-1/approve',
      'POST /api/admin/vendors/v-1/reject',
      'POST /api/admin/vendors/v-1/suspend',
      'POST /api/admin/vendors/v-1/reactivate',
    ],
  )
})

test('describeError distinguishes 401, 403, and 404 for admin panel redirects', () => {
  const err401 = describeError(new ApiError('unauthorized', 401), 'fallback')
  assert.equal(err401.unauthorized, true)
  assert.equal(err401.forbidden, false)

  const err403 = describeError(new ApiError('forbidden', 403), 'fallback')
  assert.equal(err403.unauthorized, false)
  assert.equal(err403.forbidden, true)

  const err404 = describeError(new ApiError('not found', 404), 'fallback')
  assert.equal(err404.notFound, true)
})

test('Admin router wires store-requests and stores to VendorListPage and VendorReviewPage', async () => {
  const routerSource = await fs.readFile(new URL('../src/app/router.tsx', import.meta.url), 'utf8')
  const adminStart = routerSource.indexOf("path: '/admin',")
  assert.ok(adminStart >= 0, 'admin route must exist')
  const adminSource = routerSource.slice(adminStart)

  assert.match(adminSource, /path:\s*'store-requests'[\s\S]*VendorListPage/)
  assert.match(adminSource, /path:\s*'store-requests\/:vendorId'[\s\S]*VendorReviewPage/)
  assert.match(adminSource, /path:\s*'stores'[\s\S]*VendorListPage/)
  assert.match(adminSource, /path:\s*'stores\/:vendorId'[\s\S]*VendorReviewPage/)
  assert.doesNotMatch(adminSource, /VendorComingSoonPage/)

  const requestsHtml = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/admin/store-requests'] },
      React.createElement(VendorListPage, { mode: 'requests' }),
    ),
  )
  assert.match(requestsHtml, /درخواست‌های فروشگاه|جست‌وجوی فروشگاه/)

  const reviewHtml = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/admin/stores/v-1'] },
      React.createElement(VendorReviewPage, { mode: 'stores' }),
    ),
  )
  assert.match(reviewHtml, /در حال بارگذاری/)
})
