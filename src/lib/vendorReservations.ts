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
export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1 || month < 1 || month > 12 || day < 1) return false
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}
export function formatPickupDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(0)
  date.setFullYear(year, month - 1, day)
  date.setHours(12, 0, 0, 0)
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}
export const STATUS_LABELS: Record<ReservationStatus, string> = {
  active: 'فعال',
  pending: 'در انتظار تحویل',
  delivered: 'تحویل‌شده',
  cancelled: 'لغوشده',
}
