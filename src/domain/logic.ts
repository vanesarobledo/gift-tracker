import type { AppData, ExportFile, Gift, GiftStatus, Idea, Occasion, Person } from './types'
import { parseIsoDate, toIsoDate } from './format'

export function emptyData(): AppData {
  return { people: [], occasions: [], ideas: [], gifts: [] }
}

export function newId(): string {
  return crypto.randomUUID()
}

// ---------- Recipient grouping ----------

export interface RecipientEntry {
  person: Person
  gifts: Gift[]
  ideas: Idea[]
}

export interface RecipientGroups {
  needsShopping: RecipientEntry[]
  planned: RecipientEntry[]
  bought: RecipientEntry[]
  given: RecipientEntry[]
}

/** The group a recipient belongs to, given their gifts for one occasion. */
export function groupFor(gifts: Gift[]): keyof RecipientGroups {
  if (gifts.length === 0) return 'needsShopping'
  if (gifts.some((g) => g.status === 'planned')) return 'planned'
  if (gifts.some((g) => g.status === 'bought')) return 'bought'
  return 'given'
}

export function groupRecipients(data: AppData, occasionId: string): RecipientGroups {
  const groups: RecipientGroups = { needsShopping: [], planned: [], bought: [], given: [] }
  const occasion = data.occasions.find((o) => o.id === occasionId)
  if (!occasion) return groups
  for (const personId of occasion.recipientIds) {
    const person = data.people.find((p) => p.id === personId)
    if (!person) continue
    const gifts = data.gifts.filter((g) => g.occasionId === occasionId && g.personId === personId)
    const ideas = data.ideas.filter((i) => i.personId === personId)
    const key = groupFor(gifts)
    groups[key].push({ person, gifts, ideas: key === 'bought' || key === 'given' ? [] : ideas })
  }
  return groups
}

// ---------- Totals ----------

export function totalPrice(gifts: Gift[]): number {
  return gifts.reduce((sum, g) => sum + (g.price ?? 0), 0)
}

export function occasionTotal(data: AppData, occasionId: string): number {
  return totalPrice(data.gifts.filter((g) => g.occasionId === occasionId))
}

export function plannedTotal(data: AppData): number {
  return totalPrice(data.gifts.filter((g) => g.status === 'planned'))
}

// ---------- To Buy ----------

export interface ToBuyGroup {
  occasion: Occasion
  gifts: { gift: Gift; person: Person | undefined; date: string }[]
  sortDate: string
}

