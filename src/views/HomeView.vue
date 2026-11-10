<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AppModal from '@/components/AppModal.vue'
import OccasionForm from '@/components/OccasionForm.vue'
import { formatDate } from '@/domain/dates'
import { groupRecipients } from '@/domain/grouping'
import { splitOccasions } from '@/domain/occasions'
import { formatCAD, occasionTotal, plural } from '@/domain/totals'
import { useGiftStore } from '@/stores/gifts'

const store = useGiftStore()
const router = useRouter()
const creating = ref(false)

const split = computed(() => splitOccasions(store.data.occasions))

const upcoming = computed(() =>
  split.value.upcoming.map((occasion) => {
    const groups = groupRecipients(occasion, store.data.people, store.data.gifts)
    return {
      occasion,
      recipients: occasion.recipientIds.length,
      needs: groups['needs-shopping'].length,
      planned: groups.planned.length,
      total: occasionTotal(occasion.id, store.data.gifts),
    }
  }),
)

function create(fields: { name: string; date: string }) {
  const occasion = store.addOccasion({ ...fields, recipientIds: [] })
  creating.value = false
  router.push({ name: 'occasion', params: { id: occasion.id } })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-2">
      <h1 class="page-title">Occasions</h1>
      <button type="button" class="btn btn-primary" @click="creating = true">+ New occasion</button>
    </div>

    <p v-if="!store.data.occasions.length" class="card text-stone-600">
      No occasions yet. Add one, like “Christmas 2026”, then add the people you're shopping for.
    </p>

    <ul v-if="upcoming.length" class="space-y-3">
      <li v-for="s in upcoming" :key="s.occasion.id">
        <RouterLink
          :to="{ name: 'occasion', params: { id: s.occasion.id } }"
          class="card block transition hover:border-rose-300"
        >
          <div class="flex items-baseline justify-between gap-2">
            <span class="font-semibold">{{ s.occasion.name }}</span>
            <span class="text-sm text-stone-600 tabular-nums">{{ formatCAD(s.total) }}</span>
          </div>
          <div class="text-sm text-stone-600">{{ formatDate(s.occasion.date) }}</div>
          <div class="mt-2 flex flex-wrap gap-2 text-xs">
            <span class="rounded-full bg-stone-100 px-2 py-0.5">{{
              plural(s.recipients, 'recipient')
            }}</span>
            <span v-if="s.needs" class="rounded-full bg-rose-100 px-2 py-0.5 text-rose-900"
              >{{ s.needs }} need shopping</span
            >
            <span v-if="s.planned" class="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900"
              >{{ s.planned }} planned</span
            >
          </div>
        </RouterLink>
      </li>
    </ul>

    <details v-if="split.past.length" class="group">
      <summary class="cursor-pointer text-sm font-medium text-stone-600 select-none">
        Past occasions ({{ split.past.length }})
      </summary>
      <ul class="mt-3 space-y-2">
        <li v-for="o in split.past" :key="o.id">
          <RouterLink
            :to="{ name: 'occasion', params: { id: o.id } }"
            class="card flex items-baseline justify-between gap-2 py-3 hover:border-rose-300"
          >
            <span>
              <span class="font-medium">{{ o.name }}</span>
              <span class="ml-2 text-sm text-stone-500">{{ formatDate(o.date) }}</span>
            </span>
            <span class="text-sm text-stone-600 tabular-nums">{{
              formatCAD(occasionTotal(o.id, store.data.gifts))
            }}</span>
          </RouterLink>
        </li>
      </ul>
    </details>

    <AppModal :open="creating" title="New occasion" @close="creating = false">
      <OccasionForm submit-label="Create" @submit="create" @cancel="creating = false" />
    </AppModal>
  </div>
</template>
