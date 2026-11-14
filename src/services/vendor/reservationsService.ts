import { localDate } from '@/lib/vendorReservations'
import type { Reservation } from '@/lib/vendorReservations'

/** Demo-only source until the backend response fields and pagination are documented. */
export async function listVendorReservations(): Promise<Reservation[]> {
  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  const common = {
    product: 'بستهٔ غافلگیری نانوایی',
    image: '/vendor-bakery.jpg',
    startTime: '18:00',
    endTime: '19:00',
  }

  return [
    {
      ...common,
      id: 'r1',
      customer: 'لیلا علیزاده',
      quantity: 1,
      amount: 40000,
      pickupDate: localDate(today),
      status: 'active',
    },
    {
      ...common,
      id: 'r2',
      customer: 'نگار محمدی',
      quantity: 2,
      amount: 80000,
      pickupDate: localDate(today),
      status: 'active',
    },
    {
      ...common,
      id: 'r3',
      customer: 'مریم احمدی',
      quantity: 1,
      amount: 40000,
      pickupDate: localDate(yesterday),
      status: 'delivered',
    },
    {
      ...common,
      id: 'r4',
      customer: 'رضا رضایی',
      quantity: 1,
      amount: 40000,
      pickupDate: localDate(yesterday),
      status: 'cancelled',
    },
    {
      ...common,
      id: 'r5',
      customer: 'سارا حسینی',
      quantity: 1,
      amount: 40000,
      pickupDate: localDate(yesterday),
      status: 'pending',
    },
  ]
}
