<script setup>
/**
 * AdminLayout — sidebar + topbar shell for /admin/* routes
 *
 *  - Collapsible sidebar (mobile-friendly)
 *  - Permission-gated (redirects non-admins)
 *  - User card + role badge in the sidebar footer
 */

import { ref, computed, onMounted } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { useAdmin } from "../../composables/useAdmin.js";
import { user, useAuth } from "../../composables/useAuth.js";
import { supabase } from "../../../supabase/supabase.js";

const route = useRoute();
const router = useRouter();
const { isAdmin, loading, profile, refresh } = useAdmin();
const { logout } = useAuth();

const sidebarOpen = ref(true);
const isMobile = ref(false);
const realtimeStatus = ref("disconnected");
let channel = null;

onMounted(async () => {
  isMobile.value = window.innerWidth < 992;
  sidebarOpen.value = !isMobile.value;
  // make sure role is fresh
  await refresh();

  // tiny realtime health indicator
  channel = supabase
    .channel("admin-health")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "news" },
      () => {
        realtimeStatus.value = "live";
      },
    )
    .subscribe((status) => {
      realtimeStatus.value =
        status === "SUBSCRIBED"
          ? "live"
          : status === "CONNECTING"
            ? "connecting"
            : "disconnected";
    });

  window.addEventListener("resize", handleResize);
});

function handleResize() {
  isMobile.value = window.innerWidth < 992;
  if (!isMobile.value) sidebarOpen.value = true;
}

const navItems = [
  { to: { name: "AdminDashboard" }, icon: "📊", label: "Dashboard" },
  { to: { name: "AdminNews" }, icon: "📰", label: "News CMS" },
  { to: { name: "AdminUsers" }, icon: "👥", label: "Users" },
  { to: { name: "AdminSettings" }, icon: "⚙️", label: "Settings" },
];

const isActive = (name) =>
  route.name === name || route.matched.some((r) => r.name === name);

function go(to) {
  router.push(to);
  if (isMobile.value) sidebarOpen.value = false;
}

function onLogout() {
  logout();
  router.push({ name: "Home" });
}

const pageTitle = computed(() => {
  const titles = {
    AdminDashboard: "Dashboard",
    AdminNews: "News CMS",
    AdminNewsEdit: "News editor",
    AdminUsers: "Users",
    AdminSettings: "Settings",
  };
  return titles[route.name] || "Admin";
});

const userName = computed(
  () => profile.value?.name || user.value?.name || "Admin",
);
const userEmail = computed(() => user.value?.email || "");
const userInitial = computed(() => (userName.value?.[0] || "A").toUpperCase());
</script>

