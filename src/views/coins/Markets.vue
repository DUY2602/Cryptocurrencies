<script>
import { api } from "../../services/api.js";
import {
  livePrices,
  applyLiveFlashes,
  getLiveQuote,
} from "../../services/livePrices.js";
import { useWatchlist } from "../../composables/useWatchlist.js";
import SearchBar from "../../components/SearchBar.vue";
import SortSelect from "../../components/SortSelect.vue";
import BinanceSparkline from "../../components/BinanceSparkline.vue";
import LoadingSpinner from "../../components/LoadingSpinner.vue";
import EmptyState from "../../components/EmptyState.vue";
import LiveBadge from "../../components/LiveBadge.vue";
import PageHero from "../../components/PageHero.vue";
import {
  formatPrice,
  formatMarketCap,
  formatChange,
  changeClass,
} from "../../utils/format.js";

const ITEMS_PER_PAGE = 20;

export default {
  components: {
    SearchBar,
    SortSelect,
    BinanceSparkline,
    LoadingSpinner,
    EmptyState,
    LiveBadge,
    PageHero,
  },
  setup() {
    return useWatchlist();
  },
  data() {
    return {
      allCoins: [],
      searchQuery: "",
      sortBy: "default",
      currentPage: 1,
      itemsPerPage: ITEMS_PER_PAGE,
      loading: true,
      error: null,
      livePricesMap: {},
      liveFlashes: {},
      liveFlashTick: {},
      liveTick: 0,
      isLive: false,
      lastCoinPrice: {},
    };
  },
  computed: {
    filteredCoins() {
      const q = this.searchQuery.trim().toLowerCase();
      let list = [...this.allCoins];
      if (q) {
        list = list.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.symbol.toLowerCase().includes(q),
        );
      }
      if (this.sortBy === "default") {
        list.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
      } else if (this.sortBy === "price") {
        list.sort((a, b) => b.price - a.price);
      } else if (this.sortBy === "gainers") {
        list.sort((a, b) => b.change24h - a.change24h);
      } else if (this.sortBy === "losers") {
        list.sort((a, b) => a.change24h - b.change24h);
      }
      return list.map((c) => this.mergeLive(c));
    },
    totalPages() {
      return Math.max(
        1,
        Math.ceil(this.filteredCoins.length / this.itemsPerPage),
      );
    },
    paginatedCoins() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredCoins.slice(start, start + this.itemsPerPage);
    },
    visiblePages() {
      const maxVisible = 5;
      const total = this.totalPages;
      const current = this.currentPage;
      if (total <= maxVisible)
        return Array.from({ length: total }, (_, i) => i + 1);
      const start = Math.max(1, current - Math.floor(maxVisible / 2));
      const end = Math.min(total, start + maxVisible - 1);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    },
    marketStats() {
      const n = this.filteredCoins.length;
      const gainers =
        n > 0 ? this.filteredCoins.filter((c) => c.change24h >= 0).length : 0;
      const losers = n - gainers;
      return { n, gainers, losers };
    },
  },
  watch: {
    searchQuery() {
      this.currentPage = 1;
    },
    sortBy() {
      this.currentPage = 1;
    },
    filteredCoins() {
      if (this.currentPage > this.totalPages)
        this.currentPage = this.totalPages;
    },
  },
  async mounted() {
    await this.loadCoins();
    if (this.allCoins.length) this.startLive();
  },
  beforeUnmount() {
    if (this._unsub) this._unsub();
    livePrices.stop();
  },
  methods: {
    async loadCoins() {
      this.loading = true;
      this.error = null;
      try {
        this.allCoins = await api.getTopCoins(100);
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
    startLive() {
      if (this._unsub) this._unsub();
      livePrices.start(this.allCoins);
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
      const prev = this.lastCoinPrice[id] ?? coin.price;
      this.lastCoinPrice[id] = live.usd;
      return {
        ...coin,
        price: live.usd,
        change24h: live.usd_24h_change ?? coin.change24h ?? 0,
        volume24h: live.usd_24h_volume ?? coin.volume24h ?? 0,
        _flash: this.liveFlashes[id],
        _flashTick: !!this.liveFlashTick[id],
        _priceUp: live.usd > prev,
        _priceDown: live.usd < prev,
      };
    },
    sparkTrend(coin) {
      return coin.change24h >= 0 ? "up" : "down";
    },
    changeColor(coin) {
      return changeClass(coin.change24h);
    },
    formatPrice,
    formatMarketCap,
    formatChange,
    changeClass,
    onPageChange(page) {
      this.currentPage = page;
    },
  },
};
</script>

<template>
  <section class="page-section markets-page">
    <PageHero
      title="Cryptocurrency Prices"
      :subtitle="`${marketStats.n} coins · ${marketStats.gainers} gainers · ${marketStats.losers} losers`"
    />

    <div class="container">
        <div class="row g-2 mb-3 align-items-end">
          <div class="col-12 col-md-5 col-lg-4 col-xl-3">
            <SearchBar
              v-model="searchQuery"
              placeholder="Search by name or symbol..."
            />
          </div>
          <div class="col-6 col-md-3 col-lg-2">
            <SortSelect v-model="sortBy" />
          </div>
          <div class="col-6 col-md-4 col-lg-3 col-xl-2 ms-auto">
            <p class="text-secondary small mb-0 text-md-end">
              <template v-if="!loading">
                Showing {{ (currentPage - 1) * itemsPerPage + 1 }}&ndash;{{
                  Math.min(currentPage * itemsPerPage, filteredCoins.length)
                }}
                of {{ filteredCoins.length }} coins
              </template>
            </p>
          </div>
        </div>

        <LoadingSpinner v-if="loading" message="Loading markets..." />

        <template v-else>
          <EmptyState
            v-if="filteredCoins.length === 0"
            title="No matches"
            message="Try a different search term or clear the filter."
            icon="⌕"
          />

          <div v-else class="table-crypto-wrap">
            <div class="table-crypto">
              <div class="table-crypto-head d-none d-lg-flex">
                <div class="cell-rank">#</div>
                <div class="cell-name">Name</div>
                <div class="cell-price">Last Price</div>
                <div class="cell-change">24h Change</div>
                <div class="cell-spark">Last</div>
                <div class="cell-volume">24h Volume</div>
                <div class="cell-cap">Market Cap</div>
                <div class="cell-act">Action</div>
              </div>

              <div
                v-for="(coin, idx) in paginatedCoins"
                :key="coin.id"
                class="table-crypto-row"
                :class="coin.change24h >= 0 ? 'is-gainer' : 'is-loser'"
              >
                <div class="cell-rank text-secondary">
                  {{ (currentPage - 1) * itemsPerPage + idx + 1 }}
                </div>

                <div class="cell-name">
                  <RouterLink
                    :to="{ name: 'CoinDetail', params: { id: coin.id } }"
                    class="coin-link"
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
                </div>

                <div
                  class="cell-price"
                  style="text-align: right; padding-right: 0.75rem; flex: 0 0 1"
                >
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
                </div>

                <div class="cell-change">
                  <span
                    class="change-value fw-bold d-flex align-items-center justify-content-end gap-1"
                    :class="changeColor(coin)"
                  >
                    <span class="arrow" v-if="coin.change24h >= 0"
                      >&#9650;</span
                    >
                    <span class="arrow" v-else>&#9660;</span>
                    {{ formatChange(coin.change24h) }}
                  </span>
                </div>

                <div class="cell-spark">
                  <BinanceSparkline
                    :trend="sparkTrend(coin)"
                    :width="72"
                    :height="32"
                  />
                </div>

                <div class="cell-volume text-secondary small d-none d-lg-block">
                  {{ formatMarketCap(coin.volume24h) }}
                </div>
                <div class="cell-cap text-secondary small d-none d-lg-block">
                  {{ formatMarketCap(coin.marketCap) }}
                </div>

                <div class="cell-act">
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
                      <span class="star">{{
                        isFavorite(coin.id) ? "★" : "☆"
                      }}</span>
                    </button>
                    <RouterLink
                      :to="{ name: 'CoinDetail', params: { id: coin.id } }"
                      class="btn btn-xs btn-primary"
                    >
                      Trade
                    </RouterLink>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-center mt-3 mb-4">
            <nav class="pagination-crypto" aria-label="Markets pagination">
              <button
                class="page-btn"
                :disabled="currentPage <= 1"
                @click="onPageChange(currentPage - 1)"
              >
                ‹
              </button>
              <button
                v-for="p in visiblePages"
                :key="p"
                class="page-btn"
                :class="{ active: p === currentPage }"
                @click="onPageChange(p)"
              >
                {{ p }}
              </button>
              <button
                class="page-btn"
                :disabled="currentPage >= totalPages"
                @click="onPageChange(currentPage + 1)"
              >
                ›
              </button>
            </nav>
          </div>
        </template>
      </div>
    </section>
</template>

<style scoped>
.markets-page {
  background: var(--markets-bg);
  padding-top: 0;
}

/* ── Table wrapper ─────────────────── */

.table-crypto-wrap {
  background: var(--table-bg);
  border: 1px solid var(--table-border);
  border-radius: var(--radius);
  overflow: hidden;
}

.table-crypto {
  width: 100%;
}

.table-crypto-head {
  display: flex;
  align-items: center;
  padding: 0.55rem 0.75rem;
  background: var(--table-header-bg);
  border-bottom: 1px solid var(--table-border);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cell-rank {
  width: 40px;
  flex-shrink: 0;
  padding-left: 0.5rem;
}

.cell-name {
  flex: 1 1 auto;
  min-width: 160px;
}

.cell-price {
  width: 120px;
  flex-shrink: 0;
  text-align: right;
  padding-right: 0.75rem;
}

.cell-change {
  width: 100px;
  flex-shrink: 0;
  text-align: right;
  padding-right: 0.75rem;
}

.cell-spark {
  width: 90px;
  flex-shrink: 0;
  text-align: center;
  padding: 2px 0.5rem;
}

.cell-volume {
  width: 110px;
  flex-shrink: 0;
  text-align: right;
  padding-right: 0.75rem;
}

.cell-cap {
  width: 110px;
  flex-shrink: 0;
  text-align: right;
  padding-right: 0.75rem;
}

.cell-act {
  width: 150px;
  flex-shrink: 0;
  text-align: right;
  padding-right: 0.75rem;
}

.table-crypto-row {
  display: flex;
  align-items: center;
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--table-border);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: background 0.1s ease, box-shadow 0.1s ease;
}

.table-crypto-row:last-child {
  border-bottom: none;
}

.table-crypto-row.is-gainer {
  border-left: 3px solid var(--positive);
}

.table-crypto-row.is-loser {
  border-left: 3px solid var(--negative);
}

.table-crypto-row:hover {
  background: var(--table-bg-hover);
  box-shadow: inset 3px 0 0 0 var(--accent);
}

.coin-link {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  text-decoration: none;
  color: inherit;
}

.coin-icon {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--bg-secondary);
  object-fit: cover;
}

