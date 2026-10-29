import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { ApiError } from '@/lib/api/client'
import { authApi } from '../api/authApi'
import { emailPattern, getErrorMessage } from '../utils'
import AuthAlert from './AuthAlert'
import PasswordInput from './PasswordInput'

type LoginFormProps = {
  onRecovery: (email: string) => void
}

type FormErrors = Partial<Record<'email' | 'password', string>>

export default function LoginForm({ onRecovery }: LoginFormProps) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const nextErrors: FormErrors = {}
    if (!email.trim()) nextErrors.email = 'وارد کردن ایمیل کاری الزامی است.'
    else if (!emailPattern.test(email)) nextErrors.email = 'فرمت ایمیل واردشده صحیح نیست.'
    if (!password) nextErrors.password = 'وارد کردن رمز عبور الزامی است.'
    else if (password.length < 8) nextErrors.password = 'رمز عبور باید حداقل ۸ کاراکتر باشد.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      const session = await authApi.login({ email: email.trim(), password })
      sessionStorage.setItem('auth_session', JSON.stringify(session))
      await navigate(session.user.role === 'admin' ? '/admin' : '/vendor')
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({
          email: error.fieldErrors.email?.[0],
          password: error.fieldErrors.password?.[0],
        })
      }
      setSubmitError(
        getErrorMessage(error, 'ورود انجام نشد. ایمیل و رمز عبور را بررسی و دوباره تلاش کنید.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-7">
      {submitError && <AuthAlert>{submitError}</AuthAlert>}

      <div className="space-y-3">
        <label htmlFor="email" className="block text-label-md text-text-primary">
          ایمیل کاری <span aria-hidden="true">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          dir="ltr"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setErrors((current) => ({ ...current, email: undefined }))
          }}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : 'email-hint'}
          placeholder="reviewer@example.com"
          className={`h-12 w-full rounded-md border bg-surface px-4 text-left text-body-lg text-text-primary placeholder:text-text-secondary/70 focus:border-focus ${
            errors.email ? 'border-error' : 'border-border-input'
          }`}
        />
        {errors.email ? (
          <p id="email-error" className="text-caption text-error">
            {errors.email}
          </p>
        ) : (
          <p id="email-hint" className="text-caption text-text-secondary">
            از ایمیل مدیریت اختصاص‌یافته استفاده کنید.
          </p>
        )}
      </div>

      <PasswordInput
        name="password"
        value={password}
        autoComplete="current-password"
        onChange={(event) => {
          setPassword(event.target.value)
          setErrors((current) => ({ ...current, password: undefined }))
        }}
        error={errors.password}
      />

      <div className="space-y-4 pt-1">
        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting
            ? 'در حال ورود…'
            : submitError
              ? 'تلاش دوباره برای ورود'
              : 'ورود به فضای مدیریت'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => onRecovery(email)}
        >
          بازیابی دسترسی حساب
        </Button>
      </div>
    </form>
  )
}
