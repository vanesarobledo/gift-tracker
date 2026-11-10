import { isValidBirthday, isValidISODate } from './dates'
import {
  GIFT_STATUSES,
  type AppData,
  type Birthday,
  type Gift,
  type GiftStatus,
  type Idea,
  type Occasion,
  type Person,
} from './types'

export const CURRENT_VERSION = 1

export interface ExportFile extends AppData {
  version: typeof CURRENT_VERSION
}

export function toExportFile(data: AppData): ExportFile {
  return { version: CURRENT_VERSION, ...data }
}

export function exportFileName(today: string): string {
  return `gift-tracker-${today}.json`
}

export type ParseResult = { ok: true; data: AppData } | { ok: false; error: string }

class ValidationError extends Error {}

type Obj = Record<string, unknown>

function fail(message: string): never {
  throw new ValidationError(message)
}

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function str(o: Obj, key: string, where: string): string {
  const v = o[key]
  if (typeof v !== 'string' || v.trim() === '')
    fail(`${where}: "${key}" must be a non-empty string`)
  return v
}

function optStr(o: Obj, key: string, where: string): string | undefined {
  const v = o[key]
  if (v === undefined) return undefined
  if (typeof v !== 'string') fail(`${where}: "${key}" must be a string`)
  return v
}

function optPrice(o: Obj, where: string): number | undefined {
  const v = o.price
  if (v === undefined) return undefined
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
    fail(`${where}: "price" must be a non-negative number`)
  }
  return v
}

function date(o: Obj, key: string, where: string, optional: true): string | undefined
function date(o: Obj, key: string, where: string, optional?: false): string
function date(o: Obj, key: string, where: string, optional = false): string | undefined {
  const v = o[key]
  if (v === undefined && optional) return undefined
  if (!isValidISODate(v)) fail(`${where}: "${key}" must be a date in YYYY-MM-DD format`)
  return v
}

function array(root: Obj, key: string): Obj[] {
  const v = root[key]
  if (!Array.isArray(v)) fail(`"${key}" must be a list`)
  return v.map((item, i) => (isObj(item) ? item : fail(`${key}[${i}] must be an object`)))
}

/** Build objects field by field so unknown properties are dropped. */
function withOptional<T extends object>(base: T, extras: Record<string, unknown>): T {
  for (const [k, v] of Object.entries(extras)) {
    if (v !== undefined) (base as Record<string, unknown>)[k] = v
  }
  return base
}

function parsePerson(o: Obj, i: number): Person {
  const where = `people[${i}]`
  const person: Person = { id: str(o, 'id', where), name: str(o, 'name', where) }
  if (o.birthday !== undefined) {
    const b = o.birthday
    if (!isObj(b)) fail(`${where}: "birthday" must be an object`)
    const birthday = withOptional<Birthday>(
      { month: b.month as number, day: b.day as number },
      { year: b.year },
    )
    if (!isValidBirthday(birthday)) fail(`${where}: "birthday" is not a valid date`)
    person.birthday = birthday
  }
  return person
}

function parseOccasion(o: Obj, i: number): Occasion {
  const where = `occasions[${i}]`
  const ids = o.recipientIds
  if (!Array.isArray(ids) || !ids.every((r) => typeof r === 'string')) {
    fail(`${where}: "recipientIds" must be a list of ids`)
  }
  return {
    id: str(o, 'id', where),
    name: str(o, 'name', where),
    date: date(o, 'date', where),
    recipientIds: [...new Set(ids as string[])],
  }
}

function parseIdea(o: Obj, i: number): Idea {
  const where = `ideas[${i}]`
  return withOptional<Idea>(
    { id: str(o, 'id', where), personId: str(o, 'personId', where), name: str(o, 'name', where) },
    { link: optStr(o, 'link', where), price: optPrice(o, where) },
  )
}

function parseGift(o: Obj, i: number): Gift {
  const where = `gifts[${i}]`
  if (!GIFT_STATUSES.includes(o.status as GiftStatus)) {
    fail(`${where}: "status" must be one of ${GIFT_STATUSES.join(', ')}`)
  }
  return withOptional<Gift>(
    {
      id: str(o, 'id', where),
      personId: str(o, 'personId', where),
      occasionId: str(o, 'occasionId', where),
      name: str(o, 'name', where),
      status: o.status as GiftStatus,
    },
    {
      link: optStr(o, 'link', where),
      price: optPrice(o, where),
      giveDate: date(o, 'giveDate', where, true),
    },
  )
}

function checkUniqueIds(items: { id: string }[], kind: string) {
  const seen = new Set<string>()
  for (const { id } of items) {
    if (seen.has(id)) fail(`Duplicate ${kind} id "${id}"`)
    seen.add(id)
  }
}

function checkReferences(data: AppData) {
  const people = new Set(data.people.map((p) => p.id))
  const occasions = new Map(data.occasions.map((o) => [o.id, o]))

  for (const o of data.occasions) {
    for (const r of o.recipientIds) {
      if (!people.has(r)) fail(`Occasion "${o.name}" lists an unknown recipient "${r}"`)
    }
  }
  for (const idea of data.ideas) {
    if (!people.has(idea.personId)) fail(`Idea "${idea.name}" belongs to an unknown person`)
  }
  for (const g of data.gifts) {
    if (!people.has(g.personId)) fail(`Gift "${g.name}" belongs to an unknown person`)
    const occasion = occasions.get(g.occasionId)
    if (!occasion) fail(`Gift "${g.name}" belongs to an unknown occasion`)
    if (!occasion.recipientIds.includes(g.personId)) {
      fail(`Gift "${g.name}" is for someone who isn't a recipient of "${occasion.name}"`)
    }
  }
}

/** Validate a parsed export object and return clean AppData. */
export function validateExport(raw: unknown): ParseResult {
  try {
    if (!isObj(raw)) fail('The file does not contain a Gift Tracker export')
    if (raw.version !== CURRENT_VERSION) {
      fail(`Unsupported export version: ${JSON.stringify(raw.version)}`)
    }
    const data: AppData = {
      people: array(raw, 'people').map(parsePerson),
      occasions: array(raw, 'occasions').map(parseOccasion),
      ideas: array(raw, 'ideas').map(parseIdea),
      gifts: array(raw, 'gifts').map(parseGift),
    }
    checkUniqueIds(data.people, 'person')
    checkUniqueIds(data.occasions, 'occasion')
    checkUniqueIds(data.ideas, 'idea')
    checkUniqueIds(data.gifts, 'gift')
    checkReferences(data)
    return { ok: true, data }
  } catch (e) {
    if (e instanceof ValidationError) return { ok: false, error: e.message }
    throw e
  }
}

/** Parse the text of an export file. */
export function parseExport(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'The file is not valid JSON' }
  }
  return validateExport(raw)
}
