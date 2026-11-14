import { listVendorReservations } from './reservationsService'
import type { Reservation } from '@/lib/vendorReservations'

/**
 * Demo adapter for the orders screens. The current UI represents a vendor order with the same
 * fields as a reservation. Replace this adapter with the Go orders endpoint/DTO mapping when
 * the API contract is available; no endpoint or order status is assumed here.
 */
export async function listVendorOrders(): Promise<Reservation[]> {
  return listVendorReservations()
}
