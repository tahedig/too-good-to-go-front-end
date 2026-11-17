import React from 'react';
import type { VendorOrderSummary, VendorStoreActive } from '../types';
import { toPersianDigits } from '@/lib/digits';
import { formatNumber } from '@/lib/format';

interface OrderStatsSummaryProps {
  summary: VendorOrderSummary;
  store?: VendorStoreActive;
  variant?: 'reservations' | 'orders';
}

export const OrderStatsSummary: React.FC<OrderStatsSummaryProps> = ({
  summary,
  store,
  variant = 'orders',
}) => {
  if (variant === 'reservations') {
    return (
      <div className="w-full">
        {/* Mobile View */}
        <div className="md:hidden">
          <div className="mb-2 text-xs font-semibold text-text-secondary">
            خلاصه رزروهای امروز
          </div>
          <div className="rounded-xl border border-border-default bg-surface p-4 shadow-1">
            <div className="flex items-center justify-between py-2 border-b border-border-default/50">
              <span className="text-sm text-text-secondary">بسته‌های رزروشده</span>
              <span className="text-sm font-bold text-text-primary">
                {toPersianDigits(summary.total_reserved_packages)} بسته
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border-default/50">
              <span className="text-sm text-text-secondary">مبلغ رزروها</span>
              <span className="text-sm font-bold text-text-primary">
                {toPersianDigits(formatNumber(summary.total_revenue))} تومان
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-text-secondary">تحویل‌شده</span>
              <span className="text-sm font-bold text-text-primary">
                {toPersianDigits(summary.delivered_packages_count)}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex items-center justify-between rounded-xl border border-border-default bg-surface px-6 py-4 shadow-1">
          {store && (
            <div className="border-l border-border-default pl-6">
              <span className="text-xs text-text-secondary block">فروشگاه</span>
              <span className="text-base font-bold text-text-primary block mt-0.5">
                {store.name}
              </span>
              <span className="text-xs text-text-secondary block mt-0.5">
                {store.address}
              </span>
            </div>
          )}

          <div className="text-center px-4">
            <span className="text-xs text-text-secondary block">رزروهای فعال</span>
            <span className="text-xl font-bold text-primary block mt-1">
              {toPersianDigits(summary.active_reservations_count)} رزرو
            </span>
          </div>

          <div className="text-center px-4">
            <span className="text-xs text-text-secondary block">تحویل شده</span>
            <span className="text-xl font-bold text-text-primary block mt-1">
              {toPersianDigits(summary.delivered_packages_count)}
            </span>
          </div>

          <div className="text-center px-4">
            <span className="text-xs text-text-secondary block">مبلغ کل رزروها</span>
            <span className="text-xl font-bold text-text-primary block mt-1">
              {toPersianDigits(formatNumber(summary.total_revenue))} تومان
            </span>
          </div>

          <div className="text-center pr-4">
            <span className="text-xs text-text-secondary block">بسته‌های رزروشده</span>
            <span className="text-xl font-bold text-text-primary block mt-1">
              {toPersianDigits(summary.total_reserved_packages)} بسته
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Variant "orders"
  return (
    <div className="w-full">
      {/* Mobile Orders Summary */}
      <div className="rounded-xl border border-border-default bg-surface p-4 shadow-1 md:hidden">
        <div className="grid grid-cols-2 gap-4 pb-3 border-b border-border-default/50 text-center">
          <div>
            <span className="text-xs text-text-secondary block">تحویل‌شده</span>
            <span className="text-base font-bold text-text-primary mt-1 block">
              {toPersianDigits(summary.delivered_packages_count)} بسته
            </span>
          </div>
          <div>
            <span className="text-xs text-text-secondary block">بسته‌های رزروشده</span>
            <span className="text-base font-bold text-text-primary mt-1 block">
              {toPersianDigits(summary.total_reserved_packages)} بسته
            </span>
          </div>
        </div>
        <div className="pt-3 text-center">
          <span className="text-xs text-text-secondary block">جمع رزروها</span>
          <span className="text-lg font-bold text-primary mt-0.5 block">
            {toPersianDigits(formatNumber(summary.total_revenue))} تومان
          </span>
        </div>
      </div>

      {/* Desktop Orders Summary: 3 cards side by side */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border-default bg-surface p-5 text-center shadow-1">
          <span className="text-sm text-text-secondary block">مبلغ رزروهای امروز</span>
          <span className="text-2xl font-bold text-primary mt-2 block">
            {toPersianDigits(formatNumber(summary.total_revenue))} تومان
          </span>
        </div>
        <div className="rounded-xl border border-border-default bg-surface p-5 text-center shadow-1">
          <span className="text-sm text-text-secondary block">تحویل‌شده</span>
          <span className="text-2xl font-bold text-text-primary mt-2 block">
            {toPersianDigits(summary.delivered_packages_count)} بسته
          </span>
        </div>
        <div className="rounded-xl border border-border-default bg-surface p-5 text-center shadow-1">
          <span className="text-sm text-text-secondary block">بسته‌های رزروشده</span>
          <span className="text-2xl font-bold text-text-primary mt-2 block">
            {toPersianDigits(summary.total_reserved_packages)} بسته
          </span>
        </div>
      </div>
    </div>
  );
};
