import type { VendorProduct } from '@/components/vendor/VendorProductCard'
import { ApiError, apiRequest } from '@/lib/api/client'
import { toPickupWindowFromTimestamps } from '@/lib/vendorReservations'
import { storeService } from '@/services/storeService'
import type { StoreCategoryOption } from '@/services/storeService'
import type { VendorStore } from '@/types/storeTypes'

export type ProductDetails = {
  description: string
  pickupDate: string // ISO date, local to the store
  startTime: string
  endTime: string
  cancellationTime: string
  allergens: string
  images: string[]
}

export type StoredProduct = VendorProduct & ProductDetails
export type ProductInput = Omit<StoredProduct, 'id' | 'inventory'> & { quantity: number }

export type VendorProductStoreSummary = {
  id: string
  name: string
  status: VendorStore['status']
  statusLabel: string
  category: string
}

export type VendorProductsLoadResult = {
  products: StoredProduct[]
  stores: VendorProductStoreSummary[]
  pendingRequests: VendorProductStoreSummary[]
  catalogueSupported: boolean
  canManageProducts: boolean
}

type CatalogueOfferCardDto = {
  id: string
  title: string
  image_url?: string | null
  price: number
  original_price: number
  quantity_available: number
  pickup_start: string
  pickup_end: string
  category_name?: string
  store?: { id?: string; name?: string }
}

type CatalogueOfferListDto = {
  items: CatalogueOfferCardDto[]
  has_more: boolean
  next_cursor?: string | null
}

type OfferDetailDto = {
  id: string
  title?: string
  description?: string
  image_url?: string | null
  price?: number
  original_price?: number
  quantity_available?: number
  pickup_start?: string
  pickup_end?: string
  cancellation_deadline?: string | null
  category_name?: string
  allergens?: Array<{ value: string; label: string }>
  allergens_declared?: boolean
  store?: { id?: string; name?: string }
}

export const UNSUPPORTED_PRODUCT_MUTATION_MESSAGE =
  'سرویس ثبت، ویرایش، حذف و تغییر وضعیت انتشار محصول هنوز در API بک‌اند پیاده‌سازی نشده است.'

const STORAGE_KEY = 'tahedig.vendor.products.v1'
const PREVIEW_IMAGE = '/vendor-bakery.jpg'

const tehranTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Tehran',
  hourCycle: 'h23',
  hour: '2-digit',
  minute: '2-digit',
})

function isUnavailableStatus(error: unknown): error is ApiError {
  return error instanceof ApiError && [404, 405, 501].includes(error.status)
}

function buildDemoProducts(): StoredProduct[] {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const seeds: Pick<StoredProduct, 'id' | 'name' | 'status' | 'inventory'>[] = [
    {
      id: '1',
      name: 'بستهٔ غافلگیری نانوایی',
      status: 'active',
      inventory: { total: 6, reserved: 3, available: 3 },
    },
    {
      id: '2',
      name: 'گلچین نان خمیرترش با تخمیر آرام و شیرینی صبحانه',
      status: 'draft',
      inventory: { total: 8, reserved: 0, available: 8 },
    },
    {
      id: '3',
      name: 'بستهٔ غافلگیری نانوایی',
      status: 'ended',
      inventory: { total: 0, reserved: 0, available: 0 },
    },
  ]

  return seeds.map((product) => ({
    ...product,
    store: 'نان صبحگاهی',
    category: 'نانوایی',
    price: 40000,
    originalPrice: 115000,
    imageSrc: PREVIEW_IMAGE,
    description:
      'ترکیبی از نان‌ها و شیرینی‌های باقی‌ماندهٔ پخت امروز. محتویات دقیق ممکن است متفاوت باشد.',
    pickupDate: today,
    startTime: '18:00',
    endTime: '19:00',
    cancellationTime: '16:00',
    allergens: 'unknown',
    images: [PREVIEW_IMAGE, PREVIEW_IMAGE],
  }))
}

function readDemoProducts(): StoredProduct[] {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === null) return buildDemoProducts()

  try {
    const parsed: unknown = JSON.parse(saved)
    if (Array.isArray(parsed)) return parsed as StoredProduct[]
  } catch {
    // Keep invalid local data visible as an error rather than silently overwriting it.
  }

  throw new Error('خواندن اطلاعات آزمایشی محصولات ممکن نیست.')
}

function writeDemoProducts(products: StoredProduct[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  } catch {
    throw new Error(
      'ذخیره محصول ممکن نیست. فضای ذخیره‌سازی مرورگر کافی نیست؛ تصویر کوچک‌تری انتخاب کنید.',
    )
  }
}

