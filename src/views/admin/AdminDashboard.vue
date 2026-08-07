<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRouter } from "vue-router";
import { fetchNews, fetchNewsCount, fetchNewsCountSince, fetchCategoryCounts, subscribeNews } from "../../services/news.js";
import { user } from "../../composables/useAuth.js";
import { supabase } from "../../../supabase/supabase.js";
import LoadingSpinner from "../../components/ui/LoadingSpinner.vue";
import { createChart, ColorType, LineSeries, HistogramSeries } from "lightweight-charts";

const router = useRouter();
const articles = ref([]);
const loading = ref(true);
const totalNewsCount = ref(null);
const totalWeekCount = ref(null);
const categoryData = ref([]);
const profilesCount = ref(null);
const docsCount = ref(null);
let unsubscribe = null;
let chart = null;
let chartBar = null;
let chartContainer = ref(null);
let chartBarContainer = ref(null);
const chartLoading = ref(true);
const chartEmpty = ref(false);

async function load() {
  loading.value = true;
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [newsList, newsTotal, weekTotal, cats, profCount, docsRes] = await Promise.all([
      fetchNews({ page: 1, pageSize: 50 }),
      fetchNewsCount(),
      fetchNewsCountSince(weekAgo),
      fetchCategoryCounts(),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("documents").select("id", { count: "exact", head: true }),
    ]);
    articles.value = newsList;
    totalNewsCount.value = newsTotal;
    categoryData.value = cats;
    profilesCount.value = profCount.count;
    docsCount.value = docsRes.count;

    totalWeekCount.value = weekTotal;
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
    if (!chartContainer.value || !chartBarContainer.value) return;

    const baseOpts = {
      autoSize: true,
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
    };

    // Cumulative line chart.
    chart = createChart(chartContainer.value, baseOpts);
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

    // Prepend a day-1 zero point so the line starts from 0.
    const firstTs = Math.floor(new Date(sorted[0][0]).getTime() / 1000) - 86400;
    lineSeries.setData([
      { time: firstTs, value: 0 },
      ...sorted.map(([day], i) => ({
        time: Math.floor(new Date(day).getTime() / 1000),
        value: cumulative[i],
      })),
    ]);
    chart.timeScale().fitContent();

    // Daily new-registrations bar chart.
    chartBar = createChart(chartBarContainer.value, baseOpts);
    const barSeries = chartBar.addSeries(HistogramSeries, {
      color: "#8b5cf6",
      base: 0,
      priceFormat: { type: "volume" },
    });

    barSeries.setData(
      sorted.map(([day, count]) => ({
        time: Math.floor(new Date(day).getTime() / 1000),
        value: count,
        color: "rgba(139, 92, 246, 0.65)",
      })),
    );
    chartBar.timeScale().fitContent();
  } catch (e) {
    console.warn("[dashboard] chart load failed:", e.message);
  } finally {
    chartLoading.value = false;
  }
}

onMounted(async () => {
  await load();
  loadChart();
  unsubscribe = subscribeNews(() => load(), "dashboard");
});

onBeforeUnmount(() => {
  if (unsubscribe) unsubscribe();
  if (chart) chart.remove();
  if (chartBar) chartBar.remove();
});

const kpis = computed(() => ({
  total: totalNewsCount.value ?? articles.value.length,
  thisWeek: totalWeekCount.value ?? 0,
  users: profilesCount.value ?? 0,
  docs: docsCount.value ?? 0,
  uniqueAuthors: new Set(articles.value.map((a) => a.author_name).filter(Boolean)).size,
}));

const maxCatCount = computed(() =>
  Math.max(1, ...categoryData.value.map((c) => c.count)),
);

