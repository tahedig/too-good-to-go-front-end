import { toStorePickupWindow } from '@/lib/vendorReservations'
import type { DashboardData } from '@/services/vendor/dashboardService'
import image from './preview-bakery.jpg'

/** Figma fixture only, loaded by the dashboard's explicitly opted-in development preview. */
export const previewData: DashboardData = {
  stores: {
    ok: true,
    value: [
      {
        id: 'preview-bakery',
        name: 'نان صبحگاهی',
        branch: '',
        address: 'تهران، خیابان ولیعصر، پلاک ۱۲',
        productsCount: 1,
      },
    ],
  },
  pendingStore: {
    ok: true,
    value: { id: 'preview-request', name: 'نان صبحگاهی', branch: 'شعبه شریعتی' },
  },
  inventory: {
    ok: true,
    value: { available: 3, offers: [{ id: 'preview-offer', quantity_available: 3 }] },
  },
  reservations: {
    ok: true,
    value: {
      reserved: 3,
      reservedForNearestOffer: 3,
      publishedForNearestOffer: 6,
      nearest: {
        id: 'preview-reservation',
        orderNumber: 'TG-9821',
        customer: 'لیلا علیزاده',
        offerId: 'preview-offer',
        product: 'بستهٔ غافلگیری نانوایی',
        image,
        quantity: 1,
        amount: 40000,
        status: 'active',
        ...toStorePickupWindow('2026-10-19', '14:30', '15:30'),
      },
    },
  },
  finance: {
    received: 1000000,
    net: 1800000,
    pending: 500000,
    available: 300000,
    plan: { name: 'پایه · رایگان', commission: 10, renewal: '۱ مهر تا ۳۰ مهر · ۳ روز باقی‌مانده' },
  },
}
