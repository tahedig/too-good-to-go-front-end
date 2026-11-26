import React from 'react'
import { Heart, Package } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toPersianDigits } from '@/lib/digits'

interface VendorOrdersEmptyStateProps {
  dateLabel: string
  onSelectAnotherDate?: () => void
}

export const VendorOrdersEmptyState: React.FC<VendorOrdersEmptyStateProps> = ({
  dateLabel,
  onSelectAnotherDate,
}) => {
  const navigate = useNavigate()

  return (
    <div className="w-full space-y-4">
      {/* Date badge summary card */}
      <div className="rounded-xl border border-border-default bg-surface p-4 text-center shadow-1">
        <div className="text-sm font-bold text-text-primary">{toPersianDigits(dateLabel)}</div>
        <div className="mt-1 text-xs text-text-secondary">
          {toPersianDigits('۰ رزرو • ۰ بسته • ۰ تحویل‌شده')}
        </div>
      </div>

      {/* Empty State Box */}
      <div className="flex flex-col items-center justify-center rounded-xl border border-border-default bg-surface p-8 text-center shadow-1">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary text-text-secondary mb-3">
          <Heart className="size-6 text-primary" strokeWidth={1.75} />
        </div>
        <h3 className="text-base font-bold text-text-primary">برای این تاریخ سفارشی ندارید</h3>
        <p className="mt-1 text-xs text-text-secondary">تاریخ دیگری را انتخاب کنید.</p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={onSelectAnotherDate}
          className="w-full h-12 rounded-xl bg-primary text-sm font-semibold text-on-primary shadow-1 hover:bg-primary-hover active:bg-primary-pressed transition-colors"
        >
          تغییر تاریخ
        </button>

        <button
          type="button"
          onClick={() => navigate('/vendor/products')}
          className="w-full h-12 rounded-xl border border-border-default bg-surface text-sm font-semibold text-primary hover:bg-surface-secondary active:bg-surface-sage transition-colors flex items-center justify-center gap-2"
        >
          <Package className="size-4" />
          <span>محصولات</span>
        </button>
      </div>
    </div>
  )
}
