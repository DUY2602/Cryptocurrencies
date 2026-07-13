<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter, RouterLink } from "vue-router";
import ThemeToggle from "../ui/ThemeToggle.vue";
import { useTheme } from "../../composables/useTheme.js";
import { useAuth } from "../../composables/useAuth.js";
import { useAdmin } from "../../composables/useAdmin.js";
import { supabase } from "../../../supabase/supabase.js";
import { Collapse } from "bootstrap";
import { Star, ChevronDown, User, LogOut } from "@lucide/vue";

const { isDark } = useTheme();
const { isLoggedIn, logout, user } = useAuth();
const { isAdmin, profile, refresh } = useAdmin();
const router = useRouter();

const showAdminMenu = ref(false);
const navbarCollapse = ref(null);
const isScrolled = ref(false);
let bsCollapse = null;

function handleScroll() {
  const scrolled = window.scrollY > 20;
  if (scrolled !== isScrolled.value) {
    isScrolled.value = scrolled;
  }
}

onMounted(() => {
  window.addEventListener("scroll", handleScroll, { passive: true });
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
  window.removeEventListener("scroll", handleScroll);
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
    :class="[isDark ? 'navbar-dark' : 'navbar-light', { 'navbar-scrolled': isScrolled }]"
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
                <span class="admin-badge"><Star :size="12" class="me-1" /></span> Admin
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
                <span class="dropdown-caret"><ChevronDown :size="14" /></span>
              </button>
              <div v-if="showAdminMenu" class="user-menu">
                <RouterLink
                  to="/profile"
                  class="user-menu-item"
                  @click="showAdminMenu = false"
                >
                  <User :size="14" /> Profile
                </RouterLink>
                <RouterLink
                  v-if="isAdmin"
                  to="/admin"
                  class="user-menu-item"
                  @click="showAdminMenu = false"
                >
                  <Star :size="14" /> Admin dashboard
                </RouterLink>
                <button class="user-menu-item text-danger" @click="onLogout">
                  <LogOut :size="14" /> Logout
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
.crypto-navbar .nav-link {
  color: var(--nav-text) !important;
  position: relative;
  padding: 0.5rem 1rem !important;
  transition: all var(--transition-fast);
}

.crypto-navbar .nav-link:hover {
  color: var(--accent) !important;
  background: rgba(255, 255, 255, 0.05);
  text-shadow: 0 0 10px var(--accent);
}

.crypto-navbar .nav-link::after {
  content: '';
  position: absolute;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 16px;
  height: 2px;
  background: var(--accent);
  border-radius: 99px;
  box-shadow: 0 0 10px var(--accent);
  transition: transform var(--transition-fast);
}

.crypto-navbar .nav-link.active::after,
.crypto-navbar .nav-link:hover::after {
  transform: translateX(-50%) scaleX(1);
  box-shadow: 0 0 15px var(--accent);
}

.crypto-navbar .nav-link.active {
  color: var(--accent) !important;
  font-weight: 600;
}

.crypto-navbar .admin-link {
  color: var(--accent);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  transition: color var(--transition-fast);
}

.crypto-navbar .admin-link:hover { 
  color: var(--accent-hover);
  text-shadow: 0 0 10px var(--accent-hover);
}

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
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.crypto-navbar .user-menu-toggle:hover {
  background: var(--bg-card-hover);
  border-color: var(--accent);
  box-shadow: 0 0 12px rgba(239, 177, 22, 0.751);
}

.crypto-navbar .user-avatar-mini {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent) 0%, #f59e0b 100%);
  color: var(--accent-text);
  font-size: 0.75rem;
  font-weight: 700;
}

.crypto-navbar .dropdown-caret {
  font-size: 0.7rem;
  color: var(--text-secondary);
  transition: transform var(--transition-fast);
}

.crypto-navbar .user-menu-toggle[aria-expanded="true"] .dropdown-caret {
  transform: rotate(180deg);
}

.user-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  min-width: 200px;
  background: var(--panel-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow);
  padding: 0.5rem;
  z-index: 1080;
  animation: fade-slide-up 0.2s ease-out;
}

@keyframes fade-slide-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.user-menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all var(--transition-fast);
}

.user-menu-item:hover {
  background: var(--bg-card-hover);
  color: var(--accent);
}

.user-menu-item.text-danger { color: var(--negative); }
.user-menu-item.text-danger:hover {
  background: rgba(244, 63, 94, 0.1);
  color: var(--negative);
}

.nav-item.dropdown { position: relative; }
</style>
