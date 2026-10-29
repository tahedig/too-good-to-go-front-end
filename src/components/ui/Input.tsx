import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
  success?: string;
  startIcon?: ReactNode;
  endAdornment?: ReactNode;
  className?: string;
}

function AlertIcon() {
  return (
    <svg
      className="size-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="size-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

type FieldStatus = 'default' | 'error' | 'success' | 'disabled';

const fieldStyles: Record<FieldStatus, string> = {
  default:
    'border-border-input bg-surface ' +
    'hover:not-focus-within:border-primary hover:not-focus-within:shadow-[inset_0_0_0_0.5px_var(--color-primary)]',
  error: 'border-error bg-surface shadow-[inset_0_0_0_0.5px_var(--color-error)]',
  success: 'border-success bg-surface shadow-[inset_0_0_0_0.5px_var(--color-success)]',
  disabled: 'border-border-default bg-surface-secondary',
};

const focusStyles =
  'focus-within:border-focus focus-within:shadow-[inset_0_0_0_2px_var(--color-focus)]';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    error,
    success,
    startIcon,
    endAdornment,
    required = false,
    disabled = false,
    id,
    className,
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  const status: FieldStatus = disabled ? 'disabled' : error ? 'error' : success ? 'success' : 'default';

  // غیرفعال بودن همه چیز را خنثی می‌کند؛ بعد خطا، بعد موفقیت، بعد راهنما
  const message = disabled ? helperText : (error ?? success ?? helperText);
  const messageColor =
    status === 'error'
      ? 'text-error'
      : status === 'success'
        ? 'text-success'
        : status === 'disabled'
          ? 'text-text-disabled'
          : 'text-text-secondary';

  const fieldClasses = [
    'flex h-12 w-full items-center gap-2 rounded-md border px-4 transition-colors duration-150',
    fieldStyles[status],
    !disabled && focusStyles,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={['flex w-full flex-col gap-2', className].filter(Boolean).join(' ')}>
      <label
        htmlFor={inputId}
        className={['text-label-md', disabled ? 'text-text-disabled' : 'text-text-primary'].join(' ')}
      >
        {label}
        {required && (
          <span className="ms-1 text-error" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className={fieldClasses}>
        {startIcon && (
          <span
            className={['size-6 shrink-0', disabled ? 'text-text-disabled' : 'text-primary'].join(' ')}
            aria-hidden="true"
          >
            {startIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          required={required}
          disabled={disabled}
          aria-invalid={status === 'error' || undefined}
          aria-describedby={message ? messageId : undefined}
          className={
            'h-full min-w-0 flex-1 bg-transparent text-start text-body-lg text-text-primary ' +
            'placeholder:text-text-secondary focus-visible:outline-none ' +
            'disabled:cursor-not-allowed disabled:text-text-disabled disabled:placeholder:text-text-disabled'
          }
          {...rest}
        />

        {endAdornment}
      </div>

      {message && (
        <p
          id={messageId}
          role={status === 'error' ? 'alert' : undefined}
          className={['flex items-center gap-1 text-caption', messageColor].join(' ')}
        >
          {status === 'error' && <AlertIcon />}
          {status === 'success' && <CheckIcon />}
          <span>{message}</span>
        </p>
      )}
    </div>
  );
});