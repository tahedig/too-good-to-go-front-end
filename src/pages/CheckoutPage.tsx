import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Clock3, Info, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { catalogueService } from '@/services/catalogueService'
import type { CatalogueOfferDetailDto } from '@/types/catalogueTypes'
import { reservationApi } from '@/features/reservations/api/reservationApi'
import { ApiError } from '@/lib/api/client'
import { formatDateTime, formatPrice } from '@/lib/format'
import { toEnglishDigits } from '@/lib/digits'

type CheckoutOffer = {
  id: string
  title: string
  category: string
  storeName: string
  imageSrc: string
  price: number
  originalPrice: number
  quantityAvailable: number
  pickupWindow: string
  address: string
  pickupInstructions: string
  allergens: string[]
  allergensDeclared: boolean
  cancellationDeadline?: string
}

function mapOffer(offer: CatalogueOfferDetailDto): CheckoutOffer {
  return {
    id: offer.id,
    title: offer.title,
    category: offer.category_name ?? offer.category_slug ?? 'غافلگیری',
    storeName: offer.store.name,
    imageSrc: offer.image_url ?? '',
    price: offer.price,
    originalPrice: offer.original_price,
    quantityAvailable: offer.quantity_available,
    pickupWindow: offer.pickup_window,
    address: offer.store.address,
    pickupInstructions: offer.store.pickup_instructions ?? '',
    allergens: offer.allergens.map((allergen) => allergen.label),
    allergensDeclared: offer.allergens_declared,
    cancellationDeadline: offer.cancellation_deadline,
  }
}

function CheckoutNotice({ children }: { children: string }) {
  return (
    <p className="flex items-start gap-3 rounded-lg bg-accent-subtle p-4 text-body-md text-primary">
      <Info className="mt-0.5 size-6 shrink-0" strokeWidth={1.75} />
      {children}
    </p>
  )
}

