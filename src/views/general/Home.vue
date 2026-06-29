<script>
import { defineAsyncComponent } from "vue";
import { RouterLink } from "vue-router";
import HeroSection from "../../components/HeroSection.vue";
import CoinCard from "../../components/CoinCard.vue";
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


export default {
  components: {
    RouterLink,
    PriceWithArrow,
    HeroSection,
    CoinCard,
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
        .slice(0, 5);
    },
    btcDominance() {
      const btc = this.liveAllCoins.find((c) => c.id === 'bitcoin');
      if (!btc) return null;
      const total = this.liveAllCoins.reduce((s, c) => s + (c.marketCap || 0), 0);
      return total > 0 ? ((btc.marketCap / total) * 100).toFixed(1) : null;
    },
    marketStats() {
      const totalCap = this.liveAllCoins.reduce(
        (s, c) => s + (c.marketCap || 0),
        0,
      );
      const avgChange =
        this.liveAllCoins.length > 0
          ? this.liveAllCoins.reduce((s, c) => s + c.change24h, 0) /
            this.liveAllCoins.length
          : 0;
      return { totalCap, avgChange, count: this.liveAllCoins.length };
    },
  },
  async mounted() {
    try {
      const [top, news] = await Promise.all([
        api.getTopCoins(10),
        fetchNews({ page: 1, pageSize: 3 }).catch(() => []),
      ]);
      this.trending = [...top].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h));
      this.allCoins = top;
      this.latestNews = Array.isArray(news) ? news : [];
    } catch (e) {
      console.warn('[Home] failed to load coins:', e.message)
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
              <p class="stat-card-value small">
                ${{ (marketStats.totalCap / 1e12).toFixed(2) }}T
              </p>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card card-crypto stat-card">
              <p class="stat-card-label">Avg 24h change</p>
              <p
                class="stat-card-value"
                :class="
                  marketStats.avgChange >= 0 ? 'text-positive' : 'text-negative'
                "
              >
                {{ marketStats.avgChange >= 0 ? "+" : ""
                }}{{ marketStats.avgChange.toFixed(2) }}%
              </p>
            </div>
          </div>
        </div>

        <LoadingSpinner v-if="loading" message="Loading dashboard..." />

        <template v-else>
          <h2 class="section-heading mb-3">Trending</h2>
          <div class="trending-ranking mb-5">
            <TransitionGroup name="flip-list" tag="div" class="ranking-list">
              <RouterLink
                v-for="(coin, i) in liveTrending"
                :key="coin.id"
                :to="{ name: 'CoinDetail', params: { id: coin.id } }"
                class="ranking-item text-decoration-none"
                :class="{ 'opacity-50 pe-none': coin._hasBinanceChart === false }"
              >
                <span class="rank-num">#{{ i + 1 }}</span>
                <img
                  v-if="coin.image"
                  :src="coin.image"
                  :alt="coin.name"
                  class="rank-icon rounded-circle"
                  width="28"
                  height="28"
                />
                <span class="rank-name">{{ coin.name }}</span>
                <span class="rank-symbol">{{ coin.symbol }}</span>
                <span class="rank-price">
                  <PriceWithArrow
                    :price="coin.price"
                    :flash="coin._flash"
                    :pulse="!!coin._flashTick"
                    size="sm"
                    :inline="true"
                  />
                </span>
                <span
                  class="rank-change"
                  :class="coin._flash === 'up' ? 'text-positive' : coin._flash === 'down' ? 'text-negative' : coin.change24h >= 0 ? 'text-positive' : 'text-negative'"
                >
                  {{ coin.change24h >= 0 ? '+' : '' }}{{ coin.change24h?.toFixed(2) }}%
                </span>
                <span class="rank-move">
                  <span v-if="coin._flash === 'up'" class="text-positive">&#9650;</span>
                  <span v-else-if="coin._flash === 'down'" class="text-negative">&#9660;</span>
                </span>
              </RouterLink>
            </TransitionGroup>
          </div>

          <div class="home-dashboard mb-5">
            <div class="row g-3">
              <div class="col-12 col-lg-4">
                <div class="dash-card">
                  <h3 class="dash-card-title">Market Stats</h3>
                  <div class="dash-stats">
                    <div class="dash-stat">
                      <span class="dash-stat-label">Total Market Cap</span>
                      <span class="dash-stat-value">${{ (marketStats.totalCap / 1e12).toFixed(2) }}T</span>
                    </div>
                    <div class="dash-stat">
                      <span class="dash-stat-label">BTC Dominance</span>
                      <span class="dash-stat-value">{{ btcDominance ?? '—' }}%</span>
                    </div>
                    <div class="dash-stat">
                      <span class="dash-stat-label">Avg 24h Change</span>
                      <span class="dash-stat-value" :class="marketStats.avgChange >= 0 ? 'text-positive' : 'text-negative'">
                        {{ marketStats.avgChange >= 0 ? '+' : '' }}{{ marketStats.avgChange.toFixed(2) }}%
                      </span>
                    </div>
                    <div class="dash-stat">
                      <span class="dash-stat-label">Tracked Coins</span>
                      <span class="dash-stat-value">{{ marketStats.count }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-12 col-lg-4">
                <div class="dash-card">
                  <h3 class="dash-card-title">Top by Volume (24h)</h3>
                  <div class="dash-list">
                    <RouterLink
                      v-for="(coin, i) in topVolume"
                      :key="coin.id"
                      :to="{ name: 'CoinDetail', params: { id: coin.id } }"
                      class="dash-list-item text-decoration-none"
                      :class="{ 'opacity-50 pe-none': coin._hasBinanceChart === false }"
                    >
                      <span class="dash-list-rank">{{ i + 1 }}</span>
                      <img v-if="coin.image" :src="coin.image" :alt="coin.name" class="dash-list-icon rounded-circle" width="20" height="20" />
                      <span class="dash-list-name">{{ coin.symbol }}</span>
                      <span class="dash-list-price">
                        <PriceWithArrow :price="coin.price" :flash="coin._flash" :pulse="!!coin._flashTick" size="sm" :inline="true" />
                      </span>
                      <span class="dash-list-change" :class="coin.change24h >= 0 ? 'text-positive' : 'text-negative'">
                        {{ coin.change24h >= 0 ? '+' : '' }}{{ coin.change24h?.toFixed(2) }}%
                      </span>
                    </RouterLink>
                  </div>
                </div>
              </div>

              <div class="col-12 col-lg-4">
                <div class="dash-card">
                  <h3 class="dash-card-title">Latest News</h3>
                  <div class="dash-list">
                    <RouterLink
                      v-for="article in latestNews"
                      :key="article.id"
                      :to="{ name: 'NewsDetail', params: { id: article.id } }"
                      class="dash-list-item text-decoration-none"
                    >
                      <img v-if="article.image_url" :src="article.image_url" :alt="article.title" class="dash-news-img rounded" width="36" height="36" />
                      <div class="dash-news-info">
                        <span class="dash-news-title">{{ article.title }}</span>
                        <span class="dash-news-meta">{{ article.source_name }} · {{ formatDate(article.date) }}</span>
                      </div>
                    </RouterLink>
                    <p v-if="!latestNews.length" class="text-secondary small text-center py-3 mb-0">No news available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h2 class="section-heading mb-3">Global Crypto Adoption 2025</h2>
          <AdoptionMap />
        </template>
      </div>
    </section>
  </div>
</template>

<style scoped>
.trending-ranking {
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  overflow: hidden;
}
.ranking-list { position: relative; }
.ranking-item {
  display: grid;
  grid-template-columns: 28px 28px 1fr 48px 95px 70px 14px;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  transition: background 0.15s;
  color: var(--text-emphasis);
}
.ranking-item:last-child { border-bottom: none; }
.ranking-item:hover { background: rgba(255,255,255,0.06); }
.rank-num {
  width: 28px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(255,255,255,0.25);
  text-align: center;
}
.rank-icon { flex-shrink: 0; border-radius: 50%; }
.rank-name { font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rank-symbol { font-size: 11px; color: var(--text-secondary); }
.rank-price { font-size: 13px; font-weight: 700; text-align: right; }
.rank-change { font-size: 12px; font-weight: 700; text-align: right; }
.rank-move { width: 14px; text-align: center; font-size: 10px; flex-shrink: 0; }

.flip-list-move { transition: transform 0.5s ease; }
.flip-list-enter-active { transition: all 0.4s ease; }
.flip-list-leave-active { transition: all 0.3s ease; position: absolute; }
.flip-list-enter-from { opacity: 0; transform: translateX(-20px); }
.flip-list-leave-to { opacity: 0; transform: translateX(20px); }

.home-dashboard { }
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
}
.dash-stats { display: flex; flex-direction: column; gap: 12px; }
.dash-stat { display: flex; justify-content: space-between; align-items: center; }
.dash-stat-label { font-size: 13px; color: var(--text-secondary); }
.dash-stat-value { font-size: 15px; font-weight: 700; color: var(--text-emphasis); }
.dash-list { display: flex; flex-direction: column; gap: 2px; }
.dash-list-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 6px; border-radius: 8px;
  transition: background 0.15s;
  color: var(--text-emphasis);
}
.dash-list-item:hover { background: var(--bg-card-hover); }
.dash-list-rank { font-size: 11px; font-weight: 700; color: var(--text-tertiary); min-width: 16px; }
.dash-list-icon { flex-shrink: 0; }
.dash-list-name { font-size: 13px; font-weight: 600; min-width: 32px; }
.dash-list-price { margin-left: auto; font-size: 13px; font-weight: 600; }
.dash-list-change { font-size: 11px; font-weight: 700; min-width: 48px; text-align: right; }
.dash-news-img { flex-shrink: 0; object-fit: cover; }
.dash-news-info { display: flex; flex-direction: column; min-width: 0; }
.dash-news-title { font-size: 13px; font-weight: 600; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.dash-news-meta { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
</style>
