import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Clock3, Info, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { publicStores } from '@/features/store/mockData'
import { formatPickupDate, localDate } from '@/lib/vendorReservations'
import { formatPrice } from '@/lib/format'
import { toEnglishDigits } from '@/lib/digits'

function findProduct(productId: string) {
  for (const store of Object.values(publicStores)) {
    const product = store.products.find((item) => item.id === productId)
    if (product) return { product, store }
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
  const productId = searchParams.get('productId') ?? ''
  const requestedQuantity = Number(toEnglishDigits(searchParams.get('quantity') ?? ''))
  const listing = findProduct(productId)
  const [quantity, setQuantity] = useState(requestedQuantity)
  const [acceptPickupTerms, setAcceptPickupTerms] = useState(false)
  const [feedback, setFeedback] = useState('')

  if (!listing) return <Navigate to="/" replace />
  if (
    !Number.isSafeInteger(requestedQuantity) ||
    requestedQuantity < 1 ||
    requestedQuantity > listing.product.remaining
  ) {
    return <Navigate to={`/products/${listing.product.id}`} replace />
  }

  const { product, store } = listing
  const subtotal = product.price * quantity

  function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!acceptPickupTerms) {
      setFeedback('برای ادامه، شرایط تحویل را بپذیرید.')
      return
    }

    setFeedback('ثبت رزرو پس از اتصال سرویس بک‌اند فعال می‌شود.')
  }

  return (
    <div dir="rtl" className="min-h-dvh bg-background px-4 pb-8 text-text-primary">
      <main className="mx-auto max-w-[430px]">
        <header className="flex h-[94px] items-center gap-3">
          <Link
            to={`/products/${product.id}`}
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
              <img
                src={product.imageSrc}
                alt=""
                className="size-20 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1 text-end">
                <h2 className="truncate text-title-sm text-primary">{product.name}</h2>
                <p className="mt-1 text-caption text-text-secondary">
                  بستهٔ غافلگیری {store.category}
                </p>
                <div className="mt-2 flex items-baseline justify-end gap-2">
                  <span className="text-price-md text-primary">{formatPrice(product.price)}</span>
                  <span className="text-caption text-text-secondary line-through">
                    {formatPrice(product.referenceValue)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <QuantityStepper
                value={quantity}
                min={1}
                max={product.remaining}
                onChange={(value) => {
                  setQuantity(value)
                  setFeedback('')
                }}
                label="تعداد بسته‌ها"
              />
            </div>
          </section>

          <section aria-labelledby="pickup-heading" className="rounded-2xl bg-surface p-5">
            <h2 id="pickup-heading" className="text-title-md text-primary">
              تحویل امروز
            </h2>
            <div className="mt-4 space-y-3 text-body-md">
              <p className="flex items-center gap-2">
                <Clock3 className="size-6 shrink-0" strokeWidth={1.75} />
                {product.pickup}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-6 shrink-0" strokeWidth={1.75} />
                {store.address}
              </p>
              <p className="text-caption text-text-secondary">{formatPickupDate(localDate())}</p>
            </div>
          </section>

          <section aria-label="خلاصه هزینه" className="space-y-4 rounded-2xl bg-surface p-5">
            <div className="flex items-center justify-between gap-4 text-label-md">
              <span>{quantity.toLocaleString('fa-IR')} بستهٔ نانوایی</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-label-md">
              <span>کارمزد خدمات</span>
              <span>{formatPrice(0)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border-default pt-4 text-title-md text-primary">
              <span>مبلغ قابل پرداخت</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </section>

          <section aria-labelledby="before-reserving">
            <h2 id="before-reserving" className="mb-3 text-title-md text-primary">
              پیش از رزرو
            </h2>
            <div className="space-y-3">
              <CheckoutNotice>
                محتویات دقیق ممکن است متفاوت باشد. مواد اولیه و حساسیت‌زاها نامشخص است.
              </CheckoutNotice>
              <CheckoutNotice>
                لغو تا ساعت ۱۶:۰۰ امکان‌پذیر است؛ پس از آن امکان لغو نیست.
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
          </div>

          <Button type="submit" fullWidth className="h-[52px]">
            رزرو
          </Button>
        </form>
      </main>
    </div>
  )
}