const recent = computed(() => articles.value.slice(0, 5));

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
    </header>

    <LoadingSpinner v-if="loading && !articles.length" />

    <template v-else>
      <!-- KPI row -->
      <div class="kpi-grid mb-4">
        <div class="kpi-card" @click="go({ name: 'AdminNews' })" role="button" tabindex="0">
          <div class="kpi-content">
            <span class="kpi-label">Total articles</span>
            <span class="kpi-value">{{ kpis.total }}</span>
            <span class="kpi-delta accent">{{ kpis.thisWeek }} this week</span>
          </div>
          <span class="kpi-icon-wrap accent-chip"><BookOpen :size="20" /></span>
        </div>
        <div class="kpi-card" @click="go({ name: 'AdminNews' })" role="button" tabindex="0">
          <div class="kpi-content">
            <span class="kpi-label">Authors</span>
            <span class="kpi-value">{{ kpis.uniqueAuthors }}</span>
            <span class="kpi-delta muted">contributing to feed</span>
          </div>
          <span class="kpi-icon-wrap purple-chip"><Users :size="20" /></span>
        </div>
        <div class="kpi-card" @click="go({ name: 'AdminRag' })" role="button" tabindex="0">
          <div class="kpi-content">
            <span class="kpi-label">Total context</span>
            <span class="kpi-value">{{ kpis.docs }}</span>
            <span class="kpi-delta muted">RAG documents</span>
          </div>
          <span class="kpi-icon-wrap purple-chip"><Library :size="20" /></span>
        </div>
        <div class="kpi-card" @click="go({ name: 'AdminUsers' })" role="button" tabindex="0">
          <div class="kpi-content">
            <span class="kpi-label">Users</span>
            <span class="kpi-value">{{ kpis.users }}</span>
            <span class="kpi-delta muted">registered accounts</span>
          </div>
          <span class="kpi-icon-wrap blue-chip"><Users :size="20" /></span>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <!-- Registrations trend -->
        <div class="col-lg-8">
          <div class="card-crypto chart-card p-3 p-md-4 h-100">
            <h6 class="text-emphasis mb-3 d-flex align-items-center gap-2">
              <Users :size="16" />
              User registrations
            </h6>
            <div class="chart-wrap">
              <div
                ref="chartContainer"
                class="chart-container chart-line"
                :style="{ opacity: chartLoading || chartEmpty ? 0 : 1 }"
              />
              <div
                ref="chartBarContainer"
                class="chart-container chart-bar"
                :style="{ opacity: chartLoading || chartEmpty ? 0 : 1 }"
              />
              <div v-if="chartLoading" class="chart-placeholder">
                <span class="spinner-border spinner-border-sm me-1" /> Loading...
              </div>
              <div v-else-if="chartEmpty" class="chart-placeholder">
                <Users :size="18" class="me-1" /> No user registration data yet
              </div>
            </div>
            <div class="chart-legend">
              <span class="legend-dot dot-gold" /> Cumulative registrations
              <span class="legend-dot dot-purple ms-3" /> New per day
            </div>
          </div>
        </div>

        <!-- Category breakdown -->
        <div class="col-lg-4">
          <div class="card-crypto cat-card p-3 p-md-4 h-100">
            <h6 class="text-emphasis mb-3 d-flex align-items-center gap-2">
              <BarChart3 :size="16" />
              Articles by category
            </h6>
            <div v-if="!categoryData.length" class="text-secondary small">No articles yet.</div>
            <div v-else class="cat-list">
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
      </div>

      <!-- Recent articles -->
      <div class="card-crypto p-3 p-md-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="text-emphasis mb-0 d-flex align-items-center gap-2">
            <Clock :size="16" />
            Recent articles
          </h6>
          <button class="btn btn-sm btn-link text-secondary p-0" @click="go({ name: 'AdminNews' })">
            View all <ArrowRight :size="14" />
          </button>
        </div>
        <div v-if="!recent.length" class="text-secondary small">No articles yet. Create your first post.</div>
        <ul v-else class="recent-list list-unstyled mb-0">
          <li
            v-for="a in recent"
            :key="a.id"
            class="recent-row d-flex align-items-center gap-3"
            @click="go({ name: 'AdminNewsEdit', params: { id: a.id } })"
            role="button"
            tabindex="0"
          >
            <img :src="a.image_url" :alt="a.title" class="recent-thumb" loading="lazy" />
            <div class="flex-grow-1 min-w-0">
              <div class="d-flex gap-2 align-items-center mb-1">
                <span class="badge bg-secondary-subtle text-secondary">{{ a.category }}</span>
                <span v-if="a.featured" class="badge bg-warning text-dark">Featured</span>
                <span v-if="a.trending" class="badge bg-info">Trending</span>
              </div>
              <div class="text-emphasis fw-semibold text-truncate">{{ a.title }}</div>
            </div>
            <span class="text-secondary small d-none d-sm-inline">{{ formatDate(a.date) }}</span>
            <span class="text-secondary d-none d-sm-inline">›</span>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* KPI grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
.kpi-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  height: 100%;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
}
.kpi-card:hover {
  border-color: rgba(240, 185, 11, 0.35);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
}
.kpi-card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.kpi-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}
.kpi-label {
  font-size: 0.72rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
}
.kpi-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-emphasis);
  font-variant-numeric: tabular-nums;
  line-height: 1.05;
}
.kpi-delta {
  font-size: 0.75rem;
  font-weight: 600;
}
.kpi-delta.accent { color: var(--accent); }
.kpi-delta.muted { color: var(--text-tertiary); }
.kpi-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.accent-chip { background: var(--accent-bg-subtle); color: var(--accent); }
.purple-chip { background: rgba(102, 126, 234, 0.16); color: #a5b4fc; }
.green-chip { background: var(--positive-bg); color: var(--positive); }
.blue-chip { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }

/* Chart */
.chart-card {
  display: flex;
  flex-direction: column;
}
.chart-wrap {
  position: relative;
  flex: 1;
  min-height: 320px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.chart-container {
  flex: 1;
  min-height: 0;
  transition: opacity 0.3s;
}
.chart-line {
  flex: 1.3;
}
.chart-bar {
  flex: 1;
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
.chart-legend {
  display: flex;
  align-items: center;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}
.legend-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 2px;
  margin-right: 0.35rem;
}
.dot-gold { background: #ffc837; }
.dot-purple { background: rgba(139, 92, 246, 0.65); }

/* Category bars */
.cat-card {
  display: flex;
  flex-direction: column;
}
.cat-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}
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

/* Recent articles */
.recent-row {
  padding: 0.65rem 0.5rem;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.15s ease;
  border-radius: 8px;
  margin: 0 -0.5rem;
}
.recent-row:hover {
  background: var(--bg-card-hover, rgba(255, 255, 255, 0.03));
}
.recent-row:last-child {
  border-bottom: none;
}
.recent-thumb {
  width: 56px;
  height: 42px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  flex-shrink: 0;
}

.min-w-0 { min-width: 0; }
</style>
