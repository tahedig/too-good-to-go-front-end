import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { toPersianDigits } from '@/lib/digits'
import { formatPrice } from '@/lib/format'

export type VendorProductStatus = 'active' | 'inactive' | 'draft' | 'ended'

export interface VendorProduct {
  id: string
  name: string
  store: string
  category: string
  price: number
  originalPrice: number
  imageSrc?: string
  status: VendorProductStatus
  inventory: { total: number; reserved: number; available: number }
}

function inventoryText(product: VendorProduct): string {
  const { total, reserved, available } = product.inventory
  if (product.status === 'draft') return 'پیش‌نویس · قابل رزرو نیست'
  if (product.status === 'inactive') return `${toPersianDigits(reserved)} رزرو · غیرفعال`
  if (product.status === 'ended') return `${toPersianDigits(available)} موجود`
  return `${toPersianDigits(total)} کل · ${toPersianDigits(reserved)} رزرو · ${toPersianDigits(available)} موجود`
}

function PriceRow({ product }: { product: VendorProduct }) {
  return (
    <p className="flex items-end gap-2 lg:flex-row-reverse lg:justify-start lg:gap-3">
      <span className="text-price-md font-extrabold text-text-primary">
        {formatPrice(product.price)}
      </span>
      <span className="text-caption text-text-disabled line-through">
        {formatPrice(product.originalPrice)}
      </span>
    </p>
  )
}

export function VendorProductCard({
  product,
  onEdit,
  onUnpublish,
}: {
  product: VendorProduct
  onEdit: () => void
  onUnpublish: () => void
}) {
  const inventory = inventoryText(product)
  const inventoryTone = product.status === 'active' ? 'text-text-primary' : 'text-text-secondary'

  return (
    <article className="flex min-h-[512px] w-[280px] shrink-0 flex-col overflow-hidden rounded-lg border border-border-default bg-surface lg:min-h-[385px] lg:w-80 lg:shadow-1">
      {/* Mobile */}
      <div className="flex flex-1 flex-col gap-3 p-5 lg:hidden">
        <div className="flex">
          <StatusBadge status={product.status} />
        </div>

        {product.imageSrc ? (
          <img src={product.imageSrc} alt="" className="h-40 w-full rounded-lg object-cover" />
        ) : (
          <div className="h-40 w-full rounded-lg bg-surface-secondary" />
        )}

        <h3 className="text-title-md text-text-primary">{product.name}</h3>

        <div className="flex flex-wrap gap-2">
          <span className="flex h-11 items-center rounded-md border border-border-input bg-surface px-4 text-label-md text-text-primary">
            {product.store}
          </span>
          <span className="flex h-11 items-center rounded-md border border-border-input bg-surface px-4 text-label-md text-text-primary">
            {product.category}
          </span>
        </div>

        <PriceRow product={product} />

        <p className={`text-label-md ${inventoryTone}`}>{inventory}</p>

        <Button variant="secondary" fullWidth className="mt-auto" onClick={onEdit}>
          ویرایش محصول
        </Button>
        {product.status === 'active' && (
          <Button variant="tertiary" size="md" fullWidth onClick={onUnpublish}>
            لغو انتشار
          </Button>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden flex-1 flex-col gap-4 p-4 lg:flex">
        <div className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="size-6 shrink-0 text-text-secondary" strokeWidth={1.75} />
              <span className="text-label-md text-text-secondary">{product.store}</span>
            </div>
            <p className="text-body-md text-text-secondary">{product.category}</p>
            <h3 className="text-title-md font-bold text-text-primary">{product.name}</h3>
          </div>

          {product.imageSrc ? (
            <img
              src={product.imageSrc}
              alt=""
              className="size-28 shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="size-28 shrink-0 rounded-md bg-surface-secondary" />
          )}
        </div>

        <PriceRow product={product} />

        <div className="flex flex-row-reverse items-center justify-between gap-3">
          <div className="flex flex-col items-end gap-1">
            <span className="text-caption text-text-secondary">تعداد بسته‌ها</span>
            <span className={`text-label-md ${inventoryTone}`}>{inventory}</span>
          </div>
          <StatusBadge status={product.status} />
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="mt-auto flex h-[46px] w-full items-center justify-center rounded-[12px] border border-primary bg-surface text-label-md font-bold text-text-primary transition-colors hover:bg-primary-subtle"
        >
          ویرایش محصول
        </button>
        {product.status === 'active' && (
          <Button variant="tertiary" size="md" fullWidth onClick={onUnpublish}>
            لغو انتشار
          </Button>
        )}
      </div>
    </article>
  )
}
