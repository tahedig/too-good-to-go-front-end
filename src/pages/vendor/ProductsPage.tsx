import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight, Heart, X } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Select } from '@/components/ui/Select'
import { VendorProductCard } from '@/components/vendor/VendorProductCard'
import { ApiError } from '@/lib/api/client'
import { vendorProductsService } from '@/services/vendor/productsService'
import type {
  VendorProductsLoadResult,
  VendorProductStoreSummary,
} from '@/services/vendor/productsService'

type StatusFilter = 'all' | 'active' | 'inactive' | 'draft' | 'ended'

const STATUS_OPTIONS = [
  { value: 'all', label: 'همه' },
  { value: 'active', label: 'فعال' },
  { value: 'inactive', label: 'غیرفعال' },
  { value: 'draft', label: 'پیش‌نویس' },
  { value: 'ended', label: 'پایان‌یافته' },
]

const ALL_OPTION = { value: 'all', label: 'همه' }

function StoreContextStrip({
  stores,
  pendingRequests,
}: {
  stores: VendorProductStoreSummary[]
  pendingRequests: VendorProductStoreSummary[]
}) {
  if (stores.length === 0 && pendingRequests.length === 0) return null

  return (
    <div className="hidden min-h-12 flex-row-reverse flex-wrap items-center justify-start gap-3 border-b border-border-default bg-surface px-8 py-1 lg:flex">
      {stores.map((store) => (
        <span
          key={store.id}
          className="flex h-10 items-center rounded-md border border-primary bg-primary-subtle px-4 text-label-md"
        >
          {store.name}
        </span>
      ))}
      {pendingRequests.map((request) => (
        <span
          key={request.id}
          className="flex h-10 items-center rounded-md border border-border-default bg-accent-subtle px-4 text-label-md text-warning"
        >
          {request.name} · {request.statusLabel}
        </span>
      ))}
    </div>
  )
}

function ProductsApiNotice({
  preview,
  catalogueSupported,
}: {
  preview: boolean
  catalogueSupported: boolean
}) {
  if (preview) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-primary-subtle px-4 py-3 text-body-md text-text-primary">
        <span>حالت پیش‌نمایش آزمایشی · تغییرات فقط در مرورگر ذخیره می‌شوند.</span>
        <ButtonLink to="/vendor/products" variant="secondary" size="sm">
          بازگشت به حالت سرور
        </ButtonLink>
      </div>
    )
  }

  return (
    <InlineAlert tone="info">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>
          {catalogueSupported
            ? 'بسته‌های فعال از سرویس فروشگاه‌ها خوانده می‌شوند؛ ثبت، ویرایش، حذف، پیش‌نویس و تغییر وضعیت انتشار محصول هنوز در API بک‌اند پیاده‌سازی نشده است.'
            : 'نمایش لیست بسته‌های فروشگاه در سرور به دیتابیس متصل است و API ثبت، ویرایش، حذف و انتشار محصول هنوز در بک‌اند پیاده‌سازی نشده است.'}
        </span>
        {import.meta.env.DEV && (
          <ButtonLink to="/vendor/products?preview=1" variant="secondary" size="sm">
            پیش‌نمایش مدیریت محصولات
          </ButtonLink>
        )}
      </div>
    </InlineAlert>
  )
}

function EmptyState({
  onCreate,
  message,
  actionError,
  storeSubtitle,
  preview,
  catalogueSupported,
  stores,
  pendingRequests,
}: {
  onCreate: () => void
  message: string | null
  actionError: string
  storeSubtitle: string
  preview: boolean
  catalogueSupported: boolean
  stores: VendorProductStoreSummary[]
  pendingRequests: VendorProductStoreSummary[]
}) {
  return (
    <>
      <StoreContextStrip stores={stores} pendingRequests={pendingRequests} />
      <div className="flex flex-col gap-4 p-4 lg:px-20 lg:py-6">
        {message && <InlineAlert tone="success">{message}</InlineAlert>}
        {actionError && <InlineAlert tone="error">{actionError}</InlineAlert>}
        <ProductsApiNotice preview={preview} catalogueSupported={catalogueSupported} />
        <h1 className="text-title-lg text-text-primary lg:text-title-xl">محصولات</h1>
        <p className="text-body-lg text-text-secondary">{storeSubtitle}</p>

        <div className="flex flex-col items-center gap-3 rounded-lg bg-surface p-6">
          <div className="flex w-full items-center gap-3">
            <Heart className="size-6 shrink-0 text-text-primary" strokeWidth={1.75} />
            <p className="flex-1 text-title-md font-normal text-text-primary">هنوز محصولی ندارید</p>
          </div>
          <p className="w-full text-body-md text-text-secondary">
            اولین محصول فروشگاه را اضافه کنید.
          </p>
        </div>

        <Button fullWidth onClick={onCreate}>
          ساخت محصول
        </Button>
      </div>
    </>
  )
}

