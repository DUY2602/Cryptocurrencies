import { ref, computed, onMounted } from "vue";
import { supabase } from "../supabase.js";

const user = ref(null);

async function loadUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) {
    user.value = {
      email: session.user.email,
      name:
        session.user.user_metadata?.name ||
        session.user.email?.split("@")[0] ||
        "User",
      id: session.user.id,
    };
  }
}

export function useAuth() {
  const isLoggedIn = computed(() => !!user.value);

  // Initialize auth state
  onMounted(() => {
    loadUser();

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        user.value = {
          email: session.user.email,
          name:
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "User",
          id: session.user.id,
        };
      } else if (event === "SIGNED_OUT") {
        user.value = null;
      }
    });
  });

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    if (data.user) {
      user.value = {
        email: data.user.email,
        name:
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "User",
        id: data.user.id,
      };
      return { success: true, message: "Login successful" };
    }

    return { success: false, message: "Login failed" };
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      user.value = null;
      return { success: true, message: "Logged out successfully" };
    }
    return { success: false, message: error.message };
  }

  // Step 1: Request registration with email only (temp password)
  async function requestRegistration(email, name) {
    const tempPassword =
      Math.random().toString(36).slice(-10) +
      Math.random().toString(36).slice(-10);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          name: name || email.split("@")[0] || "User",
          tempPassword: tempPassword,
        },
        emailRedirectTo: `${window.location.origin}/set-password`,
      },
    });

    console.log("Supabase signUp response:", { data, error });

    if (error) {
      return { success: false, message: error.message };
    }

    // If email confirmation is enabled, user won't be signed in immediately
    if (data.user && !data.session) {
      return {
        success: true,
        message:
          "Registration successful. Please check your email to verify your account.",
      };
    }

    if (data.user) {
      user.value = {
        email: data.user.email,
        name:
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "User",
        id: data.user.id,
      };
      return { success: true, message: "Registration successful" };
    }

    return { success: false, message: "Registration failed" };
  }

  // Step 2: Set password after email verification
  async function setPassword(password) {
    const { data, error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    if (data.user) {
      user.value = {
        email: data.user.email,
        name:
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "User",
        id: data.user.id,
      };
      return { success: true, message: "Password set successfully" };
    }

    return { success: false, message: "Failed to set password" };
  }

  // Direct registration with email verification (legacy)
  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split("@")[0] || "User",
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      return { success: false, message: error.message };
    }

    // If email confirmation is enabled, user won't be signed in immediately
    if (data.user && !data.session) {
      return {
        success: true,
        message:
          "Registration successful. Please check your email to verify your account.",
      };
    }

    if (data.user) {
      user.value = {
        email: data.user.email,
        name:
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "User",
        id: data.user.id,
      };
      return { success: true, message: "Registration successful" };
    }

    return { success: false, message: "Registration failed" };
  }

  return {
    user,
    isLoggedIn,
    login,
    logout,
    signUp,
    requestRegistration,
    setPassword,
  };
}
