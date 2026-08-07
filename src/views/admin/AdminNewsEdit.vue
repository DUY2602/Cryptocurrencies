<script setup>
/** AdminNewsEdit — create/edit form with TipTap editor + preview. */

import {
  ref,
  reactive,
  computed,
  onMounted,
  onBeforeUnmount,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import DOMPurify from "dompurify";
import { createNews, updateNews, fetchNewsById } from "../../services/news.js";
import { useAdmin } from "../../composables/useAdmin.js";
import { user } from "../../composables/useAuth.js";
import RichTextEditor from "../../components/admin/RichTextEditor.vue";
import LoadingSpinner from "../../components/ui/LoadingSpinner.vue";

const route = useRoute();
const router = useRouter();
const { isAdmin, loading: roleLoading } = useAdmin();

const id = computed(() => route.params.id);
const isNew = computed(() => id.value === "new");

const form = reactive({
  title: "",
  summary: "",
  content: "",
  category: "General",
  image_url: "",
  source_url: "",
  source_name: "",
  author_name: "",
  author_avatar: "",
  tags: [],
  featured: false,
  trending: false,
  read_time: 3,
});

const tagInput = ref("");
const saving = ref(false);
const loadingData = ref(false);
const errorMsg = ref(null);
const successMsg = ref(null);
const showPreview = ref(false);
const lastSavedAt = ref(null);
const dirty = ref(false);

  const showMeta = ref(true);
  const metaWidth = ref(360);

  const COMMON_CATEGORIES = [
    "General",
    "Bitcoin",
    "Ethereum",
    "DeFi",
    "NFT",
    "Regulation",
    "Markets",
    "Altcoins",
    "Mining",
    "Web3",
  ];

async function loadArticle() {
  if (isNew.value) return;
  loadingData.value = true;
  errorMsg.value = null;
  try {
    const row = await fetchNewsById(id.value);
    if (!row) {
      errorMsg.value = "Article not found.";
      return;
    }
    form.title = row.title || "";
    form.summary = row.summary || "";
    form.content = row.content || row.full_content || "";
    form.category = row.category || "General";
    form.image_url = row.image_url || "";
    form.source_url = row.source_url || "";
    form.source_name = row.source_name || "";
    form.author_name = row.author_name || (row.author && row.author.name) || "";
    form.author_avatar =
      row.author_avatar || (row.author && row.author.avatar) || "";
    form.tags = Array.isArray(row.tags) ? [...row.tags] : [];
    form.featured = !!row.featured;
    form.trending = !!row.trending;
    form.read_time = row.read_time || 3;
    tagInput.value = form.tags.join(", ");
    dirty.value = false;
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    loadingData.value = false;
  }
}

onMounted(() => {
  loadArticle();
  window.addEventListener("beforeunload", onBeforeUnloadHandler);
});
watch(() => route.params.id, loadArticle);

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", onBeforeUnloadHandler);
});

// Track dirty state (skip the initial hydration)
watch(
  form,
  () => {
    if (!loadingData.value) dirty.value = true;
  },
  { deep: true },
);

// Word / character stats for the editor body
const bodyStats = computed(() => {
  const plain = (form.content || "").replace(/<[^>]+>/g, " ").trim();
  const words = plain ? plain.split(/\s+/).filter(Boolean).length : 0;
  const chars = plain.length;
  const minutes = Math.max(1, Math.round(words / 200));
  return { words, chars, minutes };
});

function addTag(raw) {
  const t = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\- ]/g, "");
  if (!t) return;
  if (!form.tags.includes(t) && form.tags.length < 12) form.tags.push(t);
}

function removeTag(t) {
  form.tags = form.tags.filter((x) => x !== t);
}

function handleTagKey(e) {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault();
    if (tagInput.value.trim()) {
      tagInput.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach(addTag);
      tagInput.value = "";
    }
  } else if (e.key === "Backspace" && !tagInput.value && form.tags.length) {
    form.tags.pop();
  }
}

function syncTagsOnBlur() {
  if (!tagInput.value.trim()) return;
  tagInput.value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach(addTag);
  tagInput.value = "";
}