export default function ProductsPage() {
  const [params] = useSearchParams()
  const preview = import.meta.env.DEV && params.get('preview') === '1'
  return <ProductsContent key={preview ? 'preview' : 'live'} preview={preview} />
}

function ProductsContent({ preview }: { preview: boolean }) {
  const previewSuffix = preview ? '?preview=1' : ''

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [storeFilter, setStoreFilter] = useState('all')
  const trackRef = useRef<HTMLDivElement>(null)
  const [showAll, setShowAll] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [result, setResult] = useState<VendorProductsLoadResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<{ status: number | null; message: string } | null>(
    null,
  )
  const [reloadKey, setReloadKey] = useState(0)
  const [unpublishId, setUnpublishId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [acting, setActing] = useState(false)
  const [message, setMessage] = useState<string | null>(
    () => (location.state as { message?: string } | null)?.message ?? null,
  )

  useEffect(() => {
    const controller = new AbortController()
    vendorProductsService
      .listWithContext({ preview, signal: controller.signal })
      .then((loaded) => {
        if (!controller.signal.aborted) {
          setResult(loaded)
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError({
            status: error instanceof ApiError ? error.status : null,
            message: error instanceof Error ? error.message : 'دریافت محصولات ممکن نیست.',
          })
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => {
      controller.abort()
    }
  }, [preview, reloadKey])

  function retryLoad() {
    setResult(null)
    setLoadError(null)
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  useEffect(() => {
    if (!location.state) return
    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: null,
    })
  }, [location.hash, location.pathname, location.search, location.state, navigate])

  const products = result?.products ?? null
  const stores = useMemo(() => result?.stores ?? [], [result])
  const pendingRequests = useMemo(() => result?.pendingRequests ?? [], [result])

  const categoryOptions = useMemo(
    () => [
      ALL_OPTION,
      ...Array.from(new Set((products ?? []).map((product) => product.category)))
        .sort()
        .map((value) => ({ value, label: value })),
    ],
    [products],
  )
  const storeOptions = useMemo(
    () => [
      ALL_OPTION,
      ...Array.from(
        new Set([
          ...stores.map((store) => store.name),
          ...(products ?? []).map((product) => product.store),
        ]),
      )
        .filter(Boolean)
        .sort()
        .map((value) => ({ value, label: value })),
    ],
    [products, stores],
  )

  if (loadError && !products) {
    const authError = loadError.status === 401 || loadError.status === 403
    return (
      <div className="flex flex-col items-start gap-4 p-4 lg:px-20 lg:py-8">
        <InlineAlert tone={authError ? 'warning' : 'error'}>
          {loadError.status === 403
            ? 'این بخش فقط برای حساب فروشنده در دسترس است.'
            : loadError.status === 401
              ? 'برای مشاهدهٔ محصولات وارد حساب فروشنده شوید.'
              : loadError.message}
        </InlineAlert>
        {authError ? (
          <ButtonLink
            to={`/vendor/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
            variant="secondary"
            size="md"
          >
            ورود با حساب فروشنده
          </ButtonLink>
        ) : (
          <Button variant="secondary" onClick={retryLoad}>
            تلاش دوباره
          </Button>
        )}
      </div>
    )
  }
  if (loading && !products)
    return (
      <p role="status" className="p-6">
        در حال دریافت محصولات...
      </p>
    )
  if (!products || !result) return null

  const storeSubtitle =
    stores.length > 0
      ? stores.map((store) => store.name).join(' · ')
      : pendingRequests.length > 0
        ? pendingRequests.map((req) => `${req.name} (${req.statusLabel})`).join(' · ')
        : 'فروشگاه‌های شما'

  if (products.length === 0)
    return (
      <EmptyState
        onCreate={() => navigate(`/vendor/products/new${previewSuffix}`)}
        message={message}
        actionError={actionError}
        storeSubtitle={storeSubtitle}
        preview={preview}
        catalogueSupported={result.catalogueSupported}
        stores={stores}
        pendingRequests={pendingRequests}
      />
    )

  const visibleProducts = products.filter((product) => {
    if (statusFilter === 'active' && product.status !== 'active') return false
    if (statusFilter === 'draft' && product.status !== 'draft') return false
    if (statusFilter === 'ended' && product.status !== 'ended') return false
    if (statusFilter === 'inactive' && product.status !== 'inactive') return false
    if (categoryFilter !== 'all' && product.category !== categoryFilter) return false
    if (storeFilter !== 'all' && product.store !== storeFilter) return false
    return true
  })

  async function unpublish() {
    if (!unpublishId || acting) return
    setActing(true)
    setActionError('')
    try {
      await vendorProductsService.unpublish(unpublishId, { preview })
      setResult((current) =>
        current
          ? {
              ...current,
              products: current.products.map((product) =>
                product.id === unpublishId ? { ...product, status: 'inactive' } : product,
              ),
            }
          : null,
      )
      setUnpublishId(null)
      setMessage('انتشار محصول لغو شد.')
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'لغو انتشار ممکن نیست. دوباره تلاش کنید.',
      )
    } finally {
      setActing(false)
    }
  }

  async function publish(id: string) {
    if (acting) return
    setActing(true)
    setActionError('')
    try {
      await vendorProductsService.publish(id, { preview })
      setResult((current) =>
        current
          ? {
              ...current,
              products: current.products.map((product) =>
                product.id === id ? { ...product, status: 'active' } : product,
              ),
            }
          : null,
      )
      setMessage('محصول منتشر شد.')
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'انتشار محصول ممکن نیست. دوباره تلاش کنید.',
      )
    } finally {
      setActing(false)
    }
  }

  function scrollTrack(direction: 'prev' | 'next') {
    const track = trackRef.current
    if (!track) return
    const step = 344 // 320px card + 24px gap
    track.scrollBy({ left: direction === 'next' ? -step : step, behavior: 'smooth' })
  }

  return (
    <>
      <StoreContextStrip stores={stores} pendingRequests={pendingRequests} />
      <div className="relative flex flex-col gap-6 p-4 lg:px-20 lg:py-6">
        {message && (
          <div
            role="status"
            className="absolute inset-x-4 top-4 z-10 flex items-center gap-3 rounded-md border border-border-default bg-surface p-4 shadow-3 lg:inset-x-auto lg:end-20 lg:top-20 lg:w-100"
          >
            <InlineAlert tone="success" className="flex-1 bg-surface p-0">
              {message}
            </InlineAlert>
            <Button
              variant="tertiary"
              size="sm"
              className="size-10! px-0!"
              aria-label="بستن پیام"
              onClick={() => setMessage(null)}
            >
              <X className="size-6" aria-hidden="true" />
            </Button>
          </div>
        )}
        <ProductsApiNotice preview={preview} catalogueSupported={result.catalogueSupported} />
        {actionError && <InlineAlert tone="error">{actionError}</InlineAlert>}
        <h1 className="text-title-xl text-text-primary lg:text-display-xl">محصولات</h1>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <Button
            fullWidth
            className="lg:w-auto"
            onClick={() => navigate(`/vendor/products/new${previewSuffix}`)}
          >
            ساخت محصول
          </Button>

          <div
            role="group"
            aria-label="فیلترهای محصولات"
            className="grid min-w-0 grid-cols-2 gap-3 lg:max-w-[684px] lg:flex-1 lg:grid-cols-3"
          >
            <Select
              variant="filter"
              className="min-w-0"
              label="دسته‌بندی"
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              options={categoryOptions}
            />
            <Select
              variant="filter"
              className="min-w-0"
              label="فروشگاه"
              value={storeFilter}
              onValueChange={setStoreFilter}
              options={storeOptions}
            />
            <Select
              variant="filter"
              className="hidden min-w-0 lg:order-first lg:flex"
              label="وضعیت محصول"
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>

        {/* Keep the mobile status shortcuts, with the same colors as the dropdown options. */}
        <div
          className="flex flex-col gap-2 lg:hidden"
          role="group"
          aria-labelledby="product-status-filter"
        >
          <p id="product-status-filter" className="text-label-md font-normal">
            وضعیت محصول
          </p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => {
              const active = statusFilter === option.value
              return (
                <Button
                  key={option.value}
                  variant="secondary"
                  size="sm"
                  aria-pressed={active}
                  onClick={() => setStatusFilter(option.value as StatusFilter)}
                  className={`h-11! border! text-text-primary! ${active ? 'bg-primary-subtle! hover:bg-primary-subtle! active:bg-primary-subtle!' : 'border-border-default! hover:bg-surface-secondary! active:bg-surface-secondary!'}`}
                >
                  {option.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Desktop carousel controls */}
        <div className="hidden items-center justify-between lg:flex">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => scrollTrack('prev')}
              disabled={showAll || visibleProducts.length === 0}
              aria-label="قبلی"
              className="size-10! border! border-border-default! px-0! hover:bg-surface-secondary!"
            >
              <ChevronRight className="size-5" strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => scrollTrack('next')}
              disabled={showAll || visibleProducts.length === 0}
              aria-label="بعدی"
              className="size-10! border! border-border-default! px-0! hover:bg-surface-secondary!"
            >
              <ChevronLeft className="size-5" strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => setShowAll((value) => !value)}
            aria-expanded={showAll}
            className="h-10! bg-primary-subtle! text-text-primary! hover:bg-surface-sage!"
          >
            {showAll ? 'نمایش چرخشی' : 'مشاهده همه'}
            <ChevronDown className="size-6 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          </Button>
        </div>

        {visibleProducts.length === 0 ? (
          <p role="status" className="rounded-lg bg-surface p-6 text-body-lg text-text-secondary">
            محصولی با این فیلترها پیدا نشد.
          </p>
        ) : (
          <div
            ref={trackRef}
            className={
              showAll
                ? 'flex flex-wrap gap-4 lg:gap-6'
                : 'flex items-stretch gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:gap-6'
            }
          >
            {visibleProducts.map((product) => (
              <VendorProductCard
                key={product.id}
                product={product}
                onEdit={() =>
                  navigate(
                    `/vendor/products/${encodeURIComponent(product.id)}/edit${previewSuffix}`,
                  )
                }
                onUnpublish={() => {
                  setActionError('')
                  setUnpublishId(product.id)
                }}
                onPublish={() => void publish(product.id)}
              />
            ))}
            {!showAll && (
              <Button
                variant="tertiary"
                onClick={() => setShowAll(true)}
                className="h-auto! min-h-[512px] w-50 flex-col gap-0! rounded-[12px]! bg-surface-sage! lg:min-h-[385px] lg:w-45"
              >
                <span className="text-label-lg text-text-primary">مشاهده همه</span>
                <span className="text-caption font-semibold text-text-primary">
                  همه محصولات فروشگاه
                </span>
              </Button>
            )}
          </div>
        )}

        <Button
          variant="tertiary"
          size="md"
          onClick={() => setShowAll((value) => !value)}
          aria-expanded={showAll}
          className="self-start px-0! text-label-lg! text-text-primary! lg:hidden"
        >
          {showAll ? 'نمایش چرخشی' : 'مشاهده همه'}
        </Button>
      </div>
      <ConfirmDialog
        className="!max-w-[560px] !rounded-lg"
        open={unpublishId !== null}
        onClose={() => setUnpublishId(null)}
        onConfirm={() => void unpublish()}
        title="انتشار محصول لغو شود؟"
        description="محصول از دید مشتریان پنهان می‌شود. رزروهای موجود معتبر می‌مانند و باید تحویل داده شوند."
        confirmLabel="لغو انتشار"
        cancelLabel="انصراف"
        tone="destructive"
        isLoading={acting}
        error={actionError}
      />
    </>
  )
}
