<script setup>
/** AdminNews — paginated list with search, sort, CRUD, and realtime sync. */

import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import {
  fetchNewsAdmin,
  deleteNews,
  subscribeNews,
} from "../../services/news.js";
import { useAdmin } from "../../composables/useAdmin.js";
import { user } from "../../composables/useAuth.js";
import LoadingSpinner from "../../components/ui/LoadingSpinner.vue";
import EmptyState from "../../components/ui/EmptyState.vue";

const router = useRouter();
const { isAdmin, loading: roleLoading } = useAdmin();

const PAGE_SIZE = 10;

const articles = ref([]);
const loading = ref(true);
const errorMsg = ref(null);
const search = ref("");
const categoryFilter = ref("all");
const confirmingDelete = ref(null); // id
const busy = ref(false);
const fetchingNews = ref(false);
const fetchResult = ref(null); // { ok, count }

// Pagination + sorting.
const page = ref(1);
const totalCount = ref(0);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalCount.value / PAGE_SIZE)),
);
const sortField = ref("published_at");
const sortAsc = ref(false);

let unsubscribe = null;
let searchTimer = null;

async function load() {
  loading.value = true;
  errorMsg.value = null;
  try {
    const { articles: rows, total } = await fetchNewsAdmin({
      page: page.value,
      pageSize: PAGE_SIZE,
      search: search.value,
      category: categoryFilter.value,
      sortField: sortField.value,
      sortAsc: sortAsc.value,
    });
    articles.value = rows;
    totalCount.value = total;
    if (page.value > totalPages.value) page.value = totalPages.value;
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function fetchFromCoinDesk() {
  if (fetchingNews.value) return;
  fetchingNews.value = true;
  fetchResult.value = null;
  try {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      fetchResult.value = { ok: false, message: "Supabase not configured" };
      return;
    }
    const fnUrl = url.replace(/\/$/, "") + "/functions/v1/fetch-news";
    const res = await fetch(fnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
    });
    const data = await res.json();
    if (res.ok) {
      fetchResult.value = { ok: true, count: data.inserted, total: data.total };
      await load();
    } else {
      fetchResult.value = { ok: false, message: data.error || `HTTP ${res.status}` };
    }
  } catch (e) {
    fetchResult.value = { ok: false, message: e.message };
  } finally {
    fetchingNews.value = false;
  }
}

function onSearchInput() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    page.value = 1;
    load();
  }, 350);
}

watch(categoryFilter, () => {
  page.value = 1;
  load();
});

watch([sortField, sortAsc], () => {
  page.value = 1;
  load();
});

onMounted(() => {
  load();
// Realtime: re-fetch the list when something changes server-side.
// (cheap, robust, and avoids missing any cascade)
  unsubscribe = subscribeNews(() => load(), "admin-news");
});

onBeforeUnmount(() => {
  if (unsubscribe) unsubscribe();
  clearTimeout(searchTimer);
});

function toggleSort(field) {
  if (sortField.value === field) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortField.value = field;
    sortAsc.value = false;
  }
}

function goTo(p) {
  if (p < 1 || p > totalPages.value || p === page.value || loading.value) return;
  page.value = p;
  load();
}

const visiblePages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = page.value;
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push("...");
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
  }
  return pages;
});

const categories = computed(() => {
  const set = new Set(articles.value.map((a) => a.category).filter(Boolean));
  return ["all", ...Array.from(set).sort()];
});

const filtered = computed(() => articles.value);

function goCreate() {
  router.push({ name: "AdminNewsEdit", params: { id: "new" } });
}
function goEdit(id) {
  router.push({ name: "AdminNewsEdit", params: { id } });
}
function viewPublic(id) {
  router.push({ name: "NewsDetail", params: { id } });
}

