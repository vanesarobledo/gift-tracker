import { beforeEach, describe, expect, it } from 'vitest'
import { emptyData } from '@/domain/types'
import { sampleData } from '@/domain/__tests__/fixtures'
import { loadData, saveData, STORAGE_KEY } from '../storage'

/** Minimal in-memory Storage so tests don't depend on the environment's localStorage. */
class MemoryStorage implements Storage {
  private items = new Map<string, string>()
  get length() {
    return this.items.size
  }
  clear() {
    this.items.clear()
  }
  getItem(key: string) {
    return this.items.get(key) ?? null
  }
  key(index: number) {
    return [...this.items.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.items.delete(key)
  }
  setItem(key: string, value: string) {
    this.items.set(key, value)
  }
  keys() {
    return [...this.items.keys()]
  }
}

describe('storage', () => {
  let storage: MemoryStorage
  beforeEach(() => {
    storage = new MemoryStorage()
  })

  it('starts empty when nothing is saved', () => {
    expect(loadData(storage)).toEqual(emptyData())
  })

  it('round-trips saved data', () => {
    saveData(sampleData(), storage)
    expect(loadData(storage)).toEqual(sampleData())
  })

  it('starts empty but keeps a copy when saved data is corrupt', () => {
    const corrupt = '{"version":1,"people":"oops"}'
    storage.setItem(STORAGE_KEY, corrupt)
    expect(loadData(storage)).toEqual(emptyData())
    const backups = storage.keys().filter((k) => k.startsWith(`${STORAGE_KEY}:corrupt:`))
    expect(backups).toHaveLength(1)
    expect(storage.getItem(backups[0]!)).toBe(corrupt)
  })
})
