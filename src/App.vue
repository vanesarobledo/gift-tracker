<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useGiftStore } from './stores/gifts'

const store = useGiftStore()
const plannedCount = computed(() => store.data.gifts.filter((g) => g.status === 'planned').length)

const links = [
  { to: { name: 'home' }, label: 'Occasions' },
  { to: { name: 'people' }, label: 'People' },
  { to: { name: 'to-buy' }, label: 'To Buy' },
  { to: { name: 'data' }, label: 'Data' },
] as const
</script>

<template>
  <div class="min-h-dvh">
    <header class="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div class="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2">
        <RouterLink to="/" class="font-semibold tracking-tight text-rose-700">
          <span aria-hidden="true">🎁</span><span class="hidden sm:inline"> Gift Tracker</span>
        </RouterLink>
        <nav class="flex gap-0.5 text-sm">
          <RouterLink
            v-for="link in links"
            :key="link.label"
            :to="link.to"
            class="rounded-lg px-2.5 py-1.5 font-medium text-stone-600 hover:bg-stone-100"
            exact-active-class="bg-rose-50 text-rose-800"
          >
            {{ link.label }}
            <span
              v-if="link.label === 'To Buy' && plannedCount"
              class="ml-0.5 rounded-full bg-amber-100 px-1.5 text-xs text-amber-900 tabular-nums"
              >{{ plannedCount }}</span
            >
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-3xl px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>
