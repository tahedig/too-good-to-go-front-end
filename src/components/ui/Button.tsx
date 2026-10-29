import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'
type Size = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-pressed',
  secondary: 'border border-border-input bg-surface text-text-primary hover:bg-surface-secondary',
  danger: 'bg-error text-text-inverse hover:bg-error-hover active:bg-error-pressed',
}

// حداقل هدف لمس ۴۴px (WCAG)، دکمه بزرگ ۵۲px
const sizes: Record<Size, string> = {
  md: 'min-h-11 px-5 text-label-md',
  lg: 'min-h-13 px-6 text-label-lg',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-disabled ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
