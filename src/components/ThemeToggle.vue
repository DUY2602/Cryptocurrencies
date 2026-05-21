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
      <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
        <path d="M6 .278a.768.768 0 0 1 .08.828 7.984 7.984 0 0 0-.923 3.217 8 8 0 0 0 7.743 7.743 7.984 7.984 0 0 0 3.217-.923.768.768 0 0 1 .828.08 8.097 8.097 0 0 1-1.854 2.707 8.19 8.19 0 0 1-2.707 1.854.768.768 0 0 1-.828-.08 7.984 7.984 0 0 0-3.217.923 8 8 0 0 1-7.743-7.743 7.984 7.984 0 0 0-.923-3.217.768.768 0 0 1 .08-.828A8.097 8.097 0 0 1 3.854.146 8.19 8.19 0 0 1 6.561 0a8.098 8.098 0 0 1 1.439 0z"/>
      </svg>
    </span>
    <span class="theme-toggle-label d-none d-sm-inline">
      {{ isDark ? 'Day' : 'Night' }}
    </span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.65rem;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-primary);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}

.theme-toggle:hover {
  background: var(--bg-card-hover);
  border-color: var(--accent);
  color: var(--accent);
}

.theme-toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 0.2rem rgba(240, 185, 11, 0.35);
}

.theme-toggle-icon {
  display: inline-flex;
  line-height: 0;
}
</style>
