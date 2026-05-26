<script setup>
import { RouterLink } from "vue-router";
import ThemeToggle from "./ThemeToggle.vue";
import { useTheme } from "../composables/useTheme.js";
import { useAuth } from "../composables/useAuth.js";

const { isDark } = useTheme();
const { isLoggedIn, logout } = useAuth();

function onLogout() {
  logout();
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

      <div class="collapse navbar-collapse" id="mainNavbar">
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
            <li class="nav-item">
              <RouterLink class="nav-link" to="/profile" active-class="active"
                >Profile</RouterLink
              >
            </li>
            <li class="nav-item ms-lg-1">
              <button
                type="button"
                class="btn btn-sm btn-outline-accent px-4"
                @click="onLogout"
              >
                Logout
              </button>
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
