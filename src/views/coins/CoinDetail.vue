<script>
import { api } from "../../services/api.js";
import {
  livePrices,
  applyLiveFlashes,
  getLiveQuote,
} from "../../services/livePrices.js";
import StatCard from "../../components/StatCard.vue";
import CoinDashboard from "../../components/CoinDashboard.vue";
import FavoriteButton from "../../components/FavoriteButton.vue";
import LoadingSpinner from "../../components/LoadingSpinner.vue";
import EmptyState from "../../components/EmptyState.vue";
import LiveBadge from "../../components/LiveBadge.vue";
import {
  formatPrice,
  formatMarketCap,
  formatVolume,
  formatChange,
  changeClass,
} from "../../utils/format.js";

export default {
  components: {
    StatCard,
    CoinDashboard,
    FavoriteButton,
    LoadingSpinner,
    EmptyState,
    LiveBadge,
  },
  data() {
    return {
      coin: null,
      loading: true,
      error: null,
      livePricesMap: {},
      liveFlashes: {},
      liveFlashTick: {},
      liveTick: 0,
      isLive: false,
    };
  },
  computed: {
    displayCoin() {
      if (!this.coin) return null;
      return this.mergeLive(this.coin);
    },
    changeCls() {
      return this.displayCoin ? changeClass(this.displayCoin.change24h) : "";
    },
  },
  watch: {
    "$route.params.id": {
      immediate: true,
      handler() {
        this.loadCoin();
      },
    },
  },
  beforeUnmount() {
    if (this._unsub) this._unsub();
    livePrices.stop();
  },
  methods: {
    formatPrice,
    formatMarketCap,
    formatVolume,
    formatChange,
    async loadCoin() {
      this.loading = true;
      this.error = null;
      if (this._unsub) {
        this._unsub();
        this._unsub = null;
      }
      livePrices.stop();

      try {
        this.coin = await api.getCoinById(this.$route.params.id);
        this.startLive();
      } catch (e) {
        this.error = e.message || "Failed to load coin";
        this.coin = null;
      } finally {
        this.loading = false;
      }
    },
    startLive() {
      if (!this.coin) return;
      if (this._unsub) this._unsub();
      livePrices.start([this.coin]);
      this._unsub = livePrices.subscribe((data) => {
        const { directions, tick } = applyLiveFlashes(
          this.liveFlashes,
          this.livePricesMap,
          data,
        );
        this.liveFlashes = directions;
        this.liveFlashTick = tick;
        this.livePricesMap = { ...data };
        this.liveTick += 1;
        this.isLive = Object.keys(data).length > 0;
      });
    },
    mergeLive(coin) {
      void this.liveTick;
      const id = String(coin.coingeckoId || coin.id);
      const live = getLiveQuote(this.livePricesMap, coin);
      if (live?.usd == null) return coin;
      return {
        ...coin,
        price: live.usd,
        change24h: live.usd_24h_change ?? coin.change24h ?? 0,
        volume24h: live.usd_24h_volume ?? coin.volume24h ?? 0,
        _flash: this.liveFlashes[id],
        _flashTick: !!this.liveFlashTick[id],
      };
    },
  },
};
</script>

<template>
  <section class="page-section">
    <div class="container">
      <LoadingSpinner v-if="loading" message="Loading coin..." />

      <EmptyState
        v-else-if="error || !displayCoin"
        title="Coin not found"
        :message="error || 'This coin does not exist.'"
        icon="HelpCircle"
      >
        <RouterLink to="/markets" class="btn btn-accent btn-sm mt-3"
          >Back to Markets</RouterLink
        >
      </EmptyState>

      <template v-else>
        <div
          class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4"
        >
          <div class="d-flex align-items-center gap-3">
            <img
              v-if="displayCoin.image"
              :src="displayCoin.image"
              :alt="displayCoin.name"
              width="48"
              height="48"
              class="rounded-circle"
            />
            <div>
              <h1 class="page-title mb-0">{{ displayCoin.name }}</h1>
              <span class="text-secondary">{{ displayCoin.symbol }}</span>
            </div>
          </div>
          <div class="d-flex gap-2 align-items-center flex-wrap">
            <LiveBadge v-if="isLive" label="Live" />
            <FavoriteButton :coin-id="displayCoin.id" />
            <RouterLink to="/markets" class="btn btn-sm btn-outline-accent"
              ><ArrowLeft :size="16" class="me-1" /> Markets</RouterLink
            >
          </div>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-12">
            <CoinDashboard :coin="displayCoin" />
          </div>
        </div>

        <div class="row g-3 mb-4">
          <div class="col-6 col-md-3">
            <StatCard
              label="Market cap"
              :value="formatMarketCap(displayCoin.marketCap)"
            />
          </div>
          <div class="col-6 col-md-3">
            <StatCard
              label="24h volume"
              :value="formatVolume(displayCoin.volume24h)"
            />
          </div>
          <div class="col-6 col-md-3">
            <StatCard
              label="24h high"
              :value="formatPrice(displayCoin.high24h)"
            />
          </div>
          <div class="col-6 col-md-3">
            <StatCard
              label="24h low"
              :value="formatPrice(displayCoin.low24h)"
            />
          </div>
        </div>

        <div v-if="displayCoin.description" class="card card-crypto p-4">
          <h2 class="h5 text-emphasis mb-2">About {{ displayCoin.name }}</h2>
          <p class="text-secondary small mb-0">{{ displayCoin.description }}</p>
        </div>
      </template>
    </div>
  </section>
</template>
