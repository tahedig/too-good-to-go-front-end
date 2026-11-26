import { apiRequest } from '@/lib/api/client'

export interface CatalogueOfferCard {
  id: string
  title: string
  image_url?: string | null
  price: number
  original_price: number
  discount_percent: number
  currency: string
  quantity_available: number
  availability_badge: string
  pickup_start: string
  pickup_end: string
  pickup_window: string
  category_slug?: string
  category_name?: string
  distance_m?: number
  distance_text?: string
  store: {
    id: string
    name: string
    logo_url?: string | null
  }
  is_favorite: boolean
}

export interface CatalogueOfferList {
  items: CatalogueOfferCard[]
  has_more: boolean
  next_cursor?: string
}

export interface OfferDetail {
  id: string
  title: string
  description: string
  image_url?: string | null
  price: number
  original_price: number
  discount_percent: number
  currency: string
  quantity_available: number
  availability_badge: string
  pickup_start: string
  pickup_end: string
  pickup_window: string
  cancellation_deadline: string
  category_slug?: string
  category_name?: string
  allergens: Array<{ value: string; label: string }>
  allergens_declared: boolean
  distance_m?: number
  distance_text?: string
  store: {
    id: string
    name: string
    logo_url?: string | null
    city?: string
    district?: string | null
    address: string
    pickup_instructions?: string
    location: {
      latitude: number
      longitude: number
    }
  }
  is_favorite: boolean
}

export const discoveryApi = {
  getHomeToday: (signal?: AbortSignal) => apiRequest<CatalogueOfferList>('/home/today', { signal }),
  getHomePopularNearby: (signal?: AbortSignal) =>
    apiRequest<CatalogueOfferList>('/home/popular-nearby', { signal }),
  getHomeLastChance: (signal?: AbortSignal) =>
    apiRequest<CatalogueOfferList>('/home/last-chance', { signal }),
  getOffer: (id: string, signal?: AbortSignal) =>
    apiRequest<OfferDetail>(`/offers/${encodeURIComponent(id)}`, { signal }),
}
