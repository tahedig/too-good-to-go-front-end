import { Check, Clock3, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ListingStatus =
  | 'available'
  | 'soldOut'
  | 'active'
  | 'inactive'
  | 'draft'
  | 'ended'
  | 'info'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'suspended'

export interface StatusBadgeProps {
  status: ListingStatus
  label?: string
  compact?: boolean
  showIcon?: boolean
  className?: string
}

const statuses: Record<
  ListingStatus,
  { label: string; background: string; text: string; Icon: LucideIcon }
> = {
  available: {
    label: 'موجود',
    background: 'bg-success-subtle',
    text: 'text-text-primary',
    Icon: Check,
  },
  soldOut: {
    label: 'ناموجود',
    background: 'bg-surface-secondary',
    text: 'text-text-primary',
    Icon: X,
  },
  active: { label: 'فعال', background: 'bg-success-subtle', text: 'text-success', Icon: Check },
  inactive: {
    label: 'غیرفعال',
    background: 'bg-surface-secondary',
    text: 'text-text-secondary',
    Icon: X,
  },
  draft: { label: 'پیش‌نویس', background: 'bg-warning-subtle', text: 'text-warning', Icon: Check },
  ended: { label: 'پایان‌یافته', background: 'bg-error-subtle', text: 'text-error', Icon: Check },
  info: { label: 'فعال', background: 'bg-info-subtle', text: 'text-info', Icon: Check },
  pending: {
    label: 'در انتظار بررسی',
    background: 'bg-warning-subtle',
    text: 'text-warning',
    Icon: Clock3,
  },
  approved: {
    label: 'تأییدشده',
    background: 'bg-success-subtle',
    text: 'text-success',
    Icon: Check,
  },
  rejected: {
    label: 'ردشده',
    background: 'bg-error-subtle',
    text: 'text-error',
    Icon: X,
  },
  suspended: {
    label: 'تعلیق‌شده',
    background: 'bg-error-subtle',
    text: 'text-error',
    Icon: X,
  },
}

export function StatusBadge({
  status,
  label,
  compact = false,
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const { label: defaultLabel, background, text, Icon } = statuses[status]
  const renderIcon = showIcon && !compact

  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-sm px-2 py-1 text-caption',
        compact ? 'font-semibold leading-[19px]' : 'h-8',
        text,
        background,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {renderIcon && <Icon className="size-6 shrink-0" strokeWidth={1.75} aria-hidden="true" />}
      {label ?? defaultLabel}
    </span>
  )
}
