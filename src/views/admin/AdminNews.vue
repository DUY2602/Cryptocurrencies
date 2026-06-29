<script setup>
/**
 * AdminNews — list view (Stage 3)
 *
 *  - Loads all news from Supabase (or local fallback via services/news.js)
 *  - Provides Create / Edit / Delete actions
 *  - Subscribes to realtime INSERT/UPDATE/DELETE so the list stays
 *    in sync when other admins are editing
 *  - Server-side RLS (is_admin) is the source of truth; this UI is
 *    just a friendly wrapper.
 */

import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import {
  fetchNews,
  deleteNews,
  subscribeNews,
  normalizeArticle,
} from "../../services/news.js";
import { useAdmin } from "../../composables/useAdmin.js";
import { user } from "../../composables/useAuth.js";
import LoadingSpinner from "../../components/LoadingSpinner.vue";
import EmptyState from "../../components/EmptyState.vue";

const router = useRouter();
const { isAdmin, loading: roleLoading } = useAdmin();

const articles = ref([]);
const loading = ref(true);
const errorMsg = ref(null);
const search = ref("");
const categoryFilter = ref("all");
const confirmingDelete = ref(null); // id
const busy = ref(false);
const fetchingNews = ref(false);
const fetchResult = ref(null); // { ok, count }

let unsubscribe = null;

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

async function load() {
  loading.value = true;
  errorMsg.value = null;
  try {
    articles.value = await fetchNews();
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  load();
  // Realtime — when something changes server-side, just re-fetch the list
  // (cheap, robust, and avoids us missing any cascade)
  unsubscribe = subscribeNews(() => load());
});

onBeforeUnmount(() => {
  if (unsubscribe) unsubscribe();
});

const categories = computed(() => {
  const set = new Set(articles.value.map((a) => a.category).filter(Boolean));
  return ["all", ...Array.from(set).sort()];
});

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return articles.value
    .filter((a) => categoryFilter.value === "all" || a.category === categoryFilter.value)
    .filter((a) => {
      if (!q) return true;
      const hay = [
        a.title,
        a.summary,
        a.author_name,
        (a.tags || []).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
});

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
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
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
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            {{ fetchingNews ? "Fetching..." : "CoinDesk" }}
          </button>
          <button
            type="button"
            class="btn btn-accent btn-sm"
            :disabled="!isAdmin"
            @click="goCreate"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New article
          </button>
        </div>
      </header>

      <!-- Permission warnings -->
      <div v-if="!roleLoading && !isAdmin" class="alert alert-warning small">
        <strong>Read-only mode.</strong> You are signed in as
        <em>{{ user?.email }}</em> but your account is not flagged as
        <code>admin</code> in the <code>profiles</code> table. Run the SQL at the
        bottom of <code>supabase/news_table.sql</code> to promote yourself.
      </div>

      <!-- Filters -->
      <div class="row g-2 mb-3">
        <div class="col-12 col-md-7">
          <input
            v-model="search"
            type="text"
            class="form-control"
            placeholder="🔍  Search title, summary, author, tags..."
          />
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
        <span v-if="fetchResult.ok">✓</span>
        <span v-else>⚠</span>
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
        icon="📭"
        title="No articles"
        message="Try clearing the filters, or click 'New article' to create one."
      />

      <div v-else class="card-crypto overflow-hidden">
        <div class="table-responsive">
          <table class="table table-dark-custom align-middle mb-0">
            <thead>
              <tr>
                <th style="width: 60%">Article</th>
                <th>Category</th>
                <th>Author</th>
                <th>Published</th>
                <th>Flags</th>
                <th class="text-end">Actions</th>
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
                <td>
                  <span v-if="a.featured" class="badge bg-warning text-dark me-1" title="Featured"
                    >Featured</span
                  >
                  <span v-if="a.trending" class="badge bg-info" title="Trending">Trending</span>
                </td>
                <td class="text-end">
                  <div class="d-flex gap-1 justify-content-end">
                    <button
                      type="button"
                      class="btn btn-icon btn-ghost"
                      title="Preview"
                      @click="viewPublic(a.id)"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button
                      type="button"
                      class="btn btn-icon btn-ghost"
                      :disabled="!isAdmin"
                      title="Edit"
                      @click="goEdit(a.id)"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button
                      type="button"
                      class="btn btn-icon btn-ghost text-danger"
                      :disabled="!isAdmin || busy"
                      title="Delete"
                      @click="confirmingDelete = a.id"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Confirm delete modal (lightweight, no Bootstrap JS needed) -->
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
</style>
