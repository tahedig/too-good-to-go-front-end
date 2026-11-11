import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Bookmark,
  Check,
  Clock3,
  Compass,
  MapPin,
  PackageCheck,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { discoveryOffers } from '@/features/discovery/mockData'
import { formatPrice } from '@/lib/format'

type OrderStatus = 'reserved' | 'completed' | 'cancelled'
type OrderFilter = 'all' | 'upcoming' | 'past'

interface CustomerOrder {
  id: string
  offerId: string
  status: OrderStatus
  quantity: number
  placedAt: string
  pickup: string
}

const demoOrders: CustomerOrder[] = [
  {
    id: 'TG-2048',
    offerId: 'morning-bakery',
    status: 'reserved',
    quantity: 1,
    placedAt: 'امروز، ساعت ۱۴:۳۲',
    pickup: 'امروز، ۱۸:۰۰ تا ۱۹:۰۰',
  },
  {
    id: 'TG-1985',
    offerId: 'green-kitchen',
    status: 'completed',
    quantity: 1,
    placedAt: 'دیروز، ساعت ۱۳:۱۵',
    pickup: 'دیروز، ۱۹:۰۰ تا ۲۰:۰۰',
  },
  {
    id: 'TG-1921',
    offerId: 'corner-cafe',
    status: 'cancelled',
    quantity: 2,
    placedAt: '۲۸ مهر ۱۴۰۵',
    pickup: '۲۸ مهر، ۱۷:۳۰ تا ۱۸:۳۰',
  },
]

const orderFilters: Array<{ value: OrderFilter; label: string }> = [
  { value: 'all', label: 'همه' },
  { value: 'upcoming', label: 'در انتظار دریافت' },
  { value: 'past', label: 'سفارش‌های گذشته' },
]

