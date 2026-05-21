import { ref, computed } from 'vue'

const STORAGE_KEY = 'cryptodash-theme'

const theme = ref(
  typeof localStorage !== 'undefined'
    ? localStorage.getItem(STORAGE_KEY) || 'dark'
    : 'dark'
)

function applyTheme(value) {
  document.documentElement.setAttribute('data-theme', value)
  localStorage.setItem(STORAGE_KEY, value)
}

export function initTheme() {
  applyTheme(theme.value)
}

export function useTheme() {
  const isDark = computed(() => theme.value === 'dark')

  function setTheme(value) {
    if (value !== 'dark' && value !== 'light') return
    theme.value = value
    applyTheme(value)
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  }
}
