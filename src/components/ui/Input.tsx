import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { FormField, fieldClasses, useFieldMeta } from './FormField';
import { EyeIcon, EyeOffIcon } from './icons';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
  success?: string;
  startIcon?: ReactNode;
  endAdornment?: ReactNode;
  ltrValue?: boolean;
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    error,
    success,
    startIcon,
    endAdornment,
    ltrValue,
    showPasswordLabel = 'نمایش رمز عبور',
    hidePasswordLabel = 'پنهان کردن رمز عبور',
    type = 'text',
    required = false,
    disabled = false,
    id,
    className,
    ...rest
  },
  ref,
) {
  const meta = useFieldMeta({ id, disabled, error, success, helperText });
  const [passwordVisible, setPasswordVisible] = useState(false);

  const isPassword = type === 'password';
  const inputType = isPassword && passwordVisible ? 'text' : type;
  const isLtr = ltrValue ?? (isPassword || type === 'email' || type === 'url');

  const passwordToggle = isPassword && (
    <button
      type="button"
      onClick={() => setPasswordVisible((v) => !v)}
      disabled={disabled}
      className="flex min-h-11 items-center gap-2 self-start rounded-md text-label-md text-text-primary disabled:cursor-not-allowed disabled:text-text-disabled"
    >
      {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
      {passwordVisible ? hidePasswordLabel : showPasswordLabel}
    </button>
  );

  return (
    <FormField
      meta={meta}
      label={label}
      required={required}
      disabled={disabled}
      afterField={passwordToggle}
      className={className}
    >
      <div className={fieldClasses(meta.status, 'flex h-12 w-full items-center gap-2 rounded-md px-4')}>
        {startIcon && (
          <span className={['size-6 shrink-0', disabled ? 'text-text-disabled' : 'text-primary'].join(' ')} aria-hidden="true">
            {startIcon}
          </span>
        )}

        <input
          ref={ref}
          id={meta.id}
          type={inputType}
          required={required}
          disabled={disabled}
          aria-invalid={meta.status === 'error' || undefined}
          aria-describedby={meta.messageId}
          className={
            'h-full min-w-0 flex-1 bg-transparent text-start text-body-lg text-text-primary ' +
            'placeholder:text-text-secondary focus-visible:outline-none ' +
            'disabled:cursor-not-allowed disabled:text-text-disabled disabled:placeholder:text-text-disabled ' +
            (isLtr ? '[&:not(:placeholder-shown)]:[direction:ltr]' : '')
          }
          {...rest}
        />

        {endAdornment}
      </div>
    </FormField>
  );
});
