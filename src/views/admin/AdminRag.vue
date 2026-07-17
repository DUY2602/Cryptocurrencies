<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import { supabase } from "../../../supabase/supabase.js";
import { useAdmin } from "../../composables/useAdmin.js";

const { isAdmin } = useAdmin();

const docs = ref([]);
const loading = ref(false);
const errorMsg = ref(null);
const successMsg = ref(null);
const search = ref("");

const showEditModal = ref(false);
const editingDoc = ref(null);
const createModal = ref(false);
const deleteConfirm = ref(null);

const form = reactive({ title: "", content: "", source: "manual", source_id: "" });
const formLoading = ref(false);
const formError = ref(null);

async function loadDocs() {
  loading.value = true;
  errorMsg.value = null;
  try {
    const { data, error } = await supabase
      .from("documents")
      .select("id, source, source_id, title, content, metadata, embedding, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    docs.value = data || [];
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(loadDocs);

const docStats = computed(() => {
  const total = docs.value.length;
  const indexed = docs.value.filter((d) => d.embedding).length;
  const pending = total - indexed;
  return { total, indexed, pending };
});

const filteredDocs = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return docs.value;
  return docs.value.filter(
    (d) =>
      (d.title || "").toLowerCase().includes(q) ||
      (d.content || "").toLowerCase().includes(q) ||
      (d.source || "").toLowerCase().includes(q) ||
      (d.source_id || "").toLowerCase().includes(q),
  );
});

function openCreate() {
  form.title = "";
  form.content = "";
  form.source = "manual";
  form.source_id = crypto.randomUUID().slice(0, 8);
  formError.value = null;
  createModal.value = true;
}

async function submitCreate() {
  if (!form.title.trim() || !form.content.trim()) {
    formError.value = "Title and content are required.";
    return;
  }
  formLoading.value = true;
  formError.value = null;
  try {
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      source: form.source.trim() || "manual",
      source_id: form.source_id.trim() || crypto.randomUUID().slice(0, 8),
      metadata: {},
    };
    const { data, error } = await supabase
      .from("documents")
      .insert(payload)
      .select("id, source, source_id, title, content, metadata, embedding, created_at")
      .single();
    if (error) throw error;
    docs.value.unshift(data);
    createModal.value = false;
    successMsg.value = "Document added to knowledge base.";
    clearSuccess();
  } catch (e) {
    formError.value = e.message;
  } finally {
    formLoading.value = false;
  }
}

function openEdit(doc) {
  form.title = doc.title || "";
  form.content = doc.content || "";
  form.source = doc.source || "manual";
  form.source_id = doc.source_id || "";
  formError.value = null;
  editingDoc.value = doc;
  showEditModal.value = true;
}

async function submitEdit() {
  if (!editingDoc.value) return;
  if (!form.title.trim() || !form.content.trim()) {
    formError.value = "Title and content are required.";
    return;
  }
  formLoading.value = true;
  formError.value = null;
  try {
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      source: form.source.trim() || "manual",
      source_id: form.source_id.trim(),
      embedding: null,
    };
    const { data, error } = await supabase
      .from("documents")
      .update(payload)
      .eq("id", editingDoc.value.id)
      .select("id, source, source_id, title, content, metadata, embedding, created_at")
      .single();
    if (error) throw error;
    const idx = docs.value.findIndex((d) => d.id === data.id);
    if (idx !== -1) docs.value[idx] = data;
    showEditModal.value = false;
    editingDoc.value = null;
    successMsg.value = "Document updated. It will be re-indexed on the next sync.";
    clearSuccess();
  } catch (e) {
    formError.value = e.message;
  } finally {
    formLoading.value = false;
  }
}

async function submitDelete() {
  if (!deleteConfirm.value) return;
  try {
    const { error } = await supabase.from("documents").delete().eq("id", deleteConfirm.value.id);
    if (error) throw error;
    docs.value = docs.value.filter((d) => d.id !== deleteConfirm.value.id);
    deleteConfirm.value = null;
    successMsg.value = "Document deleted.";
    clearSuccess();
  } catch (e) {
    errorMsg.value = e.message;
  }
}

