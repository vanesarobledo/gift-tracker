<script setup lang="ts">
import { ref } from 'vue'
import { useDataStore } from '@/stores/data'
import { toIsoDate } from '@/domain/format'
import { parseImportText } from '@/domain/logic'

const store = useDataStore()
const error = ref('')
const message = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

function exportData() {
  const blob = new Blob([store.exportJson()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gift-tracker-${toIsoDate(new Date())}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function onFile(e: Event) {
  error.value = ''
  message.value = ''
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const text = await file.text()
  // Validate before asking, so an invalid file never reaches the confirm step.
  const probe = parseImportText(text)
  if (!probe.ok) {
    error.value = `Import failed: ${probe.error} Your existing data was not changed.`
    return
  }
  if (!confirm('Importing replaces ALL existing people, occasions, ideas and gifts. Continue?'))
    return
  const result = store.importJson(text)
  if (result.ok) message.value = 'Import complete.'
  else error.value = `Import failed: ${result.error}`
}
</script>

<template>
  <main class="flex flex-col gap-4">
    <h1 class="text-2xl font-semibold">Data</h1>
    <p class="text-stone-600">
      Your data lives in this browser only. Export regularly as a backup.
    </p>

    <section class="card flex flex-col gap-2">
      <h2 class="font-semibold">Export</h2>
      <div><button class="btn btn-primary" @click="exportData">Download JSON</button></div>
    </section>

    <section class="card flex flex-col gap-2">
      <h2 class="font-semibold">Import</h2>
      <p class="text-sm text-stone-600">Replaces all existing data.</p>
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        aria-label="Import file"
        @change="onFile"
      />
      <p v-if="error" role="alert" class="text-red-700">{{ error }}</p>
      <p v-if="message" class="text-emerald-800">{{ message }}</p>
    </section>
  </main>
</template>
