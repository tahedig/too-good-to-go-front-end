import { ApiError, apiRequest } from '@/lib/api/client'
import type {
  CreateStoreRequestDto,
  OpeningDay,
  StoreImageDto,
  StoreListResponseDto,
  StoreProfileSource,
  StoreRequestListResponseDto,
  StoreRequestResponseDto,
  StoreResponseDto,
  StoreStatus,
  UpdateStoreRequestDto,
  VendorStore,
  VendorStoreForm,
  VendorStoreImage,
} from '@/types/storeTypes'

const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']
const DEFAULT_LOCATION = { latitude: 35.6892, longitude: 51.389 }
const CATEGORY_IDS: Record<string, number> = {
  رستوران: 1,
  'فست\u200cفود': 2,
  نانوایی: 3,
  قنادی: 4,
  'شیرینی\u200cفروشی': 4,
  کافه: 5,
  سوپرمارکت: 6,
  'میوه و تره\u200cبار': 7,
}

function categoryName(id?: number, name?: string) {
  if (name) return name
  const entry = Object.entries(CATEGORY_IDS).find(([, categoryId]) => categoryId === id)
  return entry?.[0] ?? ''
}

function mapStatus(status: string): StoreStatus {
  switch (status) {
    case 'approved':
    case 'active':
      return 'approved'
    case 'rejected':
      return 'rejected'
    case 'suspended':
      return 'suspended'
    default:
      return 'pending'
  }
}

function statusLabel(status: string, label?: string) {
  if (label) return label
  switch (status) {
    case 'approved':
    case 'active':
      return 'تأییدشده'
    case 'rejected':
      return 'رد شده'
    case 'suspended':
      return 'تعلیق‌شده'
    default:
      return 'در انتظار بررسی'
  }
}

function mapImages(images: StoreImageDto[] | undefined, cover?: string | null): VendorStoreImage[] {
  const result = [...(images ?? [])]
  if (result.length === 0 && cover) {
    result.push({ id: '', url: cover, is_primary: true, sort_order: 0 })
  }
  return result.sort((left, right) => left.sort_order - right.sort_order)
}

function mapHours(hours: StoreResponseDto['working_hours']): OpeningDay[] {
  const byDay = new Map((hours ?? []).map((hour) => [hour.day_of_week, hour]))
  return DAYS.map((defaultName, dayOfWeek) => {
    const hour = byDay.get(dayOfWeek)
    return {
      dayOfWeek,
      day: hour?.day_name_fa || defaultName,
      enabled: hour ? !hour.is_closed : false,
      opensAt: hour?.open_time || '08:00',
      closesAt: hour?.close_time || '18:00',
    }
  })
}

function mapStore(dto: StoreResponseDto): VendorStore {
  return {
    id: dto.public_id,
    name: dto.name,
    branch: '',
    status: mapStatus(dto.approval_status),
    statusLabel: statusLabel(dto.approval_status),
    source: 'store',
    owner: dto.owner_name ?? '',
    category: categoryName(dto.category_id, dto.category_name),
    categoryId: dto.category_id ?? null,
    phone: dto.phone ?? '',
    address: dto.pickup_address,
    description: dto.biography,
    pickupInstructions: dto.pickup_instructions ?? '',
    registeredAt: dto.created_at,
    productsCount: dto.active_products_count,
    images: mapImages(dto.images, dto.cover_image_url),
    openingHours: mapHours(dto.working_hours),
    workingHoursConfigured: Boolean(dto.working_hours?.length),
    location: dto.location ?? DEFAULT_LOCATION,
  }
}

function mapRequest(dto: StoreRequestResponseDto): VendorStore {
  return {
    id: dto.public_id,
    name: dto.store_name,
    branch: '',
    status: mapStatus(dto.status),
    statusLabel: statusLabel(dto.status, dto.status_fa),
    source: 'request',
    owner: dto.owner_name ?? '',
    category: categoryName(dto.category_id, dto.category_name),
    categoryId: dto.category_id ?? null,
    phone: '',
    address: dto.address,
    description: '',
    pickupInstructions: '',
    registeredAt: dto.created_at,
    productsCount: 0,
    images: [],
    openingHours: mapHours([]),
    workingHoursConfigured: false,
    location: DEFAULT_LOCATION,
  }
}

