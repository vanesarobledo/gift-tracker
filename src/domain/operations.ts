/**
 * Pure state transitions. Each function takes the current AppData and returns
 * a new AppData without mutating its input.
 */
import {
  newId,
  type AppData,
  type Gift,
  type GiftStatus,
  type Idea,
  type ItemFields,
  type Occasion,
  type Person,
} from './types'

export class NotFoundError extends Error {}

function find<T extends { id: string }>(items: readonly T[], id: string, kind: string): T {
  const item = items.find((i) => i.id === id)
  if (!item) throw new NotFoundError(`${kind} ${id} not found`)
  return item
}

function replace<T extends { id: string }>(
  items: readonly T[],
  id: string,
  patch: Partial<T>,
): T[] {
  return items.map((i) => (i.id === id ? { ...i, ...patch } : i))
}

/** Drop optional fields set to undefined/empty so stored objects stay clean. */
function cleanItem<T extends ItemFields>(item: T): T {
  const out = { ...item, name: item.name.trim() }
  if (!out.link?.trim()) delete out.link
  else out.link = out.link.trim()
  if (out.price === undefined || Number.isNaN(out.price)) delete out.price
  return out
}

// ---------- People ----------

export function addPerson(data: AppData, fields: Omit<Person, 'id'>): [AppData, Person] {
  const person: Person = { id: newId(), ...fields, name: fields.name.trim() }
  if (!person.birthday) delete person.birthday
  return [{ ...data, people: [...data.people, person] }, person]
}

export function updatePerson(data: AppData, id: string, fields: Omit<Person, 'id'>): AppData {
  find(data.people, id, 'Person')
  const person: Person = { id, name: fields.name.trim() }
  if (fields.birthday) person.birthday = fields.birthday
  return { ...data, people: data.people.map((p) => (p.id === id ? person : p)) }
}

export interface PersonDeletionImpact {
  ideas: number
  gifts: number
  occasions: number
}

export function personDeletionImpact(data: AppData, id: string): PersonDeletionImpact {
  return {
    ideas: data.ideas.filter((i) => i.personId === id).length,
    gifts: data.gifts.filter((g) => g.personId === id).length,
    occasions: data.occasions.filter((o) => o.recipientIds.includes(id)).length,
  }
}

/** Removes the person, their ideas and gifts, and them from every occasion. */
export function deletePerson(data: AppData, id: string): AppData {
  return {
    people: data.people.filter((p) => p.id !== id),
    ideas: data.ideas.filter((i) => i.personId !== id),
    gifts: data.gifts.filter((g) => g.personId !== id),
    occasions: data.occasions.map((o) =>
      o.recipientIds.includes(id)
        ? { ...o, recipientIds: o.recipientIds.filter((r) => r !== id) }
        : o,
    ),
  }
}

// ---------- Occasions ----------

export function addOccasion(data: AppData, fields: Omit<Occasion, 'id'>): [AppData, Occasion] {
  const occasion: Occasion = {
    id: newId(),
    name: fields.name.trim(),
    date: fields.date,
    recipientIds: [...new Set(fields.recipientIds)],
  }
  return [{ ...data, occasions: [...data.occasions, occasion] }, occasion]
}

export function updateOccasion(
  data: AppData,
  id: string,
  fields: Pick<Occasion, 'name' | 'date'>,
): AppData {
  find(data.occasions, id, 'Occasion')
  return {
    ...data,
    occasions: replace(data.occasions, id, { name: fields.name.trim(), date: fields.date }),
  }
}

export function occasionDeletionImpact(data: AppData, id: string): { gifts: number } {
  return { gifts: data.gifts.filter((g) => g.occasionId === id).length }
}

/** Removes the occasion and all of its gifts. */
export function deleteOccasion(data: AppData, id: string): AppData {
  return {
    ...data,
    occasions: data.occasions.filter((o) => o.id !== id),
    gifts: data.gifts.filter((g) => g.occasionId !== id),
  }
}

/** Copies an occasion's recipients (not its gifts) under a new name and date. */
export function duplicateOccasion(
  data: AppData,
  id: string,
  fields: Pick<Occasion, 'name' | 'date'>,
): [AppData, Occasion] {
  const source = find(data.occasions, id, 'Occasion')
  return addOccasion(data, { ...fields, recipientIds: [...source.recipientIds] })
}

