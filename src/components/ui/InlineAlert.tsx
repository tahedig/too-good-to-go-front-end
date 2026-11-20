import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

export interface InlineAlertProps {
  tone?: AlertTone;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}

const tones: Record<AlertTone, { background: string; Icon: LucideIcon }> = {
  info: { background: 'bg-primary-subtle', Icon: Info },
  success: { background: 'bg-success-subtle', Icon: CircleCheck },
  warning: { background: 'bg-warning-subtle', Icon: CircleAlert },
  error: { background: 'bg-error-subtle', Icon: CircleAlert },
};

export function InlineAlert({ tone = 'info', icon, children, className }: InlineAlertProps) {
  const { background, Icon: DefaultIcon } = tones[tone];
  const Icon = icon ?? DefaultIcon;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={['flex items-start gap-3 rounded-md p-4 text-body-md text-text-primary', background, className]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon className="size-6 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
