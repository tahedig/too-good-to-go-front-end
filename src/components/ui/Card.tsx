import type { HTMLAttributes } from 'react'

export default function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-border-default bg-surface p-5 shadow-1 ${className}`}
      {...props}
    />
  )
}
