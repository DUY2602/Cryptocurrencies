import { ref, computed } from "vue";
import { supabase } from "../../supabase/supabase.js";

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

export const user = ref(null);

function mapUser(authUser) {
  return {
    email: authUser.email,
    name:
      authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User",
    id: authUser.id,
  };
}

export async function loadUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  user.value = session?.user ? mapUser(session.user) : null;
}

async function upsertProfile(authUser, name) {
  const profileName =
    name ||
    authUser.user_metadata?.name ||
    authUser.email?.split("@")[0] ||
    "User";

  const { error } = await supabase.from("profiles").upsert(
    {
      id: authUser.id,
      email: authUser.email,
      name: profileName,
      role: "user",
    },
    { onConflict: "id" },
  );

  if (error) {
    console.warn("[auth] profile upsert failed:", error.message);
  }
}

async function updatePasswordHash(password) {
  if (!user.value) return;
  const bcrypt = await import("bcryptjs").then((m) => m.default || m);
  const hash = await bcrypt.hash(password, 10);
  const { error } = await supabase
    .from("profiles")
    .update({ password: hash })
    .eq("id", user.value.id);
  if (error) {
    console.warn("[auth] password hash update failed:", error.message);
  }
}

supabase.auth.onAuthStateChange((_event, session) => {
  user.value = session?.user ? mapUser(session.user) : null;
});

loadUser();

export function useAuth() {
  const isLoggedIn = computed(() => !!user.value);

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    if (data.user) {
      user.value = mapUser(data.user);
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

  async function requestRegistration(email, name) {
    try {
      const tempPassword =
        Math.random().toString(36).slice(-10) +
        Math.random().toString(36).slice(-10);

      const displayName = name || email.split("@")[0] || "User";

      const { data, error } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: {
            name: displayName,
            tempPassword: tempPassword,
          },
          emailRedirectTo: `${APP_URL}/set-password`,
        },
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data?.user) {
        await upsertProfile(data.user, displayName);
      }

      if (data?.user && !data?.session) {
        return {
          success: true,
          message:
            "Registration successful. Please check your email to verify your account.",
        };
      }

      if (data?.user) {
        user.value = mapUser(data.user);
        return { success: true, message: "Registration successful" };
      }

      return {
        success: true,
        message:
          "Registration submitted. Please check your email to verify your account.",
      };
    } catch (e) {
      console.error("[auth] requestRegistration error:", e);
      return { success: false, message: e.message || "Registration failed" };
    }
  }

  async function setPassword(password) {
    const { data, error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    if (data.user) {
      user.value = mapUser(data.user);
      await Promise.all([
        upsertProfile(data.user),
        updatePasswordHash(password),
      ]);
      return { success: true, message: "Password set successfully" };
    }

    return { success: false, message: "Failed to set password" };
  }

  async function signUp(email, password, name) {
    try {
      const displayName = name || email.split("@")[0] || "User";

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: displayName },
          emailRedirectTo: `${APP_URL}/`,
        },
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data?.user) {
        await upsertProfile(data.user, displayName);
      }

      if (data?.user && !data?.session) {
        return {
          success: true,
          message:
            "Registration successful. Please check your email to verify your account.",
        };
      }

      if (data?.user) {
        user.value = mapUser(data.user);
        return { success: true, message: "Registration successful" };
      }

      return { success: false, message: "Registration failed" };
    } catch (e) {
      console.error("[auth] signUp error:", e);
      return { success: false, message: e.message || "Registration failed" };
    }
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
