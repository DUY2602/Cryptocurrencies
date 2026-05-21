<script>
export default {
  data() {
    return {
      email: '',
      password: '',
      confirmPassword: '',
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
    confirmValid() {
      if (!this.submitted && !this.confirmPassword) return null
      return this.password === this.confirmPassword && this.confirmPassword.length > 0
    },
    formValid() {
      return this.emailValid && this.passwordValid && this.confirmValid
    },
  },
  methods: {
    onSubmit(event) {
      event.preventDefault()
      this.submitted = true
      if (this.formValid) {
        alert('Registration UI only — backend authentication will be added in a later stage.')
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
            <h1 class="page-title text-center mb-1">Register</h1>
            <p class="text-secondary text-center mb-4 small">Create your account (UI preview)</p>

            <form novalidate @submit="onSubmit">
              <div class="mb-3">
                <label for="regEmail" class="form-label">Email address</label>
                <input
                  id="regEmail"
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

              <div class="mb-3">
                <label for="regPassword" class="form-label">Password</label>
                <input
                  id="regPassword"
                  v-model="password"
                  type="password"
                  class="form-control"
                  :class="{
                    'is-valid': submitted && passwordValid,
                    'is-invalid': submitted && !passwordValid,
                  }"
                  placeholder="At least 6 characters"
                  autocomplete="new-password"
                />
                <div v-if="submitted && !passwordValid" class="invalid-feedback">
                  Password must be at least 6 characters.
                </div>
              </div>

              <div class="mb-4">
                <label for="regConfirm" class="form-label">Confirm password</label>
                <input
                  id="regConfirm"
                  v-model="confirmPassword"
                  type="password"
                  class="form-control"
                  :class="{
                    'is-valid': submitted && confirmValid,
                    'is-invalid': submitted && !confirmValid,
                  }"
                  placeholder="Re-enter password"
                  autocomplete="new-password"
                />
                <div v-if="submitted && !confirmValid" class="invalid-feedback">
                  Passwords must match.
                </div>
              </div>

              <button type="submit" class="btn btn-accent w-100 mb-3">Create account</button>

              <p class="text-center text-secondary small mb-0">
                Already have an account?
                <RouterLink to="/login">Login</RouterLink>
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
