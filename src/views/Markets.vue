<script>
import { api } from "../services/api.js";
import { livePrices, applyLiveFlashes, getLiveQuote } from "../services/livePrices.js";
import CoinTable from "../components/CoinTable.vue";
import SearchBar from "../components/SearchBar.vue";
import Pagination from "../components/Pagination.vue";
import SortSelect from "../components/SortSelect.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import EmptyState from "../components/EmptyState.vue";
import LiveBadge from "../components/LiveBadge.vue";

const ITEMS_PER_PAGE = 8;

export default {
  components: {
    CoinTable,
    SearchBar,
    Pagination,
    SortSelect,
    LoadingSpinner,
    EmptyState,
    LiveBadge,
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
      if (this.sortBy === "price") {
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
  },
  watch: {
    searchQuery() {
      this.currentPage = 1;
    },
    sortBy() {
      this.currentPage = 1;
    },
    filteredCoins() {
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }
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
        this.allCoins = await api.getTopCoins(50);
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
    startLive() {
      if (this._unsub) this._unsub()
      livePrices.start(this.allCoins)
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
    onPageChange(page) {
      this.currentPage = page;
    },
  },
};
</script>

<template>
  <section class="page-section">
    <div class="container">
      <div
        class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2"
      >
        <h1 class="page-title mb-0">Markets</h1>
          <LiveBadge v-if="isLive && !loading" label="Live" />
      </div>
      <p class="page-subtitle">
        Live prices via Binance WebSocket (REST fallback every 2s). Market list from Binance.
      </p>

      <div
        v-if="error && !loading"
        class="alert alert-theme small mb-3"
        role="alert"
      >
        {{ error }} — showing cached/local data.
      </div>

      <div class="row g-3 mb-4">
        <div class="col-12 col-md-5 col-lg-4">
          <SearchBar
            v-model="searchQuery"
            label="Search coins"
            placeholder="Search by name or symbol..."
          />
        </div>
        <div class="col-12 col-md-4 col-lg-3">
          <SortSelect v-model="sortBy" />
        </div>
        <div
          class="col-12 col-md-3 col-lg-5 d-flex align-items-end justify-content-md-end"
        >
          <p class="text-secondary small mb-0">
            <template v-if="!loading">
              {{ paginatedCoins.length }} of {{ filteredCoins.length }} coins
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

        <template v-else>
          <CoinTable
            :coins="paginatedCoins"
            :start-rank="(currentPage - 1) * itemsPerPage + 1"
          />
          <div class="mt-4">
            <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @page-change="onPageChange"
            />
          </div>
        </template>
      </template>
    </div>
  </section>
</template>
