import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Compass,
  Heart,
  MapPin,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  UserRound,
  WifiOff,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FoodListingCard } from '@/components/ui/FoodListingCard'
import { Modal } from '@/components/ui/Modal'
import { Radio } from '@/components/ui/Radio'
import { SearchField } from '@/components/ui/SearchField'
import { discoveryOffers, type DiscoveryOffer } from '@/features/discovery/mockData'
import { formatPrice } from '@/lib/format'
import { toEnglishDigits } from '@/lib/digits'

const categories = ['همه', 'نانوایی', 'غذای آماده', 'کافه', 'خواربار', 'تخفیف ویژه']
const sortOptions = [
  { value: 'distance', label: 'نزدیک‌ترین' },
  { value: 'price', label: 'ارزان‌ترین' },
  { value: 'time', label: 'زمان تحویل' },
] as const
const allergenOptions = [
  { value: 'gluten', label: 'گلوتن' },
  { value: 'dairy', label: 'لبنیات' },
  { value: 'nuts', label: 'آجیل و مغزها' },
  { value: 'sesame', label: 'کنجد' },
] as const

type SortOrder = (typeof sortOptions)[number]['value']

function isSortOrder(value: string | null): value is SortOrder {
  return sortOptions.some((option) => option.value === value)
}

interface DiscoveryFilters {
  category: string
  sort: SortOrder
  minPrice: number
  maxPrice: number
  maxDistance: number
  startHour: number
  endHour: number
  excludedAllergens: string[]
}

const defaultFilters: DiscoveryFilters = {
  category: 'همه',
  sort: 'distance',
  minPrice: 0,
  maxPrice: 160000,
  maxDistance: 5,
  startHour: 7,
  endHour: 23,
  excludedAllergens: [],
}

function parsePickupHour(pickup: string): number {
  const time = pickup.match(/[0-9۰-۹]{1,2}:[0-9۰-۹]{2}/)?.[0]
  if (!time) return Infinity
  return Number(toEnglishDigits(time).split(':')[0])
}

function formatHour(hour: number): string {
  return `${hour.toLocaleString('fa-IR', { minimumIntegerDigits: 2, useGrouping: false })}:۰۰`
}

function readFilters(params: URLSearchParams): DiscoveryFilters {
  const category = params.get('category')
  const sort = params.get('sort')
  const numberParam = (key: string, fallback: number, min: number, max: number) => {
    const raw = params.get(key)
    if (raw === null || raw.trim() === '') return fallback
    const value = Number(raw)
    return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
  }
  const minPrice = numberParam('minPrice', defaultFilters.minPrice, 0, 150000)
  const startHour = numberParam('start', defaultFilters.startHour, 7, 22)

  return {
    category: category && categories.includes(category) ? category : defaultFilters.category,
    sort: isSortOrder(sort) ? sort : defaultFilters.sort,
    minPrice,
    maxPrice: Math.max(minPrice, numberParam('maxPrice', defaultFilters.maxPrice, 10000, 160000)),
    maxDistance: numberParam('distance', defaultFilters.maxDistance, 1, 10),
    startHour,
    endHour: Math.max(startHour, numberParam('end', defaultFilters.endHour, 8, 23)),
    excludedAllergens: (params.get('allergens') ?? '')
      .split(',')
      .filter((allergen) => allergenOptions.some((option) => option.value === allergen)),
  }
}

function writeFilters(params: URLSearchParams, filters: DiscoveryFilters): URLSearchParams {
  const next = new URLSearchParams(params)
  const values: Array<[string, string, string]> = [
    ['category', filters.category, defaultFilters.category],
    ['sort', filters.sort, defaultFilters.sort],
    ['minPrice', String(filters.minPrice), String(defaultFilters.minPrice)],
    ['maxPrice', String(filters.maxPrice), String(defaultFilters.maxPrice)],
    ['distance', String(filters.maxDistance), String(defaultFilters.maxDistance)],
    ['start', String(filters.startHour), String(defaultFilters.startHour)],
    ['end', String(filters.endHour), String(defaultFilters.endHour)],
  ]

  values.forEach(([key, value, defaultValue]) => {
    if (value === defaultValue) next.delete(key)
    else next.set(key, value)
  })

  if (filters.excludedAllergens.length > 0) {
    next.set('allergens', filters.excludedAllergens.join(','))
  } else {
    next.delete('allergens')
  }

  return next
}

