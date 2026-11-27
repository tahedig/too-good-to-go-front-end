import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck } from 'lucide-react'
import type { FieldMeta } from './formFieldUtils'

export type { FieldMeta, FieldStatus } from './formFieldUtils'

interface FormFieldProps {
  meta: FieldMeta
  label: string
  labelClassName?: string
  required?: boolean
  disabled?: boolean
  afterField?: ReactNode
  className?: string
  children: ReactNode
}

export function FormField({
  meta,
  label,
  labelClassName,
  required,
  disabled,
  afterField,
  className,
  children,
}: FormFieldProps) {
  const { id, status, message, messageId } = meta

  const messageColor =
    status === 'error'
      ? 'text-error'
      : status === 'success'
        ? 'text-success'
        : status === 'disabled'
          ? 'text-text-disabled'
          : 'text-text-secondary'

  return (
    <div className={['flex w-full flex-col gap-2', className].filter(Boolean).join(' ')}>
      <label
        htmlFor={id}
        className={[
          'text-label-md',
          disabled ? 'text-text-disabled' : 'text-text-primary',
          labelClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
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
  )
}
