import { useState, type InputHTMLAttributes } from 'react'

type PasswordInputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string
}

export default function PasswordInput({ error, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-3">
      <label htmlFor="password" className="block text-label-md text-text-primary">
        رمز عبور <span aria-hidden="true">*</span>
      </label>
      <input
        {...props}
        id="password"
        type={visible ? 'text' : 'password'}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'password-error' : 'password-hint'}
        className={`h-12 w-full rounded-md border bg-surface px-4 text-left text-body-lg text-text-primary transition-colors focus:border-focus ${
          error ? 'border-error' : 'border-border-input'
        }`}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-pressed={visible}
        className="inline-flex min-h-8 items-center gap-2 rounded-sm text-label-md text-text-primary hover:text-primary-hover"
      >
        <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <circle cx="12" cy="12" r="2.7" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        {visible ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}
      </button>
      {error ? (
        <p id="password-error" className="text-caption text-error">
          {error}
        </p>
      ) : (
        <p id="password-hint" className="text-caption text-text-secondary">
          ایمیل شما حفظ شده است؛ رمز عبور پنهان می‌ماند.
        </p>
      )}
    </div>
  )
}
