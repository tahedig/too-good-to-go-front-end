import { apiRequest } from '@/lib/api/client'
import type { FinanceReservation } from '@/features/vendor-finance/financeTypes'

type VendorOrderDto = {
  id: string
  order_number: string
  customer?: { name: string }
  quantity: number
  total_price: number
  status: string
}

type VendorOrderListDto = {
  orders: VendorOrderDto[]
  pagination: {
    page: number
    total_pages: number
  }
}

const ACTIVE_STATUSES = new Set([
  'active',
  'ready_for_pickup',
])

export async function listFinanceReservations(
  signal?: AbortSignal,
): Promise<FinanceReservation[]> {
  const reservations = new Map<string, VendorOrderDto>()

  for (let page = 1; ; page += 1) {
    const params = new URLSearchParams({
      status: 'all',
      page: String(page),
      limit: '50',
    })

    const result = await apiRequest<VendorOrderListDto>(
      `/vendor/orders?${params}`,
      { signal },
    )

    const totalPages = result?.pagination?.total_pages

    if (
      !Array.isArray(result?.orders) ||
      result.pagination?.page !== page ||
      !Number.isSafeInteger(totalPages) ||
      totalPages < 0
    ) {
      throw new Error('ساختار پاسخ رزروها از سرور معتبر نیست.')
    }

    for (const item of result.orders) {
      if (
        !item.id ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        !Number.isSafeInteger(item.total_price) ||
        item.total_price < 0
      ) {
        throw new Error('اطلاعات رزرو از سرور معتبر نیست.')
      }

      reservations.set(item.id, item)
    }

    if (page >= totalPages) break
  }

  return [...reservations.values()]
    .filter((item) => ACTIVE_STATUSES.has(item.status))
    .map((item) => ({
      id: item.id,
      customer:
        item.customer?.name?.trim() ||
        `سفارش ${item.order_number || item.id}`,
      quantity: item.quantity,
      amount: item.total_price,
    }))
}