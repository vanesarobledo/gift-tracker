import type { Gift, Occasion, Person } from './types'

export type RecipientGroupKey = 'needs-shopping' | 'planned' | 'bought' | 'given'

export const RECIPIENT_GROUPS: readonly { key: RecipientGroupKey; label: string }[] = [
  { key: 'needs-shopping', label: 'Needs shopping' },
  { key: 'planned', label: 'Planned' },
  { key: 'bought', label: 'Bought' },
  { key: 'given', label: 'Given' },
]

export interface RecipientEntry {
  person: Person
  gifts: Gift[]
}

/** A recipient's group is decided by their least-advanced gift for the occasion. */
export function groupForGifts(gifts: readonly Gift[]): RecipientGroupKey {
  if (gifts.length === 0) return 'needs-shopping'
  if (gifts.some((g) => g.status === 'planned')) return 'planned'
  if (gifts.some((g) => g.status === 'bought')) return 'bought'
  return 'given'
}

/**
 * Put each recipient of the occasion into exactly one group, keeping the
 * occasion's recipient order within each group.
 */
export function groupRecipients(
  occasion: Occasion,
  people: readonly Person[],
  gifts: readonly Gift[],
): Record<RecipientGroupKey, RecipientEntry[]> {
  const groups: Record<RecipientGroupKey, RecipientEntry[]> = {
    'needs-shopping': [],
    planned: [],
    bought: [],
    given: [],
  }
  const peopleById = new Map(people.map((p) => [p.id, p]))
  const occasionGifts = gifts.filter((g) => g.occasionId === occasion.id)

  for (const personId of occasion.recipientIds) {
    const person = peopleById.get(personId)
    if (!person) continue
    const personGifts = occasionGifts.filter((g) => g.personId === personId)
    groups[groupForGifts(personGifts)].push({ person, gifts: personGifts })
  }
  return groups
}
