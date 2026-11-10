import type { Birthday } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

/** Format a local Date as YYYY-MM-DD (in local time, not UTC). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now)
}

/**
 * Parse YYYY-MM-DD as a *local* date. `new Date('2026-12-25')` would parse it
 * as UTC midnight, which shows up as Dec 24 in timezones west of UTC.
 */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

export function isValidISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return toISODate(parseISODate(value)) === value // rejects 2026-02-30 etc.
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/** Feb 29 birthdays fall on Feb 28 in non-leap years. */
function birthdayInYear(b: Birthday, year: number): string {
  const day = b.month === 2 && b.day === 29 && !isLeapYear(year) ? 28 : b.day
  return `${year}-${pad(b.month)}-${pad(day)}`
}

/** The next date (today included) on which this birthday falls. */
export function nextBirthdayDate(b: Birthday, today: string = todayISO()): string {
  const year = Number(today.slice(0, 4))
  const thisYear = birthdayInYear(b, year)
  return thisYear >= today ? thisYear : birthdayInYear(b, year + 1)
}

export function isValidBirthday(b: Birthday): boolean {
  if (!Number.isInteger(b.month) || b.month < 1 || b.month > 12) return false
  if (b.year !== undefined && (!Number.isInteger(b.year) || b.year < 1)) return false
  // Use a leap year so Feb 29 is allowed when the year is unknown.
  const year = b.year ?? 2000
  return (
    Number.isInteger(b.day) &&
    isValidISODate(`${String(year).padStart(4, '0')}-${pad(b.month)}-${pad(b.day)}`)
  )
}

const longFmt = new Intl.DateTimeFormat('en-CA', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function formatDate(iso: string): string {
  return longFmt.format(parseISODate(iso))
}

const monthDayFmt = new Intl.DateTimeFormat('en-CA', { month: 'long', day: 'numeric' })

export function formatBirthday(b: Birthday): string {
  const md = monthDayFmt.format(new Date(2000, b.month - 1, b.day))
  return b.year ? `${md}, ${b.year}` : md
}
