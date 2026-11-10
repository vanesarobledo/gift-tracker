import { describe, expect, it } from 'vitest'
import type { AppData, Gift } from '../types'
import {
  convertIdeaToGift,
  deleteOccasion,
  deletePerson,
  duplicateOccasion,
  groupRecipients,
  nextBirthdayDate,
  occasionTotal,
  parseImportText,
  plannedTotal,
  removeRecipient,
  splitOccasions,
  toBuyGroups,
  buildExport,
  validateImport,
} from '../logic'

const gift = (over: Partial<Gift> & Pick<Gift, 'id' | 'personId'>): Gift => ({
  occasionId: 'xmas',
  name: 'Thing',
  status: 'planned',
  ...over,
})

function sample(): AppData {
  return {
    people: [
      { id: 'a', name: 'Ann' },
      { id: 'b', name: 'Bob' },
      { id: 'c', name: 'Cy' },
      { id: 'd', name: 'Di' },
    ],
    occasions: [
      {
        id: 'xmas',
        name: 'Christmas 2026',
        date: '2026-12-25',
        recipientIds: ['a', 'b', 'c', 'd'],
      },
      { id: 'bday', name: "Ann's birthday", date: '2026-03-01', recipientIds: ['a'] },
    ],
    ideas: [
      { id: 'i1', personId: 'a', name: 'Book', link: 'https://x.test', price: 20 },
      { id: 'i2', personId: 'c', name: 'Socks' },
      { id: 'i3', personId: 'd', name: 'Hat' },
    ],
    gifts: [
      gift({ id: 'g1', personId: 'b', status: 'planned', price: 10 }),
      gift({ id: 'g2', personId: 'b', status: 'given', price: 5 }),
      gift({ id: 'g3', personId: 'c', status: 'bought', price: 7.5 }),
      gift({ id: 'g4', personId: 'd', status: 'given' }),
      gift({ id: 'g5', personId: 'a', occasionId: 'bday', status: 'planned', price: 30 }),
    ],
  }
}

describe('groupRecipients', () => {
  it('puts each recipient in exactly one group by least-advanced state', () => {
    const g = groupRecipients(sample(), 'xmas')
    expect(g.needsShopping.map((e) => e.person.id)).toEqual(['a'])
    expect(g.planned.map((e) => e.person.id)).toEqual(['b'])
    expect(g.bought.map((e) => e.person.id)).toEqual(['c'])
    expect(g.given.map((e) => e.person.id)).toEqual(['d'])
  })

  it("lists all of a recipient's gifts for the occasion", () => {
    const g = groupRecipients(sample(), 'xmas')
    expect(g.planned[0]?.gifts.map((x) => x.id)).toEqual(['g1', 'g2'])
  })

  it('shows ideas only for needs-shopping and planned', () => {
    const data = sample()
    data.ideas.push({ id: 'i4', personId: 'b', name: 'Mug' })
    const g = groupRecipients(data, 'xmas')
    expect(g.needsShopping[0]?.ideas.map((i) => i.id)).toEqual(['i1'])
    expect(g.planned[0]?.ideas.map((i) => i.id)).toEqual(['i4'])
    expect(g.bought[0]?.ideas).toEqual([])
    expect(g.given[0]?.ideas).toEqual([])
  })

  it('ignores gifts from other occasions', () => {
    const g = groupRecipients(sample(), 'xmas')
    expect(g.needsShopping[0]?.gifts).toEqual([]) // Ann has a gift only at bday
  })
})

describe('totals', () => {
  it('sums all gifts of an occasion, counting missing prices as zero', () => {
    expect(occasionTotal(sample(), 'xmas')).toBe(22.5)
  })
  it('sums planned gifts across occasions', () => {
    expect(plannedTotal(sample())).toBe(40)
  })
})

describe('toBuyGroups', () => {
  it('groups planned gifts by occasion, ordered by give date or occasion date', () => {
    const data = sample()
    data.gifts.push(gift({ id: 'g6', personId: 'a', giveDate: '2026-02-01' }))
    const groups = toBuyGroups(data)
    expect(groups.map((g) => g.occasion.id)).toEqual(['xmas', 'bday'])
    expect(groups[0]?.gifts.map((x) => x.gift.id)).toEqual(['g6', 'g1'])
  })
})

describe('splitOccasions', () => {
  it('orders upcoming soonest first and separates past', () => {
    const { upcoming, past } = splitOccasions(sample().occasions, '2026-06-01')
    expect(upcoming.map((o) => o.id)).toEqual(['xmas'])
    expect(past.map((o) => o.id)).toEqual(['bday'])
  })
})

describe('convertIdeaToGift', () => {
  it('moves the idea into a planned gift', () => {
    const next = convertIdeaToGift(sample(), 'i1', 'xmas', 'new')
    expect(next.ideas.find((i) => i.id === 'i1')).toBeUndefined()
    expect(next.gifts.find((g) => g.id === 'new')).toEqual({
      id: 'new',
      personId: 'a',
      occasionId: 'xmas',
      name: 'Book',
      link: 'https://x.test',
      price: 20,
      status: 'planned',
    })
  })
  it('omits link and price when the idea has none', () => {
    const next = convertIdeaToGift(sample(), 'i2', 'xmas', 'n')
    expect(next.gifts.find((g) => g.id === 'n')).not.toHaveProperty('price')
  })
  it('does nothing for an unknown idea', () => {
    const data = sample()
    expect(convertIdeaToGift(data, 'nope', 'xmas')).toBe(data)
  })
})

