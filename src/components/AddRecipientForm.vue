<script setup lang="ts">
import { computed, ref } from 'vue'
import { sortByName } from '@/domain/occasions'
import type { Occasion } from '@/domain/types'
import { useGiftStore } from '@/stores/gifts'

const props = defineProps<{ occasion: Occasion }>()
const emit = defineEmits<{ done: [] }>()

const NEW = '__new__'
const store = useGiftStore()

const candidates = computed(() =>
  sortByName(store.data.people.filter((p) => !props.occasion.recipientIds.includes(p.id))),
)

const choice = ref(candidates.value.length ? '' : NEW)
const newName = ref('')

const canSubmit = computed(() =>
  choice.value === NEW ? newName.value.trim() !== '' : choice.value !== '',
)

function submit() {
  if (!canSubmit.value) return
  const personId =
    choice.value === NEW ? store.addPerson({ name: newName.value.trim() }).id : choice.value
  store.addRecipient(props.occasion.id, personId)
  choice.value = candidates.value.length ? '' : NEW
  newName.value = ''
  emit('done')
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div>
      <label class="label" for="recipient-choice">Person</label>
      <select id="recipient-choice" v-model="choice" class="input">
        <option v-if="candidates.length" value="" disabled>Choose someone…</option>
        <option v-for="p in candidates" :key="p.id" :value="p.id">{{ p.name }}</option>
        <option :value="NEW">+ New person…</option>
      </select>
    </div>
    <div v-if="choice === NEW">
      <label class="label" for="recipient-new-name">New person's name</label>
      <input id="recipient-new-name" v-model="newName" class="input" autocomplete="off" />
      <p class="mt-1 text-xs text-stone-500">You can add their birthday later on their page.</p>
    </div>
    <div class="flex justify-end gap-2">
      <button type="button" class="btn" @click="emit('done')">Cancel</button>
      <button type="submit" class="btn btn-primary" :disabled="!canSubmit">Add recipient</button>
    </div>
  </form>
</template>
