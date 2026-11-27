import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, SlidersHorizontal, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FoodListingCard } from '@/components/ui/FoodListingCard'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Modal } from '@/components/ui/Modal'
import { Radio } from '@/components/ui/Radio'
import { SearchField } from '@/components/ui/SearchField'
import { DiscoveryMapPreview } from '@/features/discovery/components/DiscoveryMapPreview'
import { catalogueService } from '@/services/catalogueService'
import type { DiscoveryOffer, DiscoverySection } from '@/types/discoveryTypes'
import { toEnglishDigits } from '@/lib/digits'

const sortOptions = [
  { value: 'distance', label: 'نزدیک‌ترین' },
  { value: 'price', label: 'ارزان‌ترین' },
  { value: 'time', label: 'زمان تحویل' },
]

type SortOrder = (typeof sortOptions)[number]['value']

function pickupTime(pickup: string): number {
  const time = pickup.match(/[0-9۰-۹]{1,2}:[0-9۰-۹]{2}/)?.[0]
  if (!time) return Infinity
  const [hours, minutes] = toEnglishDigits(time).split(':').map(Number)
  return hours * 60 + minutes
}

function DiscoveryHeader() {
  return (
    <>
      <div className="flex items-center justify-between gap-4 px-4 pb-4 pt-4 sm:hidden">
        <Link
          to="/map"
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-label-md text-primary hover:bg-surface-secondary"
          aria-label="انتخاب محدوده"
        >
          <MapPin className="size-6" strokeWidth={1.75} />
          انتخاب محدوده
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
          <Link
            to="/map"
            className="flex min-h-11 items-center gap-2 px-2 text-body-md text-primary"
          >
            <MapPin className="size-6" strokeWidth={1.75} />
            انتخاب محدوده
          </Link>
        </div>

        <nav aria-label="ناوبری اصلی" className="hidden items-center gap-6 sm:flex lg:hidden">
          <a href="#favorites" className="text-body-md text-text-secondary hover:text-primary">
            ذخیره‌ها
          </a>
          <Link to="/orders" className="text-body-md text-text-secondary hover:text-primary">
            سفارش‌ها
          </Link>
          <a href="#discover" className="text-body-md text-primary">
            اکتشاف
          </a>
        </nav>

        <Link to="/" className="text-title-xl font-bold text-primary">
          ته‌دیگ
        </Link>
      </header>
    </>
  )
}

function SearchAndFilters({
  query,
  onQueryChange,
  onOpenFilters,
  onSubmitSearch,
}: {
  query: string
  onQueryChange: (value: string) => void
  onOpenFilters: () => void
  onSubmitSearch: () => void
}) {
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmitSearch()
      }}
    >
      <SearchField
        label="جستجوی پیشنهادها"
        placeholder="جستجوی غذا یا فروشگاه محلی"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        className="min-w-0 flex-1"
      />
      <Button
        variant="secondary"
        size="sm"
        icon={<SlidersHorizontal strokeWidth={1.75} />}
        onClick={onOpenFilters}
        className="h-13 shrink-0 rounded-lg border-0 bg-primary-subtle px-3"
      >
        فیلترها
      </Button>
    </form>
  )
}

