<script setup>
/**
 * AdminUsers — CRUD user management (list, create, edit, delete).
 */

import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { supabase } from "../../../supabase/supabase.js";
import { useAdmin } from "../../composables/useAdmin.js";
import { user } from "../../composables/useAuth.js";
import LoadingSpinner from "../../components/ui/LoadingSpinner.vue";
import EmptyState from "../../components/ui/EmptyState.vue";

const { isAdmin, loading: roleLoading } = useAdmin();

const profiles = ref([]);
const loading = ref(false);
const errorMsg = ref(null);
const successMsg = ref(null);
const search = ref("");
const busyId = ref(null);

const USERS_PER_PAGE = 10;
const userPage = ref(1);

// Modal state.
const confirmDelete = ref(null);
const editModal = ref(null);
const createModal = ref(false);

const createForm = ref({ name: "", email: "", role: "user" });
const createLoading = ref(false);
const createError = ref(null);
const createdUser = ref(null); // result of a successful create (temp password)
const copied = ref(false);

const editForm = ref({ name: "", role: "user" });
const editLoading = ref(false);
const editError = ref(null);

async function load() {
  loading.value = true;
  errorMsg.value = null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    profiles.value = data || [];
  } catch (e) {
    errorMsg.value = e.message;
    profiles.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(load);

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return profiles.value;
  return profiles.value.filter(
    (p) =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.role || "").toLowerCase().includes(q) ||
      (p.id || "").toLowerCase().includes(q),
  );
});

const stats = computed(() => ({
  total: profiles.value.length,
  admins: profiles.value.filter((p) => p.role === "admin").length,
  users: profiles.value.filter((p) => p.role !== "admin").length,
}));

// ── Pagination ────────────────────────────────────────────────
const userTotalPages = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / USERS_PER_PAGE)),
);

const paginatedUsers = computed(() => {
  const start = (userPage.value - 1) * USERS_PER_PAGE;
  return filtered.value.slice(start, start + USERS_PER_PAGE);
});

const visibleUserPages = computed(() => {
  const total = userTotalPages.value;
  const cur = userPage.value;
  const pages = [];
  const push = (p) => {
    if (p >= 1 && p <= total && !pages.includes(p)) pages.push(p);
  };
  push(1);
  if (cur - 1 > 2) pages.push("...");
  for (let p = cur - 1; p <= cur + 1; p++) push(p);
  if (cur + 1 < total - 1) pages.push("...");
  push(total);
  return pages;
});

function goUserPage(p) {
  if (p < 1 || p > userTotalPages.value || typeof p !== "number") return;
  userPage.value = p;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

watch(search, () => {
  userPage.value = 1;
});

// Create
function openCreate() {
  createForm.value = { name: "", email: "", role: "user" };
  createError.value = null;
  createdUser.value = null;
  copied.value = false;
  createModal.value = true;
}

/**
 * admin-users edge function: create/delete auth users (requires service role).
 */
async function invokeAdminUsers(body) {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body,
  });
  if (error) {
    let message = error.message || "Request failed";
    if (error.context?.status) {
      try {
        const errJson = await error.context.json();
        if (errJson?.error) message = errJson.error;
      } catch {
        /* keep default message */
      }
    }
    throw new Error(message);
  }
  if (data && data.ok === false) {
    throw new Error(data.error || "Operation failed");
  }
  return data;
}

async function submitCreate() {
  if (!createForm.value.email.trim()) {
    createError.value = "Email is required.";
    return;
  }
  createLoading.value = true;
  createError.value = null;
  try {
    const data = await invokeAdminUsers({
      action: "create",
      email: createForm.value.email.trim(),
      name: createForm.value.name.trim(),
      role: createForm.value.role,
    });
    createdUser.value = data;
    profiles.value.unshift({
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    createError.value = e.message;
  } finally {
    createLoading.value = false;
  }
}

function closeCreate() {
  createModal.value = false;
  createdUser.value = null;
  copied.value = false;
}

async function copyPassword() {
  if (!createdUser.value?.tempPassword) return;
  try {
    await navigator.clipboard.writeText(createdUser.value.tempPassword);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    /* clipboard unavailable — ignore */
  }
}

// Edit
function openEdit(profile) {
  editForm.value = { name: profile.name || "", role: profile.role || "user" };
  editError.value = null;
  editModal.value = profile;
}

async function submitEdit() {
  if (!editModal.value) return;
  editLoading.value = true;
  editError.value = null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        name: editForm.value.name.trim() || null,
        role: editForm.value.role,
      })
      .eq("id", editModal.value.id)
      .select("id, email, name, role, created_at")
      .single();
    if (error) throw error;
    const idx = profiles.value.findIndex((p) => p.id === data.id);
    if (idx !== -1) profiles.value[idx] = data;
    editModal.value = null;
    showSuccess("User updated successfully.");
  } catch (e) {
    editError.value = e.message;
  } finally {
    editLoading.value = false;
  }
}

