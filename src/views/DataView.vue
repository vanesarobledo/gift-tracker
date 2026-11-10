<script setup lang="ts">
import { ref } from 'vue'
import { todayISO } from '@/domain/dates'
import { exportFileName, parseExport, toExportFile } from '@/domain/importExport'
import { plural } from '@/domain/totals'
import { useGiftStore } from '@/stores/gifts'

const store = useGiftStore()
const error = ref('')
const message = ref('')
const fileInput = ref<HTMLInputElement>()

function exportData() {
  const json = JSON.stringify(toExportFile(store.data), null, 2)
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = exportFileName(todayISO())
  a.click()
  URL.revokeObjectURL(url)
}

function summarize(d: typeof store.data) {
  return [
    plural(d.people.length, 'person', 'people'),
    plural(d.occasions.length, 'occasion'),
    plural(d.ideas.length, 'idea'),
    plural(d.gifts.length, 'gift'),
  ].join(', ')
}

async function importFile(event: Event) {
  error.value = ''
  message.value = ''
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // allow re-selecting the same file
  if (!file) return

  const result = parseExport(await file.text())
  if (!result.ok) {
    error.value = `Couldn't import ${file.name}: ${result.error}. Your existing data hasn't changed.`
    return
  }
  const ok = confirm(
    `Replace ALL your data with ${file.name}?\n\n` +
      `You'll lose: ${summarize(store.data)}.\n` +
      `You'll get: ${summarize(result.data)}.\n\n` +
      `Export first if you want a backup.`,
  )
  if (!ok) return
  store.replaceAll(result.data)
  message.value = `Imported ${summarize(result.data)}.`
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="page-title">Data</h1>
    <p class="text-stone-600">
      Your data is saved in this browser only. Export a backup now and then, and import it to move
      to another browser or restore it.
    </p>

    <section class="card space-y-2">
      <h2 class="section-title">Export</h2>
      <p class="text-sm text-stone-600">
        Download everything as a JSON file ({{ summarize(store.data) }}).
      </p>
      <button type="button" class="btn btn-primary" @click="exportData">Download export</button>
    </section>

    <section class="card space-y-2">
      <h2 class="section-title">Import</h2>
      <p class="text-sm text-stone-600">
        Importing <strong>replaces all</strong> your current data with the file's contents.
      </p>
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        class="sr-only"
        @change="importFile"
      />
      <button type="button" class="btn" @click="fileInput?.click()">Choose file…</button>
      <p v-if="error" role="alert" class="rounded-lg bg-red-50 p-3 text-sm text-red-800">
        {{ error }}
      </p>
      <p v-if="message" role="status" class="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
        {{ message }}
      </p>
    </section>
  </div>
</template>
