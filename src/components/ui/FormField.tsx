import { useId } from 'react';
import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';

export type FieldStatus = 'default' | 'error' | 'success' | 'disabled';

const statusStyles: Record<FieldStatus, string> = {
  default:
    'border-border-input bg-surface ' +
    'hover:not-focus-within:border-primary hover:not-focus-within:shadow-[inset_0_0_0_0.5px_var(--color-primary)]',
  error: 'border-error bg-surface shadow-[inset_0_0_0_0.5px_var(--color-error)]',
  success: 'border-success bg-surface shadow-[inset_0_0_0_0.5px_var(--color-success)]',
  disabled: 'border-border-default bg-surface-secondary',
};

const focusStyles =
  'focus-within:border-focus focus-within:shadow-[inset_0_0_0_2px_var(--color-focus)]';

export function fieldClasses(status: FieldStatus, extra = ''): string {
  return [
    'border transition-colors duration-150',
    statusStyles[status],
    status !== 'disabled' && focusStyles,
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

interface FieldMetaOptions {
  id?: string;
  disabled?: boolean;
  error?: string;
  success?: string;
  helperText?: string;
}

export function useFieldMeta({ id, disabled, error, success, helperText }: FieldMetaOptions) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const status: FieldStatus = disabled ? 'disabled' : error ? 'error' : success ? 'success' : 'default';
  const message = disabled ? helperText : (error ?? success ?? helperText);
  return { id: fieldId, status, message, messageId: message ? `${fieldId}-message` : undefined };
}

export type FieldMeta = ReturnType<typeof useFieldMeta>;

interface FormFieldProps {
  meta: FieldMeta;
  label: string;
  required?: boolean;
  disabled?: boolean;
  afterField?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function FormField({ meta, label, required, disabled, afterField, className, children }: FormFieldProps) {
  const { id, status, message, messageId } = meta;

  const messageColor =
    status === 'error'
      ? 'text-error'
      : status === 'success'
        ? 'text-success'
        : status === 'disabled'
          ? 'text-text-disabled'
          : 'text-text-secondary';

  return (
    <div className={['flex w-full flex-col gap-2', className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={['text-label-md', disabled ? 'text-text-disabled' : 'text-text-primary'].join(' ')}>
        {label}
        {required && (
          <span className="ms-1 text-error" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}
      {afterField}

      {message && (
        <p
          id={messageId}
          role={status === 'error' ? 'alert' : undefined}
          className={['flex items-center gap-1 text-caption', messageColor].join(' ')}
        >
          {status === 'error' && <CircleAlert className="size-4 shrink-0" strokeWidth={1.75} />}
          {status === 'success' && <CircleCheck className="size-4 shrink-0" strokeWidth={1.75} />}
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}
