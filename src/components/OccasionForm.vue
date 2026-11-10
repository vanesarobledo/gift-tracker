<script setup lang="ts">
import { computed, ref } from 'vue'
import { isValidISODate } from '@/domain/dates'

const props = defineProps<{
  initial?: { name: string; date: string }
  submitLabel?: string
  hint?: string
}>()
const emit = defineEmits<{ submit: [fields: { name: string; date: string }]; cancel: [] }>()

const name = ref(props.initial?.name ?? '')
const date = ref(props.initial?.date ?? '')

const canSubmit = computed(() => name.value.trim() !== '' && isValidISODate(date.value))

function submit() {
  if (canSubmit.value) emit('submit', { name: name.value.trim(), date: date.value })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <p v-if="hint" class="text-sm text-stone-600">{{ hint }}</p>
    <div>
      <label class="label" for="occasion-name">Name</label>
      <input
        id="occasion-name"
        v-model="name"
        class="input"
        required
        placeholder="Christmas 2026"
        autocomplete="off"
      />
    </div>
    <div>
      <label class="label" for="occasion-date">Date</label>
      <input id="occasion-date" v-model="date" class="input" type="date" required />
    </div>
    <div class="flex justify-end gap-2">
      <button type="button" class="btn" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn btn-primary" :disabled="!canSubmit">
        {{ submitLabel ?? 'Save' }}
      </button>
    </div>
  </form>
</template>