function newRequestDraft(): VendorStore {
  return {
    id: 'new',
    name: '',
    branch: '',
    status: 'pending',
    statusLabel: 'در انتظار بررسی',
    source: 'request',
    owner: '',
    category: 'نانوایی',
    categoryId: CATEGORY_IDS['نانوایی'],
    phone: '',
    address: '',
    description: '',
    pickupInstructions: '',
    registeredAt: '',
    productsCount: 0,
    images: [],
    openingHours: mapHours([]),
    workingHoursConfigured: false,
    location: DEFAULT_LOCATION,
  }
}

function mapFormToUpdate(form: VendorStoreForm): UpdateStoreRequestDto {
  const payload: UpdateStoreRequestDto = {
    name: form.name,
    pickup_address: form.address,
    biography: form.description,
    pickup_instructions: form.pickupInstructions,
    location: form.location,
  }
  if (form.categoryId !== null) payload.category_id = form.categoryId
  payload.phone = form.phone
  if (form.workingHoursConfigured) {
    payload.working_hours = form.openingHours.map((hour) => ({
      day_of_week: hour.dayOfWeek,
      day_name: ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'][
        hour.dayOfWeek
      ],
      day_name_fa: hour.day,
      open_time: hour.opensAt,
      close_time: hour.closesAt,
      is_closed: !hour.enabled,
    }))
  }
  if (form.images.length > 0 && form.images.every((image) => image.id)) {
    payload.images = form.images.map(({ id, url, is_primary, sort_order }) => ({
      id,
      url,
      is_primary,
      sort_order,
    }))
  }
  return payload
}

async function listStores(signal?: AbortSignal): Promise<VendorStore[]> {
  const response = await apiRequest<StoreListResponseDto>('/vendor/stores', { signal })
  if (!Array.isArray(response?.stores)) throw new Error('پاسخ فهرست فروشگاه‌ها معتبر نیست.')
  return response.stores.map(mapStore)
}

async function listRequests(signal?: AbortSignal): Promise<VendorStore[]> {
  const response = await apiRequest<StoreRequestListResponseDto>('/vendor/store-requests', {
    signal,
  })
  if (!Array.isArray(response?.requests)) throw new Error('پاسخ فهرست درخواست‌ها معتبر نیست.')
  return response.requests.map(mapRequest)
}

export const storeService = {
  listStores,
  listRequests,

  async list(): Promise<VendorStore[]> {
    const [stores, requests] = await Promise.all([listStores(), listRequests()])
    return [...requests, ...stores]
  },

  async get(id: string): Promise<{ store: VendorStore; source: StoreProfileSource }> {
    if (id === 'new') return { store: newRequestDraft(), source: 'new-request' }

    try {
      const store = await apiRequest<StoreResponseDto>(`/vendor/stores/${encodeURIComponent(id)}`)
      return { store: mapStore(store), source: 'store' }
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) throw error
    }

    const request = await apiRequest<StoreRequestResponseDto>(
      `/vendor/store-requests/${encodeURIComponent(id)}`,
    )
    return { store: mapRequest(request), source: 'request' }
  },

  async createRequest(form: VendorStoreForm): Promise<StoreRequestResponseDto> {
    const payload: CreateStoreRequestDto = {
      store_name: form.name,
      owner_name: form.owner,
      address: form.address,
    }
    if (form.categoryId !== null) payload.category_id = form.categoryId
    return apiRequest<StoreRequestResponseDto>('/vendor/store-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  async update(
    id: string,
    form: VendorStoreForm,
    originalImages: VendorStoreImage[],
  ): Promise<StoreResponseDto> {
    if (form.images.some((image) => image.local || image.url.startsWith('data:'))) {
      throw new Error('بارگذاری تصویر در API فروشگاه هنوز پشتیبانی نمی‌شود.')
    }
    if (originalImages.length > 0 && form.images.length === 0) {
      throw new Error('API فروشگاه امکان حذف آخرین تصویر را ندارد.')
    }

    return apiRequest<StoreResponseDto>(`/vendor/stores/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(mapFormToUpdate(form)),
    })
  },
}

export type { OpeningDay, VendorStore, VendorStoreForm, VendorStoreImage }