function filterOffers(
  offers: DiscoveryOffer[],
  query: string,
  filters: DiscoveryFilters,
): DiscoveryOffer[] {
  const search = query.trim().toLocaleLowerCase()
  const filtered = offers.filter((offer) => {
    const matchesCategory =
      filters.category === 'همه' ||
      (filters.category === 'تخفیف ویژه'
        ? offer.referenceValue >= offer.price * 1.5
        : offer.category === filters.category)
    const matchesSearch =
      !search ||
      `${offer.merchantName} ${offer.category} ${offer.description}`
        .toLocaleLowerCase()
        .includes(search)
    const pickupHour = parsePickupHour(offer.pickup)
    const matchesTime = pickupHour >= filters.startHour && pickupHour <= filters.endHour
    const matchesAllergens = !filters.excludedAllergens.some((allergen) =>
      offer.allergens.includes(allergen),
    )

    return (
      matchesCategory &&
      matchesSearch &&
      offer.price >= filters.minPrice &&
      offer.price <= filters.maxPrice &&
      offer.distanceKm <= filters.maxDistance &&
      matchesTime &&
      matchesAllergens
    )
  })

  return filtered.sort((first, second) => {
    if (filters.sort === 'price') return first.price - second.price
    if (filters.sort === 'time') return parsePickupHour(first.pickup) - parsePickupHour(second.pickup)
    return first.distanceKm - second.distanceKm
  })
}

function SearchHeader() {
  return (
    <header className="border-b border-border-default">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:h-20 sm:px-8 lg:px-20">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/"
            aria-label="بازگشت به اکتشاف"
            className="grid size-11 place-items-center rounded-md text-primary hover:bg-surface-secondary"
          >
            <ArrowRight strokeWidth={1.75} />
          </Link>
          <span className="inline-flex items-center gap-2 text-caption text-text-secondary sm:text-body-md">
            <MapPin className="size-5 text-primary" strokeWidth={1.75} />
            <span className="hidden sm:inline">تهران، ولیعصر</span>
            <span className="sm:hidden">ولیعصر</span>
          </span>
        </div>

        <Link to="/" className="text-title-lg font-bold text-primary sm:text-title-xl">
          ته‌دیگ
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/map"
            className="hidden min-h-11 items-center gap-2 rounded-md px-3 text-label-md text-primary hover:bg-surface-secondary sm:inline-flex"
          >
            <MapPin className="size-5" strokeWidth={1.75} />
            نقشه
          </Link>
          <Link
            to="/login"
            aria-label="پروفایل"
            className="grid size-11 place-items-center rounded-md border border-border-default bg-surface text-primary hover:bg-surface-secondary"
          >
            <UserRound strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </header>
  )
}

