import React, { useState } from 'react'
import type { VendorOrder } from '../types'
import { toPersianDigits } from '@/lib/digits'
import { formatNumber } from '@/lib/format'
import { CheckCircle2, Loader2, X } from 'lucide-react'

interface VerifyPickupModalProps {
  order: VendorOrder | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (order: VendorOrder, pickupCode?: string) => Promise<void>
}

export const VerifyPickupModal: React.FC<VerifyPickupModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [pickupCode, setPickupCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !order) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onConfirm(order, pickupCode.trim() || undefined)
      onClose()
    } catch {
      setError('خطا در ثبت تحویل سفارش. لطفاً دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl border border-border-default bg-surface p-6 shadow-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-default/50 pb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-primary" />
            <h3 className="text-lg font-bold text-text-primary">بررسی و تحویل سفارش</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary hover:bg-surface-secondary"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Order Brief */}
        <div className="mt-4 rounded-lg bg-surface-secondary/70 p-4">
          <div className="flex justify-between text-sm py-1">
            <span className="text-text-secondary">مشتری:</span>
            <span className="font-bold text-text-primary">{order.customer.name}</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span className="text-text-secondary">بسته:</span>
            <span className="font-bold text-text-primary">{order.package.title}</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span className="text-text-secondary">تعداد:</span>
            <span className="font-bold text-text-primary">
              {toPersianDigits(order.quantity)} بسته
            </span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span className="text-text-secondary">مبلغ کل:</span>
            <span className="font-bold text-primary">
              {toPersianDigits(formatNumber(order.total_price))} تومان
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="pickup_code"
              className="block text-xs font-semibold text-text-secondary mb-1.5"
            >
              کد تحویل مشتری (اختیاری)
            </label>
            <input
              id="pickup_code"
              type="text"
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
              className="flex-1 h-11 rounded-xl border border-border-default bg-surface text-sm font-semibold text-text-primary hover:bg-surface-secondary transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 rounded-xl bg-primary text-sm font-semibold text-on-primary hover:bg-primary-hover active:bg-primary-pressed shadow-1 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : 'تأیید تحویل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
