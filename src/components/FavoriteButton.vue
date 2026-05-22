<script setup>
import { computed } from 'vue'
import { useWatchlist } from '../composables/useWatchlist.js'

const props = defineProps({
  coinId: { type: [String, Number], required: true },
  size: { type: String, default: 'sm' },
})

const { isFavorite, toggleFavorite } = useWatchlist()

const active = computed(() => isFavorite(props.coinId))

function onClick(e) {
  e.preventDefault()
  e.stopPropagation()
  toggleFavorite(props.coinId)
}
</script>

<template>
  <button
    type="button"
    class="btn btn-outline-accent"
    :class="size === 'sm' ? 'btn-sm' : ''"
    :aria-label="active ? 'Remove from watchlist' : 'Add to watchlist'"
    :title="active ? 'Remove from watchlist' : 'Add to watchlist'"
    @click="onClick"
  >
    <span aria-hidden="true">{{ active ? '★' : '☆' }}</span>
  </button>
</template>
