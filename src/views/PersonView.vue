<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppModal from '@/components/AppModal.vue'
import GiftItem from '@/components/GiftItem.vue'
import IdeaItem from '@/components/IdeaItem.vue'
import ItemForm, { type ItemFormValue } from '@/components/ItemForm.vue'
import OccasionForm from '@/components/OccasionForm.vue'
import PersonForm from '@/components/PersonForm.vue'
import { formatBirthday, formatDate, nextBirthdayDate } from '@/domain/dates'
import { birthdayOccasionName } from '@/domain/occasions'
import { formatCAD, plural, sumPrices } from '@/domain/totals'
import type { Person } from '@/domain/types'
import { useGiftStore } from '@/stores/gifts'
import NotFoundView from './NotFoundView.vue'

const props = defineProps<{ id: string }>()

const store = useGiftStore()
const router = useRouter()

type Modal = 'edit' | 'birthday' | null
const modal = ref<Modal>(null)
const addingIdea = ref(false)

const person = computed(() => store.peopleById.get(props.id))
const ideas = computed(() => store.ideasFor(props.id))

/** Gifts grouped by occasion, most recent occasion first. */
const history = computed(() => {
  const gifts = store.data.gifts.filter((g) => g.personId === props.id)
  return store.data.occasions
    .filter((o) => o.recipientIds.includes(props.id))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((occasion) => {
      const occasionGifts = gifts.filter((g) => g.occasionId === occasion.id)
      return { occasion, gifts: occasionGifts, total: sumPrices(occasionGifts) }
    })
})

const birthdayDefaults = computed(() =>
  person.value?.birthday
    ? { name: birthdayOccasionName(person.value), date: nextBirthdayDate(person.value.birthday) }
    : undefined,
)

function save(fields: Omit<Person, 'id'>) {
  store.updatePerson(props.id, fields)
  modal.value = null
}

function createBirthdayOccasion(fields: { name: string; date: string }) {
  const occasion = store.addOccasion({ ...fields, recipientIds: [props.id] })
  modal.value = null
  router.push({ name: 'occasion', params: { id: occasion.id } })
}

function addIdea(fields: ItemFormValue) {
  store.addIdea(props.id, fields)
  addingIdea.value = false
}

function remove() {
  if (!person.value) return
  const impact = store.personDeletionImpact(props.id)
  const lost = [
    impact.ideas && plural(impact.ideas, 'idea'),
    impact.gifts && plural(impact.gifts, 'gift'),
  ].filter(Boolean)
  const parts = [
    lost.length ? `Their ${lost.join(' and ')} will be deleted.` : '',
    impact.occasions ? `They'll be removed from ${plural(impact.occasions, 'occasion')}.` : '',
  ].filter(Boolean)
  if (confirm(`Delete ${person.value.name}? ${parts.join(' ')}`.trim())) {
    store.deletePerson(props.id)
    router.push({ name: 'people' })
  }
}
</script>

<template>
  <NotFoundView v-if="!person" message="This person doesn't exist." />
  <div v-else class="space-y-8">
    <div>
      <RouterLink :to="{ name: 'people' }" class="text-sm text-stone-500 hover:underline"
        >← People</RouterLink
      >
      <h1 class="page-title mt-1">{{ person.name }}</h1>
      <p v-if="person.birthday" class="text-stone-600">
        Birthday: {{ formatBirthday(person.birthday) }}
      </p>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-if="person.birthday"
          type="button"
          class="btn btn-primary"
          @click="modal = 'birthday'"
        >
          Create birthday occasion
        </button>
        <button type="button" class="btn" @click="modal = 'edit'">Edit</button>
        <button type="button" class="btn btn-danger" @click="remove">Delete</button>
      </div>
    </div>

    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="section-title">Ideas</h2>
        <button v-if="!addingIdea" type="button" class="btn btn-sm" @click="addingIdea = true">
          + Idea
        </button>
      </div>
      <div class="card">
        <div v-if="addingIdea" class="mb-2 rounded-lg bg-stone-50 p-3">
          <ItemForm submit-label="Add idea" @submit="addIdea" @cancel="addingIdea = false" />
        </div>
        <ul v-if="ideas.length" class="divide-y divide-stone-100">
          <IdeaItem v-for="idea in ideas" :key="idea.id" :idea="idea" />
        </ul>
        <p v-else-if="!addingIdea" class="text-sm text-stone-500">
          No ideas yet. Jot one down whenever inspiration strikes.
        </p>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="section-title">Gift history</h2>
      <p v-if="!history.length" class="card text-sm text-stone-500">
        {{ person.name }} isn't a recipient of any occasion yet.
      </p>
      <article v-for="h in history" :key="h.occasion.id" class="card">
        <header class="flex items-baseline justify-between gap-2">
          <RouterLink
            :to="{ name: 'occasion', params: { id: h.occasion.id } }"
            class="font-semibold hover:underline"
            >{{ h.occasion.name }}</RouterLink
          >
          <span class="text-sm text-stone-600">{{ formatDate(h.occasion.date) }}</span>
        </header>
        <ul v-if="h.gifts.length" class="divide-y divide-stone-100">
          <GiftItem v-for="gift in h.gifts" :key="gift.id" :gift="gift" />
        </ul>
        <p v-else class="mt-1 text-sm text-rose-800">Needs shopping</p>
        <p v-if="h.gifts.length > 1" class="text-right text-sm text-stone-600 tabular-nums">
          Total {{ formatCAD(h.total) }}
        </p>
      </article>
    </section>

    <AppModal :open="modal === 'edit'" title="Edit person" @close="modal = null">
      <PersonForm :initial="person" @submit="save" @cancel="modal = null" />
    </AppModal>
    <AppModal :open="modal === 'birthday'" title="Create birthday occasion" @close="modal = null">
      <OccasionForm
        :initial="birthdayDefaults"
        submit-label="Create occasion"
        :hint="`${person.name} will be the only recipient.`"
        @submit="createBirthdayOccasion"
        @cancel="modal = null"
      />
    </AppModal>
  </div>
</template>
