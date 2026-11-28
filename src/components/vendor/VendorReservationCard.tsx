import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { toPersianDigits } from '@/lib/digits'
import { formatPrice } from '@/lib/format'
import {
  formatPickupDate,
  isActiveReservation,
  reservationCustomerLabel,
  STATUS_LABELS,
} from '@/lib/vendorReservations'
import type { Reservation } from '@/lib/vendorReservations'
import { VendorReservationImage } from './VendorReservationImage'

export function VendorReservationCard({
  reservation,
  onReview,
  compact = false,
}: {
  reservation: Reservation
  onReview: (reservation: Reservation) => void
  compact?: boolean
}) {
  const active = isActiveReservation(reservation)
  const action = active ? 'بررسی تحویل' : 'جزئیات رزرو'
  const time = `${toPersianDigits(reservation.startTime)}–${toPersianDigits(reservation.endTime)}`
  const date = formatPickupDate(reservation.pickupDate)
  const customer = reservationCustomerLabel(reservation)
  const packs = `${toPersianDigits(reservation.quantity)} بسته`
  const badge = (
    <StatusBadge
      compact
      status={reservation.status === 'cancelled' ? 'inactive' : 'active'}
      label={
        compact && reservation.status === 'active' ? 'رزرو فعال' : STATUS_LABELS[reservation.status]
      }
    />
  )
  const meta = [
    { label: 'تعداد بسته', value: packs },
    { label: 'ساعت تحویل', value: <bdi dir="ltr">{time}</bdi> },
    { label: 'تاریخ تحویل', value: date },
  ]
  const review = () => onReview(reservation)

  return (
    <article
      className={`min-w-0 rounded-lg border border-border-default bg-surface p-4 ${compact ? '' : 'lg:rounded-[12px] lg:p-5'}`}
    >
      <div className={`flex flex-col gap-3 ${compact ? '' : 'lg:hidden'}`}>
        <div className="flex items-center gap-3">
          {badge}
          <div className="min-w-0 flex-1 wrap-anywhere">
            <h3 className="text-title-md">{customer}</h3>
            <p className="text-body-md text-text-secondary">{reservation.product}</p>
          </div>
        </div>
        <VendorReservationImage src={reservation.image} className="h-24 w-full" />
        <dl className="grid grid-cols-3 gap-2">
          {meta.map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <dt className="text-caption text-text-secondary">{label}</dt>
              <dd className="mt-1 text-label-md">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-price-lg">{formatPrice(reservation.amount)}</p>
        <Button fullWidth variant={active ? 'primary' : 'secondary'} onClick={review}>
          {action}
        </Button>
      </div>
      {!compact && (
        <div className="hidden flex-col gap-4 lg:flex">
          <h3 className="text-label-lg font-bold wrap-anywhere">{customer}</h3>
          <div className="flex items-center gap-6">
            <div className="flex w-50 shrink-0 flex-col gap-3">
              <p className="text-price-lg">{formatPrice(reservation.amount)}</p>
              <Button
                size="md"
                fullWidth
                variant={active ? 'primary' : 'secondary'}
                onClick={review}
              >
                {action}
              </Button>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-start gap-2 wrap-anywhere">
              <p className="text-label-lg font-bold">{reservation.product}</p>
              <p className="text-body-md">
                {packs} · {date} · <bdi dir="ltr">{time}</bdi>
              </p>
              {badge}
            </div>
            <VendorReservationImage
              src={reservation.image}
              className="h-[110px] w-[150px] shrink-0"
            />
          </div>
        </div>
      )}
    </article>
  )
}
