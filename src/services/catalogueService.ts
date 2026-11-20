import { apiRequest } from '@/lib/api/client'
import type {
  CatalogueFiltersResponseDto,
  CatalogueMapResponseDto,
  CatalogueOfferCardDto,
  CatalogueOfferListDto,
  DiscoveryLocationDto,
  FavoriteOfferResponseDto,
  HomeCategoriesResponseDto,
} from '@/types/catalogueTypes'
import type {
  DiscoveryLocation,
  DiscoveryOffer,
  DiscoverySection,
  DiscoverySectionId,
} from '@/types/discoveryTypes'

const LOCATION_STORAGE_KEY = 'discovery_location'

export type CatalogueSearchParams = {
  q?: string
  categoryId?: number
  kind?: string
  priceMin?: number
  priceMax?: number
  pickupFrom?: string
  pickupTo?: string
  excludeAllergens?: string[]
  location?: DiscoveryLocation
  radiusKm?: number
  sort?: 'nearest' | 'price_asc' | 'price_desc' | 'newest'
  limit?: number
}

export type CatalogueMapParams = {
  location: DiscoveryLocation
  categoryId?: number
  kind?: string
  radiusKm?: number
}

export type CatalogueFilters = CatalogueFiltersResponseDto

const sectionTitles: Record<DiscoverySectionId, string> = {
  today: 'فرصت‌های خوشمزه امروز',
  'popular-nearby': 'محبوب‌های اطراف شما',
  'last-chance': 'آخرین فرصت‌های نجات غذا',
}

function mapOffer(
  dto: CatalogueOfferCardDto,
  categoryNamesBySlug: Map<string, string>,
  location?: DiscoveryLocationDto,
): DiscoveryOffer {
  return {
    id: dto.id,
    storeId: dto.store.id,
    merchantName: dto.store.name,
    category: dto.category_name ?? categoryNamesBySlug.get(dto.category_slug ?? '') ?? '',
    distanceKm: dto.distance_m === undefined ? undefined : dto.distance_m / 1000,
    description: dto.title,
    price: dto.price,
    referenceValue: dto.original_price,
    quantityAvailable: dto.quantity_available,
    availabilityBadge: dto.availability_badge,
    pickup: dto.pickup_window,
    pickupStart: dto.pickup_start ?? '',
    imageSrc: dto.image_url,
    isFavorite: dto.is_favorite,
    location,
  }
}

function createCategoryNameMap(categories: CatalogueFilters['categories']) {
  return new Map(categories.map((category) => [category.slug, category.name]))
}

function makeSearchParams(params: CatalogueSearchParams) {
  const search = new URLSearchParams()
  if (params.q?.trim()) search.set('q', params.q.trim())
  if (params.categoryId !== undefined) search.set('category', String(params.categoryId))
  if (params.kind) search.set('kind', params.kind)
  if (params.priceMin !== undefined) search.set('price_min', String(params.priceMin))
  if (params.priceMax !== undefined) search.set('price_max', String(params.priceMax))
  if (params.pickupFrom) search.set('pickup_from', params.pickupFrom)
  if (params.pickupTo) search.set('pickup_to', params.pickupTo)
  if (params.excludeAllergens?.length) {
    search.set('exclude_allergens', params.excludeAllergens.join(','))
  }
  if (params.location) {
    search.set('lat', String(params.location.latitude))
    search.set('lng', String(params.location.longitude))
  }
  if (params.radiusKm !== undefined && params.location) {
    search.set('radius_km', String(params.radiusKm))
  }
  if (params.sort) search.set('sort', params.sort)
  search.set('limit', String(params.limit ?? 50))
  return search
}

function mapOfferList(
  response: CatalogueOfferListDto,
  categories: CatalogueFilters['categories'] = [],
): DiscoveryOffer[] {
  const categoryNames = createCategoryNameMap(categories)
  return response.items.map((offer) => mapOffer(offer, categoryNames))
}

