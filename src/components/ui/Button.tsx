import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** نوع دکمه. پیش‌فرض: primary */
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const baseStyles =
  'inline-flex items-center justify-center gap-2 shrink-0 rounded-md whitespace-nowrap select-none ' +
  'transition-colors duration-150 disabled:cursor-not-allowed ' +
  'focus-visible:outline-3 focus-visible:outline-focus focus-visible:-outline-offset-3';

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-label-md',
  md: 'h-12 px-5 text-label-md',
  lg: 'h-13 px-6 text-label-lg',
};

type ButtonState = 'idle' | 'loading' | 'disabled';

const variantStyles: Record<ButtonVariant, Record<ButtonState, string>> = {
  primary: {
    idle: 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-pressed',
    loading: 'bg-primary text-on-primary',
    disabled: 'bg-surface-secondary text-text-disabled',
  },
  secondary: {
    idle: 'border-[1.5px] border-primary bg-surface text-primary hover:bg-primary-subtle active:bg-surface-sage',
    loading: 'border-[1.5px] border-primary bg-surface text-primary',
    disabled: 'border-[1.5px] border-border-default bg-surface text-text-disabled',
  },
  tertiary: {
    idle: 'bg-transparent text-primary hover:bg-primary-subtle active:bg-surface-sage',
    loading: 'bg-transparent text-primary',
    disabled: 'bg-transparent text-text-disabled',
  },
  destructive: {
    idle: 'bg-error text-on-primary hover:bg-error-hover active:bg-error-pressed',
    loading: 'bg-error text-on-primary',
    disabled: 'bg-surface-secondary text-text-disabled',
  },
};

function Spinner() {
  return (
    <svg
      className="size-6 shrink-0 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'lg',
    isLoading = false,
    icon,
    fullWidth = false,
    disabled = false,
    type = 'button',
    className,
    children,
    ...rest
  },
  ref,
) {
  const isBlocked = disabled || isLoading;
  const state: ButtonState = disabled ? 'disabled' : isLoading ? 'loading' : 'idle';

  const classes = [
    baseStyles,
    sizeStyles[size],
    variantStyles[variant][state],
    fullWidth && 'w-full',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      disabled={isBlocked}
      aria-busy={isLoading || undefined}
      className={classes}
      {...rest}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        icon && (
          <span className="size-6 shrink-0" aria-hidden="true">
            {icon}
          </span>
        )
      )}
      {children}
    </button>
  );
});