import { apiRequest } from '@/lib/api/client'
import { tokenStorage } from '@/services/tokenStorage'
import type {
  ListVendorOrdersParams,
  VendorOrderListResponse,
  VendorOrderSummary,
  VendorStoreActive,
  VerifyPickupPayload,
  VerifyPickupResponse,
} from '../types'

function getLegacyAuthHeader(): Record<string, string> {
  if (tokenStorage.getToken()) return {}
  if (typeof sessionStorage !== 'undefined') {
    try {
      const rawSession = sessionStorage.getItem('auth_session')
      if (rawSession) {
        const parsed = JSON.parse(rawSession) as { accessToken?: string; access_token?: string }
        if (parsed.accessToken || parsed.access_token) return {}
      }
    } catch {
      // Let apiRequest handle invalid session state consistently.
    }
  }

  let legacyToken: string | null = null
  if (typeof localStorage !== 'undefined') {
    try {
      legacyToken = localStorage.getItem('token')
    } catch {
      legacyToken = null
    }
  }
  if (!legacyToken && typeof sessionStorage !== 'undefined') {
    try {
      legacyToken = sessionStorage.getItem('token')
    } catch {
      legacyToken = null
    }
  }
  return legacyToken ? { Authorization: `Bearer ${legacyToken}` } : {}
}

export const vendorApi = {
  /**
   * Retrieves active vendor store information from the backend
   */
  getStore: async (): Promise<VendorStoreActive> => {
    return apiRequest<VendorStoreActive>('/vendor/store', {
      headers: getLegacyAuthHeader(),
    })
  },

  /**
   * Lists orders / reservations for the vendor's active store with filtering
   */
  listOrders: async (params: ListVendorOrdersParams = {}): Promise<VendorOrderListResponse> => {
    const query = new URLSearchParams()
    if (params.date) query.set('date', params.date)
    if (params.status && params.status !== 'all') query.set('status', params.status)
    if (params.page) query.set('page', String(params.page))
    if (params.limit) query.set('limit', String(params.limit))

    const qs = query.toString() ? `?${query.toString()}` : ''
    return apiRequest<VendorOrderListResponse>(`/vendor/orders${qs}`, {
      headers: getLegacyAuthHeader(),
    })
  },

  /**
   * Gets daily summary metrics from the backend
   */
  getSummary: async (date?: string): Promise<VendorOrderSummary> => {
    const qs = date ? `?date=${encodeURIComponent(date)}` : ''
    return apiRequest<VendorOrderSummary>(`/vendor/orders/summary${qs}`, {
      headers: getLegacyAuthHeader(),
    })
  },

  /**
   * Verifies and marks an order as delivered/completed in the backend database
   */
  verifyPickup: async (
    orderId: string,
    payload: VerifyPickupPayload = {},
  ): Promise<VerifyPickupResponse> => {
    return apiRequest<VerifyPickupResponse>(
      `/vendor/orders/${encodeURIComponent(orderId)}/verify-pickup`,
      {
        method: 'POST',
        headers: getLegacyAuthHeader(),
        body: JSON.stringify(payload),
      },
    )
  },
}
