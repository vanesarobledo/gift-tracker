import { describe, expect, it } from 'vitest'
import { parseExport, toExportFile, validateExport, type ExportFile } from '../importExport'
import { sampleData } from './fixtures'

/** An export whose version can be broken, for building invalid files. */
type MutableExport = Omit<ExportFile, 'version'> & { version?: unknown }

function exportOf(mutate: (file: MutableExport) => void): unknown {
  const file: MutableExport = structuredClone(toExportFile(sampleData()))
  mutate(file)
  return file
}

describe('import validation', () => {
  it('round-trips an export', () => {
    const text = JSON.stringify(toExportFile(sampleData()))
    expect(parseExport(text)).toEqual({ ok: true, data: sampleData() })
  })

  it('rejects text that is not JSON', () => {
    expect(parseExport('not json')).toEqual({ ok: false, error: 'The file is not valid JSON' })
  })

  it.each([
    ['a non-object', () => []],
    ['a missing version', () => exportOf((f) => delete f.version)],
    ['an unknown version', () => exportOf((f) => (f.version = 2))],
    ['a missing collection', () => exportOf((f) => delete (f as Partial<typeof f>).gifts)],
    ['a person without a name', () => exportOf((f) => (f.people[0]!.name = ''))],
    ['an invalid birthday', () => exportOf((f) => (f.people[0]!.birthday = { month: 2, day: 30 }))],
    ['an invalid occasion date', () => exportOf((f) => (f.occasions[0]!.date = '2026-13-01'))],
    [
      'an invalid status',
      () => exportOf((f) => ((f.gifts[0] as { status: string }).status = 'lost')),
    ],
    ['a negative price', () => exportOf((f) => (f.gifts[0]!.price = -1))],
    ['a string price', () => exportOf((f) => ((f.ideas[0] as { price: unknown }).price = '25'))],
    ['a duplicate id', () => exportOf((f) => (f.people[1]!.id = 'finn'))],
    ['an unknown recipient', () => exportOf((f) => f.occasions[0]!.recipientIds.push('ghost'))],
    ['an idea for an unknown person', () => exportOf((f) => (f.ideas[0]!.personId = 'ghost'))],
    ['a gift for an unknown occasion', () => exportOf((f) => (f.gifts[0]!.occasionId = 'ghost'))],
    ['a gift for a non-recipient', () => exportOf((f) => (f.gifts[2]!.personId = 'finn'))],
  ])('rejects %s', (_label, make) => {
    const result = validateExport(make())
    expect(result).toEqual({ ok: false, error: expect.any(String) })
  })

  it('accepts a birthday without a year, including Feb 29', () => {
    const file = exportOf((f) => (f.people[0]!.birthday = { month: 2, day: 29 }))
    expect(validateExport(file).ok).toBe(true)
  })

  it('drops unknown properties', () => {
    const file = exportOf((f) => Object.assign(f.people[0]!, { notes: 'hi' }))
    const result = validateExport(file)
    // toEqual fails on extra properties, so this proves `notes` was dropped.
    expect(result.ok ? result.data.people[0] : null).toEqual(sampleData().people[0])
  })
})
