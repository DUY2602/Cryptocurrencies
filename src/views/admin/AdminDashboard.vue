<script setup>
/**
 * AdminDashboard — overview page
 *
 *  - Quick KPIs (total, featured, trending, this week)
 *  - Category breakdown
 *  - Recent articles list
 *  - Quick actions
 */

import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { fetchNews, subscribeNews } from "../../services/news.js";
import { user } from "../../composables/useAuth.js";
import LoadingSpinner from "../../components/LoadingSpinner.vue";
import EmptyState from "../../components/EmptyState.vue";

const router = useRouter();
const articles = ref([]);
const loading = ref(true);
let unsubscribe = null;

async function load() {
  loading.value = true;
  try {
    articles.value = await fetchNews();
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
  unsubscribe = subscribeNews(() => load());
});
onBeforeUnmount(() => unsubscribe && unsubscribe());

const kpis = computed(() => {
  const total = articles.value.length;
  const featured = articles.value.filter((a) => a.featured).length;
  const trending = articles.value.filter((a) => a.trending).length;

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = articles.value.filter((a) => {
    const d = a.date ? new Date(a.date).getTime() : 0;
    return d >= weekAgo;
  }).length;

  const totalWords = articles.value.reduce((sum, a) => {
    const plain = (a.content || "").replace(/<[^>]+>/g, " ").trim();
    return sum + (plain ? plain.split(/\s+/).length : 0);
  }, 0);

  return { total, featured, trending, thisWeek, totalWords };
});