describe('duplicateOccasion', () => {
  it('copies recipients but not gifts', () => {
    const next = duplicateOccasion(sample(), 'xmas', 'Christmas 2027', '2027-12-25', 'x27')
    const copy = next.occasions.find((o) => o.id === 'x27')
    expect(copy).toEqual({
      id: 'x27',
      name: 'Christmas 2027',
      date: '2027-12-25',
      recipientIds: ['a', 'b', 'c', 'd'],
    })
    expect(next.gifts.filter((g) => g.occasionId === 'x27')).toEqual([])
    expect(next.gifts).toHaveLength(sample().gifts.length)
  })
  it('does not share the recipient array with the source', () => {
    const next = duplicateOccasion(sample(), 'xmas', 'N', '2027-01-01', 'n')
    const [src, copy] = [next.occasions[0], next.occasions.find((o) => o.id === 'n')]
    expect(copy?.recipientIds).not.toBe(src?.recipientIds)
  })
})

describe('cascading deletes', () => {
  it('deletePerson removes ideas, gifts and recipient entries', () => {
    const next = deletePerson(sample(), 'a')
    expect(next.people.map((p) => p.id)).not.toContain('a')
    expect(next.ideas.filter((i) => i.personId === 'a')).toEqual([])
    expect(next.gifts.filter((g) => g.personId === 'a')).toEqual([])
    expect(next.occasions.every((o) => !o.recipientIds.includes('a'))).toBe(true)
    expect(next.people).toHaveLength(3)
  })
  it('deleteOccasion removes its gifts only', () => {
    const next = deleteOccasion(sample(), 'xmas')
    expect(next.occasions.map((o) => o.id)).toEqual(['bday'])
    expect(next.gifts.map((g) => g.id)).toEqual(['g5'])
  })
  it('removeRecipient removes their gifts for that occasion only', () => {
    const next = removeRecipient(sample(), 'xmas', 'b')
    expect(next.occasions.find((o) => o.id === 'xmas')?.recipientIds).toEqual(['a', 'c', 'd'])
    expect(next.gifts.some((g) => g.personId === 'b')).toBe(false)
    expect(next.gifts.some((g) => g.id === 'g5')).toBe(true)
  })
  it("removeRecipient keeps that person's gifts at other occasions", () => {
    const next = removeRecipient(sample(), 'xmas', 'a')
    expect(next.gifts.some((g) => g.id === 'g5')).toBe(true)
  })
})

describe('nextBirthdayDate', () => {
  it('uses this year if still ahead, including today', () => {
    expect(nextBirthdayDate({ month: 12, day: 3 }, '2026-11-10')).toBe('2026-12-03')
    expect(nextBirthdayDate({ month: 11, day: 10 }, '2026-11-10')).toBe('2026-11-10')
  })
  it('rolls to next year if passed', () => {
    expect(nextBirthdayDate({ month: 3, day: 1 }, '2026-11-10')).toBe('2027-03-01')
  })
  it('falls back to Feb 28 in non-leap years', () => {
    expect(nextBirthdayDate({ month: 2, day: 29 }, '2026-11-10')).toBe('2027-02-28')
    expect(nextBirthdayDate({ month: 2, day: 29 }, '2027-11-10')).toBe('2028-02-29')
  })
})

describe('import validation', () => {
  const valid = () => buildExport(sample())

  it('accepts a valid export (round trip)', () => {
    const result = validateImport(JSON.parse(JSON.stringify(valid())))
    expect(result).toEqual({ ok: true, data: sample() })
  })
  it('rejects non-JSON text', () => {
    expect(parseImportText('{nope').ok).toBe(false)
  })
  it('rejects non-objects and wrong versions', () => {
    expect(validateImport(null).ok).toBe(false)
    expect(validateImport([]).ok).toBe(false)
    expect(validateImport({ ...valid(), version: 2 }).ok).toBe(false)
  })
  it('rejects missing lists', () => {
    const { gifts: _gifts, ...rest } = valid()
    expect(validateImport(rest).ok).toBe(false)
  })
  it('rejects malformed entries', () => {
    const bad = valid()
    ;(bad.gifts[0] as unknown as { status: string }).status = 'lost'
    expect(validateImport(bad).ok).toBe(false)
    const bad2 = valid()
    bad2.occasions[0]!.date = 'Dec 25'
    expect(validateImport(bad2).ok).toBe(false)
    const bad3 = valid()
    bad3.people[0]!.birthday = { month: 13, day: 1 }
    expect(validateImport(bad3).ok).toBe(false)
  })
  it('rejects dangling references', () => {
    const bad = valid()
    bad.gifts[0]!.personId = 'ghost'
    expect(validateImport(bad).ok).toBe(false)
    const bad2 = valid()
    bad2.occasions[0]!.recipientIds.push('ghost')
    expect(validateImport(bad2).ok).toBe(false)
  })
})
