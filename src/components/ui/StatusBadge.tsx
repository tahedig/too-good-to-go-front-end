import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ListingStatus = 'available' | 'soldOut';

export interface StatusBadgeProps {
  status: ListingStatus;
  label?: string;
  className?: string;
}

const statuses: Record<ListingStatus, { label: string; background: string; Icon: LucideIcon }> = {
  available: { label: 'موجود', background: 'bg-success-subtle', Icon: Check },
  soldOut: { label: 'ناموجود', background: 'bg-surface-secondary', Icon: X },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const { label: defaultLabel, background, Icon } = statuses[status];

  return (
    <span
      className={['inline-flex h-8 items-center gap-1 rounded-sm px-2 py-1 text-caption text-text-primary', background, className]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon className="size-6 shrink-0" strokeWidth={1.75} />
      {label ?? defaultLabel}
    </span>
  );
}
