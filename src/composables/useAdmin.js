/**
 * useAdmin — Stage 3
 *
 * Lightweight role-check helper for the admin-only sections of the app
 * (e.g. /admin/news CRUD UI). The truth lives in the `profiles.role`
 * column in Supabase; RLS policies also enforce it server-side.
 */

import { ref, computed, watch } from "vue";
import { supabase } from "../../supabase/supabase.js";
import { user } from "./useAuth.js";

const profile = ref(null);
const loading = ref(false);
const lastLoadedFor = ref(null);

async function loadProfile(uid) {
  if (!uid) {
    profile.value = null;
    lastLoadedFor.value = null;
    return;
  }
  if (lastLoadedFor.value === uid && profile.value) return;
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, role")
      .eq("id", uid)
      .maybeSingle();
    if (error) {
      console.warn("[useAdmin] profile load failed:", error.message);
      profile.value = null;
    } else {
      profile.value = data || null;
      lastLoadedFor.value = uid;
    }
  } finally {
    loading.value = false;
  }
}

// Load whenever the auth user changes
watch(
  () => user.value?.id,
  (uid) => loadProfile(uid),
  { immediate: true }
);

// Reset cache when auth state changes (e.g. role was just upgraded in DB)
supabase.auth.onAuthStateChange((_event, session) => {
  const uid = session?.user?.id || null;
  if (uid !== lastLoadedFor.value) {
    lastLoadedFor.value = null;
    loadProfile(uid);
  }
});

export function useAdmin() {
  const role = computed(() => profile.value?.role || "user");
  const isAdmin = computed(
    () => !!user.value && (profile.value?.role || "").toLowerCase() === "admin"
  );

  async function refresh() {
    lastLoadedFor.value = null;
    if (user.value?.id) await loadProfile(user.value.id);
  }

  return { role, isAdmin, profile, loading, refresh };
}

export default useAdmin;
