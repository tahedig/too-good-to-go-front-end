import { useState } from 'react'
import type { ReactNode } from 'react'
import { Clock, Heart, WifiOff } from 'lucide-react'
import { Button } from './Button'
import { StatusBadge } from './StatusBadge'
import type { ListingStatus } from './StatusBadge'
import { cx } from '@/lib/cx'
import { formatDistanceKm, formatPrice } from '@/lib/format'

/** پراپ‌هایی که به لینک عنوان داده می‌شود؛ روی <Link> مسیریاب هم اسپرد می‌شود */
export interface CardLinkProps {
  className: string
  children: ReactNode
  'data-card-link': true
}

/** پراپ‌هایی که به دکمه/لینک اقدام کارت داده می‌شود */
export interface CardActionProps {
  className: string
  children: ReactNode
}

interface CommonProps {
  className?: string
}

export interface ReadyListingProps extends CommonProps {
  state?: 'ready'
  merchantName: string
  /** دسته، مثلاً «نانوایی» */
  category: string
  distanceKm?: number
  /** توضیح پیشنهاد؛ در حالت پیش‌فرض دیزاین نمایش داده نمی‌شود */
  description?: string
  /** قیمت فعلی (تومان) */
  price: number
  /** ارزش واقعی (تومان) که با خط‌خورده نمایش داده می‌شود */
  referenceValue?: number
  /** بازه‌ی تحویل که خودت فرمت می‌کنی، مثلاً «امروز، ۱۸:۰۰–۱۹:۰۰» */
  pickup: string
  imageSrc?: string
  /** عکس نماینده‌ی دسته است نه محتوای واقعی؛ پیش‌فرض تزئینی (alt خالی) */
  imageAlt?: string
  status?: ListingStatus
  /** خط توضیح اضافه در حالت ناموجود */
  soldOutNote?: string
  disclaimer?: string
  saved?: boolean
  /** اگر ندهی، دکمه‌ی ذخیره نمایش داده نمی‌شود */
  onSaveChange?: (saved: boolean) => void
  saveLabel?: string
  /** با href، عنوان به لینک تبدیل می‌شود و کل کارت قابل کلیک است */
  href?: string
  /** برای مسیریاب: renderLink={(p) => <Link to="/offers/1" {...p} />} */
  renderLink?: (props: CardLinkProps) => ReactNode
  /** متن دکمه‌ی اقدام پایین کارت (پیش‌فرض «مشاهده محصول») */
  actionLabel?: string
  /** با دادن آن، دکمه‌ی اقدام رندر می‌شود */
  onAction?: () => void
  /** دکمه‌ی اقدام به‌صورت لینک ساده */
  actionHref?: string
  /** برای مسیریاب: renderAction={(p) => <Link to="/offers/1" {...p} />} */
  renderAction?: (props: CardActionProps) => ReactNode
  actionIcon?: ReactNode
  actionLoading?: boolean
  /** سطح تیتر عنوان در ساختار صفحه */
  headingLevel?: 2 | 3 | 4
}

export interface LoadingListingProps extends CommonProps {
  state: 'loading'
  loadingLabel?: string
}

export interface ErrorListingProps extends CommonProps {
  state: 'error'
  title?: string
  message?: string
  retryLabel?: string
  onRetry?: () => void
}

export type FoodListingCardProps = ReadyListingProps | LoadingListingProps | ErrorListingProps

/* عرض ۲۸۰، border ۱px، radius ۱۶ — فرزندان: مدیا ۱۸۰، اطلاعات، دکمه‌ی ۳۶ سرتاسری */
const cardBase =
  'relative flex w-full max-w-70 flex-col items-start overflow-hidden rounded-lg ' +
  'border border-border-default bg-surface transition-colors'

const actionBase =
  'inline-flex h-9 w-full items-center justify-center gap-2 rounded-none px-4 ' +
  'text-label-md leading-[1.55] text-on-primary transition-colors ' +
  'hover:bg-primary-hover active:bg-primary-pressed'

/** کارت پیشنهاد غذا (سمت مشتری). state: ready (پیش‌فرض) | loading | error */
export function FoodListingCard(props: FoodListingCardProps) {
  if (props.state === 'loading') return <LoadingCard {...props} />
  if (props.state === 'error') return <ErrorCard {...props} />
  return <ReadyCard {...props} />
}