export const catalogueService = {
  getLocation(): DiscoveryLocation | undefined {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY)
    if (!raw) return undefined

    try {
      const location = JSON.parse(raw) as Partial<DiscoveryLocation>
      if (
        typeof location.latitude === 'number' &&
        Number.isFinite(location.latitude) &&
        location.latitude >= -90 &&
        location.latitude <= 90 &&
        typeof location.longitude === 'number' &&
        Number.isFinite(location.longitude) &&
        location.longitude >= -180 &&
        location.longitude <= 180
      ) {
        return { latitude: location.latitude, longitude: location.longitude }
      }
    } catch {
      localStorage.removeItem(LOCATION_STORAGE_KEY)
      return undefined
    }

    localStorage.removeItem(LOCATION_STORAGE_KEY)
    return undefined
  },

  saveLocation(location: DiscoveryLocation) {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location))
  },

  clearLocation() {
    localStorage.removeItem(LOCATION_STORAGE_KEY)
  },

  async getHomeCategories() {
    const response = await apiRequest<HomeCategoriesResponseDto>('/home/categories')
    return response.items
  },

  getFilters() {
    return apiRequest<CatalogueFilters>('/offers/filters')
  },

  async getHomeSections(location?: DiscoveryLocation): Promise<DiscoverySection[]> {
    const query = new URLSearchParams({ limit: '30' })
    if (location) {
      query.set('lat', String(location.latitude))
      query.set('lng', String(location.longitude))
    }
    const [today, popularNearby, lastChance] = await Promise.all([
      apiRequest<CatalogueOfferListDto>(`/home/today?${query}`),
      apiRequest<CatalogueOfferListDto>(`/home/popular-nearby?${query}`),
      apiRequest<CatalogueOfferListDto>(`/home/last-chance?${query}`),
    ])
    const sections = [
      ['today', today],
      ['popular-nearby', popularNearby],
      ['last-chance', lastChance],
    ] as const
    return sections.map(([id, response]) => ({
      id,
      title: sectionTitles[id],
      offers: mapOfferList(response),
    }))
  },

  async getHomeCollection(
    id: 'today' | 'popular-nearby' | 'last-chance',
    location?: DiscoveryLocation,
    radiusKm?: number,
  ) {
    const query = new URLSearchParams({ limit: '30' })
    if (location) {
      query.set('lat', String(location.latitude))
      query.set('lng', String(location.longitude))
    }
    if (location && radiusKm !== undefined) query.set('radius_km', String(radiusKm))
    const response = await apiRequest<CatalogueOfferListDto>(`/home/${id}?${query}`)
    return mapOfferList(response)
  },

  async search(params: CatalogueSearchParams, categories: CatalogueFilters['categories'] = []) {
    const query = makeSearchParams(params)
    const response = await apiRequest<CatalogueOfferListDto>(`/offers?${query}`)
    return mapOfferList(response, categories)
  },

  async getFavorites(location?: DiscoveryLocation) {
    const query = new URLSearchParams({ limit: '50' })
    if (location) {
      query.set('lat', String(location.latitude))
      query.set('lng', String(location.longitude))
    }
    const response = await apiRequest<CatalogueOfferListDto>(`/favorites/offers?${query}`)
    return mapOfferList(response)
  },

  async getStoreOffers(id: string, location?: DiscoveryLocation) {
    const query = new URLSearchParams({
      limit: '50',
      sort: location ? 'nearest' : 'newest',
    })
    if (location) {
      query.set('lat', String(location.latitude))
      query.set('lng', String(location.longitude))
    }
    const response = await apiRequest<CatalogueOfferListDto>(
      `/stores/${encodeURIComponent(id)}/offers?${query}`,
    )
    return mapOfferList(response)
  },

  async getMapOffers(params: CatalogueMapParams, categories: CatalogueFilters['categories'] = []) {
    const query = new URLSearchParams({
      lat: String(params.location.latitude),
      lng: String(params.location.longitude),
      limit: '300',
    })
    if (params.categoryId !== undefined) query.set('category', String(params.categoryId))
    if (params.kind) query.set('kind', params.kind)
    if (params.radiusKm !== undefined) query.set('radius_km', String(params.radiusKm))
    const response = await apiRequest<CatalogueMapResponseDto>(`/offers/map?${query}`)
    const namesBySlug = createCategoryNameMap(categories)
    return {
      center: response.center,
      radiusKm: response.radius_km,
      offers: response.items.map((offer) =>
        mapOffer(
          {
            ...offer,
            availability_badge: '',
            pickup_start: '',
            pickup_end: '',
          },
          namesBySlug,
          offer.location,
        ),
      ),
    }
  },

  setFavorite(id: string, favorite: boolean) {
    const path = `/favorites/offers/${encodeURIComponent(id)}`
    return favorite
      ? apiRequest<FavoriteOfferResponseDto>(path, { method: 'PUT' })
      : apiRequest<null>(path, { method: 'DELETE' })
  },
}
