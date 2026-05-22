import { ref, computed } from "vue";
import otpService from "../services/otp.js";
import emailService from "../services/email.js";

const STORAGE_KEY = "cryptodash-auth";
const USERS_KEY = "cryptodash-users";

const user = ref(null);

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    user.value = raw ? JSON.parse(raw) : null;
  } catch {
    user.value = null;
  }
}

loadUser();

export function useAuth() {
  const isLoggedIn = computed(() => !!user.value);

  function login(email, password) {
    // Check if user exists in users storage
    const users = getUsers();
    const existingUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );

    if (existingUser) {
      // Verify password
      if (existingUser.password !== password) {
        return { success: false, message: "Invalid password" };
      }

      const account = {
        email: existingUser.email,
        name: existingUser.name,
      };
      user.value = account;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
      return { success: true, message: "Login successful" };
    }

    // For demo purposes, allow login without existing user
    const account = {
      email: email.trim(),
      name: email.split("@")[0] || "User",
    };
    user.value = account;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    return { success: true, message: "Login successful" };
  }

  function logout() {
    user.value = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  function getUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  // Step 1: Request OTP for email
  async function requestOtp(email) {
    const users = getUsers();
    const existingUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );

    if (existingUser) {
      return { success: false, message: "Email already registered" };
    }

    const otp = otpService.generateOtp(email);

    // Send OTP via email service
    await emailService.sendOtp(email, otp);

    return { success: true, message: "OTP sent to your email" };
  }

  // Step 2: Verify OTP
  function verifyOtp(email, code) {
    const result = otpService.verifyOtp(email, code);
    return result;
  }

  // Step 3: Complete registration with password
  function register(email, password, name) {
    if (!otpService.isVerified(email)) {
      return { success: false, message: "Email not verified" };
    }

    const users = getUsers();
    const newUser = {
      email: email.toLowerCase(),
      password: password,
      name: name || email.split("@")[0] || "User",
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    // Clear OTP after successful registration
    otpService.clearOtp(email);

    // Auto login
    const account = {
      email: newUser.email,
      name: newUser.name,
    };
    user.value = account;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));

    return { success: true, message: "Registration successful" };
  }

  // Resend OTP
  async function resendOtp(email) {
    const otp = otpService.resendOtp(email);
    await emailService.sendOtp(email, otp);
    return { success: true, message: "New OTP sent to your email" };
  }

  return {
    user,
    isLoggedIn,
    login,
    logout,
    register,
    requestOtp,
    verifyOtp,
    resendOtp,
  };
}
