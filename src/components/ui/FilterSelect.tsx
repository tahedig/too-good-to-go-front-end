import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { FormField } from './FormField'
import { fieldClasses, useFieldMeta } from './formFieldUtils'
import type { SelectOption } from './Select'

const MAX_POPUP_HEIGHT = 256

interface FilterSelectProps {
  label: string
  value: string
  options: readonly SelectOption[]
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

// Unlike an OS-native select popup, this list can use the page's colors on phones and desktops.
export function FilterSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  className,
}: FilterSelectProps) {
  const first = options.findIndex((option) => !option.disabled)
  const blocked = disabled || first < 0
  const meta = useFieldMeta({ disabled: blocked })
  const popupId = `${meta.id}-options`
  const selected = options.findIndex((option) => option.value === value)
  const [active, setActive] = useState<number | null>(null)
  const [placement, setPlacement] = useState({ above: false, maxHeight: MAX_POPUP_HEIGHT })
  const open = active !== null && !blocked
  const field = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const popup = useRef<HTMLUListElement>(null)
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
    if (!option || option.disabled) return
    close()
    trigger.current?.focus({ preventScroll: true })
    onChange(option.value)
  }

  useEffect(() => {
    if (!open) return
    function dismiss(event: PointerEvent) {
      if (!field.current?.contains(event.target as Node)) close()
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])

  useLayoutEffect(() => {
    // Scroll the options, not the page, when the active item is below the fold.
    const list = popup.current
    const item = list?.children[active ?? -1] as HTMLElement | undefined
    if (!list || !item) return
    if (item.offsetTop < list.scrollTop) list.scrollTop = item.offsetTop
    const bottom = item.offsetTop + item.offsetHeight
    if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight
  }, [active, open])

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

  return (
    <FormField
      meta={meta}
      label={label}
      labelClassName="font-normal"
      disabled={blocked}
      className={className}
    >
      <div
        ref={field}
        className={fieldClasses(meta.status, 'relative h-14 w-full rounded-md', true)}
      >
        <button
          ref={trigger}
          id={meta.id}
          type="button"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? popupId : undefined}
          aria-activedescendant={open ? `${popupId}-${active}` : undefined}
          disabled={blocked}
          className="flex h-full w-full items-center gap-2 rounded-md px-4 text-start text-body-md text-text-secondary focus-visible:outline-none disabled:text-text-disabled"
          onClick={(event) => {
            event.currentTarget.focus({ preventScroll: true })
            if (open) close()
            else show()
          }}
          onBlur={close}
          onKeyDown={handleKey}
        >
          <ChevronDown
            className={`size-6 shrink-0 ${open ? 'rotate-180' : ''} ${blocked ? 'text-text-disabled' : 'text-primary'}`}
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1 truncate">{options[selected]?.label}</span>
        </button>
        {open && (
          <ul
            ref={popup}
            id={popupId}
            role="listbox"
            aria-label={label}
            className={`absolute inset-x-0 z-40 overflow-y-auto overscroll-contain rounded-md border border-border-default bg-primary-subtle p-1 text-text-on-accent shadow-2 ${placement.above ? 'bottom-full mb-2' : 'top-full mt-2'}`}
            style={{ maxHeight: placement.maxHeight }}
            onMouseDown={(event) => event.preventDefault()}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                id={`${popupId}-${index}`}
                role="option"
                aria-disabled={option.disabled || undefined}
                aria-selected={index === selected}
                className={`flex min-h-11 items-center justify-between gap-2 rounded-sm px-3 py-1.5 text-body-md ${option.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-surface-sage'} ${index === selected ? 'bg-surface-sage font-semibold' : ''} ${index === active ? 'bg-surface-sage ring-1 ring-inset ring-text-on-accent/40' : ''}`}
                onClick={() => choose(index)}
              >
                {option.label}
                {index === selected && (
                  <Check className="size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </FormField>
  )
}
