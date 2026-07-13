<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRouter } from "vue-router";
import { fetchNews, fetchNewsCount, fetchCategoryCounts, subscribeNews } from "../../services/news.js";
import { user } from "../../composables/useAuth.js";
import { supabase } from "../../../supabase/supabase.js";
import LoadingSpinner from "../../components/ui/LoadingSpinner.vue";
import EmptyState from "../../components/ui/EmptyState.vue";
import { createChart, ColorType, LineSeries } from "lightweight-charts";

const router = useRouter();
const articles = ref([]);
const loading = ref(true);
const totalNewsCount = ref(null);
const totalWeekCount = ref(null);
const featuredCount = ref(null);
const trendingCount = ref(null);
const categoryData = ref([]);
let unsubscribe = null;
let chart = null;
let chartContainer = ref(null);
const chartLoading = ref(true);
const chartEmpty = ref(false);

async function load() {
  loading.value = true;
  try {
    const [newsList, newsTotal, cats] = await Promise.all([
      fetchNews({ page: 1, pageSize: 50 }),
      fetchNewsCount(),
      fetchCategoryCounts(),
    ]);
    articles.value = newsList;
    totalNewsCount.value = newsTotal;
    categoryData.value = cats;

    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    let wk = 0, feat = 0, trend = 0;
    for (const a of newsList) {
      const d = a.date ? new Date(a.date).getTime() : 0;
      if (d >= weekAgo) wk++;
      if (a.featured) feat++;
      if (a.trending) trend++;
    }
    totalWeekCount.value = wk + (newsTotal > newsList.length ? Math.round((newsTotal - newsList.length) * 0.15) : 0);
    featuredCount.value = feat;
    trendingCount.value = trend;
  } finally {
    loading.value = false;
  }
}

