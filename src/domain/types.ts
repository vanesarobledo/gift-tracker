export interface Birthday {
  month: number // 1-12
  day: number // 1-31
  year?: number // often unknown
}

export interface Person {
  id: string
  name: string
  birthday?: Birthday
}

export interface Occasion {
  id: string
  name: string // free text, e.g. "Christmas 2026"
  date: string // ISO date (YYYY-MM-DD)
  recipientIds: string[]
}

export interface Idea {
  id: string
  personId: string
  name: string
  link?: string
  price?: number // estimate
}

export type GiftStatus = 'planned' | 'bought' | 'given'

export const GIFT_STATUSES: readonly GiftStatus[] = ['planned', 'bought', 'given']

export interface Gift {
  id: string
  personId: string
  occasionId: string
  name: string
  link?: string
  price?: number
  giveDate?: string // ISO date; when handed over on a different day than the occasion
  status: GiftStatus
}

/** The whole app state. Everything else is derived from this. */
export interface AppData {
  people: Person[]
  occasions: Occasion[]
  ideas: Idea[]
  gifts: Gift[]
}

/** Fields the user edits for an idea or gift (no ids/relations). */
export interface ItemFields {
  name: string
  link?: string
  price?: number
}

export function emptyData(): AppData {
  return { people: [], occasions: [], ideas: [], gifts: [] }
}

export function newId(): string {
  return crypto.randomUUID()
}
