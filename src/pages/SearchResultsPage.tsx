import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, MapPin, Search, SlidersHorizontal, UserRound, WifiOff, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FoodListingCard } from '@/components/ui/FoodListingCard'
import { Modal } from '@/components/ui/Modal'
import { Radio } from '@/components/ui/Radio'
import { SearchField } from '@/components/ui/SearchField'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { catalogueService, type CatalogueFilters } from '@/services/catalogueService'
import type { DiscoveryOffer } from '@/types/discoveryTypes'
import { formatPrice } from '@/lib/format'

const sortValues = ['distance', 'price', 'time'] as const

type SortOrder = (typeof sortValues)[number]

function isSortOrder(value: string | null): value is SortOrder {
  return sortValues.some((option) => option === value)
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

function formatHour(hour: number): string {
  return `${hour.toLocaleString('fa-IR', { minimumIntegerDigits: 2, useGrouping: false })}:۰۰`
}

function readFilters(
  params: URLSearchParams,
  defaults: DiscoveryFilters = defaultFilters,
): DiscoveryFilters {
  const category = params.get('category')
  const sort = params.get('sort')
  const numberParam = (key: string, fallback: number, min: number, max: number) => {
    const raw = params.get(key)
    if (raw === null || raw.trim() === '') return fallback
    const value = Number(raw)
    return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
  }
  const minPrice = numberParam('minPrice', defaults.minPrice, 0, defaults.maxPrice)
  const startHour = numberParam('start', defaults.startHour, 7, 22)

  return {
    category: category ?? defaults.category,
    sort: isSortOrder(sort) ? sort : defaults.sort,
    minPrice,
    maxPrice: Math.max(
      minPrice,
      numberParam('maxPrice', defaults.maxPrice, defaults.minPrice, defaults.maxPrice),
    ),
    maxDistance: numberParam('distance', defaults.maxDistance, 1, 10),
    startHour,
    endHour: Math.max(startHour, numberParam('end', defaults.endHour, 8, 23)),
    excludedAllergens: (params.get('allergens') ?? '').split(',').filter(Boolean),
  }
}

function writeFilters(
  params: URLSearchParams,
  filters: DiscoveryFilters,
  defaults: DiscoveryFilters = defaultFilters,
): URLSearchParams {
  const next = new URLSearchParams(params)
  const values: Array<[string, string, string]> = [
    ['category', filters.category, defaults.category],
    ['sort', filters.sort, defaults.sort],
    ['minPrice', String(filters.minPrice), String(defaults.minPrice)],
    ['maxPrice', String(filters.maxPrice), String(defaults.maxPrice)],
    ['distance', String(filters.maxDistance), String(defaults.maxDistance)],
    ['start', String(filters.startHour), String(defaults.startHour)],
    ['end', String(filters.endHour), String(defaults.endHour)],
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

function tehranDateTime(hour: number): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const date = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${date.year}-${date.month}-${date.day}T${String(hour).padStart(2, '0')}:00:00+03:30`
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
          <Link
            to="/map"
            className="inline-flex items-center gap-2 text-caption text-text-secondary sm:text-body-md"
          >
            <MapPin className="size-5 text-primary" strokeWidth={1.75} />
            <span>انتخاب محدوده</span>
          </Link>
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
            to="/profile"
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

function ActiveFilter({ label, onClear }: { label: string; onClear: () => void }) {
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

function NetworkError({ onRetry, message }: { onRetry: () => void; message: string }) {
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
          {message ||
            'دریافت پیشنهادها با مشکل روبه‌رو شد. اتصال اینترنتت را بررسی کن و دوباره تلاش کن.'}
        </p>
        <Button onClick={onRetry}>تلاش دوباره</Button>
      </div>
    </section>
  )
}

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [filterData, setFilterData] = useState<CatalogueFilters>()
  const [location] = useState(() => catalogueService.getLocation())
  const defaults = useMemo(
    () => ({ ...defaultFilters, maxPrice: filterData?.price.max ?? defaultFilters.maxPrice }),
    [filterData],
  )
  const filters = useMemo(() => readFilters(searchParams, defaults), [defaults, searchParams])
  const [draftFilters, setDraftFilters] = useState(defaultFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [offers, setOffers] = useState<DiscoveryOffer[]>([])
  const [savedOffers, setSavedOffers] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [favoriteError, setFavoriteError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const categories = useMemo(
    () => ['همه', ...(filterData?.categories.map((category) => category.name) ?? []), 'تخفیف ویژه'],
    [filterData],
  )
  const allergenOptions = filterData?.allergens ?? []
  const sliderPriceMax = Math.max(
    filterData?.price.max ?? defaults.maxPrice,
    draftFilters.maxPrice,
    10000,
  )
  const sortOptions: Array<{ value: SortOrder; label: string }> = [
    {
      value: 'distance',
      label: location
        ? (filterData?.sort_options.find((option) => option.value === 'nearest')?.label ??
          'نزدیک‌ترین')
        : 'نزدیک‌ترین (انتخاب محدوده)',
    },
    {
      value: 'price',
      label:
        filterData?.sort_options.find((option) => option.value === 'price_asc')?.label ??
        'ارزان‌ترین',
    },
    { value: 'time', label: 'زمان تحویل' },
  ]
  const activeAllergens = allergenOptions.filter((option) =>
    filters.excludedAllergens.includes(option.value),
  )

  useEffect(() => {
    let active = true
    catalogueService
      .getFilters()
      .then((data) => {
        if (active) setFilterData(data)
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : 'دریافت فیلترها ناموفق بود.')
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [reloadKey])

  useEffect(() => {
    if (!filterData) return
    let active = true
    void Promise.resolve()
      .then(() => {
        if (!active) return undefined
        setLoading(true)
        setLoadError('')
        const categoryId =
          filters.category === 'همه' || filters.category === 'تخفیف ویژه'
            ? undefined
            : filterData.categories.find((category) => category.name === filters.category)?.id
        const sort = filters.sort === 'price' ? 'price_asc' : location ? 'nearest' : 'newest'
        const supportedAllergens = filters.excludedAllergens.filter((allergen) =>
          filterData.allergens.some((option) => option.value === allergen),
        )
        return catalogueService.search(
          {
            q: query,
            categoryId,
            priceMin: filters.minPrice,
            priceMax: filters.maxPrice,
            pickupFrom: tehranDateTime(filters.startHour),
            pickupTo: tehranDateTime(filters.endHour),
            excludeAllergens: supportedAllergens,
            location,
            radiusKm: location ? filters.maxDistance : undefined,
            sort,
            limit: 50,
          },
          filterData.categories,
        )
      })
      .then((nextOffers) => {
        if (!active || !nextOffers) return
        setOffers(nextOffers)
        setSavedOffers(Object.fromEntries(nextOffers.map((offer) => [offer.id, offer.isFavorite])))
      })
      .catch((error: unknown) => {
        if (active)
          setLoadError(error instanceof Error ? error.message : 'دریافت پیشنهادها ناموفق بود.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [filterData, filters, location, query, reloadKey])

  const results = useMemo(() => {
    const filtered =
      filters.category === 'تخفیف ویژه'
        ? offers.filter((offer) => offer.referenceValue >= offer.price * 1.5)
        : [...offers]
    if (filters.sort === 'time') {
      filtered.sort(
        (first, second) =>
          (Date.parse(first.pickupStart) || Infinity) -
          (Date.parse(second.pickupStart) || Infinity),
      )
    }
    return filtered
  }, [filters.category, filters.sort, offers])

  function updateQuery(value: string) {
    const next = new URLSearchParams(searchParams)
    if (value.trim()) next.set('q', value)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  function updateFilters(nextFilters: DiscoveryFilters) {
    setSearchParams(writeFilters(searchParams, nextFilters, defaults), { replace: true })
  }

  function updateDraft(patch: Partial<DiscoveryFilters>) {
    setDraftFilters((current) => ({ ...current, ...patch }))
  }

  function clearAllFilters() {
    setDraftFilters(defaults)
    const next = writeFilters(searchParams, defaults, defaults)
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

  async function updateSaved(id: string, value: boolean) {
    setFavoriteError('')
    try {
      await catalogueService.setFavorite(id, value)
      setSavedOffers((current) => ({ ...current, [id]: value }))
    } catch (error) {
      setFavoriteError(error instanceof Error ? error.message : 'ذخیره پیشنهاد ناموفق بود.')
    }
  }

  const activeFilterCount =
    Number(filters.category !== 'همه') +
    Number(filters.minPrice !== defaults.minPrice || filters.maxPrice !== defaults.maxPrice) +
    Number(filters.maxDistance !== defaults.maxDistance) +
    Number(filters.startHour !== defaults.startHour || filters.endHour !== defaults.endHour) +
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
          filters.minPrice !== defaults.minPrice ||
          filters.maxPrice !== defaults.maxPrice ||
          filters.maxDistance !== defaults.maxDistance ||
          filters.startHour !== defaults.startHour ||
          filters.endHour !== defaults.endHour ||
          activeAllergens.length > 0) && (
          <div className="flex flex-wrap items-center gap-2" aria-label="فیلترهای فعال">
            {filters.category !== 'همه' && (
              <ActiveFilter
                label={filters.category}
                onClear={() => updateFilters({ ...filters, category: 'همه' })}
              />
            )}
            {(filters.minPrice !== defaults.minPrice || filters.maxPrice !== defaults.maxPrice) && (
              <ActiveFilter
                label={`${formatPrice(filters.minPrice)} تا ${formatPrice(filters.maxPrice)}`}
                onClear={() =>
                  updateFilters({
                    ...filters,
                    minPrice: defaults.minPrice,
                    maxPrice: defaults.maxPrice,
                  })
                }
              />
            )}
            {filters.maxDistance !== defaults.maxDistance && (
              <ActiveFilter
                label={`تا ${filters.maxDistance.toLocaleString('fa-IR')} کیلومتر`}
                onClear={() => updateFilters({ ...filters, maxDistance: defaults.maxDistance })}
              />
            )}
            {(filters.startHour !== defaults.startHour || filters.endHour !== defaults.endHour) && (
              <ActiveFilter
                label={`${formatHour(filters.startHour)} تا ${formatHour(filters.endHour)}`}
                onClear={() =>
                  updateFilters({
                    ...filters,
                    startHour: defaults.startHour,
                    endHour: defaults.endHour,
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
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.value === 'distance' && !location}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loadError ? (
          <NetworkError
            message={loadError}
            onRetry={() => {
              setFilterData(undefined)
              setReloadKey((key) => key + 1)
            }}
          />
        ) : (
          <>
            {favoriteError && <InlineAlert tone="error">{favoriteError}</InlineAlert>}
            {loading ? (
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
                    renderLink={
                      offer.storeId
                        ? (props) => <Link to={`/stores/${offer.storeId}`} {...props} />
                        : undefined
                    }
                    headingLevel={2}
                    saved={savedOffers[offer.id] ?? offer.isFavorite}
                    onSaveChange={(saved) => void updateSaved(offer.id, saved)}
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
          </>
        )}
      </main>

      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        variant="sheet"
        title="فیلترها"
        headerAction={
          <Button variant="tertiary" size="sm" onClick={() => setDraftFilters(defaults)}>
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
            نمایش {results.length.toLocaleString('fa-IR')} نتیجه
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2">
          {draftFilters.category !== 'همه' && (
            <span className="rounded-full bg-primary-subtle px-3 py-2 text-caption text-primary">
              {draftFilters.category}
            </span>
          )}
          {draftFilters.maxDistance !== defaults.maxDistance && (
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
          {filterData && (
            <p className="text-caption text-text-secondary">
              بازه پیشنهادها: {formatPrice(filterData.price.min)} تا{' '}
              {formatPrice(filterData.price.max)}
            </p>
          )}
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
              max={sliderPriceMax}
              step="5000"
              value={draftFilters.minPrice}
              onChange={(event) =>
                updateDraft({
                  minPrice: Math.min(Number(event.target.value), draftFilters.maxPrice),
                })
              }
              className="block min-h-11 w-full accent-primary"
            />
          </label>
          <label className="block space-y-1 text-caption text-text-secondary">
            حداکثر قیمت
            <input
              aria-label="حداکثر قیمت"
              type="range"
              min="0"
              max={sliderPriceMax}
              step="5000"
              value={draftFilters.maxPrice}
              onChange={(event) =>
                updateDraft({
                  maxPrice: Math.max(Number(event.target.value), draftFilters.minPrice),
                })
              }
              className="block min-h-11 w-full accent-primary"
            />
          </label>
        </fieldset>

        <fieldset className="space-y-2 border-b border-border-default pb-5">
          <legend className="mb-2 text-label-lg">فاصله از شما</legend>
          {!location && (
            <p className="text-caption text-text-secondary">
              برای فیلتر فاصله ابتدا{' '}
              <Link to="/map" className="text-primary underline">
                محدوده را انتخاب کن
              </Link>
              .
            </p>
          )}
          {[1, 2, 5, 10].map((distance) => (
            <Radio
              key={distance}
              name="search-distance"
              value={String(distance)}
              label={`تا ${distance.toLocaleString('fa-IR')} کیلومتر`}
              checked={draftFilters.maxDistance === distance}
              disabled={!location}
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
                updateDraft({
                  startHour: Math.min(Number(event.target.value), draftFilters.endHour),
                })
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
                updateDraft({
                  endHour: Math.max(Number(event.target.value), draftFilters.startHour),
                })
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
