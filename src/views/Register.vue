<script>
import { useAuth } from "../composables/useAuth.js";

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
.is-valid {
  border-color: var(--positive) !important;
}

.is-invalid {
  border-color: var(--negative) !important;
}
</style>
