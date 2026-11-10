<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

const links = [
  { to: '/', label: 'Home' },
  { to: '/to-buy', label: 'To Buy' },
  { to: '/people', label: 'People' },
  { to: '/settings', label: 'Data' },
]
</script>

<template>
  <div class="mx-auto min-h-screen max-w-3xl px-4 pb-16">
    <header
      class="sticky top-0 z-10 -mx-4 mb-4 border-b border-stone-200 bg-stone-50/95 px-4 py-3 backdrop-blur"
    >
      <nav class="flex items-center gap-1 text-sm sm:gap-2">
        <span class="mr-2 font-semibold text-emerald-800">🎁 Gift Tracker</span>
        <RouterLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="rounded-md px-2 py-1.5 text-stone-600 hover:bg-stone-200"
          exact-active-class="!bg-emerald-100 !text-emerald-900 font-medium"
        >
          {{ l.label }}
        </RouterLink>
      </nav>
    </header>
    <RouterView />
  </div>
</template>
