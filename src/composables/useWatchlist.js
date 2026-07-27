import { ref, computed, watch } from "vue";
import { supabase } from "../../supabase/supabase.js";
import { user } from "./useAuth.js";

const STORAGE_KEY = "cryptodash-watchlist";
const ids = ref([]);
let authWatcherStarted = false;

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    ids.value = raw ? JSON.parse(raw) : [];
  } catch {
    ids.value = [];
  }
}

function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.value));
}

async function loadFromSupabase(userId) {
  const { data, error } = await supabase
    .from("watchlist")
    .select("coin_id")
    .eq("user_id", userId);

  if (error) {
    console.warn("[watchlist] Supabase load failed:", error.message);
    loadFromLocalStorage();
    return;
  }

  ids.value = (data || []).map((row) => String(row.coin_id));
}

async function syncForUser(authUser) {
  if (authUser?.id) {
    await loadFromSupabase(authUser.id);
  } else {
    loadFromLocalStorage();
  }
}

function startAuthWatcher() {
  if (authWatcherStarted) return;
  authWatcherStarted = true;
  watch(user, (u) => syncForUser(u), { immediate: true });
}

export function useWatchlist() {
  startAuthWatcher();

  const watchlistIds = computed(() => ids.value);

  function isFavorite(coinId) {
    return ids.value.includes(String(coinId));
  }

  async function toggleFavorite(coinId) {
    const id = String(coinId);

    if (user.value?.id) {
      const wasFav = isFavorite(id);

      // Optimistic update — UI changes instantly
      if (wasFav) {
        ids.value = ids.value.filter((x) => x !== id);
      } else {
        ids.value = [...ids.value, id];
      }

      // Background sync to Supabase
      const { error } = wasFav
        ? await supabase.from("watchlist").delete().eq("user_id", user.value.id).eq("coin_id", id)
        : await supabase.from("watchlist").insert({ user_id: user.value.id, coin_id: id });

      if (error) {
        console.warn("[watchlist] sync failed:", error.message);
        // Rollback optimistic update
        if (wasFav) {
          ids.value = [...ids.value, id];
        } else {
          ids.value = ids.value.filter((x) => x !== id);
        }
      }
      return;
    }

    const idx = ids.value.indexOf(id);
    if (idx >= 0) {
      ids.value = ids.value.filter((x) => x !== id);
    } else {
      ids.value = [...ids.value, id];
    }
    saveToLocalStorage();
  }

  async function removeFavorite(coinId) {
    const id = String(coinId);

    if (user.value?.id) {
      await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", user.value.id)
        .eq("coin_id", id);
    }

    ids.value = ids.value.filter((x) => x !== id);
    if (!user.value?.id) saveToLocalStorage();
  }

  return {
    watchlistIds,
    isFavorite,
    toggleFavorite,
    removeFavorite,
  };
}
