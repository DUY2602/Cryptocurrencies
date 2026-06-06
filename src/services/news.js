/**
 * News service — Stage 3
 *
 * Strategy:
 *  - Reads: try Supabase first, fall back to local data/news.json
 *           so the public site still works even before the table is
 *           seeded.
 *  - Writes (create / update / delete): only allowed for users with
 *           role='admin' (enforced by RLS policies on the server).
 *  - HTML coming from TipTap is sanitized through DOMPurify before
 *    being written, mitigating stored XSS.
 */

import DOMPurify from "dompurify";
import fallbackNews from "../data/news.json";
import { supabase } from "../../supabase/supabase.js";

const DEFAULT_IMAGE = "/hero.jpg";
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "em", "u", "s", "code", "pre",
    "h1", "h2", "h3", "h4",
    "ul", "ol", "li",
    "a", "img", "blockquote",
    "span", "div",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "title", "class"],
  ALLOW_DATA_ATTR: false,
};

/* ----------------------------- helpers -------------------------------- */

function toSummary(text, max = 180) {
  if (!text) return "";
  const plain = String(text).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (plain.length <= max) return plain;
  return plain.slice(0, max).trim() + "...";
}

function sanitizeHtml(html) {
  if (!html) return "";
  return DOMPurify.sanitize(String(html), SANITIZE_CONFIG);
}

function toFullHtml(row) {
  if (row.content) return row.content;
  const text = row.summary || "";
  if (text.includes("<")) return text;
  return `<p>${text}</p>`;
}

/**
 * Normalize a row from Supabase OR from local JSON into the
 * shape the UI expects.
 */
export function normalizeArticle(row) {
  const fullContent = toFullHtml(row);
  const summary = row.summary || toSummary(fullContent);

  return {
    id: row.id,
    title: row.title,
    summary,
    full_content: fullContent,
    content: fullContent,
    category: row.category || "General",
    date: row.published_at || row.date || row.created_at,
    image_url: row.image_url || DEFAULT_IMAGE,
    source_url: row.source_url ?? null,
    source_name: row.source_name ?? null,
    author: row.author_name
      ? {
          name: row.author_name,
          avatar: row.author_avatar || null,
        }
      : row.author || null,
    author_name: row.author_name ?? null,
    author_avatar: row.author_avatar ?? null,
    tags: row.tags ?? [],
    featured: !!row.featured,
    trending: !!row.trending,
    read_time: row.read_time ?? 3,
  };
}

/* ----------------------------- reads ---------------------------------- */

/**
 * Fetch news list.
 *  - Tries Supabase first.
 *  - Falls back to local JSON if Supabase is missing creds or errors.
 *  - In offline / no-creds mode the data layer is read-only.
 */
export async function fetchNews() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return fallbackNews.map(normalizeArticle);
  }

  try {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(500);

    if (error) throw error;
    if (!Array.isArray(data) || data.length === 0) {
      // Empty DB — keep the local fallback so the public site still has
      // content to render before an admin seeds it.
      return fallbackNews.map(normalizeArticle);
    }
    return data.map(normalizeArticle);
  } catch (e) {
    console.warn("[news] Supabase fetch failed, using local fallback:", e.message);
    return fallbackNews.map(normalizeArticle);
  }
}

export async function fetchNewsById(id) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    const local = fallbackNews.find((a) => String(a.id) === String(id));
    return local ? normalizeArticle(local) : null;
  }

  try {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (data) return normalizeArticle(data);
  } catch (e) {
    console.warn("[news] Supabase fetchById failed:", e.message);
  }

  const local = fallbackNews.find((a) => String(a.id) === String(id));
  return local ? normalizeArticle(local) : null;
}

/* ----------------------------- writes (admin) ------------------------- */

/**
 * Build a Supabase row from the editor payload.
 * Sanitizes the TipTap HTML before sending.
 */
function buildRow(payload, currentUserId) {
  return {
    title: String(payload.title || "").trim(),
    summary: String(payload.summary || "").trim(),
    content: sanitizeHtml(payload.content || ""),
    category: String(payload.category || "General").trim() || "General",
    image_url: payload.image_url || null,
    source_url: payload.source_url || null,
    source_name: payload.source_name || null,
    author_name: payload.author_name || null,
    author_avatar: payload.author_avatar || null,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    featured: !!payload.featured,
    trending: !!payload.trending,
    read_time: Number(payload.read_time) > 0 ? Number(payload.read_time) : 3,
    published_at: payload.published_at || new Date().toISOString(),
    created_by: currentUserId || null,
  };
}

export async function createNews(payload, currentUserId) {
  const row = buildRow(payload, currentUserId);
  const { data, error } = await supabase
    .from("news")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return normalizeArticle(data);
}

export async function updateNews(id, payload, currentUserId) {
  const row = buildRow(payload, currentUserId);
  const { data, error } = await supabase
    .from("news")
    .update(row)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return normalizeArticle(data);
}

export async function deleteNews(id) {
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/**
 * Subscribe to realtime INSERT/UPDATE/DELETE on the news table.
 * Returns an unsubscribe function.
 */
export function subscribeNews(callback) {
  const channel = supabase
    .channel("news-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "news" },
      (payload) => callback(payload)
    )
    .subscribe();
  return () => {
    try {
      supabase.removeChannel(channel);
    } catch {
      /* noop */
    }
  };
}

export default {
  fetchNews,
  fetchNewsById,
  createNews,
  updateNews,
  deleteNews,
  subscribeNews,
  normalizeArticle,
  sanitizeHtml,
};
