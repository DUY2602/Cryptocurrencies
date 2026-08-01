/**
 * News service — Stage 4
 *
 * Strategy:
 *  - Reads: Supabase table (accumulated news persisted by Edge Function).
 *           Articles with short content (< 60 words) are auto-expanded
 *           via Gemini through the fetch-news Edge Function.
 *  - Writes (create / update / delete): only allowed for users with
 *           role='admin' (enforced by RLS policies on the server).
 *  - HTML coming from TipTap is sanitized through DOMPurify before
 *    being written, mitigating stored XSS.
 */

import DOMPurify from "dompurify";
import { supabase } from "../../supabase/supabase.js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const EDGE_FUNCTION_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/+$/, "")}/functions/v1/fetch-news`
  : null;

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

/* ----------------------------- helpers -------------------------------- */

function getWordCount(html) {
  const text = String(html || "").replace(/<[^>]+>/g, " ").trim();
  return text.split(/\s+/).filter(Boolean).length;
}

function isShortContent(article) {
  const wc = getWordCount(article.full_content || article.content);
  return wc > 0 && wc < 60;
}

/* ----------------------------- reads ---------------------------------- */

export async function fetchNews({ page = 1, pageSize = 12 } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("news")
    .select("*")
    .order("published_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  if (!data?.length) return [];

  const articles = data.map(normalizeArticle);

  for (const article of articles) {
    if (isShortContent(article)) {
      expandArticleContent(article.id);
    }
  }

  return articles;
}

export async function fetchNewsCount() {
  const { count, error } = await supabase
    .from("news")
    .select("*", { count: "exact", head: true });

  if (error) return null;
  return count;
}

export async function fetchNewsCountSince(isoSince) {
  const { count, error } = await supabase
    .from("news")
    .select("*", { count: "exact", head: true })
    .gte("published_at", isoSince);

  if (error) return null;
  return count;
}

export async function fetchCategoryCounts() {
  const { data, error } = await supabase
    .from("news")
    .select("category");

  if (error) return [];

  const counts = {};
  data.forEach((row) => {
    const cat = row.category || "General";
    counts[cat] = (counts[cat] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export async function fetchNewsAdmin({ page = 1, pageSize = 10, search = "", category = "", sortField = "published_at", sortAsc = false } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const safeSort = new Set([
    "published_at",
    "title",
    "category",
    "author_name",
    "created_at",
    "id",
  ]);
  const orderBy = safeSort.has(sortField) ? sortField : "published_at";

  let query = supabase
    .from("news")
    .select("*", { count: "exact", head: false });

  const q = String(search || "").trim();
  if (q) {
    const esc = q.replace(/%/g, "").replace(/['"]/g, " ");
    query = query.or(
      `title.ilike.%${esc}%,summary.ilike.%${esc}%,author_name.ilike.%${esc}%,category.ilike.%${esc}%`
    );
  }
  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error, count } = await query
    .order(orderBy, { ascending: !!sortAsc })
    .range(from, to);

  if (error) throw error;

  const articles = (data || []).map(normalizeArticle);
  for (const article of articles) {
    if (isShortContent(article)) {
      expandArticleContent(article.id);
    }
  }

  return { articles, total: count ?? 0 };
}

export async function fetchNewsById(id) {
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const article = normalizeArticle(data);

  if (isShortContent(article)) {
    expandArticleContent(article.id);
  }

  return article;
}

export async function expandArticleContent(id) {
  if (!EDGE_FUNCTION_URL) return;

  try {
    await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action: "expand", id }),
    });
  } catch { /* fire-and-forget */ }
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
let channelCounter = 0;
export function subscribeNews(callback, suffix = "") {
  const id = ++channelCounter;
  const channelName = "news-realtime" + (suffix ? "-" + suffix : "") + "-" + id;
  const channel = supabase
    .channel(channelName)
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
