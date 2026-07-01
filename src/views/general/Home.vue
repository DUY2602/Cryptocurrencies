<script>
import { defineAsyncComponent } from "vue";
import { RouterLink } from "vue-router";
import HeroSection from "../../components/HeroSection.vue";
import LoadingSpinner from "../../components/LoadingSpinner.vue";
import LiveBadge from "../../components/LiveBadge.vue";
import PriceWithArrow from "../../components/PriceWithArrow.vue";
import { api } from "../../services/api.js";
import {
  livePrices,
  applyLiveFlashes,
  getLiveQuote,
} from "../../services/livePrices.js";
import { fetchNews } from "../../services/news.js";
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
      newsTrack: null,
      newsScrollPos: 0,
      newsCanPrev: false,
      newsCanNext: true,
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
    btcDominance() {
      const btc = this.liveAllCoins.find((c) => c.id === 'bitcoin');
      if (!btc) return null;
      const total = this.liveAllCoins.reduce((s, c) => s + (c.marketCap || 0), 0);
      return total > 0 ? ((btc.marketCap / total) * 100).toFixed(1) : null;
    },
    newsAtStart() { return !this.newsCanPrev; },
    newsAtEnd() { return !this.newsCanNext; },
    marketStats() {
      const totalCap = this.liveAllCoins.reduce(
        (s, c) => s + (c.marketCap || 0),
        0,
      );
      const totalVol = this.liveAllCoins.reduce(
        (s, c) => s + (c.volume24h || 0),
        0,
      );
      const avgChange =
        this.liveAllCoins.length > 0
          ? this.liveAllCoins.reduce((s, c) => s + c.change24h, 0) /
            this.liveAllCoins.length
          : 0;
      return { totalCap, totalVol, avgChange, count: this.liveAllCoins.length };
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
      const liveMarketCap = coin.circulatingSupply > 0
        ? coin.circulatingSupply * live.usd
        : coin.marketCap;
      return {
        ...coin,
        price: live.usd,
        change24h: live.usd_24h_change ?? coin.change24h ?? 0,
        marketCap: liveMarketCap,
        _flash: this.liveFlashes[id],
        _flashTick: !!this.liveFlashTick[id],
      };
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
                <span class="glance-label">Coins</span>
                <span class="glance-value">{{ marketStats.count }}</span>
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
  background: linear-gradient(135deg, rgba(240,185,11,0.08) 0%, rgba(240,185,11,0.02) 100%);
  border: 1px solid rgba(240,185,11,0.15);
  border-radius: 16px;
  padding: 20px 24px;
  position: relative;
  overflow: hidden;
}
.glance-panel::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  opacity: 0.6;
}
.glance-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
}
.glance-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  border-right: 1px solid rgba(240,185,11,0.08);
}
.glance-item:last-child { border-right: none; }
.glance-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(240,185,11,0.6);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}
.glance-value {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-emphasis);
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, SFMono-Regular, 'Roboto Mono', monospace;
}

/* ── Dash Table (Trending + Volume) ── */
.dash-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  padding: 20px;
  height: 100%;
}
.dash-card-title {
  font-size: 14px; font-weight: 700; color: var(--text-secondary);
  text-transform: uppercase; letter-spacing: 0.5px;
  margin-bottom: 16px; padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 8px;
}
.dash-table { display: flex; flex-direction: column; }
.dt-head {
  display: grid;
  grid-template-columns: 24px 1fr 100px 72px;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border-color);
}
.dt-body { position: relative; }
.dt-row {
  display: grid;
  grid-template-columns: 24px 1fr 100px 72px;
  align-items: center;
  gap: 6px;
  padding: 9px 4px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  transition: background 0.15s;
  color: var(--text-emphasis);
  border-radius: 6px;
}
.dt-row:last-child { border-bottom: none; }
.dt-row:hover { background: var(--bg-card-hover); }
.dt-rank { font-size: 11px; font-weight: 700; color: var(--text-tertiary); text-align: center; }
.dt-coin { display: flex; align-items: center; gap: 6px; min-width: 0; }
.dt-icon { flex-shrink: 0; }
.dt-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dt-price { font-size: 12px; font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; font-family: ui-monospace, SFMono-Regular, 'Roboto Mono', monospace; }
.dt-chg { font-size: 11px; font-weight: 700; text-align: right; }

.flip-list-move { transition: transform 0.5s ease; }
.flip-list-enter-active { transition: all 0.4s ease; }
.flip-list-leave-active { transition: all 0.3s ease; position: absolute; }
.flip-list-enter-from { opacity: 0; transform: translateX(-20px); }
.flip-list-leave-to { opacity: 0; transform: translateX(20px); }

/* ── News ── */
.news-track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.news-track::-webkit-scrollbar { display: none; }
.news-slide {
  flex: 0 0 calc(50% - 8px);
  min-width: 300px;
  scroll-snap-align: start;
}
.news-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}
.news-track {
  flex: 1;
  min-width: 0;
}
.news-arrow {
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  z-index: 2;
}
.news-arrow:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
  background: rgba(240,185,11,0.1);
  box-shadow: 0 0 12px rgba(240,185,11,0.15);
}
.news-arrow:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}
.news-img { flex-shrink: 0; object-fit: cover; }
.news-body { display: flex; flex-direction: column; min-width: 0; }
.news-title { font-size: 13px; font-weight: 600; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: var(--text-emphasis); }
.news-meta { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
</style>
