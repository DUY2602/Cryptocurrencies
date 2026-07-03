<script>
import { useAuth } from "../../composables/useAuth.js";

export default {
  setup() {
    const { requestRegistration } = useAuth();
    return { requestRegistration };
  },
  data() {
    return {
      email: "",
      name: "",
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
    formValid() {
      return this.emailValid;
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
        const result = await this.requestRegistration(this.email, this.name);
        this.loading = false;

        if (result.success) {
          this.showMessage(result.message, "success");
          // Redirect after successful registration
          setTimeout(() => {
            this.$router.push("/login");
          }, 3000);
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
            <h1 class="page-title text-center mb-1">Register</h1>
            <p class="text-secondary text-center mb-4 small">
              Create your account with email verification
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
                <label for="regName" class="form-label">Name (optional)</label>
                <input
                  id="regName"
                  v-model="name"
                  type="text"
                  class="form-control"
                  placeholder="Your name"
                  autocomplete="name"
                  :disabled="loading"
                />
              </div>

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
                  :disabled="loading"
                />
                <div v-if="submitted && !emailValid" class="invalid-feedback">
                  Please enter a valid email address.
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
                {{ loading ? "Sending..." : "Send verification email" }}
              </button>

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
/* ── Auth Page Layout ─────────────────────────── */
.page-section {
  min-height: calc(100vh - 72px);
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}
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

/* ── Auth Card ────────────────────────────────── */
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

/* ── Form Controls ────────────────────────────── */
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

/* ── Alerts ───────────────────────────────────── */
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

/* ── Footer link ──────────────────────────────── */
a {
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s;
}
a:hover { opacity: 0.8; }
</style>
