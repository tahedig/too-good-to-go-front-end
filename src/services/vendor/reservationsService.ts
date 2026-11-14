import type { Reservation } from '@/lib/vendorReservations'
import { listVendorOrders } from './ordersService'

/**
 * The supplied Go API has no separate reservations route. Vendor reservations are rendered from
 * the pickup details on the documented GET /orders response.
 */
export async function listVendorReservations(): Promise<Reservation[]> {
  return listVendorOrders()
}
