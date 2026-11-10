import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { productRepository } from './data/products'
import { ChevronDown, ChevronLeft, ChevronRight, Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Select } from '@/components/ui/Select'
import { VendorProductCard } from './components/VendorProductCard'
import type { VendorProduct } from './components/VendorProductCard'

type StatusFilter = 'all' | 'active' | 'inactive' | 'draft' | 'ended'

const STATUS_OPTIONS = [
  { value: 'all', label: 'همه' },
  { value: 'active', label: 'فعال' },
  { value: 'inactive', label: 'غیرفعال' },
  { value: 'draft', label: 'پیش‌نویس' },
  { value: 'ended', label: 'پایان‌یافته' },
]

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'همه' },
  { value: 'نانوایی', label: 'نانوایی' },
]

const STORE_OPTIONS = [
  { value: 'all', label: 'همه' },
  { value: 'نان صبحگاهی', label: 'نان صبحگاهی' },
]

function MobileFilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="relative flex h-[46px] min-w-0 flex-1 items-center rounded-[12px] border border-primary bg-surface px-3 focus-within:outline-3 focus-within:outline-focus focus-within:outline-offset-2">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full w-full appearance-none bg-transparent pe-6 text-start text-label-md font-bold text-text-primary focus-visible:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute end-3 size-6 shrink-0 text-text-primary"
        strokeWidth={1.75}
      />
    </label>
  )
}

function EmptyState({ onCreate, message }: { onCreate: () => void; message: string | null }) {
  return (
    <div className="flex flex-col gap-4 p-4 lg:px-20 lg:py-6">
      {message && <InlineAlert tone="success">{message}</InlineAlert>}
      <h1 className="text-title-lg text-text-primary lg:text-title-xl">محصولات</h1>
      <p className="text-body-lg text-text-secondary">نان صبحگاهی</p>

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
  )
}

