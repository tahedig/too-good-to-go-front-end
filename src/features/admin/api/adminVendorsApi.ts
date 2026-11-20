import { apiRequest } from '@/lib/api/client'

export type AdminVendorStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export type AdminVendorDecisionType = 'rejection' | 'suspension'

export type AdminVendorDecisionDto = {
  type: AdminVendorDecisionType
  reason_code: string
  message: string
  decided_at: string
  decided_by: string
}

export type AdminVendorDto = {
  id: string
  store_name: string
  owner_name: string
  category: string
  address: string
  phone: string
  email: string | null
  description: string
  image_url: string | null
  submitted_at: string
  status: AdminVendorStatus
  status_updated_at: string | null
  decision: AdminVendorDecisionDto | null
}

export type AdminVendorCountsDto = {
  pending: number
  approved: number
  rejected: number
  suspended: number
}

export type AdminVendorListDto = {
  items: AdminVendorDto[]
  total: number
  page: number
  page_size: number
  counts: AdminVendorCountsDto
}

export type AdminVendorListParams = {
  status?: string
  search?: string
  page?: number
  pageSize?: number
}

export type AdminVendorDecisionPayload = {
  reason_code: string
  message: string
}

function buildVendorQueryString(params: AdminVendorListParams = {}): string {
  const searchParams = new URLSearchParams()
  if (params.status) searchParams.set('status', params.status)
  if (params.search) searchParams.set('search', params.search)
  if (params.page) searchParams.set('page', String(params.page))
  if (params.pageSize) searchParams.set('page_size', String(params.pageSize))
  const serialized = searchParams.toString()
  return serialized ? `?${serialized}` : ''
}

// Matches tahedig/too-good-to-go-back-end internal/presentation/handler/vendor_approval_handler.go
export const adminVendorsApi = {
  listVendors(params?: AdminVendorListParams): Promise<AdminVendorListDto> {
    return apiRequest<AdminVendorListDto>(`/admin/vendors${buildVendorQueryString(params)}`)
  },

  getVendor(id: string): Promise<AdminVendorDto> {
    return apiRequest<AdminVendorDto>(`/admin/vendors/${encodeURIComponent(id)}`)
  },

  approveVendor(id: string): Promise<AdminVendorDto> {
    return apiRequest<AdminVendorDto>(`/admin/vendors/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
    })
  },

  rejectVendor(id: string, payload: AdminVendorDecisionPayload): Promise<AdminVendorDto> {
    return apiRequest<AdminVendorDto>(`/admin/vendors/${encodeURIComponent(id)}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  suspendVendor(id: string, payload: AdminVendorDecisionPayload): Promise<AdminVendorDto> {
    return apiRequest<AdminVendorDto>(`/admin/vendors/${encodeURIComponent(id)}/suspend`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  reactivateVendor(id: string): Promise<AdminVendorDto> {
    return apiRequest<AdminVendorDto>(`/admin/vendors/${encodeURIComponent(id)}/reactivate`, {
      method: 'POST',
    })
  },
}
