import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export default function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id ?? label
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-label-md text-text-primary">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error}
        className={`min-h-11 rounded-md border bg-surface px-4 text-body-md text-text-primary placeholder:text-text-disabled ${
          error ? 'border-error' : 'border-border-input'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-caption text-error">{error}</p>}
    </div>
  )
}
