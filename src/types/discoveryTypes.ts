import type { DiscoveryLocationDto } from './catalogueTypes'

export interface ProductAvailabilityPreview {
  id: string
  title: string
  imageSrc: string
  category: string
  price: number
  referenceValue: number
  pickup: string
  storeName: string
}

export type DiscoveryOffer = {
  id: string
  storeId: string
  merchantName: string
  category: string
  distanceKm?: number
  description: string
  price: number
  referenceValue: number
  quantityAvailable: number
  availabilityBadge: string
  pickup: string
  pickupStart: string
  imageSrc?: string
  isFavorite: boolean
  location?: DiscoveryLocationDto
}

export type DiscoveryLocation = DiscoveryLocationDto

export type DiscoverySectionId = 'today' | 'popular-nearby' | 'last-chance'

export type DiscoverySection = {
  id: DiscoverySectionId
  title: string
  offers: DiscoveryOffer[]
}
