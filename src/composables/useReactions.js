import { reactive, watch } from "vue";
import { supabase } from "../../supabase/supabase.js";
import { user } from "./useAuth.js";

const userReactions = reactive({});
const counts = reactive({});

/* Watch auth changes to reload user reactions */
watch(user, (u) => {
  if (u?.id) {
    loadUserReactions();
  } else {
    for (const k of Object.keys(userReactions)) delete userReactions[k];
  }
});

/* ----------------------------- helpers -------------------------------- */

function key(id) {
  return String(id);
}

/* ---------------------------- read counts ----------------------------- */

export async function fetchReactionCounts(articleIds) {
  if (!articleIds?.length) return;

  const { data, error } = await supabase
    .from("news_likes")
    .select("article_id, type");

  if (error) {
    console.warn("[reactions] fetch counts failed:", error.message);
    return;
  }

  for (const id of articleIds) {
    const k = key(id);
    if (!counts[k]) counts[k] = { likes: 0, dislikes: 0 };
  }

  for (const row of data || []) {
    const k = key(row.article_id);
    if (!counts[k]) counts[k] = { likes: 0, dislikes: 0 };
    if (row.type === "dislike") counts[k].dislikes++;
    else counts[k].likes++;
  }
}

/* --------------------------- user reaction ---------------------------- */

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

/* ----------------------------- mutate --------------------------------- */

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

/* ----------------------------- getters -------------------------------- */

export function getUserReaction(articleId) {
  return userReactions[key(articleId)] || null;
}

export function getLikesCount(articleId) {
  return counts[key(articleId)]?.likes ?? 0;
}

export function getDislikesCount(articleId) {
  return counts[key(articleId)]?.dislikes ?? 0;
}
