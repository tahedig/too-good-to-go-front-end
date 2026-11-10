import type { VendorProduct } from '../components/VendorProductCard'

export type ProductDetails = {
  description: string
  pickupDate: string // ISO date, local to the store
  startTime: string
  endTime: string
  cancellationTime: string
  allergens: string
  images: string[] // mock: data URLs or local assets; API uploads require a separate contract
}
export type StoredProduct = VendorProduct & ProductDetails
export type ProductInput = Omit<StoredProduct, 'id' | 'inventory'> & { quantity: number }

const KEY = 'tahedig.vendor.products.v1'
const image = '/vendor-bakery.jpg'
const now = new Date()
const mockPickupDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const initial: StoredProduct[] = [
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
].map((product) => ({
  ...product,
  status: product.status as StoredProduct['status'],
  store: 'نان صبحگاهی',
  category: 'نانوایی',
  price: 40000,
  originalPrice: 115000,
  imageSrc: image,
  description:
    'ترکیبی از نان‌ها و شیرینی‌های باقی‌ماندهٔ پخت امروز. محتویات دقیق ممکن است متفاوت باشد.',
  pickupDate: mockPickupDate,
  startTime: '18:00',
  endTime: '19:00',
  cancellationTime: '16:00',
  allergens: 'unknown',
  images: [image, image],
}))

/** Temporary browser-backed repository. Do not confuse this with a server-side save. */
function read(): StoredProduct[] {
  const saved = localStorage.getItem(KEY)
  if (saved === null) return structuredClone(initial)
  try {
    const parsed: unknown = JSON.parse(saved)
    if (Array.isArray(parsed)) return parsed as StoredProduct[]
  } catch {
    /* Invalid local data is reported rather than silently overwritten. */
  }
  throw new Error('خواندن اطلاعات آزمایشی ممکن نیست.')
}

// The backend contract/endpoints and image-upload protocol have not been supplied.
// Once agreed, replace this mock adapter with typed axios calls (e.g. apiClient.get/post/put),
// mapping API DTOs to StoredProduct and uploading images before saving the product.
// Do not uncomment guessed URLs or send base64 images without confirming the API contract.
export const productRepository = {
  async list(): Promise<StoredProduct[]> {
    return read()
  },
  async get(id: string): Promise<StoredProduct | undefined> {
    return read().find((item) => item.id === id)
  },
  async remove(id: string): Promise<void> {
    const items = read()
    const product = items.find((item) => item.id === id)
    if (!product) throw new Error('محصول پیدا نشد.')
    // In the mock, preserve products that have reservations until those reservations are resolved.
    if (product.inventory.reserved > 0)
      throw new Error('محصول دارای رزرو است و قابل حذف نیست. ابتدا رزروها را تعیین تکلیف کنید.')
    localStorage.setItem(KEY, JSON.stringify(items.filter((item) => item.id !== id)))
  },
  async unpublish(id: string): Promise<void> {
    const items = read()
    const product = items.find((item) => item.id === id)
    if (!product) throw new Error('محصول پیدا نشد.')
    if (product.status !== 'active') throw new Error('این محصول منتشرشده نیست.')
    // Existing reservations remain intact; no new reservations are represented by the mock.
    localStorage.setItem(
      KEY,
      JSON.stringify(
        items.map((item) => (item.id === id ? { ...item, status: 'inactive' } : item)),
      ),
    )
  },
  async save(input: ProductInput, id?: string): Promise<StoredProduct> {
    const items = read()
    const existing = id ? items.find((item) => item.id === id) : undefined
    if (id && !existing) throw new Error('محصول پیدا نشد.')
    const { quantity, ...fields } = input
    const reserved = existing?.inventory.reserved ?? 0
    if (quantity < reserved) throw new Error('تعداد بسته‌ها نمی‌تواند کمتر از تعداد رزرو باشد.')
    const saved: StoredProduct = {
      ...fields,
      id: id ?? crypto.randomUUID(),
      inventory: { total: quantity, reserved, available: quantity - reserved },
    }
    const next = id ? items.map((item) => (item.id === id ? saved : item)) : [saved, ...items]
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      throw new Error('فضای ذخیره‌سازی مرورگر کافی نیست. تصاویر کوچک‌تری انتخاب کنید.')
    }
    return saved
  },
}
