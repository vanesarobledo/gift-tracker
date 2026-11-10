<script setup lang="ts">
import { ref } from 'vue'
import type { Gift } from '@/domain/types'
import { formatDate, formatPrice } from '@/domain/format'
import { useDataStore } from '@/stores/data'
import StatusControl from './StatusControl.vue'
import ItemForm from './ItemForm.vue'

const props = defineProps<{ gift: Gift }>()
const store = useDataStore()
const editing = ref(false)

function remove() {
  if (confirm(`Delete the gift "${props.gift.name}"?`)) store.removeGift(props.gift.id)
}
</script>

<template>
  <li class="rounded-md border border-stone-200 bg-stone-50 p-3">
    <ItemForm
      v-if="editing"
      :initial="gift"
      with-give-date
      submit-label="Save"
      @submit="
        (v) => {
          store.updateGift(gift.id, v)
          editing = false
        }
      "
      @cancel="editing = false"
    />
    <template v-else>
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="font-medium break-words">
            <a
              v-if="gift.link"
              :href="gift.link"
              target="_blank"
              rel="noopener"
              class="text-emerald-800 underline"
              >{{ gift.name }}</a
            >
            <span v-else>{{ gift.name }}</span>
          </p>
          <p class="text-sm text-stone-600">
            {{ formatPrice(gift.price) }}
            <span v-if="gift.giveDate"> · give {{ formatDate(gift.giveDate) }}</span>
          </p>
        </div>
        <div class="flex shrink-0 gap-1 text-sm">
          <button class="btn" type="button" @click="editing = true">Edit</button>
          <button class="btn btn-danger" type="button" @click="remove">Delete</button>
        </div>
      </div>
      <div class="mt-2">
        <StatusControl
          :model-value="gift.status"
          @update:model-value="(s) => store.setStatus(gift.id, s)"
        />
      </div>
    </template>
  </li>
</template>
