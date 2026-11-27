import React, { useState } from 'react'
import { CheckCircle2, Loader2, X } from 'lucide-react'
import { ApiError } from '@/lib/api/client'
import { toEnglishDigits, toPersianDigits } from '@/lib/digits'
import { formatNumber } from '@/lib/format'
import type { VendorOrder } from '../types'

interface VerifyPickupModalProps {
  order: VendorOrder | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (order: VendorOrder, pickupCode?: string) => Promise<void>
}

function VerifyPickupModalContent({
  order,
  onClose,
  onConfirm,
}: {
  order: VendorOrder
  onClose: () => void
  onConfirm: (order: VendorOrder, pickupCode?: string) => Promise<void>
}) {
  const [pickupCode, setPickupCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedCode = toEnglishDigits(pickupCode).trim()
    if (normalizedCode && !/^\d{4}$/.test(normalizedCode)) {
      setError('کد تحویل در صورت ورود باید ۴ رقم باشد.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await onConfirm(order, normalizedCode || undefined)
      onClose()
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : caught instanceof Error && caught.message
            ? caught.message
            : 'خطا در ثبت تحویل سفارش. لطفاً دوباره تلاش کنید.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl border border-border-default bg-surface p-6 shadow-3">
        <div className="flex items-center justify-between border-b border-border-default/50 pb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-primary" />
            <h3 className="text-lg font-bold text-text-primary">بررسی و تحویل سفارش</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="rounded-lg p-1 text-text-secondary hover:bg-surface-secondary"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 rounded-lg bg-surface-secondary/70 p-4">
          <div className="flex justify-between py-1 text-sm">
            <span className="text-text-secondary">مشتری:</span>
            <span className="font-bold text-text-primary">{order.customer?.name || 'مشتری'}</span>
          </div>
          <div className="flex justify-between py-1 text-sm">
            <span className="text-text-secondary">بسته:</span>
            <span className="font-bold text-text-primary">
              {order.package?.title || 'بستهٔ غافلگیری'}
            </span>
          </div>
          <div className="flex justify-between py-1 text-sm">
            <span className="text-text-secondary">تعداد:</span>
            <span className="font-bold text-text-primary">
              {toPersianDigits(order.quantity)} بسته
            </span>
          </div>
          <div className="flex justify-between py-1 text-sm">
            <span className="text-text-secondary">مبلغ کل:</span>
            <span className="font-bold text-primary">
              {toPersianDigits(formatNumber(order.total_price))} تومان
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="pickup_code"
              className="mb-1.5 block text-xs font-semibold text-text-secondary"
            >
              کد تحویل مشتری (اختیاری)
            </label>
            <input
              id="pickup_code"
              type="text"
              inputMode="numeric"
              dir="ltr"
              placeholder="مثال: ۱۲۳۴"
              value={pickupCode}
              onChange={(e) => setPickupCode(e.target.value)}
              className="w-full rounded-xl border border-border-default bg-surface px-4 py-2.5 text-center text-sm font-bold tracking-widest text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-error-subtle p-3 text-xs text-error">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-xl border border-border-default bg-surface text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-on-primary shadow-1 transition-colors hover:bg-primary-hover active:bg-primary-pressed"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'تأیید تحویل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export const VerifyPickupModal: React.FC<VerifyPickupModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !order) return null

  return (
    <VerifyPickupModalContent
      key={order.id}
      order={order}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
