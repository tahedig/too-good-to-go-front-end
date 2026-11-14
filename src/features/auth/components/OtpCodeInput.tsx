import { useRef, type ChangeEvent, type ClipboardEvent, type KeyboardEvent } from 'react'
import { toEnglishDigits, toPersianDigits } from '@/lib/digits'

type OtpCodeInputProps = {
  value: string
  onChange: (value: string) => void
  error?: boolean
  disabled?: boolean
}

export default function OtpCodeInput({ value, onChange, error, disabled }: OtpCodeInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? '')

  function updateDigit(index: number, rawValue: string) {
    const digit = toEnglishDigits(rawValue).replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    onChange(next.join(''))
    if (digit && index < 5) refs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) refs.current[index - 1]?.focus()
    if (event.key === 'ArrowLeft' && index < 5) refs.current[index + 1]?.focus()
    if (event.key === 'ArrowRight' && index > 0) refs.current[index - 1]?.focus()
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const pasted = toEnglishDigits(event.clipboardData.getData('text'))
      .replace(/\D/g, '')
      .slice(0, 6)
    onChange(pasted)
    refs.current[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div dir="ltr" className="grid grid-cols-6 gap-2" aria-label="کد تایید ۶ رقمی">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          value={toPersianDigits(digit)}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            updateDigit(index, event.target.value)
          }
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`رقم ${index + 1} کد تایید`}
          className={[
            'h-13 min-w-0 rounded-md border bg-surface text-center text-title-md text-primary transition-colors focus:border-focus focus:outline-none',
            error ? 'border-error' : 'border-border-input',
          ].join(' ')}
        />
      ))}
    </div>
  )
}
