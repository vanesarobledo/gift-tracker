<script setup lang="ts">
import { GIFT_STATUSES, type GiftStatus } from '@/domain/types'

defineProps<{ modelValue: GiftStatus }>()
defineEmits<{ 'update:modelValue': [GiftStatus] }>()

const labels: Record<GiftStatus, string> = { planned: 'Planned', bought: 'Bought', given: 'Given' }
</script>

<template>
  <div
    role="radiogroup"
    aria-label="Gift status"
    class="inline-flex overflow-hidden rounded-md border border-stone-300"
  >
    <button
      v-for="s in GIFT_STATUSES"
      :key="s"
      type="button"
      role="radio"
      :aria-checked="modelValue === s"
      class="px-3 py-1.5 text-sm not-first:border-l not-first:border-stone-300"
      :class="
        modelValue === s
          ? 'bg-emerald-700 text-white'
          : 'bg-white text-stone-700 hover:bg-stone-100'
      "
      @click="$emit('update:modelValue', s)"
    >
      {{ labels[s] }}
    </button>
  </div>
</template>
