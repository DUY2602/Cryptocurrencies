<script>
import { api } from "../../services/api.js";
import {
  livePrices,
  applyLiveFlashes,
  getLiveQuote,
} from "../../services/livePrices.js";
import { useWatchlist } from "../../composables/useWatchlist.js";
import { formatPrice, formatMarketCap, formatChange, changeClass } from "../../utils/format.js";
import LoadingSpinner from "../../components/ui/LoadingSpinner.vue";
import EmptyState from "../../components/ui/EmptyState.vue";
import PageHero from "../../components/layout/PageHero.vue";

export default {
  components: { LoadingSpinner, EmptyState, PageHero },
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
  methods: {
    formatPrice, formatMarketCap, formatChange, changeClass,
    changeColor(coin) {
      return coin.change24h >= 0 ? 'text-positive' : 'text-negative'
    },
    async loadCoins() {
      try {
        this.allCoins = await api.getTopCoins(50);
      } finally {
        this.loading = false;
        this.startLive();
      }
    },
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
  mounted() {
    this.loadCoins();
  },
  beforeUnmount() {
    if (this._unsub) this._unsub();
    livePrices.stop();
  },
};
</script>

<template>
  <section class="page-section watchlist-page">
    <PageHero title="Watchlist" subtitle="Coins you track — live prices via WebSocket." />

    <div class="container pt-4">
      <LoadingSpinner v-if="loading" />

      <EmptyState
        v-else-if="watchlistCoins.length === 0"
        title="Watchlist is empty"
        icon="Star"
      >
        <p class="small mb-0">Open Markets or a coin page and tap <Star :size="14" /> to add favourites.</p>
        <RouterLink to="/markets" class="btn btn-accent btn-sm mt-3"
          >Browse markets</RouterLink
        >
      </EmptyState>

      <template v-else>
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div class="d-flex align-items-center gap-2">
            <Star :size="18" class="text-accent" :fill="'currentColor'" />
            <span class="fw-bold text-emphasis">{{ watchlistCoins.length }} coins</span>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="small text-secondary" v-if="isLive">
              <span class="live-dot"></span> Live
            </span>
            <RouterLink to="/markets" class="btn btn-sm btn-outline-accent">Browse markets</RouterLink>
          </div>
        </div>

        <div class="table-crypto-wrap">
          <table class="table-crypto">
            <thead>
              <tr class="table-crypto-head d-none d-lg-table-row">
                <th class="cell-rank" scope="col">#</th>
                <th class="cell-name" scope="col">Name</th>
                <th class="cell-price" scope="col">Last Price</th>
                <th class="cell-change" scope="col">24h Change</th>
                <th class="cell-volume" scope="col">24h Volume</th>
                <th class="cell-cap" scope="col">Market Cap</th>
                <th class="cell-act" scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(coin, idx) in watchlistCoins"
                :key="coin.id"
                class="table-crypto-row"
                :class="[coin.change24h >= 0 ? 'is-gainer' : 'is-loser', { 'row-disabled': coin._hasBinanceChart === false }]"
              >
                <td class="cell-rank text-secondary">
                  {{ idx + 1 }}
                </td>

                <td class="cell-name">
                  <RouterLink
                    :to="{ name: 'CoinDetail', params: { id: coin.id } }"
                    class="coin-link"
                    :class="{ 'text-muted opacity-50': coin._hasBinanceChart === false }"
                  >
                    <img
                      v-if="coin.image"
                      :src="coin.image"
                      :alt="coin.name"
                      class="coin-icon"
                      width="28"
                      height="28"
                    />
                    <span class="coin-name-cell"
                      >{{ coin.name }} <small>{{ coin.symbol }}</small></span
                    >
                  </RouterLink>
                </td>

                <td class="cell-price">
                  <span
                    class="price-value"
                    :class="coin._flash === 'up' ? 'flash-up' : coin._flash === 'down' ? 'flash-down' : ''"
                  >
                    {{ formatPrice(coin.price)
                    }}<span
                      class="text-secondary small"
                      style="margin-left: 4px; font-size: 0.78rem"
                      >USDT</span
                    >
                  </span>
                </td>

                <td class="cell-change">
                  <span
                    class="change-value fw-bold d-flex align-items-center justify-content-end gap-1"
                    :class="changeColor(coin)"
                  >
                    <span class="arrow" v-if="coin.change24h >= 0">
                      <ArrowUp :size="10" />
                    </span>
                    <span class="arrow" v-else>
                      <ArrowDown :size="10" />
                    </span>
                    {{ formatChange(coin.change24h) }}
                  </span>
                </td>

                <td class="cell-volume text-secondary small d-none d-lg-table-cell">
                  {{ formatMarketCap(coin.volume24h) }}
                </td>
                <td class="cell-cap text-secondary small d-none d-lg-table-cell">
                  {{ formatMarketCap(coin.marketCap) }}
                </td>

                <td class="cell-act">
                  <div class="action-buttons">
                    <button
                      type="button"
                      class="btn-icon"
                      :aria-label="
                        isFavorite(coin.id)
                          ? 'Remove from watchlist'
                          : 'Add to watchlist'
                      "
                      @click="toggleFavorite(coin.id)"
                    >
                      <Star :size="18" :fill="isFavorite(coin.id) ? 'currentColor' : 'none'" :class="{ 'star-active': isFavorite(coin.id) }" />
                    </button>
                    <RouterLink
                      :to="{ name: 'CoinDetail', params: { id: coin.id } }"
                      class="btn btn-xs btn-primary"
                      :class="{ disabled: coin._hasBinanceChart === false }"
                    >
                      Trade
                    </RouterLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.watchlist-page {
  padding-top: 0;
}
.live-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--positive);
  animation: pulse-dot 1.6s ease-in-out infinite;
  vertical-align: middle;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.text-accent { color: var(--accent); }
