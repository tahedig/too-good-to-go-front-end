export default function AdminComingSoonPage({ title }: { title: string }) {
  return (
    <section className="rounded-lg border border-border-default bg-surface p-6">
      <h1 className="text-title-lg font-bold">{title}</h1>
      <p className="mt-2 text-body-md text-text-secondary">این بخش به‌زودی تکمیل می‌شود.</p>
    </section>
  )
}
