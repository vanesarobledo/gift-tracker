<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AddRecipientForm from '@/components/AddRecipientForm.vue'
import AppModal from '@/components/AppModal.vue'
import OccasionForm from '@/components/OccasionForm.vue'
import RecipientCard from '@/components/RecipientCard.vue'
import { formatDate } from '@/domain/dates'
import { groupRecipients, RECIPIENT_GROUPS } from '@/domain/grouping'
import { formatCAD, occasionTotal, plural } from '@/domain/totals'
import { useGiftStore } from '@/stores/gifts'
import NotFoundView from './NotFoundView.vue'

const props = defineProps<{ id: string }>()

const store = useGiftStore()
const router = useRouter()

type Modal = 'edit' | 'duplicate' | 'recipient' | null
const modal = ref<Modal>(null)

const occasion = computed(() => store.occasionsById.get(props.id))
const groups = computed(() =>
  occasion.value ? groupRecipients(occasion.value, store.data.people, store.data.gifts) : null,
)
const total = computed(() => occasionTotal(props.id, store.data.gifts))

function save(fields: { name: string; date: string }) {
  store.updateOccasion(props.id, fields)
  modal.value = null
}

function duplicate(fields: { name: string; date: string }) {
  const copy = store.duplicateOccasion(props.id, fields)
  modal.value = null
  router.push({ name: 'occasion', params: { id: copy.id } })
}

function remove() {
  if (!occasion.value) return
  const { gifts } = store.occasionDeletionImpact(props.id)
  const loss = gifts ? ` Its ${plural(gifts, 'gift')} will be deleted too.` : ''
  if (confirm(`Delete “${occasion.value.name}”?${loss} People and their ideas are kept.`)) {
    store.deleteOccasion(props.id)
    router.push({ name: 'home' })
  }
}

/** Suggest "Christmas 2027" when duplicating "Christmas 2026". */
const duplicateDefaults = computed(() => {
  if (!occasion.value) return undefined
  const { name, date } = occasion.value
  const nextYear = String(Number(date.slice(0, 4)) + 1)
  return {
    name: name.replace(date.slice(0, 4), nextYear),
    date: `${nextYear}${date.slice(4)}`,
  }
})
</script>

<template>
  <NotFoundView v-if="!occasion || !groups" message="This occasion doesn't exist." />
  <div v-else class="space-y-6">
    <div>
      <h1 class="page-title">{{ occasion.name }}</h1>
      <div class="mt-1 flex flex-wrap items-baseline gap-x-4 text-stone-600">
        <span>{{ formatDate(occasion.date) }}</span>
        <span
          >Total <strong class="text-stone-900 tabular-nums">{{ formatCAD(total) }}</strong></span
        >
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <button type="button" class="btn btn-primary" @click="modal = 'recipient'">
          + Recipient
        </button>
        <button type="button" class="btn" @click="modal = 'edit'">Edit</button>
        <button type="button" class="btn" @click="modal = 'duplicate'">Duplicate</button>
        <button type="button" class="btn btn-danger" @click="remove">Delete</button>
      </div>
    </div>

    <p v-if="!occasion.recipientIds.length" class="card text-stone-600">
      No recipients yet. Add the people you're giving gifts to for this occasion.
    </p>

    <template v-for="group in RECIPIENT_GROUPS" :key="group.key">
      <section v-if="groups[group.key].length" class="space-y-3">
        <h2 class="section-title">
          {{ group.label }}
          <span class="text-sm font-normal text-stone-500">({{ groups[group.key].length }})</span>
        </h2>
        <RecipientCard
          v-for="entry in groups[group.key]"
          :key="entry.person.id"
          :entry="entry"
          :occasion="occasion"
          :show-ideas="group.key === 'needs-shopping' || group.key === 'planned'"
        />
      </section>
    </template>

    <AppModal :open="modal === 'edit'" title="Edit occasion" @close="modal = null">
      <OccasionForm :initial="occasion" @submit="save" @cancel="modal = null" />
    </AppModal>
    <AppModal :open="modal === 'duplicate'" title="Duplicate occasion" @close="modal = null">
      <OccasionForm
        :initial="duplicateDefaults"
        submit-label="Duplicate"
        hint="The new occasion gets the same recipients. Gifts aren't copied."
        @submit="duplicate"
        @cancel="modal = null"
      />
    </AppModal>
    <AppModal :open="modal === 'recipient'" title="Add recipient" @close="modal = null">
      <AddRecipientForm :occasion="occasion" @done="modal = null" />
    </AppModal>
  </div>
</template>
