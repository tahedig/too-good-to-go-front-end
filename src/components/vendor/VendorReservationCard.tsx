import { Button } from '@/components/ui/Button'
import { toPersianDigits } from '@/lib/digits'
import { formatPrice } from '@/lib/format'
import { formatPickupDate, STATUS_LABELS } from '@/lib/vendorReservations'
import type { Reservation } from '@/lib/vendorReservations'

const tones = {
  active: 'bg-success-subtle text-success',
  pending: 'bg-warning-subtle text-warning',
  delivered: 'bg-success-subtle text-success',
  cancelled: 'bg-error-subtle text-error',
}
function ReservationBadge({
  reservation,
  mobile = false,
}: {
  reservation: Reservation
  mobile?: boolean
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-sm px-2 py-1 text-caption font-semibold ${tones[reservation.status]}`}
    >
      {mobile && reservation.status === 'active' ? 'رزرو فعال' : STATUS_LABELS[reservation.status]}
    </span>
  )
}

export function VendorReservationCard({
  reservation,
  onReview,
}: {
  reservation: Reservation
  onReview: (reservation: Reservation) => void
}) {
  const date = formatPickupDate(reservation.pickupDate)
  const time = `${toPersianDigits(reservation.startTime)}–${toPersianDigits(reservation.endTime)}`
  const packs = `${toPersianDigits(reservation.quantity)} بسته`
  return (
    <article className="rounded-lg border border-border-default bg-surface p-4 lg:rounded-[12px] lg:p-5">
      <div className="flex flex-col gap-3 lg:hidden">
        <div className="flex items-center gap-3">
          <ReservationBadge reservation={reservation} mobile />
          <div className="min-w-0 flex-1">
            <h3 className="text-title-md font-semibold">{reservation.customer}</h3>
            <p className="text-body-md text-text-secondary">{reservation.product}</p>
          </div>
        </div>
        <img src={reservation.image} alt="" className="h-24 w-full rounded-md object-cover" />
        <dl className="grid grid-cols-3 gap-2">
          <div>
            <dt className="text-caption text-text-secondary">تعداد بسته</dt>
            <dd className="mt-1 text-label-md">{packs}</dd>
          </div>
          <div>
            <dt className="text-caption text-text-secondary">ساعت تحویل</dt>
            <dd className="mt-1 text-label-md" dir="ltr">
              {time}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-text-secondary">تاریخ تحویل</dt>
            <dd className="mt-1 text-label-md">{date}</dd>
          </div>
        </dl>
        <p className="text-title-lg font-bold">{formatPrice(reservation.amount)}</p>
        <Button fullWidth onClick={() => onReview(reservation)}>
          بررسی تحویل
        </Button>
      </div>
      <div className="hidden flex-col gap-4 lg:flex">
        <h3 className="text-label-lg font-bold">{reservation.customer}</h3>
        <div className="flex items-center gap-6">
          <div className="flex w-50 shrink-0 flex-col gap-3">
            <p className="text-title-lg font-bold">{formatPrice(reservation.amount)}</p>
            <Button size="md" fullWidth onClick={() => onReview(reservation)}>
              بررسی تحویل
            </Button>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
            <p className="text-label-lg font-bold">{reservation.product}</p>
            <p className="text-body-md">
              {packs} · {date} · <span dir="ltr">{time}</span>
            </p>
            <ReservationBadge reservation={reservation} />
          </div>
          <img
            src={reservation.image}
            alt=""
            className="h-[110px] w-[150px] shrink-0 rounded-md object-cover"
          />
        </div>
      </div>
    </article>
  )
}
