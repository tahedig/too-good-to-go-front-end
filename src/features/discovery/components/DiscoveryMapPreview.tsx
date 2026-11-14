import { LocateFixed, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

export function DiscoveryMapPreview() {
  return (
    <section aria-labelledby="map-heading" className="min-w-0 space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 id="map-heading" className="text-title-md text-primary sm:text-title-lg">
          <span className="sm:hidden">نقشه فروشگاه‌ها</span>
          <span className="hidden sm:inline lg:hidden">نقشه فروشگاه‌ها</span>
          <span className="hidden lg:inline">اکتشاف</span>
        </h1>
        <Link
          to="/map"
          aria-label="مشاهده نقشه‌ی کامل محدوده‌ی ولیعصر"
          className="inline-flex items-center gap-2 text-label-md text-text-secondary hover:text-primary"
        >
          <MapPin className="size-5 text-primary" strokeWidth={1.75} />
          تهران، ولیعصر
        </Link>
      </div>

      <div className="rounded-2xl border border-border-default bg-surface p-3 sm:border sm:bg-surface sm:p-0 lg:border-0 lg:bg-transparent">
        <div
          role="group"
          aria-label="نقشه‌ی محدوده‌ی ولیعصر با چند پیشنهاد غذایی نزدیک"
          className="relative h-[220px] overflow-hidden rounded-xl bg-surface-secondary sm:rounded-2xl lg:h-[430px]"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(0deg, transparent 46%, #fff 46%, #fff 51%, transparent 51%), linear-gradient(90deg, transparent 46%, #fff 46%, #fff 51%, transparent 51%), linear-gradient(30deg, transparent 47%, #dce6d6 47%, #dce6d6 51%, transparent 51%)',
              backgroundSize: '100% 34%, 26% 100%, 100% 100%',
            }}
          />
          <div
            aria-hidden="true"
            className="absolute right-[8%] top-[12%] h-[28%] w-[17%] rounded-2xl bg-surface-sage/80"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-[8%] left-[12%] h-[24%] w-[19%] rounded-full bg-surface-sage/70"
          />
          <span className="absolute right-[25%] top-[46%] rotate-[-90deg] text-caption text-text-secondary/80">
            خیابان ولیعصر
          </span>

          <span className="absolute left-[12%] top-[24%] rounded-md border border-primary bg-surface px-3 py-2 text-label-md text-primary shadow-2">
            ۶۵٬۰۰۰ تومان
          </span>
          <span className="absolute left-[55%] top-[62%] rounded-md border border-primary bg-primary px-3 py-2 text-label-md text-on-primary shadow-2">
            ۴۰٬۰۰۰ تومان
          </span>
          <button
            type="button"
            aria-label="رفتن به موقعیت فعلی"
            className="absolute bottom-3 left-3 grid size-11 place-items-center rounded-md border border-border-default bg-surface text-primary shadow-1 hover:bg-surface-secondary sm:bottom-4 sm:left-4"
          >
            <LocateFixed strokeWidth={1.75} />
          </button>
          <Link
            to="/map"
            className="absolute right-3 top-3 inline-flex min-h-11 items-center gap-2 rounded-md border border-border-default bg-surface px-3 text-label-md text-primary shadow-1 hover:bg-surface-secondary sm:right-4 sm:top-4"
          >
            نقشه کامل
          </Link>
        </div>
        <div className="hidden items-center justify-between gap-4 px-4 py-3 text-body-md text-primary sm:flex">
          <span>پیشنهادهای نزدیک شما</span>
          <span className="text-text-secondary">برای دیدن جزئیات، یک پیشنهاد را انتخاب کنید.</span>
        </div>
      </div>
    </section>
  )
}
