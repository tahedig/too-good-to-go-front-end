import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { Check, CheckCircle, Clock3, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Reservation } from '@/features/reservations/api/reservationApi'
import { formatDateTime, formatPrice } from '@/lib/format'

function isReservation(value: unknown): value is Reservation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  const store = record.store
  const offer = record.offer
  if (!store || typeof store !== 'object' || Array.isArray(store)) return false
  if (!offer || typeof offer !== 'object' || Array.isArray(offer)) return false
  const storeRecord = store as Record<string, unknown>
  const offerRecord = offer as Record<string, unknown>

  return (
    typeof record.id === 'string' &&
    typeof record.reference === 'string' &&
    typeof record.status === 'string' &&
    typeof record.status_label === 'string' &&
    typeof storeRecord.name === 'string' &&
    typeof storeRecord.pickup_address === 'string' &&
    typeof offerRecord.title === 'string' &&
    typeof offerRecord.quantity === 'number' &&
    typeof record.items_total === 'number' &&
    typeof record.service_fee === 'number' &&
    typeof record.total_amount === 'number'
  )
}

export default function ReservationConfirmationPage() {
  const navigate = useNavigate()
  const { reservationId = '' } = useParams()
  const location = useLocation()
  const locationState = location.state as { reservation?: unknown } | null
  const candidate = locationState?.reservation
  const reservation = isReservation(candidate) ? candidate : undefined

  if (!reservation || reservation.id !== reservationId) {
    return (
      <div dir="rtl" className="min-h-dvh bg-background px-4 pb-8 text-text-primary">
        <main className="mx-auto max-w-[430px] py-10">
          <h1 className="text-title-lg text-primary">اطلاعات رزرو در دسترس نیست</h1>
          <p className="mt-3 text-body-md text-text-secondary">
            این صفحه باید پس از ثبت موفق رزرو باز شود؛ امکان دریافت دوبارهٔ جزئیات از سرویس وجود
            ندارد.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex min-h-11 items-center text-label-md text-primary underline"
          >
            بازگشت به پیشنهادها
          </Link>
        </main>
      </div>
    )
  }

  const isConfirmed = reservation.status === 'paid' || reservation.status === 'ready'
  const pickupWindow =
    reservation.pickup_window ||
    [reservation.pickup_start, reservation.pickup_end]
      .filter((value): value is string => Boolean(value))
      .map(formatDateTime)
      .filter(Boolean)
      .join(' تا ')

  return (
    <div dir="rtl" className="min-h-dvh bg-background px-4 pb-8 text-text-primary">
      <main className="mx-auto max-w-[430px]">
        <header className="flex items-center gap-4 py-8">
          <div
            className={[
              'grid size-14 shrink-0 place-items-center rounded-2xl',
              isConfirmed ? 'bg-success-subtle text-primary' : 'bg-accent-subtle text-primary',
            ].join(' ')}
          >
            {isConfirmed ? (
              <CheckCircle className="size-8" strokeWidth={1.75} />
            ) : (
              <Clock3 className="size-8" strokeWidth={1.75} />
            )}
          </div>
          <h1 className="text-title-lg text-primary">
            {isConfirmed ? 'رزرو شما تأیید شد.' : 'رزرو شما ثبت شد.'}
          </h1>
        </header>

        <article className="rounded-2xl border border-border-default bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-caption text-text-secondary">
              کد رزرو: <bdi>{reservation.reference}</bdi>
            </p>
            <span
              className={[
                'inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-caption',
                isConfirmed ? 'bg-success-subtle text-primary' : 'bg-accent-subtle text-primary',
              ].join(' ')}
            >
              {reservation.status_label}
              {isConfirmed ? (
                <Check className="size-4" strokeWidth={1.75} />
              ) : (
                <Clock3 className="size-4" strokeWidth={1.75} />
              )}
            </span>
          </div>

          {reservation.offer.image_url ? (
            <img
              src={reservation.offer.image_url}
              alt={`${reservation.offer.title} از ${reservation.store.name}`}
              className="mt-4 aspect-[4/3] w-full rounded-lg object-cover"
            />
          ) : (
            <div
              role="img"
              aria-label={`تصویری برای ${reservation.offer.title} ثبت نشده است`}
              className="mt-4 aspect-[4/3] w-full rounded-lg bg-surface-secondary"
            />
          )}

          <h2 className="mt-5 text-title-lg text-primary">{reservation.offer.title}</h2>
          <p className="mt-2 text-body-md text-primary">
            {reservation.offer.quantity.toLocaleString('fa-IR')} بستهٔ{' '}
            {reservation.offer.category_name ?? 'غافلگیری'} · {formatPrice(reservation.items_total)}
          </p>

          <section
            aria-label="خلاصه هزینه"
            className="mt-5 space-y-3 border-t border-border-default pt-4"
          >
            <div className="flex items-center justify-between gap-4 text-body-md">
              <span>مبلغ بسته‌ها</span>
              <span>{formatPrice(reservation.items_total)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-body-md">
              <span>کارمزد خدمات</span>
              <span>{formatPrice(reservation.service_fee)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-title-md text-primary">
              <span>مبلغ نهایی</span>
              <span>{formatPrice(reservation.total_amount)}</span>
            </div>
          </section>

          {reservation.pickup_code && (
            <p className="mt-5 rounded-lg bg-success-subtle p-4 text-center text-label-lg text-primary">
              کد تحویل: <bdi>{reservation.pickup_code}</bdi>
            </p>
          )}

          <section aria-labelledby="pickup-window" className="mt-6">
            <h3 id="pickup-window" className="text-label-md text-primary">
              بازهٔ تحویل
            </h3>
            <p className="mt-2 flex items-center gap-2 text-body-md">
              <Clock3 className="size-6 shrink-0" strokeWidth={1.75} />
              {pickupWindow || 'زمان تحویل مشخص نشده است.'}
            </p>
            {reservation.cancellation_deadline && (
              <p className="mt-2 text-caption text-text-secondary">
                مهلت لغو تا {formatDateTime(reservation.cancellation_deadline)}
              </p>
            )}
          </section>

          <section aria-labelledby="pickup-location" className="mt-6">
            <h3 id="pickup-location" className="text-label-md text-primary">
              محل تحویل
            </h3>
            <p className="mt-2 flex items-center gap-2 text-body-md">
              <MapPin className="size-6 shrink-0" strokeWidth={1.75} />
              {reservation.store.pickup_address}
            </p>
            {reservation.store.pickup_instructions && (
              <p className="mt-2 text-caption text-text-secondary">
                {reservation.store.pickup_instructions}
              </p>
            )}
            <Link
              to="/map"
              className="mt-5 inline-flex h-13 w-full items-center justify-center rounded-md border-[1.5px] border-primary bg-surface text-label-md text-primary hover:bg-primary-subtle"
            >
              مسیریابی
            </Link>
          </section>
        </article>

        <section aria-labelledby="arrival-steps" className="mt-7">
          <h2 id="arrival-steps" className="mb-4 text-title-md text-primary">
            وقتی رسیدید
          </h2>
          <ol className="space-y-3">
            <li className="flex items-center gap-3 text-body-md">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-success-subtle text-label-md text-primary">
                ۱
              </span>
              بازهٔ تحویل: {pickupWindow || 'طبق زمان نمایش‌داده‌شده در رزرو'}
            </li>
            <li className="flex items-center gap-3 text-body-md">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-success-subtle text-label-md text-primary">
                ۲
              </span>
              به پیشخوان مراجعه و کد تحویل را نشان دهید.
            </li>
            <li className="flex items-center gap-3 text-body-md">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-success-subtle text-label-md text-primary">
                ۳
              </span>
              تحویل با تأیید فروشگاه انجام می‌شود.
            </li>
          </ol>
        </section>

        <Button fullWidth onClick={() => navigate('/')} className="mt-7">
          ادامهٔ اکتشاف
        </Button>
        <Link
          to="/orders"
          className="mt-4 flex min-h-11 items-center justify-center text-label-md text-primary underline"
        >
          مشاهدهٔ سفارش‌ها
        </Link>
      </main>
    </div>
  )
}
