import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  Clock3,
  Compass,
  MapPin,
  PackageCheck,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Modal } from '@/components/ui/Modal'
import { ApiError } from '@/lib/api/client'
import { formatPrice } from '@/lib/format'
import { orderService } from '@/services/orderService'
import type { OrderDto, OrderGroup, OrderStatus } from '@/types/orderTypes'

const orderFilters: Array<{ value: OrderGroup; label: string }> = [
  { value: 'all', label: 'همه' },
  { value: 'upcoming', label: 'در انتظار دریافت' },
  { value: 'past', label: 'سفارش‌های گذشته' },
]

const statusDetails: Record<OrderStatus, { label: string; className: string; Icon: LucideIcon }> = {
  pending_payment: {
    label: 'در انتظار پرداخت',
    className: 'bg-warning-subtle text-warning',
    Icon: Clock3,
  },
  paid: { label: 'پرداخت شده', className: 'bg-success-subtle text-success', Icon: Check },
  ready: { label: 'آماده دریافت', className: 'bg-success-subtle text-success', Icon: PackageCheck },
  completed: { label: 'تکمیل شده', className: 'bg-success-subtle text-success', Icon: Check },
  cancelled: { label: 'لغو شده', className: 'bg-error-subtle text-error', Icon: X },
  expired: { label: 'منقضی شده', className: 'bg-surface-secondary text-text-secondary', Icon: X },
  no_show: { label: 'دریافت نشده', className: 'bg-surface-secondary text-text-secondary', Icon: X },
}

const iranDateTime = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Tehran',
})

function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'زمان ثبت نشده'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'زمان نامشخص' : iranDateTime.format(date)
}

function pickupWindow(order: OrderDto): string {
  if (!order.pickup_start) return 'زمان دریافت مشخص نشده'
  const start = formatDateTime(order.pickup_start)
  if (!order.pickup_end) return start
  const end = formatDateTime(order.pickup_end)
  const startDate = new Date(order.pickup_start)
  const endDate = new Date(order.pickup_end)
  const sameDay =
    !Number.isNaN(startDate.getTime()) &&
    !Number.isNaN(endDate.getTime()) &&
    startDate.toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' }) ===
      endDate.toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' })

  return sameDay ? `${start} تا ${end.split('، ').at(-1) ?? end}` : `${start} تا ${end}`
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'برای مشاهده سفارش‌ها ابتدا وارد حساب کاربری خود شوید.'
    return error.message
  }
  if (error instanceof Error) return error.message
  return 'دریافت سفارش‌ها انجام نشد. لطفاً دوباره تلاش کنید.'
}

function CustomerHeader() {
  return (
    <>
      <div className="flex items-center justify-between gap-4 px-4 pb-4 pt-4 sm:hidden">
        <Link
          to="/"
          aria-label="بازگشت به اکتشاف"
          className="grid size-11 place-items-center rounded-md text-primary hover:bg-surface-secondary"
        >
          <ArrowRight strokeWidth={1.75} />
        </Link>
        <Link to="/" className="text-title-lg font-bold text-primary">
          ته‌دیگ
        </Link>
      </div>
      <header className="hidden h-20 items-center justify-between border-b border-border-default px-8 sm:flex">
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            aria-label="پروفایل"
            className="grid size-11 place-items-center rounded-md border border-border-default bg-surface text-primary hover:bg-surface-secondary"
          >
            <UserRound strokeWidth={1.75} />
          </Link>
          <span className="inline-flex min-h-11 items-center gap-2 px-2 text-body-md text-primary">
            <MapPin className="size-6" strokeWidth={1.75} />
            تهران، ولیعصر
          </span>
        </div>
        <Link to="/" className="text-title-xl font-bold text-primary">
          ته‌دیگ
        </Link>
      </header>
    </>
  )
}

function OrderCard({
  order,
  onViewDetails,
}: {
  order: OrderDto
  onViewDetails: (order: OrderDto) => void
}) {
  const status = statusDetails[order.status]
  const StatusIcon = status.Icon
  const quantity = order.items.reduce((total, item) => total + item.quantity, 0)

  return (
    <article className="rounded-2xl border border-border-default bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-caption text-text-secondary">شماره سفارش {order.id}</p>
        <span
          className={`inline-flex min-h-8 shrink-0 items-center gap-1 rounded-md px-2 text-caption ${status.className}`}
        >
          <StatusIcon className="size-4" strokeWidth={1.75} />
          {status.label}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="grid size-16 shrink-0 place-items-center rounded-lg bg-primary-subtle text-primary sm:size-20">
          <ShoppingBag className="size-7" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-title-sm text-primary">{order.store.name}</h3>
          <p className="mt-1 truncate text-body-md text-text-secondary">
            {order.items.map((item) => item.title).join('، ')}
          </p>
          <p className="mt-1 text-caption text-text-secondary">
            تعداد بسته: {quantity.toLocaleString('fa-IR')}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-border-default pt-4">
        <p className="flex items-center gap-2 text-body-md text-primary">
          <Clock3 className="size-5 shrink-0" strokeWidth={1.75} />
          <span>{pickupWindow(order)}</span>
        </p>
        <p className="flex items-center gap-2 text-body-md text-text-secondary">
          <PackageCheck className="size-5 shrink-0" strokeWidth={1.75} />
          مبلغ سفارش: {formatPrice(order.total_amount)}
        </p>
        <p className="text-caption text-text-secondary">
          ثبت سفارش: {formatDateTime(order.created_at)}
        </p>
      </div>

      {order.group === 'upcoming' && (
        <Button variant="secondary" fullWidth className="mt-4" onClick={() => onViewDetails(order)}>
          مشاهده جزئیات سفارش
        </Button>
      )}
    </article>
  )
}

