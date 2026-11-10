<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import GiftItem from '@/components/GiftItem.vue'
import { formatDate } from '@/domain/dates'
import { formatCAD, plannedTotal, plural, toBuyGroups } from '@/domain/totals'
import { useGiftStore } from '@/stores/gifts'

const store = useGiftStore()

const groups = computed(() => toBuyGroups(store.data.occasions, store.data.gifts))
const total = computed(() => plannedTotal(store.data.gifts))
const count = computed(() => groups.value.reduce((n, g) => n + g.gifts.length, 0))
</script>

<template>
  <div class="space-y-6">
    <!-- Sticky so the running total stays visible while scrolling in a store. -->
    <div
      class="sticky top-[49px] z-[5] -mx-4 flex items-baseline justify-between gap-2 border-b border-stone-200 bg-stone-100/95 px-4 py-3 backdrop-blur"
    >
      <h1 class="page-title">To Buy</h1>
      <div class="text-right">
        <div class="text-xl font-semibold tabular-nums">{{ formatCAD(total) }}</div>
        <div class="text-xs text-stone-500">{{ plural(count, 'gift') }}</div>
      </div>
    </div>

    <p v-if="!groups.length" class="card text-stone-600">
      Nothing to buy. Planned gifts show up here.
    </p>

    <section v-for="group in groups" :key="group.occasion.id" class="card">
      <header class="flex items-baseline justify-between gap-2">
        <RouterLink
          :to="{ name: 'occasion', params: { id: group.occasion.id } }"
          class="font-semibold hover:underline"
          >{{ group.occasion.name }}</RouterLink
        >
        <span class="text-sm text-stone-600">{{ formatDate(group.occasion.date) }}</span>
      </header>
      <ul class="divide-y divide-stone-100">
        <GiftItem v-for="gift in group.gifts" :key="gift.id" :gift="gift" show-person />
      </ul>
    </section>
  </div>
</template>
