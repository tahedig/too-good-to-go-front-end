import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Clock3, Compass, Heart, Search, ShoppingBag, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FoodListingCard } from '@/components/ui/FoodListingCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { publicStores, type PublicStore } from '@/features/store/mockData'

function CustomerSidebar() {
  const navItems = [
    { to: '/', label: 'اکتشاف', Icon: Compass, active: true },
    { to: '/favorites', label: 'ذخیره‌ها', Icon: Heart },
    { to: '/orders', label: 'سفارشات', Icon: ShoppingBag },
    { to: '/profile', label: 'پروفایل', Icon: UserRound },
  ]

  return (
    <aside className="sticky top-0 hidden h-screen w-65 shrink-0 flex-col border-s border-border-default bg-surface px-6 py-7 lg:flex">
      <Link
        to="/"
        className="mb-6 flex items-center justify-between border-b border-border-default px-4 pb-5 text-title-lg font-bold text-primary"
      >
        <span>ته‌دیگ</span>
        <UserRound className="size-7" strokeWidth={1.75} />
      </Link>
      <nav aria-label="ناوبری مشتری" className="flex flex-col gap-2">
        {navItems.map(({ to, label, Icon, active }) => (
          <Link
            key={to}
            to={to}
            className={[
              'flex min-h-12 items-center gap-3 rounded-md px-4 text-body-md transition-colors',
              active
                ? 'bg-primary-subtle font-semibold text-primary'
                : 'text-text-secondary hover:bg-surface-secondary hover:text-primary',
            ].join(' ')}
          >
            <Icon className="size-6" strokeWidth={1.75} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

function StoreHeader() {
  return (
    <header className="flex h-16 items-center bg-surface px-4 sm:h-21 sm:px-8 lg:px-20">
      <Link
        to="/"
        className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-title-sm text-primary hover:bg-surface-secondary"
      >
        <ArrowRight className="size-6" strokeWidth={1.75} />
        صفحه فروشگاه
      </Link>
    </header>
  )
}

function StoreSummary({ store }: { store: PublicStore }) {
  const isClosed = store.availability === 'closed'

  return (
    <section className="rounded-lg bg-surface p-4 sm:p-6" aria-labelledby="store-name">
      <h1 id="store-name" className="text-title-lg text-primary sm:text-title-xl">
        {store.name}
      </h1>
      <p
        className={[
          'mt-1 text-body-md sm:text-body-lg',
          isClosed ? 'text-error' : 'text-text-secondary',
        ].join(' ')}
      >
        {store.category} · {isClosed ? 'اکنون بسته' : store.neighborhood}
      </p>
      {!isClosed && <StatusBadge status="active" label="باز است" className="mt-2" />}
      <h2 className="mt-2 text-title-sm text-primary">درباره فروشگاه</h2>
      <p className="mt-2 text-body-lg text-text-primary">{store.description}</p>
    </section>
  )
}

function LocationCard({ store }: { store: PublicStore }) {
  const navigate = useNavigate()

  return (
    <section className="rounded-lg bg-surface p-4 sm:p-6" aria-labelledby="hours-title">
      <h2 id="hours-title" className="text-title-sm text-primary">
        ساعت کاری و موقعیت
      </h2>
      <p className="mt-1 text-body-md text-text-secondary">{store.address}</p>
      <h3 className="mt-3 text-title-sm text-primary">ساعت کاری</h3>
      <dl className="mt-2 space-y-2 text-body-md text-text-primary">
        {store.openingHours.map((item) => (
          <div key={item.days} className="flex items-center justify-between gap-4">
            <dt>{item.days}</dt>
            <dd className={item.hours === 'تعطیل' ? 'text-text-secondary' : ''}>{item.hours}</dd>
          </div>
        ))}
      </dl>
      <Button variant="secondary" fullWidth className="mt-3" onClick={() => navigate('/map')}>
        مشاهده روی نقشه
      </Button>
    </section>
  )
}

function PickupCard({ store }: { store: PublicStore }) {
  return (
    <section className="rounded-lg bg-surface p-4 sm:p-6" aria-labelledby="pickup-title">
      <h2 id="pickup-title" className="text-title-sm text-primary">
        راهنمای دریافت
      </h2>
      <p className="mt-2 text-body-md text-text-primary">{store.pickupGuide}</p>
      {store.pickupSummary && store.availability === 'available' && (
        <p className="mt-1 text-body-md text-text-secondary">{store.pickupSummary}</p>
      )}
    </section>
  )
}

function EmptyProducts({ closed }: { closed: boolean }) {
  return (
    <div className="rounded-lg bg-surface px-5 py-8 text-center sm:px-8">
      <div className="flex items-center justify-center gap-3">
        {!closed && <Search className="size-8 text-primary" strokeWidth={1.75} />}
        <h3 className="text-title-md text-primary">
          {closed ? 'در ساعت کاری برگردید' : 'محصولی برای رزرو موجود نیست'}
        </h3>
      </div>
      <p className="mt-3 text-body-md text-text-secondary">
        {closed
          ? 'محصولات این فروشگاه فعلاً قابل رزرو نیستند.'
          : 'محصولات تازه این فروشگاه اینجا نمایش داده می‌شوند.'}
      </p>
    </div>
  )
}

function ProductSection({ store }: { store: PublicStore }) {
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const closed = store.availability === 'closed'

  return (
    <section aria-labelledby="products-title" className="min-w-0">
      <div className="mb-3 flex items-center justify-center gap-2 sm:justify-start lg:justify-center">
        {closed && <Clock3 className="size-6 text-primary" strokeWidth={1.75} />}
        <h2 id="products-title" className="text-title-md text-primary">
          {closed ? 'فروشگاه بسته است' : 'محصولات فروشگاه'}
        </h2>
      </div>

      {store.products.length > 0 ? (
        <div className="space-y-2">
          {store.products.map((product) => (
            <FoodListingCard
              key={product.id}
              merchantName={product.name}
              category={product.category}
              distanceKm={product.distanceKm}
              description={product.description}
              price={product.price}
              referenceValue={product.referenceValue}
              pickup={product.pickup}
              imageSrc={product.imageSrc}
              status="available"
              statusLabel={`${product.remaining.toLocaleString('fa-IR')} بسته موجود`}
              saved={saved}
              onSaveChange={setSaved}
              showDescription={false}
              showDisclaimer={false}
              swapImageActions
              className="min-h-[522px]"
            />
          ))}
          <Button fullWidth onClick={() => navigate(`/search?q=${encodeURIComponent(store.name)}`)}>
            مشاهده محصول
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <EmptyProducts closed={closed} />
          <Button variant="secondary" fullWidth onClick={() => navigate('/')}>
            بازگشت به اکتشاف
          </Button>
        </div>
      )}
    </section>
  )
}

export default function PublicStorePage() {
  const { storeId = '' } = useParams()
  const store = publicStores[storeId]

  if (!store) return <Navigate to="/not-found" replace />

  return (
    <div dir="rtl" className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <CustomerSidebar />
        <div className="min-w-0 flex-1">
          <StoreHeader />
          <main className="px-6 pb-10 pt-5 sm:px-8 lg:px-0 lg:pb-16 lg:pt-5">
            <img
              src={store.heroImageSrc}
              alt={`ویترین ${store.name}`}
              className="h-40 w-full rounded-lg object-cover sm:h-64 lg:rounded-e-none"
            />

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] lg:[direction:ltr]">
              <div className="[direction:rtl] lg:col-start-2 lg:row-start-1">
                <StoreSummary store={store} />
              </div>
              <div className="[direction:rtl] lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:pl-20">
                <ProductSection store={store} />
              </div>
              <div className="[direction:rtl] lg:col-start-2 lg:row-start-2">
                <LocationCard store={store} />
              </div>
              <div className="[direction:rtl] lg:col-start-2 lg:row-start-3">
                <PickupCard store={store} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
