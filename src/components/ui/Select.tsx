import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ComponentPropsWithRef, KeyboardEvent, RefObject } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Button } from './Button'
import { FormField } from './FormField'
import { fieldClasses, useFieldMeta } from './formFieldUtils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SharedSelectProps {
  label: string
  options: readonly SelectOption[]
  id?: string
  disabled?: boolean
  required?: boolean
  placeholder?: string
  helperText?: string
  error?: string
  success?: string
  className?: string
}

export interface SelectProps
  extends
    SharedSelectProps,
    Omit<ComponentPropsWithRef<'select'>, keyof SharedSelectProps | 'children'> {
  variant?: 'default'
  onValueChange?: never
}

interface SelectFilterProps extends SharedSelectProps {
  variant: 'filter'
  value: string
  defaultValue?: never
  onValueChange: (value: string) => void
}

const MAX_POPUP_HEIGHT = 256

// The filter variant uses an in-page list so its states don't depend on OS select colors.
function useSelectList(
  options: readonly SelectOption[],
  value: SelectProps['value'],
  blocked: boolean,
  {
    field,
    trigger,
    popup,
  }: {
    field: RefObject<HTMLDivElement | null>
    trigger: RefObject<HTMLButtonElement | null>
    popup: RefObject<HTMLUListElement | null>
  },
  onValueChange?: SelectFilterProps['onValueChange'],
) {
  const first = options.findIndex((option) => !option.disabled)
  const selected = options.findIndex((option) => option.value === value)
  const [active, setActive] = useState<number | null>(null)
  const [placement, setPlacement] = useState({ above: false, maxHeight: MAX_POPUP_HEIGHT })
  const open = active !== null && !blocked && Boolean(onValueChange)
  const search = useRef({ text: '', time: 0 })

  function close() {
    setActive(null)
    search.current = { text: '', time: 0 }
  }

  function show(index = selected >= 0 && !options[selected].disabled ? selected : first) {
    const bounds = trigger.current?.getBoundingClientRect()
    if (bounds) {
      const below = window.innerHeight - bounds.bottom - 8
      const spaceAbove = bounds.top - 8
      const needed = Math.min(MAX_POPUP_HEIGHT, options.length * 44 + 10)
      const above = below < needed && spaceAbove > below
      setPlacement({
        above,
        maxHeight: Math.max(44, Math.min(MAX_POPUP_HEIGHT, above ? spaceAbove : below)),
      })
    }
    setActive(index)
  }

  function choose(index: number) {
    const option = options[index]
    if (blocked || !option || option.disabled) return
    close()
    trigger.current?.focus({ preventScroll: true })
    onValueChange?.(option.value)
  }

  useEffect(() => {
    if (!open) return
    function dismiss(event: PointerEvent) {
      if (!field.current?.contains(event.target as Node)) close()
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open, field])

  useLayoutEffect(() => {
    // Keep keyboard navigation within the list without shifting the page.
    const list = popup.current
    const item = list?.children[active ?? -1] as HTMLElement | undefined
    if (!list || !item) return
    const bottom = item.offsetTop + item.offsetHeight
    if (item.offsetTop < list.scrollTop) list.scrollTo({ top: item.offsetTop })
    else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: bottom - list.clientHeight })
    }
  }, [active, open, popup])

  function handleKey(event: KeyboardEvent<HTMLButtonElement>) {
    const { key } = event
    if (key === 'Tab') {
      close()
    } else if (open && key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      close()
    } else if (active !== null && open && (key === 'Enter' || key === ' ')) {
      event.preventDefault()
      choose(active)
    } else if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault()
      if (active === null || !open) {
        show()
        return
      }
      const step = key === 'ArrowDown' ? 1 : -1
      for (let index = active + step; index >= 0 && index < options.length; index += step) {
        if (!options[index].disabled) {
          setActive(index)
          break
        }
      }
    } else if (key === 'Home' || key === 'End') {
      event.preventDefault()
      const index = key === 'Home' ? first : options.findLastIndex((option) => !option.disabled)
      if (open) setActive(index)
      else show(index)
    } else if (
      key.length === 1 &&
      key !== ' ' &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const previous = event.timeStamp - search.current.time < 650 ? search.current.text : ''
      const letter = key.toLocaleLowerCase()
      let text = previous === letter ? letter : previous + letter
      const start = text.length > 1 ? (active ?? selected) : (active ?? selected) + 1
      const find = (prefix: string) => {
        for (let offset = 0; offset < options.length; offset += 1) {
          const index = (Math.max(0, start) + offset) % options.length
          const option = options[index]
          if (!option.disabled && option.label.toLocaleLowerCase().startsWith(prefix)) return index
        }
        return -1
      }
      let index = find(text)
      if (index < 0 && text !== letter) {
        text = letter
        index = find(text)
      }
      if (index >= 0) {
        event.preventDefault()
        search.current = { text, time: event.timeStamp }
        if (open) setActive(index)
        else show(index)
      }
    }
  }

  return {
    active,
    selected,
    open,
    field,
    trigger,
    popup,
    placement,
    close,
    show,
    choose,
    handleKey,
  }
}

