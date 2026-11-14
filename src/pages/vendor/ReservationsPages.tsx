import { useEffect, useId, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { VendorReservationCard } from '@/components/vendor/VendorReservationCard'
import { formatPrice } from '@/lib/format'
import { toPersianDigits } from '@/lib/digits'
import { listReservations } from './data/reservations'
import { formatPickupDate, isValidDate, localDate, STATUS_LABELS } from '@/lib/vendorReservations'
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
function DateInput({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  const id = useId()
  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={id} className="text-label-md">
        تاریخ تحویل
      </label>
      <input
        id={id}
        type="date"
        min="0001-01-01"
        max="9999-12-31"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-13 w-full rounded-md border border-border-input bg-surface px-4 text-body-lg text-text-primary"
      />
    </div>
  )
}
function DateSearch({ initialDate }: { initialDate: string }) {
  const [date, setDate] = useState(initialDate)
  const navigate = useNavigate()
  return (
    <form
      className="flex flex-col gap-3 lg:flex-row lg:items-end"
      onSubmit={(event) => {
        event.preventDefault()
        if (date) navigate(`/vendor/orders/daily?date=${date}`)
      }}
    >
      <div className="w-full lg:w-70">
        <DateInput value={date} onChange={setDate} />
      </div>
      <Button type="submit" size="md" disabled={!date} className="lg:w-55">
        نمایش سفارشات روز
      </Button>
    </form>
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
          ['مبلغ رزروها', formatPrice(amount)],
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
        <h2 className="text-label-md">خلاصه رزروها</h2>
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

export default function ReservationsPages({
  view = 'reservations',
}: {
  view?: 'orders' | 'reservations' | 'daily'
}) {
  const [items, setItems] = useState<Reservation[] | null>(null)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<Reservation | null>(null)
  const [dateDialog, setDateDialog] = useState(false)
  const [draftDate, setDraftDate] = useState(localDate)
  const [params, setParams] = useSearchParams()
  const rawDate = params.get('date') ?? ''
  const validDate = isValidDate(rawDate) ? rawDate : ''
  const selectedDate =
    view === 'daily' ? validDate || localDate() : view === 'reservations' ? validDate : ''
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
  // Orders defaults to every date. Reservations can optionally be narrowed to a date.
  const scoped = (items ?? []).filter((item) => !selectedDate || item.pickupDate === selectedDate)
  const visible = scoped.filter((item) => filter === 'all' || item.status === filter)
  const booked = scoped.filter((item) => item.status !== 'cancelled')
  const packs = booked.reduce((sum, item) => sum + item.quantity, 0)
  const delivered = scoped
    .filter((item) => item.status === 'delivered')
    .reduce((sum, item) => sum + item.quantity, 0)
  const amount = booked.reduce((sum, item) => sum + item.amount, 0)
  const active = scoped.filter(
    (item) => item.status === 'active' || item.status === 'pending',
  ).length
  const noDayOrders = view === 'daily' && items !== null && !error && scoped.length === 0
  const filters = (
    <FilterButtons value={filter} onChange={setFilter} daily={view !== 'reservations'} />
  )
  const title = view === 'daily' ? 'سفارشات روز' : view === 'orders' ? 'سفارشات' : 'رزروها'
  function openDateDialog() {
    setDraftDate(selectedDate || localDate())
    setDateDialog(true)
  }
  return (
    <div
      className={`flex flex-col gap-5 p-4 pb-8 lg:gap-6 ${view === 'orders' ? 'lg:p-12' : 'lg:px-20 lg:py-6'}`}
    >
      <header className="flex flex-col gap-3">
        {!noDayOrders && (
          <Link
            to={view === 'orders' ? '/vendor' : '/vendor/orders'}
            aria-label={view === 'orders' ? 'بازگشت به داشبورد' : 'بازگشت به سفارشات'}
            className="grid size-11 place-items-center rounded-md border border-border-default bg-surface"
          >
            <ArrowRight size={24} strokeWidth={1.75} />
          </Link>
        )}
        <h1 className={view === 'daily' ? 'text-title-lg lg:text-title-xl' : 'text-title-xl'}>
          {title}
        </h1>
        <p className="text-body-lg text-text-secondary">
          نان صبحگاهی{view !== 'daily' && ' · تهران، خیابان ولیعصر، پلاک ۱۲'}
        </p>
      </header>
      {noDayOrders ? (
        <>
          <div className="flex flex-col gap-4 rounded-lg bg-surface p-4">
            <p className="text-label-lg">{formatPickupDate(selectedDate)}</p>
            <p className="text-body-lg">۰ رزرو · ۰ بسته · ۰ تحویل‌شده</p>
          </div>
          <div role="status" className="flex flex-col gap-3 rounded-lg bg-surface p-6">
            <div className="flex items-center gap-3">
              <Heart className="size-6 shrink-0" strokeWidth={1.75} />
              <p className="text-title-md font-normal">برای این تاریخ سفارشی ندارید</p>
            </div>
            <p className="text-body-md text-text-secondary">تاریخ دیگری را انتخاب کنید.</p>
          </div>
          <Button fullWidth onClick={openDateDialog}>
            تغییر تاریخ
          </Button>
          <Link
            to="/vendor/products"
            className="flex h-13 w-full items-center justify-center rounded-md border-[1.5px] border-primary bg-surface text-label-lg hover:bg-primary-subtle"
          >
            محصولات
          </Link>
        </>
      ) : (
        <>
          {view === 'orders' && (
            <>
              <DateSearch initialDate={localDate()} />
              {filters}
              <DailySummary packs={packs} delivered={delivered} amount={amount} />
            </>
          )}
          {view === 'reservations' && (
            <>
              <div className="flex flex-col gap-3 lg:hidden">
                <h2 className="text-label-md">فیلترها</h2>
                {filters}
              </div>
              <ReservationsSummary
                packs={packs}
                delivered={delivered}
                amount={amount}
                active={active}
              />
              <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between lg:gap-4">
                <div className="hidden lg:block">{filters}</div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="w-full sm:w-70">
                    <DateInput
                      value={selectedDate}
                      onChange={(value) => (value ? setParams({ date: value }) : setParams({}))}
                    />
                  </div>
                  {selectedDate && (
                    <Button variant="secondary" size="md" onClick={() => setParams({})}>
                      همه تاریخ‌ها
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
          {view === 'daily' && (
            <>
              <div className="flex flex-col gap-4 rounded-lg bg-surface p-4">
                <p className="text-label-lg">{formatPickupDate(selectedDate)}</p>
                <p className="text-body-lg">
                  {toPersianDigits(scoped.length)} رزرو · {toPersianDigits(packs)} بسته ·{' '}
                  {toPersianDigits(delivered)} تحویل‌شده
                </p>
              </div>
              <Button variant="secondary" size="md" className="self-start" onClick={openDateDialog}>
                تغییر تاریخ
              </Button>
              {filters}
            </>
          )}
          <section className="flex flex-col gap-4" aria-label="فهرست رزروها">
            <div className="flex items-center justify-between lg:hidden">
              <h2 className="text-label-lg">
                {view === 'daily' ? 'رزروهای این روز' : view === 'orders' ? 'سفارشات' : 'رزروها'}
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
                رزروی با این فیلترها پیدا نشد.
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
          {view === 'orders' && (
            <Link
              to="/vendor/orders/reservations"
              className="flex h-13 w-full items-center justify-center rounded-md border-[1.5px] border-primary bg-surface text-label-lg hover:bg-primary-subtle lg:h-12 lg:w-60 lg:self-start"
            >
              همه رزروها
            </Link>
          )}
        </>
      )}
      <ReviewDialog reservation={selected} onClose={() => setSelected(null)} />
      <Modal open={dateDialog} onClose={() => setDateDialog(false)} title="تغییر تاریخ">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!draftDate) return
            setParams({ date: draftDate })
            setFilter('all')
            setDateDialog(false)
          }}
        >
          <DateInput value={draftDate} onChange={setDraftDate} />
          <Button type="submit" fullWidth disabled={!draftDate}>
            نمایش سفارشات روز
          </Button>
        </form>
      </Modal>
    </div>
  )
}