const categoryBreakdown = computed(() => {
  const map = new Map();
  for (const a of articles.value) {
    const k = a.category || "General";
    map.set(k, (map.get(k) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
});

const recent = computed(() => articles.value.slice(0, 5));

const topAuthors = computed(() => {
  const map = new Map();
  for (const a of articles.value) {
    if (!a.author_name) continue;
    const k = a.author_name;
    const cur = map.get(k) || { name: k, count: 0, avatar: a.author_avatar };
    cur.count += 1;
    map.set(k, cur);
  }
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
});

const maxCatCount = computed(() =>
  Math.max(1, ...categoryBreakdown.value.map((c) => c.count)),
);

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function go(to) {
  router.push(to);
}
</script>

<template>
  <div class="admin-dashboard">
    <header
      class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4"
    >
      <div>
        <h1 class="page-title mb-1">Welcome back, {{ user?.name }} 👋</h1>
        <p class="page-subtitle mb-0">
          Here's a quick look at your content library.
        </p>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <button
          class="btn btn-outline-accent"
          @click="go({ name: 'AdminNews' })"
        >
          📰 All articles
        </button>
        <button
          class="btn btn-accent"
          @click="go({ name: 'AdminNewsEdit', params: { id: 'new' } })"
        >
          + New article
        </button>
      </div>
    </header>

    <LoadingSpinner v-if="loading && !articles.length" />

    <template v-else>
      <!-- KPI cards -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="kpi-card card-crypto p-3">
            <div
              class="kpi-icon"
              style="background: rgba(240, 185, 11, 0.15); color: var(--accent)"
            >
              📰
            </div>
            <div class="kpi-label">Total articles</div>
            <div class="kpi-value">{{ kpis.total }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-card card-crypto p-3">
            <div
              class="kpi-icon"
              style="background: rgba(102, 126, 234, 0.15); color: #667eea"
            >
              ⭐
            </div>
            <div class="kpi-label">Featured</div>
            <div class="kpi-value">{{ kpis.featured }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-card card-crypto p-3">
            <div
              class="kpi-icon"
              style="
                background: rgba(14, 203, 129, 0.15);
                color: var(--positive);
              "
            >
              🔥
            </div>
            <div class="kpi-label">Trending</div>
            <div class="kpi-value">{{ kpis.trending }}</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="kpi-card card-crypto p-3">
            <div
              class="kpi-icon"
              style="
                background: rgba(246, 70, 93, 0.15);
                color: var(--negative);
              "
            >
              📅
            </div>
            <div class="kpi-label">This week</div>
            <div class="kpi-value">{{ kpis.thisWeek }}</div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <!-- Category breakdown -->
        <div class="col-lg-6">
          <div class="card-crypto p-3 p-md-4 h-100">
            <h6 class="text-emphasis mb-3">📊 Articles by category</h6>
            <div v-if="!categoryBreakdown.length" class="text-secondary small">
              No articles yet.
            </div>
            <div
              v-for="c in categoryBreakdown"
              :key="c.category"
              class="cat-row"
            >
              <div class="d-flex justify-content-between small mb-1">
                <span class="text-emphasis">{{ c.category }}</span>
                <span class="text-secondary">{{ c.count }}</span>
              </div>
              <div class="cat-bar">
                <div
                  class="cat-fill"
                  :style="{ width: (c.count / maxCatCount) * 100 + '%' }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Top authors -->
        <div class="col-lg-6">
          <div class="card-crypto p-3 p-md-4 h-100">
            <h6 class="text-emphasis mb-3">✍ Top authors</h6>
            <EmptyState
              v-if="!topAuthors.length"
              icon="✍"
              title="No author data"
              message="Add author names to your articles to see stats."
            />
            <ul v-else class="author-list list-unstyled mb-0">
              <li
                v-for="(a, i) in topAuthors"
                :key="a.name"
                class="author-row d-flex align-items-center gap-2"
              >
                <span class="rank-pill">#{{ i + 1 }}</span>
                <img
                  v-if="a.avatar"
                  :src="a.avatar"
                  :alt="a.name"
                  class="author-avatar-sm rounded-circle"
                />
                <div
                  v-else
                  class="author-avatar-sm rounded-circle avatar-fallback"
                >
                  {{ a.name[0].toUpperCase() }}
                </div>
                <div class="flex-grow-1 min-w-0">
                  <div class="text-emphasis text-truncate">{{ a.name }}</div>
                  <div class="text-secondary small">
                    {{ a.count }} article{{ a.count > 1 ? "s" : "" }}
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Recent articles -->
      <div class="card-crypto p-3 p-md-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="text-emphasis mb-0">🕒 Recent articles</h6>
          <button
            class="btn btn-sm btn-link text-secondary p-0"
            @click="go({ name: 'AdminNews' })"
          >
            View all →
          </button>
        </div>
        <EmptyState
          v-if="!recent.length"
          icon="📭"
          title="No articles yet"
          message="Click '+ New article' to publish your first post."
        />
        <ul v-else class="recent-list list-unstyled mb-0">
          <li
            v-for="a in recent"
            :key="a.id"
            class="recent-row d-flex align-items-center gap-3"
            @click="go({ name: 'AdminNewsEdit', params: { id: a.id } })"
            role="button"
            tabindex="0"
          >
            <img
              :src="a.image_url"
              :alt="a.title"
              class="recent-thumb"
              loading="lazy"
            />
            <div class="flex-grow-1 min-w-0">
              <div class="d-flex gap-2 align-items-center mb-1">
                <span class="badge bg-secondary-subtle text-secondary">
                  {{ a.category }}
                </span>
                <span v-if="a.featured" class="badge bg-warning text-dark"
                  >Featured</span
                >
                <span v-if="a.trending" class="badge bg-info">Trending</span>
              </div>
              <div class="text-emphasis fw-semibold text-truncate">
                {{ a.title }}
              </div>
              <div class="text-secondary small text-truncate">
                {{ a.summary }}
              </div>
            </div>
            <div
              class="text-end small text-secondary d-none d-md-block"
              style="min-width: 110px"
            >
              {{ formatDate(a.date) }}
            </div>
            <span class="text-secondary d-none d-md-inline">›</span>
          </li>
        </ul>
      </div>

      <!-- Total stats footer -->
      <div class="row g-3 mt-3">
        <div class="col-12">
          <div class="bin-stats-compact">
            <div class="bin-stat">
              <span class="bin-stat-lbl">Total words written</span>
              <span class="bin-stat-val">{{
                kpis.totalWords.toLocaleString()
              }}</span>
            </div>
            <div class="bin-stat">
              <span class="bin-stat-lbl">Avg words / article</span>
              <span class="bin-stat-val">
                {{
                  kpis.total
                    ? Math.round(kpis.totalWords / kpis.total).toLocaleString()
                    : 0
                }}
              </span>
            </div>
            <div class="bin-stat">
              <span class="bin-stat-lbl">Unique categories</span>
              <span class="bin-stat-val">{{ categoryBreakdown.length }}</span>
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
  flex-direction: column;
  gap: 0.4rem;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.kpi-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
}

.kpi-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.kpi-value {
  font-size: 1.85rem;
  font-weight: 700;
  color: var(--text-emphasis);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.cat-row {
  margin-bottom: 0.65rem;
}
.cat-row:last-child {
  margin-bottom: 0;
}

.cat-bar {
  height: 6px;
  background: var(--bg-secondary);
  border-radius: 999px;
  overflow: hidden;
}

.cat-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #fcd535);
  border-radius: 999px;
  transition: width 0.4s ease;
}

.rank-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 0.7rem;
  font-weight: 700;
  flex-shrink: 0;
}

.author-avatar-sm {
  width: 32px;
  height: 32px;
  object-fit: cover;
  flex-shrink: 0;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent), #d9a60a);
  color: var(--accent-text);
  font-weight: 700;
}

.author-row {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}
.author-row:last-child {
  border-bottom: none;
}

.recent-row {
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.15s ease;
  border-radius: 6px;
}
.recent-row:hover {
  background: var(--bg-card-hover);
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
.recent-row:last-child {
  border-bottom: none;
}

.recent-thumb {
  width: 64px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  flex-shrink: 0;
}

.min-w-0 {
  min-width: 0;
}
</style>
