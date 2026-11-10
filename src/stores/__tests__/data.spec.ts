import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { STORAGE_KEY, useDataStore } from '../data'

describe('data store', () => {
  beforeEach(() => {
    // Node's own experimental localStorage can shadow jsdom's; use a plain in-memory stub.
    const backing = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => backing.get(k) ?? null,
      setItem: (k: string, v: string) => void backing.set(k, v),
      removeItem: (k: string) => void backing.delete(k),
      clear: () => backing.clear(),
    })
    setActivePinia(createPinia())
  })

  it('persists every change to localStorage and reloads it', async () => {
    const store = useDataStore()
    const p = store.addPerson({ name: 'Matthew' })
    const o = store.addOccasion({
      name: 'Christmas 2026',
      date: '2026-12-25',
      recipientIds: [p.id],
    })
    store.addGift({ personId: p.id, occasionId: o.id, name: 'Book', price: 12 })
    await nextTick()

    setActivePinia(createPinia())
    const reloaded = useDataStore()
    expect(reloaded.data.people).toHaveLength(1)
    expect(reloaded.data.gifts[0]).toMatchObject({ name: 'Book', status: 'planned' })
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).version).toBe(1)
  })

  it('leaves data untouched when an import is invalid', () => {
    const store = useDataStore()
    store.addPerson({ name: 'Keep me' })
    expect(store.importJson('{"version":1}').ok).toBe(false)
    expect(store.data.people).toHaveLength(1)
  })

  it('replaces data on a valid import', () => {
    const store = useDataStore()
    store.addPerson({ name: 'Old' })
    const text = JSON.stringify({ version: 1, people: [], occasions: [], ideas: [], gifts: [] })
    expect(store.importJson(text).ok).toBe(true)
    expect(store.data.people).toEqual([])
  })
})
