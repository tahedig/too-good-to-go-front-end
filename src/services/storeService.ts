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

export type StoreCategoryOption = {
  id: number
  slug: string
  name: string
  kind: string
}

// Matches migrations/000007_create_stores.up.sql categories seed IDs.
export const DEFAULT_STORE_CATEGORIES: StoreCategoryOption[] = [
  { id: 1, slug: 'bakery', name: 'نانوایی', kind: 'bakery' },
  { id: 2, slug: 'sweets-desserts', name: 'شیرینی و دسر', kind: 'bakery' },
  { id: 3, slug: 'cafe', name: 'کافه', kind: 'ready_meal' },
  { id: 4, slug: 'restaurant', name: 'رستوران', kind: 'ready_meal' },
  { id: 5, slug: 'iranian', name: 'غذای ایرانی', kind: 'ready_meal' },
  { id: 6, slug: 'fastfood', name: 'فست‌فود', kind: 'ready_meal' },
  { id: 7, slug: 'pizza', name: 'پیتزا', kind: 'ready_meal' },
  { id: 8, slug: 'sandwich', name: 'ساندویچ', kind: 'ready_meal' },
  { id: 9, slug: 'homemade', name: 'غذای خانگی', kind: 'ready_meal' },
  { id: 10, slug: 'vegetarian', name: 'غذاهای گیاهی', kind: 'ready_meal' },
  { id: 11, slug: 'burger', name: 'برگر', kind: 'ready_meal' },
  { id: 12, slug: 'salad-healthy', name: 'سالاد و غذای سالم', kind: 'ready_meal' },
  { id: 13, slug: 'breakfast', name: 'صبحانه', kind: 'ready_meal' },
  { id: 14, slug: 'drinks', name: 'نوشیدنی', kind: 'ready_meal' },
  { id: 15, slug: 'juice-smoothie', name: 'آبمیوه و اسموتی', kind: 'ready_meal' },
  { id: 16, slug: 'supermarket', name: 'سوپرمارکت', kind: 'grocery' },
  { id: 17, slug: 'fruit-veg', name: 'میوه و سبزیجات', kind: 'grocery' },
  { id: 18, slug: 'dairy', name: 'لبنیات', kind: 'grocery' },
  { id: 19, slug: 'protein', name: 'پروتئینی', kind: 'grocery' },
  { id: 20, slug: 'nuts-snacks', name: 'خشکبار و تنقلات', kind: 'grocery' },
  { id: 21, slug: 'international', name: 'غذاهای بین‌المللی', kind: 'ready_meal' },
]

const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']
const DEFAULT_LOCATION = { latitude: 35.6892, longitude: 51.389 }
const CATEGORY_IDS: Record<string, number> = Object.fromEntries(
  DEFAULT_STORE_CATEGORIES.map((category) => [category.name, category.id]),
)
CATEGORY_IDS['قنادی'] = 2
CATEGORY_IDS['شیرینی‌فروشی'] = 2
CATEGORY_IDS['میوه و تره‌بار'] = 17

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

function isUnavailableStatus(error: unknown): error is ApiError {
  return error instanceof ApiError && [404, 405, 501].includes(error.status)
}

type HomeCategoriesDto = {
  items?: StoreCategoryOption[]
}

type DashboardFallbackDto = {
  stores?: Array<{
    id: string
    name: string
    address: string
    status: string
    created_at: string
  }>
  pending_store_requests?: Array<{
    id: string
    store_name: string
    address: string
    status: string
    created_at: string
  }>
  kpis?: { active_offers?: number }
}

type ActiveStoreFallbackDto = {
  id: string
  name: string
  address: string
  phone?: string
  is_active: boolean
}

