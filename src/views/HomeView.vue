<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import { splitOccasions } from '@/domain/logic'
import { formatDate, todayIso } from '@/domain/format'
import OccasionForm from '@/components/OccasionForm.vue'

const store = useDataStore()
const router = useRouter()
const adding = ref(false)

const groups = computed(() => splitOccasions(store.data.occasions, todayIso()))

function create(v: { name: string; date: string }) {
  const o = store.addOccasion(v)
  adding.value = false
  router.push({ name: 'occasion', params: { id: o.id } })
}
</script>

<template>
  <main class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Occasions</h1>
      <button v-if="!adding" class="btn btn-primary" @click="adding = true">+ New occasion</button>
    </div>

    <div v-if="adding" class="card">
      <OccasionForm submit-label="Create" @submit="create" @cancel="adding = false" />
    </div>

    <p v-if="!store.data.occasions.length && !adding" class="text-stone-600">
      No occasions yet. Create one, then add the people you're shopping for.
    </p>

    <ul class="flex flex-col gap-2">
      <li v-for="o in groups.upcoming" :key="o.id">
        <RouterLink
          :to="{ name: 'occasion', params: { id: o.id } }"
          class="card block hover:border-emerald-400"
        >
          <span class="font-medium">{{ o.name }}</span>
          <span class="block text-sm text-stone-600">
            {{ formatDate(o.date) }} · {{ o.recipientIds.length }} recipient{{
              o.recipientIds.length === 1 ? '' : 's'
            }}
          </span>
        </RouterLink>
      </li>
    </ul>

    <details v-if="groups.past.length" class="card">
      <summary class="cursor-pointer font-medium">
        Past occasions ({{ groups.past.length }})
      </summary>
      <ul class="mt-3 flex flex-col gap-2">
        <li v-for="o in groups.past" :key="o.id">
          <RouterLink
            :to="{ name: 'occasion', params: { id: o.id } }"
            class="block rounded-md border border-stone-200 p-3 hover:border-emerald-400"
          >
            <span class="font-medium">{{ o.name }}</span>
            <span class="block text-sm text-stone-600">{{ formatDate(o.date) }}</span>
          </RouterLink>
        </li>
      </ul>
    </details>
  </main>
</template>
