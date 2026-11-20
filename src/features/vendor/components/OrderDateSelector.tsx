import React from 'react'
import { ChevronDown, Calendar } from 'lucide-react'
import { DEMO_DATES } from '../utils/dateUtils'

interface OrderDateSelectorProps {
  selectedDate: string
  onDateChange: (date: string) => void
  label?: string
}

export const OrderDateSelector: React.FC<OrderDateSelectorProps> = ({
  selectedDate,
  onDateChange,
  label = 'تاریخ تحویل',
}) => {
  return (
    <div className="w-full sm:w-auto">
      {label && <div className="mb-1 text-xs font-medium text-text-secondary">{label}</div>}
      <div className="relative inline-block w-full sm:w-60">
        <select
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-border-default bg-surface py-2.5 pr-4 pl-10 text-sm font-medium text-text-primary shadow-1 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
          {DEMO_DATES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-text-secondary">
          <ChevronDown className="size-4" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-primary opacity-0 sm:opacity-0">
          <Calendar className="size-4" />
        </div>
      </div>
    </div>
  )
}
