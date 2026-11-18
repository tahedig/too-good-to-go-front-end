import type { VendorProduct } from '@/components/vendor/VendorProductCard'

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

const STORAGE_KEY = 'tahedig.vendor.products.v1'
const image = '/vendor-bakery.jpg'
const now = new Date()
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

const demoProductSeeds: Pick<StoredProduct, 'id' | 'name' | 'status' | 'inventory'>[] = [
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

const demoProducts: StoredProduct[] = demoProductSeeds.map((product) => ({
  ...product,
  store: 'نان صبحگاهی',
  category: 'نانوایی',
  price: 40000,
  originalPrice: 115000,
  imageSrc: image,
  description:
    'ترکیبی از نان‌ها و شیرینی‌های باقی‌ماندهٔ پخت امروز. محتویات دقیق ممکن است متفاوت باشد.',
  pickupDate: today,
  startTime: '18:00',
  endTime: '19:00',
  cancellationTime: '16:00',
  allergens: 'unknown',
  images: [image, image],
}))

/**
 * Demo-only storage adapter. The supplied Go API list has no vendor product CRUD or image-upload
 * endpoints, so the product pages cannot be safely connected yet. Do not guess routes or DTOs.
 */
function readProducts(): StoredProduct[] {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === null) return structuredClone(demoProducts)

  try {
    const parsed: unknown = JSON.parse(saved)
    if (Array.isArray(parsed)) return parsed as StoredProduct[]
  } catch {
    // Keep invalid local data visible as an error rather than silently overwriting it.
  }

  throw new Error('خواندن اطلاعات آزمایشی محصولات ممکن نیست.')
}

function writeProducts(products: StoredProduct[]) {
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

function persist(input: ProductInput, existing: StoredProduct | undefined): StoredProduct {
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

export const vendorProductsService = {
  async list(): Promise<StoredProduct[]> {
    return readProducts()
  },

  async get(id: string): Promise<StoredProduct | undefined> {
    return readProducts().find((product) => product.id === id)
  },

  async create(input: ProductInput): Promise<StoredProduct> {
    const products = readProducts()
    const created = persist(input, undefined)
    writeProducts([created, ...products])
    return created
  },

  async update(id: string, input: ProductInput): Promise<StoredProduct> {
    const products = readProducts()
    const existing = products.find((product) => product.id === id)
    if (!existing) throw new Error('محصول پیدا نشد.')

    const updated = persist(input, existing)
    writeProducts(products.map((product) => (product.id === id ? updated : product)))
    return updated
  },

  async remove(id: string): Promise<void> {
    const products = readProducts()
    const product = products.find((item) => item.id === id)
    if (!product) throw new Error('محصول پیدا نشد.')
    if (product.inventory.reserved > 0) {
      throw new Error('محصول دارای رزرو است و قابل حذف نیست. ابتدا رزروها را تعیین تکلیف کنید.')
    }

    writeProducts(products.filter((item) => item.id !== id))
  },

  async unpublish(id: string): Promise<void> {
    const products = readProducts()
    const product = products.find((item) => item.id === id)
    if (!product) throw new Error('محصول پیدا نشد.')
    if (product.status !== 'active') throw new Error('این محصول منتشرشده نیست.')

    // Existing reservations remain intact; the product is only hidden from new customers.
    writeProducts(products.map((item) => (item.id === id ? { ...item, status: 'inactive' } : item)))
  },
}