function MobileNavigation() {
  return (
    <nav
      aria-label="ناوبری پایین"
      className="fixed inset-x-0 bottom-0 z-30 flex h-20 items-start gap-1 border-t border-border-default bg-surface px-2 pt-1 pb-5 sm:hidden"
    >
      <Link
        to="/"
        className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md py-2 text-caption text-text-secondary"
      >
        <Compass className="size-6" strokeWidth={1.75} />
        اکتشاف
      </Link>
      <Link
        to="/#favorites"
        className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md py-2 text-caption text-text-secondary"
      >
        <Heart className="size-6" strokeWidth={1.75} />
        ذخیره‌ها
      </Link>
      <Link
        to="/login"
        className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md py-2 text-caption text-text-secondary"
      >
        <ShoppingBag className="size-6" strokeWidth={1.75} />
        سفارش‌ها
      </Link>
      <Link
        to="/login"
        className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md py-2 text-caption text-text-secondary"
      >
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

function ActiveFilter({
  label,
  onClear,
}: {
  label: string
  onClear: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="inline-flex min-h-9 items-center gap-2 rounded-full border border-primary bg-primary-subtle px-3 text-caption text-primary"
    >
      {label}
      <X aria-hidden="true" className="size-4" />
    </button>
  )
}

function EmptyResults({
  query,
  onClear,
  onOpenFilters,
}: {
  query: string
  onClear: () => void
  onOpenFilters: () => void
}) {
  return (
    <section className="grid min-h-72 place-items-center rounded-2xl border border-border-default bg-surface px-5 py-10 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary-subtle text-primary">
          <Search className="size-7" strokeWidth={1.75} />
        </div>
        <h2 className="text-title-md text-primary">پیشنهادی پیدا نشد</h2>
        <p className="text-body-md text-text-secondary">
          {query.trim()
            ? `برای «${query.trim()}» نتیجه‌ای نداریم.`
            : 'با این فیلترها پیشنهادی پیدا نشد.'}{' '}
          فاصله یا فیلترها را تغییر بده و دوباره جستجو کن.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="primary" onClick={onClear}>
            پاک کردن فیلترها
          </Button>
          <Button variant="secondary" onClick={onOpenFilters}>
            تغییر فاصله جستجو
          </Button>
        </div>
      </div>
    </section>
  )
}

function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <section
      role="alert"
      className="grid min-h-72 place-items-center rounded-2xl border border-border-default bg-surface px-5 py-10 text-center"
    >
      <div className="max-w-md space-y-4">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-error-subtle text-error">
          <WifiOff className="size-7" strokeWidth={1.75} />
        </div>
        <h2 className="text-title-md text-primary">ارتباط برقرار نشد</h2>
        <p className="text-body-md text-text-secondary">
          دریافت پیشنهادها با مشکل روبه‌رو شد. اتصال اینترنتت را بررسی کن و دوباره تلاش کن.
        </p>
        <Button onClick={onRetry}>تلاش دوباره</Button>
      </div>
    </section>
  )
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const filters = useMemo(() => readFilters(searchParams), [searchParams])
  const [draftFilters, setDraftFilters] = useState(filters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [savedOffers, setSavedOffers] = useState<Record<string, boolean>>({})

  const results = useMemo(
    () => filterOffers(discoveryOffers, query, filters),
    [query, filters],
  )
  const draftResultCount = useMemo(
    () => filterOffers(discoveryOffers, query, draftFilters).length,
    [query, draftFilters],
  )
  const activeAllergens = allergenOptions.filter((option) =>
    filters.excludedAllergens.includes(option.value),
  )
  const isLoadingPreview = searchParams.get('preview') === 'loading'
  const isErrorPreview = searchParams.get('preview') === 'error'

  function updateQuery(value: string) {
    const next = new URLSearchParams(searchParams)
    if (value.trim()) next.set('q', value)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  function updateFilters(nextFilters: DiscoveryFilters) {
    setSearchParams(writeFilters(searchParams, nextFilters), { replace: true })
  }

  function updateDraft(patch: Partial<DiscoveryFilters>) {
    setDraftFilters((current) => ({ ...current, ...patch }))
  }

  function clearPreviewState() {
    const next = new URLSearchParams(searchParams)
    next.delete('preview')
    setSearchParams(next, { replace: true })
  }

  function clearAllFilters() {
    setDraftFilters(defaultFilters)
    const next = writeFilters(searchParams, defaultFilters)
    next.delete('q')
    setSearchParams(next, { replace: true })
    setFiltersOpen(false)
  }

  function toggleAllergen(value: string) {
    const excludedAllergens = draftFilters.excludedAllergens.includes(value)
      ? draftFilters.excludedAllergens.filter((allergen) => allergen !== value)
      : [...draftFilters.excludedAllergens, value]
    updateDraft({ excludedAllergens })
  }

  const activeFilterCount =
    Number(filters.category !== 'همه') +
    Number(filters.minPrice !== defaultFilters.minPrice || filters.maxPrice !== defaultFilters.maxPrice) +
    Number(filters.maxDistance !== defaultFilters.maxDistance) +
    Number(filters.startHour !== defaultFilters.startHour || filters.endHour !== defaultFilters.endHour) +
    filters.excludedAllergens.length

  return (
    <div dir="rtl" className="min-h-screen bg-background text-text-primary">
      <SearchHeader />

      <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 pb-28 pt-5 sm:gap-8 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8">
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-title-lg text-primary sm:text-title-xl">نتایج جستجو</h1>
              <p className="mt-1 text-body-md text-text-secondary">
                {results.length.toLocaleString('fa-IR')} پیشنهاد نزدیک شما
              </p>
            </div>
          </div>

          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault()
            }}
          >
            <SearchField
              label="جستجوی پیشنهادها"
              placeholder="جستجوی غذا یا فروشگاه محلی"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              className="min-w-0 flex-1"
            />
            <Button
              variant="secondary"
              size="sm"
              icon={<SlidersHorizontal strokeWidth={1.75} />}
              onClick={() => {
                setDraftFilters(filters)
                setFiltersOpen(true)
              }}
              aria-label="باز کردن فیلترها"
              className="h-13 shrink-0 rounded-lg border-0 bg-primary-subtle px-3"
            >
              <span className="hidden sm:inline">فیلترها</span>
              <span className="sm:hidden">فیلتر</span>
              {activeFilterCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-primary text-caption text-on-primary">
                  {activeFilterCount.toLocaleString('fa-IR')}
                </span>
              )}
            </Button>
          </form>

          <div
            aria-label="دسته‌بندی پیشنهادها"
            className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {categories.map((category) => {
              const active = filters.category === category
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => updateFilters({ ...filters, category })}
                  aria-pressed={active}
                  className={[
                    'min-h-11 shrink-0 rounded-full border px-4 text-label-md transition-colors',
                    active
                      ? 'border-primary bg-primary-subtle text-primary'
                      : 'border-border-input bg-surface text-primary hover:bg-surface-secondary',
                  ].join(' ')}
                >
                  {category}
                </button>
              )
            })}
          </div>
        </section>

        {(filters.category !== 'همه' ||
          filters.minPrice !== defaultFilters.minPrice ||
          filters.maxPrice !== defaultFilters.maxPrice ||
          filters.maxDistance !== defaultFilters.maxDistance ||
          filters.startHour !== defaultFilters.startHour ||
          filters.endHour !== defaultFilters.endHour ||
          activeAllergens.length > 0) && (
          <div className="flex flex-wrap items-center gap-2" aria-label="فیلترهای فعال">
            {filters.category !== 'همه' && (
              <ActiveFilter
                label={filters.category}
                onClear={() => updateFilters({ ...filters, category: 'همه' })}
              />
            )}
            {(filters.minPrice !== defaultFilters.minPrice ||
              filters.maxPrice !== defaultFilters.maxPrice) && (
              <ActiveFilter
                label={`${formatPrice(filters.minPrice)} تا ${formatPrice(filters.maxPrice)}`}
                onClear={() =>
                  updateFilters({
                    ...filters,
                    minPrice: defaultFilters.minPrice,
                    maxPrice: defaultFilters.maxPrice,
                  })
                }
              />
            )}
            {filters.maxDistance !== defaultFilters.maxDistance && (
              <ActiveFilter
                label={`تا ${filters.maxDistance.toLocaleString('fa-IR')} کیلومتر`}
                onClear={() => updateFilters({ ...filters, maxDistance: defaultFilters.maxDistance })}
              />
            )}
            {(filters.startHour !== defaultFilters.startHour ||
              filters.endHour !== defaultFilters.endHour) && (
              <ActiveFilter
                label={`${formatHour(filters.startHour)} تا ${formatHour(filters.endHour)}`}
                onClear={() =>
                  updateFilters({
                    ...filters,
                    startHour: defaultFilters.startHour,
                    endHour: defaultFilters.endHour,
                  })
                }
              />
            )}
            {activeAllergens.map((allergen) => (
              <ActiveFilter
                key={allergen.value}
                label={`بدون ${allergen.label}`}
                onClear={() =>
                  updateFilters({
                    ...filters,
                    excludedAllergens: filters.excludedAllergens.filter(
                      (value) => value !== allergen.value,
                    ),
                  })
                }
              />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 border-b border-border-default pb-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body-md text-text-secondary">
            {query.trim() ? (
              <>
                نتیجه برای <span className="font-semibold text-primary">«{query.trim()}»</span>
              </>
            ) : (
              'پیشنهادهای فروشگاه‌های اطراف'
            )}
          </p>
          <label className="flex items-center gap-3 text-label-md text-primary">
            مرتب‌سازی:
            <select
              aria-label="مرتب‌سازی پیشنهادها"
              value={filters.sort}
              onChange={(event) => {
                if (isSortOrder(event.target.value)) {
                  updateFilters({ ...filters, sort: event.target.value })
                }
              }}
              className="h-11 rounded-md border border-border-input bg-surface px-3 text-body-md text-primary"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isErrorPreview ? (
          <NetworkError onRetry={clearPreviewState} />
        ) : isLoadingPreview ? (
          <div
            aria-label="در حال بارگذاری پیشنهادها"
            aria-busy="true"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 sm:gap-6"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <FoodListingCard key={index} state="loading" className="min-h-full" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div
            aria-label="پیشنهادهای جستجو"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 sm:gap-6"
          >
            {results.map((offer) => (
              <FoodListingCard
                key={offer.id}
                {...offer}
                headingLevel={2}
                saved={Boolean(savedOffers[offer.id])}
                onSaveChange={(saved) =>
                  setSavedOffers((current) => ({ ...current, [offer.id]: saved }))
                }
                className="min-h-full"
              />
            ))}
          </div>
        ) : (
          <EmptyResults
            query={query}
            onClear={clearAllFilters}
            onOpenFilters={() => {
              setDraftFilters({ ...filters, maxDistance: 10 })
              setFiltersOpen(true)
            }}
          />
        )}
      </main>

      <MobileNavigation />

      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        variant="sheet"
        title="فیلترها"
        headerAction={
          <Button variant="tertiary" size="sm" onClick={() => setDraftFilters(defaultFilters)}>
            پاک کردن همه
          </Button>
        }
        footer={
          <Button
            fullWidth
            onClick={() => {
              updateFilters(draftFilters)
              setFiltersOpen(false)
            }}
          >
            نمایش {draftResultCount.toLocaleString('fa-IR')} نتیجه
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2">
          {draftFilters.category !== 'همه' && (
            <span className="rounded-full bg-primary-subtle px-3 py-2 text-caption text-primary">
              {draftFilters.category}
            </span>
          )}
          {draftFilters.maxDistance !== defaultFilters.maxDistance && (
            <span className="rounded-full bg-primary-subtle px-3 py-2 text-caption text-primary">
              تا {draftFilters.maxDistance.toLocaleString('fa-IR')} کیلومتر
            </span>
          )}
          {draftFilters.excludedAllergens.length > 0 && (
            <span className="rounded-full bg-primary-subtle px-3 py-2 text-caption text-primary">
              {draftFilters.excludedAllergens.length.toLocaleString('fa-IR')} آلرژن حذف‌شده
            </span>
          )}
        </div>

        <fieldset className="space-y-2 border-b border-border-default pb-5">
          <legend className="mb-2 text-label-lg">دسته‌بندی غذا</legend>
          {categories.map((category) => (
            <Radio
              key={category}
              name="search-category"
              value={category}
              label={category}
              checked={draftFilters.category === category}
              onChange={() => updateDraft({ category })}
            />
          ))}
        </fieldset>

        <fieldset className="space-y-3 border-b border-border-default pb-5">
          <legend className="mb-2 text-label-lg">محدوده قیمت</legend>
          <div className="flex items-center justify-between text-caption text-text-secondary">
            <span>حداقل {formatPrice(draftFilters.minPrice)}</span>
            <span>حداکثر {formatPrice(draftFilters.maxPrice)}</span>
          </div>
          <label className="block space-y-1 text-caption text-text-secondary">
            حداقل قیمت
            <input
              aria-label="حداقل قیمت"
              type="range"
              min="0"
              max="150000"
              step="5000"
              value={draftFilters.minPrice}
              onChange={(event) =>
                updateDraft({ minPrice: Math.min(Number(event.target.value), draftFilters.maxPrice) })
              }
              className="block min-h-11 w-full accent-primary"
            />
          </label>
          <label className="block space-y-1 text-caption text-text-secondary">
            حداکثر قیمت
            <input
              aria-label="حداکثر قیمت"
              type="range"
              min="10000"
              max="160000"
              step="5000"
              value={draftFilters.maxPrice}
              onChange={(event) =>
                updateDraft({ maxPrice: Math.max(Number(event.target.value), draftFilters.minPrice) })
              }
              className="block min-h-11 w-full accent-primary"
            />
          </label>
        </fieldset>

        <fieldset className="space-y-2 border-b border-border-default pb-5">
          <legend className="mb-2 text-label-lg">فاصله از شما</legend>
          {[1, 2, 5, 10].map((distance) => (
            <Radio
              key={distance}
              name="search-distance"
              value={String(distance)}
              label={`تا ${distance.toLocaleString('fa-IR')} کیلومتر`}
              checked={draftFilters.maxDistance === distance}
              onChange={() => updateDraft({ maxDistance: distance })}
            />
          ))}
        </fieldset>

        <fieldset className="space-y-3 border-b border-border-default pb-5">
          <legend className="mb-2 text-label-lg">زمان دریافت</legend>
          <div className="flex items-center justify-between text-caption text-text-secondary">
            <span>از {formatHour(draftFilters.startHour)}</span>
            <span>تا {formatHour(draftFilters.endHour)}</span>
          </div>
          <label className="block space-y-1 text-caption text-text-secondary">
            از ساعت
            <input
              aria-label="زمان شروع دریافت"
              type="range"
              min="7"
              max="22"
              step="1"
              value={draftFilters.startHour}
              onChange={(event) =>
                updateDraft({ startHour: Math.min(Number(event.target.value), draftFilters.endHour) })
              }
              className="block min-h-11 w-full accent-primary"
            />
          </label>
          <label className="block space-y-1 text-caption text-text-secondary">
            تا ساعت
            <input
              aria-label="زمان پایان دریافت"
              type="range"
              min="8"
              max="23"
              step="1"
              value={draftFilters.endHour}
              onChange={(event) =>
                updateDraft({ endHour: Math.max(Number(event.target.value), draftFilters.startHour) })
              }
              className="block min-h-11 w-full accent-primary"
            />
          </label>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-label-lg">حذف آلرژن‌ها</legend>
          <p className="mb-2 text-caption text-text-secondary">
            اطلاعات آلرژن‌ها نمونه‌ای است؛ پیش از سفارش با فروشگاه بررسی کن.
          </p>
          {allergenOptions.map((allergen) => (
            <label key={allergen.value} className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                checked={draftFilters.excludedAllergens.includes(allergen.value)}
                onChange={() => toggleAllergen(allergen.value)}
                className="size-5 accent-primary"
              />
              <span className="text-body-md text-text-primary">بدون {allergen.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-label-lg">مرتب‌سازی بر اساس</legend>
          {sortOptions.map((option) => (
            <Radio
              key={option.value}
              name="search-sort"
              value={option.value}
              label={option.label}
              checked={draftFilters.sort === option.value}
              onChange={() => updateDraft({ sort: option.value })}
            />
          ))}
        </fieldset>
      </Modal>
    </div>
  )
}
