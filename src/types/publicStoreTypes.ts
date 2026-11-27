import type { DiscoveryLocation, DiscoveryOffer } from './discoveryTypes'

export type PublicStoreResponseDto = {
  id: string
  name: string
  category_name: string
  city?: string
  district?: string
  header_subtitle: string
  is_open: boolean
  status_badge: string
  biography: string
  pickup_address: string
  pickup_instructions: string
  pickup_summary?: string
  location: DiscoveryLocation
  cover_image_url?: string
  working_hours_schedule: Array<{
    days: string
    hours: string
    is_closed: boolean
  }>
  offers: PublicOfferDto[]
}

export type PublicOfferDto = {
  id: string
  title: string
  category_name: string
  distance_text?: string
  image_url?: string
  original_price: number
  price: number
  currency: string
  quantity_available: number
  availability_badge: string
  pickup_window: string
}

export type PublicStoreProduct = Pick<
  DiscoveryOffer,
  | 'id'
  | 'category'
  | 'description'
  | 'price'
  | 'referenceValue'
  | 'quantityAvailable'
  | 'availabilityBadge'
  | 'pickup'
  | 'imageSrc'
  | 'isFavorite'
> & {
  name: string
  distanceKm?: number
}

export type PublicStore = {
  id: string
  name: string
  category: string
  headerSubtitle: string
  neighborhood: string
  description: string
  availability: 'available' | 'empty' | 'closed'
  statusLabel: string
  heroImageSrc?: string
  address: string
  location: DiscoveryLocation
  openingHours: Array<{ days: string; hours: string }>
  pickupGuide: string
  pickupSummary?: string
  products: PublicStoreProduct[]
}
