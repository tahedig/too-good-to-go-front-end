const tehranDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tehran',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const persianDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const persianMonth = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  timeZone: 'UTC',
  month: 'long',
})
const persianYear = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  timeZone: 'UTC',
  year: 'numeric',
})

export function localDate(date = new Date()): string {
  const parts = tehranDate.formatToParts(date)
  return ['year', 'month', 'day']
    .map((part) =>
      parts.find(({ type }) => type === part)?.value.padStart(part === 'year' ? 4 : 2, '0'),
    )
    .join('-')
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

// These inputs already represent calendar days, not instants to convert between time zones.
export function formatJalaliDate(iso: string): string {
  return persianDate.format(new Date(`${iso}T00:00:00Z`))
}

export function formatJalaliDateRange(start: string, end: string): string {
  return persianDate.formatRange(new Date(`${start}T00:00:00Z`), new Date(`${end}T00:00:00Z`))
}

export function formatJalaliMonthYear(iso: string): { month: string; label: string } {
  const date = new Date(`${iso}T00:00:00Z`)
  const month = persianMonth.format(date)
  const year = persianYear.format(date)
  return { month, label: `${month} ${year}` }
}
