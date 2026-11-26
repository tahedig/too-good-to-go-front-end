import type { ReactNode } from 'react'

const panel = 'flex flex-col gap-4 rounded-lg bg-surface p-4 sm:p-6'

export function DashboardLoading({ notice }: { notice?: ReactNode }) {
  return (
    <>
      <header className="flex flex-col gap-4">
        <h1 className="text-title-lg sm:text-title-xl lg:text-display-xl">داشبورد فروشگاه</h1>
        <p className="text-body-lg text-text-secondary">فروشگاه شما</p>
      </header>
      {notice}
      <span role="status" className="sr-only">
        در حال بارگذاری داشبورد فروشگاه…
      </span>
      <div aria-hidden="true" className="flex flex-col gap-4 sm:gap-6">
        <section className={panel}>
          <h2 className="text-title-md">آمار امروز</h2>
          <div className="grid gap-4 ps-2 sm:grid-cols-2 sm:ps-0 lg:grid-cols-4">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="h-12 rounded-lg bg-surface-sage" />
            ))}
          </div>
        </section>
        <section className={panel}>
          <h2 className="text-title-md">نزدیک‌ترین رزرو</h2>
          <div className="grid gap-4 ps-2 sm:ps-0">
            {[0, 1, 2].map((row) => (
              <div key={row} className="h-10 rounded-lg bg-surface-secondary" />
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
