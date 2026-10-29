import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, disabled = false, className, ...rest },
  ref,
) {
  return (
    <label
      className={[
        'flex min-h-11 items-center gap-3',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <input ref={ref} type="radio" disabled={disabled} className="peer sr-only" {...rest} />

      <span
        aria-hidden="true"
        className={
          'grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] border-border-input bg-surface transition-colors ' +
          'after:size-2.5 after:scale-0 after:rounded-full after:bg-on-primary after:transition-transform ' +
          'peer-checked:bg-primary peer-checked:after:scale-100 ' +
          'peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus ' +
          'peer-disabled:opacity-50'
        }
      />

      <span className={['text-body-md', disabled ? 'text-text-disabled' : 'text-text-primary'].join(' ')}>{label}</span>
    </label>
  );
});
