import { useId } from 'react'

export type FieldStatus = 'default' | 'error' | 'success' | 'disabled'

const statusStyles: Record<FieldStatus, string> = {
  default:
    'bg-surface ' +
    'hover:not-focus-within:border-primary hover:not-focus-within:shadow-[inset_0_0_0_0.5px_var(--color-primary)]',
  error: 'border-error bg-surface shadow-[inset_0_0_0_0.5px_var(--color-error)]',
  success: 'border-success bg-surface shadow-[inset_0_0_0_0.5px_var(--color-success)]',
  disabled: 'border-border-default bg-surface-secondary',
}

const focusStyles =
  'focus-within:border-focus focus-within:shadow-[inset_0_0_0_2px_var(--color-focus)]'

export function fieldClasses(status: FieldStatus, extra = '', subtle = false): string {
  return [
    'border transition-colors duration-150',
    statusStyles[status],
    status === 'default' && (subtle ? 'border-border-default' : 'border-border-input'),
    status !== 'disabled' && focusStyles,
    extra,
  ]
    .filter(Boolean)
    .join(' ')
}

interface FieldMetaOptions {
  id?: string
  disabled?: boolean
  error?: string
  success?: string
  helperText?: string
}

export function useFieldMeta({ id, disabled, error, success, helperText }: FieldMetaOptions) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const status: FieldStatus = disabled
    ? 'disabled'
    : error
      ? 'error'
      : success
        ? 'success'
        : 'default'
  const message = disabled ? helperText : (error ?? success ?? helperText)
  return { id: fieldId, status, message, messageId: message ? `${fieldId}-message` : undefined }
}

export type FieldMeta = ReturnType<typeof useFieldMeta>
