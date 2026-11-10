import { describe, expect, it } from 'vitest'
import { groupForGifts, groupRecipients } from '../grouping'
import type { Occasion, Person } from '../types'
import { gift } from './fixtures'

describe('groupForGifts', () => {
  it('needs shopping when there are no gifts', () => {
    expect(groupForGifts([])).toBe('needs-shopping')
  })

  it('planned when any gift is planned, even if others are further along', () => {
    expect(
      groupForGifts([
        gift('a', 'p', 'o', 'given'),
        gift('b', 'p', 'o', 'planned'),
        gift('c', 'p', 'o', 'bought'),
      ]),
    ).toBe('planned')
  })

  it('bought when nothing is planned and at least one is bought', () => {
    expect(groupForGifts([gift('a', 'p', 'o', 'given'), gift('b', 'p', 'o', 'bought')])).toBe(
      'bought',
    )
  })

  it('given when every gift is given', () => {
    expect(groupForGifts([gift('a', 'p', 'o', 'given'), gift('b', 'p', 'o', 'given')])).toBe(
      'given',
    )
  })
})

describe('groupRecipients', () => {
  const people: Person[] = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, name: id.toUpperCase() }))
  const occasion: Occasion = {
    id: 'o',
    name: 'Christmas',
    date: '2026-12-25',
    recipientIds: ['e', 'd', 'c', 'b', 'a'],
  }

  it('places every recipient in exactly one group with all their gifts for this occasion', () => {
    const gifts = [
      gift('1', 'b', 'o', 'planned'),
      gift('2', 'b', 'o', 'bought'),
      gift('3', 'c', 'o', 'bought'),
      gift('4', 'c', 'o', 'given'),
      gift('5', 'd', 'o', 'given'),
      gift('6', 'a', 'other', 'planned'), // different occasion: ignored
    ]
    const groups = groupRecipients(occasion, people, gifts)

    expect(groups['needs-shopping'].map((r) => r.person.id)).toEqual(['e', 'a'])
    expect(groups.planned.map((r) => r.person.id)).toEqual(['b'])
    expect(groups.planned[0]!.gifts.map((g) => g.id)).toEqual(['1', '2'])
    expect(groups.bought.map((r) => r.person.id)).toEqual(['c'])
    expect(groups.given.map((r) => r.person.id)).toEqual(['d'])

    const total = Object.values(groups).reduce((n, g) => n + g.length, 0)
    expect(total).toBe(occasion.recipientIds.length)
  })

  it('keeps the occasion recipient order within a group', () => {
    const groups = groupRecipients(occasion, people, [])
    expect(groups['needs-shopping'].map((r) => r.person.id)).toEqual(['e', 'd', 'c', 'b', 'a'])
  })
})
