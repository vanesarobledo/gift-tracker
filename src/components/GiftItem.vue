<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ItemForm, { type ItemFormValue } from './ItemForm.vue'
import ItemLink from './ItemLink.vue'
import StatusControl from './StatusControl.vue'
import { formatDate } from '@/domain/dates'
import { formatCAD } from '@/domain/totals'
import type { Gift } from '@/domain/types'
import { useGiftStore } from '@/stores/gifts'

const props = defineProps<{
  gift: Gift
  /** Extra context shown above the name, e.g. the person on the To Buy page. */
  showPerson?: boolean
  showOccasion?: boolean
}>()

const store = useGiftStore()
const editing = ref(false)

const person = computed(() => store.peopleById.get(props.gift.personId))
const occasion = computed(() => store.occasionsById.get(props.gift.occasionId))

const status = computed({
  get: () => props.gift.status,
  set: (s) => store.setGiftStatus(props.gift.id, s),
})

function save(fields: ItemFormValue) {
  store.updateGift(props.gift.id, fields)
  editing.value = false
}

function remove() {
  if (confirm(`Delete the gift "${props.gift.name}"? This can't be undone.`)) {
    store.deleteGift(props.gift.id)
  }
}
</script>

<template>
  <li class="py-3">
    <div v-if="editing" class="rounded-lg bg-stone-50 p-3">
      <ItemForm
        :initial="gift"
        with-give-date
        submit-label="Save gift"
        @submit="save"
        @cancel="editing = false"
      />
    </div>
    <div v-else class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <div
          v-if="(showPerson && person) || (showOccasion && occasion)"
          class="text-xs text-stone-500"
        >
          <RouterLink
            v-if="showPerson && person"
            :to="{ name: 'person', params: { id: person.id } }"
            class="font-medium text-stone-700 hover:underline"
            >{{ person.name }}</RouterLink
          >
          <span v-if="showPerson && showOccasion && person && occasion"> · </span>
          <RouterLink
            v-if="showOccasion && occasion"
            :to="{ name: 'occasion', params: { id: occasion.id } }"
            class="hover:underline"
            >{{ occasion.name }}</RouterLink
          >
        </div>
        <div class="font-medium break-words">{{ gift.name }}</div>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-600">
          <span v-if="gift.price !== undefined" class="tabular-nums">{{
            formatCAD(gift.price)
          }}</span>
          <ItemLink v-if="gift.link" :link="gift.link" />
          <span v-if="gift.giveDate">Giving {{ formatDate(gift.giveDate) }}</span>
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <StatusControl v-model="status" :label="`Status of ${gift.name}`" />
        <button type="button" class="btn btn-ghost btn-sm" @click="editing = true">Edit</button>
        <button
          type="button"
          class="btn btn-ghost btn-sm text-red-700"
          :aria-label="`Delete ${gift.name}`"
          @click="remove"
        >
          ✕
        </button>
      </div>
    </div>
  </li>
</template>
