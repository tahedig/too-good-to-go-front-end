import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { vendorAuthApi } from '@/features/auth/api/vendorAuthApi'
import OtpCodeInput from '@/features/auth/components/OtpCodeInput'
import { ApiError } from '@/lib/api/client'
import { toEnglishDigits, toPersianDigits } from '@/lib/digits'

type VendorLoginStep = 'phone' | 'otp' | 'denied'

const IRANIAN_MOBILE_PATTERN = /^09\d{9}$/

function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds)
  const minutes = String(Math.floor(clamped / 60)).padStart(2, '0')
  const seconds = String(clamped % 60).padStart(2, '0')
  return toPersianDigits(`${minutes}:${seconds}`)
}

function getSafeVendorReturnTo(returnTo: string | null): string {
  if (returnTo && returnTo.startsWith('/vendor') && !/^\/[\\/]/.test(returnTo)) {
    return returnTo
  }
  return '/vendor'
}

function clearCorruptAuthSession() {
  if (typeof sessionStorage === 'undefined') return
  const existing = sessionStorage.getItem('auth_session')
  if (!existing) return
  try {
    JSON.parse(existing)
  } catch {
    sessionStorage.removeItem('auth_session')
  }
}

export default function VendorLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [step, setStep] = useState<VendorLoginStep>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [debugCode, setDebugCode] = useState('')
  const [code, setCode] = useState('')
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0)
  const [otpExpiresLeft, setOtpExpiresLeft] = useState(0)
  const [deniedRole, setDeniedRole] = useState('')

  const [phoneError, setPhoneError] = useState('')
  const [otpError, setOtpError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'ورود فروشنده | ته‌دیگ'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    if (step !== 'otp' || resendSecondsLeft <= 0) return
    const timer = window.setInterval(() => {
      setResendSecondsLeft((seconds) => Math.max(0, seconds - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [step, resendSecondsLeft])

  useEffect(() => {
    if (step !== 'otp' || otpExpiresLeft <= 0) return
    const timer = window.setInterval(() => {
      setOtpExpiresLeft((seconds) => Math.max(0, seconds - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [step, otpExpiresLeft])

  function handleEditPhone() {
    setCode('')
    setDebugCode('')
    setOtpError('')
    setSubmitError('')
    setNotice('')
    setStep('phone')
  }

  async function handlePhoneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedPhone = toEnglishDigits(phoneNumber).trim()

    if (!normalizedPhone) {
      setPhoneError('وارد کردن شماره تلفن الزامی است.')
      return
    }

    if (!IRANIAN_MOBILE_PATTERN.test(normalizedPhone)) {
      setPhoneError('شماره تلفن باید ۱۱ رقم باشد و با ۰۹ شروع شود.')
      return
    }

    setPhoneError('')
    setSubmitError('')
    setNotice('')
    setSubmitting(true)
    clearCorruptAuthSession()

    try {
      const result = await vendorAuthApi.requestOtp(normalizedPhone)
      setCode('')
      setOtpError('')
      setDebugCode(import.meta.env.DEV ? (result.debugCode ?? '') : '')
      setResendSecondsLeft(result.retryAfter)
      setOtpExpiresLeft(result.expiresIn)
      setStep('otp')
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'INVALID_PHONE_NUMBER') {
          setPhoneError('شماره تلفن واردشده معتبر نیست.')
        } else if (error.status === 429) {
          setSubmitError(
            error.retryAfter
              ? `کد تأیید به‌تازگی ارسال شده است. لطفاً ${toPersianDigits(String(error.retryAfter))} ثانیه صبر کنید.`
              : 'تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.',
          )
        } else if (error.status === 0) {
          setSubmitError(error.message)
        } else {
          setSubmitError(error.message || 'ارسال کد تأیید انجام نشد. لطفاً دوباره تلاش کنید.')
        }
      } else {
        setSubmitError('ارسال کد تأیید انجام نشد. لطفاً دوباره تلاش کنید.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedCode = toEnglishDigits(code).trim()

    if (normalizedCode.length !== 6) {
      setOtpError('کد تأیید باید ۶ رقم باشد.')
      return
    }

    if (otpExpiresLeft <= 0) {
      setOtpError('اعتبار کد به پایان رسیده است. لطفاً دوباره کد ارسال کنید.')
      return
    }

    setOtpError('')
    setSubmitError('')
    setNotice('')
    setSubmitting(true)
    clearCorruptAuthSession()

    try {
      const result = await vendorAuthApi.verifyOtp({
        phone: toEnglishDigits(phoneNumber).trim(),
        code: normalizedCode,
      })

      if (!result.isVendor) {
        setDeniedRole(result.user.role)
        setStep('denied')
        return
      }

      const targetPath = getSafeVendorReturnTo(searchParams.get('returnTo'))
      await navigate(targetPath, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403) {
          setDeniedRole('')
          setStep('denied')
        } else if (error.code === 'OTP_EXPIRED') {
          setOtpError('کد تأیید منقضی شده یا قبلاً استفاده شده است.')
        } else if (
          error.status === 400 ||
          error.status === 401 ||
          error.status === 404 ||
          error.status === 422
        ) {
          setOtpError(error.message || 'کد تأیید نادرست یا منقضی شده است.')
        } else if (error.status === 429) {
          setSubmitError('تعداد تلاش‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.')
        } else if (error.status === 0) {
          setSubmitError(error.message)
        } else {
          setSubmitError('در بررسی کد تأیید مشکلی پیش آمد. لطفاً دوباره تلاش کنید.')
        }
      } else {
        setSubmitError('تأیید کد انجام نشد. لطفاً دوباره تلاش کنید.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    const normalizedPhone = toEnglishDigits(phoneNumber).trim()
    setOtpError('')
    setSubmitError('')
    setNotice('')
    setResending(true)
    clearCorruptAuthSession()

    try {
      const result = await vendorAuthApi.requestOtp(normalizedPhone)
      setCode('')
      setDebugCode(import.meta.env.DEV ? (result.debugCode ?? '') : '')
      setResendSecondsLeft(result.retryAfter)
      setOtpExpiresLeft(result.expiresIn)
      setNotice('کد تأیید جدید ارسال شد.')
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        if (error.retryAfter) setResendSecondsLeft(error.retryAfter)
        setSubmitError('تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.')
      } else if (error instanceof ApiError && error.status === 0) {
        setSubmitError(error.message)
      } else {
        setSubmitError('ارسال دوباره کد انجام نشد. لطفاً کمی بعد تلاش کنید.')
      }
    } finally {
      setResending(false)
    }
  }

  function handleLogout() {
    vendorAuthApi.logout()
    setPhoneNumber('')
    setCode('')
    setDebugCode('')
    setPhoneError('')
    setOtpError('')
    setSubmitError('')
    setNotice('')
    setDeniedRole('')
    setResendSecondsLeft(0)
    setOtpExpiresLeft(0)
    setStep('phone')
  }

  const workspaceReturn =
    deniedRole === 'admin'
      ? { label: 'ورود به پنل مدیریت', to: '/admin' }
      : { label: 'بازگشت به صفحه اصلی', to: '/' }

  return (
    <section
      className="w-full max-w-[440px] rounded-lg bg-surface p-5 shadow-1 sm:p-8"
      aria-live="polite"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-title-lg font-bold text-primary">ته‌دیگ · فروشنده</span>
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
            onClick={handleEditPhone}
            aria-label="بازگشت"
            className="grid size-10 place-items-center rounded-md border border-border-default text-primary hover:bg-surface-secondary"
          >
            <ArrowRight className="size-5" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} noValidate>
          <h1 className="text-title-xl text-primary">ورود به پنل فروشنده</h1>
          <p className="mt-2 text-body-md text-text-secondary">
            شماره موبایل ثبت‌شده برای فروشگاه خود را وارد کنید تا کد تأیید برایتان ارسال شود.
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
              setPhoneError('')
              setSubmitError('')
            }}
            error={phoneError}
            className="mt-6"
            autoFocus
            required
          />

          <Button type="submit" fullWidth isLoading={submitting} className="mt-5">
            ادامه
          </Button>

          <p className="mt-4 text-center text-caption text-text-secondary">
            حساب مشتری دارید؟{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              ورود مشتریان
            </Link>
          </p>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} noValidate>
          <h1 className="text-title-xl text-primary">تأیید شماره فروشنده</h1>
          <p className="mt-3 text-body-md text-text-secondary">
            کد تأیید برای{' '}
            <bdi dir="ltr" className="font-semibold text-primary">
              {toPersianDigits(phoneNumber)}
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
            <label className="block text-label-md text-primary">کد تأیید</label>
            <OtpCodeInput
              value={code}
              onChange={(nextCode) => {
                setCode(nextCode)
                setOtpError('')
                setSubmitError('')
              }}
              error={Boolean(otpError)}
              disabled={submitting || resending}
              autoFocus
            />
            {otpError && (
              <p role="alert" className="text-caption text-error">
                {otpError}
              </p>
            )}
          </div>

          <p className="mt-3 text-caption text-text-secondary">
            {otpExpiresLeft > 0
              ? `اعتبار کد: ${formatCountdown(otpExpiresLeft)}`
              : 'اعتبار کد به پایان رسید. لطفاً کد جدید ارسال کنید.'}
          </p>

          <Button
            type="submit"
            fullWidth
            isLoading={submitting}
            disabled={resending}
            className="mt-5"
          >
            تأیید و ورود به پنل
          </Button>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            isLoading={resending}
            disabled={resendSecondsLeft > 0 || submitting}
            onClick={handleResend}
            className="mt-3"
          >
            {resendSecondsLeft > 0
              ? `ارسال مجدد تا ${formatCountdown(resendSecondsLeft)}`
              : 'ارسال مجدد'}
          </Button>

          <button
            type="button"
            onClick={handleEditPhone}
            className="mt-4 min-h-11 w-full text-label-md text-primary hover:underline"
          >
            ویرایش شماره تلفن
          </button>
        </form>
      )}

      {step === 'denied' && (
        <div className="space-y-4">
          <h1 className="text-title-xl text-primary">دسترسی فروشنده ندارید</h1>
          <p className="text-body-md text-text-secondary">
            این شماره تلفن به حساب فروشنده متصل نیست. با شماره مجاز فروشنده وارد شوید یا به حساب خود
            بازگردید.
          </p>

          <div className="space-y-3 pt-2">
            <Button type="button" fullWidth onClick={handleLogout}>
              تلاش با شماره دیگر
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => void navigate(workspaceReturn.to, { replace: true })}
            >
              {workspaceReturn.label}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
