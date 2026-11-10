import type { AppData, Gift, GiftStatus } from '../types'

export function gift(
  id: string,
  personId: string,
  occasionId: string,
  status: GiftStatus = 'planned',
  extra: Partial<Gift> = {},
): Gift {
  return { id, personId, occasionId, name: `Gift ${id}`, status, ...extra }
}

/** Two people, two occasions, a couple of ideas and gifts. */
export function sampleData(): AppData {
  return {
    people: [
      { id: 'finn', name: 'Finn', birthday: { month: 3, day: 14 } },
      { id: 'nikki', name: 'Nikki' },
    ],
    occasions: [
      { id: 'xmas', name: 'Christmas 2026', date: '2026-12-25', recipientIds: ['finn', 'nikki'] },
      { id: 'wedding', name: "Nikki's wedding", date: '2027-06-01', recipientIds: ['nikki'] },
    ],
    ideas: [
      { id: 'i1', personId: 'finn', name: 'Book', link: 'https://example.com/book', price: 25 },
      { id: 'i2', personId: 'nikki', name: 'Scarf' },
    ],
    gifts: [
      gift('g1', 'finn', 'xmas', 'planned', { price: 40 }),
      gift('g2', 'nikki', 'xmas', 'bought', { price: 10.5 }),
      gift('g3', 'nikki', 'wedding', 'planned', { price: 100 }),
    ],
  }
}
