import type { VendorOrder, VendorOrderSummary, VendorStoreActive } from '../types'

export const BREAD_DEMO_IMAGE =
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80'

export const INITIAL_VENDOR_STORE: VendorStoreActive = {
  id: 'store_550e8400',
  name: 'نان صبحگاهی',
  address: 'تهران، ولیعصر، پلاک ۱۲',
  phone: '02188776655',
  is_active: true,
}

export const INITIAL_VENDOR_ORDERS: VendorOrder[] = [
  {
    id: 'ord-101',
    order_number: 'TG-101',
    customer: {
      id: 'cust-1',
      name: 'لیلا علیزاده',
      phone: '09121112233',
    },
    package: {
      id: 'pkg-1',
      title: 'بستهٔ غافلگیری نانوایی',
      image_url: BREAD_DEMO_IMAGE,
    },
    quantity: 1,
    unit_price: 40000,
    total_price: 40000,
    status: 'active',
    pickup_date: '1405-07-27',
    pickup_time_slot: {
      start_time: '18:00',
      end_time: '19:00',
    },
    created_at: '2026-10-19T10:00:00Z',
  },
  {
    id: 'ord-102',
    order_number: 'TG-102',
    customer: {
      id: 'cust-2',
      name: 'نگار محمدی',
      phone: '09124445566',
    },
    package: {
      id: 'pkg-1',
      title: 'بستهٔ غافلگیری نانوایی',
      image_url: BREAD_DEMO_IMAGE,
    },
    quantity: 2,
    unit_price: 40000,
    total_price: 80000,
    status: 'active',
    pickup_date: '1405-07-27',
    pickup_time_slot: {
      start_time: '18:00',
      end_time: '19:00',
    },
    created_at: '2026-10-19T11:15:00Z',
  },
]

export const INITIAL_VENDOR_SUMMARY: VendorOrderSummary = {
  date: '1405-07-27',
  total_reserved_packages: 3,
  active_reservations_count: 2,
  delivered_packages_count: 0,
  total_revenue: 120000,
}
