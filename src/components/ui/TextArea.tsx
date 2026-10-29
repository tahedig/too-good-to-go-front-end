import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { FormField, fieldClasses, useFieldMeta } from './FormField';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helperText?: string;
  error?: string;
  success?: string;
  className?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, helperText, error, success, required = false, disabled = false, rows = 3, id, className, ...rest },
  ref,
) {
  const meta = useFieldMeta({ id, disabled, error, success, helperText });

  return (
    <FormField meta={meta} label={label} required={required} disabled={disabled} className={className}>
      <div className={fieldClasses(meta.status, 'flex w-full rounded-md p-4')}>
        <textarea
          ref={ref}
          id={meta.id}
          rows={rows}
          required={required}
          disabled={disabled}
          aria-invalid={meta.status === 'error' || undefined}
          aria-describedby={meta.messageId}
          className={
            'min-h-20 w-full flex-1 resize-y bg-transparent text-start text-body-lg text-text-primary ' +
            'placeholder:text-text-secondary focus-visible:outline-none ' +
            'disabled:cursor-not-allowed disabled:resize-none disabled:text-text-disabled disabled:placeholder:text-text-disabled'
          }
          {...rest}
        />
      </div>
    </FormField>
  );
});
