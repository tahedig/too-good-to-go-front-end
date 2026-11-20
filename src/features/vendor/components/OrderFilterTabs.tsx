import React from 'react'
import type { OrderFilterStatus } from '../types'

interface OrderFilterTabsProps {
  selectedStatus: OrderFilterStatus
  onSelectStatus: (status: OrderFilterStatus) => void
}

const FILTER_OPTIONS: { id: OrderFilterStatus; label: string }[] = [
  { id: 'all', label: 'همه' },
  { id: 'active', label: 'فعال' },
  { id: 'ready_for_pickup', label: 'در انتظار تحویل' },
  { id: 'delivered', label: 'تحویل‌شده' },
  { id: 'cancelled', label: 'لغوشده' },
]

export const OrderFilterTabs: React.FC<OrderFilterTabsProps> = ({
  selectedStatus,
  onSelectStatus,
}) => {
  return (
    <div className="w-full">
      <div className="mb-2 text-xs font-semibold text-text-secondary md:hidden">فیلترها</div>
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map((option) => {
          const isSelected = selectedStatus === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectStatus(option.id)}
              className={[
                'h-10 rounded-xl px-4 text-sm font-medium transition-colors select-none',
                isSelected
                  ? 'bg-primary text-on-primary shadow-1'
                  : 'border border-border-default bg-surface text-text-primary hover:bg-surface-secondary',
              ].join(' ')}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
