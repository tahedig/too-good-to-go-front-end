import { forwardRef } from 'react';
import type { ChangeEvent } from 'react';
import { Input } from './Input';
import type { InputProps } from './Input';
import { toEnglishDigits, toPersianDigits } from '../../lib/digits';

export type PhoneInputProps = Omit<InputProps, 'type' | 'inputMode' | 'ltrValue'>;

function normalizePhone(raw: string, maxLength: number): string {
  const english = toEnglishDigits(raw);
  const international = /^(\+|00)98/.test(english);
  let digits = english.replace(/\D/g, '');
  if (international) digits = '0' + digits.replace(/^(0098|98)/, '');
  return digits.slice(0, maxLength);
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  { placeholder = '۰۹۱۲۳۴۵۶۷۸۹', maxLength = 11, value, defaultValue, onChange, ...rest },
  ref,
) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    e.target.value = toPersianDigits(normalizePhone(e.target.value, maxLength));
    onChange?.(e);
  }

  return (
    <Input
      ref={ref}
      type="tel"
      inputMode="numeric"
      autoComplete="tel-national"
      placeholder={placeholder}
      maxLength={maxLength}
      value={value === undefined ? undefined : toPersianDigits(String(value))}
      defaultValue={defaultValue === undefined ? undefined : toPersianDigits(String(defaultValue))}
      onChange={handleChange}
      {...rest}
    />
  );
});
