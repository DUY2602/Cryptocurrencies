import { reactive, watch } from "vue";
import { supabase } from "../../supabase/supabase.js";
import { user } from "./useAuth.js";

const userReactions = reactive({});
const counts = reactive({});

// Reload user reactions on auth change.
watch(user, (u) => {
  if (u?.id) {
    loadUserReactions();
  } else {
    for (const k of Object.keys(userReactions)) delete userReactions[k];
  }
});

function key(id) {
  return String(id);
}

// Fetch like/dislike counts for the requested articles only, recomputed
// from scratch so repeated calls never accumulate stale totals.
export async function fetchReactionCounts(articleIds) {
  const ids = (Array.isArray(articleIds) ? articleIds : [articleIds])
    .map((id) => Number(id))
    .filter((n) => !Number.isNaN(n));
  if (!ids.length) return;

  const { data, error } = await supabase
    .from("news_likes")
    .select("article_id, type")
    .in("article_id", ids);

  if (error) {
    console.warn("[reactions] fetch counts failed:", error.message);
    return;
  }

  // Recompute from scratch so like -> unlike doesn't inflate totals.
  const next = {};
  for (const id of ids) {
    next[key(id)] = { likes: 0, dislikes: 0 };
  }

  for (const row of data || []) {
    const k = key(row.article_id);
    if (!next[k]) next[k] = { likes: 0, dislikes: 0 };
    if (row.type === "dislike") next[k].dislikes++;
    else next[k].likes++;
  }

  for (const [k, v] of Object.entries(next)) counts[k] = v;
}

// Load the current user's reactions.
export async function loadUserReactions() {
  if (!user.value?.id) {
    for (const k of Object.keys(userReactions)) delete userReactions[k];
    return;
  }

  const { data, error } = await supabase
    .from("news_likes")
    .select("article_id, type")
    .eq("user_id", user.value.id);

  if (error) {
    console.warn("[reactions] load user reactions failed:", error.message);
    return;
  }

  for (const row of data || []) {
    userReactions[key(row.article_id)] = row.type;
  }
}

// Toggle a reaction: clicking the active type removes it, otherwise upsert.
export async function react(articleId, type) {
  if (!user.value?.id) return false;
  if (type !== "like" && type !== "dislike") return false;

  const k = key(articleId);
  const current = userReactions[k];
  const numId = Number(articleId);

  if (current === type) {
    await removeReaction(articleId);
    return true;
  }

  const { error } = await supabase.from("news_likes").upsert(
    { user_id: user.value.id, article_id: numId, type },
    { onConflict: "user_id, article_id" },
  );

  if (error) {
    console.warn("[reactions] react failed:", error.message);
    return false;
  }

  if (current) {
    const c = counts[k];
    if (c) {
      if (current === "like") c.likes = Math.max(0, c.likes - 1);
      else c.dislikes = Math.max(0, c.dislikes - 1);
    }
  }

  userReactions[k] = type;

  const c = counts[k];
  if (c) {
    if (type === "like") c.likes++;
    else c.dislikes++;
  }

  return true;
}

// Remove the current user's reaction.
export async function removeReaction(articleId) {
  if (!user.value?.id) return false;

  const k = key(articleId);
  const current = userReactions[k];
  if (!current) return true;

  const { error } = await supabase
    .from("news_likes")
    .delete()
    .eq("user_id", user.value.id)
    .eq("article_id", Number(articleId));

  if (error) {
    console.warn("[reactions] remove failed:", error.message);
    return false;
  }

  delete userReactions[k];

  const c = counts[k];
  if (c) {
    if (current === "like") c.likes = Math.max(0, c.likes - 1);
    else c.dislikes = Math.max(0, c.dislikes - 1);
  }

  return true;
}

export function getUserReaction(articleId) {
  return userReactions[key(articleId)] || null;
}

export function getLikesCount(articleId) {
  return counts[key(articleId)]?.likes ?? 0;
}

export function getDislikesCount(articleId) {
  return counts[key(articleId)]?.dislikes ?? 0;
}