async function confirmDelete() {
  if (!confirmingDelete.value) return;
  busy.value = true;
  try {
    await deleteNews(confirmingDelete.value);
    confirmingDelete.value = null;
    await load();
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    busy.value = false;
  }
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <section class="page-section admin-news">
    <div class="container">
      <header class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 class="page-title mb-1 d-flex align-items-center gap-2">
            <BookOpen :size="22" />
            News CMS
          </h1>
          <p class="page-subtitle mb-0">
            Create, edit and publish crypto news with rich-text content.
          </p>
        </div>
        <div class="d-flex gap-2">
          <button
            type="button"
            class="btn btn-outline-accent btn-sm"
            @click="load"
            :disabled="loading"
            title="Refresh"
          >
            <RefreshCw :size="14" />
            Refresh
          </button>
          <button
            type="button"
            class="btn btn-outline-accent btn-sm"
            :disabled="!isAdmin || fetchingNews"
            @click="fetchFromCoinDesk"
            title="Fetch latest from CoinDesk RSS"
          >
            <span v-if="fetchingNews" class="spinner-border spinner-border-sm me-1" />
            <BookOpen :size="14" />
            {{ fetchingNews ? "Fetching..." : "CoinDesk" }}
          </button>
          <button
            type="button"
            class="btn btn-accent btn-sm"
            :disabled="!isAdmin"
            @click="goCreate"
          >
            <Plus :size="14" />
            New article
          </button>
        </div>
      </header>

    <!-- Permission warnings -->
      <div v-if="!roleLoading && !isAdmin" class="alert alert-warning small">
        <strong>Read-only mode.</strong> You are signed in as
        <em>{{ user?.email }}</em> but your account is not flagged as
        <code>admin</code> in the <code>profiles</code> table. Run the SQL at the
        bottom of <code>supabase/complete_schema.sql</code> to promote yourself.
      </div>

    <!-- Filters -->
      <div class="row g-2 mb-3">
        <div class="col-12 col-md-7">
          <div class="search-wrap">
            <Search :size="14" class="search-icon" />
            <input
              v-model="search"
              type="text"
              class="form-control search-input"
              placeholder="Search title, summary, author, category..."
              @input="onSearchInput"
            />
          </div>
        </div>
        <div class="col-12 col-md-5">
          <select v-model="categoryFilter" class="form-select">
            <option v-for="c in categories" :key="c" :value="c">
              {{ c === "all" ? "All categories" : c }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="errorMsg" class="alert alert-danger small">{{ errorMsg }}</div>

      <div
        v-if="fetchResult"
        class="alert small d-flex align-items-center gap-2"
        :class="fetchResult.ok ? 'alert-success' : 'alert-warning'"
      >
        <span v-if="fetchResult.ok"><Check :size="14" /></span>
        <span v-else><AlertTriangle :size="16" /></span>
        <span class="flex-grow-1">
          <template v-if="fetchResult.ok">
            Inserted <strong>{{ fetchResult.count }}</strong> new article{{ fetchResult.count !== 1 ? "s" : "" }}
            from CoinDesk ({{ fetchResult.total }} items in feed).
          </template>
          <template v-else>
            {{ fetchResult.message }}
          </template>
        </span>
        <button class="btn-close btn-close-white btn-sm" @click="fetchResult = null" />
      </div>

      <LoadingSpinner v-if="loading && !articles.length" message="Loading articles..." />

      <EmptyState
        v-else-if="!loading && !filtered.length"
        icon="Inbox"
        title="No articles"
        message="Try clearing the filters, or click 'New article' to create one."
      />

      <div v-else class="card-crypto overflow-hidden">
        <div class="table-responsive">
          <table class="table table-dark-custom align-middle mb-0">
            <thead>
              <tr>
                <th style="width: 38%">
                  <button type="button" class="th-sort" :class="{ active: sortField === 'title' }" @click="toggleSort('title')">
                    Article
                    <ArrowUp v-if="sortField === 'title' && sortAsc" :size="12" />
                    <ArrowDown v-else-if="sortField === 'title' && !sortAsc" :size="12" />
                    <span v-else class="th-sort-idle"><ArrowUp :size="12" /></span>
                  </button>
                </th>
                <th>
                  <button type="button" class="th-sort" :class="{ active: sortField === 'category' }" @click="toggleSort('category')">
                    Category
                    <ArrowUp v-if="sortField === 'category' && sortAsc" :size="12" />
                    <ArrowDown v-else-if="sortField === 'category' && !sortAsc" :size="12" />
                    <span v-else class="th-sort-idle"><ArrowUp :size="12" /></span>
                  </button>
                </th>
                <th>
                  <button type="button" class="th-sort" :class="{ active: sortField === 'author_name' }" @click="toggleSort('author_name')">
                    Author
                    <ArrowUp v-if="sortField === 'author_name' && sortAsc" :size="12" />
                    <ArrowDown v-else-if="sortField === 'author_name' && !sortAsc" :size="12" />
                    <span v-else class="th-sort-idle"><ArrowUp :size="12" /></span>
                  </button>
                </th>
                <th>
                  <button type="button" class="th-sort" :class="{ active: sortField === 'published_at' }" @click="toggleSort('published_at')">
                    Published
                    <ArrowUp v-if="sortField === 'published_at' && sortAsc" :size="12" />
                    <ArrowDown v-else-if="sortField === 'published_at' && !sortAsc" :size="12" />
                    <span v-else class="th-sort-idle"><ArrowUp :size="12" /></span>
                  </button>
                </th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in filtered" :key="a.id">
                <td>
                  <div class="d-flex gap-3 align-items-center">
                    <img
                      :src="a.image_url"
                      :alt="a.title"
                      class="admin-thumb"
                      loading="lazy"
                    />
                    <div class="min-w-0">
                      <div class="text-emphasis fw-semibold text-truncate" style="max-width: 380px">
                        {{ a.title }}
                      </div>
                      <div class="small text-secondary text-truncate" style="max-width: 380px">
                        {{ a.summary }}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="blog-category d-inline-block">{{ a.category }}</span>
                </td>
                <td class="small">{{ a.author_name || "—" }}</td>
                <td class="small text-secondary">{{ formatDate(a.date) }}</td>
                <td class="text-center">
                  <div class="d-flex gap-1 justify-content-center">
                    <button
                      type="button"
                      class="btn btn-icon btn-ghost"
                      title="Preview"
                      @click="viewPublic(a.id)"
                    >
                      <Eye :size="16" />
                    </button>
                    <button
                      type="button"
                      class="btn btn-icon btn-ghost"
                      :disabled="!isAdmin"
                      title="Edit"
                      @click="goEdit(a.id)"
                    >
                      <Edit3 :size="16" />
                    </button>
                    <button
                      type="button"
                      class="btn btn-icon btn-ghost text-danger"
                      :disabled="!isAdmin || busy"
                      title="Delete"
                      @click="confirmingDelete = a.id"
                    >
                      <Trash2 :size="16" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="!loading && totalCount > 0" class="pagination-bar">
            <div class="pagination-info">
              {{ (page - 1) * PAGE_SIZE + 1 }}–{{ Math.min(page * PAGE_SIZE, totalCount) }}
              of {{ totalCount }} articles
            </div>
            <nav aria-label="News pagination">
              <ul class="pagination pagination-sm mb-0">
                <li class="page-item" :class="{ disabled: page <= 1 || loading }">
                  <button type="button" class="page-link" @click="goTo(page - 1)" :disabled="page <= 1 || loading">
                    <ChevronLeft :size="16" />
                  </button>
                </li>
                <li
                  v-for="(p, i) in visiblePages"
                  :key="i"
                  class="page-item"
                  :class="{ active: p === page, disabled: p === '...' }"
                >
                  <button
                    type="button"
                    class="page-link"
                    :disabled="p === '...' || loading"
                    @click="goTo(p)"
                  >
                    {{ p }}
                  </button>
                </li>
                <li class="page-item" :class="{ disabled: page >= totalPages || loading }">
                  <button type="button" class="page-link" @click="goTo(page + 1)" :disabled="page >= totalPages || loading">
                    <ChevronRight :size="16" />
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm delete modal (no Bootstrap JS needed) -->
    <div
      v-if="confirmingDelete"
      class="modal-backdrop-custom"
      role="dialog"
      @click.self="confirmingDelete = null"
    >
      <div class="modal-card card-crypto p-4">
        <h5 class="mb-2">Delete this article?</h5>
        <p class="text-secondary small mb-3">
          This action cannot be undone. The article will be permanently
          removed from the public feed.
        </p>
        <div class="d-flex justify-content-end gap-2">
          <button
            type="button"
            class="btn btn-outline-accent btn-sm"
            @click="confirmingDelete = null"
            :disabled="busy"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-danger btn-sm"
            @click="confirmDelete"
            :disabled="busy"
          >
            {{ busy ? "Deleting..." : "Delete" }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.admin-news {
  padding-top: 0;
}

.admin-thumb {
  width: 56px;
  height: 42px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  flex-shrink: 0;
}

.table-dark-custom {
  --bs-table-bg: transparent;
  --bs-table-color: var(--text-primary);
  --bs-table-border-color: var(--border-color);
  --bs-table-hover-bg: var(--bg-card-hover);
  --bs-table-hover-color: var(--text-primary);
  color: var(--text-primary);
  margin-bottom: 0;
}

.table-dark-custom thead th {
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  border-bottom: 1px solid var(--border-color);
  padding: 0.65rem 1rem;
}

.table-dark-custom tbody td {
  padding: 0.65rem 1rem;
  border-top: 1px solid var(--border-color);
  vertical-align: middle;
}

.table-dark-custom tbody tr {
  transition: background 0.15s ease;
}

.table-dark-custom tbody tr:hover {
  background: var(--bg-card-hover);
}

.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-card {
  max-width: 420px;
  width: 100%;
  background: var(--bg-card);
}

.min-w-0 {
  min-width: 0;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-icon:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.btn-icon:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-icon.text-danger:hover {
  background: rgba(246, 70, 93, 0.1);
  color: var(--negative) !important;
  border-color: rgba(246, 70, 93, 0.2);
}

.th-sort {
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color 0.15s ease;
}

.th-sort:hover {
  color: var(--text-primary);
}

.th-sort.active {
  color: var(--accent);
}

.th-sort-idle {
  display: inline-flex;
  opacity: 0.25;
}

.search-wrap {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input {
  padding-left: 34px;
}

/* Pagination bar */
.pagination-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  border-top: 1px solid var(--border-color);
}
.pagination-info {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.pagination {
  display: flex;
  gap: 0.35rem;
  margin: 0;
}
.pagination .page-item {
  margin: 0;
}
.pagination .page-link {
  min-width: 34px;
  height: 34px;
  padding: 0 0.5rem;
  border-radius: 9px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  font-weight: 600;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
}
.pagination .page-item.active .page-link {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  box-shadow: 0 2px 10px rgba(240, 185, 11, 0.3);
}
.pagination .page-link:hover:not(:disabled) {
  background: var(--bg-card-hover);
  border-color: var(--accent);
  color: var(--text-primary);
  transform: translateY(-1px);
}
.pagination .page-link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
.pagination .page-item.disabled .page-link {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
