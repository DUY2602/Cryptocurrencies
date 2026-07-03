<script>
import { defineAsyncComponent } from "vue";
import { RouterLink } from "vue-router";
import HeroSection from "../../components/layout/HeroSection.vue";
import LoadingSpinner from "../../components/ui/LoadingSpinner.vue";
import LiveBadge from "../../components/ui/LiveBadge.vue";
import PriceWithArrow from "../../components/ui/PriceWithArrow.vue";
import { api } from "../../services/api.js";
import {
  livePrices,
  applyLiveFlashes,
  getLiveQuote,
} from "../../services/livePrices.js";
import { fetchNews } from "../../services/news.js";
import { fetchUsdtTickers } from "../../services/binance.js";
import { formatVolume as _formatVolume } from "../../utils/format.js";


export default {
  components: {
    RouterLink,
    PriceWithArrow,
    HeroSection,
    LoadingSpinner,
    LiveBadge,
    AdoptionMap: defineAsyncComponent(() => import("../../components/geo/RadarMap.vue")),
  },
  data() {
    return {
      trending: [],
      allCoins: [],
      latestNews: [],
      loading: true,
      livePricesMap: {},
      liveFlashes: {},
      liveFlashTick: {},
      liveTick: 0,
      isLive: false,
      binanceCoinCount: 0,
      newsTrack: null,
      newsScrollPos: 0,
      newsCanPrev: false,
      newsCanNext: true,
      globalCoins: [],
      _mergeCache: null,
    };
  },
  computed: {
    liveAllCoins() {
      return this.allCoins.map((c) => this.mergeLive(c));
    },
    liveTrending() {
      return [...this.trending]
        .map((c) => this.mergeLive(c))
        .sort((a, b) => b.change24h - a.change24h);
    },
    topVolume() {
      return [...this.liveAllCoins]
        .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
        .slice(0, 10);
    },
    liveCoinCount() {
      // Count of coins actively receiving data from Binance websocket
      return Object.keys(this.livePricesMap).length;
    },
    btcDominance() {
      const source = this.globalCoins.length > 0 ? this.globalCoins : this.liveAllCoins;
      const btc = source.find((c) => c.id === 'bitcoin');
      if (!btc) return null;
      const total = source.reduce((s, c) => s + (c.marketCap || 0), 0);
      return total > 0 ? ((btc.marketCap / total) * 100).toFixed(1) : null;
    },
    newsAtStart() { return !this.newsCanPrev; },
    newsAtEnd() { return !this.newsCanNext; },
    marketStats() {
      const source = this.globalCoins.length > 0 ? this.globalCoins : this.liveAllCoins;
      const totalCap = source.reduce(
        (s, c) => s + (c.marketCap || 0),
        0,
      );
      const totalVol = source.reduce(
        (s, c) => s + (c.volume24h || 0),
        0,
      );
      const avgChange =
        source.length > 0
          ? source.reduce((s, c) => s + c.change24h, 0) /
            source.length
          : 0;
      return { totalCap, totalVol, avgChange, count: source.length };
    },
  },
  async mounted() {
    try {
      const [top, news] = await Promise.all([
        api.getTopCoins(10),
        fetchNews({ page: 1, pageSize: 10 }).catch(() => []),
      ]);
      this.trending = [...top].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
      this.allCoins = top;
      this.latestNews = Array.isArray(news) ? news : [];

      // Count coins from top 100 that have Binance live data
      try {
        const allCoins = await api.getTopCoins(100);
        this.globalCoins = allCoins;
        this.binanceCoinCount = allCoins.filter(c => c._hasBinanceChart).length;
      } catch {
        this.globalCoins = top;
        this.binanceCoinCount = top.filter(c => c._hasBinanceChart).length;
      }
    } catch (e) {
      console.warn('[Home] failed to load coins:', e.message)
    } finally {
      this.loading = false;
      this.startLive();
      this.$nextTick(() => {
        const el = this.$refs?.newsTrack;
        if (el) {
          el.addEventListener('scroll', this.onNewsScroll);
          this.updateNewsArrows();
        }
      });
    }
  },
  beforeUnmount() {
    if (this._unsub) this._unsub();
    livePrices.stop();
    this._mergeCache = null;
    const el = this.$refs?.newsTrack;
    if (el) el.removeEventListener('scroll', this.onNewsScroll);
  },
  methods: {
    startLive() {
      if (this._unsub) this._unsub();
      livePrices.start([...this.trending, ...this.allCoins]);
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

      const cached = this._mergeCache?.get(id);
      if (cached) {
        const changed =
          cached.price !== live.usd ||
          cached.change24h !== (live.usd_24h_change ?? coin.change24h ?? 0) ||
          cached.marketCap !== (coin.circulatingSupply > 0 ? coin.circulatingSupply * live.usd : coin.marketCap) ||
          cached._flash !== this.liveFlashes[id] ||
          cached._flashTick !== !!this.liveFlashTick[id];
        if (!changed) return cached;
      }

      const merged = {
        ...coin,
        price: live.usd,
        change24h: live.usd_24h_change ?? coin.change24h ?? 0,
        marketCap: coin.circulatingSupply > 0
          ? coin.circulatingSupply * live.usd
          : coin.marketCap,
        _flash: this.liveFlashes[id],
        _flashTick: !!this.liveFlashTick[id],
      };
      if (!this._mergeCache) this._mergeCache = new Map();
      this._mergeCache.set(id, merged);
      return merged;
    },
    formatVolume(val) {
      return _formatVolume(val);
    },
    formatMarketCap(value) {
      if (value == null) return '—'
      if (value >= 1e12) return '$' + (value / 1e12).toFixed(2) + 'T'
      if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B'
      if (value >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M'
      return '$' + value.toLocaleString()
    },
    scrollNews(dir) {
      const el = this.$refs.newsTrack;
      if (!el) return;
      const step = el.clientWidth * 0.8;
      const target = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, el.scrollLeft + dir * step));
      el.scrollTo({ left: target, behavior: 'smooth' });
      this.newsScrollPos = target;
      this.updateNewsArrows();
    },
    onNewsScroll() {
      const el = this.$refs.newsTrack;
      if (el) {
        this.newsScrollPos = el.scrollLeft;
        this.updateNewsArrows();
      }
    },
    updateNewsArrows() {
      const el = this.$refs.newsTrack;
      if (!el) return;
      this.newsCanPrev = el.scrollLeft > 2;
      this.newsCanNext = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString("en-AU", {
        year: "numeric", month: "short", day: "numeric",
      });
    },
  },
};
</script>

