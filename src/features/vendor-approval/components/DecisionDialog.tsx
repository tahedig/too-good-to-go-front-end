import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { TextArea } from '@/components/ui/TextArea'
import { ApiError } from '@/lib/api/client'
import { describeError } from '../errors'
import { toPersianDigits } from '@/lib/digits'
import {
  DECISION_MESSAGE_MAX_LENGTH,
  DECISION_MESSAGE_MIN_LENGTH,
  DECISION_REASONS,
} from '../constants'
import type { Vendor, VendorDecisionPayload, VendorDecisionType } from '../types'

const COPY: Record<
  VendorDecisionType,
  { title: string; section: string; confirm: string; notice?: string }
> = {
  rejection: { title: 'رد درخواست', section: 'دلیل رد درخواست', confirm: 'رد درخواست' },
  suspension: {
    title: 'تعلیق فروشگاه',
    section: 'دلیل تعلیق فروشگاه',
    confirm: 'تعلیق فروشگاه',
    notice:
      'با تعلیق، پیشنهادهای این فروشگاه از دید مشتریان پنهان می‌شود و فروشنده نمی‌تواند پیشنهاد جدید منتشر کند. سفارش‌هایی که قبلاً پرداخت شده‌اند لغو نمی‌شوند و فروشنده باید آن‌ها را تحویل دهد.',
  },
}

type DecisionDialogProps = {
  open: boolean
  type: VendorDecisionType
  vendor: Vendor
  onClose: () => void
  onSubmit: (payload: VendorDecisionPayload) => Promise<void>
}

/** Mount with a fresh `key` per opening so the form starts empty. */
export function DecisionDialog({ open, type, vendor, onClose, onSubmit }: DecisionDialogProps) {
  const [reasonCode, setReasonCode] = useState('')
  const [message, setMessage] = useState('')
  const [messageTouched, setMessageTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({})

  const copy = COPY[type]
  const length = message.trim().length
  const tooShort = length < DECISION_MESSAGE_MIN_LENGTH
  const messageError =
    fieldErrors.message ??
    (messageTouched && tooShort
      ? `حداقل ${toPersianDigits(DECISION_MESSAGE_MIN_LENGTH)} نویسه بنویسید.`
      : undefined)
  const canSubmit = Boolean(reasonCode) && !tooShort && !submitting

  async function submit() {
    setMessageTouched(true)
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    setFieldErrors({})
    try {
      await onSubmit({ reasonCode, message: message.trim() })
    } catch (caught) {
      if (caught instanceof ApiError) {
        setFieldErrors({
          reasonCode: caught.fieldErrors.reasonCode?.[0],
          message: caught.fieldErrors.message?.[0],
        })
      }
      setError(describeError(caught, 'انجام نشد. لطفاً دوباره تلاش کنید.').message)
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.title}
      description={`${vendor.storeName} · ${vendor.ownerName}`}
      preventClose={submitting}
      footer={
        <>
          <Button
            variant="destructive"
            fullWidth
            onClick={submit}
            disabled={!canSubmit}
            isLoading={submitting}
          >
            {copy.confirm}
          </Button>
          <Button variant="secondary" fullWidth onClick={onClose} disabled={submitting}>
            لغو
          </Button>
        </>
      }
    >
      {copy.notice && <InlineAlert tone="warning">{copy.notice}</InlineAlert>}
      {error && <InlineAlert tone="error">{error}</InlineAlert>}
      <fieldset
        className="flex flex-col gap-4 rounded-lg border border-border-default p-4"
        disabled={submitting}
      >
        <legend className="sr-only">{copy.section}</legend>
        <h3 aria-hidden="true" className="text-label-lg">
          {copy.section}
        </h3>
        <Select
          label="دلیل"
          required
          placeholder="انتخاب دلیل"
          options={DECISION_REASONS[type]}
          value={reasonCode}
          error={fieldErrors.reasonCode}
          onChange={(event) => {
            setReasonCode(event.target.value)
            setFieldErrors((current) => ({ ...current, reasonCode: undefined }))
          }}
        />
        <TextArea
          label="پیام به فروشنده"
          required
          rows={4}
          maxLength={DECISION_MESSAGE_MAX_LENGTH}
          placeholder="توضیح دهید فروشنده چه کاری باید انجام دهد."
          value={message}
          error={messageError}
          helperText={`${toPersianDigits(length)} از حداقل ${toPersianDigits(DECISION_MESSAGE_MIN_LENGTH)} نویسه`}
          onBlur={() => setMessageTouched(true)}
          onChange={(event) => {
            setMessage(event.target.value)
            setFieldErrors((current) => ({ ...current, message: undefined }))
          }}
        />
      </fieldset>
    </Modal>
  )
}
