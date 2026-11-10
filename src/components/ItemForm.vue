<script setup lang="ts">
import { ref } from 'vue'

// Shared form for ideas and gifts: name, link, price (+ optional give date).
export interface ItemFormValue {
  name: string
  link?: string
  price?: number
  giveDate?: string
}

const props = defineProps<{
  initial?: ItemFormValue
  withGiveDate?: boolean
  submitLabel: string
}>()
const emit = defineEmits<{ submit: [ItemFormValue]; cancel: [] }>()

const name = ref(props.initial?.name ?? '')
const link = ref(props.initial?.link ?? '')
const price = ref<number | null>(props.initial?.price ?? null)
const giveDate = ref(props.initial?.giveDate ?? '')

function onSubmit() {
  const trimmed = name.value.trim()
  if (!trimmed) return
  const value: ItemFormValue = { name: trimmed }
  if (link.value.trim()) value.link = link.value.trim()
  if (typeof price.value === 'number' && price.value >= 0) value.price = price.value
  if (props.withGiveDate && giveDate.value) value.giveDate = giveDate.value
  emit('submit', value)
}
</script>

<template>
  <form class="flex flex-col gap-2" @submit.prevent="onSubmit">
    <input v-model="name" required placeholder="Name" aria-label="Name" />
    <input v-model="link" type="url" placeholder="Link (optional)" aria-label="Link" />
    <input
      v-model.number="price"
      type="number"
      min="0"
      step="0.01"
      inputmode="decimal"
      placeholder="Price in CAD (optional)"
      aria-label="Price"
    />
    <label v-if="withGiveDate" class="flex flex-col gap-1 text-sm text-stone-600">
      Give date (if different from the occasion)
      <input v-model="giveDate" type="date" />
    </label>
    <div class="flex gap-2">
      <button class="btn btn-primary" type="submit">{{ submitLabel }}</button>
      <button class="btn" type="button" @click="emit('cancel')">Cancel</button>
    </div>
  </form>
</template>
