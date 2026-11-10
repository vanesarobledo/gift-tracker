import { describe, expect, it } from 'vitest'
import {
  addGift,
  addRecipient,
  convertIdeaToGift,
  deleteOccasion,
  deletePerson,
  duplicateOccasion,
  personDeletionImpact,
  removeRecipient,
  setGiftStatus,
} from '../operations'
import { sampleData } from './fixtures'

describe('convertIdeaToGift', () => {
  it('creates a planned gift from the idea and deletes the idea', () => {
    const data = sampleData()
    const [next, gift] = convertIdeaToGift(data, 'i1', 'xmas')

    expect(gift).toMatchObject({
      personId: 'finn',
      occasionId: 'xmas',
      name: 'Book',
      link: 'https://example.com/book',
      price: 25,
      status: 'planned',
    })
    expect(next.gifts).toContainEqual(gift)
    expect(next.ideas.find((i) => i.id === 'i1')).toBeUndefined()
    expect(next.ideas).toHaveLength(1)
  })

  it('omits link and price when the idea has none', () => {
    const [, gift] = convertIdeaToGift(sampleData(), 'i2', 'xmas')
    expect(gift).not.toHaveProperty('link')
    expect(gift).not.toHaveProperty('price')
  })

  it('does not mutate the input', () => {
    const data = sampleData()
    const before = structuredClone(data)
    convertIdeaToGift(data, 'i1', 'xmas')
    expect(data).toEqual(before)
  })

  it('rejects converting for an occasion the person is not a recipient of', () => {
    expect(() => convertIdeaToGift(sampleData(), 'i1', 'wedding')).toThrow('not a recipient')
  })
})

describe('addGift', () => {
  it('allows several gifts for the same person and occasion', () => {
    let data = sampleData()
    data = addGift(data, 'xmas', 'finn', { name: 'Socks' })
    data = addGift(data, 'xmas', 'finn', { name: 'Mug', price: 12 })
    expect(data.gifts.filter((g) => g.personId === 'finn' && g.occasionId === 'xmas')).toHaveLength(
      3,
    )
  })
})

describe('setGiftStatus', () => {
  it('can move status in either direction', () => {
    let data = setGiftStatus(sampleData(), 'g1', 'given')
    expect(data.gifts.find((g) => g.id === 'g1')!.status).toBe('given')
    data = setGiftStatus(data, 'g1', 'planned')
    expect(data.gifts.find((g) => g.id === 'g1')!.status).toBe('planned')
  })
})

describe('duplicateOccasion', () => {
  it('copies recipients under a new name and date, without gifts', () => {
    const data = sampleData()
    const [next, copy] = duplicateOccasion(data, 'xmas', {
      name: 'Christmas 2027',
      date: '2027-12-25',
    })

    expect(copy.id).not.toBe('xmas')
    expect(copy).toMatchObject({
      name: 'Christmas 2027',
      date: '2027-12-25',
      recipientIds: ['finn', 'nikki'],
    })
    expect(next.occasions).toHaveLength(3)
    expect(next.gifts.filter((g) => g.occasionId === copy.id)).toHaveLength(0)
    expect(next.gifts).toEqual(data.gifts)
  })

  it("doesn't share the recipient array with the original", () => {
    const data = sampleData()
    const [, copy] = duplicateOccasion(data, 'xmas', { name: 'Copy', date: '2027-12-25' })
    expect(copy.recipientIds).not.toBe(data.occasions[0]!.recipientIds)
  })
})

describe('cascading deletes', () => {
  it('deleting a person removes their ideas, gifts and recipient entries', () => {
    const data = sampleData()
    expect(personDeletionImpact(data, 'nikki')).toEqual({ ideas: 1, gifts: 2, occasions: 2 })

    const next = deletePerson(data, 'nikki')
    expect(next.people.map((p) => p.id)).toEqual(['finn'])
    expect(next.ideas.every((i) => i.personId !== 'nikki')).toBe(true)
    expect(next.gifts.map((g) => g.id)).toEqual(['g1'])
    expect(next.occasions.find((o) => o.id === 'xmas')!.recipientIds).toEqual(['finn'])
    expect(next.occasions.find((o) => o.id === 'wedding')!.recipientIds).toEqual([])
  })

  it('deleting an occasion removes its gifts and nothing else', () => {
    const data = sampleData()
    const next = deleteOccasion(data, 'xmas')
    expect(next.occasions.map((o) => o.id)).toEqual(['wedding'])
    expect(next.gifts.map((g) => g.id)).toEqual(['g3'])
    expect(next.people).toEqual(data.people)
    expect(next.ideas).toEqual(data.ideas)
  })

  it('removing a recipient removes only their gifts for that occasion', () => {
    const next = removeRecipient(sampleData(), 'xmas', 'nikki')
    expect(next.occasions.find((o) => o.id === 'xmas')!.recipientIds).toEqual(['finn'])
    expect(next.gifts.map((g) => g.id)).toEqual(['g1', 'g3'])
    expect(next.people.map((p) => p.id)).toContain('nikki')
  })
})

describe('addRecipient', () => {
  it('ignores a person who is already a recipient', () => {
    const data = sampleData()
    expect(addRecipient(data, 'xmas', 'finn')).toBe(data)
  })

  it('appends a new recipient', () => {
    const next = addRecipient(sampleData(), 'wedding', 'finn')
    expect(next.occasions.find((o) => o.id === 'wedding')!.recipientIds).toEqual(['nikki', 'finn'])
  })
})
