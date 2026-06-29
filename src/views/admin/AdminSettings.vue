<script setup>
/**
 * AdminSettings — quick settings panel
 *
 *  - DB connection status
 *  - RAG pipeline status (future-proof placeholder)
 *  - Editor preferences
 *  - Theme + cache utilities
 */

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

onMounted(() => {
  checkDb();
});

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
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
              Database
            </h6>
            <button class="btn btn-sm btn-outline-accent" @click="checkDb">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              Re-check
            </button>
          </div>

          <div class="bin-stats-compact mt-0">
            <div class="bin-stat">
              <span class="bin-stat-lbl">Connection</span>
              <span class="bin-stat-val">
                <span
                  class="badge"
                  :class="{
                    'bg-success-subtle text-success-emphasis':
                      dbStatus === 'ok',
                    'bg-warning-subtle text-warning-emphasis':
                      dbStatus === 'checking',
                    'bg-danger-subtle text-danger-emphasis':
                      dbStatus === 'error',
                  }"
                >
                  {{
                    dbStatus === "ok"
                      ? "✓ Online"
                      : dbStatus === "checking"
                        ? "Checking…"
                        : "✕ Error"
                  }}
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
              <span class="bin-stat-val">
                {{ lastCheck ? lastCheck.toLocaleTimeString() : "—" }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Account / role -->
      <div class="col-md-6">
        <div class="card-crypto p-3 p-md-4 h-100">
          <h6 class="text-emphasis mb-3 d-flex align-items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
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
                <span
                  v-if="profile?.role === 'admin'"
                  class="badge bg-warning-subtle text-warning-emphasis"
                  >★ Admin</span
                >
                <span v-else class="badge bg-secondary-subtle text-secondary">
                  User
                </span>
              </span>
            </div>
            <div class="bin-stat">
              <span class="bin-stat-lbl">Role check</span>
              <span class="bin-stat-val">
                <span
                  class="badge"
                  :class="
                    loading
                      ? 'bg-secondary-subtle text-secondary'
                      : 'bg-success-subtle text-success-emphasis'
                  "
                  >{{ loading ? "…" : "✓" }}</span
                >
              </span>
            </div>
          </div>
          <div class="mt-3">
            <button
              class="btn btn-sm btn-outline-accent"
              :disabled="loading"
              @click="refresh"
            >
              ↻ Refresh role
            </button>
          </div>
        </div>
      </div>

      <!-- Preferences -->
      <div class="col-md-6">
        <div class="card-crypto p-3 p-md-4 h-100">
          <h6 class="text-emphasis mb-3 d-flex align-items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Preferences
          </h6>

          <div class="form-check form-switch mb-3">
            <input
              id="themeToggle"
              class="form-check-input"
              type="checkbox"
              :checked="isDark"
              @change="toggle"
            />
            <label class="form-check-label" for="themeToggle">
              <strong>Dark theme</strong>
              <small class="d-block text-secondary">
                Off = use the light theme.
              </small>
            </label>
          </div>

          <hr class="border-color" />

          <h6 class="text-emphasis mb-2">🧹 Maintenance</h6>
          <p class="text-secondary small mb-2">
            Clear localStorage / sessionStorage. Useful after a schema change or
            theme switch issue.
          </p>
          <button class="btn btn-sm btn-outline-accent" @click="clearCache">
            Clear local cache
          </button>
        </div>
      </div>

      <!-- RAG / future -->
      <div class="col-12">
        <div class="card-crypto p-3 p-md-4">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="text-emphasis mb-0 d-flex align-items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/></svg>
              RAG pipeline
            </h6>
            <span class="badge bg-secondary-subtle text-secondary">
              Coming soon
            </span>
          </div>
          <p class="text-secondary small mb-0">
            Once the <code>news_embeddings</code> table is created (see bottom
            of <code>supabase/news_table.sql</code>), this panel will let admins
            trigger re-embedding, inspect chunk counts, and test Gemini-powered
            Q&A.
          </p>
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
