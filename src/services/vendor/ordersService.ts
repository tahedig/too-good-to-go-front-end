import { ApiError, apiRequest } from '@/lib/api/client'
import { STATUS_LABELS, toStorePickupWindow } from '@/lib/vendorReservations'
import type { Reservation, ReservationStatus } from '@/lib/vendorReservations'

type VendorOrderDto = {
  id: string
  order_number: string
  customer: { name: string }
  package: { id: string; title: string; image_url: string }
  quantity: number
  total_price: number
  status: ReservationStatus
  pickup_date: string
  pickup_time_slot: { start_time: string; end_time: string }
}

type VendorOrderListDto = {
  orders: VendorOrderDto[]
  pagination: { page: number; total_pages: number }
}

type VerifyPickupDto = {
  success: boolean
  order_id: string
  status: 'delivered'
}

type UpdateVendorOrderStatusDto = {
  success: boolean
  order_id: string
  status: string
}

function mapOrder(order: VendorOrderDto): Reservation {
  if (
    !order.id ||
    !Object.hasOwn(STATUS_LABELS, order.status) ||
    !Number.isSafeInteger(order.quantity) ||
    order.quantity < 1 ||
    !Number.isSafeInteger(order.total_price) ||
    order.total_price < 0
  ) {
    throw new Error('اطلاعات یکی از رزروها در پاسخ سرور معتبر نیست.')
  }

  return {
    id: order.id,
    orderNumber: order.order_number,
    customer: order.customer?.name?.trim() || null,
    offerId: order.package?.id ?? '',
    product: order.package?.title?.trim() || 'بستهٔ رزروشده',
    image: order.package?.image_url ?? '',
    quantity: order.quantity,
    amount: order.total_price,
    status: order.status,
    ...toStorePickupWindow(
      order.pickup_date,
      order.pickup_time_slot?.start_time,
      order.pickup_time_slot?.end_time,
    ),
  }
}

/** TEAM-48 lists orders received by the vendor. GET /orders is the caller's purchases. */
export async function listVendorOrders(signal?: AbortSignal): Promise<Reservation[]> {
  const orders = new Map<string, Reservation>()

  for (let page = 1; ; page += 1) {
    const params = new URLSearchParams({ status: 'all', page: String(page), limit: '50' })
    const result = await apiRequest<VendorOrderListDto>(`/vendor/orders?${params}`, { signal })
    const totalPages = result?.pagination?.total_pages
    if (
      !Array.isArray(result?.orders) ||
      result.pagination?.page !== page ||
      !Number.isSafeInteger(totalPages) ||
      totalPages < 0
    ) {
      throw new Error('ساختار پاسخ رزروها از سرور معتبر نیست.')
    }
    for (const item of result.orders) orders.set(item.id, mapOrder(item))
    if (page >= totalPages) break
  }

  return [...orders.values()]
}

export async function verifyVendorPickup(id: string, code: string): Promise<void> {
  if (!/^\d{4}$/.test(code)) throw new ApiError('کد تحویل باید ۴ رقم باشد.', 400)

  const result = await apiRequest<VerifyPickupDto>(
    `/vendor/orders/${encodeURIComponent(id)}/verify-pickup`,
    {
      method: 'POST',
      body: JSON.stringify({ pickup_code: code }),
    },
  )
  if (!result?.success || result.order_id !== id || result.status !== 'delivered') {
    throw new Error('ثبت تحویل از طرف سرور تأیید نشد.')
  }
}

export async function updateVendorOrderStatus(
  id: string,
  status: 'ready_for_pickup' | 'cancelled' | 'no_show',
  reason?: string,
): Promise<void> {
  const payload: { status: string; reason?: string } = { status }
  const trimmedReason = reason?.trim()
  if (trimmedReason) payload.reason = trimmedReason

  const result = await apiRequest<UpdateVendorOrderStatusDto>(
    `/vendor/orders/${encodeURIComponent(id)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
  if (!result?.success || result.order_id !== id) {
    throw new Error('تغییر وضعیت سفارش از طرف سرور تأیید نشد.')
  }
}
