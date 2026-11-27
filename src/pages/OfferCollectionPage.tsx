import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, MapPin, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FoodListingCard } from '@/components/ui/FoodListingCard'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { SearchField } from '@/components/ui/SearchField'
import { catalogueService } from '@/services/catalogueService'
import type { DiscoveryOffer } from '@/types/discoveryTypes'
import { formatDistanceKm } from '@/lib/format'

const distances = [1, 2, 5, 10]

interface CollectionConfig {
  id: 'today' | 'popular-nearby' | 'favorites' | 'last-chance'
  title: string
}

const collectionPaths: Record<CollectionConfig['id'], string> = {
  today: '/today',
  'popular-nearby': '/popular-nearby',
  favorites: '/favorites',
  'last-chance': '/last-chance',
}

function OptionChip({
  label,
  active,
  onClick,
  disabled = false,
}: {
  label: string
  active: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={[
        'min-h-11 shrink-0 rounded-lg border px-4 text-label-md transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        active
          ? 'border-primary bg-primary-subtle text-primary'
          : 'border-border-input bg-surface text-primary hover:bg-surface-secondary',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function CollectionHeader({ title }: { title: string }) {
  return (
    <header className="border-b border-border-default">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:h-20 sm:px-8 lg:px-20">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link
            to="/"
            aria-label="بازگشت به اکتشاف"
            className="grid size-11 shrink-0 place-items-center rounded-md text-primary hover:bg-surface-secondary"
          >
            <ArrowRight strokeWidth={1.75} />
          </Link>
          <Link
            to="/map"
            className="hidden items-center gap-2 text-body-md text-text-secondary sm:inline-flex"
          >
            <MapPin className="size-5 text-primary" strokeWidth={1.75} />
            انتخاب محدوده
          </Link>
          <h1 className="truncate text-title-sm text-primary sm:hidden">{title}</h1>
        </div>

        <Link to="/" className="shrink-0 text-title-lg font-bold text-primary sm:text-title-xl">
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

function CollectionFilters({
  category,
  onCategoryChange,
  pickupDay,
  onPickupDayChange,
  maxDistance,
  onDistanceChange,
  categories,
  onCategorySelect,
  hasLocation,
}: {
  category: string
  onCategoryChange: (value: string) => void
  pickupDay: 'all' | 'today' | 'tomorrow'
  onPickupDayChange: (value: 'all' | 'today' | 'tomorrow') => void
  maxDistance: number
  onDistanceChange: (value: number) => void
  categories: string[]
  onCategorySelect: (value: string) => void
  hasLocation: boolean
}) {
  return (
    <aside className="rounded-2xl bg-surface-sage p-4 sm:p-5">
      <h2 className="mb-4 text-title-sm text-primary sm:text-title-md">فیلترها</h2>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-label-md text-primary">دسته‌بندی</legend>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible">
          {categories.map((option) => (
            <OptionChip
              key={option}
              label={option}
              active={category === option}
              onClick={() => {
                onCategoryChange(option)
                onCategorySelect(option)
              }}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4 space-y-2">
        <legend className="mb-2 text-label-md text-primary">زمان دریافت</legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'هر زمان'],
              ['today', 'امروز'],
              ['tomorrow', 'فردا'],
            ] as const
          ).map(([value, label]) => (
            <OptionChip
              key={value}
              label={label}
              active={pickupDay === value}
              onClick={() => onPickupDayChange(value)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4 space-y-2">
        <legend className="mb-2 text-label-md text-primary">فاصله از شما</legend>
        {!hasLocation && (
          <p className="text-caption text-text-secondary">
            برای فیلتر فاصله ابتدا{' '}
            <Link to="/map" className="text-primary underline">
              محدوده را انتخاب کن
            </Link>
            .
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {distances.map((distance) => (
            <OptionChip
              key={distance}
              label={`تا ${formatDistanceKm(distance)}`}
              active={maxDistance === distance}
              disabled={!hasLocation}
              onClick={() => onDistanceChange(distance)}
            />
          ))}
        </div>
      </fieldset>
    </aside>
  )
}

function CollectionContent({ collection }: { collection: CollectionConfig }) {
  const navigate = useNavigate()
  const [hasLocation] = useState(() => Boolean(catalogueService.getLocation()))
  const [collectionOffers, setCollectionOffers] = useState<DiscoveryOffer[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loadError, setLoadError] = useState('')
  const [favoriteError, setFavoriteError] = useState('')
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('همه')
  const [pickupDay, setPickupDay] = useState<'all' | 'today' | 'tomorrow'>('all')
  const [maxDistance, setMaxDistance] = useState(5)
  const [savedOffers, setSavedOffers] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(() => {
        if (!active) return undefined
        setLoading(true)
        setLoadError('')
        const location = catalogueService.getLocation()
        return Promise.all([
          catalogueService.getFilters(),
          collection.id === 'favorites'
            ? catalogueService.getFavorites(location)
            : catalogueService.getHomeCollection(
                collection.id,
                location,
                location ? maxDistance : undefined,
              ),
        ])
      })
      .then((response) => {
        if (!active || !response) return
        const [filterData, offers] = response
        if (!active) return
        setCategories(filterData.categories.map((item) => item.name))
        setCollectionOffers(offers)
        setSavedOffers(Object.fromEntries(offers.map((offer) => [offer.id, offer.isFavorite])))
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
  }, [collection.id, maxDistance, reloadKey])

  const offers = useMemo(() => {
    const search = query.trim().toLocaleLowerCase()
    return collectionOffers
      .filter((offer) => {
        const matchesCategory = category === 'همه' || offer.category === category
        const matchesSearch =
          !search ||
          `${offer.merchantName} ${offer.category} ${offer.description}`
            .toLocaleLowerCase()
            .includes(search)
        const isToday = offer.pickup.includes('امروز')
        return (
          matchesCategory &&
          matchesSearch &&
          (offer.distanceKm === undefined || offer.distanceKm <= maxDistance) &&
          (pickupDay === 'all' || (pickupDay === 'today' ? isToday : !isToday))
        )
      })
      .sort((first, second) => (first.distanceKm ?? Infinity) - (second.distanceKm ?? Infinity))
  }, [category, collectionOffers, maxDistance, pickupDay, query])

  function clearFilters() {
    setCategory('همه')
    setPickupDay('all')
    setMaxDistance(5)
    setQuery('')
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

  return (
    <div dir="rtl" className="min-h-screen bg-background text-text-primary">
      <CollectionHeader title={collection.title} />

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-5 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8">
        <div className="mb-5 hidden items-center gap-3 sm:flex">
          <Link
            to="/"
            aria-label="بازگشت به اکتشاف"
            className="grid size-11 shrink-0 place-items-center rounded-md border border-border-default bg-surface text-primary hover:bg-surface-secondary"
          >
            <ArrowRight strokeWidth={1.75} />
          </Link>
          <h1 className="text-title-lg text-primary sm:text-title-xl">{collection.title}</h1>
        </div>

        <div className="mb-5 flex items-center gap-2">
          <SearchField
            label={`جستجو در ${collection.title}`}
            placeholder="جستجوی غذا یا فروشگاه محلی"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && query.trim()) {
                event.preventDefault()
                navigate(`/search?q=${encodeURIComponent(query.trim())}`)
              }
            }}
            className="min-w-0 flex-1"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              navigate(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search')
            }
            className="h-13 shrink-0 sm:hidden"
          >
            جستجو
          </Button>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[256px_minmax(0,1fr)]">
          <div className="space-y-4 lg:sticky lg:top-6">
            <CollectionFilters
              category={category}
              onCategoryChange={setCategory}
              categories={['همه', ...categories]}
              onCategorySelect={(value) => {
                if (value !== 'همه') {
                  navigate(`/search?category=${encodeURIComponent(value)}`)
                }
              }}
              hasLocation={hasLocation}
              pickupDay={pickupDay}
              onPickupDayChange={setPickupDay}
              maxDistance={maxDistance}
              onDistanceChange={setMaxDistance}
            />
            <Button variant="tertiary" size="sm" onClick={clearFilters}>
              پاک کردن فیلترها
            </Button>
          </div>

          <section aria-labelledby="collection-results-heading" className="min-w-0 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 id="collection-results-heading" className="text-title-sm text-primary">
                پیشنهادهای نزدیک شما
              </h2>
              <p
                aria-live="polite"
                className="shrink-0 text-caption text-text-secondary sm:text-body-md"
              >
                {offers.length.toLocaleString('fa-IR')} پیشنهاد
              </p>
            </div>

            {loadError && (
              <InlineAlert tone="error">
                <p>{loadError}</p>
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

            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                {Array.from({ length: 4 }, (_, index) => (
                  <FoodListingCard key={index} state="loading" />
                ))}
              </div>
            ) : offers.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                {offers.map((offer) => (
                  <FoodListingCard
                    key={offer.id}
                    {...offer}
                    renderLink={(props) => <Link to={`/products/${encodeURIComponent(offer.id)}`} {...props} />}
                    headingLevel={2}
                    saved={savedOffers[offer.id] ?? offer.isFavorite}
                    onSaveChange={(saved) => void updateSaved(offer.id, saved)}
                    className="min-h-full"
                  />
                ))}
              </div>
            ) : (
              <div className="grid min-h-64 place-items-center rounded-2xl border border-border-default bg-surface p-6 text-center">
                <div className="space-y-4">
                  <h3 className="text-title-md text-primary">پیشنهادی پیدا نشد</h3>
                  <p className="text-body-md text-text-secondary">
                    دسته‌بندی، زمان دریافت یا فاصله را تغییر بده و دوباره امتحان کن.
                  </p>
                  <Button variant="secondary" onClick={clearFilters}>
                    پاک کردن فیلترها
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default function OfferCollectionPage() {
  const { pathname } = useLocation()
  const collectionId = Object.entries(collectionPaths).find(([, path]) => path === pathname)?.[0]
  const collection = collectionId
    ? {
        id: collectionId as CollectionConfig['id'],
        title:
          collectionId === 'today'
            ? 'فرصت‌های خوشمزه امروز'
            : collectionId === 'favorites'
              ? 'ذخیره‌ها'
              : collectionId === 'popular-nearby'
                ? 'محبوب‌های اطراف شما'
                : 'آخرین فرصت‌های نجات غذا',
      }
    : undefined

  if (!collection) {
    return null
  }

  return <CollectionContent key={collection.id} collection={collection} />
}
