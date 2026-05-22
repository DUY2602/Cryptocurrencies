<script>
import { api } from '../services/api.js'
import { useWatchlist } from '../composables/useWatchlist.js'
import CoinTable from '../components/CoinTable.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import EmptyState from '../components/EmptyState.vue'

export default {
  components: { CoinTable, LoadingSpinner, EmptyState },
  setup() {
    return useWatchlist()
  },
  data() {
    return {
      allCoins: [],
      loading: true,
    }
  },
  computed: {
    watchlistCoins() {
      const ids = this.watchlistIds
      return this.allCoins.filter((c) => ids.includes(String(c.id)))
    },
  },
  async mounted() {
    try {
      this.allCoins = await api.getTopCoins(50)
    } finally {
      this.loading = false
    }
  },
}
</script>

<template>
  <section class="page-section">
    <div class="container">
      <h1 class="page-title">Watchlist</h1>
      <p class="page-subtitle">Coins you saved — stored in your browser.</p>

      <LoadingSpinner v-if="loading" />

      <EmptyState
        v-else-if="watchlistCoins.length === 0"
        title="Watchlist is empty"
        message="Open Markets or a coin page and tap ☆ to add favourites."
        icon="☆"
      >
        <RouterLink to="/markets" class="btn btn-accent btn-sm mt-3">Browse markets</RouterLink>
      </EmptyState>

      <CoinTable v-else :coins="watchlistCoins" :show-rank="false" />
    </div>
  </section>
</template>
