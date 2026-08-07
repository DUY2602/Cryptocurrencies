/**
 * fetch-news — pulls CoinDesk RSS into the news table. Short RSS
 * descriptions are expanded via Groq (or Gemini fallback).
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { XMLParser } from "npm:fast-xml-parser@4.5.0";

const COINDESK_RSS = "https://www.coindesk.com/arc/outboundfeeds/rss/";
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const MAX_ORIGINAL_CHARS = 30_000;
const MIN_CONTENT_WORDS = 60;
const MAX_BATCH_EXPAND = 30;
const LLM_DELAY_MS = 400;

async function delay(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

interface RssItem {
  title?: string | { "#cdata"?: string; "#text"?: string };
  link?: string;
  description?: string | { "#cdata"?: string; "#text"?: string };
  pubDate?: string;
  category?: string | string[];
  "dc:creator"?: string | { "#cdata"?: string };
  "content:encoded"?: string | { "#cdata"?: string };
  "media:content"?: { "@_url"?: string } | { "@_url"?: string }[];
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // POST action handler (expand single article or batch-expand)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (body?.action === "expand") {
        return await handleExpand(body.id);
      }
      if (body?.action === "batch-expand") {
        return await handleBatchExpand();
      }
    } catch { /* not JSON or unknown action — fall through to RSS fetch */ }
  }

  try {
    const rssRes = await fetch(COINDESK_RSS, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CryptocurrenciesBot/1.0; +https://github.com/your-repo)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    if (!rssRes.ok) throw new Error(`RSS fetch failed: ${rssRes.status}`);
    const xml = await rssRes.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      cdataPropName: "#cdata",
      isArray: (name) => name === "item",
    });
    const result = parser.parse(xml);
    const items: RssItem[] = result?.rss?.channel?.item ?? [];

    if (!items.length) {
      return new Response(
        JSON.stringify({ articles: [], message: "No items found in RSS" }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const articles = items.map((item) => {
      const title = extractText(item.title).trim();
      const description = extractText(item.description).trim();
      const contentRaw = extractText(item["content:encoded"]);
      const imageUrl = extractImage(item["media:content"]);
      const content = contentRaw
        ? sanitizeHtml(contentRaw)
        : `<p>${escapeHtml(description)}</p>`;
      const cats = normalizeCategory(item.category);
      const category = Array.isArray(cats) ? (cats[0] ?? "General") : (cats ?? "General");
      const tags = Array.isArray(cats) ? cats.filter(Boolean) : (cats ? [cats] : []);
      const pubDate = item.pubDate
        ? new Date(item.pubDate).toISOString()
        : new Date().toISOString();
      const authorName = extractText(item["dc:creator"])?.trim() || "CoinDesk";
      const wordCount = content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
      const readTime = Math.max(1, Math.round(wordCount / 200));

      return {
        id: urlToId(item.link),
        title,
        summary: description.slice(0, 240),
        content,
        category,
        image_url: imageUrl || null,
        source_url: item.link?.trim() || null,
        source_name: "CoinDesk",
        author_name: authorName,
        tags,
        read_time: readTime,
        published_at: pubDate,
        featured: false,
        trending: false,
        date: pubDate,
        author: { name: authorName, avatar: null },
        full_content: content,
      };
    }).filter((a) => a.title && a.title.length >= 5);

    // Save to DB (common logic for both GET and POST)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: existing } = await supabase
      .from("news")
      .select("source_url");
    const existingUrls = new Set(
      existing?.map((n) => n.source_url).filter(Boolean) ?? [],
    );

    let inserted = 0;
    let sourceFetched = 0;
    for (const a of articles) {
      if (!a.source_url || existingUrls.has(a.source_url)) continue;

      // Only fetch original for first 5 articles per cron run to avoid rate-limiting
      const useSource = sourceFetched < 5 && a.source_url;
      const { content: expanded } = useSource
        ? await expandContent(a.title, a.summary, a.source_url)
        : await expandContent(a.title, a.summary);
      if (useSource) sourceFetched++;
      await delay(LLM_DELAY_MS);
      const finalContent = expanded || a.content;

      const { error } = await supabase.from("news").insert({
        title: a.title,
        summary: a.summary,
        content: finalContent,
        category: a.category,
        image_url: a.image_url,
        source_url: a.source_url,
        source_name: "CoinDesk",
        author_name: a.author_name,
        tags: a.tags,
        read_time: a.read_time,
        published_at: a.published_at,
      });

      if (error) {
        console.warn(`[fetch-news] insert failed: ${error.message}`);
        continue;
      }
      existingUrls.add(a.source_url);
      inserted++;
    }

    if (inserted > 0) {
      console.log(`[fetch-news] inserted ${inserted} new articles`);
    }

    // GET = return live RSS articles (also persists to DB for accumulation)
    if (req.method === "GET") {
      return new Response(JSON.stringify({ articles }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // POST = return summary (cron/admin trigger)
    return new Response(JSON.stringify({ inserted, total: articles.length }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[fetch-news]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});

async function fetchOriginalContent(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CryptocurrenciesBot/1.0; +https://github.com/your-repo)",
        "Accept": "text/html, */*",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[^;]+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, MAX_ORIGINAL_CHARS) || null;
  } catch {
    return null;
  }
}

async function generateWithGroq(prompt: string, maxTokens = 600): Promise<string> {
  if (!GROQ_API_KEY) return "";

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  } catch {
    return "";
  }
}

async function generateWithGemini(prompt: string, maxTokens = 400): Promise<string> {
  if (!GEMINI_API_KEY) return "";

  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
        }),
      },
    );
    if (!res.ok) return "";
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  } catch {
    return "";
  }
}

