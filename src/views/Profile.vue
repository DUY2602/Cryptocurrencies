<script setup>
import { useAuth } from '../composables/useAuth.js'
import { useRouter } from 'vue-router'

const { user, logout } = useAuth()
const router = useRouter()

function handleLogout() {
  logout()
  router.push('/')
}
</script>

<template>
  <section class="page-section">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card card-crypto p-4">
            <h1 class="page-title h4">Profile</h1>
            <p class="text-secondary">Signed in (demo — no real backend).</p>
            <p class="mb-1"><strong>Email:</strong> {{ user?.email }}</p>
            <p class="mb-4"><strong>Name:</strong> {{ user?.name }}</p>
            <div class="d-flex gap-2 flex-wrap">
              <RouterLink to="/watchlist" class="btn btn-accent btn-sm">Watchlist</RouterLink>
              <button type="button" class="btn btn-outline-accent btn-sm" @click="handleLogout">Logout</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
