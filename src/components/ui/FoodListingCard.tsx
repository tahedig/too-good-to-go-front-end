import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { Clock, Heart, WifiOff } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { ListingStatus } from './StatusBadge';
import { formatDistanceKm, formatPrice } from '../../lib/format';

const DEFAULT_DISCLAIMER = 'عکس دسته‌بندی · محتویات تضمین‌شده نیست';

/** پراپ‌هایی که به لینک عنوان داده می‌شود؛ روی <Link> مسیریاب هم اسپرد می‌شود */
export interface CardLinkProps {
  className: string;
  children: ReactNode;
  'data-card-link': true;
}

interface CommonProps {
  className?: string;
}

export interface ReadyListingProps extends CommonProps {
  state?: 'ready';
  merchantName: string;
  /** دسته، مثلاً «نانوایی» */
  category: string;
  distanceKm?: number;
  description: string;
  /** قیمت فعلی (تومان) */
  price: number;
  /** ارزش واقعی (تومان) برای نمایش «۱۱٫۵ تومان ارزش» */
  referenceValue?: number;
  /** بازه‌ی تحویل که خودت فرمت می‌کنی، مثلاً «امروز، ۱۸:۰۰–۱۹:۰۰» */
  pickup: string;
  imageSrc?: string;
  /** عکس نماینده‌ی دسته است نه محتوای واقعی؛ پیش‌فرض تزئینی (alt خالی) */
  imageAlt?: string;
  status?: ListingStatus;
  /** خط توضیح اضافه در حالت ناموجود */
  soldOutNote?: string;
  disclaimer?: string;
  saved?: boolean;
  /** اگر ندهی، دکمه‌ی ذخیره نمایش داده نمی‌شود */
  onSaveChange?: (saved: boolean) => void;
  saveLabel?: string;
  /** با href، عنوان به لینک تبدیل می‌شود و کل کارت قابل کلیک است */
  href?: string;
  /** برای مسیریاب: renderLink={(p) => <Link to="/offers/1" {...p} />} */
  renderLink?: (props: CardLinkProps) => ReactNode;
  /** سطح تیتر عنوان در ساختار صفحه */
  headingLevel?: 2 | 3 | 4;
}

export interface LoadingListingProps extends CommonProps {
  state: 'loading';
  loadingLabel?: string;
}

export interface ErrorListingProps extends CommonProps {
  state: 'error';
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export type FoodListingCardProps = ReadyListingProps | LoadingListingProps | ErrorListingProps;

const cardBase =
  'relative flex flex-col overflow-hidden rounded-lg border border-border-default bg-surface transition-colors';

function join(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** کارت پیشنهاد غذا. state: ready (پیش‌فرض) | loading | error */
export function FoodListingCard(props: FoodListingCardProps) {
  if (props.state === 'loading') return <LoadingCard {...props} />;
  if (props.state === 'error') return <ErrorCard {...props} />;
  return <ReadyCard {...props} />;
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
  disclaimer = DEFAULT_DISCLAIMER,
  saved = false,
  onSaveChange,
  saveLabel = 'ذخیره',
  href,
  renderLink,
  headingLevel = 3,
  className,
}: ReadyListingProps) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    setImageFailed(false);
  }, [imageSrc]);

  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const interactive = Boolean(href || renderLink);
  // لینک کش‌آمده روی کل کارت (::after) تا کل کارت کلیک‌پذیر باشد، بدون تو در تو شدن دکمه داخل لینک
  const linkClass = 'outline-none after:absolute after:inset-0';

  let title: ReactNode = merchantName;
  if (renderLink) {
    title = renderLink({ className: linkClass, children: merchantName, 'data-card-link': true });
  } else if (href) {
    title = (
      <a href={href} data-card-link className={linkClass}>
        {merchantName}
      </a>
    );
  }

  const meta = [category, distanceKm !== undefined && formatDistanceKm(distanceKm)].filter(Boolean).join(' · ');

  return (
    <article
      className={join(
        cardBase,
        interactive &&
          'hover:bg-primary-subtle has-[[data-card-link]:focus-visible]:outline-3 ' +
            'has-[[data-card-link]:focus-visible]:outline-focus has-[[data-card-link]:focus-visible]:-outline-offset-3',
        className,
      )}
    >
      <div className="relative aspect-[4/3] bg-surface-secondary">
        {imageSrc && !imageFailed ? (
          <img
            src={imageSrc}
            alt={imageAlt}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-primary">
            <WifiOff strokeWidth={1.75} />
          </div>
        )}

        {/* در RTL اولین فرزند سمت راست است: نشان وضعیت راست، دکمه‌ی ذخیره چپ */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-center justify-between">
          <StatusBadge status={status} />
          {onSaveChange && (
            <button
              type="button"
              onClick={() => onSaveChange(!saved)}
              aria-pressed={saved}
              aria-label={`${saveLabel} ${merchantName}`}
              className={join(
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

      <div className="flex min-h-67 flex-col gap-3 p-5">
        <div className="flex flex-col gap-1">
          <Heading className="text-title-md text-text-primary">{title}</Heading>
          <p className="text-body-md text-text-secondary">{meta}</p>
        </div>

        <p className="line-clamp-2 text-body-md text-text-secondary">{description}</p>

        <p className="flex items-baseline gap-2">
          <span className="text-price-md text-text-primary">{formatPrice(price)}</span>
          {referenceValue !== undefined && (
            <span className="text-caption text-text-secondary">{formatPrice(referenceValue)} ارزش</span>
          )}
        </p>

        <p className="flex items-center gap-2 text-body-md text-text-primary">
          <ClockIcon className="size-6 shrink-0 text-primary" />
          {pickup}
        </p>

        <p className="text-caption text-text-secondary">{disclaimer}</p>
        {status === 'soldOut' && soldOutNote && <p className="text-caption text-text-secondary">{soldOutNote}</p>}
      </div>
    </article>
  );
}

function Bone({ className }: { className: string }) {
  return <div className={join('max-w-full rounded-sm bg-surface-secondary motion-safe:animate-pulse', className)} />;
}

function LoadingCard({ loadingLabel = 'در حال بارگذاری', className }: LoadingListingProps) {
  return (
    <article aria-busy="true" className={join(cardBase, className)}>
      <div className="aspect-[4/3] bg-surface-secondary motion-safe:animate-pulse" />
      <div className="flex min-h-67 flex-col gap-3 p-5">
        <Bone className="h-5 w-55" />
        <Bone className="h-4 w-40" />
        <Bone className="h-7 w-20" />
        <Bone className="h-5 w-60" />
        <span className="sr-only">{loadingLabel}</span>
      </div>
    </article>
  );
}

function ErrorCard({
  title = 'پیشنهاد در دسترس نیست',
  message = 'این پیشنهاد بارگذاری نشد. دوباره تلاش کنید.',
  retryLabel = 'تلاش دوباره',
  onRetry,
  className,
}: ErrorListingProps) {
  return (
    <article className={join(cardBase, className)}>
      <div className="grid aspect-[4/3] place-items-center bg-surface-secondary text-primary">
        <WifiOff strokeWidth={1.75} />
      </div>
      <div className="flex min-h-67 flex-col gap-3 p-5">
        <h3 className="text-title-md text-text-primary">{title}</h3>
        <p className="text-body-md text-text-secondary">
          {message}
        </p>
        {onRetry && (
          <Button variant="secondary" fullWidth onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </div>
    </article>
  );
}
