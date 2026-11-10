<script setup lang="ts">
import { ref } from 'vue'
import ItemForm, { type ItemFormValue } from './ItemForm.vue'
import ItemLink from './ItemLink.vue'
import { formatCAD } from '@/domain/totals'
import type { Idea } from '@/domain/types'
import { useGiftStore } from '@/stores/gifts'

const props = defineProps<{
  idea: Idea
  /** When set, show a "→ Gift" action that moves the idea into this occasion. */
  convertToOccasionId?: string
}>()

const store = useGiftStore()
const editing = ref(false)

function save(fields: ItemFormValue) {
  store.updateIdea(props.idea.id, fields)
  editing.value = false
}

function remove() {
  if (confirm(`Delete the idea "${props.idea.name}"? This can't be undone.`)) {
    store.deleteIdea(props.idea.id)
  }
}
</script>

<template>
  <li class="py-2">
    <div v-if="editing" class="rounded-lg bg-stone-50 p-3">
      <ItemForm :initial="idea" submit-label="Save idea" @submit="save" @cancel="editing = false" />
    </div>
    <div v-else class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <div class="break-words">{{ idea.name }}</div>
        <div class="flex flex-wrap gap-x-3 text-sm text-stone-600">
          <span v-if="idea.price !== undefined" class="tabular-nums"
            >~{{ formatCAD(idea.price) }}</span
          >
          <ItemLink v-if="idea.link" :link="idea.link" />
        </div>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <button
          v-if="convertToOccasionId"
          type="button"
          class="btn btn-sm"
          :title="`Make “${idea.name}” a planned gift for this occasion`"
          @click="store.convertIdeaToGift(idea.id, convertToOccasionId)"
        >
          → Gift
        </button>
        <template v-else>
          <button type="button" class="btn btn-ghost btn-sm" @click="editing = true">Edit</button>
          <button
            type="button"
            class="btn btn-ghost btn-sm text-red-700"
            :aria-label="`Delete ${idea.name}`"
            @click="remove"
          >
            ✕
          </button>
        </template>
      </div>
    </div>
  </li>
</template>