<template>
  <div>
    <HeroSection />

    <section class="page-section">
      <div class="container">
        <LoadingSpinner v-if="loading" message="Loading dashboard..." />

        <template v-else>
          <!-- Market Glance — gradient glass panel -->
          <div class="glance-panel mb-5">
            <div class="glance-grid">
              <div class="glance-item">
                <span class="glance-label">Market Cap</span>
                <span class="glance-value">${{ (marketStats.totalCap / 1e12).toFixed(2) }}T</span>
              </div>
              <div class="glance-item">
                <span class="glance-label">24h Volume</span>
                <span class="glance-value">{{ formatMarketCap(marketStats.totalVol) }}</span>
              </div>
              <div class="glance-item">
                <span class="glance-label">BTC Dominance</span>
                <span class="glance-value">{{ btcDominance ?? '—' }}%</span>
              </div>
              <div class="glance-item">
                <span class="glance-label">Avg 24h</span>
                <span
                  class="glance-value"
                  :class="marketStats.avgChange >= 0 ? 'text-positive' : 'text-negative'"
                >
                  {{ marketStats.avgChange >= 0 ? '+' : '' }}{{ marketStats.avgChange.toFixed(2) }}%
                </span>
              </div>
              <div class="glance-item">
                <span class="glance-label">Active</span>
                <span class="glance-value">{{ binanceCoinCount }}</span>
              </div>
            </div>
          </div>

          <!-- Trending + Volume row -->
          <div class="row g-4 mb-5">
            <div class="col-12 col-lg-6">
              <div class="dash-card">
                <h3 class="dash-card-title">Trending <LiveBadge v-if="isLive" label="Live" /></h3>
                <div class="dash-table">
                  <div class="dt-head">
                    <span class="dt-h dt-rank">#</span>
                    <span class="dt-h dt-coin">Coin</span>
                    <span class="dt-h dt-price">Price</span>
                    <span class="dt-h dt-chg">24h</span>
                  </div>
                  <TransitionGroup name="flip-list" tag="div" class="dt-body">
                    <RouterLink
                      v-for="(coin, i) in liveTrending"
                      :key="coin.id"
                      :to="{ name: 'CoinDetail', params: { id: coin.id } }"
                      class="dt-row text-decoration-none"
                      :class="{ 'opacity-50 pe-none': coin._hasBinanceChart === false }"
                    >
                      <span class="dt-rank">#{{ i + 1 }}</span>
                      <span class="dt-coin">
                        <img v-if="coin.image" :src="coin.image" :alt="coin.name" class="dt-icon rounded-circle" width="22" height="22" />
                        <span class="dt-name">{{ coin.symbol }}</span>
                      </span>
                      <span class="dt-price">
                        <PriceWithArrow
                          :price="coin.price"
                          :flash="coin._flash"
                          :pulse="!!coin._flashTick"
                          size="sm"
                          :inline="true"
                        />
                      </span>
                      <span class="dt-chg" :class="coin.change24h >= 0 ? 'text-positive' : 'text-negative'">
                        <ArrowUp v-if="coin._flash === 'up'" :size="12" />
                        <ArrowDown v-else-if="coin._flash === 'down'" :size="12" />
                        {{ coin.change24h >= 0 ? '+' : '' }}{{ coin.change24h?.toFixed(2) }}%
                      </span>
                    </RouterLink>
                  </TransitionGroup>
                </div>
              </div>
            </div>
            <div class="col-12 col-lg-6">
              <div class="dash-card">
                <h3 class="dash-card-title">Top by Volume (24h)</h3>
                <div class="dash-table">
                  <div class="dt-head">
                    <span class="dt-h dt-rank">#</span>
                    <span class="dt-h dt-coin">Coin</span>
                    <span class="dt-h dt-price">Volume</span>
                    <span class="dt-h dt-chg">24h</span>
                  </div>
                  <div class="dt-body">
                    <RouterLink
                      v-for="(coin, i) in topVolume"
                      :key="coin.id"
                      :to="{ name: 'CoinDetail', params: { id: coin.id } }"
                      class="dt-row text-decoration-none"
                      :class="{ 'opacity-50 pe-none': coin._hasBinanceChart === false }"
                    >
                      <span class="dt-rank">{{ i + 1 }}</span>
                      <span class="dt-coin">
                        <img v-if="coin.image" :src="coin.image" :alt="coin.name" class="dt-icon rounded-circle" width="22" height="22" />
                        <span class="dt-name">{{ coin.symbol }}</span>
                      </span>
                      <span class="dt-price">{{ formatVolume(coin.volume24h) }}</span>
                      <span class="dt-chg" :class="coin.change24h >= 0 ? 'text-positive' : 'text-negative'">
                        {{ coin.change24h >= 0 ? '+' : '' }}{{ coin.change24h?.toFixed(2) }}%
                      </span>
                    </RouterLink>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- News -->
          <div class="mb-5" v-if="latestNews.length">
            <h2 class="section-heading mb-3">Latest News</h2>
            <div class="news-wrap">
              <button class="news-arrow news-arrow-left" @click="scrollNews(-1)" :disabled="newsAtStart"><ChevronLeft :size="16" /></button>
              <div ref="newsTrack" class="news-track">
              <RouterLink
                v-for="article in latestNews"
                :key="article.id"
                :to="{ name: 'NewsDetail', params: { id: article.id } }"
                class="news-slide text-decoration-none"
              >
                <div class="dash-card h-100">
                  <div class="d-flex gap-3">
                    <img v-if="article.image_url" :src="article.image_url" :alt="article.title" class="news-img rounded flex-shrink-0" width="72" height="72" />
                    <div class="news-body">
                      <span class="news-title">{{ article.title }}</span>
                      <span class="news-meta">{{ article.source_name }} · {{ formatDate(article.date) }}</span>
                    </div>
                  </div>
                </div>
              </RouterLink>
            </div>
              <button class="news-arrow news-arrow-right" @click="scrollNews(1)" :disabled="newsAtEnd"><ChevronRight :size="16" /></button>
            </div>
          </div>
          <p v-else class="text-secondary small text-center py-3 mb-0">No news available</p>

          <h2 class="section-heading mb-3">Global Crypto Adoption</h2>
          <AdoptionMap />
        </template>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ── Glance Panel ── */
