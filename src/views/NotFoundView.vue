<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{ message?: string }>()
</script>

<template>
  <div class="card text-center">
    <p class="mb-3 text-stone-600">{{ message ?? "That page doesn't exist." }}</p>
    <RouterLink to="/" class="btn">Back to occasions</RouterLink>
  </div>
</template>
