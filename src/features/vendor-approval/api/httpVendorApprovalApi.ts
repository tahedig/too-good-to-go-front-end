import { ApiError, apiRequest } from '@/lib/api/client'
import type {
  Vendor,
  VendorApprovalApi,
  VendorDecision,
  VendorDecisionPayload,
  VendorListResponse,
  VendorStatus,
} from '../types'

/* Backend DTOs (snake_case) for the admin vendor-approval endpoints (GET/POST /admin/vendors). */
type VendorDecisionDto = {
  type: VendorDecision['type']
  reason_code: string
  message: string
  decided_at: string
  decided_by: string | null
}

type VendorDto = {
  id: string
  store_name: string
  owner_name: string
  category: string
  address: string
  phone: string
  email: string | null
  description: string | null
  image_url: string | null
  submitted_at: string
  status: VendorStatus
  status_updated_at: string | null
  decision: VendorDecisionDto | null
}

type VendorListDto = {
  items: VendorDto[]
  total: number
  page: number
  page_size: number
  counts: Partial<Record<VendorStatus, number>>
}

function toVendor(dto: VendorDto): Vendor {
  return {
    id: dto.id,
    storeName: dto.store_name,
    ownerName: dto.owner_name,
    category: dto.category,
    address: dto.address,
    phone: dto.phone,
    email: dto.email,
    description: dto.description,
    imageUrl: dto.image_url,
    submittedAt: dto.submitted_at,
    status: dto.status,
    statusUpdatedAt: dto.status_updated_at,
    decision: dto.decision && {
      type: dto.decision.type,
      reasonCode: dto.decision.reason_code,
      message: dto.decision.message,
      decidedAt: dto.decision.decided_at,
      decidedBy: dto.decision.decided_by,
    },
  }
}

const FIELD_NAMES: Record<string, string> = { reason_code: 'reasonCode' }

/** Renames backend field keys in validation errors so the dialog can show them per field. */
async function withFieldNames<T>(request: Promise<T>): Promise<T> {
  try {
    return await request
  } catch (error) {
    if (!(error instanceof ApiError) || !Object.keys(error.fieldErrors).length) throw error
    const fieldErrors = Object.fromEntries(
      Object.entries(error.fieldErrors).map(([field, messages]) => [
        FIELD_NAMES[field] ?? field,
        messages,
      ]),
    )
    throw new ApiError(error.message, error.status, fieldErrors, {
      code: error.code,
      retryAfter: error.retryAfter,
    })
  }
}

const vendorPath = (id: string) => `/admin/vendors/${encodeURIComponent(id)}`

const post = (path: string, payload?: VendorDecisionPayload) =>
  withFieldNames(
    apiRequest<VendorDto>(path, {
      method: 'POST',
      body: payload
        ? JSON.stringify({ reason_code: payload.reasonCode, message: payload.message })
        : undefined,
    }),
  ).then(toVendor)

export const httpVendorApprovalApi: VendorApprovalApi = {
  async list({ statuses, search, page = 1, pageSize = 20 }) {
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
    if (statuses?.length) params.set('status', statuses.join(','))
    if (search?.trim()) params.set('search', search.trim())
    const dto = await withFieldNames(apiRequest<VendorListDto>(`/admin/vendors?${params}`))
    const response: VendorListResponse = {
      items: dto.items.map(toVendor),
      total: dto.total,
      page: dto.page,
      pageSize: dto.page_size,
      counts: { pending: 0, approved: 0, rejected: 0, suspended: 0, ...dto.counts },
    }
    return response
  },
  get: (id) => apiRequest<VendorDto>(vendorPath(id)).then(toVendor),
  approve: (id) => post(`${vendorPath(id)}/approve`),
  reject: (id, payload) => post(`${vendorPath(id)}/reject`, payload),
  suspend: (id, payload) => post(`${vendorPath(id)}/suspend`, payload),
  reactivate: (id) => post(`${vendorPath(id)}/reactivate`),
}
