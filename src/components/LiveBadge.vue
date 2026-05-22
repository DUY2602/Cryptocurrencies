<script setup>
defineProps({
  label: { type: String, default: 'Live' },
})
</script>

<template>
  <span class="badge-live">
    <span class="badge-live-dot" aria-hidden="true"></span>
    {{ label }}
  </span>
</template>
