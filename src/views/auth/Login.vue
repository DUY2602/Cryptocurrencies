<script>
import { useAuth } from "../../composables/useAuth.js";

export default {
  setup() {
    const { login, logout } = useAuth();
    return { login, logout };
  },
  data() {
    return {
      email: "",
      password: "",
      showPassword: false,
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
                <div class="input-group">
                  <input
                    id="loginPassword"
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    class="form-control"
                    :class="{
                      'is-valid': submitted && passwordValid,
                      'is-invalid': submitted && !passwordValid,
                    }"
                    placeholder="Your password"
                    autocomplete="current-password"
                    :disabled="loading"
                  />
                  <button
                    type="button"
                    class="btn btn-outline-accent"
                    @click="showPassword = !showPassword"
                    :disabled="loading"
                    tabindex="-1"
                  >
                    <EyeOff :size="16" v-if="showPassword" /><Eye :size="16" v-else />
                  </button>
                </div>
                <div
                  v-if="submitted && !passwordValid"
                  class="invalid-feedback d-block"
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
<style scoped>
/* Auth Page Layout */
.page-section {
  min-height: calc(100vh - 72px);
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}

/* Floating glow mesh behind the card */
.page-section::before {
  content: '';
  position: absolute;
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(255,200,55,0.06) 0%, transparent 70%);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  border-radius: 50%;
  animation: pulse-auth 6s ease-in-out infinite;
}
@keyframes pulse-auth {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
}

/* Auth Card */
.card.card-crypto {
  border-top: 2px solid var(--accent) !important;
  box-shadow: 0 0 40px rgba(255,200,55,0.07), 0 24px 64px rgba(0,0,0,0.45) !important;
}

.page-title {
  background: linear-gradient(135deg, var(--accent) 0%, #ffe97a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 28px;
}

/* Form Controls */
.form-label {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.form-control {
  background: var(--form-bg) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-primary) !important;
  border-radius: 10px !important;
  padding: 12px 16px !important;
  font-size: 15px;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
}
.form-control::placeholder { color: var(--text-tertiary); opacity: 0.8; }
.form-control:focus {
  border-color: var(--accent) !important;
  box-shadow: 0 0 0 3px rgba(255,200,55,0.15) !important;
  background: var(--form-bg-focus) !important;
  outline: none;
}

.is-valid {
  border-color: var(--positive) !important;
  box-shadow: 0 0 0 3px rgba(16,185,129,0.12) !important;
}
.is-invalid {
  border-color: var(--negative) !important;
  box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important;
}
.invalid-feedback { font-size: 12px; color: var(--negative); margin-top: 6px; }

/* Password toggle btn */
.input-group .btn.btn-outline-accent {
  border-radius: 0 10px 10px 0 !important;
  padding: 0 14px;
  border-left: none;
}

/* Alerts */
.alert-success {
  background: var(--positive-bg);
  border: 1px solid rgba(16,185,129,0.3);
  color: var(--positive);
  border-radius: 10px;
  font-size: 14px;
}
.alert-danger {
  background: var(--negative-bg);
  border: 1px solid rgba(220,38,38,0.3);
  color: var(--negative);
  border-radius: 10px;
  font-size: 14px;
}

/* Footer link */
a {
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s;
}
a:hover { opacity: 0.8; }
</style>
