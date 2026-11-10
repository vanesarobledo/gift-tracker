const currency = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })

export function formatPrice(value: number | undefined): string {
  return currency.format(value ?? 0)
}

/** Parse YYYY-MM-DD as a local date (avoids the UTC shift of `new Date('YYYY-MM-DD')`). */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

export function formatDate(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function toIsoDate(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayIso(): string {
  return toIsoDate(new Date())
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function formatBirthday(b: { month: number; day: number; year?: number }): string {
  const base = `${MONTHS[b.month - 1]} ${b.day}`
  return b.year ? `${base}, ${b.year}` : base
}
