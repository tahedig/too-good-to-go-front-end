import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { FormField } from './FormField'
import { fieldClasses, useFieldMeta } from './formFieldUtils'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string
  variant?: 'default' | 'filter'
  options: SelectOption[]
  placeholder?: string
  helperText?: string
  error?: string
  success?: string
  className?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    variant = 'default',
    options,
    placeholder,
    helperText,
    error,
    success,
    required = false,
    disabled = false,
    id,
    className,
    value,
    defaultValue,
    ...rest
  },
  ref,
) {
  const isFilter = variant === 'filter'
  const meta = useFieldMeta({ id, disabled, error, success, helperText })

  const initial =
    value === undefined && defaultValue === undefined && placeholder ? '' : defaultValue

  return (
    <FormField
      meta={meta}
      label={label}
      labelClassName={isFilter ? 'font-normal' : undefined}
      required={required}
      disabled={disabled}
      className={className}
    >
      <div
        className={fieldClasses(
          meta.status,
          `relative w-full rounded-md ${isFilter ? 'h-14' : 'h-13'}`,
          isFilter,
        )}
      >
        <select
          ref={ref}
          id={meta.id}
          required={required}
          disabled={disabled}
          value={value}
          defaultValue={initial}
          aria-invalid={meta.status === 'error' || undefined}
          aria-describedby={meta.messageId}
          className={
            'h-full w-full appearance-none bg-transparent text-start ' +
            (isFilter
              ? 'ps-12 pe-4 text-label-md font-normal text-text-secondary '
              : 'ps-4 pe-12 text-body-lg text-text-primary ') +
            "focus-visible:outline-none has-[option[value='']:checked]:text-text-secondary " +
            'disabled:cursor-not-allowed disabled:text-text-disabled'
          }
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>

        <ChevronDown
          strokeWidth={1.75}
          aria-hidden="true"
          className={[
            'pointer-events-none absolute top-1/2 size-6 -translate-y-1/2',
            isFilter ? 'start-4' : 'end-4',
            disabled ? 'text-text-disabled' : 'text-primary',
          ].join(' ')}
        />
      </div>
    </FormField>
  )
})
