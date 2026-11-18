import { ArrowRight, Clock3, Package, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { VendorReservationCard } from '@/components/vendor/VendorReservationCard'
import { VendorReservationImage } from '@/components/vendor/VendorReservationImage'
import { toPersianDigits } from '@/lib/digits'
import { formatNumber, formatPrice } from '@/lib/format'
import { formatPickupDate, reservationCustomerLabel, STATUS_LABELS } from '@/lib/vendorReservations'
import type { Reservation } from '@/lib/vendorReservations'

const ALL_RESERVATIONS = '/vendor/orders/reservations'
const TITLE = 'نزدیک‌ترین رزرو'

type NearestProps = {
  reservation: Reservation | null
  availability: number | undefined
  reserved: number | null
  published: number | null
  emptyMessage: string
  loading: boolean
  onReview: (reservation: Reservation) => void
}

export function DashboardNearestReservation({
  reservation,
  availability,
  reserved,
  published,
  emptyMessage,
  loading,
  onReview,
}: NearestProps) {
  if (!reservation) {
    return (
      <section className="flex min-w-0 flex-col gap-3 rounded-lg border border-border-default bg-surface p-4 sm:max-lg:col-start-1 sm:max-lg:row-start-1 lg:gap-4 lg:p-6">
        <h2 className="text-title-md">{TITLE}</h2>
        <div
          className="flex flex-col items-center gap-2 rounded-md bg-surface-secondary px-4 py-6 text-center text-body-md text-text-secondary"
          aria-live="polite"
          aria-busy={loading}
        >
          <Package className="size-6" strokeWidth={1.75} aria-hidden="true" />
          <p>{emptyMessage}</p>
        </div>
        <ButtonLink to={ALL_RESERVATIONS} size="md" variant="secondary" className="lg:w-55">
          همه رزروها
        </ButtonLink>
      </section>
    )
  }

  const customer = reservationCustomerLabel(reservation)
  const packs = `${formatNumber(reservation.quantity)} بسته`
  const pickupDate = formatPickupDate(reservation.pickupDate)
  const time = (
    <bdi dir="ltr">
      {toPersianDigits(reservation.startTime)}–{toPersianDigits(reservation.endTime)}
    </bdi>
  )
  const amount = formatPrice(reservation.amount)
  const status = STATUS_LABELS[reservation.status]
  const inventory = [
    { label: 'موجود', count: availability },
    { label: 'رزرو', count: reserved },
    { label: 'منتشر', count: published },
  ]

  return (
    <section className="min-w-0 sm:max-lg:col-start-1 sm:max-lg:row-start-1">
      <div className="flex flex-col gap-3 rounded-lg border border-border-default bg-surface p-4 sm:hidden">
        <header className="flex items-center justify-between gap-3">
          <StatusBadge compact status="active" label={status} />
          <h2 className="text-title-md">{TITLE}</h2>
        </header>
        <div className="flex items-center gap-3">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-subtle"
            aria-hidden="true"
          >
            <UserRound className="size-6" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 wrap-anywhere">
            <h3 className="text-title-md">{reservation.product}</h3>
            <p className="mt-1 text-caption font-normal text-text-secondary">
              {customer} · {packs} · {pickupDate} · {time}
            </p>
          </div>
        </div>
        <dl className="flex flex-wrap items-center justify-between gap-x-2 rounded-lg bg-surface-sage p-3">
          <dt className="text-body-md text-text-secondary">مبلغ این رزرو</dt>
          <dd className="text-body-lg font-bold">{amount}</dd>
        </dl>
        <dl className="grid grid-cols-3 gap-3" aria-label="موجودی بستهٔ این رزرو">
          {inventory.map(({ label, count }) => (
            <div key={label} className="flex flex-col gap-1 rounded-lg bg-surface-sage p-3">
              <dt className="order-2 text-caption font-normal text-text-secondary">{label}</dt>
              <dd className="text-center text-title-md font-bold">
                {count == null ? '—' : formatNumber(count)}
              </dd>
            </div>
          ))}
        </dl>
        <Button variant="secondary" fullWidth onClick={() => onReview(reservation)}>
          بررسی تحویل
        </Button>
        <Link
          to={ALL_RESERVATIONS}
          className="flex min-h-6 items-center justify-between gap-2 rounded-sm text-label-md hover:underline"
        >
          <ArrowRight className="size-6" strokeWidth={1.75} aria-hidden="true" />
          همه رزروها
        </Link>
      </div>

      <div className="hidden flex-col gap-3 sm:flex lg:hidden">
        <h2 className="text-title-md">{TITLE}</h2>
        <VendorReservationCard compact reservation={reservation} onReview={onReview} />
        <ButtonLink to={ALL_RESERVATIONS} size="md" variant="secondary" fullWidth>
          همه رزروها
        </ButtonLink>
      </div>

      <div className="hidden flex-col gap-4 rounded-lg border border-border-default bg-surface p-6 lg:flex">
        <header className="flex min-h-7 items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-body-md text-text-secondary">
            <p>
              {pickupDate} · {time}
            </p>
            <Clock3
              className="size-6 shrink-0 text-text-primary"
              strokeWidth={1.75}
              aria-hidden="true"
            />
          </div>
          <h2 className="w-80 text-title-md">{TITLE}</h2>
        </header>
        <div className="grid grid-cols-[minmax(0,1fr)_11rem_minmax(0,1.65fr)] items-center gap-4 xl:grid-cols-[20rem_13.75rem_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-2 rounded-md border border-border-default bg-surface-sage p-4 wrap-anywhere">
            <p className="text-label-lg">{customer}</p>
            <p className="text-body-md text-text-secondary">
              {packs} · {amount}
            </p>
            <p className="text-body-md text-text-secondary">وضعیت: {status}</p>
          </div>
          <VendorReservationImage src={reservation.image} className="aspect-square w-full" />
          <h3 className="min-w-0 rounded-md border border-border-default bg-surface-sage p-4 text-title-md wrap-anywhere">
            {reservation.product}
          </h3>
        </div>
        <div className="flex items-start gap-3">
          <ButtonLink to={ALL_RESERVATIONS} size="md" variant="secondary" className="w-55">
            همه رزروها
          </ButtonLink>
          <Button className="w-55" onClick={() => onReview(reservation)}>
            بررسی تحویل
          </Button>
        </div>
      </div>
    </section>
  )
}
