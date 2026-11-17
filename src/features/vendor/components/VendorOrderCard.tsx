import React from 'react';
import type { VendorOrder } from '../types';
import { toPersianDigits } from '@/lib/digits';
import { formatNumber } from '@/lib/format';
import { formatTimeSlot } from '../utils/dateUtils';
import { Check } from 'lucide-react';

interface VendorOrderCardProps {
  order: VendorOrder;
  onVerifyPickup: (order: VendorOrder) => void;
}

export const VendorOrderCard: React.FC<VendorOrderCardProps> = ({
  order,
  onVerifyPickup,
}) => {
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';

  const getStatusBadge = () => {
    switch (order.status) {
      case 'active':
        return (
          <span className="inline-flex items-center rounded-lg bg-surface-sage/70 px-2.5 py-1 text-xs font-semibold text-primary">
            رزرو فعال
          </span>
        );
      case 'ready_for_pickup':
        return (
          <span className="inline-flex items-center rounded-lg bg-accent-subtle px-2.5 py-1 text-xs font-semibold text-warning">
            در انتظار تحویل
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-success-subtle px-2.5 py-1 text-xs font-semibold text-success">
            <Check className="size-3.5" />
            تحویل‌شده
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center rounded-lg bg-error-subtle px-2.5 py-1 text-xs font-semibold text-error">
            لغوشده
          </span>
        );
    }
  };

  const formattedDate = order.pickup_date.includes('۱۴۰') || order.pickup_date.includes('140')
    ? order.pickup_date.replace('1405-07-27', '۲۷ مهر ۱۴۰۵').replace('1405-07-28', '۲۸ مهر ۱۴۰۵')
    : order.pickup_date;

  return (
    <div className="w-full rounded-2xl border border-border-default bg-surface p-4 shadow-1 transition-shadow hover:shadow-2">
      {/* Mobile Layout */}
      <div className="flex flex-col md:hidden">
        {/* Customer & Status Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-text-primary">
              {order.customer.name}
            </h3>
            <p className="mt-0.5 text-xs text-text-secondary">
              {order.package.title}
            </p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Package Image */}
        <div className="relative mt-3 h-36 w-full overflow-hidden rounded-xl bg-surface-secondary">
          <img
            src={order.package.image_url}
            alt={order.package.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Order Details Grid */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-b border-border-default/50 pb-4 text-center">
          <div>
            <span className="text-[11px] text-text-secondary block">تعداد بسته</span>
            <span className="text-xs font-bold text-text-primary mt-1 block">
              {toPersianDigits(order.quantity)} بسته
            </span>
          </div>
          <div>
            <span className="text-[11px] text-text-secondary block">ساعت تحویل</span>
            <span className="text-xs font-bold text-text-primary mt-1 block dir-ltr">
              {formatTimeSlot(
                order.pickup_time_slot.start_time,
                order.pickup_time_slot.end_time
              )}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-text-secondary block">تاریخ تحویل</span>
            <span className="text-xs font-bold text-text-primary mt-1 block">
              {toPersianDigits(formattedDate)}
            </span>
          </div>
        </div>

        {/* Total Price */}
        <div className="mt-3 text-center">
          <span className="text-xl font-extrabold text-primary">
            {toPersianDigits(formatNumber(order.total_price))} تومان
          </span>
        </div>

        {/* Action Button */}
        <div className="mt-3">
          <button
            type="button"
            disabled={isDelivered || isCancelled}
            onClick={() => onVerifyPickup(order)}
            className={[
              'w-full h-12 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2',
              isDelivered
                ? 'bg-surface-secondary text-text-disabled cursor-not-allowed'
                : 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-pressed shadow-1',
            ].join(' ')}
          >
            {isDelivered ? 'تحویل داده شده' : 'بررسی تحویل'}
          </button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between gap-6">
        {/* Right side: Thumbnail */}
        <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-surface-secondary">
          <img
            src={order.package.image_url}
            alt={order.package.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Center: Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-text-primary">
              {order.customer.name}
            </h3>
            {getStatusBadge()}
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {order.package.title}
          </p>
          <div className="mt-2 text-xs text-text-secondary flex items-center gap-2">
            <span>{toPersianDigits(order.quantity)} بسته</span>
            <span>•</span>
            <span>{toPersianDigits(formattedDate)}</span>
            <span>•</span>
            <span>
              {formatTimeSlot(
                order.pickup_time_slot.start_time,
                order.pickup_time_slot.end_time
              )}
            </span>
          </div>
        </div>

        {/* Left side: Price & Button */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-lg font-extrabold text-primary">
            {toPersianDigits(formatNumber(order.total_price))} تومان
          </span>
          <button
            type="button"
            disabled={isDelivered || isCancelled}
            onClick={() => onVerifyPickup(order)}
            className={[
              'h-10 px-5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2',
              isDelivered
                ? 'bg-surface-secondary text-text-disabled cursor-not-allowed'
                : 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-pressed shadow-1',
            ].join(' ')}
          >
            {isDelivered ? 'تحویل داده شده' : 'بررسی تحویل'}
          </button>
        </div>
      </div>
    </div>
  );
};
