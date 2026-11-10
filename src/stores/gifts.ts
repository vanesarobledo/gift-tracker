import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import * as ops from '@/domain/operations'
import type { AppData, GiftStatus, ItemFields, Occasion, Person } from '@/domain/types'
import { loadData, saveData } from './storage'

/**
 * Thin reactive wrapper over the pure domain operations. Every change replaces
 * `data` with a new object, and the watcher saves it to localStorage.
 */
export const useGiftStore = defineStore('gifts', () => {
  const data = ref<AppData>(loadData())

  watch(data, (value) => saveData(value), { deep: true })

  const peopleById = computed(() => new Map(data.value.people.map((p) => [p.id, p])))
  const occasionsById = computed(() => new Map(data.value.occasions.map((o) => [o.id, o])))

  const ideasFor = (personId: string) => data.value.ideas.filter((i) => i.personId === personId)

  function apply(next: AppData) {
    data.value = next
  }

  return {
    data,
    peopleById,
    occasionsById,
    ideasFor,

    replaceAll: (next: AppData) => apply(next),

    addPerson(fields: Omit<Person, 'id'>): Person {
      const [next, person] = ops.addPerson(data.value, fields)
      apply(next)
      return person
    },
    updatePerson: (id: string, fields: Omit<Person, 'id'>) =>
      apply(ops.updatePerson(data.value, id, fields)),
    deletePerson: (id: string) => apply(ops.deletePerson(data.value, id)),
    personDeletionImpact: (id: string) => ops.personDeletionImpact(data.value, id),

    addOccasion(fields: Omit<Occasion, 'id'>): Occasion {
      const [next, occasion] = ops.addOccasion(data.value, fields)
      apply(next)
      return occasion
    },
    updateOccasion: (id: string, fields: Pick<Occasion, 'name' | 'date'>) =>
      apply(ops.updateOccasion(data.value, id, fields)),
    deleteOccasion: (id: string) => apply(ops.deleteOccasion(data.value, id)),
    occasionDeletionImpact: (id: string) => ops.occasionDeletionImpact(data.value, id),
    duplicateOccasion(id: string, fields: Pick<Occasion, 'name' | 'date'>): Occasion {
      const [next, occasion] = ops.duplicateOccasion(data.value, id, fields)
      apply(next)
      return occasion
    },
    addRecipient: (occasionId: string, personId: string) =>
      apply(ops.addRecipient(data.value, occasionId, personId)),
    removeRecipient: (occasionId: string, personId: string) =>
      apply(ops.removeRecipient(data.value, occasionId, personId)),
    recipientRemovalImpact: (occasionId: string, personId: string) =>
      ops.recipientRemovalImpact(data.value, occasionId, personId),

    addIdea: (personId: string, fields: ItemFields) =>
      apply(ops.addIdea(data.value, personId, fields)),
    updateIdea: (id: string, fields: ItemFields) => apply(ops.updateIdea(data.value, id, fields)),
    deleteIdea: (id: string) => apply(ops.deleteIdea(data.value, id)),
    convertIdeaToGift(ideaId: string, occasionId: string) {
      apply(ops.convertIdeaToGift(data.value, ideaId, occasionId)[0])
    },

    addGift: (occasionId: string, personId: string, fields: ops.GiftFields) =>
      apply(ops.addGift(data.value, occasionId, personId, fields)),
    updateGift: (id: string, fields: ops.GiftFields) =>
      apply(ops.updateGift(data.value, id, fields)),
    setGiftStatus: (id: string, status: GiftStatus) =>
      apply(ops.setGiftStatus(data.value, id, status)),
    deleteGift: (id: string) => apply(ops.deleteGift(data.value, id)),
  }
})
