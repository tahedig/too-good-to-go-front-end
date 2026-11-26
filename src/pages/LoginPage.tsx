import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { ApiError } from '@/lib/api/client'
import { toEnglishDigits } from '@/lib/digits'
import { customerOtpApi } from '@/features/auth/api/customerOtpApi'
import OtpCodeInput from '@/features/auth/components/OtpCodeInput'
import { verifyOtpService } from '@/services/authService'

type LoginStep = 'phone' | 'otp'
const iranianMobilePattern = /^09\d{9}$/
// Default OTP_RESEND_COOLDOWN in the Go API. The server also enforces its configured limit.
const RESEND_COOLDOWN = 60

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState<LoginStep>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [debugCode, setDebugCode] = useState('')
  const [code, setCode] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [fieldError, setFieldError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = window.setInterval(() => setSecondsLeft((value) => value - 1), 1000)
    return () => window.clearInterval(timer)
  }, [secondsLeft])

  function goBack() {
    setSubmitError('')
    setNotice('')
    setFieldError('')
    setCode('')
    setDebugCode('')
    setStep('phone')
  }

  async function handlePhoneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const phone = toEnglishDigits(phoneNumber)
    if (!iranianMobilePattern.test(phone)) {
      setFieldError('شماره تلفن باید ۱۱ رقم باشد و با ۰۹ شروع شود.')
      return
    }

    setFieldError('')
    setSubmitError('')
    setSubmitting(true)
    try {
      const result = await customerOtpApi.requestOtp(phone)
      setSecondsLeft(RESEND_COOLDOWN)
      setDebugCode(import.meta.env.DEV ? (result.debug_code ?? '') : '')
      setStep('otp')
    } catch (error) {
      setSubmitError(errorMessage(error, 'ارسال کد تایید انجام نشد.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (code.length !== 6) {
      setFieldError('کد تایید باید ۶ رقم باشد.')
      return
    }

    setFieldError('')
    setSubmitError('')
    setSubmitting(true)

    try {
      const response = await verifyOtpService({
        phone: toEnglishDigits(phoneNumber),
        code: toEnglishDigits(code),
      })

      const returnTo = searchParams.get('returnTo')
      const role = response.user?.role
      const home = role === 'vendor' ? '/vendor' : role === 'admin' ? '/admin' : '/profile'
      const safeReturnTo = returnTo?.startsWith('/') && !/^\/[\\/]/.test(returnTo) ? returnTo : home

      await navigate(safeReturnTo, { replace: true })
    } catch (error) {
      setFieldError(errorMessage(error, 'کد تایید نادرست است.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setSubmitError('')
    setNotice('')
    setSubmitting(true)
    try {
      const result = await customerOtpApi.requestOtp(toEnglishDigits(phoneNumber))
      setSecondsLeft(RESEND_COOLDOWN)
      setDebugCode(import.meta.env.DEV ? (result.debug_code ?? '') : '')
      setCode('')
      setFieldError('')
      setNotice('کد جدید ارسال شد.')
    } catch (error) {
      setSubmitError(errorMessage(error, 'ارسال مجدد کد انجام نشد.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section
      className="w-full max-w-[440px] rounded-lg bg-surface p-5 shadow-1 sm:p-8"
      aria-live="polite"
    >
      <div className="mb-5 flex justify-end">
        {step === 'phone' ? (
          <Link
            to="/"
            aria-label="بازگشت به صفحه اصلی"
            className="grid size-10 place-items-center rounded-md border border-border-default text-primary hover:bg-surface-secondary"
          >
            <ArrowRight className="size-5" strokeWidth={1.75} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={goBack}
            aria-label="بازگشت"
            className="grid size-10 place-items-center rounded-md border border-border-default text-primary hover:bg-surface-secondary"
          >
            <ArrowRight className="size-5" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} noValidate>
          <h1 className="text-title-xl text-primary">شماره تلفن خود را وارد کنید</h1>
          <p className="mt-2 text-body-md text-text-secondary">
            برای ورود یا ساخت حساب، شماره موبایلتان را وارد کنید.
          </p>
          {submitError && (
            <InlineAlert tone="error" className="mt-5">
              {submitError}
            </InlineAlert>
          )}
          <PhoneInput
            label="شماره تلفن"
            value={phoneNumber}
            onChange={(event) => {
              setPhoneNumber(event.target.value)
              setFieldError('')
            }}
            error={fieldError}
            className="mt-6"
            autoFocus
            required
          />
          <Button type="submit" fullWidth isLoading={submitting} className="mt-5">
            ادامه
          </Button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} noValidate>
          <h1 className="text-title-xl text-primary">تایید شماره</h1>
          <p className="mt-3 text-body-md text-text-secondary">
            کد تایید برای{' '}
            <bdi dir="ltr" className="font-semibold text-primary">
              {phoneNumber}
            </bdi>{' '}
            ارسال شد. کد را در کادرهای زیر وارد کنید.
          </p>
          {import.meta.env.DEV && debugCode && (
            <p className="mt-3 text-caption text-text-secondary">
              کد آزمایشی: <bdi dir="ltr">{debugCode}</bdi>
            </p>
          )}
          {submitError && (
            <InlineAlert tone="error" className="mt-5">
              {submitError}
            </InlineAlert>
          )}
          {notice && (
            <InlineAlert tone="success" className="mt-5">
              {notice}
            </InlineAlert>
          )}
          <div className="mt-6 space-y-2">
            <label className="block text-label-md text-primary">کد تایید</label>
            <OtpCodeInput
              value={code}
              onChange={(value) => {
                setCode(value)
                setFieldError('')
              }}
              error={Boolean(fieldError)}
              disabled={submitting}
            />
            {fieldError && (
              <p role="alert" className="text-caption text-error">
                {fieldError}
              </p>
            )}
          </div>
          <Button type="submit" fullWidth isLoading={submitting} className="mt-5">
            تایید و ادامه
          </Button>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={secondsLeft > 0 || submitting}
            onClick={handleResend}
            className="mt-3"
          >
            {secondsLeft > 0
              ? `ارسال مجدد تا ${secondsLeft.toLocaleString('fa-IR')} ثانیه`
              : 'ارسال مجدد'}
          </Button>
          <button
            type="button"
            onClick={goBack}
            className="mt-4 min-h-11 w-full text-label-md text-primary hover:underline"
          >
            ویرایش شماره تلفن
          </button>
        </form>
      )}
    </section>
  )
}
