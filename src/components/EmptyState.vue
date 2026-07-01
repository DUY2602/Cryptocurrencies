<script setup>
defineProps({
  title: { type: String, default: 'Nothing here' },
  message: { type: String, default: '' },
  icon: { type: String, default: 'Inbox' },
})
</script>

<template>
  <div class="empty-state">
    <div class="empty-state-icon" aria-hidden="true">
      <component :is="icon" :size="32" />
    </div>
    <h3 class="h6 text-emphasis mb-1">{{ title }}</h3>
    <p v-if="message" class="small mb-0">{{ message }}</p>
    <slot />
  </div>
</template>
