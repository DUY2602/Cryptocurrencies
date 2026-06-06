/**
 * fetch-news — Supabase Edge Function
 *
 * Fetches CoinDesk RSS every hour via Supabase Cron and inserts
 * new articles into the `news` table.
 *
 * Deploy:
 *   1. Go to Supabase Dashboard > Edge Functions > Create Function
 *   2. Paste this code, name it "fetch-news"
 *   3. Go to Edge Functions > Triggers > Create Trigger
 *      - Cron: 0 * * * *  (every hour)
 *      - HTTP method: POST
 *
 * Environment variables (auto-injected by Supabase):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { XMLParser } from "npm:fast-xml-parser@4.5.0";

const COINDESK_RSS = "https://www.coindesk.com/arc/outboundfeeds/rss/";

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

serve(async (_req) => {
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
        JSON.stringify({ inserted: 0, message: "No items found in RSS" }),
        { status: 200 },
      );
    }

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

    for (const item of items) {
      const url = item.link?.trim();
      if (!url || existingUrls.has(url)) continue;

      const title = extractText(item.title).trim();
      if (!title || title.length < 5) continue;

      const description = extractText(item.description).trim();
      const contentRaw = extractText(item["content:encoded"]);

      const imageUrl = extractImage(item["media:content"]);

      const content = contentRaw
        ? sanitizeHtml(contentRaw)
        : `<p>${escapeHtml(description)}</p>`;

      const cats = item.category;
      const category = Array.isArray(cats) ? (cats[0] ?? "General") : (cats ?? "General");
      const tags = Array.isArray(cats) ? cats.filter(Boolean) : (cats ? [cats] : []);

      const pubDate = item.pubDate
        ? new Date(item.pubDate).toISOString()
        : new Date().toISOString();

      const authorName = extractText(item["dc:creator"])?.trim() || "CoinDesk";

      const wordCount = content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
      const readTime = Math.max(1, Math.round(wordCount / 200));

      const { error } = await supabase.from("news").insert({
        title,
        summary: description.slice(0, 240),
        content,
        category,
        image_url: imageUrl || null,
        source_url: url,
        source_name: "CoinDesk",
        author_name: authorName,
        tags,
        read_time: readTime,
        published_at: pubDate,
      });

      if (error) {
        console.warn(`[fetch-news] insert failed: ${error.message}`);
        continue;
      }

      existingUrls.add(url);
      inserted++;
    }

    return new Response(JSON.stringify({ inserted, total: items.length }), {
      status: 200,
    });
  } catch (e) {
    console.error("[fetch-news]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
    });
  }
});

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
