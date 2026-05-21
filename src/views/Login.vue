<script>
export default {
  data() {
    return {
      email: '',
      password: '',
      submitted: false,
    }
  },
  computed: {
    emailValid() {
      if (!this.submitted && !this.email) return null
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)
    },
    passwordValid() {
      if (!this.submitted && !this.password) return null
      return this.password.length >= 6
    },
    formValid() {
      return this.emailValid && this.passwordValid
    },
  },
  methods: {
    onSubmit(event) {
      event.preventDefault()
      this.submitted = true
      if (this.formValid) {
        alert('Login UI only — backend authentication will be added in a later stage.')
      }
    },
  },
}
</script>

<template>
  <section class="page-section">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-5">
          <div class="card card-crypto p-4 p-md-5">
            <h1 class="page-title text-center mb-1">Login</h1>
            <p class="text-secondary text-center mb-4 small">Frontend form only — no backend yet</p>

            <form novalidate @submit="onSubmit">
              <div class="mb-3">
                <label for="loginEmail" class="form-label">Email address</label>
                <input
                  id="loginEmail"
                  v-model="email"
                  type="email"
                  class="form-control"
                  :class="{
                    'is-valid': submitted && emailValid,
                    'is-invalid': submitted && !emailValid,
                  }"
                  placeholder="you@example.com"
                  autocomplete="email"
                />
                <div v-if="submitted && !emailValid" class="invalid-feedback">
                  Please enter a valid email address.
                </div>
              </div>

              <div class="mb-4">
                <label for="loginPassword" class="form-label">Password</label>
                <input
                  id="loginPassword"
                  v-model="password"
                  type="password"
                  class="form-control"
                  :class="{
                    'is-valid': submitted && passwordValid,
                    'is-invalid': submitted && !passwordValid,
                  }"
                  placeholder="At least 6 characters"
                  autocomplete="current-password"
                />
                <div v-if="submitted && !passwordValid" class="invalid-feedback">
                  Password must be at least 6 characters.
                </div>
              </div>

              <button type="submit" class="btn btn-accent w-100 mb-3">Sign in</button>

              <p class="text-center text-secondary small mb-0">
                Don't have an account?
                <RouterLink to="/register">Register</RouterLink>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.is-valid {
  border-color: var(--positive) !important;
}

.is-invalid {
  border-color: var(--negative) !important;
}
</style>