.glance-panel {
  background: linear-gradient(135deg, rgba(255, 200, 55, 0.08) 0%, rgba(255, 200, 55, 0.02) 100%);
  border: 1px solid rgba(255, 200, 55, 0.15);
  border-radius: 20px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--shadow-sm);
}

.glance-panel::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  opacity: 0.7;
}

.glance-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
}

.glance-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  border-right: 1px solid var(--border-color);
}

.glance-item:last-child { border-right: none; }

.glance-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.glance-value {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-emphasis);
  font-variant-numeric: tabular-nums;
  font-family: 'JetBrains Mono', monospace;
}

/* ── Dash Table (Trending + Volume) ── */
.dash-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 24px;
  height: 100%;
}

.dash-card-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.dash-table { display: flex; flex-direction: column; }

.dt-head {
  display: grid;
  grid-template-columns: 24px 1fr 110px 72px;
  align-items: center;
  gap: 8px;
  padding: 8px 4px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  border-bottom: 1px solid var(--border-color);
}

.dt-body { position: relative; }

.dt-row {
  display: grid;
  grid-template-columns: 24px 1fr 110px 72px;
  align-items: center;
  gap: 8px;
  padding: 12px 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.02);
  transition: all var(--transition-fast);
  color: var(--text-emphasis);
  border-radius: 8px;
}

