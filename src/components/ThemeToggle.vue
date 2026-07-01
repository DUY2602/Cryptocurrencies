<script setup>
import { useTheme } from '../composables/useTheme.js'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <button
    type="button"
    class="btn theme-toggle"
    :aria-label="isDark ? 'Switch to day mode' : 'Switch to night mode'"
    :title="isDark ? 'Day mode' : 'Night mode'"
    @click="toggleTheme"
  >
    <span class="theme-toggle-icon" aria-hidden="true">
      <Sun v-if="isDark" :size="18" /><Moon v-else :size="18" />
    </span>
    <span class="theme-toggle-label d-none d-sm-inline">{{ isDark ? 'Day' : 'Night' }}</span>
  </button>
</template>
