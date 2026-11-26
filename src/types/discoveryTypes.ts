import type { DiscoveryLocationDto } from './catalogueTypes'

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
