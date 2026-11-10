<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import GiftItem from './GiftItem.vue'
import IdeaItem from './IdeaItem.vue'
import ItemForm, { type ItemFormValue } from './ItemForm.vue'
import type { RecipientEntry } from '@/domain/grouping'
import { plural } from '@/domain/totals'
import type { Occasion } from '@/domain/types'
import { useGiftStore } from '@/stores/gifts'

const props = defineProps<{
  entry: RecipientEntry
  occasion: Occasion
  showIdeas: boolean
}>()

const store = useGiftStore()
const adding = ref(false)

const ideas = computed(() => (props.showIdeas ? store.ideasFor(props.entry.person.id) : []))

function addGift(fields: ItemFormValue) {
  store.addGift(props.occasion.id, props.entry.person.id, fields)
  adding.value = false
}

function removeRecipient() {
  const { person } = props.entry
  const { gifts } = store.recipientRemovalImpact(props.occasion.id, person.id)
  const loss = gifts ? ` Their ${plural(gifts, 'gift')} for this occasion will be deleted.` : ''
  if (confirm(`Remove ${person.name} from ${props.occasion.name}?${loss}`)) {
    store.removeRecipient(props.occasion.id, person.id)
  }
}
</script>

<template>
  <article class="card">
    <header class="flex items-center justify-between gap-2">
      <RouterLink
        :to="{ name: 'person', params: { id: entry.person.id } }"
        class="font-semibold hover:underline"
        >{{ entry.person.name }}</RouterLink
      >
      <div class="flex gap-1">
        <button v-if="!adding" type="button" class="btn btn-sm" @click="adding = true">
          + Gift
        </button>
        <button type="button" class="btn btn-ghost btn-sm text-stone-500" @click="removeRecipient">
          Remove
        </button>
      </div>
    </header>

    <div v-if="adding" class="mt-3 rounded-lg bg-stone-50 p-3">
      <ItemForm with-give-date submit-label="Add gift" @submit="addGift" @cancel="adding = false" />
    </div>

    <ul v-if="entry.gifts.length" class="mt-1 divide-y divide-stone-100">
      <GiftItem v-for="gift in entry.gifts" :key="gift.id" :gift="gift" />
    </ul>

    <div v-if="ideas.length" class="mt-3 border-t border-dashed border-stone-200 pt-2">
      <h4 class="text-xs font-semibold tracking-wide text-stone-500 uppercase">Ideas</h4>
      <ul class="divide-y divide-stone-100">
        <IdeaItem
          v-for="idea in ideas"
          :key="idea.id"
          :idea="idea"
          :convert-to-occasion-id="occasion.id"
        />
      </ul>
    </div>
  </article>
</template>
