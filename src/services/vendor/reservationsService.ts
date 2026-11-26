import type { Reservation } from '@/lib/vendorReservations'
import { listVendorOrders } from './ordersService'

/** Reservations and orders share the same vendor order resource in TEAM-48. */
export function listVendorReservations(signal?: AbortSignal): Promise<Reservation[]> {
  return listVendorOrders(signal)
}
