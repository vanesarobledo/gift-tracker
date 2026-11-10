export interface Person {
  id: string
  name: string
  birthday?: { month: number; day: number; year?: number } // year is often unknown
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

export interface Gift {
  id: string
  personId: string
  occasionId: string
  name: string
  link?: string
  price?: number
  giveDate?: string // ISO date; for when I hand it over on a different day than the occasion
  status: GiftStatus
}

export interface AppData {
  people: Person[]
  occasions: Occasion[]
  ideas: Idea[]
  gifts: Gift[]
}

export interface ExportFile extends AppData {
  version: 1
}

export const GIFT_STATUSES: GiftStatus[] = ['planned', 'bought', 'given']