async function generateContent(prompt: string, maxTokens = 600): Promise<string> {
  const groq = await generateWithGroq(prompt, maxTokens);
  if (groq) return groq;
  return generateWithGemini(prompt, maxTokens);
}

interface ExpandResult {
  content: string;
  fromSource: boolean;
}

async function expandContent(title: string, summary: string, sourceUrl?: string | null): Promise<ExpandResult> {
  // Tier 1: fetch original article and have AI read & rewrite it
  if (sourceUrl) {
    const originalText = await fetchOriginalContent(sourceUrl);
    if (originalText) {
      const wc = getWordCount(originalText);
      if (wc >= MIN_CONTENT_WORDS) {
        const prompt = `You are a crypto news writer. Read the following original article and rewrite it into a comprehensive 2-3 paragraph news article.

Original Title: ${title}
Original Article:
${originalText.slice(0, 25000)}

Write a well-structured article in plain text (no markdown, no HTML). Keep all key facts, data, quotes, and market implications. Use a clear journalistic style.`;
        const text = await generateContent(prompt, 800);
        if (text) {
          const paragraphs = text.split(/\n\n+/).map((p: string) => `<p>${escapeHtml(p.trim())}</p>`).filter(Boolean).join("");
          if (paragraphs) return { content: paragraphs, fromSource: true };
        }
      }
    }
  }

  // Tier 2: fall back to summary-based expansion
  const plain = summary.replace(/<[^>]+>/g, "").trim();
  if (!GROQ_API_KEY && !GEMINI_API_KEY) return { content: `<p>${escapeHtml(plain)}</p>`, fromSource: false };

  const prompt = `You are a crypto news writer. Expand this short news snippet into a 2-3 paragraph article with analysis and context. Include relevant market implications. Keep it factual and concise.

Title: ${title}
Summary: ${plain}

Write the article body in plain text (no markdown, no HTML).`;

  const text = await generateContent(prompt, 400);
  if (text) {
    const paragraphs = text.split(/\n\n+/).map((p: string) => `<p>${escapeHtml(p.trim())}</p>`).filter(Boolean).join("");
    if (paragraphs) return { content: paragraphs, fromSource: false };
  }
  return { content: `<p>${escapeHtml(plain)}</p>`, fromSource: false };
}

function normalizeCategory(cat: unknown): string | string[] {
  if (!cat) return "General";
  if (typeof cat === "string") return cat;
  if (Array.isArray(cat)) {
    return cat.map(normalizeCategory).flat().filter(Boolean) as string[];
  }
  const obj = cat as Record<string, unknown>;
  if (typeof obj["#cdata"] === "string") return obj["#cdata"];
  if (typeof obj["#text"] === "string") return obj["#text"];
  return "General";
}

function urlToId(url?: string): string {
  if (!url) return crypto.randomUUID();
  const hash = Array.from(url).reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0);
  return `rss-${Math.abs(hash).toString(36)}`;
}

function extractText(
  val: unknown,
): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  const obj = val as Record<string, unknown>;
  if (typeof obj["#cdata"] === "string") return obj["#cdata"];
  if (typeof obj["#text"] === "string") return obj["#text"];
  return "";
}

function extractImage(
  media: unknown,
): string {
  if (!media) return "";
  const arr = Array.isArray(media) ? media : [media];
  for (const m of arr) {
    const url = (m as Record<string, unknown>)?.["@_url"];
    if (typeof url === "string") return url;
  }
  return "";
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .slice(0, 100_000);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getWordCount(html: string): number {
  return html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
}

async function handleExpand(id: number): Promise<Response> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: article, error } = await supabase
      .from("news")
      .select("id, title, summary, content, source_url")
      .eq("id", id)
      .single();

    if (error || !article) {
      return new Response(JSON.stringify({ error: "Article not found" }), {
        status: 404,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const plain = (article.content || article.summary || "").replace(/<[^>]+>/g, "").trim();
    const wordCount = plain.split(/\s+/).filter(Boolean).length;

    if (wordCount >= MIN_CONTENT_WORDS) {
      return new Response(JSON.stringify({ expanded: false, reason: "already long enough" }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { content: newContent } = await expandContent(article.title, article.summary || plain);
    if (newContent && getWordCount(newContent) > wordCount) {
      await supabase.from("news").update({ content: newContent }).eq("id", article.id);
    }

    return new Response(JSON.stringify({ expanded: true, content: newContent }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
}

async function handleBatchExpand(): Promise<Response> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: articles, error } = await supabase
      .from("news")
      .select("id, title, summary, content");

    if (error) throw error;
    if (!articles?.length) {
      return new Response(JSON.stringify({ expanded: 0 }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    let expanded = 0;
    for (const article of articles) {
      if (!GROQ_API_KEY && !GEMINI_API_KEY) break;
      if (expanded >= MAX_BATCH_EXPAND) break;

      const plain = (article.content || article.summary || "").replace(/<[^>]+>/g, "").trim();
      const wordCount = plain.split(/\s+/).filter(Boolean).length;
      if (wordCount >= MIN_CONTENT_WORDS) continue;

      const { content: newContent } = await expandContent(article.title, article.summary || plain);
      await delay(LLM_DELAY_MS);
      if (newContent && getWordCount(newContent) > wordCount) {
        await supabase.from("news").update({ content: newContent }).eq("id", article.id);
        expanded++;
      }
    }

    return new Response(JSON.stringify({ expanded }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
}
