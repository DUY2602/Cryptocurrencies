<script setup>
/**
 * AdminNewsEdit — create / edit form
 *
 *  - Renders the TipTap RichTextEditor for the body
 *  - Live preview pane (toggleable)
 *  - Validates required fields, sends a sanitized payload to Supabase
 *  - Route param "id" === "new" => create; otherwise update
 *  - All write access is also enforced server-side via RLS + is_admin()
 */

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
import RichTextEditor from "../../components/RichTextEditor.vue";
import LoadingSpinner from "../../components/LoadingSpinner.vue";

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

function onBeforeUnloadHandler(e) {
  if (dirty.value) {
    e.preventDefault();
    e.returnValue = "";
  }
}
</script>

<template>
  <section class="page-section admin-news-edit">
    <div class="container-fluid container-xxl">
      <!-- Header / toolbar -->
      <header
        class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4"
      >
        <div class="min-w-0">
          <button
            type="button"
            class="btn btn-sm btn-link text-secondary p-0 mb-2"
            @click="cancel"
          >
            ← Back to News CMS
          </button>
          <h1 class="page-title mb-1 d-flex align-items-center gap-2 flex-wrap">
            <span>{{ isNew ? "New article" : `Edit article #${id}` }}</span>
            <span
              v-if="lastSavedAt"
              class="badge bg-success-subtle text-success-emphasis"
            >
              ✓ Saved {{ lastSavedAt.toLocaleTimeString() }}
            </span>
            <span
              v-else-if="dirty"
              class="badge bg-warning-subtle text-warning-emphasis"
            >
              • Unsaved changes
            </span>
          </h1>
          <p class="page-subtitle mb-0">
            Use the toolbar to format the body. All HTML is sanitized
            server-side before being stored.
          </p>
        </div>

        <div class="d-flex gap-2 flex-wrap">
          <button
            type="button"
            class="btn btn-outline-accent"
            :class="{ active: showPreview }"
            @click="showPreview = !showPreview"
          >
            {{ showPreview ? "✕ Hide preview" : "👁 Preview" }}
          </button>
          <button
            v-if="!isNew"
            type="button"
            class="btn btn-outline-accent"
            @click="viewPublic"
          >
            ↗ Public page
          </button>
          <button
            type="button"
            class="btn btn-outline-accent"
            :disabled="saving"
            @click="cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-accent"
            :disabled="!canSave"
            @click="save"
          >
            <span v-if="saving" class="spinner-border spinner-border-sm me-2" />
            {{ saving ? "Saving..." : isNew ? "Publish" : "Save changes" }}
          </button>
        </div>
      </header>

      <!-- Permission warnings -->
      <div v-if="!roleLoading && !isAdmin" class="alert alert-warning small">
        <strong>Read-only mode.</strong> You are signed in as
        <em>{{ user?.email }}</em> but your account is not flagged as
        <code>admin</code> in the <code>profiles</code> table. Run the SQL at
        the bottom of <code>supabase/news_table.sql</code> to promote yourself.
      </div>

      <div
        v-if="errorMsg"
        class="alert alert-danger small d-flex align-items-start gap-2"
      >
        <span>⚠</span>
        <span class="flex-grow-1">{{ errorMsg }}</span>
        <button
          class="btn-close btn-close-white btn-sm"
          @click="errorMsg = null"
        />
      </div>
      <div
        v-if="successMsg"
        class="alert alert-success small d-flex align-items-center gap-2"
      >
        ✓ {{ successMsg }}
        <button
          class="btn-close btn-close-white btn-sm ms-auto"
          @click="successMsg = null"
        />
      </div>

      <LoadingSpinner v-if="loadingData" message="Loading article..." />

      <div v-else class="row g-4">
        <!-- ───────────── Main column: editor ───────────── -->
        <div :class="showPreview ? 'col-lg-7' : 'col-lg-8'">
          <div class="card-crypto p-3 p-md-4 mb-3">
            <label class="form-label fw-semibold text-emphasis">Title</label>
            <input
              v-model="form.title"
              type="text"
              class="form-control form-control-lg"
              :class="{ 'is-invalid': errors.title }"
              placeholder="A great headline that hooks the reader..."
              maxlength="200"
            />
            <div v-if="errors.title" class="invalid-feedback d-block">
              {{ errors.title }}
            </div>
            <div class="d-flex justify-content-between mt-1">
              <small class="text-secondary">Required, 8–200 characters</small>
              <small class="text-secondary">{{ form.title.length }}/200</small>
            </div>
          </div>

          <div class="card-crypto p-3 p-md-4 mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="form-label fw-semibold text-emphasis mb-0">
                Summary
              </label>
              <button
                type="button"
                class="btn btn-sm btn-outline-accent py-0 px-2"
                :disabled="!form.content || !!form.summary"
                title="Generate from the first 180 chars of the body"
                @click="autoSummary"
              >
                ✨ Auto
              </button>
            </div>
            <textarea
              v-model="form.summary"
              class="form-control"
              :class="{ 'is-invalid': errors.summary }"
              rows="2"
              placeholder="One or two sentences. Shown in cards & SEO."
              maxlength="240"
            />
            <div v-if="errors.summary" class="invalid-feedback d-block">
              {{ errors.summary }}
            </div>
            <div class="d-flex justify-content-between mt-1">
              <small class="text-secondary">
                Shown in news cards and meta description
              </small>
              <small class="text-secondary"
                >{{ form.summary.length }}/240</small
              >
            </div>
          </div>

          <div class="card-crypto p-3 p-md-4">
            <div
              class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2"
            >
              <label class="form-label fw-semibold text-emphasis mb-0">
                Body
              </label>
              <div class="small text-secondary d-flex gap-3 flex-wrap">
                <span>📝 {{ bodyStats.words }} words</span>
                <span>🔤 {{ bodyStats.chars }} chars</span>
                <span>⏱ ~{{ bodyStats.minutes }} min read</span>
              </div>
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

        <!-- ───────────── Sidebar: metadata ───────────── -->
        <div :class="showPreview ? 'col-lg-5' : 'col-lg-4'">
          <div class="card-crypto p-3 p-md-4 mb-3 sidebar-card">
            <h6 class="text-emphasis mb-3 d-flex align-items-center gap-2">
              🏷 Classification
            </h6>

            <label class="form-label small text-secondary">Category</label>
            <select
              v-model="form.category"
              class="form-select mb-1"
              :class="{ 'is-invalid': errors.category }"
            >
              <option v-for="c in COMMON_CATEGORIES" :key="c" :value="c">
                {{ c }}
              </option>
            </select>
            <div v-if="errors.category" class="text-danger small mb-2">
              {{ errors.category }}
            </div>

            <label class="form-label small text-secondary mt-2">Tags</label>
            <div
              class="tags-input form-control d-flex flex-wrap gap-1 align-items-center"
            >
              <span
                v-for="t in form.tags"
                :key="t"
                class="tag-chip d-inline-flex align-items-center gap-1"
              >
                #{{ t }}
                <button
                  type="button"
                  class="tag-remove"
                  aria-label="Remove tag"
                  @click="removeTag(t)"
                >
                  ×
                </button>
              </span>
              <input
                v-model="tagInput"
                type="text"
                class="tag-text-input"
                :placeholder="
                  form.tags.length
                    ? form.tags.length >= 12
                      ? 'Max 12 tags'
                      : 'Add tag…'
                    : 'bitcoin, defi, …'
                "
                :disabled="form.tags.length >= 12"
                @keydown="handleTagKey"
                @blur="syncTagsOnBlur"
              />
            </div>
            <small class="text-secondary">
              Press <kbd>Enter</kbd> or <kbd>,</kbd> to add. Max 12 tags.
            </small>
          </div>

          <div class="card-crypto p-3 p-md-4 mb-3 sidebar-card">
            <h6 class="text-emphasis mb-3 d-flex align-items-center gap-2">
              🖼 Cover image
            </h6>
            <input
              v-model="form.image_url"
              type="url"
              class="form-control mb-2"
              :class="{ 'is-invalid': errors.image_url }"
              placeholder="https://…"
            />
            <div v-if="errors.image_url" class="text-danger small mb-2">
              {{ errors.image_url }}
            </div>
            <div v-if="form.image_url" class="cover-preview mb-2">
              <img :src="form.image_url" alt="Cover preview" />
            </div>
            <small class="text-secondary">
              Recommended: 1200×630px (OpenGraph). Leave empty to use the
              default hero.
            </small>
          </div>

          <div class="card-crypto p-3 p-md-4 mb-3 sidebar-card">
            <h6 class="text-emphasis mb-3 d-flex align-items-center gap-2">
              ✍ Author & source
            </h6>
            <label class="form-label small text-secondary">Author name</label>
            <input
              v-model="form.author_name"
              type="text"
              class="form-control mb-2"
              placeholder="Jane Doe"
            />
            <label class="form-label small text-secondary"
              >Author avatar URL</label
            >
            <input
              v-model="form.author_avatar"
              type="url"
              class="form-control mb-2"
              placeholder="https://…/avatar.png"
            />
            <div
              v-if="form.author_avatar"
              class="cover-preview mb-2 avatar-preview"
            >
              <img :src="form.author_avatar" alt="Author avatar" />
            </div>
            <label class="form-label small text-secondary mt-2"
              >Source name</label
            >
            <input
              v-model="form.source_name"
              type="text"
              class="form-control mb-2"
              placeholder="CoinDesk, The Block…"
            />
            <label class="form-label small text-secondary">Source URL</label>
            <input
              v-model="form.source_url"
              type="url"
              class="form-control"
              placeholder="https://original-article.com"
            />
          </div>

          <div class="card-crypto p-3 p-md-4 mb-3 sidebar-card">
            <h6 class="text-emphasis mb-3 d-flex align-items-center gap-2">
              ⚑ Visibility
            </h6>
            <div class="form-check form-switch mb-2">
              <input
                id="featuredFlag"
                v-model="form.featured"
                class="form-check-input"
                type="checkbox"
              />
              <label class="form-check-label" for="featuredFlag">
                <strong>Featured</strong>
                <small class="d-block text-secondary">
                  Pinned to the top of the news feed
                </small>
              </label>
            </div>
            <div class="form-check form-switch mb-3">
              <input
                id="trendingFlag"
                v-model="form.trending"
                class="form-check-input"
                type="checkbox"
              />
              <label class="form-check-label" for="trendingFlag">
                <strong>Trending</strong>
                <small class="d-block text-secondary">
                  Highlighted in the Trending sidebar
                </small>
              </label>
            </div>

            <label class="form-label small text-secondary">
              Estimated read time (minutes)
            </label>
            <div class="d-flex align-items-center gap-2">
              <input
                v-model.number="form.read_time"
                type="range"
                class="form-range"
                min="1"
                max="30"
                step="1"
              />
              <span
                class="badge bg-secondary-subtle text-secondary"
                style="min-width: 48px"
              >
                {{ form.read_time }} min
              </span>
            </div>
            <small class="text-secondary">
              Auto-calculated at ~{{ bodyStats.minutes }} min from body length
            </small>
          </div>

          <div v-if="!isNew" class="card-crypto p-3 p-md-4 sidebar-card">
            <h6 class="text-emphasis mb-2">Article info</h6>
            <div class="bin-stats-compact mt-0">
              <div class="bin-stat">
                <span class="bin-stat-lbl">ID</span>
                <span class="bin-stat-val">#{{ id }}</span>
              </div>
              <div class="bin-stat">
                <span class="bin-stat-lbl">Status</span>
                <span class="bin-stat-val">
                  <span class="badge bg-success-subtle text-success-emphasis">
                    Published
                  </span>
                </span>
              </div>
              <div class="bin-stat">
                <span class="bin-stat-lbl">Word count</span>
                <span class="bin-stat-val">{{ bodyStats.words }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.admin-news-edit {
  padding-top: 32px;
}

.min-w-0 {
  min-width: 0;
}

.sidebar-card {
  position: sticky;
  position: -webkit-sticky;
}

@media (min-width: 992px) {
  .sidebar-card {
    top: 90px;
  }
}

.tags-input {
  min-height: 42px;
  padding: 0.35rem 0.5rem;
  cursor: text;
}

.tag-chip {
  background: rgba(240, 185, 11, 0.15);
  color: var(--accent);
  border: 1px solid rgba(240, 185, 11, 0.35);
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.4;
}

.tag-remove {
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: 1rem;
  line-height: 1;
  padding: 0 0 0 0.15rem;
  cursor: pointer;
  opacity: 0.7;
}

.tag-remove:hover {
  opacity: 1;
}

.tag-text-input {
  flex: 1;
  min-width: 100px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 0.9rem;
  padding: 0.15rem 0.25rem;
}

.tag-text-input::placeholder {
  color: var(--text-secondary);
}

.cover-preview {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-preview {
  width: 72px;
  height: 72px;
  aspect-ratio: 1;
  border-radius: 50%;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

kbd {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 4px;
  padding: 0 0.35rem;
  font-size: 0.7rem;
  font-family: ui-monospace, monospace;
}

.btn-close-white {
  filter: invert(1) grayscale(100%) brightness(200%);
}
</style>
