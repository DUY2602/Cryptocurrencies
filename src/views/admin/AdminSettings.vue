<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../../../supabase/supabase.js";
import { useTheme } from "../../composables/useTheme.js";
import { useAdmin } from "../../composables/useAdmin.js";

const { isDark, toggle } = useTheme();
const { profile, refresh, loading } = useAdmin();

const dbStatus = ref("checking");
const newsCount = ref(null);
const profilesCount = ref(null);
const lastCheck = ref(null);

async function checkDb() {
  dbStatus.value = "checking";
  try {
    const [newsRes, profilesRes] = await Promise.all([
      supabase.from("news").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    if (newsRes.error) throw newsRes.error;
    if (profilesRes.error) throw profilesRes.error;
    newsCount.value = newsRes.count;
    profilesCount.value = profilesRes.count;
    dbStatus.value = "ok";
  } catch (e) {
    dbStatus.value = "error";
    console.warn("DB check failed:", e.message);
  } finally {
    lastCheck.value = new Date();
  }
}

onMounted(checkDb);

function clearCache() {
  try {
    localStorage.clear();
    sessionStorage.clear();
    alert("Local cache cleared. The page will reload.");
    window.location.reload();
  } catch (e) {
    alert("Could not clear cache: " + e.message);
  }
}
</script>

<template>
  <div class="admin-settings">
    <header class="mb-4">
      <h1 class="page-title mb-1 d-flex align-items-center gap-2">
        <Settings :size="22" />
        Settings
      </h1>
      <p class="page-subtitle mb-0">System status and preferences.</p>
    </header>

    <div class="row g-3">
      <!-- DB status -->
      <div class="col-md-6">
        <div class="card-crypto p-3 p-md-4 h-100">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="text-emphasis mb-0 d-flex align-items-center gap-2">
              <Database :size="16" />
              Database
            </h6>
            <button class="btn btn-sm btn-outline-accent" @click="checkDb">
              <RefreshCw :size="14" />
              Re-check
            </button>
          </div>
          <div class="bin-stats-compact mt-0">
            <div class="bin-stat">
              <span class="bin-stat-lbl">Connection</span>
              <span class="bin-stat-val">
                <span class="badge" :class="{
                  'bg-success-subtle text-success-emphasis': dbStatus === 'ok',
                  'bg-warning-subtle text-warning-emphasis': dbStatus === 'checking',
                  'bg-danger-subtle text-danger-emphasis': dbStatus === 'error',
                }">
                  <span v-if="dbStatus === 'ok'"><Check :size="14" /> Online</span>
                  <span v-else-if="dbStatus === 'checking'">Checking…</span>
                  <span v-else><X :size="16" /> Error</span>
                </span>
              </span>
            </div>
            <div class="bin-stat">
              <span class="bin-stat-lbl">News articles</span>
              <span class="bin-stat-val">{{ newsCount ?? "—" }}</span>
            </div>
            <div class="bin-stat">
              <span class="bin-stat-lbl">Profiles</span>
              <span class="bin-stat-val">{{ profilesCount ?? "—" }}</span>
            </div>
            <div class="bin-stat">
              <span class="bin-stat-lbl">Last check</span>
              <span class="bin-stat-val">{{ lastCheck ? lastCheck.toLocaleTimeString() : "—" }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Account / role -->
      <div class="col-md-6">
        <div class="card-crypto p-3 p-md-4 h-100">
          <h6 class="text-emphasis mb-3 d-flex align-items-center gap-2">
            <Users :size="16" />
            Your account
          </h6>
          <div class="bin-stats-compact mt-0">
            <div class="bin-stat">
              <span class="bin-stat-lbl">Name</span>
              <span class="bin-stat-val">{{ profile?.name || "—" }}</span>
            </div>
            <div class="bin-stat">
              <span class="bin-stat-lbl">Role</span>
              <span class="bin-stat-val">
                <span v-if="profile?.role === 'admin'" class="badge bg-warning-subtle text-warning-emphasis">
                  <Star :size="12" class="me-1" />Admin
                </span>
                <span v-else class="badge bg-secondary-subtle text-secondary">User</span>
              </span>
            </div>
            <div class="bin-stat">
              <span class="bin-stat-lbl">Role check</span>
              <span class="bin-stat-val">
                <span class="badge" :class="loading ? 'bg-secondary-subtle text-secondary' : 'bg-success-subtle text-success-emphasis'">
                  {{ loading ? "…" : "" }}<span v-if="!loading"><Check :size="14" /></span>
                </span>
              </span>
            </div>
          </div>
          <div class="mt-3">
            <button class="btn btn-sm btn-outline-accent" :disabled="loading" @click="refresh">
              <RefreshCw :size="14" /> Refresh role
            </button>
          </div>
        </div>
      </div>

      <!-- Preferences -->
      <div class="col-md-6">
        <div class="card-crypto p-3 p-md-4 h-100">
          <h6 class="text-emphasis mb-3 d-flex align-items-center gap-2">
            <Settings :size="16" />
            Preferences
          </h6>
          <div class="form-check form-switch mb-3">
            <input id="themeToggle" class="form-check-input" type="checkbox" :checked="isDark" @change="toggle" />
            <label class="form-check-label" for="themeToggle">
              <strong>Dark theme</strong>
              <small class="d-block text-secondary">Off = use the light theme.</small>
            </label>
          </div>
          <hr class="border-color" />
          <h6 class="text-emphasis mb-2"><Wrench :size="16" /> Maintenance</h6>
          <p class="text-secondary small mb-2">
            Clear localStorage / sessionStorage. Useful after a schema change or theme switch issue.
          </p>
          <button class="btn btn-sm btn-outline-accent" @click="clearCache">Clear local cache</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.border-color {
  border-color: var(--border-color) !important;
  opacity: 0.6;
}
</style>
