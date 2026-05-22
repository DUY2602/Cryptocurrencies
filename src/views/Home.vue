<script>
import { RouterLink } from 'vue-router'
import HeroSection from '../components/HeroSection.vue'
import CoinCard from '../components/CoinCard.vue'
import MarketOverviewCards from '../components/MarketOverviewCards.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import LiveBadge from '../components/LiveBadge.vue'
import { api } from '../services/api.js'
import { coins as localCoins } from '../data/coins.js'

export default {
  components: {
    RouterLink,
    HeroSection,
    CoinCard,
    MarketOverviewCards,
    LoadingSpinner,
    LiveBadge,
  },
  data() {
    return {
      trending: [],
      allCoins: [],
      loading: true,
    }
  },
  computed: {
    topGainers() {
      return [...this.allCoins].sort((a, b) => b.change24h - a.change24h).slice(0, 6)
    },
    topLosers() {
      return [...this.allCoins].sort((a, b) => a.change24h - b.change24h).slice(0, 6)
    },
    marketStats() {
      const totalCap = this.allCoins.reduce((s, c) => s + (c.marketCap || 0), 0)
      const avgChange =
        this.allCoins.length > 0
          ? this.allCoins.reduce((s, c) => s + c.change24h, 0) / this.allCoins.length
          : 0
      return { totalCap, avgChange, count: this.allCoins.length }
    },
  },
  async mounted() {
    try {
      const [trending, top] = await Promise.all([
        api.getTrendingCoins(),
        api.getTopCoins(20),
      ])
      this.trending = trending
      this.allCoins = top
    } catch {
      this.trending = localCoins.slice(0, 6)
      this.allCoins = localCoins
    } finally {
      this.loading = false
    }
  },
}
</script>

<template>
  <div>
    <HeroSection />

    <section class="page-section">
      <div class="container">
        <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
          <h2 class="section-heading mb-0">Market overview</h2>
          <LiveBadge v-if="!loading" label="API" />
        </div>

        <div v-if="!loading" class="row g-3 mb-5">
          <div class="col-md-4">
            <div class="card card-crypto stat-card">
              <p class="stat-card-label">Tracked coins</p>
              <p class="stat-card-value">{{ marketStats.count }}</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card card-crypto stat-card">
              <p class="stat-card-label">Combined market cap</p>
              <p class="stat-card-value small">${{ (marketStats.totalCap / 1e12).toFixed(2) }}T</p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card card-crypto stat-card">
              <p class="stat-card-label">Avg 24h change</p>
              <p
                class="stat-card-value"
                :class="marketStats.avgChange >= 0 ? 'text-positive' : 'text-negative'"
              >
                {{ marketStats.avgChange >= 0 ? '+' : '' }}{{ marketStats.avgChange.toFixed(2) }}%
              </p>
            </div>
          </div>
        </div>

        <LoadingSpinner v-if="loading" message="Loading dashboard..." />

        <template v-else>
          <h2 class="section-heading mb-3">Trending</h2>
          <div class="row g-4 mb-5">
            <div
              v-for="coin in trending"
              :key="coin.id"
              class="col-6 col-md-4 col-lg-2"
            >
              <RouterLink :to="{ name: 'CoinDetail', params: { id: coin.id } }" class="text-decoration-none">
                <CoinCard :coin="coin" />
              </RouterLink>
            </div>
          </div>

          <MarketOverviewCards :coins="topGainers" title="Top gainers (24h)" />
          <MarketOverviewCards :coins="topLosers" title="Top losers (24h)" />

          <div class="card card-crypto p-4">
            <h3 class="h5 text-emphasis mb-2">Portfolio summary</h3>
            <p class="text-secondary small mb-3">
              UI preview — connect a wallet or exchange account in a later stage.
            </p>
            <div class="row g-3">
              <div class="col-sm-4">
                <p class="stat-card-label mb-0">Holdings</p>
                <p class="stat-card-value h5">—</p>
              </div>
              <div class="col-sm-4">
                <p class="stat-card-label mb-0">Total value</p>
                <p class="stat-card-value h5">—</p>
              </div>
              <div class="col-sm-4">
                <p class="stat-card-label mb-0">P/L today</p>
                <p class="stat-card-value h5">—</p>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>
