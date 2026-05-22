<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  changeClass: { type: String, default: '' },
})
</script>

<template>
  <div class="card card-crypto stat-card h-100">
    <p class="stat-card-label mb-0">{{ label }}</p>
    <p class="stat-card-value mb-0" :class="changeClass">{{ value }}</p>
  </div>
</template>