<template>
  <!-- Permission gate -->
  <div v-if="loading" class="admin-loading">
    <div class="spinner-crypto"></div>
    <p class="mt-3 text-secondary">Checking permissions…</p>
  </div>

  <div v-else-if="!isAdmin" class="admin-locked">
    <div
      class="card-crypto p-4 text-center"
      style="max-width: 480px; margin: 80px auto"
    >
      <div style="font-size: 3rem">🔒</div>
      <h2 class="mt-3 mb-2">Admin access required</h2>
      <p class="text-secondary mb-3">
        You're signed in as <strong>{{ userEmail }}</strong> but your account is
        not flagged as <code>admin</code> in the <code>profiles</code> table.
      </p>
      <p class="text-secondary small mb-3">
        Run the SQL snippet at the bottom of
        <code>supabase/news_table.sql</code> to promote your account, then
        <button class="btn btn-link p-0 align-baseline" @click="refresh">
          click here to refresh</button
        >.
      </p>
      <RouterLink to="/" class="btn btn-outline-accent"
        >← Back to site</RouterLink
      >
    </div>
  </div>

  <div v-else class="admin-shell" :class="{ 'sidebar-closed': !sidebarOpen }">
    <!-- Sidebar -->
    <aside class="admin-sidebar">
      <div class="sidebar-head">
        <RouterLink
          to="/"
          class="sidebar-brand d-flex align-items-center gap-2"
        >
          <img src="/site-logo.png" alt="CryptoDash" width="28" height="28" />
          <span class="brand-text">Admin</span>
        </RouterLink>
        <button
          class="btn btn-sm btn-outline-accent sidebar-toggle d-lg-none"
          @click="sidebarOpen = !sidebarOpen"
          aria-label="Toggle sidebar"
        >
          ✕
        </button>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="item in navItems"
          :key="item.label"
          class="sidebar-link"
          :class="{ active: isActive(item.to.name) }"
          @click="go(item.to)"
        >
          <span class="sidebar-icon">{{ item.icon }}</span>
          <span class="sidebar-label">{{ item.label }}</span>
        </button>
      </nav>

      <div class="sidebar-foot">
        <div class="user-card d-flex align-items-center gap-2">
          <div class="user-avatar">{{ userInitial }}</div>
          <div class="min-w-0 flex-grow-1">
            <div class="text-emphasis fw-semibold text-truncate">
              {{ userName }}
            </div>
            <div class="text-secondary small text-truncate">
              {{ userEmail }}
            </div>
          </div>
        </div>
        <div class="d-flex gap-2 mt-2">
          <RouterLink to="/" class="btn btn-sm btn-outline-accent flex-grow-1">
            ↗ Site
          </RouterLink>
          <button
            class="btn btn-sm btn-outline-accent flex-grow-1"
            @click="onLogout"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>

    <!-- Backdrop for mobile -->
    <div
      v-if="sidebarOpen && isMobile"
      class="sidebar-backdrop d-lg-none"
      @click="sidebarOpen = false"
    />

    <!-- Main -->
    <main class="admin-main">
      <header class="admin-topbar">
        <button
          class="btn btn-sm btn-outline-accent d-lg-none"
          @click="sidebarOpen = !sidebarOpen"
          aria-label="Open menu"
        >
          ☰
        </button>
        <h1 class="topbar-title">{{ pageTitle }}</h1>
        <div class="topbar-right d-flex align-items-center gap-2">
          <span
            class="realtime-pill"
            :class="`rt-${realtimeStatus}`"
            :title="`Realtime: ${realtimeStatus}`"
          >
            <span class="rt-dot" />
            {{ realtimeStatus === "live" ? "Realtime live" : realtimeStatus }}
          </span>
          <RouterLink
            :to="{ name: 'AdminNewsEdit', params: { id: 'new' } }"
            class="btn btn-sm btn-accent"
          >
            + New article
          </RouterLink>
        </div>
      </header>

      <div class="admin-content">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  color: var(--text-secondary);
}

.admin-shell {
  display: flex;
  min-height: calc(100vh - 60px);
  background: var(--bg-primary);
}

.admin-sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
  transition: transform 0.25s ease;
  z-index: 900;
}

.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-brand .brand-text {
  font-weight: 700;
  color: var(--text-primary);
}

.sidebar-nav {
  flex: 1;
  padding: 0.6rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  overflow-y: auto;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  padding: 0.55rem 0.75rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 0.92rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sidebar-link:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}

.sidebar-link.active {
  background: rgba(240, 185, 11, 0.12);
  color: var(--accent);
  border-color: rgba(240, 185, 11, 0.3);
}

.sidebar-icon {
  font-size: 1.05rem;
}

.sidebar-foot {
  padding: 0.8rem;
  border-top: 1px solid var(--border-color);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #d9a60a);
  color: var(--accent-text);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 899;
}

.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.admin-topbar {
  position: sticky;
  top: 60px;
  z-index: 800;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.topbar-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-emphasis);
  margin: 0;
  flex: 1;
}

.topbar-right {
  white-space: nowrap;
}

.realtime-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  font-size: 0.7rem;
  color: var(--text-secondary);
  background: var(--bg-card);
  text-transform: capitalize;
}

.rt-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-tertiary);
}

.rt-live .rt-dot {
  background: var(--positive);
  box-shadow: 0 0 0 0 rgba(2, 192, 118, 0.5);
  animation: rtPulse 1.6s infinite;
}

.rt-connecting .rt-dot {
  background: var(--accent);
}
.rt-disconnected .rt-dot {
  background: var(--negative);
}

@keyframes rtPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(2, 192, 118, 0.5);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(2, 192, 118, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(2, 192, 118, 0);
  }
}

.admin-content {
  padding: 1.5rem 1.5rem 3rem;
}

.min-w-0 {
  min-width: 0;
}

/* Mobile */
@media (max-width: 991.98px) {
  .admin-sidebar {
    position: fixed;
    top: 60px;
    left: 0;
    transform: translateX(-100%);
  }
  .admin-shell:not(.sidebar-closed) .admin-sidebar {
    transform: translateX(0);
  }
  .admin-content {
    padding: 1rem 1rem 2rem;
  }
}

@media (min-width: 992px) {
  .sidebar-toggle {
    display: none !important;
  }
}
</style>
