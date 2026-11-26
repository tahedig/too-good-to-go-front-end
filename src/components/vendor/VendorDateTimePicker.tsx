import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'
import {
  jalaaliMonthLength,
  MAX_JALAALI_YEAR,
  MIN_JALAALI_YEAR,
  toGregorian,
  toJalaali,
} from 'jalaali-js'
import { toPersianDigits } from '@/lib/digits'
import { formatJalaliDate, isValidDate } from '@/lib/vendorDates'

const MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
]
const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
const TIME_OPTIONS = Array.from({ length: 31 }, (_, index) => {
  const minutes = 8 * 60 + index * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
})

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function todayIso() {
  const now = new Date()
  return isoDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

function parseJalaaliDate(iso: string) {
  if (!isValidDate(iso)) return null
  const [gy, gm, gd] = iso.split('-').map(Number)
  try {
    return toJalaali(gy, gm, gd)
  } catch {
    // The ISO format accepts years outside the range supported by jalaali-js.
    return null
  }
}

type CalendarMonth = { jy: number; jm: number }

function shiftMonth({ jy, jm }: CalendarMonth, offset: -1 | 1): CalendarMonth {
  const month = jm + offset
  if (month === 0) return { jy: jy - 1, jm: 12 }
  if (month === 13) return { jy: jy + 1, jm: 1 }
  return { jy, jm: month }
}

function calendarDay({ jy, jm }: CalendarMonth, day: number) {
  const { gy, gm, gd } = toGregorian(jy, jm, day)
  return isoDate(gy, gm, gd)
}

function useDismiss(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const dismiss = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose()
    }
    const escape = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('mousedown', dismiss)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', dismiss)
      document.removeEventListener('keydown', escape)
    }
  }, [open, onClose])
  return ref
}

interface PickerProps {
  id: string
  value: string
  onChange: (value: string) => void
  error?: string
  label: string
}

interface DatePickerProps extends PickerProps {
  allowPast?: boolean
  referenceDate?: string
  inline?: boolean
}

