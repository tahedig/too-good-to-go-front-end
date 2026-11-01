import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { FormField, fieldClasses, useFieldMeta } from './FormField';
import { ChevronDownIcon } from './icons';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  helperText?: string;
  error?: string;
  success?: string;
  className?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
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
  const meta = useFieldMeta({ id, disabled, error, success, helperText });

  const initial = value === undefined && defaultValue === undefined && placeholder ? '' : defaultValue;

  return (
    <FormField meta={meta} label={label} required={required} disabled={disabled} className={className}>
      <div className={fieldClasses(meta.status, 'relative h-13 w-full rounded-md')}>
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
            'h-full w-full appearance-none bg-transparent ps-4 pe-12 text-start text-body-lg text-text-primary ' +
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

        <ChevronDownIcon
          className={[
            'pointer-events-none absolute end-4 top-1/2 size-6 -translate-y-1/2',
            disabled ? 'text-text-disabled' : 'text-primary',
          ].join(' ')}
        />
      </div>
    </FormField>
  );
});
