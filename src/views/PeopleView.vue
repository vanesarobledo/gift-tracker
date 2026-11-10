<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import { formatBirthday } from '@/domain/format'
import PersonForm from '@/components/PersonForm.vue'

const store = useDataStore()
const router = useRouter()
const adding = ref(false)

const sorted = computed(() => [...store.data.people].sort((a, b) => a.name.localeCompare(b.name)))

function create(v: Parameters<typeof store.addPerson>[0]) {
  const p = store.addPerson(v)
  adding.value = false
  router.push({ name: 'person', params: { id: p.id } })
}
</script>

<template>
  <main class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">People</h1>
      <button v-if="!adding" class="btn btn-primary" @click="adding = true">+ New person</button>
    </div>

    <div v-if="adding" class="card">
      <PersonForm submit-label="Add person" @submit="create" @cancel="adding = false" />
    </div>

    <p v-if="!sorted.length && !adding" class="text-stone-600">No people yet.</p>

    <ul class="flex flex-col gap-2">
      <li v-for="p in sorted" :key="p.id">
        <RouterLink
          :to="{ name: 'person', params: { id: p.id } }"
          class="card block hover:border-emerald-400"
        >
          <span class="font-medium">{{ p.name }}</span>
          <span v-if="p.birthday" class="block text-sm text-stone-600"
            >🎂 {{ formatBirthday(p.birthday) }}</span
          >
        </RouterLink>
      </li>
    </ul>
  </main>
</template>
