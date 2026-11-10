<script setup lang="ts">
import { useId } from 'vue'
import { GIFT_STATUSES, type GiftStatus } from '@/domain/types'

defineProps<{ label: string }>()
const status = defineModel<GiftStatus>({ required: true })

const name = useId()

const LABELS: Record<GiftStatus, string> = { planned: 'Planned', bought: 'Bought', given: 'Given' }
const ACTIVE: Record<GiftStatus, string> = {
  planned: 'peer-checked:bg-amber-100 peer-checked:text-amber-900',
  bought: 'peer-checked:bg-sky-100 peer-checked:text-sky-900',
  given: 'peer-checked:bg-emerald-100 peer-checked:text-emerald-900',
}
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    class="inline-flex rounded-lg border border-stone-300 bg-white p-0.5 text-xs font-medium"
  >
    <label v-for="s in GIFT_STATUSES" :key="s" class="cursor-pointer">
      <input v-model="status" type="radio" :name="name" :value="s" class="peer sr-only" />
      <span
        class="block rounded-md px-2.5 py-1.5 text-stone-500 peer-focus-visible:outline-2 peer-focus-visible:outline-rose-600"
        :class="ACTIVE[s]"
      >
        {{ LABELS[s] }}
      </span>
    </label>
  </div>
</template>
