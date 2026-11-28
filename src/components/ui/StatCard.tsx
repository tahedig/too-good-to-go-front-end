import type { ReactNode } from 'react'

export interface StatCardProps {
  label: string
  value: ReactNode
  className?: string
}

export function StatCard({ label, value, className }: StatCardProps) {
  return (
    <article
      className={[
        'flex flex-col gap-3.5 rounded-lg border border-border-default bg-surface p-5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p className="text-caption font-normal text-text-secondary">{label}</p>
      <p className="text-title-lg font-bold text-primary">{value}</p>
    </article>
  )
}
