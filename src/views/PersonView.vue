<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import { nextBirthdayDate, personDeleteImpact } from '@/domain/logic'
import { formatBirthday, formatDate, formatPrice, todayIso } from '@/domain/format'
import PersonForm from '@/components/PersonForm.vue'
import OccasionForm from '@/components/OccasionForm.vue'
import ItemForm from '@/components/ItemForm.vue'
import IdeaItem from '@/components/IdeaItem.vue'

const props = defineProps<{ id: string }>()
const store = useDataStore()
const router = useRouter()

const person = computed(() => store.person(props.id))
const ideas = computed(() => store.data.ideas.filter((i) => i.personId === props.id))
const history = computed(() =>
  store.data.occasions
    .map((o) => ({
      occasion: o,
      gifts: store.data.gifts.filter((g) => g.occasionId === o.id && g.personId === props.id),
    }))
    .filter((h) => h.gifts.length)
    .sort((a, b) => b.occasion.date.localeCompare(a.occasion.date)),
)

const editing = ref(false)
const addingIdea = ref(false)
const birthdayDraft = ref<{ name: string; date: string } | null>(null)

function startBirthdayOccasion() {
  const p = person.value
  if (!p?.birthday) return
  birthdayDraft.value = {
    name: `${p.name}'s birthday`,
    date: nextBirthdayDate(p.birthday, todayIso()),
  }
}

function createBirthdayOccasion(v: { name: string; date: string }) {
  const o = store.addOccasion({ ...v, recipientIds: [props.id] })
  birthdayDraft.value = null
  router.push({ name: 'occasion', params: { id: o.id } })
}

function remove() {
  const p = person.value
  if (!p) return
  const n = personDeleteImpact(store.data, p.id)
  const msg =
    `Delete ${p.name}? This will also delete ${n.ideas} idea(s) and ${n.gifts} gift(s), ` +
    `and remove them from ${n.occasions} occasion(s).`
  if (!confirm(msg)) return
  store.removePerson(p.id)
  router.push({ name: 'people' })
}
</script>

<template>
  <main v-if="person" class="flex flex-col gap-5">
    <RouterLink to="/people" class="text-sm text-emerald-800 underline">← People</RouterLink>

    <section class="card flex flex-col gap-3">
      <PersonForm
        v-if="editing"
        :initial="person"
        submit-label="Save"
        @submit="
          (v) => {
            store.updatePerson(person!.id, v)
            editing = false
          }
        "
        @cancel="editing = false"
      />
      <template v-else>
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 class="text-2xl font-semibold">{{ person.name }}</h1>
            <p v-if="person.birthday" class="text-stone-600">
              🎂 {{ formatBirthday(person.birthday) }}
            </p>
          </div>
          <div class="flex gap-1">
            <button class="btn" @click="editing = true">Edit</button>
            <button class="btn btn-danger" @click="remove">Delete</button>
          </div>
        </div>
        <div v-if="person.birthday && !birthdayDraft">
          <button class="btn" @click="startBirthdayOccasion">Create birthday occasion</button>
        </div>
        <div v-if="birthdayDraft" class="rounded-md border border-stone-200 p-3">
          <OccasionForm
            :initial="birthdayDraft"
            submit-label="Create occasion"
            @submit="createBirthdayOccasion"
            @cancel="birthdayDraft = null"
          />
        </div>
      </template>
    </section>

    <section class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Ideas</h2>
        <button v-if="!addingIdea" class="btn" @click="addingIdea = true">+ Add idea</button>
      </div>
      <div v-if="addingIdea" class="card">
        <ItemForm
          submit-label="Add idea"
          @submit="
            (v) => {
              store.addIdea({ personId: id, ...v })
              addingIdea = false
            }
          "
          @cancel="addingIdea = false"
        />
      </div>
      <p v-if="!ideas.length && !addingIdea" class="text-stone-600">No ideas yet.</p>
      <ul class="flex flex-col gap-2">
        <IdeaItem v-for="i in ideas" :key="i.id" :idea="i" manage />
      </ul>
    </section>

    <section class="flex flex-col gap-2">
      <h2 class="text-lg font-semibold">Gift history</h2>
      <p v-if="!history.length" class="text-stone-600">No gifts yet.</p>
      <div v-for="h in history" :key="h.occasion.id" class="card">
        <RouterLink
          :to="{ name: 'occasion', params: { id: h.occasion.id } }"
          class="font-medium text-emerald-800 underline"
          >{{ h.occasion.name }}</RouterLink
        >
        <span class="text-sm text-stone-600"> · {{ formatDate(h.occasion.date) }}</span>
        <ul class="mt-2 flex flex-col gap-1 text-sm">
          <li v-for="g in h.gifts" :key="g.id" class="flex justify-between gap-2">
            <span
              >{{ g.name }} <span class="text-stone-500">({{ g.status }})</span></span
            >
            <span>{{ formatPrice(g.price) }}</span>
          </li>
        </ul>
      </div>
    </section>
  </main>
  <main v-else>
    <p>
      Person not found.
      <RouterLink to="/people" class="text-emerald-800 underline">Back to people</RouterLink>
    </p>
  </main>
</template>
