import { apiRequest } from '@/lib/api/client'

export interface Reservation {
  id: string
  reference: string
  pickup_code: string
  status: string
  status_label: string
  group: string
  store: {
    id: string
    name: string
    pickup_address: string
    pickup_instructions?: string
    location?: {
      latitude: number
      longitude: number
    }
  }
  offer: {
    id: string
    title: string
    offer_type?: string
    image_url?: string | null
    category_name?: string
    quantity: number
    unit_price: number
    unit_original_price: number
  }
  items_total: number
  service_fee: number
  total_amount: number
  currency: string
  pickup_start?: string
  pickup_end?: string
  pickup_window?: string
  cancellation_deadline?: string
  created_at: string
}

export interface CreateReservationPayload {
  offer_id: string
  quantity: number
  terms_accepted: true
}

export const reservationApi = {
  create: (payload: CreateReservationPayload, idempotencyKey: string) =>
    apiRequest<Reservation>('/reservations', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(payload),
    }),
}
