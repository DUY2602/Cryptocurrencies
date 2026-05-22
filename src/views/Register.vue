<script>
import { useAuth } from "../composables/useAuth.js";

export default {
  setup() {
    const { register, requestOtp, verifyOtp, resendOtp } = useAuth();
    return { register, requestOtp, verifyOtp, resendOtp };
  },
  data() {
    return {
      step: 1, // 1: email, 2: otp, 3: password
      email: "",
      otp: "",
      password: "",
      confirmPassword: "",
      submitted: false,
      loading: false,
      message: "",
      messageType: "", // 'success' or 'error'
      otpResendTimer: 0,
      otpResendInterval: null,
    };
  },
  computed: {
    emailValid() {
      if (!this.submitted && !this.email) return null;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
    },
    otpValid() {
      if (!this.submitted && !this.otp) return null;
      return /^\d{6}$/.test(this.otp);
    },
    passwordValid() {
      if (!this.submitted && !this.password) return null;
      return this.password.length >= 6;
    },
    confirmValid() {
      if (!this.submitted && !this.confirmPassword) return null;
      return (
        this.password === this.confirmPassword &&
        this.confirmPassword.length > 0
      );
    },
    step1Valid() {
      return this.emailValid;
    },
    step2Valid() {
      return this.otpValid;
    },
    step3Valid() {
      return this.passwordValid && this.confirmValid;
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

    async onStep1Submit(event) {
      event.preventDefault();
      this.submitted = true;
      if (this.step1Valid) {
        this.loading = true;
        const result = await this.requestOtp(this.email);
        this.loading = false;

        if (result.success) {
          this.showMessage(result.message, "success");
          this.step = 2;
          this.startOtpResendTimer();
          this.submitted = false;
        } else {
          this.showMessage(result.message, "error");
        }
      }
    },

    async onStep2Submit(event) {
      event.preventDefault();
      this.submitted = true;
      if (this.step2Valid) {
        this.loading = true;
        const result = await this.verifyOtp(this.email, this.otp);
        this.loading = false;

        if (result.valid) {
          this.showMessage(result.message, "success");
          this.step = 3;
          this.submitted = false;
          this.clearOtpResendTimer();
        } else {
          this.showMessage(result.message, "error");
        }
      }
    },

    async onStep3Submit(event) {
      event.preventDefault();
      this.submitted = true;
      if (this.step3Valid) {
        this.loading = true;
        const result = await this.register(this.email, this.password);
        this.loading = false;

        if (result.success) {
          this.showMessage(result.message, "success");
          this.$router.push("/");
        } else {
          this.showMessage(result.message, "error");
        }
      }
    },

    async onResendOtp() {
      if (this.otpResendTimer > 0) return;

      this.loading = true;
      const result = await this.resendOtp(this.email);
      this.loading = false;

      if (result.success) {
        this.showMessage(result.message, "success");
        this.startOtpResendTimer();
      } else {
        this.showMessage(result.message, "error");
      }
    },

    startOtpResendTimer() {
      this.otpResendTimer = 60;
      this.clearOtpResendTimer();
      this.otpResendInterval = setInterval(() => {
        this.otpResendTimer--;
        if (this.otpResendTimer <= 0) {
          this.clearOtpResendTimer();
        }
      }, 1000);
    },

    clearOtpResendTimer() {
      if (this.otpResendInterval) {
        clearInterval(this.otpResendInterval);
        this.otpResendInterval = null;
      }
    },

    goBack() {
      if (this.step > 1) {
        this.step--;
        this.submitted = false;
        if (this.step === 1) {
          this.clearOtpResendTimer();
        }
      }
    },
  },
  beforeUnmount() {
    this.clearOtpResendTimer();
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

            <!-- Step 1: Email -->
            <form v-if="step === 1" novalidate @submit="onStep1Submit">
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
                {{ loading ? "Sending..." : "Send OTP" }}
              </button>

              <p class="text-center text-secondary small mb-0">
                Already have an account?
                <RouterLink to="/login">Login</RouterLink>
              </p>
            </form>

            <!-- Step 2: OTP Verification -->
            <form v-if="step === 2" novalidate @submit="onStep2Submit">
              <div class="mb-3">
                <label class="form-label">Enter OTP sent to {{ email }}</label>
                <input
                  v-model="otp"
                  type="text"
                  class="form-control text-center"
                  :class="{
                    'is-valid': submitted && otpValid,
                    'is-invalid': submitted && !otpValid,
                  }"
                  placeholder="123456"
                  maxlength="6"
                  autocomplete="one-time-code"
                  :disabled="loading"
                />
                <div v-if="submitted && !otpValid" class="invalid-feedback">
                  Please enter a valid 6-digit OTP code.
                </div>
              </div>

              <div class="mb-3 text-center">
                <button
                  type="button"
                  class="btn btn-link btn-sm"
                  :disabled="otpResendTimer > 0 || loading"
                  @click="onResendOtp"
                >
                  {{
                    otpResendTimer > 0
                      ? `Resend in ${otpResendTimer}s`
                      : "Resend OTP"
                  }}
                </button>
              </div>

              <div class="d-flex gap-2 mb-3">
                <button
                  type="button"
                  class="btn btn-outline-secondary flex-1"
                  :disabled="loading"
                  @click="goBack"
                >
                  Back
                </button>
                <button
                  type="submit"
                  class="btn btn-accent flex-1"
                  :disabled="loading"
                >
                  <span
                    v-if="loading"
                    class="spinner-border spinner-border-sm me-2"
                  ></span>
                  {{ loading ? "Verifying..." : "Verify" }}
                </button>
              </div>
            </form>

            <!-- Step 3: Password Setup -->
            <form v-if="step === 3" novalidate @submit="onStep3Submit">
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
                <label for="regConfirm" class="form-label"
                  >Confirm password</label
                >
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
                  :disabled="loading"
                />
                <div v-if="submitted && !confirmValid" class="invalid-feedback">
                  Passwords must match.
                </div>
              </div>

              <div class="d-flex gap-2 mb-3">
                <button
                  type="button"
                  class="btn btn-outline-secondary flex-1"
                  :disabled="loading"
                  @click="goBack"
                >
                  Back
                </button>
                <button
                  type="submit"
                  class="btn btn-accent flex-1"
                  :disabled="loading"
                >
                  <span
                    v-if="loading"
                    class="spinner-border spinner-border-sm me-2"
                  ></span>
                  {{ loading ? "Creating..." : "Create account" }}
                </button>
              </div>
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
