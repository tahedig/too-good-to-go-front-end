import type { ReactNode } from 'react';
import { AlertIcon, CheckCircleIcon, InfoIcon } from './icons';

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

export interface InlineAlertProps {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
}

const tones: Record<AlertTone, { background: string; Icon: (p: { className?: string }) => ReactNode }> = {
  info: { background: 'bg-primary-subtle', Icon: InfoIcon },
  success: { background: 'bg-success-subtle', Icon: CheckCircleIcon },
  warning: { background: 'bg-warning-subtle', Icon: AlertIcon },
  error: { background: 'bg-error-subtle', Icon: AlertIcon },
};

export function InlineAlert({ tone = 'info', children, className }: InlineAlertProps) {
  const { background, Icon } = tones[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={['flex items-start gap-3 rounded-md p-4 text-body-md text-text-primary', background, className]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon className="size-6 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
