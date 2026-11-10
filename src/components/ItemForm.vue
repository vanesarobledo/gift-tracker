<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { isValidISODate } from '@/domain/dates'
import { parsePrice } from '@/domain/totals'

export interface ItemFormValue {
  name: string
  link?: string
  price?: number
  giveDate?: string
}

const props = defineProps<{
  initial?: ItemFormValue
  /** Gifts have an optional give date; ideas don't. */
  withGiveDate?: boolean
  submitLabel?: string
}>()
const emit = defineEmits<{ submit: [fields: ItemFormValue]; cancel: [] }>()

const id = useId()
const name = ref(props.initial?.name ?? '')
const link = ref(props.initial?.link ?? '')
const price = ref(props.initial?.price?.toFixed(2) ?? '')
const giveDate = ref(props.initial?.giveDate ?? '')

const parsedPrice = computed(() => parsePrice(price.value))
const giveDateValid = computed(() => giveDate.value === '' || isValidISODate(giveDate.value))
const canSubmit = computed(
  () => name.value.trim() !== '' && parsedPrice.value !== 'invalid' && giveDateValid.value,
)

function submit() {
  if (!canSubmit.value || parsedPrice.value === 'invalid') return
  const value: ItemFormValue = { name: name.value.trim() }
  if (link.value.trim()) value.link = link.value.trim()
  if (parsedPrice.value !== undefined) value.price = parsedPrice.value
  if (props.withGiveDate && giveDate.value) value.giveDate = giveDate.value
  emit('submit', value)
}
</script>

<template>
  <form class="space-y-3" @submit.prevent="submit">
    <div>
      <label class="label" :for="`${id}-name`">Name</label>
      <input :id="`${id}-name`" v-model="name" class="input" required autocomplete="off" />
    </div>
    <div class="grid grid-cols-[1fr_8rem] gap-2">
      <div>
        <label class="label" :for="`${id}-link`">Link</label>
        <input
          :id="`${id}-link`"
          v-model="link"
          class="input"
          type="url"
          inputmode="url"
          placeholder="https://"
          autocomplete="off"
        />
      </div>
      <div>
        <label class="label" :for="`${id}-price`">Price (CAD)</label>
        <input
          :id="`${id}-price`"
          v-model="price"
          class="input"
          inputmode="decimal"
          placeholder="0.00"
          autocomplete="off"
        />
      </div>
    </div>
    <p v-if="parsedPrice === 'invalid'" class="text-sm text-red-700">
      Price must be a number, like 24.99.
    </p>
    <div v-if="withGiveDate">
      <label class="label" :for="`${id}-give`">
        Give date <span class="font-normal text-stone-500">(if not the occasion date)</span>
      </label>
      <input :id="`${id}-give`" v-model="giveDate" class="input" type="date" />
    </div>
    <div class="flex justify-end gap-2">
      <button type="button" class="btn" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn btn-primary" :disabled="!canSubmit">
        {{ submitLabel ?? 'Save' }}
      </button>
    </div>
  </form>
</template>
