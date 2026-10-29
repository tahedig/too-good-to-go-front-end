import { useState } from 'react'
import { env } from '@/config/env'
import LoginForm from '@/features/auth/components/LoginForm'
import OtpVerificationForm from '@/features/auth/components/OtpVerificationForm'
import RecoveryForm from '@/features/auth/components/RecoveryForm'

type OtpState = {
  email: string
  requestId: string
  expiresIn: number
  retryAfter: number
}

export default function LoginPage() {
  const [step, setStep] = useState<'login' | 'recovery' | 'otp'>('login')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [otp, setOtp] = useState<OtpState | null>(null)

  const copy = {
    login: {
      title: 'خوش برگشتید.',
      subtitle: `وارد فضای مدیریت ${env.appName} شوید.`,
    },
    recovery: {
      title: 'بازیابی دسترسی',
      subtitle: 'برای دریافت کد یک‌بارمصرف، ایمیل کاری خود را وارد کنید.',
    },
    otp: {
      title: 'کد را وارد کنید',
      subtitle: `کد بازیابی ارسال‌شده از طرف ${env.appName} را بررسی کنید.`,
    },
  }[step]

  return (
    <section className="w-full max-w-[520px] pt-4 sm:pt-12" aria-labelledby="auth-title">
      <header className="mb-7 sm:mb-8">
        <h1 id="auth-title" className="text-title-xl text-text-primary sm:text-display-xl">
          {copy.title}
        </h1>
        <p className="mt-3 text-body-lg text-text-secondary">{copy.subtitle}</p>
      </header>

      {step === 'login' && (
        <LoginForm
          onRecovery={(email) => {
            setRecoveryEmail(email)
            setStep('recovery')
          }}
        />
      )}

      {step === 'recovery' && (
        <RecoveryForm
          initialEmail={recoveryEmail}
          onBack={() => setStep('login')}
          onOtpRequested={(data) => {
            setOtp(data)
            setStep('otp')
          }}
        />
      )}

      {step === 'otp' && otp && (
        <OtpVerificationForm
          email={otp.email}
          initialRequestId={otp.requestId}
          initialRetryAfter={otp.retryAfter}
          onBack={() => setStep('recovery')}
        />
      )}

      <div className="mt-10 text-center sm:mt-11">
        <a
          href={`mailto:${env.supportEmail}`}
          className="inline-flex min-h-11 items-center rounded-sm text-title-sm hover:underline"
        >
          تماس با پشتیبانی
        </a>
        <p className="mx-auto mt-6 max-w-[460px] text-caption leading-6 text-text-secondary">
          محدود به مدیران مجاز. اطلاعات ورود صرفاً نمونه‌اند؛ احراز هویت انجام نمی‌شود.
        </p>
        <p className="mt-4 text-caption text-text-secondary">
          داده‌های فرضی نمونه · بدون پرداخت، رزرو یا احراز هویت واقعی
        </p>
      </div>
    </section>
  )
}
