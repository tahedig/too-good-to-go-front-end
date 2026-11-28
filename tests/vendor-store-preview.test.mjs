import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let vite
let storeService

before(async () => {
  process.env.VITE_API_BASE_URL = '/api'
  process.env.VITE_USE_MOCK_API = 'true'
  vite = await createServer({ server: { middlewareMode: true, watch: null, hmr: false } })
  ;({ storeService } = await vite.ssrLoadModule('/src/services/storeService.ts'))
})

after(async () => {
  await vite?.close()
  delete process.env.VITE_USE_MOCK_API
})

test('preview mode supports list, details, edit, and create without HTTP calls', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('preview mode must not call the backend')
  })

  const initial = await storeService.list()
  const approved = initial.find((store) => store.source === 'store')
  assert.ok(approved)
  assert.ok(initial.some((store) => store.source === 'request'))

  const details = await storeService.get(approved.id)
  assert.equal(details.source, 'store')
  details.store.name = 'نام ویرایش‌شده'
  await storeService.update(approved.id, details.store, details.store.images)
  assert.equal((await storeService.get(approved.id)).store.name, 'نام ویرایش‌شده')

  const request = await storeService.createRequest({
    name: 'شعبه آزمایشی',
    owner: 'فروشنده آزمایشی',
    categoryId: 1,
    address: 'تهران',
  })
  assert.equal((await storeService.get(request.public_id)).store.name, 'شعبه آزمایشی')
  assert.equal(fetch.mock.callCount(), 0)
})
