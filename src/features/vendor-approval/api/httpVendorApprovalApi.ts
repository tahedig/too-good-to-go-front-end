import { apiRequest } from '@/lib/api/client'
import type { Vendor, VendorApprovalApi, VendorListResponse } from '../types'

const vendorPath = (id: string) => `/admin/vendors/${encodeURIComponent(id)}`

// Contract: docs/vendor-approval-backend.md. Map DTOs here if the backend shape differs.
export const httpVendorApprovalApi: VendorApprovalApi = {
  list({ statuses, search, page = 1, pageSize = 20 }) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (statuses?.length) params.set('status', statuses.join(','))
    if (search?.trim()) params.set('search', search.trim())
    return apiRequest<VendorListResponse>(`/admin/vendors?${params}`)
  },
  get: (id) => apiRequest<Vendor>(vendorPath(id)),
  approve: (id) => apiRequest<Vendor>(`${vendorPath(id)}/approve`, { method: 'POST' }),
  reject: (id, payload) =>
    apiRequest<Vendor>(`${vendorPath(id)}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  suspend: (id, payload) =>
    apiRequest<Vendor>(`${vendorPath(id)}/suspend`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  reactivate: (id) => apiRequest<Vendor>(`${vendorPath(id)}/reactivate`, { method: 'POST' }),
}