.dt-row:last-child { border-bottom: none; }

.dt-row:hover {
  background: var(--bg-card-hover);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dt-rank {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-tertiary);
  text-align: center;
}

.dt-coin {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dt-icon {
  flex-shrink: 0;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.dt-name {
  font-size: 0.88rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dt-price {
  font-size: 0.88rem;
  font-weight: 700;
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-family: 'JetBrains Mono', monospace;
}

.dt-chg {
  font-size: 0.82rem;
  font-weight: 700;
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}

.flip-list-move { transition: transform 0.5s ease; }
.flip-list-enter-active { transition: all 0.4s ease; }
.flip-list-leave-active { transition: all 0.3s ease; position: absolute; }
.flip-list-enter-from { opacity: 0; transform: translateX(-20px); }
.flip-list-leave-to { opacity: 0; transform: translateX(20px); }

/* ── News ── */
.news-track {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 10px 4px;
}

.news-track::-webkit-scrollbar { display: none; }

.news-slide {
  flex: 0 0 calc(50% - 10px);
  min-width: 320px;
  scroll-snap-align: start;
  transition: transform var(--transition);
}

.news-slide:hover {
  transform: translateY(-4px);
}

.news-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

.news-track {
  flex: 1;
  min-width: 0;
}

.news-arrow {
  width: 40px; height: 40px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all var(--transition-fast);
  flex-shrink: 0;
  z-index: 2;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.news-arrow:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(255, 200, 55, 0.08);
  box-shadow: 0 0 12px rgba(255, 200, 55, 0.15);
  transform: scale(1.05);
}

.news-arrow:disabled {
  opacity: 0.25;
  cursor: not-allowed;
  box-shadow: none;
}

.news-img {
  flex-shrink: 0;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.news-body { display: flex; flex-direction: column; min-width: 0; }
.news-title { font-size: 0.95rem; font-weight: 700; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: var(--text-emphasis); }
.news-meta { font-size: 0.78rem; color: var(--text-secondary); margin-top: 6px; }

@media (max-width: 991.98px) {
  .glance-grid {
    grid-template-columns: repeat(3, 1fr);
    row-gap: 16px;
  }
  .glance-item {
    border-right: none;
  }
  .news-slide {
    flex: 0 0 100%;
  }
}

@media (max-width: 575px) {
  .glance-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dt-head, .dt-row {
    grid-template-columns: 24px 1fr 90px;
  }
  .dt-chg {
    display: none;
  }
}
</style>