function CategoryFilters({
  selected,
  onSelect,
  categories,
}: {
  selected: string
  onSelect: (category: string) => void
  categories: string[]
}) {
  return (
    <div className="hidden flex-wrap gap-2 sm:flex" aria-label="دسته‌بندی پیشنهادها">
      {categories.map((category) => {
        const active = selected === category
        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelect(category)}
            aria-pressed={active}
            className={[
              'min-h-11 rounded-md border px-4 text-label-md transition-colors',
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
  )
}

function OfferCarousel({
  title,
  offers,
  saved,
  onSaveChange,
  id,
}: {
  title: string
  offers: DiscoveryOffer[]
  saved: Record<string, boolean>
  onSaveChange: (id: string, value: boolean) => void
  id: string
}) {
  const collectionPath =
    id === 'today' ? '/today' : id === 'last-chance' ? '/last-chance' : '/popular-nearby'

  return (
    <section id={id} className="min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-title-md text-primary sm:text-title-lg">{title}</h2>
        <Link
          to={collectionPath}
          className="inline-flex shrink-0 items-center gap-1 text-label-md text-primary hover:text-primary-hover"
        >
          مشاهده همه
          <ArrowLeft className="size-5" strokeWidth={1.75} />
        </Link>
      </div>

      {offers.length > 0 ? (
        <div
          id={`${id}-offers`}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-6"
        >
          {offers.map((offer) => (
            <FoodListingCard
              key={offer.id}
              {...offer}
              renderLink={(props) => <Link to={`/products/${encodeURIComponent(offer.id)}`} {...props} />}
              saved={saved[offer.id] ?? offer.isFavorite}
              onSaveChange={(value) => onSaveChange(offer.id, value)}
              className="w-[270px] shrink-0 snap-start"
            />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-border-default bg-surface p-5 text-body-md text-text-secondary">
          پیشنهادی با این جستجو پیدا نشد.
        </p>
      )}
    </section>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('همه')
  const [sortOrder, setSortOrder] = useState<SortOrder>('distance')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [sections, setSections] = useState<DiscoverySection[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [homeError, setHomeError] = useState('')
  const [favoriteError, setFavoriteError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(() => {
        if (!active) return undefined
        setLoading(true)
        setHomeError('')
        return Promise.all([
          catalogueService.getHomeCategories(),
          catalogueService.getHomeSections(catalogueService.getLocation()),
        ])
      })
      .then((response) => {
        if (!active || !response) return
        const [homeCategories, homeSections] = response
        if (!active) return
        setCategories(homeCategories.map((category) => category.name))
        setSections(homeSections)
      })
      .catch((error: unknown) => {
        if (active)
          setHomeError(error instanceof Error ? error.message : 'دریافت پیشنهادها ناموفق بود.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [reloadKey])

  const visibleSections = useMemo(
    () =>
      sections.map((section) => {
        const search = query.trim().toLocaleLowerCase()
        const offers = section.offers.filter(
          (offer) =>
            !search ||
            `${offer.merchantName} ${offer.category} ${offer.description}`
              .toLocaleLowerCase()
              .includes(search),
        )
        if (sortOrder === 'price') offers.sort((a, b) => a.price - b.price)
        if (sortOrder === 'distance')
          offers.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
        if (sortOrder === 'time') offers.sort((a, b) => pickupTime(a.pickup) - pickupTime(b.pickup))
        return { ...section, offers }
      }),
    [query, sections, sortOrder],
  )

  async function updateSaved(id: string, value: boolean) {
    setFavoriteError('')
    try {
      await catalogueService.setFavorite(id, value)
      setSaved((current) => ({ ...current, [id]: value }))
    } catch (error) {
      setFavoriteError(error instanceof Error ? error.message : 'ذخیره پیشنهاد ناموفق بود.')
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <div className="min-w-0 flex-1">
          <DiscoveryHeader />
          <main
            id="discover"
            className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 pb-28 pt-0 sm:gap-8 sm:px-6 sm:pb-10 sm:pt-4 lg:gap-8 lg:px-20 lg:pb-12 lg:pt-12"
          >
            <section className="space-y-4">
              <SearchAndFilters
                query={query}
                onQueryChange={setQuery}
                onOpenFilters={() => setFiltersOpen(true)}
                onSubmitSearch={() =>
                  navigate(
                    query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search',
                  )
                }
              />
              <CategoryFilters
                selected={selectedCategory}
                categories={['همه', ...categories]}
                onSelect={(category) => {
                  setSelectedCategory(category)
                  if (category !== 'همه') {
                    navigate(`/search?category=${encodeURIComponent(category)}`)
                  }
                }}
              />
            </section>

            <DiscoveryMapPreview />

            {homeError && (
              <InlineAlert tone="error">
                <p>{homeError}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setReloadKey((key) => key + 1)}
                >
                  تلاش دوباره
                </Button>
              </InlineAlert>
            )}
            {favoriteError && <InlineAlert tone="error">{favoriteError}</InlineAlert>}

            <div className="space-y-8 sm:space-y-10">
              {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {Array.from({ length: 3 }, (_, index) => (
                    <FoodListingCard key={index} state="loading" />
                  ))}
                </div>
              ) : (
                visibleSections.map((section) => (
                  <OfferCarousel
                    key={section.id}
                    id={section.id}
                    title={section.title}
                    offers={section.offers}
                    saved={saved}
                    onSaveChange={updateSaved}
                  />
                ))
              )}
            </div>
          </main>
        </div>
      </div>

      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        variant="sheet"
        title="فیلترها"
        headerAction={
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => {
              setSortOrder('distance')
              setSelectedCategory('همه')
            }}
          >
            پاک کردن همه
          </Button>
        }
        footer={
          <Button fullWidth onClick={() => setFiltersOpen(false)}>
            نمایش نتایج
          </Button>
        }
      >
        <fieldset className="space-y-2">
          <legend className="mb-2 text-label-md">مرتب‌سازی بر اساس</legend>
          {sortOptions.map((option) => (
            <Radio
              key={option.value}
              name="discovery-sort"
              value={option.value}
              label={option.label}
              checked={sortOrder === option.value}
              onChange={() => setSortOrder(option.value)}
            />
          ))}
        </fieldset>
      </Modal>
    </div>
  )
}