export function addRecipient(data: AppData, occasionId: string, personId: string): AppData {
  const occasion = find(data.occasions, occasionId, 'Occasion')
  find(data.people, personId, 'Person')
  if (occasion.recipientIds.includes(personId)) return data
  return {
    ...data,
    occasions: replace(data.occasions, occasionId, {
      recipientIds: [...occasion.recipientIds, personId],
    }),
  }
}

export function recipientRemovalImpact(
  data: AppData,
  occasionId: string,
  personId: string,
): { gifts: number } {
  return {
    gifts: data.gifts.filter((g) => g.occasionId === occasionId && g.personId === personId).length,
  }
}

/** Removes the person from the occasion along with their gifts for it. */
export function removeRecipient(data: AppData, occasionId: string, personId: string): AppData {
  const occasion = find(data.occasions, occasionId, 'Occasion')
  return {
    ...data,
    occasions: replace(data.occasions, occasionId, {
      recipientIds: occasion.recipientIds.filter((r) => r !== personId),
    }),
    gifts: data.gifts.filter((g) => !(g.occasionId === occasionId && g.personId === personId)),
  }
}

// ---------- Ideas ----------

export function addIdea(data: AppData, personId: string, fields: ItemFields): AppData {
  find(data.people, personId, 'Person')
  const idea: Idea = cleanItem({ id: newId(), personId, ...fields })
  return { ...data, ideas: [...data.ideas, idea] }
}

export function updateIdea(data: AppData, id: string, fields: ItemFields): AppData {
  const idea = find(data.ideas, id, 'Idea')
  const updated = cleanItem({ id, personId: idea.personId, ...fields })
  return { ...data, ideas: data.ideas.map((i) => (i.id === id ? updated : i)) }
}

export function deleteIdea(data: AppData, id: string): AppData {
  return { ...data, ideas: data.ideas.filter((i) => i.id !== id) }
}

/**
 * Moves an idea into a planned gift for the occasion: the gift copies the
 * idea's name, link and price, and the idea is deleted.
 */
export function convertIdeaToGift(
  data: AppData,
  ideaId: string,
  occasionId: string,
): [AppData, Gift] {
  const idea = find(data.ideas, ideaId, 'Idea')
  const occasion = find(data.occasions, occasionId, 'Occasion')
  if (!occasion.recipientIds.includes(idea.personId)) {
    throw new Error('That person is not a recipient of this occasion')
  }
  const gift: Gift = cleanItem({
    id: newId(),
    personId: idea.personId,
    occasionId,
    name: idea.name,
    link: idea.link,
    price: idea.price,
    status: 'planned',
  })
  return [
    { ...data, ideas: data.ideas.filter((i) => i.id !== ideaId), gifts: [...data.gifts, gift] },
    gift,
  ]
}

// ---------- Gifts ----------

export interface GiftFields extends ItemFields {
  giveDate?: string
}

function cleanGift(gift: Gift): Gift {
  const out = cleanItem(gift)
  if (!out.giveDate) delete out.giveDate
  return out
}

export function addGift(
  data: AppData,
  occasionId: string,
  personId: string,
  fields: GiftFields,
): AppData {
  const occasion = find(data.occasions, occasionId, 'Occasion')
  if (!occasion.recipientIds.includes(personId)) {
    throw new Error('That person is not a recipient of this occasion')
  }
  const gift = cleanGift({ id: newId(), occasionId, personId, status: 'planned', ...fields })
  return { ...data, gifts: [...data.gifts, gift] }
}

export function updateGift(data: AppData, id: string, fields: GiftFields): AppData {
  const gift = find(data.gifts, id, 'Gift')
  const updated = cleanGift({
    id,
    personId: gift.personId,
    occasionId: gift.occasionId,
    status: gift.status,
    ...fields,
  })
  return { ...data, gifts: data.gifts.map((g) => (g.id === id ? updated : g)) }
}

export function setGiftStatus(data: AppData, id: string, status: GiftStatus): AppData {
  find(data.gifts, id, 'Gift')
  return { ...data, gifts: replace(data.gifts, id, { status }) }
}

export function deleteGift(data: AppData, id: string): AppData {
  return { ...data, gifts: data.gifts.filter((g) => g.id !== id) }
}
