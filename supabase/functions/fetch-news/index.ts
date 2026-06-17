/**
 * fetch-news — Supabase Edge Function
 *
 * Fetches CoinDesk RSS every hour via Supabase Cron and inserts
 * new articles into the `news` table. Short descriptions from RSS
 * are expanded into fuller articles using Gemini 2.0 Flash.
 *
 * Environment variables:
 *   SUPABASE_URL              (auto-injected)
 *   SUPABASE_SERVICE_ROLE_KEY (auto-injected)
 *   GEMINI_API_KEY            (must be set as Edge Function secret)
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { XMLParser } from "npm:fast-xml-parser@4.5.0";

const COINDESK_RSS = "https://www.coindesk.com/arc/outboundfeeds/rss/";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

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

  try {
    const rssRes = await fetch(COINDESK_RSS);
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
    for (const a of articles) {
      if (!a.source_url || existingUrls.has(a.source_url)) continue;

      const expanded = await expandContent(a.title, a.summary);
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

async function expandContent(title: string, summary: string): Promise<string> {
  const plain = summary.replace(/<[^>]+>/g, "").trim();
  const wordCount = plain.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 60 || !GEMINI_API_KEY) return `<p>${escapeHtml(plain)}</p>`;

  const prompt = `You are a crypto news writer. Expand this short news snippet into a 2-3 paragraph article with analysis and context. Include relevant market implications. Keep it factual and concise.

Title: ${title}
Summary: ${plain}

Write the article body in plain text (no markdown, no HTML).`;

  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
        }),
      },
    );
    if (!res.ok) return `<p>${escapeHtml(plain)}</p>`;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const paragraphs = text.split(/\n\n+/).map((p: string) => `<p>${escapeHtml(p.trim())}</p>`).filter(Boolean).join("");
    return paragraphs || `<p>${escapeHtml(plain)}</p>`;
  } catch {
    return `<p>${escapeHtml(plain)}</p>`;
  }
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
