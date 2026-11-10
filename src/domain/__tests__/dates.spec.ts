import { describe, expect, it } from 'vitest'
import { isValidISODate, nextBirthdayDate, parseISODate } from '../dates'
import { splitOccasions } from '../occasions'
import type { Occasion } from '../types'

describe('nextBirthdayDate', () => {
  it('uses this year if the birthday has not passed', () => {
    expect(nextBirthdayDate({ month: 12, day: 1 }, '2026-11-10')).toBe('2026-12-01')
  })

  it('uses today when the birthday is today', () => {
    expect(nextBirthdayDate({ month: 11, day: 10 }, '2026-11-10')).toBe('2026-11-10')
  })

  it('rolls over to next year once the birthday has passed', () => {
    expect(nextBirthdayDate({ month: 3, day: 14, year: 1990 }, '2026-11-10')).toBe('2027-03-14')
  })

  it('falls back to Feb 28 for Feb 29 birthdays in non-leap years', () => {
    expect(nextBirthdayDate({ month: 2, day: 29 }, '2026-11-10')).toBe('2027-02-28')
    expect(nextBirthdayDate({ month: 2, day: 29 }, '2027-11-10')).toBe('2028-02-29')
  })
})

describe('dates', () => {
  it('parses ISO dates in local time', () => {
    const d = parseISODate('2026-12-25')
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 11, 25])
  })

  it('validates ISO dates', () => {
    expect(isValidISODate('2026-02-28')).toBe(true)
    expect(isValidISODate('2026-02-29')).toBe(false)
    expect(isValidISODate('2026-2-1')).toBe(false)
  })
})

describe('splitOccasions', () => {
  const o = (id: string, date: string): Occasion => ({ id, name: id, date, recipientIds: [] })

  it('lists upcoming soonest first (today counts as upcoming) and past most recent first', () => {
    const { upcoming, past } = splitOccasions(
      [o('a', '2027-01-01'), o('b', '2026-01-01'), o('c', '2026-11-10'), o('d', '2026-06-01')],
      '2026-11-10',
    )
    expect(upcoming.map((x) => x.id)).toEqual(['c', 'a'])
    expect(past.map((x) => x.id)).toEqual(['d', 'b'])
  })
})