function makeId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `product-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function persistDemo(input: ProductInput, existing: StoredProduct | undefined): StoredProduct {
  const { quantity, ...fields } = input
  const reserved = existing?.inventory.reserved ?? 0

  if (!Number.isSafeInteger(quantity) || quantity < reserved) {
    throw new Error('تعداد بسته‌ها نمی‌تواند کمتر از تعداد رزرو باشد.')
  }

  return {
    ...fields,
    id: existing?.id ?? makeId(),
    inventory: {
      total: quantity,
      reserved,
      available: Math.max(0, quantity - reserved),
    },
  }
}

function formatCancellationTime(deadline: string | null | undefined, fallback: string): string {
  if (!deadline) return fallback
  const ms = Date.parse(deadline)
  if (!Number.isFinite(ms)) return fallback
  return tehranTime.format(ms)
}

function resolveAllergenValue(detail: OfferDetailDto | null): string {
  if (!detail?.allergens_declared) return 'unknown'
  if (!Array.isArray(detail.allergens) || detail.allergens.length === 0) return 'none'
  return detail.allergens[0]?.value || 'unknown'
}

function mapOfferToProduct(
  card: CatalogueOfferCardDto,
  storeFallback: VendorProductStoreSummary,
  detail: OfferDetailDto | null,
): StoredProduct {
  const pickupStart = detail?.pickup_start ?? card.pickup_start
  const pickupEnd = detail?.pickup_end ?? card.pickup_end
  const window = toPickupWindowFromTimestamps(pickupStart, pickupEnd, pickupStart)
  const available = Math.max(0, detail?.quantity_available ?? card.quantity_available)
  const image = detail?.image_url ?? card.image_url ?? undefined

  return {
    id: card.id,
    name: detail?.title ?? card.title,
    store: detail?.store?.name ?? card.store?.name ?? storeFallback.name,
    category: detail?.category_name ?? card.category_name ?? (storeFallback.category || 'نامشخص'),
    price: detail?.price ?? card.price,
    originalPrice: detail?.original_price ?? card.original_price,
    imageSrc: image,
    status: available > 0 ? 'active' : 'ended',
    inventory: {
      total: available,
      reserved: 0,
      available,
    },
    description: detail?.description ?? '',
    pickupDate: window.pickupDate,
    startTime: window.startTime,
    endTime: window.endTime,
    cancellationTime: formatCancellationTime(detail?.cancellation_deadline, window.startTime),
    allergens: resolveAllergenValue(detail),
    images: image ? [image] : [],
  }
}

async function fetchOfferDetail(
  offerId: string,
  signal?: AbortSignal,
): Promise<OfferDetailDto | null> {
  try {
    return await apiRequest<OfferDetailDto>(`/offers/${encodeURIComponent(offerId)}`, { signal })
  } catch (error) {
    if (isUnavailableStatus(error)) return null
    throw error
  }
}

async function listStoreOffers(
  store: VendorProductStoreSummary,
  signal?: AbortSignal,
): Promise<{ offers: StoredProduct[]; supported: boolean }> {
  const cards = new Map<string, CatalogueOfferCardDto>()
  const seenCursors = new Set<string>()
  let cursor: string | null = null

  try {
    while (true) {
      const params = new URLSearchParams({ limit: '50' })
      if (cursor) params.set('cursor', cursor)
      const page = await apiRequest<CatalogueOfferListDto>(
        `/stores/${encodeURIComponent(store.id)}/offers?${params}`,
        { signal },
      )
      if (!Array.isArray(page?.items)) {
        throw new Error('ساختار پاسخ محصولات فروشگاه از سرور معتبر نیست.')
      }
      for (const item of page.items) {
        if (!item?.id) continue
        cards.set(item.id, item)
      }
      if (!page.has_more) break
      if (!page.next_cursor || seenCursors.has(page.next_cursor)) {
        throw new Error('صفحه‌بندی محصولات فروشگاه از سرور معتبر نیست.')
      }
      seenCursors.add(page.next_cursor)
      cursor = page.next_cursor
    }
  } catch (error) {
    if (isUnavailableStatus(error)) {
      return { offers: [], supported: false }
    }
    throw error
  }

  const cardList = [...cards.values()]
  const details = await Promise.all(cardList.map((card) => fetchOfferDetail(card.id, signal)))

  return {
    offers: cardList.map((card, index) => mapOfferToProduct(card, store, details[index] ?? null)),
    supported: true,
  }
}

function toSummary(store: VendorStore): VendorProductStoreSummary {
  return {
    id: store.id,
    name: store.name,
    status: store.status,
    statusLabel: store.statusLabel,
    category: store.category,
  }
}

async function loadLiveContext(signal?: AbortSignal): Promise<{
  stores: VendorProductStoreSummary[]
  pendingRequests: VendorProductStoreSummary[]
}> {
  const all = await storeService.list(signal)
  const stores = all.filter((item) => item.source === 'store').map(toSummary)
  const pendingRequests = all.filter((item) => item.source === 'request').map(toSummary)
  return { stores, pendingRequests }
}

function previewAllowed(preview?: boolean): boolean {
  return Boolean(preview && import.meta.env.DEV)
}

function assertMutablePreview(preview?: boolean): void {
  if (!previewAllowed(preview)) {
    throw new ApiError(UNSUPPORTED_PRODUCT_MUTATION_MESSAGE, 501)
  }
}

export const vendorProductsService = {
  async listCategories(signal?: AbortSignal): Promise<StoreCategoryOption[]> {
    return storeService.listCategories(signal)
  },

  async loadContext(options: { preview?: boolean; signal?: AbortSignal } = {}): Promise<{
    stores: VendorProductStoreSummary[]
    pendingRequests: VendorProductStoreSummary[]
  }> {
    if (previewAllowed(options.preview)) {
      return {
        stores: [
          {
            id: 'preview-store-1',
            name: 'نان صبحگاهی',
            status: 'approved',
            statusLabel: 'تأییدشده',
            category: 'نانوایی',
          },
        ],
        pendingRequests: [
          {
            id: 'preview-req-1',
            name: 'شعبه شریعتی',
            status: 'pending',
            statusLabel: 'در انتظار بررسی',
            category: 'نانوایی',
          },
        ],
      }
    }
    return loadLiveContext(options.signal)
  },

  async listWithContext(
    options: { preview?: boolean; signal?: AbortSignal } = {},
  ): Promise<VendorProductsLoadResult> {
    if (previewAllowed(options.preview)) {
      const ctx = await this.loadContext(options)
      return {
        products: readDemoProducts(),
        stores: ctx.stores,
        pendingRequests: ctx.pendingRequests,
        catalogueSupported: true,
        canManageProducts: true,
      }
    }

    const { stores, pendingRequests } = await loadLiveContext(options.signal)
    const approvedStores = stores.filter((store) => store.status === 'approved')
    if (approvedStores.length === 0) {
      return {
        products: [],
        stores,
        pendingRequests,
        catalogueSupported: true,
        canManageProducts: false,
      }
    }

    const results = await Promise.all(
      approvedStores.map((store) => listStoreOffers(store, options.signal)),
    )
    const catalogueSupported = results.some((result) => result.supported)
    const products = results.flatMap((result) => result.offers)

    return {
      products,
      stores,
      pendingRequests,
      catalogueSupported,
      canManageProducts: false,
    }
  },

  async list(options: { preview?: boolean; signal?: AbortSignal } = {}): Promise<StoredProduct[]> {
    const result = await this.listWithContext(options)
    return result.products
  },

  async get(
    id: string,
    options: { preview?: boolean; signal?: AbortSignal } = {},
  ): Promise<StoredProduct | undefined> {
    if (previewAllowed(options.preview)) {
      return readDemoProducts().find((product) => product.id === id)
    }

    const { products } = await this.listWithContext(options)
    return products.find((product) => product.id === id)
  },

  async create(input: ProductInput, options: { preview?: boolean } = {}): Promise<StoredProduct> {
    assertMutablePreview(options.preview)
    const products = readDemoProducts()
    const created = persistDemo(input, undefined)
    writeDemoProducts([created, ...products])
    return created
  },

  async update(
    id: string,
    input: ProductInput,
    options: { preview?: boolean } = {},
  ): Promise<StoredProduct> {
    assertMutablePreview(options.preview)
    const products = readDemoProducts()
    const existing = products.find((product) => product.id === id)
    if (!existing) throw new Error('محصول پیدا نشد.')

    const updated = persistDemo(input, existing)
    writeDemoProducts(products.map((product) => (product.id === id ? updated : product)))
    return updated
  },

  async remove(id: string, options: { preview?: boolean } = {}): Promise<void> {
    assertMutablePreview(options.preview)
    const products = readDemoProducts()
    const product = products.find((item) => item.id === id)
    if (!product) throw new Error('محصول پیدا نشد.')
    if (product.inventory.reserved > 0) {
      throw new Error('محصول دارای رزرو است و قابل حذف نیست. ابتدا رزروها را تعیین تکلیف کنید.')
    }

    writeDemoProducts(products.filter((item) => item.id !== id))
  },

  async publish(id: string, options: { preview?: boolean } = {}): Promise<void> {
    assertMutablePreview(options.preview)
    const products = readDemoProducts()
    const product = products.find((item) => item.id === id)
    if (!product) throw new Error('محصول پیدا نشد.')
    if (product.status === 'active') throw new Error('این محصول هم‌اکنون منتشرشده است.')
    if (product.status === 'ended') {
      throw new Error('محصول پایان‌یافته را ابتدا ویرایش و موجودی آن را تنظیم کنید.')
    }

    writeDemoProducts(
      products.map((item) => (item.id === id ? { ...item, status: 'active' } : item)),
    )
  },

  async unpublish(id: string, options: { preview?: boolean } = {}): Promise<void> {
    assertMutablePreview(options.preview)
    const products = readDemoProducts()
    const product = products.find((item) => item.id === id)
    if (!product) throw new Error('محصول پیدا نشد.')
    if (product.status !== 'active') throw new Error('این محصول منتشرشده نیست.')

    // Existing reservations remain intact; the product is only hidden from new customers.
    writeDemoProducts(
      products.map((item) => (item.id === id ? { ...item, status: 'inactive' } : item)),
    )
  },
}
