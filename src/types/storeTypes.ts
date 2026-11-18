export type WorkingHourDto = {
  day_of_week: number
  day_name: string
  day_name_fa: string
  open_time: string
  close_time: string
  is_closed: boolean
}

export type StoreImageDto = {
  id: string
  url: string
  is_primary: boolean
  sort_order: number
}

export type StoreLocationDto = {
  latitude: number
  longitude: number
}

export type StoreResponseDto = {
  public_id: string
  name: string
  category_id?: number
  category_name?: string
  owner_name?: string
  phone?: string | null
  biography: string
  pickup_address: string
  pickup_instructions?: string
  location: StoreLocationDto
  working_hours?: WorkingHourDto[]
  images?: StoreImageDto[]
  cover_image_url?: string | null
  active_products_count: number
  approval_status: string
  availability_status: string
  created_at: string
  updated_at: string
}

export type StoreListResponseDto = {
  stores: StoreResponseDto[]
}

export type UpdateStoreRequestDto = {
  name: string
  category_id?: number
  phone?: string
  pickup_address: string
  biography: string
  pickup_instructions: string
  location: StoreLocationDto
  working_hours?: WorkingHourDto[]
  images?: StoreImageDto[]
}

export type StoreRequestResponseDto = {
  public_id: string
  store_name: string
  category_id?: number
  category_name?: string
  owner_name?: string
  date: string
  address: string
  status: string
  status_fa: string
  notice: string
  created_at: string
}

export type StoreRequestListResponseDto = {
  requests: StoreRequestResponseDto[]
}

export type CreateStoreRequestDto = {
  store_name: string
  category_id?: number
  owner_name: string
  address: string
}

export type StoreStatus = 'approved' | 'pending' | 'rejected' | 'suspended'
export type StoreProfileSource = 'store' | 'request' | 'new-request'

export type OpeningDay = {
  dayOfWeek: number
  day: string
  enabled: boolean
  opensAt: string
  closesAt: string
}

export type VendorStoreImage = StoreImageDto & {
  local?: boolean
}

export type VendorStore = {
  id: string
  name: string
  branch: string
  status: StoreStatus
  statusLabel: string
  source: Exclude<StoreProfileSource, 'new-request'>
  owner: string
  category: string
  categoryId: number | null
  phone: string
  address: string
  description: string
  pickupInstructions: string
  registeredAt: string
  productsCount: number
  images: VendorStoreImage[]
  openingHours: OpeningDay[]
  workingHoursConfigured: boolean
  location: StoreLocationDto
}

export type VendorStoreForm = Pick<
  VendorStore,
  | 'name'
  | 'owner'
  | 'categoryId'
  | 'phone'
  | 'address'
  | 'description'
  | 'pickupInstructions'
  | 'images'
  | 'openingHours'
  | 'workingHoursConfigured'
  | 'location'
>