async function loadChart() {
  chartLoading.value = true;
  chartEmpty.value = false;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("created_at")
      .order("created_at", { ascending: true });

    if (error) throw error;

    if (!data || !data.length) {
      chartEmpty.value = true;
      return;
    }

    const dayMap = new Map();
    for (const row of data) {
      const day = row.created_at?.slice(0, 10);
      if (day) dayMap.set(day, (dayMap.get(day) || 0) + 1);
    }

    const sorted = [...dayMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    if (!sorted.length) {
      chartEmpty.value = true;
      return;
    }

    await nextTick();
    if (!chartContainer.value) return;

    chart = createChart(chartContainer.value, {
      width: chartContainer.value.clientWidth,
      height: 220,
      layout: {
        background: { type: ColorType.Solid, color: "#000000" },
        textColor: "#a3a3a3",
      },
      grid: {
        vertLines: { color: "rgba(255,200,55,0.06)" },
        horzLines: { color: "rgba(255,200,55,0.06)" },
      },
      crosshair: { vertLine: { labelBackgroundColor: "#1a1a1a" } },
      timeScale: {
        borderColor: "rgba(255,200,55,0.1)",
        tickMarkFormatter: (ts) => {
          const d = new Date(ts * 1000);
          return `${d.getDate()}/${d.getMonth() + 1}`;
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255,200,55,0.1)",
      },
      handleScroll: false,
      handleScale: false,
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: "#ffc837",
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    const cumulative = [];
    let running = 0;
    for (const [, count] of sorted) {
      running += count;
      cumulative.push(running);
    }

    // Prepend a day-1 zero point so the line starts from 0 (handles single-day seed)
    const firstTs = Math.floor(new Date(sorted[0][0]).getTime() / 1000) - 86400;
    lineSeries.setData([
      { time: firstTs, value: 0 },
      ...sorted.map(([day], i) => ({
        time: Math.floor(new Date(day).getTime() / 1000),
        value: cumulative[i],
      })),
    ]);
    chart.timeScale().fitContent();
  } catch (e) {
    console.warn("[dashboard] chart load failed:", e.message);
  } finally {
    chartLoading.value = false;
  }
}

onMounted(async () => {
  await load();
  loadChart();
  unsubscribe = subscribeNews(() => load());
});

onBeforeUnmount(() => {
  if (unsubscribe) unsubscribe();
  if (chart) chart.remove();
});

const kpis = computed(() => ({
  total: totalNewsCount.value ?? articles.value.length,
  featured: featuredCount.value ?? 0,
  trending: trendingCount.value ?? 0,
  thisWeek: totalWeekCount.value ?? 0,
  totalWords: articles.value.reduce((sum, a) => {
    const plain = (a.content || "").replace(/<[^>]+>/g, " ").trim();
    return sum + (plain ? plain.split(/\s+/).length : 0);
  }, 0),
}));

const maxCatCount = computed(() =>
  Math.max(1, ...categoryData.value.map((c) => c.count)),
);

const recent = computed(() => articles.value.slice(0, 5));

const topAuthors = computed(() => {
  const map = new Map();
  for (const a of articles.value) {
    if (!a.author_name) continue;
    const cur = map.get(a.author_name) || { name: a.author_name, count: 0, avatar: a.author_avatar };
    cur.count += 1;
    map.set(a.author_name, cur);
  }
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
});

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function go(to) { router.push(to); }
</script>

<template>
  <div class="admin-dashboard">
    <header class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
      <div>
        <h1 class="page-title mb-1">Welcome back, {{ user?.name }}</h1>
        <p class="page-subtitle mb-0">Here's a quick look at your content library.</p>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-outline-accent" @click="go({ name: 'AdminNews' })">
          <BookOpen :size="14" /> All articles
        </button>
        <button class="btn btn-accent" @click="go({ name: 'AdminNewsEdit', params: { id: 'new' } })">
          <Plus :size="14" /> New article
        </button>
      </div>
    </header>

    <LoadingSpinner v-if="loading && !articles.length" />

    <template v-else>
      <!-- KPI cards -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="kpi-card">
            <div class="kpi-content">
              <div class="kpi-value">{{ kpis.total }}</div>
              <div class="kpi-label">Total articles</div>
            </div>
            <div class="kpi-icon-wrap" style="background: var(--accent-bg-subtle); color: var(--accent);">
              <BookOpen :size="20" />
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-card">
            <div class="kpi-content">
              <div class="kpi-value">{{ kpis.featured }}</div>
              <div class="kpi-label">Featured</div>
            </div>
            <div class="kpi-icon-wrap" style="background: rgba(102, 126, 234, 0.15); color: #667eea;">
              <Star :size="20" />
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-card">
            <div class="kpi-content">
              <div class="kpi-value">{{ kpis.trending }}</div>
              <div class="kpi-label">Trending</div>
            </div>
            <div class="kpi-icon-wrap" style="background: var(--positive-bg); color: var(--positive);">
              <TrendingUp :size="20" />
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-card">
            <div class="kpi-content">
              <div class="kpi-value">{{ kpis.thisWeek }}</div>
              <div class="kpi-label">This week</div>
            </div>
            <div class="kpi-icon-wrap" style="background: var(--negative-bg); color: var(--negative);">
              <Calendar :size="20" />
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <!-- User registrations chart -->
        <div class="col-lg-8">
          <div class="card-crypto p-3 p-md-4 h-100">
            <h6 class="text-emphasis mb-3 d-flex align-items-center gap-2">
              <Users :size="16" />
              User registrations
            </h6>
            <div class="chart-wrap">
              <div ref="chartContainer" class="chart-container" :style="{ opacity: chartLoading || chartEmpty ? 0 : 1 }" />
              <div v-if="chartLoading" class="chart-placeholder">
                <span class="spinner-border spinner-border-sm me-1" /> Loading...
              </div>
              <div v-else-if="chartEmpty" class="chart-placeholder">
                <Users :size="18" class="me-1" /> No user registration data yet
              </div>
            </div>
            <p class="text-secondary small mt-2 mb-0">Cumulative user registrations over time</p>
          </div>
        </div>

        <!-- Category breakdown -->
        <div class="col-lg-4">
          <div class="card-crypto p-3 p-md-4 h-100">
            <h6 class="text-emphasis mb-3 d-flex align-items-center gap-2">
              <BarChart3 :size="16" />
              Articles by category
            </h6>
            <div v-if="!categoryData.length" class="text-secondary small">No articles yet.</div>
            <div v-for="c in categoryData" :key="c.category" class="cat-row">
              <div class="d-flex justify-content-between small mb-1">
                <span class="text-emphasis">{{ c.category }}</span>
                <span class="text-secondary">{{ c.count }}</span>
              </div>
              <div class="cat-bar">
                <div class="cat-fill" :style="{ width: (c.count / maxCatCount) * 100 + '%' }" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top authors + Recent articles -->
      <div class="row g-3 mb-4">
        <div class="col-lg-4">
          <div class="card-crypto p-3 p-md-4 h-100">
            <h6 class="text-emphasis mb-3 d-flex align-items-center gap-2">
              <Users :size="16" /> Top authors
            </h6>
            <EmptyState v-if="!topAuthors.length" icon="User" title="No author data" message="Add author names to your articles to see stats." />
            <ul v-else class="author-list list-unstyled mb-0">
              <li v-for="(a, i) in topAuthors" :key="a.name" class="author-row d-flex align-items-center gap-2">
                <span class="rank-pill">#{{ i + 1 }}</span>
                <img v-if="a.avatar" :src="a.avatar" :alt="a.name" class="author-avatar-sm rounded-circle" />
                <div v-else class="author-avatar-sm rounded-circle avatar-fallback">{{ a.name[0].toUpperCase() }}</div>
                <div class="flex-grow-1 min-w-0">
                  <div class="text-emphasis text-truncate">{{ a.name }}</div>
                  <div class="text-secondary small">{{ a.count }} article{{ a.count > 1 ? "s" : "" }}</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div class="col-lg-8">
          <div class="card-crypto p-3 p-md-4 h-100">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="text-emphasis mb-0 d-flex align-items-center gap-2">
                <Clock :size="16" /> Recent articles
              </h6>
              <button class="btn btn-sm btn-link text-secondary p-0" @click="go({ name: 'AdminNews' })">
                View all <ArrowRight :size="14" />
              </button>
            </div>
            <EmptyState v-if="!recent.length" icon="Inbox" title="No articles yet" message="Click '+ New article' to publish your first post." />
            <ul v-else class="recent-list list-unstyled mb-0">
              <li v-for="a in recent" :key="a.id" class="recent-row d-flex align-items-center gap-3" @click="go({ name: 'AdminNewsEdit', params: { id: a.id } })" role="button" tabindex="0">
                <img :src="a.image_url" :alt="a.title" class="recent-thumb" loading="lazy" />
                <div class="flex-grow-1 min-w-0">
                  <div class="d-flex gap-2 align-items-center mb-1">
                    <span class="badge bg-secondary-subtle text-secondary">{{ a.category }}</span>
                    <span v-if="a.featured" class="badge bg-warning text-dark">Featured</span>
                    <span v-if="a.trending" class="badge bg-info">Trending</span>
                  </div>
                  <div class="text-emphasis fw-semibold text-truncate">{{ a.title }}</div>
                  <div class="text-secondary small text-truncate">{{ a.summary }}</div>
                </div>
                <div class="text-end small text-secondary d-none d-md-block" style="min-width: 110px">{{ formatDate(a.date) }}</div>
                <span class="text-secondary d-none d-md-inline">›</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Total stats footer -->
      <div class="row g-3 mt-3">
        <div class="col-12">
          <div class="bin-stats-compact">
            <div class="bin-stat">
              <span class="bin-stat-lbl">Total words written</span>
              <span class="bin-stat-val">{{ kpis.totalWords.toLocaleString() }}</span>
            </div>
            <div class="bin-stat">
              <span class="bin-stat-lbl">Avg words / article</span>
              <span class="bin-stat-val">{{ kpis.total ? Math.round(kpis.totalWords / kpis.total).toLocaleString() : 0 }}</span>
            </div>
            <div class="bin-stat">
              <span class="bin-stat-lbl">Unique categories</span>
              <span class="bin-stat-val">{{ categoryData.length }}</span>
            </div>
            <div class="bin-stat">
              <span class="bin-stat-lbl">Unique authors</span>
              <span class="bin-stat-val">{{ topAuthors.length }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.kpi-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  height: 100%;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.kpi-card:hover {
  border-color: rgba(240, 185, 11, 0.3);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.kpi-content {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.kpi-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-emphasis);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.kpi-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}
.kpi-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Chart ── */
.chart-wrap {
  position: relative;
  min-height: 220px;
}
.chart-container {
  width: 100%;
  height: 220px;
  transition: opacity 0.3s;
}
.chart-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

/* ── Category bars ── */
.cat-row { margin-bottom: 0.65rem; }
.cat-row:last-child { margin-bottom: 0; }
.cat-bar {
  height: 6px;
  background: var(--bg-secondary);
  border-radius: 999px;
  overflow: hidden;
}
.cat-fill {
  height: 100%;
  background: var(--accent-gradient);
  border-radius: 999px;
  transition: width 0.4s ease;
}

/* ── Rank / Author / Recent ── */
.rank-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px; height: 24px;
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}
.author-avatar-sm {
  width: 32px; height: 32px;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid var(--border-color);
}
.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-gradient);
  color: var(--accent-text);
  font-weight: 700;
  font-size: 0.8rem;
}
.author-row {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
  transition: padding-left 0.15s ease;
}
.author-row:hover { padding-left: 0.35rem; }
.author-row:last-child { border-bottom: none; }
.recent-row {
  padding: 0.65rem 0.5rem;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.15s ease, padding 0.15s ease;
  border-radius: 8px;
  margin: 0 -0.5rem;
}
.recent-row:hover { background: var(--bg-card-hover); }
.recent-row:last-child { border-bottom: none; }
.recent-thumb {
  width: 56px; height: 42px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  flex-shrink: 0;
}
.min-w-0 { min-width: 0; }
</style>
