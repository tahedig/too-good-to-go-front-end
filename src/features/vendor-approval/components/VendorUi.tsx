import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check, FileText, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { STATUS_META, formatVendorDate } from '../constants'
import { linkButtonClass } from './linkButtonClass'
import type { Vendor, VendorStatus } from '../types'

export function VendorStatusBadge({
  status,
  className,
}: {
  status: VendorStatus
  className?: string
}) {
  const { label, className: tone } = STATUS_META[status]
  return (
    <span
      className={[
        'inline-flex h-7 items-center justify-center rounded-sm px-2 text-caption whitespace-nowrap',
        tone,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </span>
  )
}

type StateTone = 'success' | 'error' | 'empty'

const STATE_TONES: Record<StateTone, { background: string; icon: LucideIcon; iconColor: string }> =
  {
    success: { background: 'bg-surface-sage', icon: Check, iconColor: 'text-success' },
    error: { background: 'bg-error-subtle', icon: TriangleAlert, iconColor: 'text-error' },
    empty: { background: 'bg-surface-sage', icon: FileText, iconColor: 'text-text-primary' },
  }

export function StateCard({
  tone,
  title,
  children,
  action,
}: {
  tone: StateTone
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  const { background, icon: Icon, iconColor } = STATE_TONES[tone]
  return (
    <section
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex flex-col gap-4 rounded-lg p-4 ${background}`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`size-8 shrink-0 ${iconColor}`} strokeWidth={1.5} aria-hidden="true" />
        <h2 className="text-title-md">{title}</h2>
      </div>
      {children && <p className="text-body-md text-text-primary">{children}</p>}
      {action}
    </section>
  )
}

/** Compact card used under success/error states, as in the design. */
export function VendorSummaryCard({
  vendor,
  showStatus = false,
}: {
  vendor: Vendor
  showStatus?: boolean
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border-default bg-surface p-4">
      <h2 className="text-label-lg">{vendor.storeName}</h2>
      <p className="text-body-md text-text-primary">
        {vendor.ownerName} · {vendor.address}
      </p>
      {showStatus && (
        <p className={`text-label-md ${STATUS_META[vendor.status].textClass}`}>
          {formatVendorDate(vendor.statusUpdatedAt ?? vendor.submittedAt)} ·{' '}
          {STATUS_META[vendor.status].label}
        </p>
      )}
    </section>
  )
}

export function BackToListLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className={linkButtonClass('secondary', 'w-full')}>
      {label}
    </Link>
  )
}
