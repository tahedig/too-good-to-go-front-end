import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Map as MapIcon, MapPin, SlidersHorizontal, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Radio } from '@/components/ui/Radio'
import { SearchField } from '@/components/ui/SearchField'
import { DiscoveryMapCanvas } from '@/features/discovery/components/DiscoveryMapCanvas'
import { discoverySections, type DiscoveryOffer } from '@/features/discovery/mockData'
import { formatDistanceKm, formatPrice } from '@/lib/format'

const categories = ['همه', 'نانوایی', 'غذای آماده', 'کافه', 'خواربار']
const sortOptions = [
  { value: 'distance', label: 'نزدیک‌ترین' },
  { value: 'price', label: 'ارزان‌ترین' },
]

type SortOrder = (typeof sortOptions)[number]['value']

const mapOffers: DiscoveryOffer[] = Array.from(
  new globalThis.Map<string, DiscoveryOffer>(
    discoverySections.flatMap((section) => section.offers).map((offer) => [offer.id, offer]),
  ).values(),
)

function MapHeader({
  hasLocation,
  onClearLocation,
}: {
  hasLocation: boolean
  onClearLocation: () => void
}) {
  return (
    <header className="border-b border-border-default bg-background">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:h-20 sm:px-8 lg:px-20">
        <div className="flex items-center gap-3">
          {hasLocation ? (
            <button
              type="button"
              onClick={onClearLocation}
              className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-body-md text-primary hover:bg-surface-secondary"
              aria-label="تغییر محدوده‌ی انتخاب‌شده"
            >
              <MapPin className="size-6" strokeWidth={1.75} />
              <span className="hidden sm:inline">تهران، ولیعصر</span>
              <span className="sm:hidden">ولیعصر</span>
            </button>
          ) : (
            <span className="inline-flex min-h-11 items-center gap-2 px-2 text-body-md text-text-secondary">
              <MapPin className="size-6 text-primary" strokeWidth={1.75} />
              <span className="hidden sm:inline">موقعیت انتخاب نشده</span>
            </span>
          )}
        </div>

        <Link to="/" className="text-title-lg font-bold text-primary sm:text-title-xl">
          ته‌دیگ
        </Link>

        <Link
          to="/login"
          aria-label="پروفایل"
          className="grid size-11 place-items-center rounded-md border border-border-default bg-surface text-primary hover:bg-surface-secondary"
        >
          <UserRound strokeWidth={1.75} />
        </Link>
      </div>
    </header>
  )
}

function LocationRequired({ onChoose }: { onChoose: () => void }) {
  return (
    <div className="mx-auto grid w-full max-w-[1180px] gap-6 px-4 pb-28 pt-6 sm:px-6 sm:pb-12 lg:min-h-[calc(100vh-160px)] lg:grid-cols-[400px_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-20 lg:py-12">
      <div className="order-2 flex flex-col items-center gap-4 rounded-2xl bg-surface p-6 text-center shadow-1 lg:order-1">
        <div className="flex items-center justify-center gap-3 text-primary">
          <h2 className="text-title-md">برای دیدن پیشنهادهای اطراف، موقعیتت را انتخاب کن</h2>
          <MapIcon className="size-6 shrink-0" strokeWidth={1.75} />
        </div>
        <p className="text-body-md text-text-secondary">
          با انتخاب محدوده، فروشگاه‌ها و پیشنهادهای نزدیک به تو روی نقشه نمایش داده می‌شوند.
        </p>
        <Button
          variant="secondary"
          fullWidth
          onClick={onChoose}
          icon={<MapPin strokeWidth={1.75} />}
          className="h-[52px]"
        >
          انتخاب موقعیت
        </Button>
      </div>
      <div className="order-1 h-[220px] lg:order-2 lg:h-[420px]">
        <DiscoveryMapCanvas offers={[]} disabled />
      </div>
    </div>
  )
}

function SelectedOffer({ offer }: { offer: DiscoveryOffer }) {
  return (
    <section
      aria-label="جزئیات پیشنهاد انتخاب‌شده"
      className="rounded-2xl border border-border-default bg-surface p-4"
    >
      <div className="flex items-center gap-3">
        <img
          src={offer.imageSrc}
          alt=""
          className="size-20 shrink-0 rounded-lg bg-surface-secondary object-cover"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="truncate text-title-sm text-primary">{offer.merchantName}</h2>
          <p className="text-caption text-text-secondary">{offer.category} · ولیعصر</p>
          <p className="text-caption text-text-secondary">
            تحویل {offer.pickup.replace('امروز، ', '')}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-price-md text-primary">{formatPrice(offer.price)}</p>
          <p className="mt-1 text-caption text-text-secondary">
            {formatDistanceKm(offer.distanceKm)}
          </p>
        </div>
        <Link
          to="/#today-offers"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-primary px-4 text-label-md text-primary transition-colors hover:bg-primary-subtle"
        >
          مشاهده پیشنهادها
          <ArrowRight className="size-5" strokeWidth={1.75} />
        </Link>
      </div>
    </section>
  )
}

