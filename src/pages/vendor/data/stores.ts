export type StoreStatus = 'approved' | 'pending'

export type OpeningDay = {
  day: string
  enabled: boolean
  opensAt: string
  closesAt: string
}

export type VendorStore = {
  id: string
  name: string
  branch: string
  status: StoreStatus
  owner: string
  category: string
  phone: string
  address: string
  description: string
  pickupInstructions: string
  registeredAt: string
  productsCount: number
  images: string[]
  openingHours: OpeningDay[]
  location: { x: number; y: number }
}

export type VendorStoreInput = Omit<
  VendorStore,
  'id' | 'status' | 'registeredAt' | 'productsCount'
>

const STORAGE_KEY = 'tahedig.vendor.stores.v1'
const bakeryImage = '/vendor-bakery.jpg'

const initialStores: VendorStore[] = [
  {
    id: 'valiasr',
    name: 'نان صبحگاهی',
    branch: 'شعبه ولیعصر',
    status: 'approved',
    owner: 'آیدا کریمی',
    category: 'نانوایی',
    phone: '+989125550120',
    address: 'تهران، خیابان ولیعصر، پلاک ۱۲',
    description: 'نانوایی محلی با نان‌های تازه و شیرینی‌های پخت روز.',
    pickupInstructions: 'تحویل از پیشخوان نانوایی، ورودی خیابان ولیعصر.',
    registeredAt: '۲۵ مهر ۱۴۰۵',
    productsCount: 1,
    images: [bakeryImage],
    openingHours: [
      { day: 'شنبه', enabled: true, opensAt: '08:00', closesAt: '18:00' },
      { day: 'یکشنبه', enabled: true, opensAt: '08:00', closesAt: '18:00' },
      { day: 'دوشنبه', enabled: true, opensAt: '08:00', closesAt: '18:00' },
      { day: 'سه‌شنبه', enabled: true, opensAt: '08:00', closesAt: '18:00' },
      { day: 'چهارشنبه', enabled: true, opensAt: '08:00', closesAt: '18:00' },
      { day: 'پنج‌شنبه', enabled: true, opensAt: '08:00', closesAt: '18:00' },
      { day: 'جمعه', enabled: false, opensAt: '08:00', closesAt: '18:00' },
    ],
    location: { x: 52, y: 48 },
  },
  {
    id: 'shariati',
    name: 'نان صبحگاهی',
    branch: 'شعبه شریعتی',
    status: 'pending',
    owner: 'آیدا کریمی',
    category: 'نانوایی',
    phone: '+989125550120',
    address: 'تهران، خیابان شریعتی',
    description: 'شعبه جدید نان صبحگاهی',
    pickupInstructions: 'تحویل از پیشخوان فروشگاه.',
    registeredAt: '۲۷ مهر ۱۴۰۵',
    productsCount: 0,
    images: [bakeryImage],
    openingHours: [],
    location: { x: 48, y: 53 },
  },
]

export function newStoreDraft(): VendorStore {
  return {
    id: 'new',
    name: '',
    branch: '',
    status: 'pending',
    owner: '',
    category: 'نانوایی',
    phone: '',
    address: '',
    description: '',
    pickupInstructions: '',
    registeredAt: 'امروز',
    productsCount: 0,
    images: [],
    openingHours: [
      'شنبه',
      'یکشنبه',
      'دوشنبه',
      'سه‌شنبه',
      'چهارشنبه',
      'پنج‌شنبه',
      'جمعه',
    ].map((day) => ({ day, enabled: day !== 'جمعه', opensAt: '08:00', closesAt: '18:00' })),
    location: { x: 50, y: 50 },
  }
}

function readStores(): VendorStore[] {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === null) return structuredClone(initialStores)

  try {
    const parsed: unknown = JSON.parse(saved)
    if (Array.isArray(parsed)) return parsed as VendorStore[]
  } catch {
    // Keep invalid mock data visible to callers rather than overwriting it.
  }
  throw new Error('خواندن اطلاعات آزمایشی فروشگاه‌ها ممکن نیست.')
}

function writeStores(stores: VendorStore[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stores))
  } catch {
    throw new Error('ذخیره اطلاعات فروشگاه ممکن نیست. فضای ذخیره‌سازی مرورگر را بررسی کنید.')
  }
}

// Replace this browser-only adapter with the agreed store API contract when it is available.
export const storeRepository = {
  async list(): Promise<VendorStore[]> {
    return readStores()
  },

  async get(id: string): Promise<VendorStore | undefined> {
    if (id === 'new') return newStoreDraft()
    return readStores().find((store) => store.id === id)
  },

  async save(id: string, input: VendorStoreInput): Promise<VendorStore> {
    const stores = readStores()
    if (id === 'new') {
      const created: VendorStore = {
        ...newStoreDraft(),
        ...input,
        id: crypto.randomUUID(),
        status: 'pending',
      }
      writeStores([created, ...stores])
      return created
    }

    const existing = stores.find((store) => store.id === id)
    if (!existing) throw new Error('فروشگاه پیدا نشد.')

    const updated = { ...existing, ...input }
    writeStores(stores.map((store) => (store.id === id ? updated : store)))
    return updated
  },
}