const errors = computed(() => {
  const e = {};
  if (!form.title.trim()) e.title = "Title is required.";
  else if (form.title.trim().length < 8)
    e.title = "Title is too short (min 8 chars).";
  if (!form.summary.trim())
    e.summary = "Summary helps the article show up in lists.";
  const plain = (form.content || "").replace(/<[^>]+>/g, "").trim();
  if (plain.length < 20) e.content = "Body must be at least 20 characters.";
  if (!form.category.trim()) e.category = "Category is required.";
  if (form.image_url && !/^https?:\/\//.test(form.image_url))
    e.image_url = "Image URL must start with http(s)://";
  return e;
});

const canSave = computed(
  () =>
    Object.keys(errors.value).length === 0 && !saving.value && isAdmin.value,
);

const safePreview = computed(() =>
  DOMPurify.sanitize(form.content || "", {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "code",
      "pre",
      "h1",
      "h2",
      "h3",
      "h4",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "blockquote",
      "span",
      "div",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "title", "class"],
  }),
);

async function save() {
  if (!canSave.value) return;
  errorMsg.value = null;
  successMsg.value = null;
  saving.value = true;
  try {
    syncTagsOnBlur();
    const payload = {
      ...form,
      tags: [...form.tags],
      published_at: new Date().toISOString(),
    };
    let saved;
    if (isNew.value) {
      saved = await createNews(payload, user.value?.id);
    } else {
      saved = await updateNews(id.value, payload, user.value?.id);
    }
    dirty.value = false;
    lastSavedAt.value = new Date();
    successMsg.value = "Saved successfully.";
    if (isNew.value) {
      router.replace({ name: "AdminNewsEdit", params: { id: saved.id } });
    }
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    saving.value = false;
  }
}

function viewPublic() {
  if (isNew.value) return;
  router.push({ name: "NewsDetail", params: { id: id.value } });
}

function cancel() {
  if (dirty.value && !window.confirm("Discard unsaved changes?")) return;
  router.push({ name: "AdminNews" });
}

