<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useDataStore } from '@/stores/data'
import { plannedTotal, toBuyGroups } from '@/domain/logic'
import { formatDate, formatPrice } from '@/domain/format'
import StatusControl from '@/components/StatusControl.vue'

const store = useDataStore()
const groups = computed(() => toBuyGroups(store.data))
const total = computed(() => plannedTotal(store.data))
</script>

<template>
  <main class="flex flex-col gap-4">
    <div class="flex items-baseline justify-between">
      <h1 class="text-2xl font-semibold">To Buy</h1>
      <p class="text-lg">
        Total: <strong>{{ formatPrice(total) }}</strong>
      </p>
    </div>

    <p v-if="!groups.length" class="text-stone-600">Nothing planned. 🎉</p>

    <section v-for="g in groups" :key="g.occasion.id" class="flex flex-col gap-2">
      <h2 class="font-semibold">
        <RouterLink
          :to="{ name: 'occasion', params: { id: g.occasion.id } }"
          class="text-emerald-800 underline"
          >{{ g.occasion.name }}</RouterLink
        >
        <span class="text-sm font-normal text-stone-600"> · {{ formatDate(g.occasion.date) }}</span>
      </h2>
      <ul class="flex flex-col gap-2">
        <li v-for="item in g.gifts" :key="item.gift.id" class="card flex flex-col gap-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-lg font-medium break-words">
                <a
                  v-if="item.gift.link"
                  :href="item.gift.link"
                  target="_blank"
                  rel="noopener"
                  class="text-emerald-800 underline"
                  >{{ item.gift.name }}</a
                >
                <span v-else>{{ item.gift.name }}</span>
              </p>
              <p class="text-sm text-stone-600">
                for {{ item.person?.name ?? 'Unknown' }}
                <span v-if="item.gift.giveDate"> · give {{ formatDate(item.gift.giveDate) }}</span>
              </p>
            </div>
            <p class="shrink-0 text-lg">{{ formatPrice(item.gift.price) }}</p>
          </div>
          <StatusControl
            :model-value="item.gift.status"
            @update:model-value="(s) => store.setStatus(item.gift.id, s)"
          />
        </li>
      </ul>
    </section>
  </main>
</template>
