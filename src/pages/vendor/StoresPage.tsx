import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Package, Store, UserRound } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { ApiError } from '@/lib/api/client'
import { storeService } from '@/services/storeService'
import type { VendorStore } from '@/types/storeTypes'

function StoreCard({ store }: { store: VendorStore }) {
  const approved = store.status === 'approved'
  const badgeColor =
    store.status === 'approved'
      ? 'bg-success-subtle text-success'
      : store.status === 'rejected' || store.status === 'suspended'
        ? 'bg-error-subtle text-error'
        : 'bg-warning-subtle text-warning'

  return (
    <article className="overflow-hidden rounded-lg border border-border-default bg-surface shadow-1">
      <img
        src={store.images[0]?.url ?? '/vendor-bakery.jpg'}
        alt={`تصویر ${store.name}`}
        className="h-44 w-full object-cover lg:h-52"
      />
      <div className="flex flex-col gap-5 p-4 lg:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-caption text-text-secondary">فروشگاه</p>
            <h3 className="mt-1 text-title-md text-text-primary">{store.name}</h3>
            {store.branch && <p className="text-body-md text-text-secondary">{store.branch}</p>}
          </div>
          <span className={`rounded-full px-3 py-1 text-caption font-semibold ${badgeColor}`}>
            {store.statusLabel}
          </span>
        </div>

        <dl className="grid gap-3 border-t border-border-default pt-4 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-body-md text-text-secondary">
            <UserRound className="size-5 shrink-0" strokeWidth={1.75} />
            <dt className="sr-only">مالک</dt>
            <dd>{store.owner}</dd>
          </div>
          <div className="flex items-center gap-2 text-body-md text-text-secondary">
            <Store className="size-5 shrink-0" strokeWidth={1.75} />
            <dt className="sr-only">دسته‌بندی</dt>
            <dd>{store.category}</dd>
          </div>
          <div className="flex items-start gap-2 text-body-md text-text-secondary sm:col-span-2">
            <MapPin className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} />
            <dt className="sr-only">آدرس</dt>
            <dd>{store.address}</dd>
          </div>
          {approved && (
            <div className="flex items-center gap-2 text-body-md text-text-secondary">
              <Package className="size-5 shrink-0" strokeWidth={1.75} />
              <dt className="sr-only">محصولات</dt>
              <dd>{store.productsCount} محصول</dd>
            </div>
          )}
        </dl>

        <Link
          to={`/vendor/stores/${store.id}`}
          className="flex h-11 items-center justify-between rounded-md border border-primary px-4 text-label-md text-primary transition-colors hover:bg-primary-subtle"
        >
          <span>{approved ? 'مشاهده مشخصات' : 'مشاهده درخواست'}</span>
          <ArrowLeft className="size-5" strokeWidth={1.75} />
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
        if (controller.signal.aborted) return
        setError({
          status: reason instanceof ApiError ? reason.status : null,
          message: reason instanceof Error ? reason.message : 'دریافت فروشگاه‌ها ممکن نیست.',
        })
      })
    return () => {
      controller.abort()
    }
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
      <div className="flex flex-col items-start gap-4 p-4 lg:px-20 lg:py-8">
        <InlineAlert tone={authError ? 'warning' : 'error'}>
          {error.status === 403
            ? 'این بخش فقط برای حساب فروشنده در دسترس است.'
            : error.status === 401
              ? 'برای مشاهدهٔ فروشگاه‌ها وارد حساب فروشنده شوید.'
              : error.message}
        </InlineAlert>
        {authError ? (
          <ButtonLink to="/login?returnTo=%2Fvendor%2Fstores" variant="secondary" size="md">
            ورود با حساب فروشنده
          </ButtonLink>
        ) : (
          <Button variant="secondary" size="md" onClick={retryLoad}>
            تلاش دوباره
          </Button>
        )}
      </div>
    )
  }
  if (!stores)
    return (
      <p role="status" className="p-6">
        در حال دریافت فروشگاه‌ها...
      </p>
    )

  const approvedStores = stores.filter((store) => store.status === 'approved')
  const pendingStores = stores.filter((store) => store.status !== 'approved')

  return (
    <div className="flex flex-col gap-6 p-4 lg:px-20 lg:py-8">
      {message && (
        <InlineAlert tone="success">
          <div className="flex items-center justify-between gap-3">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage(null)} aria-label="بستن پیام">
              ×
            </button>
          </div>
        </InlineAlert>
      )}

      <div className="flex flex-col gap-2">
        <h1 className="text-title-xl text-text-primary lg:text-display-xl">فروشگاه‌ها</h1>
        <p className="text-body-md text-text-secondary">
          فروشگاه‌ها و درخواست‌های ثبت‌شده خود را مدیریت کنید.
        </p>
      </div>

      {stores && stores.length > 0 && (
        <div className="flex justify-start">
          <Button onClick={() => navigate('/vendor/stores/new')}>ثبت فروشگاه</Button>
        </div>
      )}

      {stores.length === 0 ? (
        <section className="flex min-h-96 flex-col items-center justify-center gap-4 rounded-lg bg-surface p-8 text-center">
          <Store className="size-10 text-primary" strokeWidth={1.5} />
          <h2 className="text-title-md text-text-primary">هنوز فروشگاهی ثبت نکرده‌اید</h2>
          <p className="max-w-md text-body-md text-text-secondary">
            پس از ثبت درخواست فروشگاه، وضعیت و مشخصات آن را از همین بخش پیگیری کنید.
          </p>
          <Button fullWidth className="sm:w-auto" onClick={() => navigate('/vendor/stores/new')}>
            ثبت فروشگاه
          </Button>
        </section>
      ) : (
        <div className="flex flex-col gap-8">
          {pendingStores.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-title-md text-text-primary">درخواست‌های فروشگاه</h2>
              <div className="grid gap-4 xl:grid-cols-2">
                {pendingStores.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            </section>
          )}

          {approvedStores.length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className="text-title-md text-text-primary">فروشگاه‌های من</h2>
              <div className="grid gap-4 xl:grid-cols-2">
                {approvedStores.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