function autoSummary() {
  if (form.summary.trim()) return;
  const plain = (form.content || "").replace(/<[^>]+>/g, " ").trim();
  if (!plain) return;
  form.summary =
    plain.length > 180 ? plain.slice(0, 180).trim() + "..." : plain;
}

  function startResize(e) {
    const startX = e.clientX;
    const startW = metaWidth.value;
    function onMove(ev) {
      const diff = startX - ev.clientX;
      metaWidth.value = Math.max(280, Math.min(600, startW + diff));
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function onBeforeUnloadHandler(e) {
    if (dirty.value) {
      e.preventDefault();
      e.returnValue = "";
    }
  }
</script>

<template>
  <section class="admin-news-edit">
    <!-- Top bar (GDocs-style) -->
    <header class="editor-topbar">
      <div class="topbar-left">
        <button type="button" class="btn btn-sm btn-ghost" @click="cancel">
          <ArrowLeft :size="16" /> Back
        </button>
        <span class="topbar-divider" />
        <span class="topbar-title">{{ isNew ? "New article" : "Edit article" }}</span>
        <span v-if="lastSavedAt" class="save-badge saved">
          <Check :size="14" /> Saved {{ lastSavedAt.toLocaleTimeString() }}
        </span>
        <span v-else-if="dirty" class="save-badge unsaved">
          ● Unsaved
        </span>
      </div>
      <div class="topbar-right">
        <div class="body-stats" v-if="form.content">
          {{ bodyStats.words }} words · {{ bodyStats.minutes }} min
        </div>
        <button
          type="button"
          class="btn btn-sm btn-ghost"
          :class="{ active: showPreview }"
          @click="showPreview = !showPreview"
          title="Preview"
        >
          <Eye :size="16" />
        </button>
        <button
          type="button"
          class="btn btn-sm btn-ghost"
          :class="{ active: showMeta }"
          @click="showMeta = !showMeta"
          title="Metadata"
        >
          <Settings :size="14" />
        </button>
        <button
          v-if="!isNew"
          type="button"
          class="btn btn-sm btn-ghost"
          @click="viewPublic"
          title="View public page"
        >
          <ExternalLink :size="14" />
        </button>
        <button
          type="button"
          class="btn btn-sm btn-accent"
          :disabled="!canSave"
          @click="save"
        >
          <span v-if="saving" class="spinner-border spinner-border-sm me-1" />
          {{ saving ? "Saving..." : isNew ? "Publish" : "Save" }}
        </button>
      </div>
    </header>

    <!-- Permission + alerts -->
    <div v-if="!roleLoading && !isAdmin" class="alert alert-warning small mx-3 mt-3">
      <strong>Read-only.</strong> Signed in as <em>{{ user?.email }}</em> but not admin.
    </div>
    <div v-if="errorMsg" class="alert alert-danger small mx-3 mt-3 d-flex align-items-start gap-2">
      <span><AlertTriangle :size="16" /></span>
      <span class="flex-grow-1">{{ errorMsg }}</span>
      <button class="btn-close btn-close-white btn-sm" @click="errorMsg = null" />
    </div>
    <div v-if="successMsg" class="alert alert-success small mx-3 mt-3 d-flex align-items-center gap-2">
      <Check :size="14" /> {{ successMsg }}
      <button class="btn-close btn-close-white btn-sm ms-auto" @click="successMsg = null" />
    </div>

    <!-- Editor body -->
    <LoadingSpinner v-if="loadingData" message="Loading article..." />

    <div v-else class="editor-body">
      <!-- Editor (full, hidden when preview is active) -->
      <div v-show="!showPreview" class="editor-main">
        <div class="editor-content">
          <div class="doc-paper">
            <!-- Title -->
            <input
              v-model="form.title"
              type="text"
              class="doc-title-input"
              :class="{ 'is-invalid': errors.title }"
              placeholder="Untitled"
            />
            <div v-if="errors.title" class="invalid-feedback d-block">
              {{ errors.title }}
            </div>

            <!-- Summary -->
            <div class="summary-wrap">
              <textarea
                v-model="form.summary"
                class="doc-summary-input"
                :class="{ 'is-invalid': errors.summary }"
                rows="2"
                placeholder="Add a summary (shown in cards & SEO)"
                maxlength="240"
              />
              <div v-if="errors.summary" class="invalid-feedback d-block">
                {{ errors.summary }}
              </div>
              <div class="d-flex justify-content-end">
                <small v-if="form.summary" class="text-secondary">{{ form.summary.length }}/240</small>
              </div>
              <button
                v-if="!form.summary && form.content"
                type="button"
                class="btn btn-sm btn-ghost auto-summary-btn"
                @click="autoSummary"
              >
                <Sparkles :size="14" /> Auto-generate summary
              </button>
            </div>

            <!-- Body / RichTextEditor -->
            <div class="doc-body">
              <div class="body-stats-bar">
                <label class="form-label fw-semibold text-emphasis mb-0">Body</label>
              </div>
              <RichTextEditor
                v-model="form.content"
                placeholder="Start writing your article…"
                :min-height="420"
              />
              <div v-if="errors.content" class="text-danger small mt-2">
                {{ errors.content }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview (full, shown instead of editor) -->
      <div v-show="showPreview" class="preview-panel">
        <div class="preview-body">
          <div v-if="form.image_url" class="preview-cover">
            <img :src="form.image_url" alt="" />
          </div>
          <h2 class="preview-title">{{ form.title || "Untitled" }}</h2>
          <div class="preview-meta">
            <span>{{ form.category }}</span>
            <span>·</span>
            <span>{{ bodyStats.minutes }} min read</span>
          </div>
          <div v-if="form.summary" class="preview-summary">{{ form.summary }}</div>
          <div class="preview-body-content" v-html="safePreview" />
        </div>
      </div>

      <!-- Right metadata panel -->
      <div v-if="showMeta" class="meta-panel" :style="{ width: metaWidth + 'px' }">
        <div class="meta-resize-handle" @mousedown.prevent="startResize" />
        <div class="meta-panel-inner">
          <!-- Category -->
          <div class="meta-section">
            <label class="meta-label">Category</label>
            <select v-model="form.category" class="form-select form-select-sm" :class="{ 'is-invalid': errors.category }">
              <option v-for="c in COMMON_CATEGORIES" :key="c" :value="c">{{ c }}</option>
            </select>
            <div v-if="errors.category" class="text-danger small">{{ errors.category }}</div>
          </div>

          <!-- Tags -->
          <div class="meta-section">
            <label class="meta-label">Tags</label>
            <div class="tags-input form-control d-flex flex-wrap gap-1 align-items-center">
              <span v-for="t in form.tags" :key="t" class="tag-chip d-inline-flex align-items-center gap-1">
                #{{ t }}
                <button type="button" class="tag-remove" aria-label="Remove" @click="removeTag(t)"><X :size="16" /></button>
              </span>
              <input
                v-model="tagInput"
                type="text"
                class="tag-text-input"
                :placeholder="form.tags.length >= 12 ? 'Max 12' : 'Add tag…'"
                :disabled="form.tags.length >= 12"
                @keydown="handleTagKey"
                @blur="syncTagsOnBlur"
              />
            </div>
          </div>

          <!-- Cover image -->
          <div class="meta-section">
            <label class="meta-label">Cover image URL</label>
            <input v-model="form.image_url" type="url" class="form-control form-control-sm" :class="{ 'is-invalid': errors.image_url }" placeholder="https://…" />
            <div v-if="errors.image_url" class="text-danger small">{{ errors.image_url }}</div>
            <div v-if="form.image_url" class="cover-preview-sm mt-1">
              <img :src="form.image_url" alt="" />
            </div>
          </div>

          <!-- Author & source -->
          <div class="meta-section">
            <label class="meta-label">Author</label>
            <input v-model="form.author_name" type="text" class="form-control form-control-sm mb-2" placeholder="Jane Doe" />
            <label class="meta-label">Avatar URL</label>
            <input v-model="form.author_avatar" type="url" class="form-control form-control-sm mb-2" placeholder="https://…" />
            <div v-if="form.author_avatar" class="avatar-preview-sm">
              <img :src="form.author_avatar" alt="" />
            </div>
          </div>

          <div class="meta-section">
            <label class="meta-label">Source</label>
            <input v-model="form.source_name" type="text" class="form-control form-control-sm mb-2" placeholder="CoinDesk" />
            <input v-model="form.source_url" type="url" class="form-control form-control-sm" placeholder="https://…" />
          </div>

          <!-- Flags -->
          <div class="meta-section">
            <label class="meta-label">Visibility</label>
            <div class="form-check form-switch mb-1">
              <input id="featuredFlag" v-model="form.featured" class="form-check-input" type="checkbox" />
              <label class="form-check-label small" for="featuredFlag">Featured</label>
            </div>
            <div class="form-check form-switch mb-2">
              <input id="trendingFlag" v-model="form.trending" class="form-check-input" type="checkbox" />
              <label class="form-check-label small" for="trendingFlag">Trending</label>
            </div>
            <label class="meta-label">Read time</label>
            <div class="d-flex align-items-center gap-2">
              <input v-model.number="form.read_time" type="range" class="form-range" min="1" max="30" step="1" />
              <span class="badge bg-secondary-subtle text-secondary" style="min-width: 40px">{{ form.read_time }}m</span>
            </div>
          </div>

          <!-- Article info -->
          <div v-if="!isNew" class="meta-section">
            <label class="meta-label">Info</label>
            <div class="text-secondary small">ID: #{{ id }}</div>
            <div class="text-secondary small">{{ bodyStats.words }} words</div>
          </div>
        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
/* Layout */
.admin-news-edit {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background: var(--bg-primary);
}

/* Top bar (GDocs-style) */
.editor-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  gap: 0.5rem;
  z-index: 100;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.topbar-divider {
  width: 1px;
  height: 20px;
  background: var(--border-color);
}

.topbar-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-emphasis);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.save-badge {
  font-size: 0.72rem;
  white-space: nowrap;
}

.save-badge.saved {
  color: var(--positive);
}

.save-badge.unsaved {
  color: var(--accent);
}

.body-stats {
  font-size: 0.72rem;
  color: var(--text-secondary);
  white-space: nowrap;
  margin-right: 0.5rem;
}

.btn-ghost {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
  transition: all 0.15s ease;
}

.btn-ghost:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.btn-ghost.active {
  background: rgba(240, 185, 11, 0.12);
  color: var(--accent);
  border-color: rgba(240, 185, 11, 0.3);
}

/* Editor body */
.editor-body {
  display: flex;
  flex: 1;
  min-height: 0;
  position: relative;
}

.editor-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}

.editor-content {
  padding: 2rem 2rem 4rem;
  max-width: 780px;
  margin: 0 auto;
  width: 100%;
}

/* Document paper */
.doc-paper {
  background: var(--bg-card);
  border-radius: 4px;
  padding: 2.5rem 2.5rem 3rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color);
}

