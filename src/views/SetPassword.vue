<script>
import { useAuth } from '../composables/useAuth.js'

export default {
  setup() {
    const { setPassword } = useAuth()
    return { setPassword }
  },
  data() {
    return {
      password: '',
      confirmPassword: '',
      submitted: false,
      loading: false,
      message: '',
      messageType: '', // 'success' or 'error'
    }
  },
  computed: {
    passwordValid() {
      if (!this.submitted && !this.password) return null
      return this.password.length >= 6
    },
    confirmValid() {
      if (!this.submitted && !this.confirmPassword) return null
      return (
        this.password === this.confirmPassword &&
        this.confirmPassword.length > 0
      )
    },
    formValid() {
      return this.passwordValid && this.confirmValid
    },
  },
  methods: {
    showMessage(msg, type = 'success') {
      this.message = msg
      this.messageType = type
      setTimeout(() => {
        this.message = ''
      }, 5000)
    },

    async onSubmit(event) {
      event.preventDefault()
      this.submitted = true
      if (this.formValid) {
        this.loading = true
        const result = await this.setPassword(this.password)
        this.loading = false

        if (result.success) {
          this.showMessage(result.message, 'success')
          // Redirect after successful password set
          setTimeout(() => {
            this.$router.push('/')
          }, 2000)
        } else {
          this.showMessage(result.message, 'error')
        }
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
            <h1 class="page-title text-center mb-1">Set Password</h1>
            <p class="text-secondary text-center mb-4 small">
              Your email has been verified. Set your password to complete registration.
            </p>

            <!-- Alert message -->
            <div
              v-if="message"
              :class="`alert alert-${messageType === 'error' ? 'danger' : 'success'} mb-4`"
              role="alert"
            >
              {{ message }}
            </div>

            <form novalidate @submit="onSubmit">
              <div class="mb-3">
                <label for="setPassword" class="form-label">Password</label>
                <input
                  id="setPassword"
                  v-model="password"
                  type="password"
                  class="form-control"
                  :class="{
                    'is-valid': submitted && passwordValid,
                    'is-invalid': submitted && !passwordValid,
                  }"
                  placeholder="At least 6 characters"
                  autocomplete="new-password"
                  :disabled="loading"
                />
                <div
                  v-if="submitted && !passwordValid"
                  class="invalid-feedback"
                >
                  Password must be at least 6 characters.
                </div>
              </div>

              <div class="mb-4">
                <label for="setConfirm" class="form-label">Confirm password</label>
                <input
                  id="setConfirm"
                  v-model="confirmPassword"
                  type="password"
                  class="form-control"
                  :class="{
                    'is-valid': submitted && confirmValid,
                    'is-invalid': submitted && !confirmValid,
                  }"
                  placeholder="Re-enter password"
                  autocomplete="new-password"
                  :disabled="loading"
                />
                <div v-if="submitted && !confirmValid" class="invalid-feedback">
                  Passwords must match.
                </div>
              </div>

              <button
                type="submit"
                class="btn btn-accent w-100 mb-3"
                :disabled="loading"
              >
                <span
                  v-if="loading"
                  class="spinner-border spinner-border-sm me-2"
                ></span>
                {{ loading ? 'Setting...' : 'Set password' }}
              </button>
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
