import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

let vite
let vendorProductsService
let storeService
let updateVendorOrderStatus
let VendorProductCard
let ApiError

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
    ssr: { external: ['react', 'react-dom', 'react-router-dom', 'lucide-react'] },
  })
  ;({ vendorProductsService } = await vite.ssrLoadModule('/src/services/vendor/productsService.ts'))
  ;({ storeService } = await vite.ssrLoadModule('/src/services/storeService.ts'))
  ;({ updateVendorOrderStatus } = await vite.ssrLoadModule('/src/services/vendor/ordersService.ts'))
  ;({ VendorProductCard } = await vite.ssrLoadModule(
    '/src/components/vendor/VendorProductCard.tsx',
  ))
  ;({ ApiError } = await vite.ssrLoadModule('/src/lib/api/client.ts'))
})

after(async () => {
  await vite?.close()
  delete globalThis.localStorage
})

test('loads vendor stores, requests, and active store offers with /offers/:id enrichment', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    const { pathname, searchParams } = new URL(url, 'http://test.invalid')
    if (pathname === '/api/vendor/stores') {
      return Response.json({
        stores: [
          {
            public_id: 'store-1',
            name: 'نانوایی ولیعصر',
            category_name: 'نانوایی',
            approval_status: 'approved',
            active_products_count: 2,
          },
        ],
      })
    }
    if (pathname === '/api/vendor/store-requests') {
      return Response.json({
        requests: [
          {
            public_id: 'req-1',
            store_name: 'شعبه ونک',
            status: 'pending_review',
            status_fa: 'در انتظار بررسی',
            created_at: '2026-10-01T09:00:00Z',
          },
        ],
      })
    }
    if (pathname === '/api/stores/store-1/offers') {
      const cursor = searchParams.get('cursor')
      if (!cursor) {
        return Response.json({
          items: [
            {
              id: 'offer-1',
              title: 'بسته صبحانه',
              price: 45000,
              original_price: 120000,
              quantity_available: 4,
              pickup_start: '2026-11-26T14:30:00Z',
              pickup_end: '2026-11-26T15:30:00Z',
              category_name: 'نانوایی',
              store: { id: 'store-1', name: 'نانوایی ولیعصر' },
            },
          ],
          has_more: true,
          next_cursor: 'page-2',
        })
      }
      return Response.json({
        items: [
          {
            id: 'offer-2',
            title: 'بسته عصرانه',
            price: 60000,
            original_price: 150000,
            quantity_available: 2,
            pickup_start: '2026-11-26T16:30:00Z',
            pickup_end: '2026-11-26T17:30:00Z',
            store: { id: 'store-1', name: 'نانوایی ولیعصر' },
          },
        ],
        has_more: false,
        next_cursor: null,
      })
    }
    if (pathname === '/api/offers/offer-1') {
      return Response.json({
        id: 'offer-1',
        description: 'نان سنگک و بربری تازه',
        cancellation_deadline: '2026-11-26T12:30:00Z',
        allergens_declared: true,
        allergens: [{ value: 'gluten', label: 'گلوتن' }],
      })
    }
    if (pathname === '/api/offers/offer-2') {
      return Response.json({}, { status: 404 })
    }
    throw new Error(`unexpected request: ${pathname}`)
  })

  const res = await vendorProductsService.listWithContext()
  assert.equal(res.catalogueSupported, true)
  assert.equal(res.canManageProducts, false)
  assert.equal(res.stores.length, 1)
  assert.equal(res.pendingRequests.length, 1)
  assert.equal(res.products.length, 2)
  assert.equal(res.products[0].name, 'بسته صبحانه')
  assert.equal(res.products[0].description, 'نان سنگک و بربری تازه')
  assert.equal(res.products[0].allergens, 'gluten')
  assert.equal(res.products[0].startTime, '18:00')
  assert.equal(res.products[0].cancellationTime, '16:00')
  assert.equal(res.products[1].name, 'بسته عصرانه')
  assert.equal(res.products[1].category, 'نانوایی')
})

