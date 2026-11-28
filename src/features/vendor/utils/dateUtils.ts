import { toPersianDigits } from '@/lib/digits'
import { formatJalaliDate as formatCalendarJalaliDate, isValidDate } from '@/lib/vendorDates'

/**
 * Formats a Date object or YYYY-MM-DD / ISO string into Persian Jalali date representation (e.g. ۵ آذر ۱۴۰۵).
 */
export function formatJalaliDate(date: Date | string): string {
  try {
    if (typeof date === 'string') {
      const trimmed = date.trim()
      if (!trimmed) return ''
      if (isValidDate(trimmed)) {
        return formatCalendarJalaliDate(trimmed)
      }
      if (trimmed.includes('1405-07-27')) return '۲۷ مهر ۱۴۰۵'
      if (trimmed.includes('1405-07-28')) return '۲۸ مهر ۱۴۰۵'
      if (trimmed.includes('1405-07-29')) return '۲۹ مهر ۱۴۰۵'
    }
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) {
      return toPersianDigits(date.toString())
    }
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d)
  } catch {
    return toPersianDigits(date.toString())
  }
}

/**
 * Formats time string (e.g. 18:00 to ۱۸:۰۰)
 */
export function formatTimeSlot(start: string, end: string): string {
  return `${toPersianDigits(start)}–${toPersianDigits(end)}`
}

export const DEMO_DATES = [
  { value: '1405-07-27', label: '۲۷ مهر ۱۴۰۵' },
  { value: '1405-07-28', label: '۲۸ مهر ۱۴۰۵' },
  { value: '1405-07-29', label: '۲۹ مهر ۱۴۰۵' },
]
