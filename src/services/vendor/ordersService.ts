import { apiRequest } from '@/lib/api/client'
import type { Reservation, ReservationStatus } from '@/lib/vendorReservations'

type VendorOrderItemDto = {
  title: string
  quantity: number
  unit_price: number
  offer_type: 'surprise_bag' | 'specific_item'
}

type VendorOrderDto = {
  id: string
  store_name: string
  store_address: string
  status: ReservationStatus
  payment_status: 'unpaid' | 'initiated' | 'succeeded' | 'failed' | null
  total_amount: number
  currency: string
  pickup_start: string
  pickup_end: string
  items: VendorOrderItemDto[]
  created_at: string
}

type VendorOrderListDto = {
  orders: VendorOrderDto[]
  next_cursor: string | null
  has_more: boolean
}

function toLocalPickupParts(value: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) {
    throw new Error('زمان تحویل یکی از سفارش‌ها در پاسخ API معتبر نیست.')
  }

  const pad = (part: number) => String(part).padStart(2, '0')
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  }
}

function mapOrder(order: VendorOrderDto): Reservation {
  const pickupStart = toLocalPickupParts(order.pickup_start)
  const pickupEnd = toLocalPickupParts(order.pickup_end)
  const titles = order.items.map((item) => item.title.trim()).filter(Boolean)

  return {
    id: order.id,
    customer: null,
    storeName: order.store_name,
    storeAddress: order.store_address,
    product: titles.join('، ') || 'سفارش',
    image: '',
    quantity: order.items.reduce((total, item) => total + item.quantity, 0),
    amount: order.total_amount,
    pickupDate: pickupStart.date,
    startTime: pickupStart.time,
    endTime: pickupEnd.time,
    status: order.status,
  }
}

/**
 * The Go API exposes vendor orders through GET /orders. Fetch all cursor pages because the
 * current vendor screens do their date/status filtering client-side and have no pagination UI.
 */
export async function listVendorOrders(): Promise<Reservation[]> {
  const orders: VendorOrderDto[] = []
  const seenCursors = new Set<string>()
  let cursor: string | undefined

  while (true) {
    const params = new URLSearchParams({ group: 'all', limit: '50' })
    if (cursor) params.set('cursor', cursor)

    const page = await apiRequest<VendorOrderListDto>(`/orders?${params.toString()}`)
    if (!page || !Array.isArray(page.orders)) {
      throw new Error('ساختار پاسخ سفارش‌ها از API معتبر نیست.')
    }

    orders.push(...page.orders)
    if (!page.has_more) break
    if (!page.next_cursor || seenCursors.has(page.next_cursor)) {
      throw new Error('صفحه‌بندی سفارش‌ها از API معتبر نیست.')
    }

    seenCursors.add(page.next_cursor)
    cursor = page.next_cursor
  }

  return orders.map(mapOrder)
}
