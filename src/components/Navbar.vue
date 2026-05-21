<script setup>
import { RouterLink } from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'
import { useTheme } from '../composables/useTheme.js'

const { isDark } = useTheme()
</script>

<template>
  <nav
    class="navbar navbar-expand-lg crypto-navbar sticky-top"
    :class="isDark ? 'navbar-dark' : 'navbar-light'"
  >
    <div class="container">
      <RouterLink class="navbar-brand d-flex align-items-center gap-2" to="/">
        <img
          src="/site-logo.png"
          alt="CryptoDash"
          class="site-logo"
          width="36"
          height="36"
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

      <div class="collapse navbar-collapse" id="mainNavbar">
        <ul class="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center gap-lg-1">
          <li class="nav-item">
            <RouterLink class="nav-link" to="/" active-class="active">Home</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/markets" active-class="active">Markets</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/news" active-class="active">News</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/about" active-class="active">About</RouterLink>
          </li>
          <li class="nav-item d-flex align-items-center my-2 my-lg-0">
            <ThemeToggle />
          </li>
          <li class="nav-item ms-lg-2">
            <RouterLink class="btn btn-sm btn-accent px-3" to="/login">Login</RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.crypto-navbar {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 0.75rem 0;
}

.site-logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
  flex-shrink: 0;
}

.brand-text {
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--text-primary);
}

.navbar-brand:hover .brand-text {
  color: var(--accent);
}

.nav-link {
  color: var(--text-secondary) !important;
  font-weight: 500;
  padding: 0.5rem 0.85rem !important;
  border-radius: 6px;
  transition: color 0.2s, background 0.2s;
}

.nav-link:hover,
.nav-link.active {
  color: var(--accent) !important;
}

.navbar-toggler {
  border-color: var(--border-color);
}

.navbar-toggler:focus {
  box-shadow: 0 0 0 0.2rem rgba(240, 185, 11, 0.25);
}

.navbar-toggler-icon {
  filter: var(--navbar-toggler-filter);
}
</style>
