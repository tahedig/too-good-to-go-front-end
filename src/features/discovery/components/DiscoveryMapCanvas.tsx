import { LocateFixed } from 'lucide-react'
import type { DiscoveryLocation, DiscoveryOffer } from '@/types/discoveryTypes'
import { formatNumber } from '@/lib/format'

interface DiscoveryMapCanvasProps {
  offers: DiscoveryOffer[]
  center?: DiscoveryLocation
  selectedOfferId?: string
  disabled?: boolean
  onOfferSelect?: (offer: DiscoveryOffer) => void
  onRecenter?: () => void
}

export function DiscoveryMapCanvas({
  offers,
  center,
  selectedOfferId,
  disabled = false,
  onOfferSelect,
  onRecenter,
}: DiscoveryMapCanvasProps) {
  const locations = offers.flatMap((offer) =>
    offer.location ? [{ offer, ...offer.location }] : [],
  )
  const latitudes = locations.map((item) => item.latitude)
  const longitudes = locations.map((item) => item.longitude)
  if (center) {
    latitudes.push(center.latitude)
    longitudes.push(center.longitude)
  }
  const minLatitude = Math.min(...latitudes)
  const maxLatitude = Math.max(...latitudes)
  const minLongitude = Math.min(...longitudes)
  const maxLongitude = Math.max(...longitudes)
  const latitudeRange = maxLatitude - minLatitude || 1
  const longitudeRange = maxLongitude - minLongitude || 1

  return (
    <div
      role="group"
      aria-label={disabled ? 'نمای شماتیک نقشه' : 'پیشنهادهای غذایی روی نقشه'}
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
      </div>

      {!disabled &&
        locations.map(({ offer, latitude, longitude }) => {
          const top = 10 + ((maxLatitude - latitude) / latitudeRange) * 80
          const left = 10 + ((longitude - minLongitude) / longitudeRange) * 80
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
              style={{ top: `${top}%`, left: `${left}%` }}
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
