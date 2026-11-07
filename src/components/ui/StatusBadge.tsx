import { Check, CheckCircle, Clock3, PackageCheck, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cx } from '@/lib/cx'

/** وضعیت‌های کارت پیشنهاد (سمت مشتری) */
export type ListingStatus = 'available' | 'soldOut'

/** وضعیت‌های کارت رکورد (سمت فروشنده / ادمین) */
export type RecordStatus = 'active' | 'pending' | 'completed'

export type BadgeStatus = ListingStatus | RecordStatus

export interface StatusBadgeProps {
  status: BadgeStatus
  /** متن پیش‌فرض هر وضعیت را override می‌کند */
  label?: string
  className?: string
}

type BadgeStyle = {
  label: string
  background: string
  color: string
  Icon: LucideIcon
}

const statuses: Record<BadgeStatus, BadgeStyle> = {
  /* ---- مشتری: FoodListingCard ---- */
  available: {
    label: 'موجود',
    background: 'bg-success-subtle',
    color: 'text-text-primary',
    Icon: Check,
  },
  soldOut: {
    label: 'ناموجود',
    background: 'bg-surface-secondary',
    color: 'text-text-primary',
    Icon: X,
  },

  /* ---- فروشنده / ادمین: ProductRecordCard ---- */
  active: {
    label: 'در دسترس',
    background: 'bg-success-subtle',
    color: 'text-success',
    Icon: CheckCircle,
  },
  pending: {
    label: 'در انتظار',
    background: 'bg-warning-subtle',
    color: 'text-warning',
    Icon: Clock3,
  },
  completed: {
    label: 'تحویل داده‌شده',
    background: 'bg-surface-secondary',
    color: 'text-text-secondary',
    Icon: PackageCheck,
  },
}

/** نشان وضعیت؛ padding ۴/۸، ارتفاع ۳۲، radius ۶، متن caption با stroke ۱.۷۵ */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const { label: defaultLabel, background, color, Icon } = statuses[status]

  return (
    <span
      className={cx(
        'inline-flex h-8 shrink-0 items-center gap-1 rounded-sm px-2 py-1',
        'text-caption leading-[1.55]',
        background,
        color,
        className,
      )}
    >
      {/* در RTL آیکون سمت راست (ابتدای خوانش) قرار می‌گیرد */}
      <Icon className="size-6 shrink-0" strokeWidth={1.75} />
      {label ?? defaultLabel}
    </span>
  )
}
