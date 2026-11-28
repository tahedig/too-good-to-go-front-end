import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, MapPin, Wheat } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { env } from '@/config/env'
import { ApiError } from '@/lib/api/client'
import { formatDateTime, formatNumber } from '@/lib/format'
import { storeService } from '@/services/storeService'
import type { VendorStore } from '@/types/storeTypes'

function StoreIdentity({ title }: { title: string }) {
  return (
    <div className="flex h-12 w-full items-center gap-3">
      <h2 className="flex-1 text-[20px] font-bold leading-7 text-text-primary">{title}</h2>
      <span className="grid size-12 place-items-center rounded-xl bg-surface-sage text-primary">
        <Wheat className="size-8" strokeWidth={1.5} aria-hidden="true" />
      </span>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-h-[22px] grid-cols-2 gap-3 text-[14px] leading-[22px]">
      <span className="text-right text-[13px] text-text-secondary">{label}</span>
      <span className="text-right font-medium text-text-primary">{value || '—'}</span>
    </div>
  )
}

function ApprovedStore({ store }: { store: VendorStore }) {
  const openDays = store.openingHours.filter((day) => day.enabled)
  const hoursSummary = openDays.length
    ? `${openDays[0].day} تا ${openDays.at(-1)?.day} · ${openDays[0].opensAt} تا ${openDays[0].closesAt}`
    : 'ساعت کاری ثبت نشده است.'

  return (
    <section className="order-1 flex min-w-0 flex-col gap-4 xl:order-2">
      <StoreIdentity title="فروشگاه تأییدشده" />
      <article className="flex flex-col gap-[14px] rounded-2xl border border-border-default bg-surface p-5">
        <div className="flex items-center gap-3">
          <h3 className="flex-1 text-[18px] font-bold leading-[29px] text-text-primary">
            {store.name}
          </h3>
          <StatusBadge
            status="approved"
            label="تأییدشده"
            compact
            showIcon={false}
            className="h-6 rounded-md font-medium"
          />
        </div>
        <div className="flex flex-col gap-5">
          <img
            src={store.images[0]?.url ?? '/vendor-bakery.jpg'}
            alt={`تصویر ${store.name}`}
            className="h-45 w-full rounded-xl object-cover"
          />
          <div className="flex flex-col gap-4">
            <DetailRow label="مالک" value={store.owner} />
            <DetailRow label="دسته‌بندی" value={store.category} />
            <DetailRow label="نشانی" value={store.address} />
            <DetailRow label="ثبت" value={formatDateTime(store.registeredAt).split('،')[0]} />
            <DetailRow label="ساعت کاری" value={hoursSummary} />
            <DetailRow label="محصولات" value={formatNumber(store.productsCount)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Link
            to={`/vendor/stores/${store.id}`}
            className="flex h-12 items-center justify-center rounded-[9px] border border-border-default bg-surface text-[14px] font-medium text-text-primary transition-colors hover:bg-surface-secondary"
          >
            مشخصات
          </Link>
          <button
            type="button"
            className="h-13 rounded-[10px] border-[1.5px] border-primary bg-surface px-6 text-[16px] text-primary"
          >
            غیرفعال‌سازی
          </button>
        </div>
      </article>
    </section>
  )
}

function StoreRequest({ store }: { store: VendorStore }) {
  return (
    <article className="overflow-hidden rounded-xl border border-border-default bg-surface pb-5">
      <div className="flex flex-col gap-[14px] p-5">
        <div className="flex items-center gap-3">
          <h3 className="flex-1 text-[18px] font-bold leading-[29px] text-text-primary">
            {store.name}
          </h3>
          <StatusBadge
            status={store.status}
            label={store.statusLabel}
            compact
            showIcon={false}
            className="min-h-[30px] rounded-md px-2"
          />
        </div>
        <DetailRow label="مالک" value={store.owner} />
        <DetailRow label="دسته‌بندی" value={store.category} />
        <DetailRow label="نشانی" value={store.address} />
        <DetailRow label="ثبت" value={formatDateTime(store.registeredAt).split('،')[0]} />
      </div>
      <div className="px-5">
        <Link
          to={`/vendor/stores/${store.id}`}
          className="flex h-13 items-center justify-center rounded-[10px] border-[1.5px] border-primary bg-surface text-[16px] text-primary"
        >
          مشاهده درخواست
        </Link>
      </div>
    </article>
  )
}

export default function StoresPage() {
  const [stores, setStores] = useState<VendorStore[] | null>(null)
  const [error, setError] = useState<{ status: number | null; message: string } | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [message, setMessage] = useState<string | null>(
    () => (location.state as { message?: string } | null)?.message ?? null,
  )

  useEffect(() => {
    const controller = new AbortController()
    storeService
      .list(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) {
          setStores(items)
          setError(null)
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError({
            status: reason instanceof ApiError ? reason.status : null,
            message: reason instanceof Error ? reason.message : 'دریافت فروشگاه‌ها ممکن نیست.',
          })
      })
    return () => controller.abort()
  }, [reloadKey])

  function retryLoad() {
    setStores(null)
    setError(null)
    setReloadKey((key) => key + 1)
  }

  useEffect(() => {
    if (location.state) window.history.replaceState({ ...window.history.state, usr: null }, '')
  }, [location.state])

  if (error) {
    const authError = error.status === 401 || error.status === 403
    return (
      <div className="p-4 lg:p-12">
        <div className="flex flex-col items-start gap-4">
          <InlineAlert tone={authError ? 'warning' : 'error'}>
            {error.status === 403
              ? 'این بخش فقط برای حساب فروشنده در دسترس است.'
              : error.status === 401
                ? 'برای مشاهدهٔ فروشگاه‌ها وارد حساب فروشنده شوید.'
                : error.message}
          </InlineAlert>
          <Button
            variant="secondary"
            onClick={() =>
              authError
                ? navigate(
                    `/vendor/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`,
                  )
                : retryLoad()
            }
          >
            {authError ? 'ورود با حساب فروشنده' : 'تلاش دوباره'}
          </Button>
        </div>
      </div>
    )
  }
  if (!stores)
    return (
      <p role="status" className="p-6">
        در حال دریافت فروشگاه‌ها...
      </p>
    )

  const displayedStores =
    import.meta.env.DEV && env.useMockApi && searchParams.get('state') === 'empty' ? [] : stores
  const approvedStores = displayedStores.filter((store) => store.status === 'approved')
  const pendingStores = displayedStores.filter((store) => store.status !== 'approved')

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-12">
      {message && (
        <div className="mx-auto w-full max-w-[1344px]">
          <InlineAlert tone="success">
            <div className="flex items-center justify-between gap-3">
              <span>{message}</span>
              <button type="button" onClick={() => setMessage(null)} aria-label="بستن پیام">
                ×
              </button>
            </div>
          </InlineAlert>
        </div>
      )}

      <header className="mx-auto flex w-full max-w-[1344px] flex-col gap-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="بازگشت"
            className="grid size-11 place-items-center rounded-[10px] border border-border-default bg-surface text-text-primary hover:bg-surface-secondary"
          >
            <ArrowRight className="size-6" strokeWidth={1.75} />
          </button>
          <h1 className="flex-1 text-[24px] font-bold leading-8 text-text-primary lg:text-[32px] lg:leading-[38px]">
            فروشگاه‌ها
          </h1>
        </div>
        {displayedStores.length > 0 && (
          <p className="text-[14px] leading-5 text-text-secondary">
            فروشگاه‌ها و درخواست‌های ثبت‌شده خود را مدیریت کنید.
          </p>
        )}
      </header>

      {displayedStores.length === 0 ? (
        <section className="mx-auto flex min-h-[460px] w-full max-w-[1344px] items-center justify-center lg:min-h-[640px]">
          <div className="flex w-full max-w-[560px] flex-col items-center gap-4 rounded-2xl bg-surface p-6 text-center">
            <div className="flex w-full items-center justify-center gap-3">
              <h2 className="text-[20px] font-normal leading-7 text-text-primary">
                هنوز فروشگاهی ثبت نکرده‌اید
              </h2>
              <MapPin className="size-6 text-primary" strokeWidth={1.75} />
            </div>
            <p className="text-[14px] leading-[21px] text-text-secondary">
              برای شروع فعالیت، اطلاعات اولین فروشگاه خود را ثبت کنید.
            </p>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => navigate('/vendor/stores/new')}
              className="h-13! rounded-[10px]!"
            >
              افزودن فروشگاه
            </Button>
          </div>
        </section>
      ) : (
        <>
          <div className="mx-auto flex h-13 w-full max-w-[1344px] justify-end">
            <Button
              onClick={() => navigate('/vendor/stores/new')}
              fullWidth
              className="h-13! rounded-[10px]! lg:w-[148px]!"
            >
              افزودن فروشگاه
            </Button>
          </div>
          <div className="mx-auto grid w-full max-w-[1344px] items-start gap-6 xl:grid-cols-[440px_minmax(0,1fr)] xl:[direction:ltr]">
            <section dir="rtl" className="order-2 flex min-w-0 flex-col gap-4 xl:order-1">
              <h2 className="text-[20px] font-bold leading-7 text-text-primary">
                درخواست‌های فروشگاه
              </h2>
              {pendingStores.map((store) => (
                <StoreRequest key={store.id} store={store} />
              ))}
            </section>
            <div dir="rtl" className="contents">
              {approvedStores.map((store) => (
                <ApprovedStore key={store.id} store={store} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
