import { useEffect, useState, type FormEvent } from 'react'
import {Button} from '@/components/ui/Button'
import { authApi } from '../api/authApi'
import { getErrorMessage } from '../utils'
import AuthAlert from './AuthAlert'

type OtpVerificationFormProps = {
  email: string
  initialRequestId: string
  initialRetryAfter: number
  onBack: () => void
}

export default function OtpVerificationForm({
  email,
  initialRequestId,
  initialRetryAfter,
  onBack,
}: OtpVerificationFormProps) {
  const [code, setCode] = useState('')
  const [requestId, setRequestId] = useState(initialRequestId)
  const [secondsLeft, setSecondsLeft] = useState(initialRetryAfter)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = window.setInterval(() => setSecondsLeft((value) => value - 1), 1000)
    return () => window.clearInterval(timer)
  }, [secondsLeft])

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!/^\d{6}$/.test(code)) {
      setError('کد یک‌بارمصرف باید ۶ رقم باشد.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const response = await authApi.verifyRecoveryOtp({ email, code, requestId })
      sessionStorage.setItem('account_recovery_token', response.recoveryToken)
      setSuccess('کد تأیید شد. اکنون می‌توانید مرحله تعیین رمز جدید را به بک‌اند متصل کنید.')
    } catch (verifyError) {
      setError(getErrorMessage(verifyError, 'کد صحیح نیست یا منقضی شده است.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setError('')
    try {
      const response = await authApi.requestRecoveryOtp({ email, purpose: 'account_recovery' })
      setRequestId(response.requestId)
      setSecondsLeft(response.retryAfter ?? 60)
      setSuccess('کد جدید ارسال شد.')
    } catch (resendError) {
      setError(getErrorMessage(resendError, 'ارسال مجدد کد انجام نشد.'))
    }
  }

  return (
    <form onSubmit={handleVerify} noValidate className="space-y-7">
      {error && <AuthAlert>{error}</AuthAlert>}
      {success && <AuthAlert tone="success">{success}</AuthAlert>}
      <div className="space-y-3">
        <label htmlFor="otp" className="block text-label-md">
          کد یک‌بارمصرف
        </label>
        <input
          id="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          dir="ltr"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          className="h-14 w-full rounded-md border border-border-input bg-surface px-4 text-center text-2xl tracking-[0.55em] focus:border-focus"
        />
        <p className="text-caption text-text-secondary">
          کد ارسال‌شده به <bdi dir="ltr">{email}</bdi> را وارد کنید.
        </p>
      </div>
      <Button type="submit" size="lg" disabled={submitting || Boolean(success)} className="w-full">
        {submitting ? 'در حال بررسی…' : 'تأیید کد'}
      </Button>
      <div className="flex items-center justify-between gap-3 text-label-md">
        <button
          type="button"
          onClick={onBack}
          className="rounded-sm text-text-secondary hover:text-text-primary"
        >
          ویرایش ایمیل
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={secondsLeft > 0}
          className="rounded-sm text-primary disabled:cursor-not-allowed disabled:text-text-disabled"
        >
          {secondsLeft > 0 ? `ارسال مجدد تا ${secondsLeft} ثانیه` : 'ارسال مجدد کد'}
        </button>
      </div>
    </form>
  )
}
