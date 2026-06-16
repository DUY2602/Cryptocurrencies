<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter, RouterLink } from "vue-router";
import ThemeToggle from "./ThemeToggle.vue";
import { useTheme } from "../composables/useTheme.js";
import { useAuth } from "../composables/useAuth.js";
import { useAdmin } from "../composables/useAdmin.js";
import { supabase } from "../../supabase/supabase.js";
import { Collapse } from "bootstrap";

const { isDark } = useTheme();
const { isLoggedIn, logout, user } = useAuth();
const { isAdmin, profile, refresh } = useAdmin();
const router = useRouter();

const showAdminMenu = ref(false);
const navbarCollapse = ref(null);
let bsCollapse = null;

onMounted(() => {
  if (navbarCollapse.value) {
    bsCollapse = new Collapse(navbarCollapse.value, { toggle: false });
  }
  refresh();
  supabase.auth.onAuthStateChange((_e, session) => {
    if (session?.user) refresh();
  });
  document.addEventListener("click", onDocClick);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
  if (bsCollapse) bsCollapse.dispose();
});

function closeNav() {
  if (bsCollapse) bsCollapse.hide();
}

router.afterEach(() => closeNav());

const userName = computed(
  () => profile.value?.name || user.value?.name || user.value?.email?.split("@")[0] || "Account"
);

function onLogout() {
  logout();
  showAdminMenu.value = false;
}

function onDocClick(e) {
  if (!e.target.closest(".user-menu-toggle, .user-menu")) {
    showAdminMenu.value = false;
  }
}
</script>

<template>
  <nav
    class="navbar navbar-expand-lg crypto-navbar sticky-top shadow-sm"
    :class="isDark ? 'navbar-dark' : 'navbar-light'"
  >
    <div class="container">
      <RouterLink class="navbar-brand d-flex align-items-center gap-2" to="/">
        <img
          src="/site-logo.png"
          alt="CryptoDash"
          class="site-logo"
          width="32"
          height="32"
        />
        <span class="brand-text">CryptoDash</span>
      </RouterLink>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNavbar"
        aria-controls="mainNavbar"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div ref="navbarCollapse" class="collapse navbar-collapse" id="mainNavbar">
        <ul
          class="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center gap-lg-2"
        >
          <li class="nav-item">
            <RouterLink class="nav-link" to="/" active-class="active"
              >Home</RouterLink
            >
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/markets" active-class="active"
              >Markets</RouterLink
            >
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/news" active-class="active"
              >News</RouterLink
            >
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/about" active-class="active"
              >About</RouterLink
            >
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/watchlist" active-class="active"
              >Watchlist</RouterLink
            >
          </li>
          <li class="nav-item d-flex align-items-center my-2 my-lg-0">
            <ThemeToggle />
          </li>

          <template v-if="isLoggedIn">
            <li v-if="isAdmin" class="nav-item">
              <RouterLink
                class="nav-link admin-link"
                to="/admin"
                active-class="active"
                title="Admin area"
              >
                <span class="admin-badge">★</span> Admin
              </RouterLink>
            </li>
            <li class="nav-item dropdown">
              <button
                class="nav-link user-menu-toggle"
                type="button"
                @click="showAdminMenu = !showAdminMenu"
                :aria-expanded="showAdminMenu"
              >
                <span class="user-avatar-mini">
                  {{ (userName[0] || "A").toUpperCase() }}
                </span>
                <span class="d-none d-lg-inline ms-1">{{ userName }}</span>
                <span class="dropdown-caret">▾</span>
              </button>
              <div v-if="showAdminMenu" class="user-menu">
                <RouterLink
                  to="/profile"
                  class="user-menu-item"
                  @click="showAdminMenu = false"
                >
                  👤 Profile
                </RouterLink>
                <RouterLink
                  v-if="isAdmin"
                  to="/admin"
                  class="user-menu-item"
                  @click="showAdminMenu = false"
                >
                  ★ Admin dashboard
                </RouterLink>
                <button class="user-menu-item text-danger" @click="onLogout">
                  ⤴ Logout
                </button>
              </div>
            </li>
          </template>
          <li v-else class="nav-item ms-lg-2">
            <RouterLink class="btn btn-sm btn-accent px-4" to="/login"
              >Login</RouterLink
            >
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.crypto-navbar .admin-link {
  color: var(--accent) !important;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.crypto-navbar .admin-link:hover { color: var(--accent-hover) !important; }

.crypto-navbar .admin-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: var(--accent);
  color: var(--accent-text);
  font-size: 0.7rem;
  font-weight: 700;
}

.crypto-navbar .user-menu-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  padding: 0.25rem 0.7rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.crypto-navbar .user-menu-toggle:hover {
  background: var(--bg-card-hover);
  border-color: var(--accent);
}

.crypto-navbar .user-avatar-mini {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #d9a60a);
  color: var(--accent-text);
  font-size: 0.78rem;
  font-weight: 700;
}

.crypto-navbar .dropdown-caret {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.user-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  min-width: 200px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  padding: 0.4rem;
  z-index: 1080;
}

.user-menu-item {
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: 0.55rem 0.7rem;
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s ease;
}

.user-menu-item:hover {
  background: var(--bg-card-hover);
  color: var(--accent);
}

.user-menu-item.text-danger { color: var(--negative) !important; }
.user-menu-item.text-danger:hover {
  background: rgba(246, 70, 93, 0.1);
  color: var(--negative) !important;
}

.nav-item.dropdown { position: relative; }
</style>
