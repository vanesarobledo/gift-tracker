import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { AppData, Gift, GiftStatus, Idea, Occasion, Person } from '@/domain/types'
import {
  buildExport,
  convertIdeaToGift,
  deleteOccasion,
  deletePerson,
  duplicateOccasion,
  emptyData,
  newId,
  parseImportText,
  removeRecipient,
  setGiftStatus,
  type ImportResult,
} from '@/domain/logic'

export const STORAGE_KEY = 'gift-tracker:v1'

function load(): AppData {
  try {
    const text = localStorage.getItem(STORAGE_KEY)
    if (!text) return emptyData()
    const result = parseImportText(text)
    return result.ok ? result.data : emptyData()
  } catch {
    return emptyData()
  }
}

export const useDataStore = defineStore('data', () => {
  const data = ref<AppData>(load())

  watch(
    data,
    (value) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(buildExport(value)))
      } catch {
        // storage full or unavailable; keep working in memory
      }
    },
    { deep: true },
  )

  const person = (id: string) => data.value.people.find((p) => p.id === id)
  const occasion = (id: string) => data.value.occasions.find((o) => o.id === id)

  // People
  function addPerson(input: Omit<Person, 'id'>): Person {
    const p: Person = { id: newId(), ...input }
    data.value.people.push(p)
    return p
  }
  function updatePerson(id: string, input: Omit<Person, 'id'>) {
    const p = person(id)
    if (!p) return
    p.name = input.name
    if (input.birthday) p.birthday = input.birthday
    else delete p.birthday
  }
  function removePerson(id: string) {
    data.value = deletePerson(data.value, id)
  }

  // Occasions
  function addOccasion(input: { name: string; date: string; recipientIds?: string[] }): Occasion {
    const o: Occasion = {
      id: newId(),
      name: input.name,
      date: input.date,
      recipientIds: input.recipientIds ?? [],
    }
    data.value.occasions.push(o)
    return o
  }
  function updateOccasion(id: string, input: { name: string; date: string }) {
    const o = occasion(id)
    if (!o) return
    o.name = input.name
    o.date = input.date
  }
  function removeOccasion(id: string) {
    data.value = deleteOccasion(data.value, id)
  }
  function duplicate(id: string, name: string, date: string): string {
    const newOccasionId = newId()
    data.value = duplicateOccasion(data.value, id, name, date, newOccasionId)
    return newOccasionId
  }
  function addRecipient(occasionId: string, personId: string) {
    const o = occasion(occasionId)
    if (o && !o.recipientIds.includes(personId)) o.recipientIds.push(personId)
  }
  function dropRecipient(occasionId: string, personId: string) {
    data.value = removeRecipient(data.value, occasionId, personId)
  }

  // Ideas
  function addIdea(input: Omit<Idea, 'id'>) {
    data.value.ideas.push({ id: newId(), ...input })
  }
  function updateIdea(id: string, input: Omit<Idea, 'id' | 'personId'>) {
    const i = data.value.ideas.find((x) => x.id === id)
    if (!i) return
    delete i.link
    delete i.price
    Object.assign(i, input)
  }
  function removeIdea(id: string) {
    data.value.ideas = data.value.ideas.filter((i) => i.id !== id)
  }
  function ideaToGift(ideaId: string, occasionId: string) {
    data.value = convertIdeaToGift(data.value, ideaId, occasionId)
  }

  // Gifts
  function addGift(input: Omit<Gift, 'id' | 'status'>) {
    data.value.gifts.push({ id: newId(), status: 'planned', ...input })
  }
  function updateGift(id: string, input: Pick<Gift, 'name' | 'link' | 'price' | 'giveDate'>) {
    const g = data.value.gifts.find((x) => x.id === id)
    if (!g) return
    delete g.link
    delete g.price
    delete g.giveDate
    Object.assign(g, input)
  }
  function setStatus(id: string, status: GiftStatus) {
    data.value = setGiftStatus(data.value, id, status)
  }
  function removeGift(id: string) {
    data.value.gifts = data.value.gifts.filter((g) => g.id !== id)
  }

  // Import / export
  function exportJson(): string {
    return JSON.stringify(buildExport(data.value), null, 2)
  }
  function importJson(text: string): ImportResult {
    const result = parseImportText(text)
    if (result.ok) data.value = result.data
    return result
  }

  return {
    data,
    person,
    occasion,
    addPerson,
    updatePerson,
    removePerson,
    addOccasion,
    updateOccasion,
    removeOccasion,
    duplicate,
    addRecipient,
    dropRecipient,
    addIdea,
    updateIdea,
    removeIdea,
    ideaToGift,
    addGift,
    updateGift,
    setStatus,
    removeGift,
    exportJson,
    importJson,
  }
})
