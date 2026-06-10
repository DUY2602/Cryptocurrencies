import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

async function embed(text: string): Promise<number[]> {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
    body: JSON.stringify({ content: { parts: [{ text }] } }),
  });
  if (!res.ok) throw new Error(`embedding failed: ${await res.text()}`);
  const data = await res.json();
  return data.embedding.values;
}

async function groqChat(prompt: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`groq failed: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const { query, livePrices, role, currentView } = await req.json();
    if (!query) throw new Error("Missing query");

    const embedding = await embed(query);

    const { data: docs } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_count: 5,
    });

    const context = docs?.length
      ? docs.map((d: any) => `[${d.source}] ${d.title}: ${d.content}`).join("\n\n")
      : "No relevant documents found.";

    const pricesContext = livePrices && Object.keys(livePrices).length
      ? `Current live prices:\n${Object.entries(livePrices).map(([k, v]) => `  ${k}: $${(v as any).usd ?? v}`).join("\n")}`
      : "";

    const userContext = [
      role ? `User role: ${role}` : "",
      currentView ? `User is currently viewing: ${currentView}` : "",
    ].filter(Boolean).join("\n");

    const systemPrompt = `You are a helpful crypto market assistant for the CryptoDash app. Answer based on the provided documents, live prices, and user context. Be concise and practical.${role === "admin" ? " The user is an admin — you can refer them to the admin panel for managing content." : ""}`;

    const prompt = [
      systemPrompt,
      userContext && `---\n${userContext}`,
      "---\nDocuments:",
      context,
      pricesContext && `---\n${pricesContext}`,
      `---\nQuestion: ${query}`,
    ].filter(Boolean).join("\n\n");

    const answer = await groqChat(prompt);

    const sources = (docs || []).map((d: any) => ({
      source: d.source,
      title: d.title,
      similarity: Math.round(d.similarity * 100),
    }));

    return new Response(JSON.stringify({ answer, sources }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[chat]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