// Delete
async function deleteProfile(id) {
  busyId.value = id;
  errorMsg.value = null;
  try {
    const data = await invokeAdminUsers({ action: "delete", id });
    if (!data?.ok) throw new Error(data?.error || "Failed to delete user");
    profiles.value = profiles.value.filter((p) => p.id !== id);
    confirmDelete.value = null;
    showSuccess("User deleted.");
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    busyId.value = null;
  }
}

// Helpers
function showSuccess(msg) {
  successMsg.value = msg;
  setTimeout(() => (successMsg.value = null), 3500);
}

function initialOf(name, email) {
  const src = name || email || "?";
  return src.trim().charAt(0).toUpperCase();
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Escape closes any open modal.
function onKeydown(e) {
  if (e.key === "Escape") {
    if (confirmDelete.value) confirmDelete.value = null;
    else if (editModal.value) editModal.value = null;
    else if (createModal.value) createModal.value = false;
  }
}
onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <div class="admin-users">
    <header class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
      <div>
        <h1 class="page-title mb-1 d-flex align-items-center gap-2">
          <Users :size="22" />
          Users
        </h1>
        <p class="page-subtitle mb-0">
          Manage user accounts and roles. Admins can create and edit news articles.
        </p>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-outline-accent btn-sm" @click="load" :disabled="loading">
          <RefreshCw :size="14" />
          Refresh
        </button>
        <button
          v-if="isAdmin"
          class="btn btn-accent btn-sm"
          @click="openCreate"
        >
          <UserPlus :size="14" />
          Add User
        </button>
      </div>
    </header>

    <!-- Stats -->
    <div class="row g-3 mb-4">      <div class="col-4">
        <div class="kpi-mini card-crypto p-3">
          <div class="kpi-mini-lbl">Total</div>
          <div class="kpi-mini-val">{{ stats.total }}</div>
        </div>
      </div>
      <div class="col-4">
        <div class="kpi-mini card-crypto p-3">
          <div class="kpi-mini-lbl">Admins</div>
          <div class="kpi-mini-val accent">{{ stats.admins }}</div>
        </div>
      </div>
      <div class="col-4">
        <div class="kpi-mini card-crypto p-3">
          <div class="kpi-mini-lbl">Users</div>
          <div class="kpi-mini-val">{{ stats.users }}</div>
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
        placeholder="Search by name, email or role…"
      />
    </div>

    <!-- Success/Error banners -->
    <transition name="fade-banner">
      <div v-if="successMsg" class="alert-banner alert-success-banner mb-3">
        <Check :size="15" /> {{ successMsg }}
      </div>
    </transition>
    <div v-if="errorMsg" class="alert-banner alert-danger-banner mb-3">
      <AlertTriangle :size="15" />
      <span class="flex-grow-1">{{ errorMsg }}</span>
      <button class="close-btn" @click="errorMsg = null">
        <X :size="14" />
      </button>
    </div>

    <div v-if="!roleLoading && !isAdmin" class="alert-banner alert-warn-banner mb-3">
      You need admin role to manage users. The list is read-only.
    </div>

    <!-- Loading / empty -->
    <LoadingSpinner v-if="loading && !profiles.length" message="Loading users..." />

    <EmptyState
      v-else-if="!loading && !filtered.length"
      icon="User"
      title="No users found"
      :message="
        search
          ? 'Try a different search term.'
          : 'No profiles yet. Users appear here after registration.'
      "
    />

    <!-- Table -->
    <div v-else class="card-crypto overflow-hidden">
      <div class="table-responsive">
        <table class="table table-dark-custom align-middle mb-0">
          <thead>
            <tr>
              <th>User</th>
              <th class="d-none d-md-table-cell">Email</th>
              <th class="d-none d-sm-table-cell">Joined</th>
              <th>Role</th>
              <th class="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in paginatedUsers" :key="p.id">
              <!-- User -->
              <td>
                <div class="d-flex gap-3 align-items-center">
                  <div class="user-avatar avatar-fallback">
                    {{ initialOf(p.name, p.email) }}
                  </div>
                  <div class="min-w-0">
                    <div class="text-emphasis fw-semibold text-truncate" style="max-width: 180px">
                      {{ p.name || "(no name)" }}
                      <span v-if="p.id === user?.id" class="you-badge">you</span>
                    </div>
                    <div class="text-secondary small text-truncate d-md-none" style="max-width: 180px">
                      {{ p.email || p.id }}
                    </div>
                  </div>
                </div>
              </td>
              <!-- Email (md+) -->
              <td class="d-none d-md-table-cell small text-secondary text-truncate" style="max-width: 200px">
                {{ p.email || "—" }}
              </td>
              <!-- Joined -->
              <td class="d-none d-sm-table-cell small text-secondary">
                {{ formatDate(p.created_at) }}
              </td>
              <!-- Role -->
              <td>
                <span v-if="p.role === 'admin'" class="role-badge role-admin">
                  <Star :size="10" class="me-1" />Admin
                </span>
                <span v-else class="role-badge role-user">User</span>
              </td>
              <!-- Actions -->
              <td class="text-center">
                <div class="d-flex gap-1 justify-content-center">
                  <button
                    type="button"
                    class="btn btn-xs btn-outline-accent"
                    :disabled="!isAdmin || busyId === p.id"
                    title="Edit user"
                    @click="openEdit(p)"
                  >
                    <Pencil :size="13" />
                  </button>
                  <button
                    type="button"
                    class="btn btn-xs btn-outline-danger"
                    :disabled="!isAdmin || busyId === p.id || p.id === user?.id"
                    :title="p.id === user?.id ? 'You cannot delete yourself' : 'Delete user'"
                    @click="confirmDelete = p"
                  >
                    <Trash2 :size="13" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="userTotalPages > 1" class="pagination-bar">
        <div class="pagination-info">
          {{ (userPage - 1) * USERS_PER_PAGE + 1 }}–{{ Math.min(userPage * USERS_PER_PAGE, filtered.length) }}
          of {{ filtered.length }} users
        </div>
        <nav aria-label="Users pagination">
          <ul class="pagination pagination-sm mb-0">
            <li class="page-item" :class="{ disabled: userPage <= 1 || loading }">
              <button type="button" class="page-link" @click="goUserPage(userPage - 1)" :disabled="userPage <= 1 || loading">
                <ChevronLeft :size="16" />
              </button>
            </li>
            <li
              v-for="(p, i) in visibleUserPages"
              :key="i"
              class="page-item"
              :class="{ active: p === userPage, disabled: p === '...' }"
            >
              <button
                type="button"
                class="page-link"
                :disabled="p === '...' || loading"
                @click="goUserPage(p)"
              >
                {{ p }}
              </button>
            </li>
            <li class="page-item" :class="{ disabled: userPage >= userTotalPages || loading }">
              <button type="button" class="page-link" @click="goUserPage(userPage + 1)" :disabled="userPage >= userTotalPages || loading">
                <ChevronRight :size="16" />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- ── Create Modal ───────────────────────────────────────── -->
    <div v-if="createModal" class="modal-backdrop-custom" role="dialog" aria-modal="true" @click.self="closeCreate">
      <div class="modal-card card-crypto p-4">
        <div class="modal-header-row mb-3">
          <h5 class="mb-0 d-flex align-items-center gap-2">
            <UserPlus :size="18" /> Add User
          </h5>
          <button class="close-btn" @click="closeCreate"><X :size="16" /></button>
        </div>

        <template v-if="createdUser">
          <div class="alert-banner alert-success-banner mb-3 small">
            <Check :size="13" /> User created successfully.
          </div>
          <p class="text-secondary small mb-1">
            <strong>{{ createdUser.email }}</strong> (role:
            <strong>{{ createdUser.role }}</strong
            >) can log in immediately with this temporary password:
          </p>
          <div class="temp-password-box mb-2 d-flex align-items-center justify-content-between gap-2">
            <code>{{ createdUser.tempPassword }}</code>
            <button type="button" class="btn btn-xs btn-outline-accent" @click="copyPassword">
              <Check v-if="copied" :size="12" />
              <Copy v-else :size="12" />
              {{ copied ? "Copied" : "Copy" }}
            </button>
          </div>
          <p class="text-secondary small mb-3">
            Share this password securely — the user can change it later from their
            profile.
          </p>
          <div class="d-flex justify-content-end">
            <button type="button" class="btn btn-accent btn-sm" @click="closeCreate">Done</button>
          </div>
        </template>

        <template v-else>
          <p class="text-secondary small mb-3">
            Creates a confirmed account right away (email + generated temporary
            password). Admins get full access to the admin panel.
          </p>
          <div v-if="createError" class="alert-banner alert-danger-banner mb-3 small">
            <AlertTriangle :size="13" /> {{ createError }}
          </div>
          <div class="mb-3">
            <label class="modal-label">Name</label>
            <input v-model="createForm.name" type="text" class="form-control" placeholder="Display name (optional)" :disabled="createLoading" />
          </div>
          <div class="mb-3">
            <label class="modal-label">Email <span class="text-negative">*</span></label>
            <input v-model="createForm.email" type="email" class="form-control" placeholder="user@example.com" :disabled="createLoading" />
          </div>
          <div class="mb-4">
            <label class="modal-label">Role</label>
            <select v-model="createForm.role" class="form-control" :disabled="createLoading">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-accent btn-sm" @click="createModal = false" :disabled="createLoading">
              Cancel
            </button>
            <button type="button" class="btn btn-accent btn-sm" @click="submitCreate" :disabled="createLoading">
              <span v-if="createLoading" class="spinner-border spinner-border-sm me-1" />
              {{ createLoading ? "Creating…" : "Create User" }}
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- ── Edit Modal ─────────────────────────────────────────── -->
    <div v-if="editModal" class="modal-backdrop-custom" role="dialog" aria-modal="true" @click.self="editModal = null">
      <div class="modal-card card-crypto p-4">
        <div class="modal-header-row mb-3">
          <h5 class="mb-0 d-flex align-items-center gap-2">
            <Pencil :size="18" /> Edit User
          </h5>
          <button class="close-btn" @click="editModal = null"><X :size="16" /></button>
        </div>
        <!-- User info preview -->
        <div class="user-preview mb-3">
          <div class="user-avatar avatar-fallback me-2">{{ initialOf(editModal.name, editModal.email) }}</div>
          <div class="min-w-0">
            <div class="text-emphasis fw-semibold">{{ editModal.name || "(no name)" }}</div>
            <div class="text-secondary small">{{ editModal.email || editModal.id }}</div>
          </div>
        </div>
        <div v-if="editError" class="alert-banner alert-danger-banner mb-3 small">
          <AlertTriangle :size="13" /> {{ editError }}
        </div>
        <div class="mb-3">
          <label class="modal-label">Display Name</label>
          <input v-model="editForm.name" type="text" class="form-control" placeholder="Display name" :disabled="editLoading" />
        </div>
        <div class="mb-4">
          <label class="modal-label">Role</label>
          <select v-model="editForm.role" class="form-control" :disabled="editLoading || editModal.id === user?.id">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <p v-if="editModal.id === user?.id" class="text-secondary small mt-1">
            You cannot change your own role.
          </p>
        </div>
        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-accent btn-sm" @click="editModal = null" :disabled="editLoading">
            Cancel
          </button>
          <button type="button" class="btn btn-accent btn-sm" @click="submitEdit" :disabled="editLoading">
            <span v-if="editLoading" class="spinner-border spinner-border-sm me-1" />
            {{ editLoading ? "Saving…" : "Save Changes" }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Delete Confirm Modal ──────────────────────────────── -->
    <div v-if="confirmDelete" class="modal-backdrop-custom" role="dialog" aria-modal="true" @click.self="confirmDelete = null">
      <div class="modal-card card-crypto p-4">
        <div class="modal-header-row mb-3">
          <h5 class="mb-0 d-flex align-items-center gap-2 text-negative">
            <Trash2 :size="18" /> Delete User
          </h5>
          <button class="close-btn" @click="confirmDelete = null"><X :size="16" /></button>
        </div>
        <p class="text-secondary small mb-1">
          You are about to permanently delete:
        </p>
        <div class="user-preview mb-3">
          <div class="user-avatar avatar-fallback me-2">{{ initialOf(confirmDelete.name, confirmDelete.email) }}</div>
          <div class="min-w-0">
            <div class="text-emphasis fw-semibold">{{ confirmDelete.name || "(no name)" }}</div>
            <div class="text-secondary small">{{ confirmDelete.email || confirmDelete.id }}</div>
          </div>
        </div>
        <p class="text-secondary small mb-3">
          This action <strong>cannot be undone</strong>. The profile will be permanently removed.
        </p>
        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-accent btn-sm" @click="confirmDelete = null" :disabled="busyId">
            Cancel
          </button>
          <button type="button" class="btn btn-danger btn-sm" :disabled="busyId" @click="deleteProfile(confirmDelete.id)">
            <span v-if="busyId" class="spinner-border spinner-border-sm me-1" />
            {{ busyId ? "Deleting…" : "Delete User" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Avatar ───────────────────────────────────────────────────── */
.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
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
  font-size: 0.85rem;
}

/* ── Badges ───────────────────────────────────────────────────── */
.role-badge svg {
  vertical-align: middle;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  border: 1px solid;
  white-space: nowrap;
}

.role-admin {
  background: var(--accent-bg-subtle);
  color: var(--accent);
  border-color: var(--accent-bg-hover);
}

.role-user {
  background: var(--bg-card);
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.you-badge {
  display: inline-block;
  background: var(--bg-card-hover);
  color: var(--text-secondary);
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  margin-left: 4px;
  vertical-align: middle;
}

/* ── KPI Mini cards ───────────────────────────────────────────── */
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
.alert-warn-banner {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.25);
  color: var(--accent);
}
.fade-banner-enter-active,
.fade-banner-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-banner-enter-from,
.fade-banner-leave-to { opacity: 0; transform: translateY(-6px); }

/* ── Table ────────────────────────────────────────────────────── */
.table-dark-custom {
  --bs-table-bg: transparent;
  --bs-table-color: var(--text-primary);
  --bs-table-border-color: var(--border-color);
  --bs-table-hover-bg: var(--bg-card-hover);
  --bs-table-hover-color: var(--text-primary);
  color: var(--text-primary);
}

.table-dark-custom thead th {
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
  border-bottom: 1px solid var(--border-color);
  padding: 0.65rem 1rem;
  white-space: nowrap;
}

.table-dark-custom tbody td {
  padding: 0.7rem 1rem;
  border-top: 1px solid var(--border-color);
  vertical-align: middle;
}

.table-dark-custom tbody tr {
  transition: background 0.15s ease;
}

.table-dark-custom tbody tr:hover {
  background: var(--bg-card-hover);
}

/* ── Buttons ──────────────────────────────────────────────────── */
.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 6px;
  line-height: 1.4;
}
.btn-outline-danger {
  color: var(--negative);
  border-color: var(--negative);
  background: transparent;
  transition: all 0.15s ease;
}
.btn-outline-danger:hover:not(:disabled) {
  background: var(--negative-bg);
}
.btn-danger {
  background: var(--negative);
  border-color: var(--negative);
  color: #fff;
}
.btn-danger:hover:not(:disabled) {
  filter: brightness(1.1);
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
  -webkit-backdrop-filter: blur(4px);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-card {
  max-width: 460px;
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

/* ── User preview row ─────────────────────────────────────────── */
.user-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
}

/* ── Pagination bar ── */
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

/* ── Misc ─────────────────────────────────────────────────────── */
.min-w-0 { min-width: 0; }
.text-negative { color: var(--negative); }

.temp-password-box {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
}
.temp-password-box code {
  color: var(--accent);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  user-select: all;
}
</style>
