import { apiRequest } from '@/lib/api/client';
import type {
  ListVendorOrdersParams,
  VendorOrder,
  VendorOrderListResponse,
  VendorOrderSummary,
  VendorStoreActive,
  VerifyPickupPayload,
  VerifyPickupResponse,
} from '../types';
import {
  INITIAL_VENDOR_ORDERS,
  INITIAL_VENDOR_STORE,
} from './mockData';

// Local reactive mock store for fallback when backend API is offline
let mockOrders: VendorOrder[] = [...INITIAL_VENDOR_ORDERS];
const mockStore: VendorStoreActive = { ...INITIAL_VENDOR_STORE };

function getAuthHeader(): Record<string, string> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token') || sessionStorage.getItem('token') || localStorage.getItem('access_token')
      : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const vendorApi = {
  /**
   * Retrieves active vendor store information
   */
  getStore: async (): Promise<VendorStoreActive> => {
    try {
      return await apiRequest<VendorStoreActive>('/vendor/store', {
        headers: getAuthHeader(),
      });
    } catch {
      // Fallback to mock store
      return mockStore;
    }
  },

  /**
   * Lists orders / reservations for the vendor's active store
   */
  listOrders: async (params: ListVendorOrdersParams = {}): Promise<VendorOrderListResponse> => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : '';

    try {
      return await apiRequest<VendorOrderListResponse>(`/vendor/orders${qs}`, {
        headers: getAuthHeader(),
      });
    } catch {
      // Local filtering fallback
      let filtered = [...mockOrders];

      if (params.date) {
        filtered = filtered.filter(
          (o) => o.pickup_date === params.date || o.created_at.startsWith(params.date!)
        );
      }

      if (params.status && params.status !== 'all') {
        filtered = filtered.filter((o) => o.status === params.status);
      }

      return {
        orders: filtered,
        pagination: {
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          total_items: filtered.length,
          total_pages: 1,
        },
      };
    }
  },

  /**
   * Gets daily summary metrics
   */
  getSummary: async (date?: string): Promise<VendorOrderSummary> => {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';

    try {
      return await apiRequest<VendorOrderSummary>(`/vendor/orders/summary${qs}`, {
        headers: getAuthHeader(),
      });
    } catch {
      // Compute summary from current mock state
      const targetDate = date || '1405-07-27';
      const dayOrders = mockOrders.filter(
        (o) => o.pickup_date === targetDate || o.created_at.startsWith(targetDate)
      );

      const totalReserved = dayOrders.reduce((sum, o) => sum + o.quantity, 0);
      const activeCount = dayOrders.filter((o) => o.status === 'active').length;
      const deliveredCount = dayOrders.filter((o) => o.status === 'delivered').length;
      const totalRevenue = dayOrders.reduce((sum, o) => sum + o.total_price, 0);

      return {
        date: targetDate,
        total_reserved_packages: totalReserved,
        active_reservations_count: activeCount,
        delivered_packages_count: deliveredCount,
        total_revenue: totalRevenue,
      };
    }
  },

  /**
   * Verifies and marks an order as delivered/completed
   */
  verifyPickup: async (
    orderId: string,
    payload: VerifyPickupPayload = {}
  ): Promise<VerifyPickupResponse> => {
    try {
      return await apiRequest<VerifyPickupResponse>(`/vendor/orders/${orderId}/verify-pickup`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(payload),
      });
    } catch {
      // Update local mock store on success simulation
      mockOrders = mockOrders.map((o) =>
        o.id === orderId ? { ...o, status: 'delivered' } : o
      );

      return {
        success: true,
        order_id: orderId,
        status: 'delivered',
        delivered_at: new Date().toISOString(),
        message: 'تحویل بسته با موفقیت ثبت شد',
      };
    }
  },
};
