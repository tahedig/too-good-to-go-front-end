import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, MapPin, SlidersHorizontal, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FoodListingCard } from '@/components/ui/FoodListingCard'
import { Modal } from '@/components/ui/Modal'
import { Radio } from '@/components/ui/Radio'
import { SearchField } from '@/components/ui/SearchField'
import { discoverySections, type DiscoveryOffer } from '@/features/discovery/mockData'
import { formatDistanceKm } from '@/lib/format'

const categories = ['همه', 'نانوایی', 'غذای آماده', 'کافه', 'خواربار', 'تخفیف ویژه']
const distances = [1, 2, 5, 10]
const pickupDays = [
  { value: 'all', label: 'هر زمان' },
  { value: 'today', label: 'امروز' },
  { value: 'tomorrow', label: 'فردا' },
] as const

type PickupDay = (typeof pickupDays)[number]['value']

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

function ActiveFilterChip({ label, onClear }: { label: string; onClear: () => void }) {
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

function filterCollectionOffers(
  items: DiscoveryOffer[],
  query: string,
  category: string,
  pickupDay: PickupDay,
  maxDistance: number,
): DiscoveryOffer[] {
  const search = query.trim().toLocaleLowerCase()
  return items
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
}

function CollectionContent({ collection }: { collection: CollectionConfig }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('همه')
  const [pickupDay, setPickupDay] = useState<PickupDay>('all')
  const [maxDistance, setMaxDistance] = useState(5)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draftCategory, setDraftCategory] = useState(category)
  const [draftPickupDay, setDraftPickupDay] = useState<PickupDay>(pickupDay)
  const [draftMaxDistance, setDraftMaxDistance] = useState(maxDistance)
  const [savedOffers, setSavedOffers] = useState<Record<string, boolean>>({})

  const offers = useMemo(
    () => filterCollectionOffers(collection.offers, query, category, pickupDay, maxDistance),
    [category, collection.offers, maxDistance, pickupDay, query],
  )

  const draftOfferCount = useMemo(
    () =>
      filterCollectionOffers(
        collection.offers,
        query,
        draftCategory,
        draftPickupDay,
        draftMaxDistance,
      ).length,
    [collection.offers, draftCategory, draftMaxDistance, draftPickupDay, query],
  )

  const activeFilterCount =
    Number(category !== 'همه') + Number(pickupDay !== 'all') + Number(maxDistance !== 5)

  function clearFilters() {
    setCategory('همه')
    setPickupDay('all')
    setMaxDistance(5)
    setQuery('')
  }

  function openFiltersModal() {
    setDraftCategory(category)
    setDraftPickupDay(pickupDay)
    setDraftMaxDistance(maxDistance)
    setFiltersOpen(true)
  }

  return (
    <div className="min-w-0 flex-1 bg-background text-text-primary">
      <CollectionHeader title={collection.title} />

      <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 pb-8 pt-5 sm:gap-8 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8">
        <section className="space-y-4">
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              to="/"
              aria-label="بازگشت به اکتشاف"
              className="grid size-11 shrink-0 place-items-center rounded-md border border-border-default bg-surface text-primary hover:bg-surface-secondary"
            >
              <ArrowRight strokeWidth={1.75} />
            </Link>
            <h1 className="text-title-lg text-primary sm:text-title-xl">{collection.title}</h1>
          </div>

          <div className="flex items-center gap-2">
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
              icon={<SlidersHorizontal strokeWidth={1.75} />}
              onClick={openFiltersModal}
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
          </div>

          <div
            aria-label="دسته‌بندی پیشنهادها"
            className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {categories.map((option) => {
              const active = category === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategory(option)}
                  aria-pressed={active}
                  className={[
                    'min-h-11 shrink-0 rounded-full border px-4 text-label-md transition-colors',
                    active
                      ? 'border-primary bg-primary-subtle text-primary'
                      : 'border-border-input bg-surface text-primary hover:bg-surface-secondary',
                  ].join(' ')}
                >
                  {option}
                </button>
              )
            })}
          </div>

          {(category !== 'همه' || pickupDay !== 'all' || maxDistance !== 5 || query.trim()) && (
            <div className="flex flex-wrap items-center gap-2" aria-label="فیلترهای فعال">
              {category !== 'همه' && (
                <ActiveFilterChip label={category} onClear={() => setCategory('همه')} />
              )}
              {pickupDay !== 'all' && (
                <ActiveFilterChip
                  label={pickupDay === 'today' ? 'تحویل امروز' : 'تحویل فردا'}
                  onClear={() => setPickupDay('all')}
                />
              )}
              {maxDistance !== 5 && (
                <ActiveFilterChip
                  label={`تا ${formatDistanceKm(maxDistance)}`}
                  onClear={() => setMaxDistance(5)}
                />
              )}
              <Button variant="tertiary" size="sm" onClick={clearFilters}>
                پاک کردن فیلترها
              </Button>
            </div>
          )}
        </section>

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

          {offers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
              {offers.map((offer) => (
                <FoodListingCard
                  key={offer.id}
                  {...offer}
                  renderLink={
                    offer.storeId
                      ? (props) => <Link to={`/stores/${offer.storeId}`} {...props} />
                      : undefined
                  }
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
      </main>

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
              setDraftCategory('همه')
              setDraftPickupDay('all')
              setDraftMaxDistance(5)
            }}
          >
            پاک کردن همه
          </Button>
        }
        footer={
          <Button
            fullWidth
            onClick={() => {
              setCategory(draftCategory)
              setPickupDay(draftPickupDay)
              setMaxDistance(draftMaxDistance)
              setFiltersOpen(false)
            }}
          >
            نمایش {draftOfferCount.toLocaleString('fa-IR')} نتیجه
          </Button>
        }
      >
        <fieldset className="space-y-2 border-b border-border-default pb-5">
          <legend className="mb-2 text-label-lg">دسته‌بندی غذا</legend>
          {categories.map((option) => (
            <Radio
              key={option}
              name="collection-category"
              value={option}
              label={option}
              checked={draftCategory === option}
              onChange={() => setDraftCategory(option)}
            />
          ))}
        </fieldset>

        <fieldset className="space-y-2 border-b border-border-default pb-5">
          <legend className="mb-2 text-label-lg">زمان دریافت</legend>
          {pickupDays.map((option) => (
            <Radio
              key={option.value}
              name="collection-pickup"
              value={option.value}
              label={option.label}
              checked={draftPickupDay === option.value}
              onChange={() => setDraftPickupDay(option.value)}
            />
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-label-lg">فاصله از شما</legend>
          {distances.map((distance) => (
            <Radio
              key={distance}
              name="collection-distance"
              value={String(distance)}
              label={`تا ${formatDistanceKm(distance)}`}
              checked={draftMaxDistance === distance}
              onChange={() => setDraftMaxDistance(distance)}
            />
          ))}
        </fieldset>
      </Modal>
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
