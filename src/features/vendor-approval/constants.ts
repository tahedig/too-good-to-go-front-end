import type { VendorDecisionType, VendorStatus } from './types'

export const DECISION_MESSAGE_MIN_LENGTH = 20
export const DECISION_MESSAGE_MAX_LENGTH = 500

export const STATUS_META: Record<
  VendorStatus,
  { label: string; className: string; textClass: string }
> = {
  pending: {
    label: 'در انتظار بررسی',
    className: 'bg-accent-subtle text-warning',
    textClass: 'text-warning',
  },
  approved: {
    label: 'تأییدشده',
    className: 'bg-surface-sage text-success',
    textClass: 'text-success',
  },
  rejected: { label: 'ردشده', className: 'bg-error-subtle text-error', textClass: 'text-error' },
  suspended: {
    label: 'تعلیق‌شده',
    className: 'bg-surface-secondary text-text-secondary',
    textClass: 'text-text-secondary',
  },
}

export type ReasonOption = { value: string; label: string }

/** Codes are sent to the backend; labels stay in the frontend. */
export const DECISION_REASONS: Record<VendorDecisionType, ReasonOption[]> = {
  rejection: [
    { value: 'unverifiable_address', label: 'نشانی قابل تأیید نبود' },
    { value: 'invalid_owner_info', label: 'اطلاعات مالک نادرست یا ناقص بود' },
    { value: 'invalid_contact', label: 'شماره تماس پاسخ‌گو نبود' },
    { value: 'missing_documents', label: 'مدارک یا مجوزها کامل نبود' },
    { value: 'ineligible_category', label: 'دسته‌بندی فروشگاه پشتیبانی نمی‌شود' },
    { value: 'other', label: 'سایر' },
  ],
  suspension: [
    { value: 'customer_complaints', label: 'شکایت‌های مکرر مشتریان' },
    { value: 'missed_pickups', label: 'تحویل‌ندادن سفارش‌ها' },
    { value: 'frequent_cancellations', label: 'لغو مکرر رزروها' },
    { value: 'expired_license', label: 'مجوز یا مدارک منقضی‌شده' },
    { value: 'policy_violation', label: 'تخلف از قوانین پلتفرم' },
    { value: 'unpaid_balance', label: 'بدهی یا مشکل تسویه' },
    { value: 'vendor_request', label: 'درخواست خود فروشنده' },
    { value: 'other', label: 'سایر' },
  ],
}

export function reasonLabel(type: VendorDecisionType, code: string) {
  return DECISION_REASONS[type].find((reason) => reason.value === code)?.label ?? code
}

const dateFormat = new Intl.DateTimeFormat('fa-IR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Tehran',
})

export function formatVendorDate(iso: string | null) {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : dateFormat.format(date)
}

/** +989120000011 or 09120000011 → 0912 000 0011 */
export function formatPhone(phone: string) {
  const local = phone.replace(/^\+98/, '0')
  return local.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3')
}
