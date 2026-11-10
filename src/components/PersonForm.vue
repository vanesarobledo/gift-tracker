<script setup lang="ts">
import { ref } from 'vue'
import type { Person } from '@/domain/types'

const props = defineProps<{ initial?: Person; submitLabel: string }>()
const emit = defineEmits<{ submit: [Omit<Person, 'id'>]; cancel: [] }>()

const name = ref(props.initial?.name ?? '')
const month = ref<number | ''>(props.initial?.birthday?.month ?? '')
const day = ref<number | ''>(props.initial?.birthday?.day ?? '')
const year = ref<number | ''>(props.initial?.birthday?.year ?? '')

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function onSubmit() {
  const trimmed = name.value.trim()
  if (!trimmed) return
  const value: Omit<Person, 'id'> = { name: trimmed }
  if (month.value !== '' && day.value !== '') {
    value.birthday = { month: Number(month.value), day: Number(day.value) }
    if (year.value !== '') value.birthday.year = Number(year.value)
  }
  emit('submit', value)
}
</script>

<template>
  <form class="flex flex-col gap-3" @submit.prevent="onSubmit">
    <input v-model="name" required placeholder="Name" aria-label="Name" />
    <fieldset class="flex flex-wrap gap-2">
      <legend class="mb-1 text-sm text-stone-600">Birthday (optional)</legend>
      <select v-model="month" aria-label="Birthday month">
        <option value="">Month</option>
        <option v-for="(m, i) in months" :key="m" :value="i + 1">{{ m }}</option>
      </select>
      <input
        v-model.number="day"
        type="number"
        min="1"
        max="31"
        placeholder="Day"
        aria-label="Birthday day"
        class="w-20"
        :required="month !== ''"
      />
      <input
        v-model.number="year"
        type="number"
        min="1900"
        max="2100"
        placeholder="Year?"
        aria-label="Birthday year"
        class="w-24"
      />
    </fieldset>
    <div class="flex gap-2">
      <button class="btn btn-primary" type="submit">{{ submitLabel }}</button>
      <button class="btn" type="button" @click="emit('cancel')">Cancel</button>
    </div>
  </form>
</template>
