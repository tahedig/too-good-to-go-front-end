import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, Clock3 } from 'lucide-react'
import { jalaaliMonthLength, toGregorian, toJalaali } from 'jalaali-js'
import { toPersianDigits } from '@/lib/digits'

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

function formatDate(value: string) {
  if (!value) return 'انتخاب تاریخ'
  const [gy, gm, gd] = value.split('-').map(Number)
  const { jy, jm, jd } = toJalaali(gy, gm, gd)
  return `${toPersianDigits(jd)} ${MONTHS[jm - 1]} ${toPersianDigits(jy)}`
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

export function VendorDatePicker({ id, value, onChange, error, label }: PickerProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const ref = useDismiss(open, close)
  const popupId = useId()
  const base = value || todayIso()
  const [gy, gm, gd] = base.split('-').map(Number)
  const selected = toJalaali(gy, gm, gd)
  const firstGregorian = toGregorian(selected.jy, selected.jm, 1)
  const firstWeekday =
    (new Date(firstGregorian.gy, firstGregorian.gm - 1, firstGregorian.gd).getDay() + 1) % 7
  const days = jalaaliMonthLength(selected.jy, selected.jm)
  const min = todayIso()

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
        <span className="flex-1 text-start">{formatDate(value)}</span>
        <ChevronDown
          className={`size-5 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={1.75}
        />
      </button>
      {open && (
        <div
          id={popupId}
          role="dialog"
          aria-label="انتخاب تاریخ تحویل"
          className="absolute start-0 top-[54px] z-40 w-full min-w-[294px] rounded-md border border-[#D1D6CC] bg-surface p-3 shadow-3 sm:w-[318px]"
        >
          <p className="mb-3 text-body-lg font-semibold">
            {MONTHS[selected.jm - 1]} {toPersianDigits(selected.jy)}
          </p>
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
              <span key={`empty-${index}`} />
            ))}
            {Array.from({ length: days }, (_, index) => {
              const day = index + 1
              const gregorian = toGregorian(selected.jy, selected.jm, day)
              const date = isoDate(gregorian.gy, gregorian.gm, gregorian.gd)
              const active = date === value
              const disabled = date < min
              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  aria-pressed={active}
                  onClick={() => {
                    onChange(date)
                    setOpen(false)
                  }}
                  className={`grid h-[38px] place-items-center rounded-[8px] text-label-md font-semibold transition-colors ${active ? 'bg-surface-sage' : 'hover:bg-surface-secondary'} disabled:text-text-disabled disabled:hover:bg-transparent`}
                >
                  {toPersianDigits(day)}
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-caption font-semibold">انتخاب تاریخ تحویل</p>
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
