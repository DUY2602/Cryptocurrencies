<script setup>
/**
 * AdminUsers — list and manage user roles
 *
 *  - Lists all profiles from Supabase
 *  - Allows promoting/demoting roles (admin / user)
 *  - Server-side: RLS in the profiles table should also enforce
 */

import { ref, computed, onMounted } from "vue";
import { supabase } from "../../../supabase/supabase.js";
import { useAdmin } from "../../composables/useAdmin.js";
import { user } from "../../composables/useAuth.js";
import LoadingSpinner from "../../components/LoadingSpinner.vue";
import EmptyState from "../../components/EmptyState.vue";

const { isAdmin, loading: roleLoading } = useAdmin();

const profiles = ref([]);
const loading = ref(false);
const errorMsg = ref(null);
const search = ref("");
const busyId = ref(null);
const confirmDelete = ref(null);

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
  const users = profiles.value.filter((p) => p.role !== "admin");
  const q = search.value.trim().toLowerCase();
  if (!q) return users;
  return users.filter(
    (p) =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.id || "").toLowerCase().includes(q),
  );
});

const stats = computed(() => ({
  total: profiles.value.filter((p) => p.role !== "admin").length,
  admins: profiles.value.filter((p) => p.role === "admin").length,
  users: profiles.value.filter((p) => p.role !== "admin").length,
}));

async function deleteProfile(id) {
  busyId.value = id;
  errorMsg.value = null;
  try {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) throw error;
    profiles.value = profiles.value.filter((p) => p.id !== id);
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    busyId.value = null;
    confirmDelete.value = null;
  }
}

function initialOf(name) {
  return (name || "?").trim().charAt(0).toUpperCase();
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
</script>

<template>
  <div class="admin-users">
    <header
      class="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4"
    >
      <div>
        <h1 class="page-title mb-1 d-flex align-items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Users
        </h1>
        <p class="page-subtitle mb-0">
          Manage user roles. Admins can create and edit news articles.
        </p>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <button
          class="btn btn-outline-accent btn-sm"
          @click="load"
          :disabled="loading"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Refresh
        </button>
      </div>
    </header>

    <!-- Stats -->
    <div class="row g-3 mb-3">
      <div class="col-6 col-md-4">
        <div class="kpi-mini card-crypto p-3">
          <div class="kpi-mini-lbl">Total</div>
          <div class="kpi-mini-val">{{ stats.total }}</div>
        </div>
      </div>
      <div class="col-6 col-md-4">
        <div class="kpi-mini card-crypto p-3">
          <div class="kpi-mini-lbl">Admins</div>
          <div class="kpi-mini-val text-warning">{{ stats.admins }}</div>
        </div>
      </div>
      <div class="col-6 col-md-4">
        <div class="kpi-mini card-crypto p-3">
          <div class="kpi-mini-lbl">Regular users</div>
          <div class="kpi-mini-val">{{ stats.users }}</div>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-3">
      <input
        v-model="search"
        type="text"
        class="form-control"
        placeholder="🔍  Search by name, ID, or role…"
      />
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

    <div v-if="!roleLoading && !isAdmin" class="alert alert-warning small">
      You need to be an admin to change roles. The list is read-only.
    </div>

    <LoadingSpinner
      v-if="loading && !profiles.length"
      message="Loading users..."
    />

    <EmptyState
      v-else-if="!loading && !filtered.length"
      icon="👤"
      title="No users found"
      :message="
        search
          ? 'Try a different search term.'
          : 'No profiles yet. Users are created on registration.'
      "
    />

    <div v-else class="card-crypto overflow-hidden">
      <div class="table-responsive">
        <table class="table table-dark-custom align-middle mb-0">
          <thead>
            <tr>
              <th>User</th>
              <th class="d-none d-md-table-cell">Joined</th>
              <th>Role</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filtered" :key="p.id">
              <td>
                  <div class="d-flex gap-3 align-items-center">
                    <div class="user-avatar avatar-fallback">
                      {{ initialOf(p.name) }}
                    </div>
                    <div class="min-w-0">
                    <div
                      class="text-emphasis fw-semibold text-truncate"
                      style="max-width: 220px"
                    >
                      {{ p.name || "(no name)" }}
                      <span
                        v-if="p.id === user?.id"
                        class="badge bg-secondary-subtle text-secondary ms-1"
                      >
                        you
                      </span>
                    </div>
                    <div
                      class="text-secondary small text-truncate"
                      style="max-width: 220px"
                    >
                      {{ p.email || p.id }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="d-none d-md-table-cell small text-secondary">
                {{ formatDate(p.created_at) }}
              </td>
              <td>
                <span v-if="p.role === 'admin'" class="role-badge role-admin"
                  >★ Admin</span
                >
                <span v-else class="role-badge role-user">User</span>
              </td>
              <td class="text-end">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  :disabled="!isAdmin || busyId === p.id || p.id === user?.id"
                  :title="p.id === user?.id ? 'You cannot delete yourself' : 'Delete user'"
                  @click="confirmDelete = p"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Confirm delete -->
    <div
      v-if="confirmDelete"
      class="modal-backdrop-custom"
      role="dialog"
      @click.self="confirmDelete = null"
    >
      <div class="modal-card card-crypto p-4">
        <h5 class="mb-2">Delete {{ confirmDelete.name || 'this user' }}?</h5>
        <p class="text-secondary small mb-3">
          This action cannot be undone. The user's profile will be permanently
          removed from the database.
        </p>
        <div class="d-flex justify-content-end gap-2">
          <button
            type="button"
            class="btn btn-outline-accent btn-sm"
            @click="confirmDelete = null"
            :disabled="busyId"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-danger btn-sm"
            :disabled="busyId"
            @click="deleteProfile(confirmDelete.id)"
          >
            <span v-if="busyId" class="spinner-border spinner-border-sm me-1" />
            {{ busyId ? "Deleting..." : "Delete" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  background: linear-gradient(135deg, var(--accent), #d9a60a);
  color: var(--accent-text);
  font-weight: 700;
  font-size: 0.85rem;
}

.role-badge {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  border: 1px solid;
}

.role-admin {
  background: rgba(240, 185, 11, 0.15);
  color: var(--accent);
  border-color: rgba(240, 185, 11, 0.4);
}

.role-user {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.kpi-mini {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
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
  font-weight: 700;
  color: var(--text-emphasis);
  font-variant-numeric: tabular-nums;
}

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
.btn-close-white {
  filter: invert(1) grayscale(100%) brightness(200%);
}
</style>
