import { useEffect, useState } from 'react'
import { Store } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { VendorPickupDialog } from '@/components/vendor/VendorPickupDialog'
import { DashboardFinanceCard } from '@/features/vendor-dashboard/DashboardFinanceCard'
import { DashboardLoading } from '@/features/vendor-dashboard/DashboardLoading'
import { DashboardNearestReservation } from '@/features/vendor-dashboard/DashboardNearestReservation'
import { DashboardQuickActions } from '@/features/vendor-dashboard/DashboardQuickActions'
import { DashboardStoreRequest } from '@/features/vendor-dashboard/DashboardStoreRequest'
import { toPersianDigits } from '@/lib/digits'
import { formatNumber, formatPrice } from '@/lib/format'
import type { Reservation } from '@/lib/vendorReservations'
import { loadVendorDashboard } from '@/services/vendor/dashboardService'
import type { DashboardData } from '@/services/vendor/dashboardService'

const dashboardContent =
  'mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 pb-6 sm:gap-6 sm:p-8 lg:py-6 xl:px-20'

function countWithUnit(count: number | undefined, unit: string) {
  return count === undefined ? undefined : `${formatNumber(count)} ${unit}`
}

function DashboardStats({ data }: { data: DashboardData | null }) {
  const stores = data?.stores.ok ? data.stores.value : null
  const activeProducts = stores?.every((store) => Number.isSafeInteger(store.productsCount))
    ? stores.reduce((count, store) => count + (store.productsCount ?? 0), 0)
    : undefined
  const available = data?.inventory.ok ? data.inventory.value.available : undefined
  const reserved = data?.reservations.ok ? data.reservations.value.reserved : undefined
  const received = data?.finance?.received
  const stats = [
    { label: 'بسته‌های موجود', value: countWithUnit(available, 'بسته'), column: 'lg:col-start-3' },
    {
      label: 'محصولات فعال',
      value: countWithUnit(activeProducts, 'محصول'),
      column: 'lg:col-start-4',
    },
    {
      label: 'درآمد دریافت‌شده',
      value: received === undefined ? undefined : formatPrice(received),
      column: 'lg:col-start-1',
    },
    { label: 'بسته‌های رزروشده', value: countWithUnit(reserved, 'بسته'), column: 'lg:col-start-2' },
  ]

  return (
    <dl
      aria-label="خلاصه عملکرد فروشگاه"
      className="grid w-full grid-cols-2 gap-3 lg:max-w-[1020px] lg:grid-cols-4 xl:w-4/5"
    >
      {stats.map(({ label, value, column }) => (
        <div
          key={label}
          className={`flex min-h-20 min-w-0 flex-col justify-center gap-1 rounded-[12px] bg-surface p-4 lg:row-start-1 lg:min-h-[99px] lg:gap-2 ${column}`}
        >
          <dt className="text-caption font-normal leading-[19px] text-text-secondary">{label}</dt>
          <dd className="text-title-md leading-6 font-bold wrap-anywhere lg:text-[26px] lg:leading-10">
            {value ?? (
              <>
                <span aria-hidden="true">—</span>
                <span className="sr-only">در دسترس نیست</span>
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function DashboardOverview({ preview }: { preview: boolean }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [selected, setSelected] = useState<Reservation | null>(null)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    const load =
      import.meta.env.DEV && preview
        ? import('@/features/vendor-dashboard/previewData').then(({ previewData }) => previewData)
        : loadVendorDashboard(signal)
    load
      .then((nextData) => {
        if (!signal.aborted) setData(nextData)
      })
      .catch(() => {
        if (!signal.aborted) setLoadFailed(true)
      })
    return () => controller.abort()
  }, [preview, attempt])

  function reload() {
    setData(null)
    setLoadFailed(false)
    setAttempt((previous) => previous + 1)
  }

  const verifiedNotice = verified && <InlineAlert tone="success">تحویل بسته ثبت شد.</InlineAlert>
  if (!data && !loadFailed) {
    return (
      <div className={`${dashboardContent} pt-6`}>
        <DashboardLoading notice={verifiedNotice} />
      </div>
    )
  }

  const stores = data?.stores.ok ? data.stores.value : []
  const store = stores.length === 1 ? stores[0] : null
  const pendingStore = data?.pendingStore.ok ? data.pendingStore.value : null
  const reservations = data?.reservations.ok ? data.reservations.value : null
  const nearest = reservations?.nearest ?? null
  const availability =
    nearest?.offerId && data?.inventory.ok
      ? data.inventory.value.offers.find((offer) => offer.id === nearest.offerId)
          ?.quantity_available
      : undefined
  const stock = data?.inventory
  const orders = data?.reservations
  const sections = [data?.stores, data?.pendingStore, stock, orders]
  const authError = sections.some(
    (section) => section?.ok === false && (section.status === 401 || section.status === 403),
  )
  const wrongRole = sections.some((section) => section?.ok === false && section.status === 403)
  const ordersNotAvailable = orders?.ok === false && orders.status === 404
  const partialError =
    loadFailed ||
    sections.some((section) => section?.ok === false && (section !== orders || !ordersNotAvailable))
  const context = store
    ? [store.name, store.branch, toPersianDigits(store.address ?? '')].filter(Boolean).join(' · ')
    : stores.length > 1
      ? `${formatNumber(stores.length)} فروشگاه تأییدشده`
      : data?.stores.ok
        ? 'هنوز فروشگاه تأییدشده‌ای ندارید.'
        : 'اطلاعات فروشگاه در دسترس نیست.'
  const reservationMessage = ordersNotAvailable
    ? 'نمایش رزروها به نسخهٔ جدید API سفارشات فروشنده نیاز دارد.'
    : authError && !reservations
      ? 'برای دیدن رزروها وارد حساب فروشنده شوید.'
      : !reservations
        ? 'دریافت رزروها ممکن نیست.'
        : 'رزروی برای تحویل پیش‌رو ندارید.'

  return (
    <div className={`${dashboardContent} pt-4`}>
      <header className="flex flex-col gap-3">
        <h1 className="sr-only sm:not-sr-only sm:text-title-xl lg:text-display-xl">
          داشبورد فروشگاه
        </h1>
        <div className="flex items-center justify-between gap-2">
          <p className="ms-auto flex min-w-0 items-center gap-2 text-body-md text-text-secondary wrap-anywhere sm:ms-0 sm:text-body-lg">
            {store && (
              <Store
                className="hidden size-6 shrink-0 text-text-primary sm:block lg:hidden"
                strokeWidth={1.75}
                aria-hidden="true"
              />
            )}
            {store && <span className="hidden lg:inline">فروشگاه</span>}
            <span>{context}</span>
          </p>
          {preview && (
            <span className="shrink-0 rounded-sm bg-primary-subtle px-2 py-1 text-caption text-text-secondary">
              پیش‌نمایش
            </span>
          )}
        </div>
        <p className="self-start rounded-sm px-3 py-1 text-label-md sm:hidden" aria-hidden="true">
          ته‌دیگ
        </p>
      </header>

      {verifiedNotice}
      {authError ? (
        <InlineAlert tone="warning">
          <p>
            {wrongRole
              ? 'این داشبورد فقط برای حساب فروشنده در دسترس است.'
              : 'برای مشاهدهٔ داده‌های فروشگاه، وارد حساب فروشنده شوید.'}
          </p>
          <ButtonLink to="/login?returnTo=%2Fvendor" size="sm" variant="secondary" className="mt-2">
            ورود با حساب فروشنده
          </ButtonLink>
        </InlineAlert>
      ) : (
        partialError && (
          <InlineAlert tone="error">
            <p>دریافت بخشی از اطلاعات داشبورد ممکن نیست.</p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={reload}>
              تلاش دوباره
            </Button>
          </InlineAlert>
        )
      )}

      <DashboardStats data={data} />
      <DashboardQuickActions
        storeProfilePath={
          store && !preview ? `/vendor/stores/${encodeURIComponent(store.id)}` : '/vendor/stores'
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,356fr)_minmax(0,390fr)] sm:items-start sm:gap-6 lg:grid-cols-1">
        <DashboardFinanceCard finance={data?.finance ?? null} />
        <DashboardNearestReservation
          reservation={nearest}
          availability={availability}
          reserved={reservations?.reservedForNearestOffer ?? null}
          published={reservations?.publishedForNearestOffer ?? null}
          onReview={setSelected}
          emptyMessage={reservationMessage}
        />
      </div>

      {pendingStore && <DashboardStoreRequest request={pendingStore} preview={preview} />}
      <VendorPickupDialog
        reservation={selected}
        preview={preview}
        onClose={() => setSelected(null)}
        onVerified={() => {
          setSelected(null)
          setVerified(true)
          reload()
        }}
      />
    </div>
  )
}

export default function VendorDashboardPage() {
  const [params] = useSearchParams()
  const preview = import.meta.env.DEV && params.get('preview') === '1'
  return <DashboardOverview key={preview ? 'preview' : 'live'} preview={preview} />
}