export default function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const productId = searchParams.get('productId') ?? ''
  const requestedQuantity = Number(toEnglishDigits(searchParams.get('quantity') ?? ''))
  const requestedQuantityIsValid = Number.isSafeInteger(requestedQuantity) && requestedQuantity >= 1
  const [quantity, setQuantity] = useState(requestedQuantityIsValid ? requestedQuantity : 1)
  const [acceptPickupTerms, setAcceptPickupTerms] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [requiresLogin, setRequiresLogin] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [remoteOfferState, setRemoteOfferState] = useState<
    | { status: 'loading' }
    | { productId: string; status: 'loading' }
    | { productId: string; status: 'error'; message: string }
    | { productId: string; status: 'ready'; offer: CheckoutOffer }
  >({ status: 'loading' })
  const idempotencyKey = useRef<string | null>(null)

  useEffect(() => {
    if (!requestedQuantityIsValid || !productId) return

    const controller = new AbortController()
    catalogueService
      .getOffer(productId, controller.signal)
      .then((offer) => setRemoteOfferState({ productId, status: 'ready', offer: mapOffer(offer) }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setRemoteOfferState({
            productId,
            status: 'error',
            message: error instanceof Error ? error.message : 'دریافت اطلاعات محصول ناموفق بود.',
          })
        }
      })

    return () => controller.abort()
  }, [productId, requestedQuantityIsValid])

  async function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!acceptPickupTerms) {
      setFeedback('برای ادامه، شرایط تحویل را بپذیرید.')
      return
    }

    if (!offer || isSubmitting) return
    if (!quantityIsValid) {
      setFeedback('تعداد بسته‌ها معتبر نیست.')
      return
    }

    setIsSubmitting(true)
    setFeedback('')
    setRequiresLogin(false)

    try {
      idempotencyKey.current ??= crypto.randomUUID()
      const reservation = await reservationApi.create(
        {
          offer_id: offer.id,
          quantity,
          terms_accepted: true,
        },
        idempotencyKey.current,
      )
      navigate(`/reservations/${encodeURIComponent(reservation.id)}/confirmation`, {
        state: { reservation },
      })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setRequiresLogin(true)
        setFeedback('برای ثبت رزرو وارد حساب کاربری شوید.')
      } else if (error instanceof ApiError && error.status === 404) {
        setFeedback('این پیشنهاد دیگر در دسترس نیست.')
      } else if (error instanceof ApiError && error.status === 409) {
        setFeedback('موجودی یا وضعیت این پیشنهاد تغییر کرده است. جزئیات را دوباره بررسی کنید.')
      } else {
        setFeedback(
          error instanceof Error ? error.message : 'ثبت رزرو ناموفق بود. لطفاً دوباره تلاش کنید.',
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const remoteStateMatchesProduct =
    'productId' in remoteOfferState && remoteOfferState.productId === productId
  const offer =
    remoteStateMatchesProduct && remoteOfferState.status === 'ready'
      ? remoteOfferState.offer
      : undefined

  if (
    !requestedQuantityIsValid ||
    !productId ||
    (!offer && remoteStateMatchesProduct && remoteOfferState.status === 'error')
  ) {
    const message = !requestedQuantityIsValid
      ? 'تعداد انتخاب‌شده معتبر نیست.'
      : !productId
        ? 'شناسهٔ پیشنهاد مشخص نشده است.'
        : remoteStateMatchesProduct && remoteOfferState.status === 'error'
          ? remoteOfferState.message
          : ''
    return (
      <div dir="rtl" className="min-h-dvh bg-background px-4 pb-8 text-text-primary">
        <main className="mx-auto max-w-[430px] py-10">
          <Link to="/" className="text-label-md text-primary underline">
            بازگشت به پیشنهادها
          </Link>
          <p
            role="alert"
            className="mt-6 rounded-lg bg-surface p-5 text-body-md text-text-secondary"
          >
            {message}
          </p>
        </main>
      </div>
    )
  }

  if (!offer) {
    return (
      <div dir="rtl" className="min-h-dvh bg-background px-4 pb-8 text-text-primary">
        <main className="mx-auto max-w-[430px] py-10">
          <Link to="/" className="text-label-md text-primary underline">
            بازگشت به پیشنهادها
          </Link>
          <p
            role="status"
            className="mt-6 rounded-lg bg-surface p-5 text-body-md text-text-secondary"
          >
            در حال بررسی موجودی و جزئیات…
          </p>
        </main>
      </div>
    )
  }

  const subtotal = offer.price * quantity
  const quantityIsValid =
    Number.isSafeInteger(quantity) && quantity >= 1 && quantity <= offer.quantityAvailable
  const pickupInstructions = offer.pickupInstructions ? ` ${offer.pickupInstructions}` : ''

  return (
    <div dir="rtl" className="min-h-dvh bg-background px-4 pb-8 text-text-primary">
      <main className="mx-auto max-w-[430px]">
        <header className="flex h-[94px] items-center gap-3">
          <Link
            to={`/products/${encodeURIComponent(offer.id)}`}
            aria-label="بازگشت به جزئیات محصول"
            className="grid size-11 shrink-0 place-items-center rounded-md border border-border-default bg-surface text-primary"
          >
            <ArrowRight strokeWidth={1.75} />
          </Link>
          <h1 className="flex-1 text-title-xl text-primary">بررسی بسته شما</h1>
        </header>

        <form onSubmit={submitReservation} className="space-y-6">
          <section aria-label="محصول انتخاب‌شده" className="rounded-2xl bg-surface p-5">
            <div className="flex items-start gap-3">
              {offer.imageSrc ? (
                <img
                  src={offer.imageSrc}
                  alt=""
                  className="size-20 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="size-20 shrink-0 rounded-lg bg-surface-secondary"
                />
              )}
              <div className="min-w-0 flex-1 text-end">
                <h2 className="truncate text-title-sm text-primary">{offer.title}</h2>
                <p className="mt-1 text-caption text-text-secondary">
                  {offer.storeName} · {offer.category}
                </p>
                <div className="mt-2 flex items-baseline justify-end gap-2">
                  <span className="text-price-md text-primary">{formatPrice(offer.price)}</span>
                  <span className="text-caption text-text-secondary line-through">
                    {formatPrice(offer.originalPrice)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <QuantityStepper
                value={quantity}
                min={1}
                max={Math.max(1, offer.quantityAvailable)}
                onChange={(value) => {
                  setQuantity(value)
                  setFeedback('')
                  idempotencyKey.current = null
                }}
                label="تعداد بسته‌ها"
              />
            </div>
            {quantity > offer.quantityAvailable && offer.quantityAvailable > 0 && (
              <p role="alert" className="mt-3 text-body-md text-error">
                موجودی فعلی {offer.quantityAvailable.toLocaleString('fa-IR')} بسته است؛ تعداد را
                کاهش دهید.
              </p>
            )}
          </section>

          <section aria-labelledby="pickup-heading" className="rounded-2xl bg-surface p-5">
            <h2 id="pickup-heading" className="text-title-md text-primary">
              تحویل امروز
            </h2>
            <div className="mt-4 space-y-3 text-body-md">
              <p className="flex items-center gap-2">
                <Clock3 className="size-6 shrink-0" strokeWidth={1.75} />
                {offer.pickupWindow}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-6 shrink-0" strokeWidth={1.75} />
                {offer.address}
              </p>
              {pickupInstructions && (
                <p className="text-caption text-text-secondary">{pickupInstructions}</p>
              )}
            </div>
          </section>

          <section aria-label="خلاصه هزینه" className="space-y-4 rounded-2xl bg-surface p-5">
            <div className="flex items-center justify-between gap-4 text-label-md">
              <span>{quantity.toLocaleString('fa-IR')} بسته</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-label-md">
              <span>کارمزد خدمات</span>
              <span>محاسبه در پاسخ رزرو</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border-default pt-4 text-title-md text-primary">
              <span>مبلغ قابل پرداخت</span>
              <span>پس از ثبت رزرو مشخص می‌شود</span>
            </div>
          </section>

          <section aria-labelledby="before-reserving">
            <h2 id="before-reserving" className="mb-3 text-title-md text-primary">
              پیش از رزرو
            </h2>
            <div className="space-y-3">
              <CheckoutNotice>
                {offer.allergensDeclared
                  ? `حساسیت‌زاها: ${offer.allergens.join('، ') || 'موردی اعلام نشده است.'}`
                  : 'مواد اولیه و حساسیت‌زاها اعلام نشده‌اند.'}
              </CheckoutNotice>
              <CheckoutNotice>
                {offer.cancellationDeadline
                  ? `مهلت لغو تا ${formatDateTime(offer.cancellationDeadline)} است.`
                  : 'مهلت لغو در جزئیات این پیشنهاد مشخص نشده است.'}
              </CheckoutNotice>
            </div>
          </section>

          <div>
            <label className="flex min-h-11 items-center gap-3 text-body-md text-primary">
              <input
                type="checkbox"
                checked={acceptPickupTerms}
                onChange={(event) => {
                  setAcceptPickupTerms(event.target.checked)
                  setFeedback('')
                }}
                className="size-6 accent-primary"
              />
              شرایط تحویل را می‌پذیرم
            </label>
            {feedback && (
              <p
                role={acceptPickupTerms ? 'status' : 'alert'}
                className="mt-2 text-body-md text-text-secondary"
              >
                {feedback}
              </p>
            )}
            {requiresLogin && (
              <Link
                to="/login"
                className="mt-2 inline-flex min-h-11 items-center text-label-md text-primary underline"
              >
                ورود به حساب کاربری
              </Link>
            )}
          </div>

          {offer.quantityAvailable === 0 && (
            <p role="alert" className="rounded-lg bg-error-subtle p-4 text-body-md text-error">
              موجودی این پیشنهاد به پایان رسیده است.
            </p>
          )}

          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting}
            disabled={
              isSubmitting ||
              !acceptPickupTerms ||
              !quantityIsValid ||
              offer.quantityAvailable === 0
            }
            className="h-[52px]"
          >
            ثبت رزرو
          </Button>
        </form>
      </main>
    </div>
  )
}
