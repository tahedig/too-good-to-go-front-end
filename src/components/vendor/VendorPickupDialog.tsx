import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ApiError } from '@/lib/api/client'
import { toEnglishDigits, toPersianDigits } from '@/lib/digits'
import { formatPrice } from '@/lib/format'
import {
  formatPickupDate,
  isActiveReservation,
  reservationCustomerLabel,
  STATUS_LABELS,
} from '@/lib/vendorReservations'
import type { Reservation } from '@/lib/vendorReservations'
import { verifyVendorPickup } from '@/services/vendor/ordersService'

export function VendorPickupDialog({
  reservation,
  onClose,
  onVerified,
  preview = false,
}: {
  reservation: Reservation | null
  onClose: () => void
  onVerified: () => void
  preview?: boolean
}) {
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const active = reservation !== null && isActiveReservation(reservation)
  const canVerify = active && !preview

  function resetInput() {
    setCode('')
    setError('')
  }

  function close() {
    resetInput()
    onClose()
  }

  async function submitPickup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!reservation || !canVerify || submitting) return
    if (!/^\d{4}$/.test(code)) {
      setError('کد تحویل باید ۴ رقم باشد.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await verifyVendorPickup(reservation.id, code)
      resetInput()
      onVerified()
    } catch (error) {
      setError(error instanceof ApiError ? error.message : 'ثبت تحویل انجام نشد. دوباره تلاش کنید.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={reservation !== null}
      onClose={close}
      preventClose={submitting}
      title={active ? 'بررسی تحویل' : 'جزئیات رزرو'}
    >
      {reservation && (
        <>
          <div className="flex flex-col gap-2 text-body-md">
            <p className="text-label-lg wrap-anywhere">{reservationCustomerLabel(reservation)}</p>
            <p>
              {reservation.product} · {toPersianDigits(reservation.quantity)} بسته
            </p>
            <p>تاریخ تحویل: {formatPickupDate(reservation.pickupDate)}</p>
            <p>
              ساعت تحویل:{' '}
              <bdi dir="ltr">
                {toPersianDigits(reservation.startTime)}–{toPersianDigits(reservation.endTime)}
              </bdi>
            </p>
            <p>وضعیت: {STATUS_LABELS[reservation.status]}</p>
            <p>مبلغ: {formatPrice(reservation.amount)}</p>
          </div>
          {canVerify ? (
            <form className="mt-5 flex flex-col gap-3" onSubmit={submitPickup} noValidate>
              <Input
                label="کد تحویل"
                helperText="کد ۴ رقمی را از مشتری بگیرید."
                value={toPersianDigits(code)}
                onChange={(event) => {
                  setCode(toEnglishDigits(event.target.value).replace(/\D/g, '').slice(0, 4))
                  setError('')
                }}
                inputMode="numeric"
                autoComplete="off"
                ltrValue
                required
                autoFocus
                readOnly={submitting}
              />
              {error && <InlineAlert tone="error">{error}</InlineAlert>}
              <Button type="submit" fullWidth isLoading={submitting}>
                تأیید تحویل
              </Button>
            </form>
          ) : (
            <div className="mt-5 flex flex-col gap-3">
              {preview && (
                <InlineAlert>این رزرو نمونه است؛ هیچ تحویلی در سرور ثبت نمی‌شود.</InlineAlert>
              )}
              <Button variant="secondary" fullWidth onClick={close}>
                بستن
              </Button>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
