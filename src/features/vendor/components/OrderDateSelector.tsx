import React, { useId } from 'react'
import { VendorDatePicker } from '@/components/vendor/VendorDateTimePicker'
import { localDate } from '@/lib/vendorDates'

interface OrderDateSelectorProps {
  id?: string
  selectedDate: string
  onDateChange: (date: string) => void
  label?: string
  allowClear?: boolean
}

export const OrderDateSelector: React.FC<OrderDateSelectorProps> = ({
  id: providedId,
  selectedDate,
  onDateChange,
  label = 'تاریخ تحویل',
  allowClear = false,
}) => {
  const generatedId = useId()
  const inputId = providedId ?? generatedId

  return (
    <div className="w-full sm:w-64">
      <div className="mb-1 flex items-center justify-between gap-2">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">
            {label}
          </label>
        )}
        {allowClear && selectedDate && (
          <button
            type="button"
            onClick={() => onDateChange('')}
            className="text-xs font-medium text-primary hover:underline"
          >
            همه تاریخ‌ها
          </button>
        )}
      </div>
      <VendorDatePicker
        id={inputId}
        label={label}
        value={selectedDate}
        onChange={onDateChange}
        referenceDate={localDate()}
        allowPast
      />
    </div>
  )
}