.doc-title-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-emphasis);
  padding: 0;
  margin-bottom: 1.5rem;
  line-height: 1.3;
}

.doc-title-input::placeholder {
  color: var(--text-tertiary);
}

.doc-title-input.is-invalid {
  color: var(--negative);
}

/* Summary */
.summary-wrap {
  margin-bottom: 1.5rem;
  position: relative;
}

.doc-summary-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 1rem;
  color: var(--text-primary);
  padding: 0;
  resize: none;
  line-height: 1.6;
}

.doc-summary-input::placeholder {
  color: var(--text-tertiary);
}

.doc-summary-input.is-invalid {
  color: var(--negative);
}

.auto-summary-btn {
  position: absolute;
  right: 0;
  bottom: -1.8rem;
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
}

/* Body */
.doc-body {
  border-top: 1px solid var(--border-color);
  padding-top: 1.5rem;
}

.body-stats-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

/* Preview panel */
.preview-panel {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  background: var(--bg-primary);
  display: flex;
  justify-content: center;
}

.preview-body {
  padding: 2.5rem 2rem 4rem;
  max-width: 780px;
  width: 100%;
}

.preview-cover {
  aspect-ratio: 16/9;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.preview-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-emphasis);
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.preview-meta {
  font-size: 0.8rem;
  color: var(--text-secondary);
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.preview-summary {
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-style: italic;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.preview-body-content {
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--text-primary);
}

/* Metadata panel */
.meta-panel {
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  overflow-y: auto;
  flex-shrink: 0;
  position: relative;
}

.meta-panel-inner {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.meta-section {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.meta-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meta-resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 4px;
  cursor: col-resize;
  z-index: 10;
  transform: translateX(-50%);
}

.meta-resize-handle:hover {
  background: var(--accent);
  opacity: 0.3;
}

/* Tags */
.tags-input {
  min-height: 34px;
  padding: 0.25rem 0.4rem;
  cursor: text;
}

.tag-chip {
  background: rgba(240, 185, 11, 0.15);
  color: var(--accent);
  border: 1px solid rgba(240, 185, 11, 0.35);
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 600;
}

.tag-remove {
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: 0.9rem;
  line-height: 1;
  padding: 0 0 0 0.15rem;
  cursor: pointer;
  opacity: 0.7;
}

.tag-remove:hover { opacity: 1; }

.tag-text-input {
  flex: 1;
  min-width: 80px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.82rem;
  padding: 0.1rem 0.2rem;
}

.tag-text-input::placeholder {
  color: var(--text-secondary);
}

/* Image previews */
.cover-preview-sm {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.cover-preview-sm img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-preview-sm {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.avatar-preview-sm img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Responsive */
@media (max-width: 991px) {
  .editor-content {
    padding: 1rem;
  }

  .doc-paper {
    padding: 1.5rem;
  }

  .doc-title-input {
    font-size: 1.3rem;
  }

  .preview-body {
    padding: 1.5rem 1rem;
  }

  .meta-panel {
    position: fixed;
    right: 0;
    top: 60px;
    bottom: 0;
    z-index: 200;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.2);
  }

  .meta-resize-handle {
    display: none;
  }
}

.invalid-feedback {
  font-size: 0.78rem;
}

.btn-close-white {
  filter: invert(1) grayscale(100%) brightness(200%);
}
</style>
