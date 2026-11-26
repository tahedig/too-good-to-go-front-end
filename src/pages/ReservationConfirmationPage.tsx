import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Check, CheckCircle, Clock3, Heart, MapPin } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { publicStores } from '@/features/store/mockData'
import { formatPrice } from '@/lib/format'
import { formatPickupDate, localDate } from '@/lib/vendorReservations'
import { toEnglishDigits } from '@/lib/digits'

function findProduct(productId: string) {
  for (const store of Object.values(publicStores)) {
    const product = store.products.find((item) => item.id === productId)
    if (product) return { product, store }
  }
}

export default function ReservationConfirmationPage() {
  const navigate = useNavigate()
  const { reservationId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const productId = searchParams.get('productId') ?? ''
  const quantity = Number(toEnglishDigits(searchParams.get('quantity') ?? ''))
  const listing = findProduct(productId)
  const [saved, setSaved] = useState(false)

  if (!listing) return <Navigate to="/" replace />
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > listing.product.remaining) {
    return <Navigate to={`/products/${listing.product.id}`} replace />
  }

  const { product, store } = listing
  const itemTotal = product.price * quantity
  const serviceFee = 0

  return (
    <div dir="rtl" className="min-h-dvh bg-background px-4 pb-8 text-text-primary">
      <main className="mx-auto max-w-[430px]">
        <header className="flex items-center gap-4 py-8">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-success-subtle text-primary">
            <CheckCircle className="size-8" strokeWidth={1.75} />
          </div>
          <h1 className="text-title-lg text-primary">رزرو شما تأیید شد.</h1>
        </header>

        <article className="rounded-2xl border border-border-default bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-caption text-text-secondary">
              کد رزرو: <bdi>{reservationId}</bdi>
            </p>
            <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-success-subtle px-2 text-caption text-primary">
              رزروشده
              <Check className="size-4" strokeWidth={1.75} />
            </span>
          </div>

          <div className="relative mt-4">
            <img
              src={product.imageSrc}
              alt={`${product.name} از ${store.name}`}
              className="aspect-[4/3] w-full rounded-lg object-cover"
            />
            <button
              type="button"
              aria-label={saved ? 'حذف از ذخیره‌ها' : 'ذخیره محصول'}
              aria-pressed={saved}
              onClick={() => setSaved((value) => !value)}
              className="absolute left-3 top-3 grid size-11 place-items-center rounded-md border border-border-default bg-surface text-primary"
            >
              <Heart fill={saved ? 'currentColor' : 'none'} strokeWidth={1.75} />
            </button>
          </div>

          <h2 className="mt-5 text-title-lg text-primary">{product.name}</h2>
          <p className="mt-2 text-body-md text-primary">
            {quantity.toLocaleString('fa-IR')} بستهٔ غافلگیری {store.category} · مجموع{' '}
            {formatPrice(itemTotal)}
          </p>
          <p className="mt-2 text-body-md text-text-secondary">
            کارمزد · {formatPrice(serviceFee)}
          </p>

          <section aria-labelledby="pickup-window" className="mt-6">
            <h3 id="pickup-window" className="text-label-md text-primary">
              بازهٔ تحویل
            </h3>
            <p className="mt-2 flex items-center gap-2 text-body-md">
              <Clock3 className="size-6 shrink-0" strokeWidth={1.75} />
              {product.pickup}
            </p>
            <p className="mt-2 text-caption text-text-secondary">{formatPickupDate(localDate())}</p>
          </section>

          <section aria-labelledby="pickup-location" className="mt-6">
            <h3 id="pickup-location" className="text-label-md text-primary">
              محل تحویل
            </h3>
            <p className="mt-2 flex items-center gap-2 text-body-md">
              <MapPin className="size-6 shrink-0" strokeWidth={1.75} />
              {store.address}
            </p>
            <Link
              to="/map"
              className="mt-5 inline-flex h-13 w-full items-center justify-center rounded-md border-[1.5px] border-primary bg-surface text-label-md text-primary hover:bg-primary-subtle"
            >
              مسیریابی
            </Link>
          </section>
        </article>

        <section aria-labelledby="arrival-steps" className="mt-7">
          <h2 id="arrival-steps" className="mb-4 text-title-md text-primary">
            وقتی رسیدید
          </h2>
          <ol className="space-y-3">
            <li className="flex items-center gap-3 text-body-md">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-success-subtle text-label-md text-primary">
                ۱
              </span>
              تحویل: {product.pickup}
            </li>
            <li className="flex items-center gap-3 text-body-md">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-success-subtle text-label-md text-primary">
                ۲
              </span>
              به پیشخوان مراجعه و اطلاعات رزرو را نشان دهید.
            </li>
            <li className="flex items-center gap-3 text-body-md">
              <span className="grid size-8 shrink-0 place-items-center rounded-md bg-success-subtle text-label-md text-primary">
                ۳
              </span>
              تحویل با تأیید فروشگاه انجام می‌شود.
            </li>
          </ol>
        </section>

        <Button fullWidth onClick={() => navigate('/')} className="mt-7">
          ادامهٔ اکتشاف
        </Button>
        <Link
          to="/orders"
          className="mt-4 flex min-h-11 items-center justify-center text-label-md text-primary underline"
        >
          مشاهدهٔ سفارش‌ها
        </Link>
      </main>
    </div>
  )
}
