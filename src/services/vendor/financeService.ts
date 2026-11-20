import { isActiveReservation, reservationCustomerLabel } from '@/lib/vendorReservations'
import { listVendorReservations } from './reservationsService'
import type { FinanceSource } from '@/features/vendor-finance/financeTypes'

export const vendorFinanceSource: FinanceSource = {
  async load(section, signal) {
    // The current backend exposes vendor orders, but no finance ledger or mutations.
    // An order total is not revenue, a settlement, or a withdrawable balance.
    if (section !== 'overview') return {}
    const orders = await listVendorReservations(signal)
    return {
      reservations: orders.filter(isActiveReservation).map((order) => ({
        id: order.id,
        customer: reservationCustomerLabel(order),
        quantity: order.quantity,
        amount: order.amount,
      })),
    }
  },
}
