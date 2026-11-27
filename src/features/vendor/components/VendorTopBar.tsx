import React from 'react'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface VendorTopBarProps {
  title: string
  storeName?: string
  storeAddress?: string
  showBackButton?: boolean
  backTo?: string
}

export const VendorTopBar: React.FC<VendorTopBarProps> = ({
  title,
  storeName,
  storeAddress,
  showBackButton = true,
  backTo,
}) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (backTo) {
      navigate(backTo)
    } else {
      navigate(-1)
    }
  }

  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-primary md:text-3xl">{title}</h1>
        {(storeName || storeAddress) && (
          <p className="mt-1 text-sm text-text-secondary">
            {storeName}
            {storeName && storeAddress && <span className="mx-1.5 opacity-60">•</span>}
            {storeAddress}
          </p>
        )}
      </div>

      {showBackButton && (
        <button
          type="button"
          onClick={handleBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-default bg-surface text-text-primary shadow-1 transition-colors hover:bg-surface-secondary"
          aria-label="بازگشت"
        >
          <ArrowRight className="size-5" />
        </button>
      )}
    </header>
  )
}
