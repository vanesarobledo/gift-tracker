<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppModal from '@/components/AppModal.vue'
import PersonForm from '@/components/PersonForm.vue'
import { formatBirthday } from '@/domain/dates'
import { sortByName } from '@/domain/occasions'
import { plural } from '@/domain/totals'
import type { Person } from '@/domain/types'
import { useGiftStore } from '@/stores/gifts'

const store = useGiftStore()
const creating = ref(false)

const people = computed(() =>
  sortByName(store.data.people).map((person) => ({
    person,
    ideas: store.data.ideas.filter((i) => i.personId === person.id).length,
  })),
)

function create(fields: Omit<Person, 'id'>) {
  store.addPerson(fields)
  creating.value = false
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-2">
      <h1 class="page-title">People</h1>
      <button type="button" class="btn btn-primary" @click="creating = true">+ New person</button>
    </div>

    <p v-if="!people.length" class="card text-stone-600">
      No people yet. Add someone you give gifts to.
    </p>
    <ul
      v-else
      class="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white"
    >
      <li v-for="{ person, ideas } in people" :key="person.id">
        <RouterLink
          :to="{ name: 'person', params: { id: person.id } }"
          class="flex items-baseline justify-between gap-2 px-4 py-3 hover:bg-stone-50"
        >
          <span>
            <span class="font-medium">{{ person.name }}</span>
            <span v-if="person.birthday" class="ml-2 text-sm text-stone-500"
              >🎂 {{ formatBirthday(person.birthday) }}</span
            >
          </span>
          <span v-if="ideas" class="shrink-0 text-sm text-stone-500">{{
            plural(ideas, 'idea')
          }}</span>
        </RouterLink>
      </li>
    </ul>

    <AppModal :open="creating" title="New person" @close="creating = false">
      <PersonForm submit-label="Add person" @submit="create" @cancel="creating = false" />
    </AppModal>
  </div>
</template>