function ReadyCard({
  merchantName,
  category,
  distanceKm,
  description,
  price,
  referenceValue,
  pickup,
  imageSrc,
  imageAlt = '',
  status = 'available',
  soldOutNote,
  disclaimer,
  saved = false,
  onSaveChange,
  saveLabel = 'ذخیره',
  href,
  renderLink,
  actionLabel = 'مشاهده محصول',
  onAction,
  actionHref,
  renderAction,
  actionIcon,
  actionLoading = false,
  headingLevel = 3,
  className,
}: ReadyListingProps) {
  // به‌جای ریست‌کردن در effect، منبعی که خطا داده نگه داشته می‌شود
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const imageFailed = imageSrc !== undefined && failedSrc === imageSrc

  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4'
  const interactive = Boolean(href || renderLink)
  // لینک کش‌آمده روی کل کارت (::after) تا کل کارت کلیک‌پذیر باشد، بدون تو در تو شدن دکمه داخل لینک
  const linkClass = 'outline-none after:absolute after:inset-0'

  let title: ReactNode = merchantName
  if (renderLink) {
    title = renderLink({ className: linkClass, children: merchantName, 'data-card-link': true })
  } else if (href) {
    title = (
      <a href={href} data-card-link className={linkClass}>
        {merchantName}
      </a>
    )
  }

  const meta = [category, distanceKm !== undefined && formatDistanceKm(distanceKm)]
    .filter(Boolean)
    .join(' · ')

  let action: ReactNode = null
  if (renderAction) {
    action = renderAction({
      className: cx(actionBase, 'relative z-10 bg-primary'),
      children: actionLabel,
    })
  } else if (actionHref) {
    action = (
      <a href={actionHref} className={cx(actionBase, 'relative z-10 bg-primary')}>
        {actionLabel}
      </a>
    )
  } else if (onAction) {
    action = (
      <Button
        type="button"
        variant="primary"
        size="sm"
        fullWidth
        className="relative z-10 rounded-none!"
        onClick={onAction}
        isLoading={actionLoading}
        icon={actionIcon}
      >
        {actionLabel}
      </Button>
    )
  }

  return (
    <article
      className={cx(
        cardBase,
        interactive &&
          'hover:bg-primary-subtle has-[[data-card-link]:focus-visible]:outline-3 ' +
            'has-[[data-card-link]:focus-visible]:outline-focus has-[[data-card-link]:focus-visible]:-outline-offset-3',
        className,
      )}
    >
      {/* Media — ارتفاع ثابت ۱۸۰ */}
      <div className="relative h-45 w-full shrink-0 bg-surface-secondary">
        {imageSrc && !imageFailed ? (
          <img
            src={imageSrc}
            alt={imageAlt}
            loading="lazy"
            decoding="async"
            onError={() => setFailedSrc(imageSrc)}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-primary">
            <WifiOff strokeWidth={1.75} />
          </div>
        )}

        {/* Media actions — فاصله‌ی ۱۲ از لبه‌ها، ارتفاع ۴۴ */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-center justify-between">
          <StatusBadge status={status} />
          {onSaveChange && (
            <button
              type="button"
              onClick={() => onSaveChange(!saved)}
              aria-pressed={saved}
              aria-label={`${saveLabel} ${merchantName}`}
              className={cx(
                'pointer-events-auto grid size-11 shrink-0 place-items-center rounded-md border text-primary transition-colors',
                saved
                  ? 'border-[1.5px] border-primary bg-primary-subtle hover:bg-surface-sage'
                  : 'border-border-default bg-surface hover:bg-surface-secondary active:bg-surface-sage',
              )}
            >
              <Heart strokeWidth={1.75} fill={saved ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>

      {/* Offer information — padding ۲۰، gap ۱۶ */}
      <div className="flex w-full flex-col items-start gap-4 p-5">
        {/* Merchant details — نام ۲۰/۶۰۰ و رده · فاصله ۱۴/۴۰۰ */}
        <div className="flex w-full flex-col items-start gap-1">
          <Heading className="w-full text-title-md leading-[1.55] text-text-primary">
            {title}
          </Heading>
          <p className="w-full text-body-md leading-[1.55] text-text-secondary">{meta}</p>
        </div>

        {description && (
          <p className="w-full text-body-md leading-[1.55] text-text-secondary">{description}</p>
        )}

        {/* PriceDisplay — قیمت فعلی ۱۸/۷۰۰ و ارزش مرجع خط‌خورده ۱۲/۵۰۰ */}
        <p className="flex w-full items-baseline justify-start gap-2">
          <span className="text-price-md leading-[1.55] text-text-primary">
            {formatPrice(price)}
          </span>
          {referenceValue !== undefined && (
            <span className="text-caption leading-[1.55] text-text-secondary line-through">
              {formatPrice(referenceValue)}
            </span>
          )}
        </p>

        {/* PickupWindow */}
        <p className="flex w-full items-center justify-start gap-2 text-body-md leading-[1.55] text-text-primary">
          <Clock className="size-6 shrink-0" strokeWidth={1.75} />
          {pickup}
        </p>

        {status === 'soldOut' && soldOutNote && (
          <p className="w-full text-caption leading-[1.55] text-text-secondary">{soldOutNote}</p>
        )}
        {disclaimer && (
          <p className="w-full text-caption leading-[1.55] text-text-secondary">{disclaimer}</p>
        )}
      </div>

      {action}
    </article>
  )
}

function Bone({ className }: { className: string }) {
  return (
    <div
      className={cx(
        'max-w-full rounded-sm bg-surface-secondary motion-safe:animate-pulse',
        className,
      )}
    />
  )
}

function LoadingCard({ loadingLabel = 'در حال بارگذاری', className }: LoadingListingProps) {
  return (
    <article aria-busy="true" className={cx(cardBase, className)}>
      <div className="h-45 w-full shrink-0 bg-surface-secondary motion-safe:animate-pulse" />
      <div className="flex w-full flex-col items-start gap-4 p-5">
        <div className="flex w-full flex-col items-start gap-1">
          <Bone className="h-6 w-40" />
          <Bone className="h-5 w-32" />
        </div>
        <Bone className="h-7 w-28" />
        <Bone className="h-6 w-44" />
        <span className="sr-only">{loadingLabel}</span>
      </div>
      <Bone className="h-9 w-full rounded-none" />
    </article>
  )
}

function ErrorCard({
  title = 'پیشنهاد در دسترس نیست',
  message = 'این پیشنهاد بارگذاری نشد. دوباره تلاش کنید.',
  retryLabel = 'تلاش دوباره',
  onRetry,
  className,
}: ErrorListingProps) {
  return (
    <article className={cx(cardBase, className)}>
      <div className="grid h-45 w-full shrink-0 place-items-center bg-surface-secondary text-primary">
        <WifiOff strokeWidth={1.75} />
      </div>
      <div className="flex w-full flex-col items-start gap-4 p-5">
        <h3 className="w-full text-title-md leading-[1.55] text-text-primary">{title}</h3>
        <p className="w-full text-body-md leading-[1.55] text-text-secondary">{message}</p>
        {onRetry && (
          <Button variant="secondary" fullWidth onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </div>
    </article>
  )
}
