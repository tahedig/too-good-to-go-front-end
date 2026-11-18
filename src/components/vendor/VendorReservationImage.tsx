import { useState } from 'react'
import { Package } from 'lucide-react'

export function VendorReservationImage({ src, className }: { src: string; className: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-md bg-surface-secondary ${className}`}
      aria-hidden="true"
    >
      {src && failedSrc !== src ? (
        <img
          src={src}
          alt=""
          className="size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <div className="grid size-full place-items-center text-text-secondary">
          <Package className="size-8" strokeWidth={1.5} />
        </div>
      )}
    </div>
  )
}
