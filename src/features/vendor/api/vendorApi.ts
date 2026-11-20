import { apiRequest } from '@/lib/api/client'
import type {
  ListVendorOrdersParams,
  VendorOrderListResponse,
  VendorOrderSummary,
  VendorStoreActive,
  VerifyPickupPayload,
  VerifyPickupResponse,
} from '../types'

function getAuthHeader(): Record<string, string> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        localStorage.getItem('access_token')
      : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const vendorApi = {
  /**
   * Retrieves active vendor store information from the backend
   */
  getStore: async (): Promise<VendorStoreActive> => {
    return apiRequest<VendorStoreActive>('/vendor/store', {
      headers: getAuthHeader(),
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
      headers: getAuthHeader(),
    })
  },

  /**
   * Gets daily summary metrics from the backend
   */
  getSummary: async (date?: string): Promise<VendorOrderSummary> => {
    const qs = date ? `?date=${encodeURIComponent(date)}` : ''
    return apiRequest<VendorOrderSummary>(`/vendor/orders/summary${qs}`, {
      headers: getAuthHeader(),
    })
  },

  /**
   * Verifies and marks an order as delivered/completed in the backend database
   */
  verifyPickup: async (
    orderId: string,
    payload: VerifyPickupPayload = {},
  ): Promise<VerifyPickupResponse> => {
    return apiRequest<VerifyPickupResponse>(`/vendor/orders/${orderId}/verify-pickup`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(payload),
    })
  },
}