test('degrades cleanly when catalogue /stores/:id/offers returns 404 without database', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    const { pathname } = new URL(url, 'http://test.invalid')
    if (pathname === '/api/vendor/stores') {
      return Response.json({
        stores: [{ public_id: 'store-1', name: 'نانوایی ولیعصر', approval_status: 'approved' }],
      })
    }
    if (pathname === '/api/vendor/store-requests') return Response.json({ requests: [] })
    if (pathname === '/api/stores/store-1/offers') return Response.json({}, { status: 404 })
    throw new Error(`unexpected request: ${pathname}`)
  })

  const res = await vendorProductsService.listWithContext()
  assert.equal(res.catalogueSupported, false)
  assert.deepEqual(res.products, [])
})

test('does not fall back when /vendor/stores returns 401 unauthorized', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({}, { status: 401 }))

  await assert.rejects(
    () => vendorProductsService.listWithContext(),
    (error) => error instanceof ApiError && error.status === 401,
  )
})

test('rejects live product mutations with 501 instead of faking persistence in localStorage', async () => {
  await assert.rejects(
    () => vendorProductsService.unpublish('offer-1'),
    (error) => error instanceof ApiError && error.status === 501,
  )
  await assert.rejects(
    () => vendorProductsService.publish('offer-1'),
    (error) => error instanceof ApiError && error.status === 501,
  )
  await assert.rejects(
    () => vendorProductsService.remove('offer-1'),
    (error) => error instanceof ApiError && error.status === 501,
  )
})

test('supports publish and unpublish transitions in DEV preview mode', async () => {
  globalThis.localStorage.removeItem('tahedig.vendor.products.v1')
  await vendorProductsService.unpublish('1', { preview: true })
  const unpublished = await vendorProductsService.get('1', { preview: true })
  assert.equal(unpublished?.status, 'inactive')

  await vendorProductsService.publish('1', { preview: true })
  const republished = await vendorProductsService.get('1', { preview: true })
  assert.equal(republished?.status, 'active')
})

test('fetches categories from /home/categories and uses accurate DB IDs on 404 fallback', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({}, { status: 404 }))
  const fallback = await storeService.listCategories()
  assert.equal(fallback.find((c) => c.id === 1)?.name, 'نانوایی')
  assert.equal(fallback.find((c) => c.id === 4)?.name, 'رستوران')

  t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ items: [{ id: 1, slug: 'bakery', name: 'نانوایی', kind: 'bakery' }] }),
  )
  const live = await storeService.listCategories()
  assert.deepEqual(live, [{ id: 1, slug: 'bakery', name: 'نانوایی', kind: 'bakery' }])
})

test('sends PATCH /vendor/orders/:id/status for TEAM-48 order transitions', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    const { pathname } = new URL(url, 'http://test.invalid')
    assert.equal(pathname, '/api/vendor/orders/ord-7/status')
    assert.equal(init.method, 'PATCH')
    assert.deepEqual(JSON.parse(init.body), { status: 'ready_for_pickup' })
    return Response.json({ success: true, order_id: 'ord-7', status: 'ready_for_pickup' })
  })

  await updateVendorOrderStatus('ord-7', 'ready_for_pickup')
})

test('renders publish action for draft/inactive products and unpublish for active products', () => {
  const activeHtml = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(VendorProductCard, {
        product: {
          id: '1',
          name: 'بسته فعال',
          store: 'نانوایی ولیعصر',
          category: 'نانوایی',
          price: 40000,
          originalPrice: 100000,
          status: 'active',
          inventory: { total: 5, reserved: 1, available: 4 },
        },
        onEdit: () => {},
        onUnpublish: () => {},
        onPublish: () => {},
      }),
    ),
  )
  assert.match(activeHtml, /لغو انتشار/)
  assert.doesNotMatch(activeHtml, /انتشار محصول/)

  const draftHtml = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(VendorProductCard, {
        product: {
          id: '2',
          name: 'بسته پیش‌نویس',
          store: 'نانوایی ولیعصر',
          category: 'نانوایی',
          price: 40000,
          originalPrice: 100000,
          status: 'draft',
          inventory: { total: 5, reserved: 0, available: 5 },
        },
        onEdit: () => {},
        onUnpublish: () => {},
        onPublish: () => {},
      }),
    ),
  )
  assert.match(draftHtml, /انتشار محصول/)
  assert.doesNotMatch(draftHtml, /لغو انتشار/)
})
