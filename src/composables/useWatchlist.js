import { ref, computed } from 'vue'

const STORAGE_KEY = 'cryptodash-watchlist'

const ids = ref([])

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    ids.value = raw ? JSON.parse(raw) : []
  } catch {
    ids.value = []
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.value))
}

load()

export function useWatchlist() {
  const watchlistIds = computed(() => ids.value)

  function isFavorite(coinId) {
    return ids.value.includes(String(coinId))
  }

  function toggleFavorite(coinId) {
    const id = String(coinId)
    const idx = ids.value.indexOf(id)
    if (idx >= 0) {
      ids.value = ids.value.filter((x) => x !== id)
    } else {
      ids.value = [...ids.value, id]
    }
    save()
  }

  function removeFavorite(coinId) {
    ids.value = ids.value.filter((x) => x !== String(coinId))
    save()
  }

  return {
    watchlistIds,
    isFavorite,
    toggleFavorite,
    removeFavorite,
  }
}
