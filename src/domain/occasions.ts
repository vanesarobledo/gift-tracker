import { todayISO } from './dates'
import type { Occasion, Person } from './types'

/**
 * Split occasions for the home page. Upcoming ones (today included) are listed
 * soonest first, and past ones most recent first.
 */
export function splitOccasions(
  occasions: readonly Occasion[],
  today: string = todayISO(),
): { upcoming: Occasion[]; past: Occasion[] } {
  const upcoming = occasions.filter((o) => o.date >= today)
  const past = occasions.filter((o) => o.date < today)
  upcoming.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name))
  past.sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name))
  return { upcoming, past }
}

export function birthdayOccasionName(person: Person): string {
  return `${person.name}'s birthday`
}

export function sortByName<T extends { name: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}
