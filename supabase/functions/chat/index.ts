import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const RRF_K = 60;
const HYBRID_TOP_K = 20;
const FINAL_TOP_K = 5;

function rateLimitError(message: string): Error {
  const err = new Error(message);
  (err as any).isRateLimited = true;
  (err as any).retryAfter = 10;
  return err;
}

async function callLLM(messages: { role: string; parts: { text: string }[] }[], temperature = 0.7, maxTokens = 2048, retries = 3) {
  const groqMessages = messages.map((m) => ({
    role: m.role === "model" ? "assistant" : m.role,
    content: m.parts.map((p) => p.text).join("\n"),
  }));
  let lastRateLimited = false;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        temperature,
        max_tokens: maxTokens,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    }
    if (res.status === 429 || res.status === 503) {
      lastRateLimited = true;
      const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
      console.log(`callLLM ${res.status}, retry ${attempt + 1}/${retries} in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    throw new Error(`LLM API error: ${await res.text()}`);
  }
  if (lastRateLimited) throw rateLimitError("LLM API rate limited");
  throw new Error("LLM API retries exhausted");
}

async function embed(text: string, retries = 3): Promise<number[]> {
  let lastRateLimited = false;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({ content: { parts: [{ text }] }, outputDimensionality: 768 }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.embedding.values;
    }
    if (res.status === 429 || res.status === 503) {
      lastRateLimited = true;
      const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
      console.log(`embed ${res.status}, retry ${attempt + 1}/${retries} in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    throw new Error(`Embedding error: ${await res.text()}`);
  }
  if (lastRateLimited) throw rateLimitError("Embedding API rate limited");
  throw new Error("Embedding retries exhausted");
}

function reciprocalRankFusion(vecDocs: any[], ftsDocs: any[]): any[] {
  const vecMap = new Map(vecDocs.map((d: any, i: number) => [d.id, { ...d, vecRank: i }]));
  const ftsMap = new Map(ftsDocs.map((d: any, i: number) => [d.id, { ...d, ftsRank: i }]));

  const allIds = new Set([...vecMap.keys(), ...ftsMap.keys()]);
  const scored: { doc: any; rrfScore: number }[] = [];

  for (const id of allIds) {
    const v = vecMap.get(id);
    const f = ftsMap.get(id);
    const score = (v ? 1 / (RRF_K + v.vecRank) : 0) + (f ? 1 / (RRF_K + f.ftsRank) : 0);
    scored.push({ doc: v || f, rrfScore: score });
  }

  return scored.sort((a, b) => b.rrfScore - a.rrfScore).slice(0, FINAL_TOP_K).map((s) => s.doc);
}

async function rewriteQuery(history: { role: string; text: string }[], query: string): Promise<string> {
  const context = history.slice(-4).map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n");
  const rewritePrompt = [
    { role: "user", parts: [{ text: `Given this conversation and the latest user question, generate a concise standalone search query that captures the key entities and intent. Focus on specific terms that would match documentation. Output ONLY the search query, no explanation.\n\n${context ? `Recent conversation:\n${context}\n\n` : ""}Latest question: ${query}` }] },
  ];
  const result = await callLLM(rewritePrompt, 0.3, 256);
  return result.trim() || query;
}

