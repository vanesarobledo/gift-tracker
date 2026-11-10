import type { Gift, Occasion } from './types'

const cad = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })

export function formatCAD(amount: number): string {
  return cad.format(amount)
}

/** Sum of prices; gifts without a price count as zero. */
export function sumPrices(items: readonly { price?: number }[]): number {
  return items.reduce((sum, item) => sum + (item.price ?? 0), 0)
}

/** Total of every gift (planned + bought + given) for an occasion. */
export function occasionTotal(occasionId: string, gifts: readonly Gift[]): number {
  return sumPrices(gifts.filter((g) => g.occasionId === occasionId))
}

/** Total of every planned gift across all occasions (the To Buy total). */
export function plannedTotal(gifts: readonly Gift[]): number {
  return sumPrices(gifts.filter((g) => g.status === 'planned'))
}

/** The date a gift is actually needed by: its giveDate, else the occasion date. */
export function effectiveDate(gift: Gift, occasion: Occasion): string {
  return gift.giveDate ?? occasion.date
}

export interface ToBuyGroup {
  occasion: Occasion
  gifts: Gift[]
}

/**
 * Planned gifts grouped by occasion. Gifts within a group are sorted by their
 * effective date, and groups are sorted by their earliest gift's effective date.
 */
export function toBuyGroups(occasions: readonly Occasion[], gifts: readonly Gift[]): ToBuyGroup[] {
  const occasionsById = new Map(occasions.map((o) => [o.id, o]))
  const byOccasion = new Map<string, ToBuyGroup>()

  for (const gift of gifts) {
    if (gift.status !== 'planned') continue
    const occasion = occasionsById.get(gift.occasionId)
    if (!occasion) continue
    let group = byOccasion.get(occasion.id)
    if (!group) {
      group = { occasion, gifts: [] }
      byOccasion.set(occasion.id, group)
    }
    group.gifts.push(gift)
  }

  const groups = [...byOccasion.values()]
  for (const group of groups) {
    group.gifts.sort((a, b) =>
      effectiveDate(a, group.occasion).localeCompare(effectiveDate(b, group.occasion)),
    )
  }
  // Each group's gifts are already sorted, so gifts[0] is the earliest.
  return groups.sort((a, b) =>
    effectiveDate(a.gifts[0]!, a.occasion).localeCompare(effectiveDate(b.gifts[0]!, b.occasion)),
  )
}

/**
 * Parse a price typed by the user. Empty means "no price"; accepts "$24.99",
 * "1,200" and "24.5". Rounded to cents.
 */
export function parsePrice(input: string): number | undefined | 'invalid' {
  const cleaned = input.trim().replace(/^\$/, '').replace(/,/g, '')
  if (cleaned === '') return undefined
  if (!/^\d*\.?\d+$|^\d+\.$/.test(cleaned)) return 'invalid'
  return Math.round(Number(cleaned) * 100) / 100
}

export function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : pluralForm}`
}