function EmptyOrders() {
  return (
    <section className="mx-auto flex min-h-72 w-full max-w-[800px] flex-col items-center justify-center gap-5 rounded-2xl border border-border-default bg-surface px-5 py-10 text-center sm:min-h-80 sm:gap-6">
      <div className="grid size-16 place-items-center rounded-full bg-primary-subtle text-primary">
        <ShoppingBag className="size-8" strokeWidth={1.75} />
      </div>
      <div className="space-y-2">
        <h2 className="text-title-md text-primary sm:text-title-lg">اولین پیشنهاد خوبت منتظرته!</h2>
        <p className="mx-auto max-w-[700px] text-body-md text-text-secondary">
          هنوز سفارشی ثبت نکرده‌ای. پیشنهادهای خوشمزه‌ی اطرافت را ببین و اولین بسته‌ات را نجات بده.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex h-13 items-center justify-center gap-2 rounded-md bg-primary px-6 text-label-lg text-on-primary transition-colors hover:bg-primary-hover"
      >
        <Compass className="size-6" strokeWidth={1.75} />
        دیدن پیشنهادها
      </Link>
    </section>
  )
}

export default function OrdersPage() {
  const [selectedFilter, setSelectedFilter] = useState<OrderGroup>('all')
  const selectedFilterRef = useRef<OrderGroup>('all')
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [moreError, setMoreError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null)

  useEffect(() => {
    let active = true
    orderService
      .listMyOrders({ group: selectedFilter, limit: 20 })
      .then((response) => {
        if (!active) return
        setOrders(response.orders)
        setNextCursor(response.next_cursor)
        setLoadError('')
        setLoading(false)
      })
      .catch((error: unknown) => {
        if (!active) return
        setOrders([])
        setNextCursor(null)
        setLoadError(errorMessage(error))
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [retryCount, selectedFilter])

  const upcomingOrders = orders.filter((order) => order.group === 'upcoming')
  const pastOrders = orders.filter((order) => order.group === 'past')

  function changeFilter(filter: OrderGroup) {
    if (filter === selectedFilter) return
    selectedFilterRef.current = filter
    setLoading(true)
    setLoadingMore(false)
    setLoadError('')
    setMoreError('')
    setOrders([])
    setNextCursor(null)
    setSelectedFilter(filter)
  }

  async function loadNextPage() {
    if (!nextCursor || loadingMore) return
    const requestedFilter = selectedFilter
    setLoadingMore(true)
    setMoreError('')
    try {
      const response = await orderService.listMyOrders({
        group: selectedFilter,
        limit: 20,
        cursor: nextCursor,
      })
      if (selectedFilterRef.current !== requestedFilter) return
      setOrders((current) => {
        const ids = new Set(current.map((order) => order.id))
        const newOrders = response.orders.filter((order) => {
          if (ids.has(order.id)) return false
          ids.add(order.id)
          return true
        })
        return [...current, ...newOrders]
      })
      setNextCursor(response.next_cursor)
    } catch (error) {
      if (selectedFilterRef.current !== requestedFilter) return
      setMoreError(errorMessage(error))
    } finally {
      if (selectedFilterRef.current === requestedFilter) setLoadingMore(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <div className="min-w-0 flex-1">
          <CustomerHeader />

          <main className="mx-auto w-full max-w-[1180px] px-4 pb-32 pt-0 sm:px-6 sm:pb-12 lg:px-20 lg:pt-8">
            <div className="mb-5 flex items-center gap-3 sm:hidden">
              <h1 className="min-w-0 flex-1 text-title-xl text-primary">سفارشات</h1>
              <Link
                to="/"
                aria-label="بازگشت به اکتشاف"
                className="grid size-11 shrink-0 place-items-center rounded-md border border-border-default bg-surface text-primary hover:bg-surface-secondary"
              >
                <ArrowRight strokeWidth={1.75} />
              </Link>
            </div>

            <section aria-labelledby="orders-title">
              <header className="mb-6 hidden sm:block">
                <h1 id="orders-title" className="text-title-xl text-primary sm:text-display-xl">
                  سفارشات
                </h1>
              </header>

              <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {orderFilters.map((filter) => {
                  const active = selectedFilter === filter.value
                  return (
                    <button
                      key={filter.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => changeFilter(filter.value)}
                      className={[
                        'min-h-11 shrink-0 rounded-lg border px-4 text-label-md transition-colors',
                        active
                          ? 'border-primary bg-primary-subtle text-primary'
                          : 'border-border-input bg-surface text-primary hover:bg-surface-secondary',
                      ].join(' ')}
                    >
                      {filter.label}
                    </button>
                  )
                })}
              </div>

              {loadError ? (
                <div className="space-y-4">
                  <InlineAlert tone="error">{loadError}</InlineAlert>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setLoading(true)
                      setLoadError('')
                      setRetryCount((count) => count + 1)
                    }}
                  >
                    تلاش دوباره
                  </Button>
                </div>
              ) : loading ? (
                <p
                  role="status"
                  className="rounded-2xl border border-border-default bg-surface p-6 text-body-md text-text-secondary"
                >
                  در حال دریافت سفارش‌ها...
                </p>
              ) : orders.length === 0 ? (
                <EmptyOrders />
              ) : (
                <div className="space-y-8">
                  {selectedFilter !== 'past' && upcomingOrders.length > 0 && (
                    <section aria-labelledby="upcoming-orders-title" className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <h2
                          id="upcoming-orders-title"
                          className="text-title-md text-primary sm:text-title-lg"
                        >
                          سفارش‌های در انتظار دریافت
                        </h2>
                        <p className="text-caption text-text-secondary">
                          {upcomingOrders.length.toLocaleString('fa-IR')} سفارش
                        </p>
                      </div>
                      <div className="grid gap-4 xl:grid-cols-2">
                        {upcomingOrders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            onViewDetails={setSelectedOrder}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {selectedFilter !== 'upcoming' && pastOrders.length > 0 && (
                    <section aria-labelledby="past-orders-title" className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <h2
                          id="past-orders-title"
                          className="text-title-md text-primary sm:text-title-lg"
                        >
                          سفارش‌های گذشته
                        </h2>
                        <p className="text-caption text-text-secondary">
                          {pastOrders.length.toLocaleString('fa-IR')} سفارش
                        </p>
                      </div>
                      <div className="grid gap-4 xl:grid-cols-2">
                        {pastOrders.map((order) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            onViewDetails={setSelectedOrder}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {moreError && <InlineAlert tone="error">{moreError}</InlineAlert>}
                  {nextCursor && (
                    <Button
                      variant="secondary"
                      fullWidth
                      isLoading={loadingMore}
                      onClick={loadNextPage}
                    >
                      بارگذاری سفارش‌های بیشتر
                    </Button>
                  )}
                </div>
              )}
            </section>

            <footer className="mt-10 hidden items-center justify-between border-t border-border-default pt-5 text-caption text-text-secondary sm:flex">
              <span>ته‌دیگ · غذای خوب، دورریز کمتر.</span>
              <a
                href="mailto:support@example.com"
                className="inline-flex items-center gap-2 hover:text-primary"
              >
                راهنمایی و پشتیبانی
              </a>
            </footer>
          </main>
        </div>
      </div>
      <Modal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title="جزئیات سفارش"
        description="جزئیات سفارش ثبت‌شده"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-surface-secondary p-4">
              <div className="grid size-16 shrink-0 place-items-center rounded-md bg-primary-subtle text-primary">
                <ShoppingBag className="size-7" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-title-sm text-primary">{selectedOrder.store.name}</h3>
                <p className="mt-1 text-body-md text-text-secondary">
                  شماره سفارش {selectedOrder.id}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-label-md text-primary">اقلام سفارش</h4>
              {selectedOrder.items.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className="flex items-start justify-between gap-4 text-body-md"
                >
                  <span>
                    {item.title} × {item.quantity.toLocaleString('fa-IR')}
                  </span>
                  <span className="shrink-0">{formatPrice(item.unit_price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <p className="text-body-md text-text-primary">
              زمان دریافت: <strong>{pickupWindow(selectedOrder)}</strong>
            </p>
            <p className="text-body-md text-text-secondary">
              نشانی فروشگاه: {selectedOrder.store.pickup_address}
            </p>
            <div className="space-y-2 border-t border-border-default pt-4 text-body-md">
              <p className="flex justify-between gap-3">
                <span>جمع اقلام</span>
                <span>{formatPrice(selectedOrder.items_total)}</span>
              </p>
              <p className="flex justify-between gap-3">
                <span>هزینه خدمات</span>
                <span>{formatPrice(selectedOrder.service_fee)}</span>
              </p>
              <p className="flex justify-between gap-3 font-semibold text-primary">
                <span>مبلغ کل</span>
                <span>{formatPrice(selectedOrder.total_amount)}</span>
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