let successTimer = null;
function clearSuccess() {
  if (successTimer) clearTimeout(successTimer);
  successTimer = setTimeout(() => (successMsg.value = null), 3000);
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function closeModals() {
  showEditModal.value = false;
  editingDoc.value = null;
  createModal.value = false;
  deleteConfirm.value = null;
}

function onKeydown(e) {
  if (e.key === "Escape") closeModals();
}
onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <div class="admin-rag">
    <!-- ═══════════ Header ═══════════ -->
    <header class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
      <div>
        <h1 class="page-title mb-1 d-flex align-items-center gap-2">
          <Library :size="22" />
          Knowledge Base
        </h1>
        <p class="page-subtitle mb-0">
          Manage documents used by the AI assistant for RAG-powered answers.
          Edit content below — changes trigger re-indexing on the next sync cycle.
        </p>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-outline-accent btn-sm" @click="loadDocs" :disabled="loading">
          <RefreshCw :size="14" />
          Refresh
        </button>
        <button v-if="isAdmin" class="btn btn-accent btn-sm" @click="openCreate">
          <Plus :size="14" />
          Add Document
        </button>
      </div>
    </header>

    <!-- Alerts -->
    <div v-if="successMsg" class="alert-banner alert-success-banner mb-3">
      <Check :size="15" /> {{ successMsg }}
    </div>
    <div v-if="errorMsg && !loading" class="alert-banner alert-danger-banner mb-3">
      <AlertTriangle :size="15" />
      <span class="flex-grow-1">{{ errorMsg }}</span>
      <button class="close-btn" @click="errorMsg = null"><X :size="14" /></button>
    </div>

    <!-- Stats -->
    <div class="row g-3 mb-4">
      <div class="col-4">
        <div class="kpi-mini card-crypto p-3">
          <div class="kpi-mini-lbl">Total documents</div>
          <div class="kpi-mini-val">{{ docStats.total }}</div>
        </div>
      </div>
      <div class="col-4">
        <div class="kpi-mini card-crypto p-3">
          <div class="kpi-mini-lbl">Indexed (with embedding)</div>
          <div class="kpi-mini-val accent">{{ docStats.indexed }}</div>
        </div>
      </div>
      <div class="col-4">
        <div class="kpi-mini card-crypto p-3">
          <div class="kpi-mini-lbl">Pending indexing</div>
          <div class="kpi-mini-val">{{ docStats.pending }}</div>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="search-wrap mb-3">
      <Search :size="15" class="search-icon" />
      <input
        v-model="search"
        type="text"
        class="form-control search-input"
        placeholder="Search by title, content, source..."
      />
    </div>

    <!-- Loading / empty -->
    <div v-if="loading && !docs.length" class="text-secondary small py-4 text-center">
      <span class="spinner-border spinner-border-sm me-1" /> Loading documents...
    </div>
    <div v-else-if="!filteredDocs.length" class="text-secondary small py-4 text-center">
      {{ search ? "No documents match your search." : "Knowledge base is empty. Click 'Add Document' to start building it." }}
    </div>

    <!-- Document list -->
    <div v-else class="d-flex flex-column gap-2">
      <div v-for="d in filteredDocs" :key="d.id" class="doc-row">
        <div class="doc-info">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="doc-title">{{ d.title }}</span>
            <span class="badge" :class="d.embedding ? 'bg-success-subtle text-success-emphasis' : 'bg-warning-subtle text-warning-emphasis'">
              {{ d.embedding ? "Indexed" : "Pending" }}
            </span>
          </div>
          <div class="doc-meta">
            <span class="meta-chip">{{ d.source }}<template v-if="d.source_id"> / {{ d.source_id }}</template></span>
            <span class="text-secondary small">{{ formatDate(d.created_at) }}</span>
            <span class="text-secondary small">{{ d.content?.length || 0 }} chars</span>
          </div>
          <div class="doc-preview">{{ d.content?.slice(0, 300) }}{{ d.content?.length > 300 ? "…" : "" }}</div>
        </div>
        <div class="doc-actions">
          <button class="btn btn-sm btn-ghost" title="Edit" @click="openEdit(d)">
            <Pencil :size="13" />
          </button>
          <button class="btn btn-sm btn-ghost text-danger" title="Delete" @click="deleteConfirm = d">
            <Trash2 :size="13" />
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════ Create Modal ═══════════ -->
    <div v-if="createModal" class="modal-backdrop-custom" @click.self="closeModals">
      <div class="modal-card card-crypto p-4">
        <div class="modal-header-row mb-3">
          <h5 class="mb-0 d-flex align-items-center gap-2">
            <Plus :size="18" /> Add Document
          </h5>
          <button class="close-btn" @click="closeModals"><X :size="16" /></button>
        </div>
        <p class="text-secondary small mb-3">
          New documents start as "Pending" — the <code>sync-guides</code> Edge Function will
          generate embeddings on the next run.
        </p>
        <div v-if="formError" class="alert-banner alert-danger-banner mb-3 small">
          <AlertTriangle :size="13" /> {{ formError }}
        </div>
        <div class="mb-3">
          <label class="modal-label">Title</label>
          <input v-model="form.title" type="text" class="form-control" placeholder="Document title" :disabled="formLoading" />
        </div>
        <div class="mb-3">
          <label class="modal-label">Content <span class="text-danger">*</span></label>
          <textarea v-model="form.content" class="form-control" rows="6" placeholder="Plain text content — this will be embedded and searched by Gemini." :disabled="formLoading" />
        </div>
        <div class="row g-2 mb-4">
          <div class="col-6">
            <label class="modal-label">Source</label>
            <input v-model="form.source" type="text" class="form-control" placeholder="manual" :disabled="formLoading" />
          </div>
          <div class="col-6">
            <label class="modal-label">Source ID</label>
            <input v-model="form.source_id" type="text" class="form-control" placeholder="auto-generated" :disabled="formLoading" />
          </div>
        </div>
        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-accent btn-sm" @click="closeModals" :disabled="formLoading">Cancel</button>
          <button type="button" class="btn btn-accent btn-sm" @click="submitCreate" :disabled="formLoading">
            <span v-if="formLoading" class="spinner-border spinner-border-sm me-1" />
            {{ formLoading ? "Adding…" : "Add to Knowledge Base" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════ Edit Modal ═══════════ -->
    <div v-if="showEditModal" class="modal-backdrop-custom" @click.self="closeModals">
      <div class="modal-card card-crypto p-4">
        <div class="modal-header-row mb-3">
          <h5 class="mb-0 d-flex align-items-center gap-2">
            <Pencil :size="18" /> Edit Document
          </h5>
          <button class="close-btn" @click="closeModals"><X :size="16" /></button>
        </div>
        <p class="text-secondary small mb-3">
          Editing resets the embedding to null so the document gets re-indexed.
        </p>
        <div v-if="formError" class="alert-banner alert-danger-banner mb-3 small">
          <AlertTriangle :size="13" /> {{ formError }}
        </div>
        <div class="mb-3">
          <label class="modal-label">Title</label>
          <input v-model="form.title" type="text" class="form-control" :disabled="formLoading" />
        </div>
        <div class="mb-3">
          <label class="modal-label">Content <span class="text-danger">*</span></label>
          <textarea v-model="form.content" class="form-control" rows="8" :disabled="formLoading" />
        </div>
        <div class="row g-2 mb-4">
          <div class="col-6">
            <label class="modal-label">Source</label>
            <input v-model="form.source" type="text" class="form-control" :disabled="formLoading" />
          </div>
          <div class="col-6">
            <label class="modal-label">Source ID</label>
            <input v-model="form.source_id" type="text" class="form-control" :disabled="formLoading" />
          </div>
        </div>
        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-accent btn-sm" @click="closeModals" :disabled="formLoading">Cancel</button>
          <button type="button" class="btn btn-accent btn-sm" @click="submitEdit" :disabled="formLoading">
            <span v-if="formLoading" class="spinner-border spinner-border-sm me-1" />
            {{ formLoading ? "Saving…" : "Save Changes" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════ Delete Confirm ═══════════ -->
    <div v-if="deleteConfirm" class="modal-backdrop-custom" @click.self="deleteConfirm = null">
      <div class="modal-card card-crypto p-4">
        <div class="modal-header-row mb-3">
          <h5 class="mb-0 d-flex align-items-center gap-2 text-danger">
            <Trash2 :size="18" /> Delete Document
          </h5>
          <button class="close-btn" @click="deleteConfirm = null"><X :size="16" /></button>
        </div>
        <p class="text-secondary small mb-1">You are about to permanently delete:</p>
        <p class="fw-semibold text-emphasis mb-3">{{ deleteConfirm.title }}</p>
        <p class="text-secondary small mb-3">This action <strong>cannot be undone</strong>.</p>
        <p v-if="errorMsg" class="alert-banner alert-danger-banner mb-3 small">
          <AlertTriangle :size="13" /> {{ errorMsg }}
        </p>
        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-accent btn-sm" @click="deleteConfirm = null">Cancel</button>
          <button type="button" class="btn btn-danger btn-sm" @click="submitDelete">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kpi-mini {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  height: 100%;
}
.kpi-mini-lbl {
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}
.kpi-mini-val {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-emphasis);
  font-variant-numeric: tabular-nums;
}
.kpi-mini-val.accent { color: var(--accent); }

.doc-row {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-card);
  transition: border-color 0.15s ease;
}
.doc-row:hover {
  border-color: rgba(240, 185, 11, 0.2);
}
.doc-info {
  flex: 1;
  min-width: 0;
}
.doc-title {
  font-weight: 700;
  color: var(--text-emphasis);
  font-size: 0.95rem;
}
.doc-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}
.meta-chip {
  font-size: 0.7rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  font-weight: 500;
}
.doc-preview {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.doc-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex-shrink: 0;
  justify-content: flex-start;
}

/* ── Search ───────────────────────────────────────────────────── */
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
  z-index: 1;
}
.search-input {
  padding-left: 38px !important;
}

/* ── Alert banners ────────────────────────────────────────────── */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid;
}
.alert-success-banner {
  background: var(--positive-bg);
  border-color: rgba(16, 185, 129, 0.25);
  color: var(--positive);
}
.alert-danger-banner {
  background: var(--negative-bg);
  border-color: rgba(220, 38, 38, 0.25);
  color: var(--negative);
}

/* ── Buttons ──────────────────────────────────────────────────── */
.btn-ghost {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1.4;
  transition: all 0.15s ease;
}
.btn-ghost:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}
.btn-ghost.text-danger:hover {
  background: var(--negative-bg);
  color: var(--negative) !important;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}
.close-btn:hover { color: var(--text-emphasis); }

/* ── Modals ───────────────────────────────────────────────────── */
.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background: var(--overlay-bg);
  backdrop-filter: blur(4px);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.modal-card {
  max-width: 560px;
  width: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
}
.modal-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.bg-success-subtle { background: var(--positive-bg); }
.text-success-emphasis { color: var(--positive); }
.bg-warning-subtle { background: rgba(245, 158, 11, 0.1); }
.text-warning-emphasis { color: var(--accent); }
</style>