export default function MapPage() {
  const [hasLocation, setHasLocation] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('همه')
  const [sortOrder, setSortOrder] = useState<SortOrder>('distance')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState(mapOffers[0]?.id)
  const [recentered, setRecentered] = useState(false)

  const visibleOffers = useMemo(() => {
    const search = query.trim().toLocaleLowerCase()
    const filtered = mapOffers.filter((offer) => {
      const matchesCategory = selectedCategory === 'همه' || offer.category === selectedCategory
      const matchesSearch =
        !search ||
        `${offer.merchantName} ${offer.category} ${offer.description}`
          .toLocaleLowerCase()
          .includes(search)
      return matchesCategory && matchesSearch
    })

    return filtered.sort((a, b) =>
      sortOrder === 'price' ? a.price - b.price : a.distanceKm - b.distanceKm,
    )
  }, [query, selectedCategory, sortOrder])

  const selectedOffer =
    visibleOffers.find((offer) => offer.id === selectedOfferId) ?? visibleOffers[0]

  return (
    <div dir="rtl" className="min-h-screen bg-background text-text-primary">
      <MapHeader hasLocation={hasLocation} onClearLocation={() => setHasLocation(false)} />

      {!hasLocation ? (
        <LocationRequired onChoose={() => setHasLocation(true)} />
      ) : (
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-5 sm:px-6 sm:pb-10 sm:pt-8 lg:px-20">
          <div className="mb-5 flex items-center gap-3">
            <Link
              to="/"
              aria-label="بازگشت به اکتشاف"
              className="grid size-11 shrink-0 place-items-center rounded-md border border-border-default bg-surface text-primary hover:bg-surface-secondary"
            >
              <ArrowRight strokeWidth={1.75} />
            </Link>
            <h1 className="min-w-0 flex-1 text-title-lg text-primary sm:text-title-xl">
              نقشه فروشگاه‌ها
            </h1>
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchField
              label="جستجوی فروشگاه‌ها روی نقشه"
              placeholder="جستجوی غذا یا فروشگاه محلی"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1"
            />
            <Button
              variant="secondary"
              size="md"
              icon={<SlidersHorizontal strokeWidth={1.75} />}
              onClick={() => setFiltersOpen(true)}
              className="h-13 shrink-0"
            >
              فیلترها
            </Button>
          </div>

          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => {
              const active = selectedCategory === category
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={active}
                  className={[
                    'min-h-11 shrink-0 rounded-md border px-4 text-label-md transition-colors',
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

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
            <div className="relative h-[min(56vh,560px)] min-h-[390px] lg:h-[calc(100vh-300px)] lg:min-h-[560px]">
              <DiscoveryMapCanvas
                offers={visibleOffers}
                selectedOfferId={selectedOffer?.id}
                onOfferSelect={(offer) => setSelectedOfferId(offer.id)}
                onRecenter={() => setRecentered(true)}
              />
              {recentered && (
                <p
                  role="status"
                  className="absolute bottom-4 left-16 rounded-md bg-surface px-3 py-2 text-caption text-primary shadow-2"
                >
                  نقشه روی موقعیت شما تنظیم شد
                </p>
              )}
            </div>

            <aside className="flex min-w-0 flex-col gap-4">
              {selectedOffer ? (
                <SelectedOffer offer={selectedOffer} />
              ) : (
                <p className="rounded-2xl border border-border-default bg-surface p-5 text-body-md text-text-secondary">
                  پیشنهادی با این جستجو پیدا نشد.
                </p>
              )}
              <section aria-label="پیشنهادهای نزدیک" className="min-h-0">
                <h2 className="mb-3 text-title-sm text-primary">پیشنهادهای نزدیک شما</h2>
                <div className="flex gap-3 overflow-x-auto pb-2 lg:max-h-[calc(100vh-480px)] lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
                  {visibleOffers.map((offer) => {
                    const active = offer.id === selectedOffer?.id
                    return (
                      <button
                        key={offer.id}
                        type="button"
                        onClick={() => setSelectedOfferId(offer.id)}
                        aria-pressed={active}
                        className={[
                          'flex min-w-[240px] flex-1 items-center gap-3 rounded-xl border p-3 text-start transition-colors lg:min-w-0',
                          active
                            ? 'border-primary bg-primary-subtle'
                            : 'border-border-default bg-surface hover:bg-surface-secondary',
                        ].join(' ')}
                      >
                        <img
                          src={offer.imageSrc}
                          alt=""
                          className="size-14 shrink-0 rounded-md object-cover"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-label-md text-primary">
                            {offer.merchantName}
                          </span>
                          <span className="mt-1 block text-caption text-text-secondary">
                            {formatDistanceKm(offer.distanceKm)} · {offer.category}
                          </span>
                        </span>
                        <span className="shrink-0 text-caption font-semibold text-primary">
                          {formatPrice(offer.price)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            </aside>
          </div>
        </main>
      )}

      <Modal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        variant="sheet"
        title="فیلترهای نقشه"
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
          <legend className="mb-2 text-label-md">دسته‌بندی</legend>
          {categories.map((category) => (
            <Radio
              key={category}
              name="map-category"
              value={category}
              label={category}
              checked={selectedCategory === category}
              onChange={() => setSelectedCategory(category)}
            />
          ))}
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="mb-2 text-label-md">مرتب‌سازی بر اساس</legend>
          {sortOptions.map((option) => (
            <Radio
              key={option.value}
              name="map-sort"
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
