<script setup lang="ts">
import { computed } from 'vue'
import { linkLabel, safeHref } from '@/domain/links'

const props = defineProps<{ link: string }>()
const href = computed(() => safeHref(props.link))
</script>

<template>
  <a
    v-if="href"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    class="truncate text-rose-700 underline decoration-rose-300 underline-offset-2 hover:decoration-rose-700"
    >{{ linkLabel(link) }} ↗</a
  >
  <span v-else class="truncate text-stone-500">{{ link }}</span>
</template>
