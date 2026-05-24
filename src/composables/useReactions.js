import { ref, watch } from "vue";
import { supabase } from "../../supabase/supabase.js";
import { user } from "./useAuth.js";

const STORAGE_KEY = "cryptodash-reactions";

const state = ref({
  newsLikes: {},
  coinVotes: {},
});

let authWatcherStarted = false;

function loadCoinVotesFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state.value.coinVotes = parsed.coinVotes || {};
    }
  } catch {
    /* keep defaults */
  }
}

function saveCoinVotesToLocalStorage() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ coinVotes: state.value.coinVotes }),
  );
}

function loadNewsLikesFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state.value.newsLikes = parsed.newsLikes || {};
    }
  } catch {
    state.value.newsLikes = {};
  }
}

function saveNewsLikesToLocalStorage() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      newsLikes: state.value.newsLikes,
      coinVotes: state.value.coinVotes,
    }),
  );
}

async function loadNewsLikesFromSupabase(userId) {
  const { data, error } = await supabase
    .from("news_likes")
    .select("article_id")
    .eq("user_id", userId);

  if (error) {
    console.warn("[reactions] news_likes load failed:", error.message);
    loadNewsLikesFromLocalStorage();
    return;
  }

  const likes = {};
  (data || []).forEach((row) => {
    likes[String(row.article_id)] = true;
  });
  state.value.newsLikes = likes;
}

async function syncNewsLikesForUser(authUser) {
  if (authUser?.id) {
    await loadNewsLikesFromSupabase(authUser.id);
  } else {
    loadNewsLikesFromLocalStorage();
  }
}

function startAuthWatcher() {
  if (authWatcherStarted) return;
  authWatcherStarted = true;
  loadCoinVotesFromLocalStorage();
  watch(user, (u) => syncNewsLikesForUser(u), { immediate: true });
}

export function useReactions() {
  startAuthWatcher();

  function isNewsLiked(articleId) {
    return !!state.value.newsLikes[String(articleId)];
  }

  async function toggleNewsLike(articleId) {
    const key = String(articleId);

    if (user.value?.id) {
      if (isNewsLiked(key)) {
        const { error } = await supabase
          .from("news_likes")
          .delete()
          .eq("user_id", user.value.id)
          .eq("article_id", Number(articleId));

        if (error) {
          console.warn("[reactions] unlike failed:", error.message);
          return;
        }
        const next = { ...state.value.newsLikes };
        delete next[key];
        state.value.newsLikes = next;
      } else {
        const { error } = await supabase.from("news_likes").insert({
          user_id: user.value.id,
          article_id: Number(articleId),
        });

        if (error) {
          console.warn("[reactions] like failed:", error.message);
          return;
        }
        state.value.newsLikes = { ...state.value.newsLikes, [key]: true };
      }
      return;
    }

    const next = { ...state.value.newsLikes };
    next[key] = !next[key];
    if (!next[key]) delete next[key];
    state.value.newsLikes = next;
    saveNewsLikesToLocalStorage();
  }

  function getNewsLikeCount(articleId) {
    return state.value.newsLikes[String(articleId)] ? 1 : 0;
  }

  function getCoinVote(coinId) {
    return state.value.coinVotes[String(coinId)] || null;
  }

  function setCoinVote(coinId, vote) {
    const key = String(coinId);
    if (state.value.coinVotes[key] === vote) {
      delete state.value.coinVotes[key];
    } else {
      state.value.coinVotes[key] = vote;
    }
    saveCoinVotesToLocalStorage();
  }

  return {
    isNewsLiked,
    toggleNewsLike,
    getNewsLikeCount,
    getCoinVote,
    setCoinVote,
  };
}
