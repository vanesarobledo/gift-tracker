<script setup lang="ts">
import { computed, ref } from 'vue'
import { isValidBirthday } from '@/domain/dates'
import type { Birthday, Person } from '@/domain/types'

const props = defineProps<{ initial?: Omit<Person, 'id'>; submitLabel?: string }>()
const emit = defineEmits<{ submit: [fields: Omit<Person, 'id'>]; cancel: [] }>()

const MONTHS = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat('en-CA', { month: 'long' }).format(new Date(2000, i, 1)),
)

const name = ref(props.initial?.name ?? '')
const month = ref<number | ''>(props.initial?.birthday?.month ?? '')
const day = ref<number | ''>(props.initial?.birthday?.day ?? '')
const year = ref<number | ''>(props.initial?.birthday?.year ?? '')

const birthday = computed<Birthday | undefined | 'invalid'>(() => {
  if (month.value === '' && day.value === '' && year.value === '') return undefined
  if (month.value === '' || day.value === '') return 'invalid'
  const b: Birthday = { month: month.value, day: day.value }
  if (year.value !== '') b.year = year.value
  return isValidBirthday(b) ? b : 'invalid'
})

const canSubmit = computed(() => name.value.trim() !== '' && birthday.value !== 'invalid')

function submit() {
  if (!canSubmit.value || birthday.value === 'invalid') return
  emit('submit', { name: name.value.trim(), birthday: birthday.value })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div>
      <label class="label" for="person-name">Name</label>
      <input id="person-name" v-model="name" class="input" required autocomplete="off" />
    </div>
    <fieldset>
      <legend class="label">
        Birthday <span class="font-normal text-stone-500">(optional)</span>
      </legend>
      <div class="grid grid-cols-[2fr_1fr_1.3fr] gap-2">
        <select v-model="month" class="input" aria-label="Birthday month">
          <option value="">Month</option>
          <option v-for="(m, i) in MONTHS" :key="m" :value="i + 1">{{ m }}</option>
        </select>
        <input
          v-model.number="day"
          class="input"
          type="number"
          inputmode="numeric"
          min="1"
          max="31"
          placeholder="Day"
          aria-label="Birthday day"
        />
        <input
          v-model.number="year"
          class="input"
          type="number"
          inputmode="numeric"
          placeholder="Year?"
          aria-label="Birthday year (optional)"
        />
      </div>
      <p v-if="birthday === 'invalid'" class="mt-1 text-sm text-red-700">
        Enter a valid month and day. The year is optional.
      </p>
    </fieldset>
    <div class="flex justify-end gap-2">
      <button type="button" class="btn" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn btn-primary" :disabled="!canSubmit">
        {{ submitLabel ?? 'Save' }}
      </button>
    </div>
  </form>
</template>