async function fetchFallbackPrices(): Promise<Record<string, { usd: number }>> {
  try {
    const pairs = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT", "ADAUSDT"];
    const symbols = encodeURIComponent(JSON.stringify(pairs));
    const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbols=${symbols}`, {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return {};
    const data = await res.json();
    const map: Record<string, { usd: number }> = {};
    for (const item of data) {
      const sym = String(item.symbol || "").replace(/USDT$/i, "").toLowerCase();
      const num = parseFloat(item.price);
      if (sym && !isNaN(num)) map[sym] = { usd: num };
    }
    return map;
  } catch (e) {
    console.error("[chat] fallback price fetch failed", e);
    return {};
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const { query, livePrices, role, currentView, history } = await req.json();
    if (!query) throw new Error("Missing query");

    const isAdmin = role === "admin";

    // Step 1: rewrite query when there's prior history.
    let searchQuery = query;
    if (history && history.length) {
      try {
        searchQuery = (await rewriteQuery(history, query)).trim() || query;
      } catch (e) {
        console.error("[chat] rewrite failed, using raw query", e);
        searchQuery = query;
      }
    }

    // Step 2: hybrid retrieval (vector + FTS, merged via RRF).
    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await embed(searchQuery);
    } catch (e) {
      console.error("[chat] embedding failed, fall back to FTS-only", e);
      queryEmbedding = null;
    }

    let vecRaw: any[] = [];
    let ftsRawData: any[] = [];
    try {
      if (queryEmbedding) {
        const { data } = await supabase.rpc("match_documents", {
          query_embedding: queryEmbedding,
          match_count: HYBRID_TOP_K,
        });
        vecRaw = data || [];
      }
      const ftsRaw = await supabase.rpc("match_documents_fts", { query_text: searchQuery, match_count: HYBRID_TOP_K });
      ftsRawData = ftsRaw.data || [];
    } catch (e) {
      console.error("[chat] retrieval failed", e);
    }

    const merged = reciprocalRankFusion(vecRaw, ftsRawData);

    // Step 3: hide admin-only guides from non-admins.
    const filteredDocs = merged.filter((d: any) => {
      if (d.source === "guide" && (d.source_id?.startsWith("admin-") || d.title?.includes("Admin"))) {
        return isAdmin;
      }
      return true;
    });

    // Step 4: assemble context (docs + live prices + page + role).
    const contextBlock = filteredDocs.length
      ? filteredDocs.map((d: any, i: number) =>
          `[${i + 1}] Source: ${d.source} · ${d.title}\n${d.content.slice(0, 1500)}`
        ).join("\n\n---\n\n")
      : "";

    let fallbackPrices: Record<string, { usd: number }> | null = null;
    let resolvedPrices = livePrices && Object.keys(livePrices).length ? livePrices : null;
    if (!resolvedPrices) {
      try { fallbackPrices = await fetchFallbackPrices(); } catch (e) { console.error("[chat] fallback price fetch error", e); }
      resolvedPrices = fallbackPrices && Object.keys(fallbackPrices).length ? fallbackPrices : null;
    }

    const pricesBlock = resolvedPrices
      ? `Current live prices:\n${Object.entries(resolvedPrices).map(([k, v]) => `  ${k}: $${(v as any).usd ?? v}`).join("\n")}`
      : "";

    const systemContext = [
      `You are a knowledgeable crypto market assistant for the CryptoDash app. Answer naturally and thoroughly. If no documentation is available, rely on live prices and your own knowledge. Never output placeholder text like "[insert current price]" or "[...]" — if you do not have a real live price, say the price is currently unavailable instead.`,
      isAdmin ? "The user is an admin — you can discuss admin panel features." : "The user is a regular user or guest — do not reveal admin-specific features.",
      currentView ? `The user is currently on: ${currentView}` : "",
      contextBlock ? `Use these documents as your knowledge base:\n\n${contextBlock}` : "",
      pricesBlock,
    ].filter(Boolean).join("\n\n");

    // Step 5: generate the answer (with conversation history).
    const contents = [
      { role: "user", parts: [{ text: systemContext }] },
      ...(history || []).slice(-8).map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      })),
      { role: "user", parts: [{ text: query }] },
    ];

    let answer: string;
    let degradedAnswer = false;
    try {
      answer = await callLLM(contents, 0.8, 2048);
    } catch (e) {
      console.error("[chat] LLM failed, answering from RAG docs", e);
      degradedAnswer = true;
      answer = filteredDocs.length
        ? "Here is what I found in the docs:\n\n" +
          filteredDocs.slice(0, 3).map((d: any, i: number) => `**${d.title}**\n${d.content.slice(0, 700)}`).join("\n\n")
        : "The AI is temporarily unavailable. Please try again in a few moments.";
    }

    // Step 6: mark cited sources for the frontend.
    const citedIndices = new Set<number>();
    if (filteredDocs.length) {
      const citePattern = /\[(\d+)\]/g;
      let match;
      while ((match = citePattern.exec(answer)) !== null) {
        citedIndices.add(parseInt(match[1], 10));
      }
    }

    const sources = filteredDocs.map((d: any, i: number) => ({
      source: d.source,
      title: d.title,
      similarity: d.similarity,
      cited: citedIndices.has(i + 1),
    }));

    return new Response(JSON.stringify({ answer, sources, degraded: degradedAnswer }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[chat]", e);
    // Last resort: always return 200 with a usable answer — never 429/500 to frontend
    return new Response(JSON.stringify({
      answer: "I'm temporarily unavailable. Please try again shortly.",
      sources: [],
      degraded: true,
    }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
