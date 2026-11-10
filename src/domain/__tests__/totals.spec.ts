import { describe, expect, it } from 'vitest'
import { formatCAD, occasionTotal, parsePrice, plannedTotal, toBuyGroups } from '../totals'
import type { Occasion } from '../types'
import { gift, sampleData } from './fixtures'

describe('occasionTotal', () => {
  it('sums planned, bought and given gifts for the occasion only', () => {
    const gifts = [
      gift('a', 'p', 'o', 'planned', { price: 10 }),
      gift('b', 'p', 'o', 'bought', { price: 20.25 }),
      gift('c', 'p', 'o', 'given', { price: 5 }),
      gift('d', 'p', 'other', 'planned', { price: 1000 }),
    ]
    expect(occasionTotal('o', gifts)).toBeCloseTo(35.25)
  })

  it('counts gifts without a price as zero', () => {
    expect(
      occasionTotal('o', [gift('a', 'p', 'o'), gift('b', 'p', 'o', 'planned', { price: 7 })]),
    ).toBe(7)
  })

  it('is zero for an occasion with no gifts', () => {
    expect(occasionTotal('o', [])).toBe(0)
  })
})

describe('plannedTotal', () => {
  it('sums only planned gifts across all occasions', () => {
    expect(plannedTotal(sampleData().gifts)).toBe(140)
  })
})

describe('formatCAD', () => {
  it('formats as Canadian dollars', () => {
    expect(formatCAD(1234.5)).toBe('$1,234.50')
  })
})

describe('toBuyGroups', () => {
  const occasions: Occasion[] = [
    { id: 'late', name: 'Late', date: '2027-01-10', recipientIds: ['p'] },
    { id: 'xmas', name: 'Christmas', date: '2026-12-25', recipientIds: ['p'] },
  ]

  it('includes only planned gifts, grouped by occasion', () => {
    const groups = toBuyGroups(occasions, [
      gift('a', 'p', 'xmas', 'planned'),
      gift('b', 'p', 'xmas', 'bought'),
      gift('c', 'p', 'late', 'given'),
    ])
    expect(groups.map((g) => g.occasion.id)).toEqual(['xmas'])
    expect(groups[0]!.gifts.map((g) => g.id)).toEqual(['a'])
  })

  it('orders by giveDate when set, otherwise the occasion date', () => {
    const groups = toBuyGroups(occasions, [
      gift('a', 'p', 'xmas', 'planned'), // 2026-12-25
      gift('b', 'p', 'xmas', 'planned', { giveDate: '2026-12-20' }),
      gift('c', 'p', 'late', 'planned', { giveDate: '2026-12-01' }), // pulls "Late" first
    ])
    expect(groups.map((g) => g.occasion.id)).toEqual(['late', 'xmas'])
    expect(groups[1]!.gifts.map((g) => g.id)).toEqual(['b', 'a'])
  })
})

describe('parsePrice', () => {
  it.each([
    ['', undefined],
    ['  ', undefined],
    ['24.99', 24.99],
    ['$1,200', 1200],
    ['5.', 5],
    ['.5', 0.5],
    ['3.333', 3.33],
    ['abc', 'invalid'],
    ['-4', 'invalid'],
    ['1.2.3', 'invalid'],
  ])('parses %j as %j', (input, expected) => {
    expect(parsePrice(input)).toBe(expected)
  })
})
