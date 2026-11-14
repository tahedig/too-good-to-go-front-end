import { LocateFixed } from 'lucide-react'
import type { DiscoveryOffer } from '@/features/discovery/mockData'
import { formatNumber } from '@/lib/format'

const markerPositions: Record<string, { top: string; left: string }> = {
  'morning-bakery': { top: '22%', left: '16%' },
  'green-kitchen': { top: '46%', left: '62%' },
  'corner-cafe': { top: '67%', left: '30%' },
  'seasonal-market': { top: '29%', left: '79%' },
  'oven-stories': { top: '79%', left: '69%' },
  'homemade-table': { top: '55%', left: '43%' },
}

interface DiscoveryMapCanvasProps {
  offers: DiscoveryOffer[]
  selectedOfferId?: string
  disabled?: boolean
  onOfferSelect?: (offer: DiscoveryOffer) => void
  onRecenter?: () => void
}

export function DiscoveryMapCanvas({
  offers,
  selectedOfferId,
  disabled = false,
  onOfferSelect,
  onRecenter,
}: DiscoveryMapCanvasProps) {
  return (
    <div
      role="group"
      aria-label={disabled ? 'نمای نقشه‌ی محدوده‌ی ولیعصر' : 'پیشنهادهای غذایی روی نقشه‌ی ولیعصر'}
      className="relative isolate h-full min-h-[220px] overflow-hidden rounded-2xl bg-[#eee8dd]"
    >
      <div
        aria-hidden="true"
        className={['absolute inset-0 overflow-hidden', disabled && 'opacity-45']
          .filter(Boolean)
          .join(' ')}
      >
        <div className="absolute left-[4%] top-[5%] h-[26%] w-[21%] rounded-[28px] bg-surface-sage" />
        <div className="absolute bottom-[8%] right-[4%] h-[23%] w-[22%] rounded-[28px] bg-surface-sage" />
        <div className="absolute left-[39%] top-[9%] h-[17%] w-[15%] rounded-[24px] bg-[#dce6d6]" />
        <div className="absolute inset-x-0 top-[22%] h-4 bg-white" />
        <div className="absolute inset-x-0 top-[48%] h-5 bg-white" />
        <div className="absolute inset-x-0 top-[76%] h-4 bg-white" />
        <div className="absolute bottom-0 left-[29%] top-0 w-4 bg-white" />
        <div className="absolute bottom-0 left-[57%] top-0 w-6 bg-white" />
        <div className="absolute bottom-0 left-[83%] top-0 w-4 bg-white" />
        <span className="absolute left-[61%] top-[51%] -rotate-90 text-caption text-text-secondary">
          خیابان ولیعصر
        </span>
        <span className="absolute left-[6%] top-[7%] text-label-md text-text-secondary">
          ولیعصر
        </span>
      </div>

      {!disabled &&
        offers.map((offer) => {
          const position = markerPositions[offer.id]
          if (!position) return null
          const selected = offer.id === selectedOfferId
          return (
            <button
              key={offer.id}
              type="button"
              onClick={() => onOfferSelect?.(offer)}
              aria-pressed={selected}
              aria-label={`${offer.merchantName}، ${formatNumber(offer.price)} تومان`}
              className={[
                'absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-[10px] border px-3 py-2 text-label-md shadow-2 transition-transform hover:scale-105',
                selected
                  ? 'border-[3px] border-[#527fca] bg-primary text-on-primary'
                  : 'border-[1.5px] border-primary bg-surface text-primary',
              ].join(' ')}
              style={position}
            >
              {formatNumber(offer.price)} تومان
            </button>
          )
        })}

      {!disabled && (
        <>
          <span
            aria-hidden="true"
            className="absolute left-[47%] top-[64%] z-10 size-4 rounded-full border-[3px] border-white bg-[#527fca] shadow-2"
          />
          <button
            type="button"
            onClick={onRecenter}
            aria-label="رفتن به موقعیت فعلی"
            className="absolute bottom-4 left-4 z-20 grid size-11 place-items-center rounded-[10px] border border-border-default bg-surface text-primary shadow-2 hover:bg-surface-secondary"
          >
            <LocateFixed strokeWidth={1.75} />
          </button>
        </>
      )}
    </div>
  )
}
