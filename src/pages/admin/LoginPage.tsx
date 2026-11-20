import { useEffect, useState, type FormEvent } from 'react'
import { ChevronRight } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { adminAuthApi } from '@/features/auth/api/adminAuthApi'
import OtpCodeInput from '@/features/auth/components/OtpCodeInput'
import { ApiError } from '@/lib/api/client'
import { toEnglishDigits, toPersianDigits } from '@/lib/digits'

type AdminLoginStep = 'phone' | 'otp' | 'denied'

const IRANIAN_MOBILE_PATTERN = /^09\d{9}$/
const UNAUTHORIZED_PHONE_MESSAGE = 'شماره تلفن مجاز نیست. دوباره تلاش کنید.'

function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds)
  const minutes = String(Math.floor(clamped / 60)).padStart(2, '0')
  const seconds = String(clamped % 60).padStart(2, '0')
  return toPersianDigits(`${minutes}:${seconds}`)
}

function getSafeAdminReturnTo(returnTo: string | null): string {
  if (returnTo && returnTo.startsWith('/admin') && !returnTo.startsWith('//')) {
    return returnTo
  }
  return '/admin'
}

function clearCorruptAuthSession() {
  const existing = sessionStorage.getItem('auth_session')
  if (!existing) return
  try {
    JSON.parse(existing)
  } catch {
    sessionStorage.removeItem('auth_session')
  }
}

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [step, setStep] = useState<AdminLoginStep>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
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
    document.title = 'ورود مدیریت | ته‌دیگ'
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

  function handleBackNavigation() {
    if (window.history.length > 1) {
      void navigate(-1)
      return
    }
    void navigate('/')
  }

  function handleEditPhone() {
    setCode('')
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
      const result = await adminAuthApi.requestOtp(normalizedPhone)
      setCode('')
      setOtpError('')
      setResendSecondsLeft(result.retryAfter)
      setOtpExpiresLeft(result.expiresIn)
      setStep('otp')
    } catch (error) {
      if (error instanceof ApiError) {
        if (
          error.status === 400 ||
          error.status === 401 ||
          error.status === 403 ||
          error.status === 404 ||
          error.status === 422
        ) {
          setPhoneError(error.fieldErrors.phone?.[0] ?? UNAUTHORIZED_PHONE_MESSAGE)
        } else if (error.status === 429) {
          setSubmitError('تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.')
        } else if (error.status === 0) {
          setSubmitError(error.message)
        } else {
          setSubmitError('در برقراری ارتباط با سرور مشکلی پیش آمد. لطفاً دوباره تلاش کنید.')
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
      const result = await adminAuthApi.verifyOtp({
        phone: toEnglishDigits(phoneNumber).trim(),
        code: normalizedCode,
      })

      if (!result.isAdmin) {
        setDeniedRole(result.user.role)
        setStep('denied')
        return
      }

      const targetPath = getSafeAdminReturnTo(searchParams.get('returnTo'))
      await navigate(targetPath, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403) {
          setDeniedRole('')
          setStep('denied')
        } else if (
          error.status === 400 ||
          error.status === 401 ||
          error.status === 404 ||
          error.status === 422
        ) {
          setOtpError('کد تأیید نادرست یا منقضی شده است.')
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
      const result = await adminAuthApi.requestOtp(normalizedPhone)
      setCode('')
      setResendSecondsLeft(result.retryAfter)
      setOtpExpiresLeft(result.expiresIn)
      setNotice('کد تأیید جدید ارسال شد.')
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
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
    adminAuthApi.logout()
    setPhoneNumber('')
    setCode('')
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
    deniedRole === 'customer' || deniedRole === 'user'
      ? { label: 'بازگشت به صفحه اصلی', to: '/' }
      : { label: 'بازگشت به فضای فروشنده', to: '/vendor' }

  return (
    <div className="flex w-full max-w-[358px] flex-col gap-4 sm:max-w-[432px]">
      {step === 'phone' && (
        <button
          type="button"
          onClick={handleBackNavigation}
          aria-label="بازگشت"
          className="grid size-11 self-start place-items-center rounded-lg border border-border-default bg-surface text-primary transition-colors hover:bg-surface-secondary sm:hidden"
        >
          <ChevronRight className="size-6" strokeWidth={1.75} />
        </button>
      )}

      <section
        className="flex w-full flex-col gap-4 rounded-xl border border-border-default bg-surface p-4"
        aria-live="polite"
      >
        <p className="text-title-xl font-semibold text-primary">ته‌دیگ</p>

        {step === 'phone' && (
          <>
            <h1 className="text-title-lg text-primary">شماره تلفن خود را وارد کنید</h1>
            <p className="text-label-md leading-[22px] text-primary">
              فقط شماره‌های مجاز مدیریت امکان ورود دارند. ایجاد حساب مدیریت از این صفحه ممکن نیست.
            </p>

            {submitError && <InlineAlert tone="error">{submitError}</InlineAlert>}

            <form onSubmit={handlePhoneSubmit} noValidate className="flex flex-col gap-4">
              <PhoneInput
                label="شماره تلفن خود را وارد کنید"
                placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                value={phoneNumber}
                onChange={(event) => {
                  setPhoneNumber(event.target.value)
                  setPhoneError('')
                  setSubmitError('')
                }}
                error={phoneError}
                autoFocus
              />

              <Button type="submit" size="md" fullWidth isLoading={submitting}>
                ادامه
              </Button>
            </form>
          </>
        )}

        {step === 'otp' && (
          <>
            <h1 className="text-title-lg text-primary">کد تأیید</h1>

            <button
              type="button"
              onClick={handleEditPhone}
              aria-label={`ویرایش شماره ${toPersianDigits(phoneNumber)}`}
              className="self-start rounded-sm text-label-lg text-primary underline underline-offset-4 transition-colors hover:text-primary-hover"
            >
              <bdi dir="ltr">{toPersianDigits(phoneNumber)}</bdi>
            </button>

            <p className="text-label-md leading-[22px] text-primary">
              این شماره تلفن شماست. در صورت نیاز، برای ویرایش شماره روی آن کلیک کنید.
            </p>

            {submitError && <InlineAlert tone="error">{submitError}</InlineAlert>}
            {notice && <InlineAlert tone="success">{notice}</InlineAlert>}

            <form onSubmit={handleOtpSubmit} noValidate className="flex flex-col gap-4">
              <div className="flex min-h-[84px] flex-col gap-2">
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
                  placeholder="—"
                  inputClassName="bg-surface-secondary placeholder:text-label-lg placeholder:text-text-primary focus:bg-surface"
                />
                {otpError && (
                  <p role="alert" className="text-caption text-error">
                    {otpError}
                  </p>
                )}
              </div>

              <p className="text-body-md text-text-secondary">
                {otpExpiresLeft > 0
                  ? `اعتبار کد ${formatCountdown(otpExpiresLeft)}`
                  : 'اعتبار کد به پایان رسید. لطفاً کد جدید ارسال کنید.'}
              </p>

              <Button type="submit" size="md" fullWidth isLoading={submitting} disabled={resending}>
                تأیید و ادامه
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth
                isLoading={resending}
                disabled={resendSecondsLeft > 0 || submitting}
                onClick={handleResend}
                className={resendSecondsLeft > 0 ? 'border-primary! text-primary! opacity-45' : ''}
              >
                {resendSecondsLeft > 0
                  ? `ارسال دوباره ${formatCountdown(resendSecondsLeft)}`
                  : 'ارسال دوباره'}
              </Button>
            </form>
          </>
        )}

        {step === 'denied' && (
          <>
            <h1 className="text-title-lg text-primary">دسترسی مدیریت ندارید</h1>
            <p className="text-label-md leading-[22px] text-primary">
              فقط شماره‌های مجاز مدیریت امکان ورود دارند. ایجاد حساب مدیریت از این صفحه ممکن نیست.
            </p>

            <div className="flex flex-col gap-4">
              <Button type="button" size="md" fullWidth onClick={handleLogout}>
                خروج از حساب
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => void navigate(workspaceReturn.to, { replace: true })}
              >
                {workspaceReturn.label}
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
