import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let vite
let storeService

before(async () => {
  process.env.VITE_API_BASE_URL = '/api'
  process.env.VITE_USE_MOCK_API = 'false'
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key) => (key === 'access_token' ? 'vendor-token' : null) },
  })
  vite = await createServer({ server: { middlewareMode: true, watch: null, hmr: false } })
  ;({ storeService } = await vite.ssrLoadModule('/src/services/storeService.ts'))
})

after(async () => {
  await vite?.close()
  delete globalThis.localStorage
  delete process.env.VITE_USE_MOCK_API
})

function mockApi(t, respond) {
  return t.mock.method(globalThis, 'fetch', async (url, init) => {
    const request = new URL(url, 'http://test.invalid')
    assert.equal(new Headers(init.headers).get('Authorization'), 'Bearer vendor-token')
    return respond(request, init)
  })
}

test('loads and maps stores and requests from the vendor endpoints', async (t) => {
  mockApi(t, ({ pathname }) => {
    if (pathname === '/api/vendor/stores') {
      return Response.json({
        stores: [
          {
            public_id: 'store-1',
            name: 'نان صبحگاهی',
            category_id: 1,
            category_name: 'نانوایی',
            owner_name: 'آیدا کریمی',
            phone: '09120000000',
            biography: 'نان تازه',
            pickup_address: 'تهران، ولیعصر',
            pickup_instructions: 'تحویل از پیشخوان',
            location: { latitude: 35.7, longitude: 51.4 },
            working_hours: [],
            images: [],
            active_products_count: 2,
            approval_status: 'approved',
            availability_status: 'available',
            created_at: '2026-11-01T00:00:00Z',
            updated_at: '2026-11-01T00:00:00Z',
          },
        ],
      })
    }
    if (pathname === '/api/vendor/store-requests') {
      return Response.json({
        requests: [
          {
            public_id: 'request-1',
            store_name: 'شعبه جدید',
            category_id: 3,
            category_name: 'کافه',
            owner_name: 'علی رضایی',
            address: 'تهران، انقلاب',
            status: 'pending_review',
            status_fa: 'در انتظار بررسی',
            date: '2026-11-02',
            notice: '',
            created_at: '2026-11-02T00:00:00Z',
          },
        ],
      })
    }
    throw new Error(`unexpected request: ${pathname}`)
  })

  const stores = await storeService.list()
  assert.deepEqual(
    stores.map(({ id, source, category }) => ({ id, source, category })),
    [
      { id: 'request-1', source: 'request', category: 'کافه' },
      { id: 'store-1', source: 'store', category: 'نانوایی' },
    ],
  )
})

test('submits only the create-request fields supported by the backend', async (t) => {
  const fetch = mockApi(t, ({ pathname }, init) => {
    assert.equal(pathname, '/api/vendor/store-requests')
    assert.equal(init.method, 'POST')
    assert.deepEqual(JSON.parse(init.body), {
      store_name: 'شعبه شریعتی',
      category_id: 1,
      owner_name: 'آیدا کریمی',
      address: 'تهران، شریعتی',
    })
    return Response.json(
      {
        public_id: 'request-2',
        store_name: 'شعبه شریعتی',
        category_id: 1,
        owner_name: 'آیدا کریمی',
        address: 'تهران، شریعتی',
        status: 'pending_review',
        status_fa: 'در انتظار بررسی',
        date: '2026-11-28',
        notice: '',
        created_at: '2026-11-28T00:00:00Z',
      },
      { status: 201 },
    )
  })

  await storeService.createRequest({
    name: 'شعبه شریعتی',
    categoryId: 1,
    owner: 'آیدا کریمی',
    address: 'تهران، شریعتی',
  })
  assert.equal(fetch.mock.callCount(), 1)
})

test('uses the backend category endpoint instead of the old mismatched labels', async (t) => {
  mockApi(t, ({ pathname }) => {
    assert.equal(pathname, '/api/home/categories')
    return Response.json({ items: [{ id: 1, slug: 'bakery', name: 'نانوایی', kind: 'bakery' }] })
  })

  assert.deepEqual(await storeService.listCategories(), [
    { id: 1, slug: 'bakery', name: 'نانوایی', kind: 'bakery' },
  ])
})
