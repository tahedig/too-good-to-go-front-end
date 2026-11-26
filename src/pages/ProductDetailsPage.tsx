import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Check, Clock3, Heart, Info, MapPin, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { publicStores, type PublicStore, type StoreProduct } from '@/features/store/mockData'
import { discoveryApi, type OfferDetail } from '@/features/discovery/api/discoveryApi'
import { formatDateTime, formatDistanceKm, formatPrice } from '@/lib/format'

type ProductListing = {
  product: StoreProduct
  store: PublicStore
}

type ProductDetailsData = {
  id: string
  storeId: string
  storeName: string
  category: string
  distanceText?: string
  name: string
  description: string
  price: number
  referenceValue: number
  pickup: string
  imageSrc: string
  remaining: number
  availabilityBadge?: string
  address: string
  pickupInstructions: string
  allergens: string[]
  allergensDeclared: boolean
  cancellationDeadline?: string
  isLive: boolean
}

function findProduct(productId: string): ProductListing | undefined {
  for (const store of Object.values(publicStores)) {
    const product = store.products.find((item) => item.id === productId)
    if (product) return { product, store }
  }
}

function mapMockProduct({ product, store }: ProductListing): ProductDetailsData {
  return {
    id: product.id,
    storeId: store.id,
    storeName: store.name,
    category: product.category,
    distanceText: formatDistanceKm(product.distanceKm),
    name: product.name,
    description: product.description,
    price: product.price,
    referenceValue: product.referenceValue,
    pickup: product.pickup,
    imageSrc: product.imageSrc,
    remaining: product.remaining,
    address: store.address,
    pickupInstructions: store.pickupGuide,
    allergens: [],
    allergensDeclared: false,
    isLive: false,
  }
}

function mapOffer(offer: OfferDetail): ProductDetailsData {
  return {
    id: offer.id,
    storeId: offer.store.id,
    storeName: offer.store.name,
    category: offer.category_name ?? offer.category_slug ?? 'غافلگیری',
    distanceText:
      offer.distance_text ??
      (offer.distance_m === undefined ? undefined : formatDistanceKm(offer.distance_m / 1000)),
    name: offer.title,
    description: offer.description,
    price: offer.price,
    referenceValue: offer.original_price,
    pickup: offer.pickup_window,
    imageSrc: offer.image_url ?? '',
    remaining: offer.quantity_available,
    availabilityBadge: offer.availability_badge,
    address: offer.store.address,
    pickupInstructions: offer.store.pickup_instructions ?? '',
    allergens: offer.allergens.map((allergen) => allergen.label),
    allergensDeclared: offer.allergens_declared,
    cancellationDeadline: offer.cancellation_deadline,
    isLive: true,
  }
}

