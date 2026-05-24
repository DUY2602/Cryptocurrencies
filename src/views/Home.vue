<script>
import { RouterLink } from 'vue-router'
import HeroSection from '../components/HeroSection.vue'
import CoinCard from '../components/CoinCard.vue'
import MarketOverviewCards from '../components/MarketOverviewCards.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import LiveBadge from '../components/LiveBadge.vue'
import { api } from '../services/api.js'
import { livePrices, applyLiveFlashes, getLiveQuote } from '../services/livePrices.js'
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
      livePricesMap: {},
      liveFlashes: {},
      liveFlashTick: {},
      liveTick: 0,
      isLive: false,
    }
  },
  computed: {
    liveAllCoins() {
      return this.allCoins.map((c) => this.mergeLive(c))
    },
    liveTrending() {
      return this.trending.map((c) => this.mergeLive(c))
    },
    topGainers() {
      return [...this.liveAllCoins].sort((a, b) => b.change24h - a.change24h).slice(0, 6)
    },
    topLosers() {
      return [...this.liveAllCoins].sort((a, b) => a.change24h - b.change24h).slice(0, 6)
    },
    marketStats() {
      const totalCap = this.liveAllCoins.reduce((s, c) => s + (c.marketCap || 0), 0)
      const avgChange =
        this.liveAllCoins.length > 0
          ? this.liveAllCoins.reduce((s, c) => s + c.change24h, 0) / this.liveAllCoins.length
          : 0
      return { totalCap, avgChange, count: this.liveAllCoins.length }
    },
  },
  async mounted() {
    try {
      const [trending, top] = await Promise.all([
        api.getTrendingCoins(),
        api.getTopCoins(50),
      ])
      this.trending = trending
      this.allCoins = top
    } catch {
      this.trending = localCoins.slice(0, 6)
      this.allCoins = localCoins
    } finally {
      this.loading = false
      this.startLive()
    }
  },
  beforeUnmount() {
    if (this._unsub) this._unsub()
    livePrices.stop()
  },
  methods: {
    startLive() {
      if (this._unsub) this._unsub()
      livePrices.start([...this.trending, ...this.allCoins])
      this._unsub = livePrices.subscribe((data) => {
        const { directions, tick } = applyLiveFlashes(
          this.liveFlashes,
          this.livePricesMap,
          data,
        )
        this.liveFlashes = directions
        this.liveFlashTick = tick
        this.livePricesMap = { ...data }
        this.liveTick += 1
        this.isLive = Object.keys(data).length > 0
      })
    },
    mergeLive(coin) {
      void this.liveTick
      const id = String(coin.coingeckoId || coin.id)
      const live = getLiveQuote(this.livePricesMap, coin)
      if (live?.usd == null) return coin
      return {
        ...coin,
        price: live.usd,
        change24h: live.usd_24h_change ?? coin.change24h ?? 0,
        _flash: this.liveFlashes[id],
        _flashTick: !!this.liveFlashTick[id],
      }
    },
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
          <LiveBadge v-if="isLive && !loading" label="Live" />
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
              v-for="coin in liveTrending"
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
