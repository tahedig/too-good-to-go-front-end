import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { VendorReservationCard } from '@/components/vendor/VendorReservationCard'
import { formatPrice } from '@/lib/format'
import { toPersianDigits } from '@/lib/digits'
import { listReservations } from './data/reservations'
import { formatPickupDate, localDate, STATUS_LABELS } from '@/lib/vendorReservations'
import type { Reservation, ReservationStatus } from '@/lib/vendorReservations'

type Filter = 'all' | ReservationStatus
const FILTERS: { value: Filter; label: string; color: string }[] = [
  { value: 'all', label: 'همه', color: 'border-border-input' },
  { value: 'active', label: 'فعال', color: 'border-focus' },
  { value: 'pending', label: 'در انتظار تحویل', color: 'border-warning' },
  { value: 'delivered', label: 'تحویل‌شده', color: 'border-success' },
  { value: 'cancelled', label: 'لغوشده', color: 'border-error' },
]
function FilterButtons({
  value,
  onChange,
  daily,
}: {
  value: Filter
  onChange: (filter: Filter) => void
  daily: boolean
}) {
  return (
    <div
      role="group"
      aria-label="فیلتر وضعیت رزرو"
      className={`flex flex-wrap gap-2 ${daily ? 'lg:grid lg:grid-cols-5 lg:gap-3' : ''}`}
    >
      {FILTERS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`h-11 rounded-md border px-4 text-label-md transition-colors lg:h-12 ${value === option.value ? (daily ? 'border-primary bg-primary text-on-primary' : 'border-border-input bg-primary-subtle text-text-primary') : daily ? 'border-border-default bg-surface text-text-primary hover:bg-surface-secondary' : `${option.color} bg-surface text-text-primary hover:bg-surface-secondary`}`}
        >
          {daily && option.value === 'active' ? (
            <>
              <span className="lg:hidden">رزرو فعال</span>
              <span className="hidden lg:inline">فعال</span>
            </>
          ) : (
            option.label
          )}
        </button>
      ))}
    </div>
  )
}
function ReviewDialog({
  reservation,
  onClose,
}: {
  reservation: Reservation | null
  onClose: () => void
}) {
  return (
    <Modal
      open={!!reservation}
      onClose={onClose}
      title="بررسی تحویل"
      footer={
        <Button variant="secondary" fullWidth onClick={onClose}>
          بستن
        </Button>
      }
    >
      {reservation && (
        <div className="flex flex-col gap-3 text-body-md">
          <p className="text-label-lg">{reservation.customer}</p>
          <p>
            {reservation.product} · {toPersianDigits(reservation.quantity)} بسته
          </p>
          <p>تاریخ تحویل: {formatPickupDate(reservation.pickupDate)}</p>
          <p>
            ساعت تحویل:{' '}
            <span dir="ltr">
              {toPersianDigits(reservation.startTime)}–{toPersianDigits(reservation.endTime)}
            </span>
          </p>
          <p>وضعیت: {STATUS_LABELS[reservation.status]}</p>
          <p>مبلغ: {formatPrice(reservation.amount)}</p>
          <p className="rounded-md bg-primary-subtle p-3 text-text-primary">
            این اطلاعات آزمایشی است؛ ثبت یا تأیید واقعی تحویل هنوز متصل نشده است.
          </p>
        </div>
      )}
    </Modal>
  )
}
function DateControl({
  dates,
  selected,
  onChange,
}: {
  dates: string[]
  selected: string
  onChange: (date: string) => void
}) {
  return (
    <Select
      label="تاریخ تحویل"
      className="w-full lg:w-70"
      value={selected}
      onChange={(event) => onChange(event.target.value)}
      options={dates.map((date) => ({ value: date, label: formatPickupDate(date) }))}
    />
  )
}
function DailySummary({
  packs,
  delivered,
  amount,
}: {
  packs: number
  delivered: number
  amount: number
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-border-default bg-surface p-4 lg:hidden">
        <div className="p-3">
          <p className="text-caption text-text-secondary">تحویل‌شده</p>
          <p className="mt-1 text-title-md">{toPersianDigits(delivered)} بسته</p>
        </div>
        <div className="p-3">
          <p className="text-caption text-text-secondary">بسته‌های رزروشده</p>
          <p className="mt-1 text-title-md">{toPersianDigits(packs)} بسته</p>
        </div>
        <div className="col-span-2 p-3">
          <p className="text-caption text-text-secondary">جمع رزروها</p>
          <p className="mt-1 text-title-md">{formatPrice(amount)}</p>
        </div>
      </div>
      <div className="hidden grid-cols-3 gap-4 lg:grid">
        {[
          ['مبلغ رزروهای روز', formatPrice(amount)],
          ['تحویل‌شده', `${toPersianDigits(delivered)} بسته`],
          ['بسته‌های رزروشده', `${toPersianDigits(packs)} بسته`],
        ].map(([label, value]) => (
          <div key={label} className="flex min-w-0 flex-col gap-4 rounded-[12px] bg-surface p-5">
            <p className="text-label-lg font-bold">{label}</p>
            <p className="text-title-xl">{value}</p>
          </div>
        ))}
      </div>
    </>
  )
}
function ReservationsSummary({
  packs,
  delivered,
  amount,
  active,
}: {
  packs: number
  delivered: number
  amount: number
  active: number
}) {
  const stats = [
    ['بسته‌های رزروشده', `${toPersianDigits(packs)} بسته`],
    ['مبلغ رزروها', formatPrice(amount)],
    ['تحویل‌شده', toPersianDigits(delivered)],
  ]
  return (
    <>
      <div className="flex flex-col gap-3 lg:hidden">
        <h2 className="text-label-md">خلاصه رزروهای روز انتخاب‌شده</h2>
        <div className="flex flex-col gap-3 rounded-lg border border-border-default bg-surface p-4">
          {stats.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-2">
              <span className="text-body-md text-text-secondary">{label}</span>
              <span className="text-label-lg">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden items-center gap-4 rounded-lg border border-border-default bg-surface p-5 shadow-1 lg:flex">
        <div className="w-70 shrink-0">
          <p className="text-caption text-text-secondary">فروشگاه</p>
          <p className="text-label-lg">نان صبحگاهی</p>
          <p className="text-body-md text-text-secondary">تهران، خیابان ولیعصر، پلاک ۱۲</p>
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-4 xl:grid-cols-4">
          {[
            ['رزروهای فعال', `${toPersianDigits(active)} رزرو`],
            ['تحویل‌شده', toPersianDigits(delivered)],
            ['مبلغ کل رزروها', formatPrice(amount)],
            ['بسته‌های رزروشده', `${toPersianDigits(packs)} بسته`],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <p className="text-caption text-text-secondary">{label}</p>
              <p className="mt-1 text-title-md">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default function ReservationsPages({ daily = false }: { daily?: boolean }) {
  const [items, setItems] = useState<Reservation[] | null>(null)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<Reservation | null>(null)
  const [params, setParams] = useSearchParams()
  const date = params.get('date') || localDate()
  useEffect(() => {
    let live = true
    listReservations()
      .then((data) => {
        if (live) setItems(data)
      })
      .catch(() => {
        if (live) setError(true)
      })
    return () => {
      live = false
    }
  }, [])
  const dates = useMemo(
    () =>
      Array.from(new Set([localDate(), ...(items ?? []).map((item) => item.pickupDate)]))
        .sort()
        .reverse(),
    [items],
  )
  const selectedDate = dates.includes(date) ? date : localDate()
  const day = (items ?? []).filter((item) => item.pickupDate === selectedDate)
  const visible = day.filter((item) => filter === 'all' || item.status === filter)
  // Cancelled reservations contribute neither revenue nor reserved packages.
  const booked = day.filter((item) => item.status !== 'cancelled')
  const packs = booked.reduce((sum, item) => sum + item.quantity, 0)
  const delivered = day
    .filter((item) => item.status === 'delivered')
    .reduce((sum, item) => sum + item.quantity, 0)
  const amount = booked.reduce((sum, item) => sum + item.amount, 0)
  const active = day.filter((item) => item.status === 'active' || item.status === 'pending').length
  const dateControl = (
    <DateControl
      dates={dates}
      selected={selectedDate}
      onChange={(value) => setParams({ date: value })}
    />
  )
  const filters = <FilterButtons value={filter} onChange={setFilter} daily={daily} />
  return (
    <div
      className={`flex flex-col gap-5 p-4 pb-8 lg:gap-6 ${daily ? 'lg:p-12' : 'lg:px-20 lg:py-6'}`}
    >
      <header className={`flex flex-col gap-3 ${daily ? 'lg:gap-6' : ''}`}>
        <div
          className={
            daily ? 'flex flex-col gap-3 lg:flex-row lg:items-center' : 'flex flex-col gap-3'
          }
        >
          <Link
            to={daily ? '/vendor' : '/vendor/orders'}
            aria-label={daily ? 'بازگشت به داشبورد' : 'بازگشت به سفارشات'}
            className="grid size-11 place-items-center rounded-md border border-border-default bg-surface"
          >
            <ArrowRight size={24} strokeWidth={1.75} />
          </Link>
          <h1 className="text-title-xl lg:text-title-xl">{daily ? 'سفارشات' : 'رزروها'}</h1>
        </div>
        <p className="text-body-md text-text-secondary lg:text-body-lg">
          نان صبحگاهی ·{' '}
          <span className={daily ? 'lg:hidden' : ''}>تهران، خیابان ولیعصر، پلاک ۱۲</span>
          {daily && <span className="hidden lg:inline">{formatPickupDate(selectedDate)}</span>}
        </p>
      </header>
      {daily ? (
        <>
          <div className="flex flex-col gap-3">
            <div className="lg:hidden">{dateControl}</div>
            {filters}
            <div className="hidden lg:block">{dateControl}</div>
          </div>
          <DailySummary packs={packs} delivered={delivered} amount={amount} />
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:hidden">
            <h2 className="text-label-md">فیلترها</h2>
            {filters}
            {dateControl}
          </div>
          <ReservationsSummary
            packs={packs}
            delivered={delivered}
            amount={amount}
            active={active}
          />
          <div className="hidden flex-wrap items-end justify-between gap-4 lg:flex">
            {filters}
            {dateControl}
          </div>
        </>
      )}
      <section className="flex flex-col gap-4" aria-label="فهرست رزروها">
        <div className="flex items-center justify-between lg:hidden">
          <h2 className="text-label-lg">
            {daily ? 'رزروهای روز انتخاب‌شده' : 'سفارشات روز انتخاب‌شده'}
          </h2>
          <span className="text-body-md text-text-secondary">
            {toPersianDigits(visible.length)} رزرو
          </span>
        </div>
        {error ? (
          <p role="alert" className="rounded-lg bg-surface p-5">
            دریافت رزروها ممکن نیست.
          </p>
        ) : !items ? (
          <p role="status" className="rounded-lg bg-surface p-5">
            در حال دریافت رزروها...
          </p>
        ) : visible.length === 0 ? (
          <p
            role="status"
            className="rounded-lg border border-border-default bg-surface p-5 text-text-secondary"
          >
            برای این تاریخ و وضعیت رزروی پیدا نشد.
          </p>
        ) : (
          visible.map((reservation) => (
            <VendorReservationCard
              key={reservation.id}
              reservation={reservation}
              onReview={setSelected}
            />
          ))
        )}
      </section>
      {daily && (
        <Link
          to={`/vendor/orders/reservations?date=${selectedDate}`}
          className="flex h-13 w-full items-center justify-center rounded-md border-[1.5px] border-primary bg-surface text-label-lg hover:bg-primary-subtle lg:h-12 lg:w-60 lg:self-start"
        >
          همه رزروها
        </Link>
      )}
      <ReviewDialog reservation={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
