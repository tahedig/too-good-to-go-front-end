export type StoreAvailability = 'available' | 'empty' | 'closed'

export interface StoreProduct {
  id: string
  name: string
  category: string
  distanceKm: number
  description: string
  price: number
  referenceValue: number
  pickup: string
  imageSrc: string
  remaining: number
}

export interface PublicStore {
  id: string
  name: string
  category: string
  neighborhood: string
  description: string
  availability: StoreAvailability
  heroImageSrc: string
  address: string
  openingHours: Array<{ days: string; hours: string }>
  pickupGuide: string
  pickupSummary?: string
  products: StoreProduct[]
}

const morningBreadProduct: StoreProduct = {
  id: 'morning-bread-bag',
  name: 'نان صبحگاهی',
  category: 'نانوایی',
  distanceKm: 0.6,
  description: 'ترکیبی از نان‌ها و شیرینی‌های تازهٔ پخت امروز.',
  price: 40000,
  referenceValue: 115000,
  pickup: 'امروز، ۱۸:۰۰–۱۹:۰۰',
  imageSrc: '/vendor-bakery.jpg',
  remaining: 3,
}

const morningBreadBase: Omit<PublicStore, 'id' | 'availability' | 'products'> = {
  name: 'نان صبحگاهی',
  category: 'نانوایی',
  neighborhood: 'ولیعصر',
  description: 'نانوایی محلی با نان‌های تازه و شیرینی‌های پخت روز.',
  heroImageSrc: '/vendor-bakery.jpg',
  address: 'تهران، خیابان ولیعصر، پلاک ۱۲',
  openingHours: [
    { days: 'شنبه', hours: '۰۸:۰۰–۱۹:۰۰' },
    { days: 'یکشنبه تا چهارشنبه', hours: '۰۸:۰۰–۱۹:۰۰' },
    { days: 'پنجشنبه و جمعه', hours: 'تعطیل' },
  ],
  pickupGuide: 'تحویل از پیشخوان نانوایی، ورودی خیابان ولیعصر.',
  pickupSummary: '۳ موجود · تحویل امروز ۱۸:۰۰–۱۹:۰۰',
}

export const publicStores: Record<string, PublicStore> = {
  'morning-bakery': {
    ...morningBreadBase,
    id: 'morning-bakery',
    availability: 'available',
    products: [morningBreadProduct],
  },
  'morning-bakery-empty': {
    ...morningBreadBase,
    id: 'morning-bakery-empty',
    availability: 'empty',
    products: [],
  },
  'morning-bakery-closed': {
    ...morningBreadBase,
    id: 'morning-bakery-closed',
    availability: 'closed',
    products: [],
  },
}
