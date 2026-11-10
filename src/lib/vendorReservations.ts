export type ReservationStatus = 'active' | 'pending' | 'delivered' | 'cancelled'
export type Reservation = {
  id: string
  customer: string
  product: string
  image: string
  quantity: number
  amount: number
  pickupDate: string // ISO calendar date in the store's local timezone
  startTime: string
  endTime: string
  status: ReservationStatus
}

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function formatPickupDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day, 12))
}
export const STATUS_LABELS: Record<ReservationStatus, string> = {
  active: 'فعال',
  pending: 'در انتظار تحویل',
  delivered: 'تحویل‌شده',
  cancelled: 'لغوشده',
}
