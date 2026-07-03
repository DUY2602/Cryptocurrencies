<script setup>
defineProps({
  message: { type: String, default: 'Loading...' },
})
</script>

<template>
  <div class="loading-wrap" role="status">
    <div class="spinner-crypto" aria-hidden="true"></div>
    <span>{{ message }}</span>
  </div>
</template>
