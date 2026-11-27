import React from 'react'
import type { VendorOrder } from '../types'
import { toPersianDigits } from '@/lib/digits'
import { formatNumber } from '@/lib/format'
import { formatJalaliDate, formatTimeSlot } from '../utils/dateUtils'
import { Check } from 'lucide-react'

const FALLBACK_PACKAGE_IMAGE = '/vendor-bakery.jpg'

interface VendorOrderCardProps {
  order: VendorOrder
  onVerifyPickup: (order: VendorOrder) => void
}

export const VendorOrderCard: React.FC<VendorOrderCardProps> = ({ order, onVerifyPickup }) => {
  const isDelivered = order.status === 'delivered'
  const isCancelled = order.status === 'cancelled'
  const actionDisabled = isDelivered || isCancelled
  const actionLabel = isDelivered ? 'تحویل داده شده' : isCancelled ? 'لغو شده' : 'بررسی تحویل'
  const customerName = order.customer?.name?.trim() || 'مشتری'
  const packageTitle = order.package?.title?.trim() || 'بستهٔ غافلگیری'
  const packageImage = order.package?.image_url?.trim() || FALLBACK_PACKAGE_IMAGE

  const getStatusBadge = () => {
    switch (order.status) {
      case 'active':
        return (
          <span className="inline-flex items-center rounded-lg bg-surface-sage/70 px-2.5 py-1 text-xs font-semibold text-primary">
            رزرو فعال
          </span>
        )
      case 'ready_for_pickup':
        return (
          <span className="inline-flex items-center rounded-lg bg-accent-subtle px-2.5 py-1 text-xs font-semibold text-warning">
            در انتظار تحویل
          </span>
        )
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-success-subtle px-2.5 py-1 text-xs font-semibold text-success">
            <Check className="size-3.5" />
            تحویل‌شده
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center rounded-lg bg-error-subtle px-2.5 py-1 text-xs font-semibold text-error">
            لغوشده
          </span>
        )
    }
  }

  const formattedDate = formatJalaliDate(order.pickup_date)

  return (
    <div className="w-full rounded-xl border border-border-default bg-surface p-4 shadow-1 transition-shadow hover:shadow-2">
      {/* Mobile Layout */}
      <div className="flex flex-col md:hidden">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary">{customerName}</h3>
            <p className="mt-0.5 text-xs text-text-secondary">{packageTitle}</p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="relative mt-3 h-36 w-full overflow-hidden rounded-lg bg-surface-secondary">
          <img
            src={packageImage}
            alt={packageTitle}
            onError={(e) => {
              if (e.currentTarget.src.endsWith(FALLBACK_PACKAGE_IMAGE)) return
              e.currentTarget.src = FALLBACK_PACKAGE_IMAGE
            }}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-b border-border-default/50 pb-4 text-center">
          <div>
            <span className="block text-[11px] text-text-secondary">تعداد بسته</span>
            <span className="mt-1 block text-xs font-bold text-text-primary">
              {toPersianDigits(order.quantity)} بسته
            </span>
          </div>
          <div>
            <span className="block text-[11px] text-text-secondary">ساعت تحویل</span>
            <span className="dir-ltr mt-1 block text-xs font-bold text-text-primary">
              {formatTimeSlot(order.pickup_time_slot.start_time, order.pickup_time_slot.end_time)}
            </span>
          </div>
          <div>
            <span className="block text-[11px] text-text-secondary">تاریخ تحویل</span>
            <span className="mt-1 block text-xs font-bold text-text-primary">
              {toPersianDigits(formattedDate)}
            </span>
          </div>
        </div>

        <div className="mt-3 text-center">
          <span className="text-xl font-extrabold text-primary">
            {toPersianDigits(formatNumber(order.total_price))} تومان
          </span>
        </div>

        <div className="mt-3">
          <button
            type="button"
            disabled={actionDisabled}
            onClick={() => onVerifyPickup(order)}
            className={[
              'flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors',
              actionDisabled
                ? 'cursor-not-allowed bg-surface-secondary text-text-disabled'
                : 'bg-primary text-on-primary shadow-1 hover:bg-primary-hover active:bg-primary-pressed',
            ].join(' ')}
          >
            {actionLabel}
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden items-center justify-between gap-6 md:flex">
        <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-surface-secondary">
          <img
            src={packageImage}
            alt={packageTitle}
            onError={(e) => {
              if (e.currentTarget.src.endsWith(FALLBACK_PACKAGE_IMAGE)) return
              e.currentTarget.src = FALLBACK_PACKAGE_IMAGE
            }}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-text-primary">{customerName}</h3>
            {getStatusBadge()}
          </div>
          <p className="mt-1 text-sm text-text-secondary">{packageTitle}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
            <span>{toPersianDigits(order.quantity)} بسته</span>
            <span>•</span>
            <span>{toPersianDigits(formattedDate)}</span>
            <span>•</span>
            <span>
              {formatTimeSlot(order.pickup_time_slot.start_time, order.pickup_time_slot.end_time)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-lg font-extrabold text-primary">
            {toPersianDigits(formatNumber(order.total_price))} تومان
          </span>
          <button
            type="button"
            disabled={actionDisabled}
            onClick={() => onVerifyPickup(order)}
            className={[
              'flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors',
              actionDisabled
                ? 'cursor-not-allowed bg-surface-secondary text-text-disabled'
                : 'bg-primary text-on-primary shadow-1 hover:bg-primary-hover active:bg-primary-pressed',
            ].join(' ')}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
