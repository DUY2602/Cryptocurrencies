<script setup>
defineProps({
  label: { type: String, default: 'Price chart — coming soon' },
})
</script>

<template>
  <div class="chart-placeholder">
    <div class="text-center px-3">
      <div class="mb-2 opacity-50"><TrendingUp :size="24" /></div>
      <span>{{ label }}</span>
    </div>
  </div>
</template>