async function listCategories(signal?: AbortSignal): Promise<StoreCategoryOption[]> {
  try {
    const response = await apiRequest<HomeCategoriesDto>('/home/categories', { signal })
    if (Array.isArray(response?.items) && response.items.length > 0) {
      return response.items.filter(
        (item) =>
          Number.isSafeInteger(item.id) && typeof item.name === 'string' && item.name.trim(),
      )
    }
  } catch (error) {
    if (!isUnavailableStatus(error)) throw error
  }
  return DEFAULT_STORE_CATEGORIES
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

async function listFromDashboardFallback(signal?: AbortSignal): Promise<VendorStore[] | null> {
  try {
    const dto = await apiRequest<DashboardFallbackDto>('/vendor/dashboard?recent_limit=1', {
      signal,
    })
    if (!Array.isArray(dto?.stores) || !Array.isArray(dto?.pending_store_requests)) {
      return null
    }
    const stores = dto.stores.map((store, _, list) => ({
      id: store.id,
      name: store.name,
      branch: '',
      status: mapStatus(store.status),
      statusLabel: statusLabel(store.status),
      source: 'store' as const,
      owner: '',
      category: '',
      categoryId: null,
      phone: '',
      address: store.address,
      description: '',
      pickupInstructions: '',
      registeredAt: store.created_at,
      productsCount: list.length === 1 ? (dto.kpis?.active_offers ?? 0) : 0,
      images: [],
      openingHours: mapHours([]),
      workingHoursConfigured: false,
      location: DEFAULT_LOCATION,
    }))
    const requests = dto.pending_store_requests.map((req) => ({
      id: req.id,
      name: req.store_name,
      branch: '',
      status: mapStatus(req.status),
      statusLabel: statusLabel(req.status),
      source: 'request' as const,
      owner: '',
      category: '',
      categoryId: null,
      phone: '',
      address: req.address,
      description: '',
      pickupInstructions: '',
      registeredAt: req.created_at,
      productsCount: 0,
      images: [],
      openingHours: mapHours([]),
      workingHoursConfigured: false,
      location: DEFAULT_LOCATION,
    }))
    return [...requests, ...stores]
  } catch (error) {
    if (isUnavailableStatus(error)) return null
    throw error
  }
}

async function listFromActiveStoreFallback(signal?: AbortSignal): Promise<VendorStore[] | null> {
  try {
    const store = await apiRequest<ActiveStoreFallbackDto>('/vendor/store', { signal })
    if (!store?.id || typeof store.is_active !== 'boolean') return null
    if (!store.is_active) return []
    return [
      {
        id: store.id,
        name: store.name,
        branch: '',
        status: 'approved',
        statusLabel: 'تأییدشده',
        source: 'store',
        owner: '',
        category: '',
        categoryId: null,
        phone: store.phone ?? '',
        address: store.address,
        description: '',
        pickupInstructions: '',
        registeredAt: '',
        productsCount: 0,
        images: [],
        openingHours: mapHours([]),
        workingHoursConfigured: false,
        location: DEFAULT_LOCATION,
      },
    ]
  } catch (error) {
    if (isUnavailableStatus(error)) return null
    throw error
  }
}

export const storeService = {
  listCategories,
  listStores,
  listRequests,

  async list(signal?: AbortSignal): Promise<VendorStore[]> {
    const [storesResult, requestsResult] = await Promise.allSettled([
      listStores(signal),
      listRequests(signal),
    ])

    const stores = storesResult.status === 'fulfilled' ? storesResult.value : null
    const requests = requestsResult.status === 'fulfilled' ? requestsResult.value : null

    if (storesResult.status === 'rejected' && !isUnavailableStatus(storesResult.reason)) {
      throw storesResult.reason
    }
    if (requestsResult.status === 'rejected' && !isUnavailableStatus(requestsResult.reason)) {
      throw requestsResult.reason
    }

    if (stores !== null || requests !== null) {
      return [...(requests ?? []), ...(stores ?? [])]
    }

    const fromDashboard = await listFromDashboardFallback(signal)
    if (fromDashboard !== null) return fromDashboard

    const fromActiveStore = await listFromActiveStoreFallback(signal)
    if (fromActiveStore !== null) return fromActiveStore

    throw new ApiError('سرویس فروشگاه‌های فروشنده در نسخهٔ فعلی سرور فعال نیست.', 404)
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
