import { toPersianDigits } from '@/lib/digits';

/**
 * Formats a Date object or ISO string into Persian Jalali date representation (e.g. ۲۷ مهر ۱۴۰۵).
 */
export function formatJalaliDate(date: Date | string): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) {
      return toPersianDigits(date.toString());
    }
    return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return toPersianDigits(date.toString());
  }
}

/**
 * Formats time string (e.g. 18:00 to ۱۸:۰۰)
 */
export function formatTimeSlot(start: string, end: string): string {
  return `${toPersianDigits(start)}–${toPersianDigits(end)}`;
}

/**
 * Preset dates for demo / filter matching the user screenshots
 */
export const DEMO_DATES = [
  { value: '1405-07-27', label: '۲۷ مهر ۱۴۰۵' },
  { value: '1405-07-28', label: '۲۸ مهر ۱۴۰۵' },
  { value: '1405-07-29', label: '۲۹ مهر ۱۴۰۵' },
];
