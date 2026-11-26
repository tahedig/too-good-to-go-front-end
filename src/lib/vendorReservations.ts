import { isValidDate, localDate } from '@/lib/vendorDates'

export { formatJalaliDate as formatPickupDate, isValidDate, localDate } from '@/lib/vendorDates'

export type ReservationStatus = 'active' | 'ready_for_pickup' | 'delivered' | 'cancelled'

export type Reservation = {
  id: string
  orderNumber: string
  customer: string | null
  offerId: string
  product: string
  image: string
  quantity: number
  amount: number
  pickupDate: string // Gregorian calendar date in the store's timezone, for filters and display
  startTime: string
  endTime: string
  pickupStartsAt: number
  pickupEndsAt: number
  status: ReservationStatus
}

const tehranTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Tehran',
  hourCycle: 'h23',
  hour: '2-digit',
  minute: '2-digit',
})
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/

/** TEAM-48 serializes pickup_date and both HH:mm values in UTC. */
export function toStorePickupWindow(date: string, start: string, end: string) {
  if (!isValidDate(date) || !TIME_PATTERN.test(start) || !TIME_PATTERN.test(end)) {
    throw new Error('زمان تحویل یکی از رزروها در پاسخ سرور معتبر نیست.')
  }
  const pickupStartsAt = Date.parse(`${date}T${start}:00Z`)
  let pickupEndsAt = Date.parse(`${date}T${end}:00Z`)
  if (pickupEndsAt < pickupStartsAt) pickupEndsAt += 24 * 60 * 60 * 1000

  return {
    pickupDate: localDate(new Date(pickupStartsAt)),
    startTime: tehranTime.format(pickupStartsAt),
    endTime: tehranTime.format(pickupEndsAt),
    pickupStartsAt,
    pickupEndsAt,
  }
}

export function toPickupWindowFromTimestamps(
  pickupStart: string | null | undefined,
  pickupEnd: string | null | undefined,
  fallbackCreatedAt: string,
) {
  const startRaw = pickupStart ?? fallbackCreatedAt
  const endRaw = pickupEnd ?? startRaw
  const pickupStartsAt = Date.parse(startRaw)
  let pickupEndsAt = Date.parse(endRaw)
  if (!Number.isFinite(pickupStartsAt) || !Number.isFinite(pickupEndsAt)) {
    throw new Error('زمان تحویل یکی از رزروها در پاسخ سرور معتبر نیست.')
  }
  if (pickupEndsAt < pickupStartsAt) pickupEndsAt = pickupStartsAt

  return {
    pickupDate: localDate(new Date(pickupStartsAt)),
    startTime: tehranTime.format(pickupStartsAt),
    endTime: tehranTime.format(pickupEndsAt),
    pickupStartsAt,
    pickupEndsAt,
  }
}

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  active: 'فعال',
  ready_for_pickup: 'آماده تحویل',
  delivered: 'تحویل‌شده',
  cancelled: 'لغوشده',
}

export function isActiveReservation(reservation: Reservation): boolean {
  return reservation.status === 'active' || reservation.status === 'ready_for_pickup'
}

export function reservationCustomerLabel(reservation: Reservation): string {
  return reservation.customer ?? `سفارش ${reservation.orderNumber || reservation.id}`
}
