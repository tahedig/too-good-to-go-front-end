export function ProfileLoading({ form = false }: { form?: boolean }) {
  return (
    <div className="animate-pulse" aria-label="در حال بارگذاری پروفایل" aria-busy="true">
      <div className="mb-6 h-10 w-40 rounded-md bg-surface-secondary" />
      <div className="rounded-lg bg-surface p-5 sm:p-8">
        <div className="h-7 w-48 rounded-md bg-surface-secondary" />
        <div className="mt-7 space-y-6">
          {Array.from({ length: form ? 3 : 4 }, (_, index) => (
            <div key={index} className="h-12 w-full rounded-md bg-surface-secondary" />
          ))}
        </div>
      </div>
      <span className="sr-only">در حال بارگذاری…</span>
    </div>
  )
}
