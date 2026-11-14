function createIllustration(background: string, food: string, garnish: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480">` +
    `<rect width="640" height="480" fill="${background}"/>` +
    `<circle cx="320" cy="248" r="170" fill="#ffffff" opacity=".92"/>` +
    `<circle cx="320" cy="248" r="140" fill="#f3e7d3"/>` +
    `<ellipse cx="320" cy="252" rx="112" ry="88" fill="${food}"/>` +
    `<path d="M225 249c45-67 130-81 190-10-22 60-134 100-190 10Z" fill="${garnish}" opacity=".9"/>` +
    `<circle cx="276" cy="226" r="17" fill="#fff4d8"/><circle cx="348" cy="278" r="15" fill="#fff4d8"/>` +
    `<circle cx="370" cy="213" r="12" fill="#f6c85f"/><path d="M175 387h290" stroke="#ffffff" stroke-width="14" stroke-linecap="round" opacity=".45"/>` +
    `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export interface DiscoveryOffer {
  id: string
  storeId?: string
  merchantName: string
  category: string
  distanceKm: number
  description: string
  price: number
  referenceValue: number
  pickup: string
  imageSrc: string
  allergens: string[]
}

export const discoveryOffers: DiscoveryOffer[] = [
  {
    id: 'morning-bakery',
    storeId: 'morning-bakery',
    merchantName: 'نان صبحگاهی',
    category: 'نانوایی',
    distanceKm: 0.6,
    description: 'ترکیبی از نان‌ها و شیرینی‌های تازه‌ی پخت امروز؛ محتویات ممکن است متفاوت باشد.',
    price: 40000,
    referenceValue: 115000,
    pickup: 'امروز، ۱۸:۰۰–۱۹:۰۰',
    imageSrc: createIllustration('#d9b17c', '#b86d3e', '#76906b'),
    allergens: ['gluten', 'dairy', 'sesame'],
  },
  {
    id: 'green-kitchen',
    merchantName: 'آشپزخانهٔ سبز کوچک',
    category: 'غذای آماده',
    distanceKm: 1.2,
    description: 'یک وعده‌ی خانگی خوشمزه با مواد اولیه‌ی تازه و فصلی.',
    price: 65000,
    referenceValue: 140000,
    pickup: 'امروز، ۱۹:۰۰–۲۰:۰۰',
    imageSrc: createIllustration('#b7c7a6', '#d0804d', '#567e54'),
    allergens: ['dairy', 'nuts'],
  },
  {
    id: 'corner-cafe',
    merchantName: 'کافه گوشه',
    category: 'کافه',
    distanceKm: 0.9,
    description: 'نوشیدنی و خوراکی‌های محبوب کافه برای یک عصر دل‌چسب.',
    price: 55000,
    referenceValue: 100000,
    pickup: 'امروز، ۱۷:۳۰–۱۸:۳۰',
    imageSrc: createIllustration('#c6ad91', '#815c46', '#bd8352'),
    allergens: ['dairy', 'nuts'],
  },
  {
    id: 'seasonal-market',
    merchantName: 'خواربار بهار',
    category: 'خواربار',
    distanceKm: 1.6,
    description: 'میوه‌ها و خوراکی‌های سالم و تازه‌ی باقی‌مانده از امروز.',
    price: 75000,
    referenceValue: 150000,
    pickup: 'امروز، ۲۰:۰۰–۲۱:۰۰',
    imageSrc: createIllustration('#c3d0aa', '#d89a50', '#6f8e5c'),
    allergens: [],
  },
  {
    id: 'oven-stories',
    merchantName: 'قصه‌های تنور',
    category: 'نانوایی',
    distanceKm: 1.1,
    description: 'نان‌های روز و شیرینی‌های خوش‌عطر با تخفیف ویژه.',
    price: 48000,
    referenceValue: 120000,
    pickup: 'امروز، ۱۸:۳۰–۱۹:۳۰',
    imageSrc: createIllustration('#d6b79c', '#aa6545', '#819269'),
    allergens: ['gluten', 'dairy'],
  },
  {
    id: 'homemade-table',
    merchantName: 'سفرهٔ خونه',
    category: 'غذای آماده',
    distanceKm: 2.1,
    description: 'غذای خانگی روز با قیمت مناسب؛ برای نجات از دورریز.',
    price: 70000,
    referenceValue: 160000,
    pickup: 'امروز، ۲۰:۰۰–۲۱:۰۰',
    imageSrc: createIllustration('#c9c4a4', '#b9754a', '#7b8a53'),
    allergens: ['gluten', 'dairy'],
  },
]

export const discoverySections = [
  {
    id: 'today',
    title: 'فرصت‌های خوشمزه امروز',
    offers: discoveryOffers.slice(0, 3),
  },
  {
    id: 'favorites',
    title: 'محبوب‌های اطراف شما',
    offers: [discoveryOffers[1], discoveryOffers[0], discoveryOffers[3]],
  },
  {
    id: 'last-chance',
    title: 'آخرین فرصت‌های نجات غذا',
    offers: [discoveryOffers[4], discoveryOffers[5], discoveryOffers[2]],
  },
]
