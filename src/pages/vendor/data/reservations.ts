import { localDate } from '@/lib/vendorReservations'
import type { Reservation } from '@/lib/vendorReservations'

// Illustrative mock data, independent of the mock product inventory: no real reservation or handover is made.
export async function listReservations(): Promise<Reservation[]> {
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

// API contract is not supplied. Once agreed, replace listReservations with an adapter;
// the endpoint, authentication, status values, dates and response mapping below are illustrative only.
// import axios from 'axios'
// const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })
// async function listReservations(): Promise<Reservation[]> {
//   const { data } = await api.get<Reservation[]>('/vendor/reservations')
//   return data // map the actual server DTO and pagination here
// }
