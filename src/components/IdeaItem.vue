<script setup lang="ts">
import { ref } from 'vue'
import type { Idea } from '@/domain/types'
import { formatPrice } from '@/domain/format'
import { useDataStore } from '@/stores/data'
import ItemForm from './ItemForm.vue'

const props = defineProps<{ idea: Idea; occasionId?: string; manage?: boolean }>()
const store = useDataStore()
const editing = ref(false)

function remove() {
  if (confirm(`Delete the idea "${props.idea.name}"?`)) store.removeIdea(props.idea.id)
}
</script>

<template>
  <li class="rounded-md border border-dashed border-stone-300 p-2">
    <ItemForm
      v-if="editing"
      :initial="idea"
      submit-label="Save"
      @submit="
        (v) => {
          store.updateIdea(idea.id, v)
          editing = false
        }
      "
      @cancel="editing = false"
    />
    <div v-else class="flex flex-wrap items-center justify-between gap-2">
      <p class="min-w-0 break-words">
        <a
          v-if="idea.link"
          :href="idea.link"
          target="_blank"
          rel="noopener"
          class="text-emerald-800 underline"
          >{{ idea.name }}</a
        >
        <span v-else>{{ idea.name }}</span>
        <span v-if="idea.price !== undefined" class="text-sm text-stone-600">
          · {{ formatPrice(idea.price) }}</span
        >
      </p>
      <div class="flex gap-1 text-sm">
        <button
          v-if="occasionId"
          class="btn btn-primary"
          type="button"
          @click="store.ideaToGift(idea.id, occasionId)"
        >
          → Gift
        </button>
        <template v-if="manage">
          <button class="btn" type="button" @click="editing = true">Edit</button>
          <button class="btn btn-danger" type="button" @click="remove">Delete</button>
        </template>
      </div>
    </div>
  </li>
</template>
