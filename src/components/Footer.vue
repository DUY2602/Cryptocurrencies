<template>
  <footer class="crypto-footer mt-auto">
    <div class="container py-4">
      <div class="row align-items-center gy-3">
        <div class="col-md-6 text-center text-md-start">
          <p class="mb-0 footer-brand">
            <span class="brand-icon-sm">₿</span> CryptoDash
          </p>
          <small class="text-secondary">
            COS30043 – Interface Design and Development · Swinburne University
          </small>
        </div>
        <div class="col-md-6 text-center text-md-end">
          <small class="text-secondary">
            &copy; {{ currentYear }} CryptoDash. Stage 1 foundation build.
          </small>
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

<style scoped>
.crypto-footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.footer-brand {
  font-weight: 600;
  color: var(--text-primary);
}

.brand-icon-sm {
  color: var(--accent);
  margin-right: 0.25rem;
}
</style>
