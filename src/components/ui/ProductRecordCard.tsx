import { useState } from 'react'
import type { ReactNode } from 'react'
import { WifiOff } from 'lucide-react'
import { Button } from './Button'
import { StatusBadge } from './StatusBadge'
import type { RecordStatus } from './StatusBadge'
import type { CardActionProps } from './FoodListingCard'
import { cx } from '@/lib/cx'
import { formatPrice } from '@/lib/format'

export type ProductRecordStatus = RecordStatus

export interface ProductRecordCardProps {
  /** وضعیت رکورد: active | pending | completed */
  status?: ProductRecordStatus
  /** override متن نشان وضعیت */
  statusLabel?: string
  /** نام رکورد/محصول */
  name: string
  /** نام فروشگاه (چیپ) */
  store?: string
  /** دسته (چیپ) */
  category?: string
  /** چیپ‌های سفارشی؛ اگر داده شود جای فروشگاه/دسته را می‌گیرد */
  tags?: string[]
  /** قیمت فعلی (تومان) */
  price: number
  /** ارزش واقعی (تومان) - خط‌خورده نمایش داده می‌شود */
  referenceValue?: number
  /** مقدار/موجودی، مثلاً «۵ کیسه باقی‌مانده» */
  amount?: string
  imageSrc?: string
  imageAlt?: string
  /** متن دکمه‌ی اقدام (پیش‌فرض «مدیریت پیشنهاد») */
  actionLabel?: string
  actionIcon?: ReactNode
  onAction?: () => void
  actionHref?: string
  /** برای مسیریاب: renderAction={(p) => <Link to="/vendor/offers/1" {...p} />} */
  renderAction?: (props: CardActionProps) => ReactNode
  actionLoading?: boolean
  /** سطح تیتر نام رکورد در ساختار صفحه */
  headingLevel?: 2 | 3 | 4
  className?: string
}

/* padding ۲۰، gap ۱۲، border ۱px، radius ۱۶ — ترتیب عمودی فرزندان در RTL تغییر نمی‌کند */
const cardBase =
  'flex w-full flex-col items-start gap-3 rounded-lg border border-border-default bg-surface p-5'

const chipBase =
  'flex h-11 shrink-0 items-center justify-center rounded-md border border-border-input ' +
  'bg-surface px-4 text-label-md leading-[1.55] text-text-primary'

const actionBase =
  'inline-flex h-13 w-full items-center justify-center gap-2 rounded-md px-6 ' +
  'text-label-lg leading-[1.55] text-primary'

/**
 * کارت رکورد محصول (سمت فروشنده/ادمین) — Figma: FA VendorAdminProductCard
 *
 * ترتیب فرزندان در فِـریم Figma چپ‌به‌راست است؛ برای اینکه چیدمان بصری در RTL
 * همانِ دیزاین بماند، ترتیب ردیف‌ها (چیپ‌ها و قیمت‌ها) معکوس نوشته شده است.
 */
export function ProductRecordCard({
  status = 'active',
  statusLabel,
  name,
  store,
  category,
  tags,
  price,
  referenceValue,
  amount,
  imageSrc,
  imageAlt = '',
  actionLabel = 'مدیریت پیشنهاد',
  actionIcon,
  onAction,
  actionHref,
  renderAction,
  actionLoading = false,
  headingLevel = 3,
  className,
}: ProductRecordCardProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const imageFailed = imageSrc !== undefined && failedSrc === imageSrc

  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4'
  // چسبیده به لبه‌ی راست (justify-start در RTL)؛ ترتیب خوانش: فروشگاه و سپس دسته
  const chips = tags ?? [store, category].filter((value): value is string => Boolean(value))

  let action: ReactNode = null
  if (renderAction) {
    action = renderAction({
      className: cx(actionBase, 'border-[1.5px] border-primary bg-surface hover:bg-primary-subtle'),
      children: actionLabel,
    })
  } else if (actionHref) {
    action = (
      <a
        href={actionHref}
        className={cx(
          actionBase,
          'border-[1.5px] border-primary bg-surface hover:bg-primary-subtle',
        )}
      >
        {actionLabel}
      </a>
    )
  } else if (onAction) {
    action = (
      <Button
        type="button"
        variant="secondary"
        size="lg"
        fullWidth
        onClick={onAction}
        isLoading={actionLoading}
        icon={actionIcon}
      >
        {actionLabel}
      </Button>
    )
  }

  return (
    <article className={cx(cardBase, className)}>
      <StatusBadge status={status} label={statusLabel} />

      {/* Media — ارتفاع ثابت ۱۶۰، radius ۱۶ */}
      <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-lg bg-surface-secondary">
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
      </div>

      <Heading className="w-full text-title-md leading-[1.55] text-text-primary">{name}</Heading>

      {/* Store and category */}
      {chips.length > 0 && (
        <div className="flex w-full flex-row flex-wrap items-start justify-start gap-2">
          {chips.map((chip) => (
            <span key={chip} className={chipBase}>
              {chip}
            </span>
          ))}
        </div>
      )}

      {/* Price display — قیمت فعلی ۱۸/۷۰۰ و ارزش مرجع خط‌خورده ۱۴/۵۰۰ */}
      <p className="flex w-full items-baseline justify-start gap-2">
        <span className="text-price-md leading-[1.55] text-text-primary">{formatPrice(price)}</span>
        {referenceValue !== undefined && (
          <span className="text-body-md leading-[1.55] font-medium text-text-secondary line-through">
            {formatPrice(referenceValue)}
          </span>
        )}
      </p>

      {amount && <p className="w-full text-label-md leading-[1.55] text-text-primary">{amount}</p>}

      {action}
    </article>
  )
}
