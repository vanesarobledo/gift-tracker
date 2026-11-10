<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import { groupRecipients, occasionTotal, type RecipientEntry } from '@/domain/logic'
import { formatDate, formatPrice } from '@/domain/format'
import OccasionForm from '@/components/OccasionForm.vue'
import ItemForm from '@/components/ItemForm.vue'
import GiftItem from '@/components/GiftItem.vue'
import IdeaItem from '@/components/IdeaItem.vue'

const props = defineProps<{ id: string }>()
const store = useDataStore()
const router = useRouter()

const occasion = computed(() => store.occasion(props.id))
const groups = computed(() => groupRecipients(store.data, props.id))
const total = computed(() => occasionTotal(store.data, props.id))

const sections = [
  { key: 'needsShopping', title: 'Needs shopping' },
  { key: 'planned', title: 'Planned' },
  { key: 'bought', title: 'Bought' },
  { key: 'given', title: 'Given' },
] as const

const mode = ref<'view' | 'edit' | 'duplicate'>('view')

function duplicate(v: { name: string; date: string }) {
  const newId = store.duplicate(props.id, v.name, v.date)
  mode.value = 'view'
  router.push({ name: 'occasion', params: { id: newId } })
}

function remove() {
  const o = occasion.value
  if (!o) return
  const n = store.data.gifts.filter((g) => g.occasionId === o.id).length
  if (!confirm(`Delete "${o.name}"? This will also delete its ${n} gift(s).`)) return
  store.removeOccasion(o.id)
  router.push({ name: 'home' })
}

// Recipients
const addingRecipient = ref(false)
const pickedPerson = ref('')
const newPersonName = ref('')
const available = computed(() =>
  store.data.people
    .filter((p) => !occasion.value?.recipientIds.includes(p.id))
    .sort((a, b) => a.name.localeCompare(b.name)),
)

function addRecipient() {
  if (newPersonName.value.trim()) {
    const p = store.addPerson({ name: newPersonName.value.trim() })
    store.addRecipient(props.id, p.id)
  } else if (pickedPerson.value) {
    store.addRecipient(props.id, pickedPerson.value)
  } else return
  pickedPerson.value = ''
  newPersonName.value = ''
  addingRecipient.value = false
}

function removeRecipient(entry: RecipientEntry) {
  const n = entry.gifts.length
  if (
    confirm(
      `Remove ${entry.person.name} from this occasion? This will also delete their ${n} gift(s) for it.`,
    )
  )
    store.dropRecipient(props.id, entry.person.id)
}

// Direct gift add
const giftFormFor = ref<string | null>(null)
function addGift(
  personId: string,
  v: { name: string; link?: string; price?: number; giveDate?: string },
) {
  store.addGift({ personId, occasionId: props.id, ...v })
  giftFormFor.value = null
}
</script>

<template>
  <main v-if="occasion" class="flex flex-col gap-5">
    <RouterLink to="/" class="text-sm text-emerald-800 underline">← Occasions</RouterLink>

    <section class="card flex flex-col gap-3">
      <OccasionForm
        v-if="mode === 'edit'"
        :initial="occasion"
        submit-label="Save"
        @submit="
          (v) => {
            store.updateOccasion(id, v)
            mode = 'view'
          }
        "
        @cancel="mode = 'view'"
      />
      <template v-else>
        <div>
          <h1 class="text-2xl font-semibold">{{ occasion.name }}</h1>
          <p class="text-stone-600">{{ formatDate(occasion.date) }}</p>
          <p class="mt-1 text-lg">
            Total: <strong>{{ formatPrice(total) }}</strong>
          </p>
        </div>
        <div v-if="mode === 'duplicate'" class="rounded-md border border-stone-200 p-3">
          <p class="mb-2 text-sm text-stone-600">
            Copies the recipients (not the gifts) under a new name and date.
          </p>
          <OccasionForm
            :initial="{ name: '', date: '' }"
            submit-label="Duplicate"
            @submit="duplicate"
            @cancel="mode = 'view'"
          />
        </div>
        <div v-else class="flex flex-wrap gap-1">
          <button class="btn" @click="mode = 'edit'">Edit</button>
          <button class="btn" @click="mode = 'duplicate'">Duplicate</button>
          <button class="btn btn-danger" @click="remove">Delete</button>
        </div>
      </template>
    </section>

    <section class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Recipients</h2>
        <button v-if="!addingRecipient" class="btn" @click="addingRecipient = true">
          + Add recipient
        </button>
      </div>
      <form v-if="addingRecipient" class="card flex flex-col gap-2" @submit.prevent="addRecipient">
        <select
          v-model="pickedPerson"
          aria-label="Existing person"
          :disabled="!!newPersonName.trim()"
        >
          <option value="">Pick an existing person…</option>
          <option v-for="p in available" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <p class="text-center text-sm text-stone-500">or</p>
        <input
          v-model="newPersonName"
          placeholder="Create a new person"
          aria-label="New person name"
        />
        <div class="flex gap-2">
          <button class="btn btn-primary" type="submit">Add</button>
          <button class="btn" type="button" @click="addingRecipient = false">Cancel</button>
        </div>
      </form>
      <p v-if="!occasion.recipientIds.length" class="text-stone-600">No recipients yet.</p>
    </section>

    <template v-for="s in sections" :key="s.key">
      <section v-if="groups[s.key].length" class="flex flex-col gap-3">
        <h2 class="text-lg font-semibold">
          {{ s.title }} <span class="text-stone-500">({{ groups[s.key].length }})</span>
        </h2>
        <div v-for="entry in groups[s.key]" :key="entry.person.id" class="card flex flex-col gap-3">
          <div class="flex items-center justify-between gap-2">
            <RouterLink
              :to="{ name: 'person', params: { id: entry.person.id } }"
              class="text-lg font-medium text-emerald-800 underline"
              >{{ entry.person.name }}</RouterLink
            >
            <button class="btn btn-danger text-sm" @click="removeRecipient(entry)">Remove</button>
          </div>

          <ul v-if="entry.gifts.length" class="flex flex-col gap-2">
            <GiftItem v-for="g in entry.gifts" :key="g.id" :gift="g" />
          </ul>

          <div v-if="entry.ideas.length">
            <p class="mb-1 text-sm font-medium text-stone-600">Ideas</p>
            <ul class="flex flex-col gap-2">
              <IdeaItem v-for="i in entry.ideas" :key="i.id" :idea="i" :occasion-id="id" />
            </ul>
          </div>

          <ItemForm
            v-if="giftFormFor === entry.person.id"
            with-give-date
            submit-label="Add gift"
            @submit="(v) => addGift(entry.person.id, v)"
            @cancel="giftFormFor = null"
          />
          <div v-else>
            <button class="btn" @click="giftFormFor = entry.person.id">+ Add gift</button>
          </div>
        </div>
      </section>
    </template>
  </main>
  <main v-else>
    <p>
      Occasion not found.
      <RouterLink to="/" class="text-emerald-800 underline">Back home</RouterLink>
    </p>
  </main>
</template>