const statusDetails: Record<OrderStatus, { label: string; className: string; Icon: typeof Check }> =
  {
    reserved: { label: 'رزرو شده', className: 'bg-success-subtle text-primary', Icon: Check },
    completed: { label: 'تکمیل شده', className: 'bg-success-subtle text-primary', Icon: Check },
    cancelled: { label: 'لغو شده', className: 'bg-error-subtle text-error', Icon: X },
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
            to="/profile"
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

function CustomerSidebar() {
  const navClass = 'flex items-center gap-3 rounded-md px-4 py-3 text-body-md transition-colors'

  return (
    <aside className="sticky top-0 hidden h-screen w-65 shrink-0 flex-col border-e border-border-default bg-background px-6 py-8 lg:flex">
      <Link to="/" className="mb-10 px-4 text-title-xl font-bold text-primary">
        ته‌دیگ
      </Link>
      <nav aria-label="ناوبری مشتری" className="flex flex-col gap-2">
        <Link
          to="/"
          className={`${navClass} text-text-secondary hover:bg-surface-secondary hover:text-primary`}
        >
          <Compass className="size-6" strokeWidth={1.75} />
          اکتشاف
        </Link>
        <Link
          to="/favorites"
          className={`${navClass} text-text-secondary hover:bg-surface-secondary hover:text-primary`}
        >
          <Bookmark className="size-6" strokeWidth={1.75} />
          ذخیره‌ها
        </Link>
        <Link
          to="/orders"
          aria-current="page"
          className={`${navClass} bg-primary-subtle font-semibold text-primary`}
        >
          <ShoppingBag className="size-6" strokeWidth={1.75} />
          سفارشات
        </Link>
        <Link
          to="/profile"
          className={`${navClass} text-text-secondary hover:bg-surface-secondary hover:text-primary`}
        >
          <UserRound className="size-6" strokeWidth={1.75} />
          پروفایل
        </Link>
      </nav>
      <a
        href="mailto:support@example.com"
        className="mt-auto px-4 py-3 text-body-md text-text-secondary"
      >
        راهنمایی و پشتیبانی
      </a>
    </aside>
  )
}

function MobileNavigation() {
  const itemClass =
    'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md py-2 text-caption'

  return (
    <nav
      aria-label="ناوبری پایین"
      className="fixed inset-x-0 bottom-0 z-30 flex h-24 items-start gap-1 border-t border-border-default bg-surface px-2 pt-1 pb-7 sm:hidden"
    >
      <Link to="/" className={`${itemClass} text-text-secondary`}>
        <Compass className="size-6" strokeWidth={1.75} />
        اکتشاف
      </Link>
      <Link to="/favorites" className={`${itemClass} text-text-secondary`}>
        <Bookmark className="size-6" strokeWidth={1.75} />
        ذخیره‌ها
      </Link>
      <Link to="/orders" aria-current="page" className={`${itemClass} font-semibold text-primary`}>
        <ShoppingBag className="size-6" strokeWidth={1.75} />
        سفارشات
      </Link>
      <Link to="/profile" className={`${itemClass} text-text-secondary`}>
        <UserRound className="size-6" strokeWidth={1.75} />
        پروفایل
      </Link>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-2 mx-auto h-1 w-[134px] rounded-full bg-primary"
      />
    </nav>
  )
}

function OrderCard({
  order,
  onViewDetails,
}: {
  order: CustomerOrder
  onViewDetails: (orderId: string) => void
}) {
  const offer = discoveryOffers.find((item) => item.id === order.offerId)
  if (!offer) return null

  const status = statusDetails[order.status]
  const StatusIcon = status.Icon

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
        <img
          src={offer.imageSrc}
          alt=""
          className="size-16 shrink-0 rounded-lg bg-surface-secondary object-cover sm:size-20"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-title-sm text-primary">{offer.merchantName}</h3>
          <p className="mt-1 truncate text-body-md text-text-secondary">
            {offer.category} · ولیعصر
          </p>
          <p className="mt-1 text-caption text-text-secondary">
            تعداد بسته: {order.quantity.toLocaleString('fa-IR')}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-border-default pt-4">
        <p className="flex items-center gap-2 text-body-md text-primary">
          <Clock3 className="size-5 shrink-0" strokeWidth={1.75} />
          <span>{order.pickup}</span>
        </p>
        <p className="flex items-center gap-2 text-body-md text-text-secondary">
          <PackageCheck className="size-5 shrink-0" strokeWidth={1.75} />
          پرداخت‌شده: {formatPrice(offer.price * order.quantity)}
        </p>
        <p className="text-caption text-text-secondary">ثبت سفارش: {order.placedAt}</p>
      </div>

      {order.status === 'reserved' && (
        <Button
          variant="secondary"
          fullWidth
          className="mt-4"
          onClick={() => onViewDetails(order.id)}
        >
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
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [selectedFilter, setSelectedFilter] = useState<OrderFilter>('all')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const isEmptyPreview = searchParams.get('empty') === 'true'
  const selectedOrder = demoOrders.find((order) => order.id === selectedOrderId)
  const selectedOffer = selectedOrder
    ? discoveryOffers.find((offer) => offer.id === selectedOrder.offerId)
    : undefined

  const visibleOrders = useMemo(() => {
    if (selectedFilter === 'upcoming')
      return demoOrders.filter((order) => order.status === 'reserved')
    if (selectedFilter === 'past') return demoOrders.filter((order) => order.status !== 'reserved')
    return demoOrders
  }, [selectedFilter])

  const emptyState = isEmptyPreview || visibleOrders.length === 0

  return (
    <div dir="rtl" className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <CustomerSidebar />
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
                      onClick={() => setSelectedFilter(filter.value)}
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

              {emptyState ? (
                <EmptyOrders />
              ) : (
                <div className="space-y-8">
                  {selectedFilter !== 'past' &&
                    visibleOrders.some((order) => order.status === 'reserved') && (
                      <section aria-labelledby="upcoming-orders-title" className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <h2
                            id="upcoming-orders-title"
                            className="text-title-md text-primary sm:text-title-lg"
                          >
                            سفارش‌های در انتظار دریافت
                          </h2>
                          <p className="text-caption text-text-secondary">
                            {visibleOrders
                              .filter((order) => order.status === 'reserved')
                              .length.toLocaleString('fa-IR')}{' '}
                            سفارش
                          </p>
                        </div>
                        <div className="grid gap-4 xl:grid-cols-2">
                          {visibleOrders
                            .filter((order) => order.status === 'reserved')
                            .map((order) => (
                              <OrderCard
                                key={order.id}
                                order={order}
                                onViewDetails={setSelectedOrderId}
                              />
                            ))}
                        </div>
                      </section>
                    )}

                  {selectedFilter !== 'upcoming' &&
                    visibleOrders.some((order) => order.status !== 'reserved') && (
                      <section aria-labelledby="past-orders-title" className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <h2
                            id="past-orders-title"
                            className="text-title-md text-primary sm:text-title-lg"
                          >
                            سفارش‌های گذشته
                          </h2>
                          <p className="text-caption text-text-secondary">
                            {visibleOrders
                              .filter((order) => order.status !== 'reserved')
                              .length.toLocaleString('fa-IR')}{' '}
                            سفارش
                          </p>
                        </div>
                        <div className="grid gap-4 xl:grid-cols-2">
                          {visibleOrders
                            .filter((order) => order.status !== 'reserved')
                            .map((order) => (
                              <OrderCard
                                key={order.id}
                                order={order}
                                onViewDetails={setSelectedOrderId}
                              />
                            ))}
                        </div>
                      </section>
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
      <MobileNavigation />
      <Modal
        open={Boolean(selectedOrder && selectedOffer)}
        onClose={() => setSelectedOrderId(null)}
        title="جزئیات سفارش"
        description="این سفارش نمونه است و برای نمایش مراحل دریافت استفاده می‌شود."
      >
        {selectedOrder && selectedOffer && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-surface-secondary p-4">
              <img
                src={selectedOffer.imageSrc}
                alt=""
                className="size-16 rounded-md object-cover"
              />
              <div>
                <h3 className="text-title-sm text-primary">{selectedOffer.merchantName}</h3>
                <p className="mt-1 text-body-md text-text-secondary">
                  شماره سفارش {selectedOrder.id}
                </p>
              </div>
            </div>
            <p className="text-body-md text-text-primary">
              برای دریافت بسته در بازه‌ی <strong>{selectedOrder.pickup}</strong> به فروشگاه مراجعه
              کن.
            </p>
            <p className="text-caption text-text-secondary">
              نمونه‌ی نمایشی · رزرو یا پرداخت واقعی انجام نشده است.
            </p>
            <Button fullWidth onClick={() => navigate('/')}>
              دیدن پیشنهادهای دیگر
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
