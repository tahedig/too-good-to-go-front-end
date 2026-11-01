import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { toPersianDigits } from '../../lib/digits';

export interface QuantityStepperProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  label?: string;
  incrementLabel?: string;
  decrementLabel?: string;
  className?: string;
}

const buttonBase =
  'grid size-11 shrink-0 place-items-center rounded-md border border-border-default transition-colors disabled:cursor-not-allowed';
const buttonEnabled = 'bg-surface text-primary hover:bg-surface-secondary active:bg-surface-sage';
const buttonDisabled = 'disabled:bg-surface-secondary disabled:text-text-disabled';

export function QuantityStepper({
  value,
  defaultValue,
  min = 1,
  max = Number.POSITIVE_INFINITY,
  onChange,
  disabled = false,
  label = 'تعداد',
  incrementLabel = 'افزایش تعداد',
  decrementLabel = 'کاهش تعداد',
  className,
}: QuantityStepperProps) {
  const [inner, setInner] = useState(defaultValue ?? min);
  const current = value ?? inner;

  function update(next: number) {
    const clamped = Math.min(max, Math.max(min, next));
    if (value === undefined) setInner(clamped);
    onChange?.(clamped);
  }

  return (
    <div role="group" aria-label={label} className={['inline-flex items-center gap-2', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        aria-label={decrementLabel}
        disabled={disabled || current <= min}
        onClick={() => update(current - 1)}
        className={[buttonBase, buttonEnabled, buttonDisabled].join(' ')}
      >
        <Minus strokeWidth={1.75} />
      </button>

      <output
        aria-live="polite"
        className={['w-10 text-center text-label-lg tabular-nums', disabled ? 'text-text-disabled' : 'text-text-primary'].join(' ')}
      >
        {toPersianDigits(current)}
      </output>

      <button
        type="button"
        aria-label={incrementLabel}
        disabled={disabled || current >= max}
        onClick={() => update(current + 1)}
        className={[buttonBase, buttonEnabled, buttonDisabled].join(' ')}
      >
        <Plus strokeWidth={1.75} />
      </button>
    </div>
  );
}