export function toBuyGroups(data: AppData): ToBuyGroup[] {
  const groups: ToBuyGroup[] = []
  for (const occasion of data.occasions) {
    const gifts = data.gifts
      .filter((g) => g.occasionId === occasion.id && g.status === 'planned')
      .map((gift) => ({
        gift,
        person: data.people.find((p) => p.id === gift.personId),
        date: gift.giveDate ?? occasion.date,
      }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.gift.name.localeCompare(b.gift.name))
    const first = gifts[0]
    if (first) groups.push({ occasion, gifts, sortDate: first.date })
  }
  return groups.sort(
    (a, b) =>
      a.sortDate.localeCompare(b.sortDate) || a.occasion.name.localeCompare(b.occasion.name),
  )
}

// ---------- Occasions ordering ----------

export function splitOccasions(occasions: Occasion[], today: string) {
  const upcoming = occasions
    .filter((o) => o.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  const past = occasions.filter((o) => o.date < today).sort((a, b) => b.date.localeCompare(a.date))
  return { upcoming, past }
}

// ---------- Idea -> Gift ----------

/** Moves an idea into a planned gift for the occasion: creates the gift, deletes the idea. */
export function convertIdeaToGift(
  data: AppData,
  ideaId: string,
  occasionId: string,
  giftId: string = newId(),
): AppData {
  const idea = data.ideas.find((i) => i.id === ideaId)
  if (!idea) return data
  const gift: Gift = {
    id: giftId,
    personId: idea.personId,
    occasionId,
    name: idea.name,
    status: 'planned',
    ...(idea.link !== undefined && { link: idea.link }),
    ...(idea.price !== undefined && { price: idea.price }),
  }
  return {
    ...data,
    ideas: data.ideas.filter((i) => i.id !== ideaId),
    gifts: [...data.gifts, gift],
  }
}

// ---------- Duplicate occasion ----------

/** Copies recipients (not gifts) into a new occasion with the given name and date. */
export function duplicateOccasion(
  data: AppData,
  occasionId: string,
  name: string,
  date: string,
  newOccasionId: string = newId(),
): AppData {
  const source = data.occasions.find((o) => o.id === occasionId)
  if (!source) return data
  const copy: Occasion = { id: newOccasionId, name, date, recipientIds: [...source.recipientIds] }
  return { ...data, occasions: [...data.occasions, copy] }
}

// ---------- Cascading deletes ----------

export function deletePerson(data: AppData, personId: string): AppData {
  return {
    people: data.people.filter((p) => p.id !== personId),
    ideas: data.ideas.filter((i) => i.personId !== personId),
    gifts: data.gifts.filter((g) => g.personId !== personId),
    occasions: data.occasions.map((o) => ({
      ...o,
      recipientIds: o.recipientIds.filter((id) => id !== personId),
    })),
  }
}

export function deleteOccasion(data: AppData, occasionId: string): AppData {
  return {
    ...data,
    occasions: data.occasions.filter((o) => o.id !== occasionId),
    gifts: data.gifts.filter((g) => g.occasionId !== occasionId),
  }
}

export function removeRecipient(data: AppData, occasionId: string, personId: string): AppData {
  return {
    ...data,
    occasions: data.occasions.map((o) =>
      o.id === occasionId
        ? { ...o, recipientIds: o.recipientIds.filter((id) => id !== personId) }
        : o,
    ),
    gifts: data.gifts.filter((g) => !(g.occasionId === occasionId && g.personId === personId)),
  }
}

/** Counts used to word cascade-delete confirm dialogs. */
export function personDeleteImpact(data: AppData, personId: string) {
  return {
    ideas: data.ideas.filter((i) => i.personId === personId).length,
    gifts: data.gifts.filter((g) => g.personId === personId).length,
    occasions: data.occasions.filter((o) => o.recipientIds.includes(personId)).length,
  }
}

// ---------- Birthdays ----------

/** Next occurrence (today or later) of a month/day, as ISO date. Feb 29 falls back to Feb 28 in non-leap years. */
export function nextBirthdayDate(birthday: { month: number; day: number }, today: string): string {
  const startYear = parseIsoDate(today).getFullYear()
  for (const year of [startYear, startYear + 1]) {
    const iso = birthdayInYear(birthday, year)
    if (iso >= today) return iso
  }
  return birthdayInYear(birthday, startYear + 1)
}

function birthdayInYear(b: { month: number; day: number }, year: number): string {
  const date = new Date(year, b.month - 1, b.day)
  if (date.getMonth() !== b.month - 1) return toIsoDate(new Date(year, b.month - 1, b.day - 1))
  return toIsoDate(date)
}

// ---------- Import / export ----------

export function buildExport(data: AppData): ExportFile {
  return {
    version: 1,
    people: data.people,
    occasions: data.occasions,
    ideas: data.ideas,
    gifts: data.gifts,
  }
}

export type ImportResult = { ok: true; data: AppData } | { ok: false; error: string }

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string'
const isOptStr = (v: unknown) => v === undefined || typeof v === 'string'
const isOptNum = (v: unknown) => v === undefined || (typeof v === 'number' && Number.isFinite(v))
const isIso = (v: unknown): v is string => isStr(v) && /^\d{4}-\d{2}-\d{2}$/.test(v)
const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max

function validBirthday(b: unknown): boolean {
  if (b === undefined) return true
  if (!isObj(b)) return false
  return (
    isInt(b.month, 1, 12) &&
    isInt(b.day, 1, 31) &&
    (b.year === undefined || (typeof b.year === 'number' && Number.isInteger(b.year)))
  )
}

export function validateImport(raw: unknown): ImportResult {
  const fail = (error: string): ImportResult => ({ ok: false, error })
  if (!isObj(raw)) return fail('File is not a Gift Tracker export.')
  if (raw.version !== 1) return fail(`Unsupported version: ${String(raw.version)}.`)
  for (const key of ['people', 'occasions', 'ideas', 'gifts'] as const) {
    if (!Array.isArray(raw[key])) return fail(`Missing or invalid "${key}" list.`)
  }
  const people = raw.people as unknown[]
  const occasions = raw.occasions as unknown[]
  const ideas = raw.ideas as unknown[]
  const gifts = raw.gifts as unknown[]

  for (const p of people) {
    if (!isObj(p) || !isStr(p.id) || !isStr(p.name) || !validBirthday(p.birthday))
      return fail('A person entry is invalid.')
  }
  for (const o of occasions) {
    if (
      !isObj(o) ||
      !isStr(o.id) ||
      !isStr(o.name) ||
      !isIso(o.date) ||
      !Array.isArray(o.recipientIds) ||
      !o.recipientIds.every(isStr)
    )
      return fail('An occasion entry is invalid.')
  }
  for (const i of ideas) {
    if (
      !isObj(i) ||
      !isStr(i.id) ||
      !isStr(i.personId) ||
      !isStr(i.name) ||
      !isOptStr(i.link) ||
      !isOptNum(i.price)
    )
      return fail('An idea entry is invalid.')
  }
  for (const g of gifts) {
    if (
      !isObj(g) ||
      !isStr(g.id) ||
      !isStr(g.personId) ||
      !isStr(g.occasionId) ||
      !isStr(g.name) ||
      !isOptStr(g.link) ||
      !isOptNum(g.price) ||
      !(g.giveDate === undefined || isIso(g.giveDate)) ||
      !(g.status === 'planned' || g.status === 'bought' || g.status === 'given')
    )
      return fail('A gift entry is invalid.')
  }

  const data = { people, occasions, ideas, gifts } as AppData
  const personIds = new Set(data.people.map((p) => p.id))
  const occasionIds = new Set(data.occasions.map((o) => o.id))
  if (data.ideas.some((i) => !personIds.has(i.personId)))
    return fail('An idea refers to a person that does not exist.')
  if (data.gifts.some((g) => !personIds.has(g.personId) || !occasionIds.has(g.occasionId)))
    return fail('A gift refers to a person or occasion that does not exist.')
  if (data.occasions.some((o) => o.recipientIds.some((id) => !personIds.has(id))))
    return fail('An occasion refers to a person that does not exist.')
  return { ok: true, data }
}

export function parseImportText(text: string): ImportResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'File is not valid JSON.' }
  }
  return validateImport(raw)
}

export function setGiftStatus(data: AppData, giftId: string, status: GiftStatus): AppData {
  return { ...data, gifts: data.gifts.map((g) => (g.id === giftId ? { ...g, status } : g)) }
}