.star-active { color: var(--accent); }

/* ── Table (same as Markets) ───── */
.table-crypto-wrap {
  background: var(--table-bg);
  border: 1px solid var(--table-border);
  border-radius: var(--radius-lg);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  box-shadow: var(--shadow-sm);
}
.table-crypto { width: 100%; min-width: 560px; border-collapse: collapse; }
.table-crypto-head {
  background: var(--table-header-bg);
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.table-crypto-head th {
  padding: 1rem 0.85rem;
  border-bottom: 1px solid var(--table-border);
  vertical-align: middle;
}
.cell-rank { width: 60px; padding-left: 1.25rem; }
.cell-name { width: auto; }
.cell-price { width: 140px; text-align: right; }
.cell-change { width: 120px; text-align: right; }
.cell-volume { width: 130px; text-align: right; }
.cell-cap { width: 140px; text-align: right; }
.cell-act { width: 150px; text-align: right; padding-right: 1.25rem; }
.table-crypto-row {
  border-bottom: 1px solid var(--table-border);
  color: var(--text-primary);
  font-size: 0.88rem;
  position: relative;
}
.table-crypto-row:last-child { border-bottom: none; }
.table-crypto-row td {
  padding: 0.85rem 0.85rem;
  vertical-align: middle;
}
.table-crypto-row.is-gainer td:first-child { box-shadow: inset 3px 0 0 0 var(--positive); }
.table-crypto-row.is-loser td:first-child { box-shadow: inset 3px 0 0 0 var(--negative); }
.table-crypto-row:hover { background: var(--table-bg-hover); }
.table-crypto-row:hover td:first-child { box-shadow: inset 3px 0 0 0 var(--accent); }
.coin-link {
  display: flex; align-items: center; gap: 0.65rem;
  text-decoration: none; color: inherit;
}
.coin-icon { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.05); box-shadow: 0 2px 5px rgba(0,0,0,0.2); object-fit: cover; }
.coin-name-cell { font-weight: 700; color: var(--text-emphasis); font-size: 0.9rem; }
.coin-name-cell small { color: var(--text-secondary); font-weight: 500; font-size: 0.75rem; margin-left: 0.2rem; text-transform: uppercase; }
.price-value {
  font-weight: 700; font-size: 0.9rem; color: var(--text-emphasis);
  font-variant-numeric: tabular-nums;
  font-family: "JetBrains Mono", SFMono-Regular, ui-monospace, monospace;
}
.change-value { font-weight: 700; font-size: 0.85rem; }
.action-buttons { display: flex; align-items: center; justify-content: flex-end; gap: 0.65rem; }
.btn-icon {
  background: transparent; border: none; color: var(--text-secondary);
  font-size: 1.1rem; cursor: pointer; padding: 0.25rem; border-radius: 6px;
  display: inline-flex; align-items: center; justify-content: center;
}
.btn-icon:hover { color: var(--accent); background: rgba(255,200,55,0.08); }
.btn-primary {
  background: var(--accent); color: var(--accent-text); border: none; border-radius: 8px;
  font-weight: 700; font-size: 0.78rem; padding: 0.35rem 0.85rem;
  cursor: pointer; text-decoration: none; box-shadow: 0 2px 8px rgba(255,200,55,0.15);
}
.btn-primary:hover { background: var(--accent-hover); color: var(--accent-text); }
.btn-xs { padding: 0.3rem 0.65rem; font-size: 0.75rem; }
.flash-up { animation: flashGreen 0.55s ease; color: var(--positive); }
.flash-down { animation: flashRed 0.55s ease; color: var(--negative); }
@keyframes flashGreen {
  0% { background-color: var(--positive-bg); }
  100% { background-color: transparent; }
}
@keyframes flashRed {
  0% { background-color: var(--negative-bg); }
  100% { background-color: transparent; }
}
.row-disabled { opacity: 0.45; pointer-events: none; }

@media (max-width: 991px) {
  .cell-volume, .cell-cap { display: none; }
  .price-value { font-size: 0.82rem; }
  .cell-rank { width: 45px; padding-left: 0.5rem; }
  .cell-act { width: 130px; }
}
@media (max-width: 768px) {
  .cell-price { width: 110px; }
  .cell-change { width: 90px; }
  .cell-act { width: 110px; }
  .coin-name-cell { font-size: 0.82rem; }
  .coin-name-cell small { font-size: 0.7rem; }
  .table-crypto-row td { padding: 0.65rem 0.5rem; }
  .table-crypto { min-width: 480px; }
}
@media (max-width: 575px) {
  .cell-rank { width: 35px; padding-left: 0.25rem; }
  .cell-change { width: auto; }
  .cell-price { width: 90px; }
  .cell-act { width: 90px; }
  .coin-icon { width: 22px; height: 22px; }
  .coin-link { gap: 0.4rem; }
  .table-crypto { min-width: 380px; }
  .btn-icon { padding: 0.15rem; }
  .btn-xs { padding: 0.25rem 0.5rem; font-size: 0.7rem; }
}
</style>
