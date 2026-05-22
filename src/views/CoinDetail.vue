<script>
import { api } from '../services/api.js'
import StatCard from '../components/StatCard.vue'
import ChartPlaceholder from '../components/ChartPlaceholder.vue'
import FavoriteButton from '../components/FavoriteButton.vue'
import VoteButtons from '../components/VoteButtons.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import EmptyState from '../components/EmptyState.vue'
import { formatPrice, formatMarketCap, formatVolume, formatChange, changeClass } from '../utils/format.js'

export default {
  components: {
    StatCard,
    ChartPlaceholder,
    FavoriteButton,
    VoteButtons,
    LoadingSpinner,
    EmptyState,
  },
  data() {
    return {
      coin: null,
      loading: true,
      error: null,
    }
  },
  computed: {
    changeCls() {
      return this.coin ? changeClass(this.coin.change24h) : ''
    },
  },
  watch: {
    '$route.params.id': {
      immediate: true,
      handler() {
        this.loadCoin()
      },
    },
  },
  methods: {
    formatPrice,
    formatMarketCap,
    formatVolume,
    formatChange,
    async loadCoin() {
      this.loading = true
      this.error = null
      try {
        this.coin = await api.getCoinById(this.$route.params.id)
      } catch (e) {
        this.error = e.message || 'Failed to load coin'
        this.coin = null
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<template>
  <section class="page-section">
    <div class="container">
      <LoadingSpinner v-if="loading" message="Loading coin..." />

      <EmptyState
        v-else-if="error || !coin"
        title="Coin not found"
        :message="error || 'This coin does not exist.'"
        icon="?"
      >
        <RouterLink to="/markets" class="btn btn-accent btn-sm mt-3">Back to Markets</RouterLink>
      </EmptyState>

      <template v-else>
        <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
          <div class="d-flex align-items-center gap-3">
            <img v-if="coin.image" :src="coin.image" :alt="coin.name" width="48" height="48" class="rounded-circle" />
            <div>
              <h1 class="page-title mb-0">{{ coin.name }}</h1>
              <span class="text-secondary">{{ coin.symbol }}</span>
            </div>
          </div>
          <div class="d-flex gap-2 align-items-center">
            <FavoriteButton :coin-id="coin.id" />
            <RouterLink to="/markets" class="btn btn-sm btn-outline-accent">← Markets</RouterLink>
          </div>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-lg-8">
            <ChartPlaceholder :label="`${coin.symbol} price chart placeholder`" />
          </div>
          <div class="col-lg-4">
            <div class="card card-crypto p-4 h-100">
              <p class="stat-card-label mb-1">Current price</p>
              <p class="display-6 fw-bold text-emphasis mb-2">{{ formatPrice(coin.price) }}</p>
              <p class="fw-semibold mb-3" :class="changeCls">{{ formatChange(coin.change24h) }} (24h)</p>
              <VoteButtons :coin-id="coin.id" />
            </div>
          </div>
        </div>

        <div class="row g-3 mb-4">
          <div class="col-6 col-md-3">
            <StatCard label="Market cap" :value="formatMarketCap(coin.marketCap)" />
          </div>
          <div class="col-6 col-md-3">
            <StatCard label="24h volume" :value="formatVolume(coin.volume24h)" />
          </div>
          <div class="col-6 col-md-3">
            <StatCard label="24h high" :value="formatPrice(coin.high24h)" />
          </div>
          <div class="col-6 col-md-3">
            <StatCard label="24h low" :value="formatPrice(coin.low24h)" />
          </div>
        </div>

        <div v-if="coin.description" class="card card-crypto p-4">
          <h2 class="h5 text-emphasis mb-2">About {{ coin.name }}</h2>
          <p class="text-secondary small mb-0">{{ coin.description }}</p>
        </div>
      </template>
    </div>
  </section>
</template>
