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
const confirmDemote = ref(null);

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
      (p.id || "").toLowerCase().includes(q) ||
      (p.role || "").toLowerCase().includes(q),
  );
});

const stats = computed(() => ({
  total: profiles.value.length,
  admins: profiles.value.filter((p) => p.role === "admin").length,
  users: profiles.value.filter((p) => p.role !== "admin").length,
}));

async function setRole(p, newRole) {
  if (p.id === user.value?.id && newRole !== "admin") {
    errorMsg.value = "You can't demote yourself.";
    return;
  }
  if (newRole !== "admin" && p.role === "admin") {
    confirmDemote.value = { profile: p, newRole };
    return;
  }
  await applyRole(p, newRole);
}

async function applyRole(p, newRole) {
  busyId.value = p.id;
  errorMsg.value = null;
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", p.id);
    if (error) throw error;
    p.role = newRole;
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    busyId.value = null;
    confirmDemote.value = null;
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
        <h1 class="page-title mb-1">👥 Users</h1>
        <p class="page-subtitle mb-0">
          Manage user roles. Admins can create and edit news articles.
        </p>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <button
          class="btn btn-outline-accent"
          @click="load"
          :disabled="loading"
        >
          ↻ Refresh
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
                <div class="btn-group btn-group-sm" role="group">
                  <button
                    v-if="p.role !== 'admin'"
                    type="button"
                    class="btn btn-outline-accent"
                    :disabled="!isAdmin || busyId === p.id"
                    @click="setRole(p, 'admin')"
                  >
                    <span
                      v-if="busyId === p.id"
                      class="spinner-border spinner-border-sm me-1"
                    />
                    ↑ Promote
                  </button>
                  <button
                    v-else
                    type="button"
                    class="btn btn-outline-accent"
                    :disabled="!isAdmin || busyId === p.id || p.id === user?.id"
                    :title="
                      p.id === user?.id
                        ? 'You cannot demote yourself'
                        : 'Demote to user'
                    "
                    @click="setRole(p, 'user')"
                  >
                    <span
                      v-if="busyId === p.id"
                      class="spinner-border spinner-border-sm me-1"
                    />
                    ↓ Demote
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Confirm demote -->
    <div
      v-if="confirmDemote"
      class="modal-backdrop-custom"
      role="dialog"
      @click.self="confirmDemote = null"
    >
      <div class="modal-card card-crypto p-4">
        <h5 class="mb-2">Demote {{ confirmDemote.profile.name }}?</h5>
        <p class="text-secondary small mb-3">
          This user will lose access to the admin area and won't be able to
          create or edit news articles.
        </p>
        <div class="d-flex justify-content-end gap-2">
          <button
            type="button"
            class="btn btn-outline-accent btn-sm"
            @click="confirmDemote = null"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-danger btn-sm"
            @click="applyRole(confirmDemote.profile, confirmDemote.newRole)"
          >
            Demote
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-avatar {
  width: 40px;
  height: 40px;
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
}

.role-badge {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
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
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  border-bottom: 1px solid var(--border-color);
  padding: 0.75rem 1rem;
}

.table-dark-custom tbody td {
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--border-color);
  vertical-align: middle;
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