export function VendorDatePicker({
  id,
  value,
  onChange,
  error,
  label,
  allowPast = false,
  referenceDate = todayIso(),
  inline = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState<CalendarMonth | null>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const ref = useDismiss(open, () => setOpen(false))
  const popupId = useId()
  const min = allowPast ? undefined : referenceDate
  const selected = parseJalaaliDate(value)
  const base =
    (!min || value >= min ? selected : null) ??
    parseJalaaliDate(referenceDate) ??
    toJalaali(new Date())
  const month = calendarMonth ?? base
  const { jy, jm } = month
  const monthLabel = `${MONTHS[jm - 1]} ${toPersianDigits(jy)}`
  const firstGregorian = toGregorian(jy, jm, 1)
  const firstWeekday =
    (new Date(Date.UTC(firstGregorian.gy, firstGregorian.gm - 1, firstGregorian.gd)).getUTCDay() +
      1) %
    7
  const days = jalaaliMonthLength(jy, jm)
  const previous = shiftMonth(month, -1)
  const next = shiftMonth(month, 1)
  const previousDisabled =
    previous.jy < MIN_JALAALI_YEAR ||
    (!!min && calendarDay(previous, jalaaliMonthLength(previous.jy, previous.jm)) < min)
  const caption = `انتخاب ${label}`
  const monthControl =
    'grid size-9 shrink-0 place-items-center rounded-sm hover:bg-surface-secondary disabled:text-text-disabled disabled:hover:bg-transparent'

  function closeAndFocus() {
    setOpen(false)
    trigger.current?.focus()
  }

  return (
    <div
      ref={ref}
      className="relative"
      onKeyDown={(event) => {
        if (!open || event.key !== 'Escape') return
        // Close the calendar before the surrounding dialog (if there is one).
        event.preventDefault()
        event.stopPropagation()
        closeAndFocus()
      }}
    >
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? popupId : undefined}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-value ${id}-error` : `${id}-value`}
        onClick={() => {
          if (!open) setCalendarMonth(null)
          setOpen(!open)
        }}
        className={`flex h-[46px] w-full items-center gap-3 rounded-md border bg-surface px-3 text-label-md font-semibold transition-colors hover:bg-surface-secondary ${error ? 'border-error' : 'border-[#D1D6CC]'}`}
      >
        <span id={`${id}-value`} className="min-w-0 flex-1 text-start">
          {isValidDate(value) ? formatJalaliDate(value) : 'انتخاب تاریخ'}
        </span>
        <ChevronDown
          className={`size-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          id={popupId}
          role="dialog"
          aria-label={caption}
          className={`mt-2 w-full rounded-md border border-[#D1D6CC] bg-surface p-3 ${inline ? '' : 'absolute start-0 top-full z-40 shadow-3 sm:w-80 sm:max-w-full'}`}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="ماه قبل"
              disabled={previousDisabled}
              onClick={() => setCalendarMonth(previous)}
              className={monthControl}
            >
              <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <p aria-live="polite" className="text-center text-body-lg font-semibold">
              {monthLabel}
            </p>
            <button
              type="button"
              aria-label="ماه بعد"
              disabled={next.jy > MAX_JALAALI_YEAR}
              onClick={() => setCalendarMonth(next)}
              className={monthControl}
            >
              <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-7" aria-hidden="true">
            {WEEKDAYS.map((day) => (
              <span
                key={day}
                className="grid h-[30px] place-items-center text-caption font-semibold"
              >
                {day}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: firstWeekday }, (_, index) => (
              <span key={`empty-${index}`} aria-hidden="true" />
            ))}
            {Array.from({ length: days }, (_, index) => {
              const day = index + 1
              const date = calendarDay(month, day)
              const active = date === value
              return (
                <button
                  key={day}
                  type="button"
                  disabled={!!min && date < min}
                  aria-label={`${toPersianDigits(day)} ${monthLabel}`}
                  aria-pressed={active}
                  aria-current={date === referenceDate ? 'date' : undefined}
                  onClick={() => {
                    onChange(date)
                    closeAndFocus()
                  }}
                  className={`grid h-[38px] place-items-center rounded-[8px] text-label-md font-semibold transition-colors ${active ? 'bg-surface-sage' : 'hover:bg-surface-secondary'} disabled:text-text-disabled disabled:hover:bg-transparent`}
                >
                  {toPersianDigits(day)}
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-caption font-semibold">{caption}</p>
        </div>
      )}
    </div>
  )
}

export function VendorTimePicker({ id, value, onChange, error, label }: PickerProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const ref = useDismiss(open, close)
  const popupId = useId()
  const options = useMemo(
    () => (value && !TIME_OPTIONS.includes(value) ? [...TIME_OPTIONS, value].sort() : TIME_OPTIONS),
    [value],
  )

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={popupId}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-[46px] w-full items-center gap-3 rounded-md border bg-surface px-3 text-label-md font-semibold transition-colors hover:bg-surface-secondary ${error ? 'border-error' : 'border-[#D1D6CC]'}`}
      >
        <span className="flex-1 text-start">{value ? toPersianDigits(value) : 'انتخاب ساعت'}</span>
        <Clock3 className="size-5" strokeWidth={1.75} />
        <ChevronDown
          className={`size-5 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={1.75}
        />
      </button>
      {open && (
        <div
          id={popupId}
          role="listbox"
          aria-label={label}
          className="absolute start-0 top-[54px] z-40 w-full min-w-[294px] rounded-md border border-[#D1D6CC] bg-surface p-3 shadow-3 sm:w-[318px]"
        >
          <p className="mb-3 text-body-lg font-semibold">انتخاب ساعت</p>
          <div className="max-h-[220px] overflow-y-auto pe-1">
            {options.map((time) => (
              <button
                key={time}
                type="button"
                role="option"
                aria-selected={time === value}
                onClick={() => {
                  onChange(time)
                  setOpen(false)
                }}
                className={`flex h-10 w-full items-center justify-center rounded-[8px] text-body-lg font-semibold transition-colors ${time === value ? 'bg-surface-sage' : 'hover:bg-surface-secondary'}`}
              >
                {toPersianDigits(time)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-caption font-semibold">ساعت و دقیقه · قالب ۲۴ ساعته</p>
        </div>
      )}
    </div>
  )
}
