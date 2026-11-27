import { ApiError, apiRequest } from '@/lib/api/client'

// Matches tahedig/too-good-to-go-back-end PR #28 (feat/TEAM-53/vendor-dashboard)
// internal/application/dto/vendor_dashboard_dto.go
export type VendorDashboardStoreDto = {
  id: string
  name: string
  address: string
  status: string
  accepts_orders: boolean
  created_at: string
}

export type VendorPendingStoreBannerDto = {
  id: string
  store_name: string
  address: string
  status: string
  created_at: string
}

export type VendorDashboardKpisDto = {
  received_revenue: number
  reserved_packages: number
  available_packages: number
  active_offers: number
}

export type VendorReservationCountsDto = {
  pending_payment: number
  paid: number
  ready: number
  completed: number
  cancelled: number
  expired: number
  no_show: number
  active: number
  total: number
}

export type VendorTodayActivityDto = {
  reservations_count: number
  packages_reserved: number
  completed_count: number
  revenue: number
}

export type VendorDashboardPlanDto = {
  name: string
  commission_rate: number
  period_start: string
  period_end: string
  remaining_days: number
}

export type VendorDashboardFinancialDto = {
  received_payout: number
  net_period_revenue: number
  pending_payout: number
  available_balance: number
  plan: VendorDashboardPlanDto
}

export type VendorNearestReservationDto = {
  id: string
  status: string
  pickup_code: string
  customer_name: string
  store_id: string
  store_name: string
  offer_title: string
  offer_image_url: string | null
  quantity: number
  total_amount: number
  pickup_start: string | null
  pickup_end: string | null
  offer_quantity_available: number
  offer_quantity_reserved: number
  offer_quantity_total: number
  created_at: string
}

export type VendorDashboardOrderItemDto = {
  title: string
  offer_type: string
  quantity: number
  unit_price: number
}

export type VendorDashboardReservationSummaryDto = {
  id: string
  status: string
  payment_status: string | null
  pickup_code: string
  customer_name: string
  store_id: string
  store_name: string
  items: VendorDashboardOrderItemDto[]
  items_total: number
  total_amount: number
  vendor_payout: number
  pickup_start: string | null
  pickup_end: string | null
  created_at: string
}

export type VendorDashboardResponseDto = {
  active_store: VendorDashboardStoreDto | null
  stores: VendorDashboardStoreDto[]
  pending_store_requests: VendorPendingStoreBannerDto[]
  kpis: VendorDashboardKpisDto
  reservation_counts: VendorReservationCountsDto
  today: VendorTodayActivityDto
  financial: VendorDashboardFinancialDto
  nearest_reservation: VendorNearestReservationDto | null
  recent_reservations: VendorDashboardReservationSummaryDto[]
}

export async function fetchVendorDashboard(
  options: { storeId?: string; recentLimit?: number; signal?: AbortSignal } = {},
): Promise<VendorDashboardResponseDto | null> {
  const params = new URLSearchParams()
  if (options.storeId) params.set('store_id', options.storeId)
  if (options.recentLimit !== undefined) params.set('recent_limit', String(options.recentLimit))
  const query = params.toString()

  try {
    return await apiRequest<VendorDashboardResponseDto>(
      `/vendor/dashboard${query ? `?${query}` : ''}`,
      { signal: options.signal },
    )
  } catch (error) {
    if (error instanceof ApiError && [404, 405, 501].includes(error.status)) {
      return null
    }
    throw error
  }
}