export default function ProductsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [storeFilter, setStoreFilter] = useState('all')
  const trackRef = useRef<HTMLDivElement>(null)
  const [showAll, setShowAll] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [products, setProducts] = useState<VendorProduct[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [unpublishId, setUnpublishId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [acting, setActing] = useState(false)
  const [message, setMessage] = useState<string | null>(
    () => (location.state as { message?: string } | null)?.message ?? null,
  )
  useEffect(() => {
    let mounted = true
    productRepository
      .list()
      .then((items) => {
        if (mounted) setProducts(items)
      })
      .catch(() => {
        if (mounted) setLoadError('دریافت محصولات ممکن نیست.')
      })
    return () => {
      mounted = false
    }
  }, [])
  useEffect(() => {
    if (location.state) window.history.replaceState({ ...window.history.state, usr: null }, '')
  }, [location.state])

  if (loadError)
    return (
      <p role="alert" className="p-6 text-error">
        {loadError}
      </p>
    )
  if (!products)
    return (
      <p role="status" className="p-6">
        در حال دریافت محصولات...
      </p>
    )
  if (products.length === 0)
    return <EmptyState onCreate={() => navigate('/vendor/products/new')} message={message} />

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
      await productRepository.unpublish(unpublishId)
      setProducts(await productRepository.list())
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

  function scrollTrack(direction: 'prev' | 'next') {
    const track = trackRef.current
    if (!track) return
    const step = 344 // 320px card + 24px gap
    track.scrollBy({ left: direction === 'next' ? -step : step, behavior: 'smooth' })
  }

  return (
    <>
      <div className="hidden h-12 flex-row-reverse items-center justify-start gap-3 border-b border-border-default bg-surface px-8 lg:flex">
        <span className="flex h-10 items-center rounded-md border border-primary bg-primary-subtle px-4 text-label-md">
          نان صبحگاهی
        </span>
        <span className="flex h-10 items-center rounded-md border border-border-default bg-accent-subtle px-4 text-label-md text-warning">
          شعبه شریعتی · در انتظار بررسی
        </span>
      </div>
      <div className="relative flex flex-col gap-6 p-4 lg:px-20 lg:py-6">
        {message && (
          <div
            role="status"
            className="absolute inset-x-4 top-4 z-10 flex items-center gap-3 rounded-md border border-border-default bg-surface p-4 shadow-3 lg:inset-x-auto lg:end-20 lg:top-20 lg:w-100"
          >
            <InlineAlert tone="success" className="flex-1 bg-surface p-0">
              {message}
            </InlineAlert>
            <button type="button" aria-label="بستن پیام" onClick={() => setMessage(null)}>
              <X className="size-6" />
            </button>
          </div>
        )}
        <h1 className="text-title-xl text-text-primary lg:text-display-xl">محصولات</h1>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Button fullWidth className="lg:w-auto" onClick={() => navigate('/vendor/products/new')}>
            ساخت محصول
          </Button>

          {/* Desktop selects */}
          <div className="hidden min-w-0 flex-row-reverse gap-3 lg:flex lg:max-w-[684px] lg:flex-1 lg:justify-start">
            <div className="w-55 min-w-0 [&_label]:sr-only">
              <Select
                label="فروشگاه"
                value={storeFilter}
                onChange={(event) => setStoreFilter(event.target.value)}
                options={STORE_OPTIONS}
              />
            </div>
            <div className="w-55 min-w-0 [&_label]:sr-only">
              <Select
                label="دسته"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                options={CATEGORY_OPTIONS}
              />
            </div>
            <div className="w-55 min-w-0 [&_label]:sr-only">
              <Select
                label="وضعیت"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>

          {/* Mobile selects */}
          <div className="flex gap-3 lg:hidden">
            <MobileFilterSelect
              label="دسته"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={CATEGORY_OPTIONS}
            />
            <MobileFilterSelect
              label="فروشگاه"
              value={storeFilter}
              onChange={setStoreFilter}
              options={STORE_OPTIONS}
            />
          </div>
        </div>

        {/* Mobile status chips */}
        <div className="flex flex-wrap gap-2 lg:hidden" role="group" aria-label="فیلتر وضعیت">
          {STATUS_OPTIONS.map((option) => {
            const active = statusFilter === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter(option.value as StatusFilter)}
                className={[
                  'flex h-11 items-center rounded-md border px-4 text-label-md transition-colors',
                  active
                    ? 'border-primary bg-primary-subtle text-text-primary'
                    : 'border-border-input bg-surface text-text-primary hover:border-primary',
                ].join(' ')}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        {/* Desktop carousel controls */}
        <div className="hidden items-center justify-between lg:flex">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollTrack('prev')}
              disabled={showAll || visibleProducts.length === 0}
              aria-label="قبلی"
              className="grid size-10 place-items-center rounded-md border border-border-default bg-surface text-text-primary transition-colors hover:bg-surface-secondary"
            >
              <ChevronRight className="size-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => scrollTrack('next')}
              disabled={showAll || visibleProducts.length === 0}
              aria-label="بعدی"
              className="grid size-10 place-items-center rounded-md border border-border-default bg-surface text-text-primary transition-colors hover:bg-surface-secondary"
            >
              <ChevronLeft className="size-5" strokeWidth={2} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            aria-expanded={showAll}
            className="flex h-10 items-center gap-2 rounded-md bg-primary-subtle px-4 text-label-md text-text-primary transition-colors hover:bg-surface-sage"
          >
            {showAll ? 'نمایش چرخشی' : 'مشاهده همه'}
            <ChevronDown className="size-6 shrink-0" strokeWidth={1.75} />
          </button>
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
                onEdit={() => navigate(`/vendor/products/${product.id}/edit`)}
                onUnpublish={() => {
                  setActionError('')
                  setUnpublishId(product.id)
                }}
              />
            ))}
            {!showAll && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="flex w-50 min-h-[512px] shrink-0 flex-col items-center justify-center rounded-[12px] bg-surface-sage lg:min-h-[385px] lg:w-45"
              >
                <span className="text-label-lg text-text-primary">مشاهده همه</span>
                <span className="text-caption font-semibold text-text-primary">
                  همه محصولات فروشگاه
                </span>
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          aria-expanded={showAll}
          className="self-start text-label-lg text-text-primary lg:hidden"
        >
          {showAll ? 'نمایش چرخشی' : 'مشاهده همه'}
        </button>
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
