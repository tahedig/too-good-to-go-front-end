import { ApiError, apiRequest } from '@/lib/api/client'
import { isActiveReservation } from '@/lib/vendorReservations'
import type { Reservation } from '@/lib/vendorReservations'
import { storeService } from '@/services/storeService'
import type { VendorStore } from '@/types/storeTypes'
import { listVendorReservations } from './reservationsService'

type DashboardStore = Pick<VendorStore, 'id' | 'name' | 'branch' | 'address'> & {
  productsCount: number | null
}
type PendingStore = Pick<DashboardStore, 'id' | 'name' | 'branch'>
type ActiveStoreDto = { id: string; name: string; address: string; is_active: boolean }

type AvailableOffer = { id: string; quantity_available: number }
type OfferPageDto = {
  items: AvailableOffer[]
  next_cursor: string | null
  has_more: boolean
}

type DashboardResult<T> = { ok: true; value: T } | { ok: false; status: number | null }

export type DashboardFinance = {
  received: number
  net: number
  pending: number
  available: number
  plan: { name: string; commission: number; renewal: string }
}

export type DashboardData = {
  stores: DashboardResult<DashboardStore[]>
  pendingStore: DashboardResult<PendingStore | null>
  inventory: DashboardResult<{ available: number; offers: AvailableOffer[] }>
  reservations: DashboardResult<{
    nearest: Reservation | null
    reserved: number
    reservedForNearestOffer: number | null
    publishedForNearestOffer: number | null
  }>
  finance: DashboardFinance | null
}

async function settle<T>(load: () => Promise<T>): Promise<DashboardResult<T>> {
  try {
    return { ok: true, value: await load() }
  } catch (error) {
    return { ok: false, status: error instanceof ApiError ? error.status : null }
  }
}

async function listDashboardStores(signal?: AbortSignal): Promise<DashboardStore[]> {
  try {
    const stores = await storeService.listStores(signal)
    return stores
      .filter((store) => store.status === 'approved')
      .map(({ id, name, branch, address, productsCount }) => ({
        id,
        name,
        branch,
        address,
        productsCount,
      }))
  } catch (error) {
    // Some TEAM-48 deployments mount the active-store endpoint but not the full store service.
    // Do not fall back on an auth failure.
    if (!(error instanceof ApiError) || error.status !== 404) throw error
  }

  const store = await apiRequest<ActiveStoreDto>('/vendor/store', { signal })
  if (!store?.id || typeof store.is_active !== 'boolean') {
    throw new Error('پاسخ فروشگاه فعال معتبر نیست.')
  }
  if (!store.is_active) return []
  return [{ id: store.id, name: store.name, address: store.address, branch: '', productsCount: null }]
}

/** The public catalogue only exposes packages that are currently available to reserve. */
async function listAvailableOffers(
  storeId: string,
  signal?: AbortSignal,
): Promise<AvailableOffer[]> {
  const offers = new Map<string, AvailableOffer>()
  const cursors = new Set<string>()
  let cursor: string | null = null

  while (true) {
    const params = new URLSearchParams({ limit: '50' })
    if (cursor) params.set('cursor', cursor)
    const page = await apiRequest<OfferPageDto>(
      `/stores/${encodeURIComponent(storeId)}/offers?${params}`,
      { signal },
    )
    if (!Array.isArray(page?.items)) throw new Error('پاسخ موجودی بسته‌ها معتبر نیست.')
    for (const offer of page.items) {
      if (
        !offer.id ||
        !Number.isSafeInteger(offer.quantity_available) ||
        offer.quantity_available < 0
      ) {
        throw new Error('موجودی یکی از بسته‌ها در پاسخ سرور معتبر نیست.')
      }
      offers.set(offer.id, offer)
    }
    if (!page.has_more) break
    if (!page.next_cursor || cursors.has(page.next_cursor)) {
      throw new Error('صفحه‌بندی بسته‌ها از سرور معتبر نیست.')
    }
    cursors.add(page.next_cursor)
    cursor = page.next_cursor
  }

  return [...offers.values()]
}

function summarizeReservations(orders: Reservation[], now = Date.now()) {
  const active = orders.filter(isActiveReservation)
  const nearest =
    active
      .filter((order) => order.pickupEndsAt > now)
      .sort(
        (a, b) =>
          a.pickupStartsAt - b.pickupStartsAt ||
          a.pickupEndsAt - b.pickupEndsAt ||
          a.id.localeCompare(b.id),
      )[0] ?? null

  return {
    nearest,
    reserved: active.reduce((count, order) => count + order.quantity, 0),
    reservedForNearestOffer: nearest?.offerId
      ? active
          .filter((order) => order.offerId === nearest.offerId)
          .reduce((count, order) => count + order.quantity, 0)
      : null,
    // Available + reserved is not the published total: already-delivered packages are not included.
    publishedForNearestOffer: null,
  }
}

export async function loadVendorDashboard(signal?: AbortSignal): Promise<DashboardData> {
  const loadStores = settle(() => listDashboardStores(signal))
  const loadPending = settle(
    async () =>
      (await storeService.listRequests(signal))
        .filter((store) => store.status === 'pending')
        .sort((a, b) => Date.parse(b.registeredAt) - Date.parse(a.registeredAt))[0] ?? null,
  )
  const loadReservations = settle(async () =>
    summarizeReservations(await listVendorReservations(signal)),
  )
  const loadInventory = loadStores.then((stores) => {
    if (stores.ok === false) return stores
    return settle(async () => {
      const offers = (
        await Promise.all(stores.value.map((store) => listAvailableOffers(store.id, signal)))
      ).flat()
      return {
        offers,
        available: offers.reduce((count, offer) => count + offer.quantity_available, 0),
      }
    })
  })

  const [stores, pendingStore, inventory, reservations] = await Promise.all([
    loadStores,
    loadPending,
    loadInventory,
    loadReservations,
  ])

  // The Go API exposes order prices, not vendor payouts, net revenue, fee rates, or plans.
  // Do not derive any of these fields from reservations or the daily gross order total.
  return { stores, pendingStore, inventory, reservations, finance: null }
}
