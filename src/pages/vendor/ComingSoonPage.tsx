export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-4 p-4 lg:px-20 lg:py-6">
      <h1 className="text-title-xl text-text-primary lg:text-display-xl">{title}</h1>

      <div className="flex flex-col items-center gap-3 rounded-lg bg-surface p-6">
        <p className="w-full text-title-md font-normal text-text-primary">
          این بخش در حال آماده‌سازی است.
        </p>
        <p className="w-full text-body-md text-text-secondary">به‌زودی در دسترس خواهد بود.</p>
      </div>
    </div>
  )
}
