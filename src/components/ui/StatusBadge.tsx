import { Check, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ListingStatus = 'available' | 'soldOut' | 'active' | 'inactive' | 'draft' | 'ended'

export interface StatusBadgeProps {
  status: ListingStatus
  label?: string
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
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const { label: defaultLabel, background, text, Icon } = statuses[status]

  return (
    <span
      className={[
        'inline-flex h-8 items-center gap-1 rounded-sm px-2 py-1 text-caption',
        text,
        background,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon className="size-6 shrink-0" strokeWidth={1.75} />
      {label ?? defaultLabel}
    </span>
  )
}