function ProductDetailsContent({ product }: { product: ProductDetailsData }) {
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [saved, setSaved] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const available = product.remaining > 0
  const cancellationNotice = product.cancellationDeadline
    ? `امکان لغو تا ${formatDateTime(product.cancellationDeadline)} وجود دارد.`
    : 'لغو تا ساعت ۱۶:۰۰ امکان‌پذیر است؛ پس از آن امکان لغو نیست.'

  async function shareProduct() {
    setShareMessage('')
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url: window.location.href })
        return
      }
      if (!navigator.clipboard) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(window.location.href)
      setShareMessage('پیوند محصول کپی شد.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setShareMessage('اشتراک‌گذاری محصول ممکن نشد.')
    }
  }

  return (
    <div dir="rtl" className="min-h-dvh bg-background text-text-primary">
      <header className="mx-auto flex h-20 max-w-[720px] items-center gap-3 px-4 sm:px-8">
        <Link
          to={product.isLive ? '/' : `/stores/${product.storeId}`}
          aria-label="بازگشت"
          className="grid size-11 shrink-0 place-items-center rounded-md border border-border-default bg-surface text-primary"
        >
          <ArrowRight strokeWidth={1.75} />
        </Link>
        <h1 className="truncate text-title-lg text-primary">غافلگیری {product.category}</h1>
      </header>

      <main className="mx-auto max-w-[720px] pb-10">
        {product.imageSrc ? (
          <img
            src={product.imageSrc}
            alt={`پیشنهاد ${product.name} از ${product.storeName}`}
            className="h-[292px] w-full object-cover sm:rounded-lg"
          />
        ) : (
          <div
            role="img"
            aria-label={`تصویری برای ${product.name} ثبت نشده است`}
            className="h-[292px] w-full bg-surface-secondary sm:rounded-lg"
          />
        )}

        <div className="space-y-6 px-4 pt-6 sm:px-8">
          <section aria-labelledby="product-name">
            <div className="mb-6 flex flex-row-reverse items-center justify-between">
              <div className="flex flex-row-reverse items-center gap-2">
                <button
                  type="button"
                  aria-label="اشتراک‌گذاری محصول"
                  onClick={shareProduct}
                  className="grid size-11 place-items-center rounded-md border border-border-default bg-surface text-primary"
                >
                  <Share2 strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  aria-label={saved ? 'حذف از ذخیره‌ها' : 'ذخیره محصول'}
                  aria-pressed={saved}
                  onClick={() => setSaved((value) => !value)}
                  className="grid size-11 place-items-center rounded-md border border-border-default bg-surface text-primary"
                >
                  <Heart fill={saved ? 'currentColor' : 'none'} strokeWidth={1.75} />
                </button>
              </div>
              <span
                className={[
                  'inline-flex items-center gap-1 rounded-md px-3 py-2 text-caption font-semibold',
                  available ? 'bg-success-subtle text-primary' : 'bg-error-subtle text-error',
                ].join(' ')}
              >
                {available ? 'موجود' : 'ناموجود'}
                {available && <Check className="size-4" strokeWidth={1.75} />}
              </span>
            </div>

            {shareMessage && (
              <p role="status" className="mb-3 text-body-md text-text-secondary">
                {shareMessage}
              </p>
            )}

            <h2 id="product-name" className="text-title-xl text-primary">
              {product.name}
            </h2>
            <p className="mt-2 text-body-md text-text-secondary">
              {product.category}
              {product.distanceText && ` · ${product.distanceText}`}
            </p>
            <p className="mt-2 text-body-md text-primary">
              {product.availabilityBadge ??
                `${product.remaining.toLocaleString('fa-IR')} بسته موجود`}
            </p>

            <p className="mt-7 flex flex-wrap items-baseline gap-2">
              <span className="text-price-lg text-primary">{formatPrice(product.price)}</span>
              <span className="text-caption text-text-secondary line-through">
                {formatPrice(product.referenceValue)} ارزش
              </span>
            </p>
            <p className="mt-5 text-body-lg text-text-primary">{product.description}</p>

            <div className="mt-4 flex items-start gap-3 rounded-lg bg-surface-sage p-4 text-body-md text-primary">
              <Info className="mt-0.5 size-6 shrink-0" strokeWidth={1.75} />
              <p>
                محتویات و تعداد دقیق ممکن است متفاوت باشد. انتخاب بسته به موجودی پایان روز دارد.
              </p>
            </div>
          </section>

          <section aria-labelledby="pickup-heading" className="rounded-2xl bg-surface p-5">
            <h2 id="pickup-heading" className="text-title-md text-primary">
              تحویل شما
            </h2>
            <div className="mt-4 space-y-4 text-body-md">
              <p className="flex items-center gap-2">
                <Clock3 className="size-6 shrink-0" strokeWidth={1.75} />
                {product.pickup}
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="size-6 shrink-0" strokeWidth={1.75} />
                {product.address}
              </p>
              {product.pickupInstructions && (
                <p className="text-body-md text-text-secondary">{product.pickupInstructions}</p>
              )}
              <Button
                variant="secondary"
                fullWidth
                onClick={() => navigate('/map')}
                className="h-13"
              >
                مسیریابی
              </Button>
            </div>
          </section>

          <section aria-label="رزرو محصول" className="rounded-2xl bg-surface p-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-label-md text-primary">بسته‌ها</span>
              <QuantityStepper
                value={quantity}
                min={1}
                max={Math.max(1, product.remaining)}
                disabled={!available}
                onChange={setQuantity}
                label="تعداد بسته‌ها"
              />
            </div>
            <p className="mt-4 text-body-md text-text-secondary">
              مجموع {formatPrice(product.price * quantity)}
            </p>
            <Button
              fullWidth
              disabled={!available}
              onClick={() =>
                navigate(
                  `/checkout?productId=${encodeURIComponent(product.id)}&quantity=${quantity}`,
                )
              }
              className="mt-4"
            >
              رزرو
            </Button>
          </section>

          <section aria-labelledby="allergens-heading">
            <h2 id="allergens-heading" className="text-title-md text-primary">
              مواد اولیه و حساسیت‌زاها
            </h2>
            <div className="mt-4 flex items-center gap-3 rounded-lg bg-accent-subtle p-4 text-body-md text-primary">
              <Info className="size-6 shrink-0" strokeWidth={1.75} />
              {product.allergensDeclared
                ? product.allergens.join('، ') || 'موردی اعلام نشده است.'
                : 'مواد اولیه و حساسیت‌زاها نامشخص است.'}
            </div>
          </section>

          <section aria-labelledby="cancellation-heading">
            <h2 id="cancellation-heading" className="text-title-md text-primary">
              قانون لغو
            </h2>
            <div className="mt-4 flex items-center gap-3 rounded-lg bg-accent-subtle p-4 text-body-md text-primary">
              <Info className="size-6 shrink-0" strokeWidth={1.75} />
              {cancellationNotice}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default function ProductDetailsPage() {
  const { productId = '' } = useParams()
  const mockListing = findProduct(productId)
  const [state, setState] = useState<
    | { status: 'loading' }
    | { productId: string; status: 'loading' }
    | { productId: string; status: 'error'; message: string }
    | { productId: string; status: 'ready'; product: ProductDetailsData }
  >({ status: 'loading' })

  useEffect(() => {
    const mockListing = findProduct(productId)
    if (mockListing || !productId) return

    const controller = new AbortController()
    discoveryApi
      .getOffer(productId, controller.signal)
      .then((offer) => setState({ productId, status: 'ready', product: mapOffer(offer) }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            productId,
            status: 'error',
            message: error instanceof Error ? error.message : 'دریافت اطلاعات محصول ناموفق بود.',
          })
        }
      })

    return () => controller.abort()
  }, [productId])

  if (mockListing) {
    return (
      <ProductDetailsContent key={mockListing.product.id} product={mapMockProduct(mockListing)} />
    )
  }

  if (!productId) {
    return (
      <div dir="rtl" className="min-h-dvh bg-background px-4 text-text-primary">
        <main className="mx-auto max-w-[720px] py-10">
          <Link to="/" className="text-label-md text-primary underline">
            بازگشت به پیشنهادها
          </Link>
          <p
            role="alert"
            className="mt-6 rounded-lg bg-surface p-5 text-body-md text-text-secondary"
          >
            شناسهٔ محصول مشخص نشده است.
          </p>
        </main>
      </div>
    )
  }

  if (state.status === 'ready' && state.productId === productId) {
    return <ProductDetailsContent key={state.product.id} product={state.product} />
  }

  const stateMatchesProduct = 'productId' in state && state.productId === productId
  const errorMessage = stateMatchesProduct && state.status === 'error' ? state.message : undefined
  return (
    <div dir="rtl" className="min-h-dvh bg-background px-4 text-text-primary">
      <main className="mx-auto max-w-[720px] py-10">
        <Link to="/" className="text-label-md text-primary underline">
          بازگشت به پیشنهادها
        </Link>
        <p
          role={errorMessage ? 'alert' : 'status'}
          className="mt-6 rounded-lg bg-surface p-5 text-body-md text-text-secondary"
        >
          {errorMessage ?? 'در حال دریافت اطلاعات محصول…'}
        </p>
      </main>
    </div>
  )
}
