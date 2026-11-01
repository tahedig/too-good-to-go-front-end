import { useState, type FormEvent } from 'react'
import {Button} from '@/components/ui/Button'
import { authApi } from '../api/authApi'
import { emailPattern, getErrorMessage } from '../utils'
import AuthAlert from './AuthAlert'

type RecoveryFormProps = {
  initialEmail: string
  onBack: () => void
  onOtpRequested: (data: {
    email: string
    requestId: string
    expiresIn: number
    retryAfter: number
  }) => void
}

export default function RecoveryForm({ initialEmail, onBack, onOtpRequested }: RecoveryFormProps) {
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = email.trim()
    if (!emailPattern.test(value)) {
      setError('یک ایمیل کاری معتبر وارد کنید.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const response = await authApi.requestRecoveryOtp({
        email: value,
        purpose: 'account_recovery',
      })
      onOtpRequested({
        email: value,
        requestId: response.requestId,
        expiresIn: response.expiresIn,
        retryAfter: response.retryAfter ?? 60,
      })
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'ارسال کد انجام نشد. لطفاً دوباره تلاش کنید.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-7">
      {error && <AuthAlert>{error}</AuthAlert>}
      <div className="space-y-3">
        <label htmlFor="recovery-email" className="block text-label-md">
          ایمیل کاری
        </label>
        <input
          id="recovery-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="reviewer@example.com"
          className="h-12 w-full rounded-md border border-border-input bg-surface px-4 text-left text-body-lg focus:border-focus"
        />
        <p className="text-caption text-text-secondary">کد یک‌بارمصرف به این ایمیل ارسال می‌شود.</p>
      </div>
      <div className="space-y-4">
        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting ? 'در حال ارسال…' : 'ارسال کد بازیابی'}
        </Button>
        <Button type="button" variant="secondary" size="lg" className="w-full" onClick={onBack}>
          بازگشت به ورود
        </Button>
      </div>
    </form>
  )
}
