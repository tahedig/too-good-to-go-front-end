export type CatalogueStoreRefDto = {
  id: string
  name: string
  logo_url?: string
}

export type CatalogueOfferCardDto = {
  id: string
  title: string
  image_url?: string
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
  store: CatalogueStoreRefDto
  is_favorite: boolean
}

export type CatalogueOfferListDto = {
  items: CatalogueOfferCardDto[]
  has_more: boolean
  next_cursor?: string
}

export type HomeCategoryDto = {
  id: number
  slug: string
  name: string
  kind: string
}

export type HomeCategoriesResponseDto = {
  items: HomeCategoryDto[]
}

export type FilterOptionDto = {
  value: string
  label: string
}

export type CatalogueSort = 'nearest' | 'price_asc' | 'price_desc' | 'newest'

export type CatalogueFiltersResponseDto = {
  kinds: FilterOptionDto[]
  categories: HomeCategoryDto[]
  allergens: FilterOptionDto[]
  price: {
    min: number
    max: number
  }
  sort_options: Array<FilterOptionDto & { value: CatalogueSort }>
  offer_count: number
}

export type DiscoveryLocationDto = {
  latitude: number
  longitude: number
}

export type CatalogueMapOfferDto = Omit<
  CatalogueOfferCardDto,
  'availability_badge' | 'pickup_start' | 'pickup_end' | 'category_name'
> & {
  location: DiscoveryLocationDto
}

export type CatalogueMapResponseDto = {
  center: DiscoveryLocationDto
  radius_km: number
  items: CatalogueMapOfferDto[]
}

export type FavoriteOfferResponseDto = {
  offer_id: string
  is_favorite: boolean
}
