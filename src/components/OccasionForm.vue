<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  initial?: { name: string; date: string }
  submitLabel: string
}>()
const emit = defineEmits<{ submit: [{ name: string; date: string }]; cancel: [] }>()

const name = ref(props.initial?.name ?? '')
const date = ref(props.initial?.date ?? '')

function onSubmit() {
  const trimmed = name.value.trim()
  if (!trimmed || !date.value) return
  emit('submit', { name: trimmed, date: date.value })
}
</script>

<template>
  <form class="flex flex-col gap-2" @submit.prevent="onSubmit">
    <input
      v-model="name"
      required
      placeholder="Name, e.g. Christmas 2026"
      aria-label="Occasion name"
    />
    <input v-model="date" required type="date" aria-label="Occasion date" />
    <div class="flex gap-2">
      <button class="btn btn-primary" type="submit">{{ submitLabel }}</button>
      <button class="btn" type="button" @click="emit('cancel')">Cancel</button>
    </div>
  </form>
</template>
