import { Button } from '@/components/ui/Button'
import { toPersianDigits } from '@/lib/digits'
import { formatPrice } from '@/lib/format'
import { formatPickupDate, STATUS_LABELS } from '@/lib/vendorReservations'
import type { Reservation } from '@/lib/vendorReservations'

const tones = {
  pending_payment: 'bg-warning-subtle text-warning',
  paid: 'bg-primary-subtle text-primary',
  ready: 'bg-success-subtle text-success',
  completed: 'bg-success-subtle text-success',
  cancelled: 'bg-error-subtle text-error',
  expired: 'bg-surface-secondary text-text-secondary',
  no_show: 'bg-error-subtle text-error',
}
function ReservationBadge({ reservation }: { reservation: Reservation }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-sm px-2 py-1 text-caption font-semibold ${tones[reservation.status]}`}
    >
      {STATUS_LABELS[reservation.status]}
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
          <ReservationBadge reservation={reservation} />
          <div className="min-w-0 flex-1">
            <h3 className="text-title-md font-semibold">
              {reservation.customer ?? `سفارش ${reservation.id}`}
            </h3>
            <p className="text-body-md text-text-secondary">{reservation.product}</p>
            <p className="text-caption text-text-secondary">{reservation.storeName}</p>
          </div>
        </div>
        {reservation.image ? (
          <img src={reservation.image} alt="" className="h-24 w-full rounded-md object-cover" />
        ) : (
          <div
            className="h-24 w-full rounded-md bg-surface-secondary"
            role="img"
            aria-label="تصویر سفارش در پاسخ API موجود نیست"
          />
        )}
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
        <h3 className="text-label-lg font-bold">
          {reservation.customer ?? `سفارش ${reservation.id}`}
        </h3>
        <div className="flex items-center gap-6">
          <div className="flex w-50 shrink-0 flex-col gap-3">
            <p className="text-title-lg font-bold">{formatPrice(reservation.amount)}</p>
            <Button size="md" fullWidth onClick={() => onReview(reservation)}>
              بررسی تحویل
            </Button>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
            <p className="text-label-lg font-bold">{reservation.product}</p>
            <p className="text-body-md text-text-secondary">
              {reservation.storeName}
              {reservation.storeAddress ? ` · ${reservation.storeAddress}` : ''}
            </p>
            <p className="text-body-md">
              {packs} · {date} · <span dir="ltr">{time}</span>
            </p>
            <ReservationBadge reservation={reservation} />
          </div>
          {reservation.image ? (
            <img
              src={reservation.image}
              alt=""
              className="h-[110px] w-[150px] shrink-0 rounded-md object-cover"
            />
          ) : (
            <div
              className="h-[110px] w-[150px] shrink-0 rounded-md bg-surface-secondary"
              role="img"
              aria-label="تصویر سفارش در پاسخ API موجود نیست"
            />
          )}
        </div>
      </div>
    </article>
  )
}
