<template>
  <footer class="crypto-footer mt-auto">
    <div class="container py-4">
      <div class="row align-items-center gy-3">
        <div class="col-md-6 text-center text-md-start">
          <p class="mb-0 footer-brand">
            <img src="/site-logo.png" alt="" width="20" height="20" class="me-1 align-text-bottom" />
            CryptoDash
          </p>
          <small class="text-secondary">COS30043 · Swinburne University</small>
        </div>
        <div class="col-md-6 text-center text-md-end">
          <small class="text-secondary">&copy; {{ currentYear }} CryptoDash</small>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  computed: {
    currentYear() {
      return new Date().getFullYear()
    },
  },
}
</script>
