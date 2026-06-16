<script>
import { api } from "../../services/api.js";
import {
  livePrices,
  applyLiveFlashes,
  getLiveQuote,
} from "../../services/livePrices.js";
import { useWatchlist } from "../../composables/useWatchlist.js";
import CoinTable from "../../components/CoinTable.vue";
import LoadingSpinner from "../../components/LoadingSpinner.vue";
import EmptyState from "../../components/EmptyState.vue";
import LiveBadge from "../../components/LiveBadge.vue";
import PageHero from "../../components/PageHero.vue";

export default {
  components: { CoinTable, LoadingSpinner, EmptyState, LiveBadge, PageHero },
  setup() {
    return useWatchlist();
  },
  data() {
    return {
      allCoins: [],
      loading: true,
      livePricesMap: {},
      liveFlashes: {},
      liveFlashTick: {},
      liveTick: 0,
      isLive: false,
    };
  },
  computed: {
    watchlistCoins() {
      const ids = this.watchlistIds;
      return this.allCoins
        .filter((c) => ids.includes(String(c.id)))
        .map((c) => this.mergeLive(c));
    },
  },
  async mounted() {
    try {
      this.allCoins = await api.getTopCoins(50);
    } finally {
      this.loading = false;
      this.startLive();
    }
  },
  beforeUnmount() {
    if (this._unsub) this._unsub();
    livePrices.stop();
  },
  methods: {
    startLive() {
      const tracked = this.watchlistIds.length
        ? this.allCoins.filter((c) => this.watchlistIds.includes(String(c.id)))
        : this.allCoins;

      if (this._unsub) this._unsub();
      livePrices.start(tracked);
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
        _flash: this.liveFlashes[id],
        _flashTick: !!this.liveFlashTick[id],
      };
    },
  },
};
</script>

<template>
  <section>
    <PageHero title="Watchlist" subtitle="Coins you saved — live prices via WebSocket." />

    <div class="container">
      <LoadingSpinner v-if="loading" />

      <EmptyState
        v-else-if="watchlistCoins.length === 0"
        title="Watchlist is empty"
        message="Open Markets or a coin page and tap ☆ to add favourites."
        icon="☆"
      >
        <RouterLink to="/markets" class="btn btn-accent btn-sm mt-3"
          >Browse markets</RouterLink
        >
      </EmptyState>

      <CoinTable v-else :coins="watchlistCoins" :show-rank="false" />
    </div>
  </section>
</template>
