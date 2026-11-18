import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let vite
let previewTransactions
let readTransactionFilters
let filterTransactions
let formatJalaliDateRange

before(async () => {
  vite = await createServer({ server: { middlewareMode: true, watch: null, hmr: false } })
  ;({ previewTransactions } = await vite.ssrLoadModule(
    '/src/features/vendor-finance/previewTransactions.ts',
  ))
  ;({ readTransactionFilters, filterTransactions } = await vite.ssrLoadModule(
    '/src/features/vendor-finance/transactions.ts',
  ))
  ;({ formatJalaliDateRange } = await vite.ssrLoadModule('/src/lib/vendorDates.ts'))
})

after(() => vite?.close())

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
