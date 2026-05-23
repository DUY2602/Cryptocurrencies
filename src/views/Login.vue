<script>
import { useAuth } from "../composables/useAuth.js";

export default {
  setup() {
    const { login, logout } = useAuth();
    return { login, logout };
  },
  data() {
    return {
      email: "",
      password: "",
      submitted: false,
      loading: false,
      message: "",
      messageType: "", // 'success' or 'error'
    };
  },
  computed: {
    emailValid() {
      if (!this.submitted && !this.email) return null;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
    },
    passwordValid() {
      if (!this.submitted && !this.password) return null;
      return this.password.length >= 1;
    },
    formValid() {
      return this.emailValid && this.passwordValid;
    },
  },
  methods: {
    showMessage(msg, type = "success") {
      this.message = msg;
      this.messageType = type;
      setTimeout(() => {
        this.message = "";
      }, 5000);
    },

    async onSubmit(event) {
      event.preventDefault();
      this.submitted = true;
      if (this.formValid) {
        this.loading = true;
        const result = await this.login(this.email, this.password);
        this.loading = false;

        if (result.success) {
          this.showMessage(result.message, "success");
          const redirect = this.$route.query.redirect || "/";
          setTimeout(() => {
            this.$router.push(redirect);
          }, 500);
        } else {
          this.showMessage(result.message, "error");
        }
      }
    },
  },
};
</script>

<template>
  <section class="page-section">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-5">
          <div class="card card-crypto p-4 p-md-5">
            <h1 class="page-title text-center mb-1">Login</h1>
            <p class="text-secondary text-center mb-4 small">
              Sign in to your account
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
                  :disabled="loading"
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
                  placeholder="Your password"
                  autocomplete="current-password"
                  :disabled="loading"
                />
                <div
                  v-if="submitted && !passwordValid"
                  class="invalid-feedback"
                >
                  Please enter your password.
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
                {{ loading ? "Signing in..." : "Sign in" }}
              </button>

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
