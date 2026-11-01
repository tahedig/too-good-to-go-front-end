import { forwardRef, useRef, useState } from 'react';
import type { ChangeEvent, InputHTMLAttributes, KeyboardEvent } from 'react';
import { fieldClasses } from './FormField';
import { CloseIcon, SearchIcon } from './icons';

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  clearLabel?: string;
  onClear?: () => void;
  className?: string;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  {
    label = 'جستجو',
    clearLabel = 'پاک کردن جستجو',
    onClear,
    disabled = false,
    value,
    defaultValue,
    onChange,
    onKeyDown,
    className,
    ...rest
  },
  ref,
) {
  const innerRef = useRef<HTMLInputElement | null>(null);
  const [typed, setTyped] = useState(() => String(defaultValue ?? '').length > 0);
  const hasValue = value !== undefined ? String(value).length > 0 : typed;

  function setRefs(node: HTMLInputElement | null) {
    innerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setTyped(e.target.value.length > 0);
    onChange?.(e);
  }

  function clear() {
    const input = innerRef.current;
    if (!input) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    onClear?.();
    input.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape' && hasValue) {
      e.preventDefault();
      clear();
    }
    onKeyDown?.(e);
  }

  return (
    <div
      className={fieldClasses(
        disabled ? 'disabled' : 'default',
        ['flex h-13 w-full items-center gap-3 rounded-lg ps-4 pe-0.5', className].filter(Boolean).join(' '),
      )}
    >
      <SearchIcon className={['size-6 shrink-0', disabled ? 'text-text-disabled' : 'text-primary'].join(' ')} />

      <input
        ref={setRefs}
        type="search"
        enterKeyHint="search"
        aria-label={label}
        disabled={disabled}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={
          'h-full min-w-0 flex-1 bg-transparent text-start text-body-lg text-text-primary ' +
          'placeholder:text-text-secondary focus-visible:outline-none ' +
          '[&::-webkit-search-cancel-button]:hidden ' +
          'disabled:cursor-not-allowed disabled:text-text-disabled disabled:placeholder:text-text-disabled'
        }
        {...rest}
      />

      {hasValue && !disabled && (
        <button
          type="button"
          onClick={clear}
          aria-label={clearLabel}
          className="grid size-11 shrink-0 place-items-center rounded-full text-text-secondary transition-colors hover:text-primary"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
});