export function Select({
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
  variant,
  onValueChange,
  ...rest
}: SelectProps | SelectFilterProps) {
  const filter = variant === 'filter'
  const blocked = disabled || (filter && !options.some((option) => !option.disabled))
  const meta = useFieldMeta({ id, disabled: blocked, error, success, helperText })
  const field = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLUListElement>(null)
  const list = useSelectList(options, value, blocked, { field, trigger, popup }, onValueChange)
  const popupId = `${meta.id}-options`
  const initial =
    value === undefined && defaultValue === undefined && placeholder ? '' : defaultValue

  return (
    <FormField
      meta={meta}
      label={label}
      labelClassName={filter ? 'font-normal' : undefined}
      required={required}
      disabled={blocked}
      className={className}
    >
      <div
        ref={filter ? field : undefined}
        className={fieldClasses(
          meta.status,
          `relative w-full rounded-md ${filter ? 'h-14' : 'h-13'}`,
          filter,
        )}
      >
        {filter ? (
          <>
            <Button
              ref={trigger}
              id={meta.id}
              variant="tertiary"
              size="sm"
              fullWidth
              disabled={blocked}
              role="combobox"
              aria-label={label}
              aria-expanded={list.open}
              aria-haspopup="listbox"
              aria-controls={list.open ? popupId : undefined}
              aria-activedescendant={list.open ? `${popupId}-${list.active}` : undefined}
              aria-invalid={meta.status === 'error' || undefined}
              aria-describedby={meta.messageId}
              aria-required={required || undefined}
              className="h-full! justify-start! text-start font-normal! text-text-secondary! hover:bg-transparent! active:bg-transparent! focus-visible:outline-none! disabled:text-text-disabled!"
              onClick={(event) => {
                event.currentTarget.focus({ preventScroll: true })
                if (list.open) list.close()
                else list.show()
              }}
              onBlur={list.close}
              onKeyDown={list.handleKey}
            >
              <ChevronDown
                className={`size-6 shrink-0 ${list.open ? 'rotate-180' : ''} ${blocked ? 'text-text-disabled' : 'text-primary'}`}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate">
                {options[list.selected]?.label ?? placeholder}
              </span>
            </Button>
            {list.open && (
              <ul
                ref={popup}
                id={popupId}
                role="listbox"
                aria-label={label}
                className={`absolute inset-x-0 z-40 overflow-y-auto overscroll-contain rounded-md border border-border-default bg-surface p-1 text-text-primary shadow-2 ${list.placement.above ? 'bottom-full mb-2' : 'top-full mt-2'}`}
                style={{ maxHeight: list.placement.maxHeight }}
                onMouseDown={(event) => event.preventDefault()}
              >
                {options.map((option, index) => {
                  const isSelected = index === list.selected
                  const rowStyle = isSelected
                    ? 'bg-primary-subtle! text-text-on-accent! hover:bg-primary-subtle! active:bg-primary-subtle!'
                    : 'bg-surface! enabled:hover:bg-surface-secondary! enabled:active:bg-surface-secondary!'
                  return (
                    <li key={option.value} role="presentation">
                      <Button
                        id={`${popupId}-${index}`}
                        variant="tertiary"
                        size="sm"
                        fullWidth
                        role="option"
                        tabIndex={-1}
                        aria-selected={isSelected}
                        disabled={option.disabled}
                        className={`h-auto! min-h-11 justify-between! rounded-sm! px-3! py-1.5 text-start whitespace-normal! ${rowStyle} ${isSelected ? 'font-semibold!' : 'font-normal!'} ${index === list.active && !isSelected ? 'ring-1 ring-inset ring-focus' : ''}`}
                        onClick={() => list.choose(index)}
                      >
                        {option.label}
                        {isSelected && (
                          <Check
                            className="size-5 shrink-0"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                        )}
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        ) : (
          <>
            <select
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
              {options.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown
              strokeWidth={1.75}
              aria-hidden="true"
              className={`pointer-events-none absolute end-4 top-1/2 size-6 -translate-y-1/2 ${disabled ? 'text-text-disabled' : 'text-primary'}`}
            />
          </>
        )}
      </div>
    </FormField>
  )
}
