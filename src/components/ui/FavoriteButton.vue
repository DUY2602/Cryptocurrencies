<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Star } from '@lucide/vue'
import { useWatchlist } from "../../composables/useWatchlist.js"
import { user } from "../../composables/useAuth.js"

const props = defineProps({
  coinId: { type: [String, Number], required: true },
  size: { type: String, default: 'sm' },
})

const router = useRouter()
const { isFavorite, toggleFavorite } = useWatchlist()
const busy = ref(false)

const active = computed(() => isFavorite(props.coinId))

async function onClick(e) {
  e.preventDefault()
  e.stopPropagation()
  if (!user.value) {
    router.push('/login?redirect=' + encodeURIComponent(router.currentRoute.value.fullPath))
    return
  }
  if (busy.value) return
  busy.value = true
  try {
    await toggleFavorite(props.coinId)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <button
    type="button"
    class="btn btn-outline-accent"
    :class="size === 'sm' ? 'btn-sm' : ''"
    :disabled="busy"
    :aria-label="active ? 'Remove from watchlist' : 'Add to watchlist'"
    :title="active ? 'Remove from watchlist' : 'Add to watchlist'"
    @click="onClick"
  >
    <span aria-hidden="true"><Star :size="18" :fill="active ? 'currentColor' : 'none'" :class="{ 'star-active': active }" /></span>
  </button>
</template>

<style scoped>
.star-active { color: var(--accent); }
</style>
