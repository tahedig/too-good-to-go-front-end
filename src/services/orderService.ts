import { apiRequest } from '@/lib/api/client'
import type { OrderListQueryDto, OrderListResponseDto } from '@/types/orderTypes'

export const orderService = {
  listMyOrders(query: OrderListQueryDto): Promise<OrderListResponseDto> {
    const params = new URLSearchParams({
      group: query.group,
      limit: String(query.limit ?? 20),
    })
    if (query.cursor) params.set('cursor', query.cursor)
    if (query.status) params.set('status', query.status)

    return apiRequest<OrderListResponseDto>(`/orders?${params.toString()}`)
  },
}
