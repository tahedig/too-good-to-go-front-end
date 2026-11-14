export type OrderGroup = 'all' | 'upcoming' | 'past'

export type OrderStatus =
  'pending_payment' | 'paid' | 'ready' | 'completed' | 'cancelled' | 'expired' | 'no_show'

export type OrderListQueryDto = {
  group: OrderGroup
  limit?: number
  cursor?: string
  status?: string
}

export type OrderStoreDto = {
  id: string
  name: string
  pickup_address: string
}

export type OrderItemDto = {
  title: string
  offer_type: 'surprise_bag' | 'specific_item'
  quantity: number
  unit_price: number
}

export type OrderDto = {
  id: string
  status: OrderStatus
  group: Exclude<OrderGroup, 'all'>
  payment_status: 'initiated' | 'succeeded' | 'failed' | null
  store: OrderStoreDto
  items: OrderItemDto[]
  items_total: number
  service_fee: number
  total_amount: number
  pickup_start: string | null
  pickup_end: string | null
  reserved_until?: string | null
  created_at: string
}

export type OrderListResponseDto = {
  orders: OrderDto[]
  next_cursor: string | null
}
