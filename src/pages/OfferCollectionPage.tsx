import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Compass, Heart, MapPin, ShoppingBag, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FoodListingCard } from '@/components/ui/FoodListingCard'
import { SearchField } from '@/components/ui/SearchField'
import { discoverySections, type DiscoveryOffer } from '@/features/discovery/mockData'
import { formatDistanceKm } from '@/lib/format'

const categories = ['همه', 'نانوایی', 'غذای آماده', 'کافه', 'خواربار', 'تخفیف ویژه']
const distances = [1, 2, 5, 10]

interface CollectionConfig {
  id: string
  title: string
  offers: DiscoveryOffer[]
}

const collectionPaths: Record<string, string> = {
  today: '/today',
  favorites: '/favorites',
  'last-chance': '/last-chance',
}

function OptionChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        'min-h-11 shrink-0 rounded-lg border px-4 text-label-md transition-colors',
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
          <span className="hidden items-center gap-2 text-body-md text-text-secondary sm:inline-flex">
            <MapPin className="size-5 text-primary" strokeWidth={1.75} />
            تهران، ولیعصر
          </span>
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

function CollectionFilters({
  category,
  onCategoryChange,
  pickupDay,
  onPickupDayChange,
  maxDistance,
  onDistanceChange,
}: {
  category: string
  onCategoryChange: (value: string) => void
  pickupDay: 'all' | 'today' | 'tomorrow'
  onPickupDayChange: (value: 'all' | 'today' | 'tomorrow') => void
  maxDistance: number
  onDistanceChange: (value: number) => void
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
              onClick={() => onCategoryChange(option)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4 space-y-2">
        <legend className="mb-2 text-label-md text-primary">زمان دریافت</legend>
        <div className="flex flex-wrap gap-2">
          {([
            ['all', 'هر زمان'],
            ['today', 'امروز'],
            ['tomorrow', 'فردا'],
          ] as const).map(([value, label]) => (
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
        <div className="flex flex-wrap gap-2">
          {distances.map((distance) => (
            <OptionChip
              key={distance}
              label={`تا ${formatDistanceKm(distance)}`}
              active={maxDistance === distance}
              onClick={() => onDistanceChange(distance)}
            />
          ))}
        </div>
      </fieldset>
    </aside>
  )
}

function CollectionNavigation() {
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
        to="/favorites"
        aria-current="page"
        className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md py-2 text-caption text-primary"
      >
        <Heart className="size-6" strokeWidth={1.75} />
        محبوب‌ها
      </Link>
      <Link
        to="/orders"
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

function CollectionContent({ collection }: { collection: CollectionConfig }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('همه')
  const [pickupDay, setPickupDay] = useState<'all' | 'today' | 'tomorrow'>('all')
  const [maxDistance, setMaxDistance] = useState(5)
  const [savedOffers, setSavedOffers] = useState<Record<string, boolean>>({})

  const offers = useMemo(() => {
    const search = query.trim().toLocaleLowerCase()
    return collection.offers
      .filter((offer) => {
        const matchesCategory =
          category === 'همه' ||
          (category === 'تخفیف ویژه'
            ? offer.referenceValue >= offer.price * 1.5
            : offer.category === category)
        const matchesSearch =
          !search ||
          `${offer.merchantName} ${offer.category} ${offer.description}`
            .toLocaleLowerCase()
            .includes(search)
        const isToday = offer.pickup.includes('امروز')
        return (
          matchesCategory &&
          matchesSearch &&
          offer.distanceKm <= maxDistance &&
          (pickupDay === 'all' || (pickupDay === 'today' ? isToday : !isToday))
        )
      })
      .sort((first, second) => first.distanceKm - second.distanceKm)
  }, [category, collection.offers, maxDistance, pickupDay, query])

  function clearFilters() {
    setCategory('همه')
    setPickupDay('all')
    setMaxDistance(5)
    setQuery('')
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
              <p aria-live="polite" className="shrink-0 text-caption text-text-secondary sm:text-body-md">
                {offers.length.toLocaleString('fa-IR')} پیشنهاد
              </p>
            </div>

            {offers.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                {offers.map((offer) => (
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

      <CollectionNavigation />
    </div>
  )
}

export default function OfferCollectionPage() {
  const { pathname } = useLocation()
  const collectionId =
    Object.entries(collectionPaths).find(([, path]) => path === pathname)?.[0] ?? 'today'
  const collection = discoverySections.find((section) => section.id === collectionId)

  if (!collection) {
    return null
  }

  return <CollectionContent key={collection.id} collection={collection} />
}
