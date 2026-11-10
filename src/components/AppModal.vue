<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()

const dialog = ref<HTMLDialogElement>()

function sync() {
  const el = dialog.value
  if (!el) return
  if (props.open && !el.open) el.showModal()
  if (!props.open && el.open) el.close()
}

watch(() => props.open, sync)
onMounted(sync)
</script>

<template>
  <!-- The native "close" event fires on Escape too, so state stays in sync. -->
  <dialog
    ref="dialog"
    class="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-0 shadow-xl"
    @close="emit('close')"
  >
    <div v-if="open" class="p-5">
      <div class="mb-4 flex items-center justify-between gap-4">
        <h2 class="section-title">{{ title }}</h2>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          aria-label="Close"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>
      <slot />
    </div>
  </dialog>
</template>