.coin-name-cell {
  font-weight: 600;
  color: var(--text-emphasis);
  font-size: 0.88rem;
}

.coin-name-cell small {
  color: var(--text-secondary);
  font-weight: 400;
  font-size: 0.78rem;
  margin-left: 0.1rem;
}

.price-value {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  font-family: "Roboto Mono", SFMono-Regular, ui-monospace, monospace;
}

.change-value {
  font-weight: 600;
  font-size: 0.88rem;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.2rem 0.3rem;
  border-radius: 6px;
  transition: color 0.12s;
}

.btn-icon:hover {
  color: var(--accent);
}

.star {
  line-height: 1;
}

.btn-primary {
  background: var(--accent);
  color: var(--accent-text);
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.76rem;
  padding: 0.3rem 0.65rem;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.12s;
}

.btn-primary:hover {
  background: var(--accent-hover);
  color: var(--accent-text);
}

.btn-xs {
  padding: 0.28rem 0.55rem;
  font-size: 0.75rem;
}

/* ── Flash highlights ────────────── */

.flash-up {
  animation: flashGreen 0.55s ease;
  color: var(--positive) !important;
}

.flash-down {
  animation: flashRed 0.55s ease;
  color: var(--negative) !important;
}

@keyframes flashGreen {
  0% { background-color: rgba(14, 203, 129, 0.2); }
  100% { background-color: transparent; }
}

@keyframes flashRed {
  0% { background-color: rgba(246, 70, 93, 0.2); }
  100% { background-color: transparent; }
}

/* ── Pagination ──────────────────── */

.pagination-crypto {
  display: flex;
  gap: 0.2rem;
}

.page-btn {
  min-width: 34px;
  height: 34px;
  padding: 0 0.45rem;
  border: 1px solid var(--table-border);
  background: var(--table-bg);
  color: var(--text-primary);
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.12s;
}

.page-btn:hover:not(:disabled) {
  background: var(--table-bg-hover);
  border-color: var(--accent);
  color: var(--accent);
}

.page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.page-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-text);
  font-weight: 700;
}

/* ── Responsive ──────────────────── */

@media (max-width: 991px) {
  .cell-volume, .cell-cap { display: none; }
  .table-crypto-row { gap: 0.2rem; }
  .price-value { font-size: 0.82rem; }
}

@media (max-width: 575px) {
  .cell-spark { display: none; }
  .cell-change { width: auto; flex: 1; }
}
</style>
