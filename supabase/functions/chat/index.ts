import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

async function geminiChat(prompt: string): Promise<string> {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini failed: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
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

    const isAdmin = role === "admin";
    const filteredDocs = (docs || []).filter((d: any) => {
      if (d.source === "guide" && (d.id?.startsWith("admin-") || d.title?.includes("Admin"))) {
        return isAdmin;
      }
      return true;
    });

    const context = filteredDocs.length
      ? filteredDocs.map((d: any) => `[${d.source}] ${d.title}: ${d.content}`).join("\n\n")
      : "No relevant documents found.";

    const pricesContext = livePrices && Object.keys(livePrices).length
      ? `Current live prices:\n${Object.entries(livePrices).map(([k, v]) => `  ${k}: $${(v as any).usd ?? v}`).join("\n")}`
      : "";

    const userContext = [
      role ? `User role: ${role}` : "",
      currentView ? `User is currently viewing: ${currentView}` : "",
    ].filter(Boolean).join("\n");

    const systemPrompt = `You are a knowledgeable crypto market assistant for the CryptoDash app. Answer questions thoroughly and informatively based on the provided documents, live prices, and user context. Provide explanation, context, and data to support your answers. Use markdown formatting (**bold**, lists, headings, \`code\`) for readability.${isAdmin ? " The user is an admin — you can refer them to the admin panel for managing content. You can reveal admin-specific features and workflows." : " The user is a regular user or guest — do NOT reveal admin-specific features, internal workflows, or configuration details. Keep answers focused on public features."}`;

    const prompt = [
      systemPrompt,
      userContext && `---\n${userContext}`,
      "---\nDocuments:",
      context,
      pricesContext && `---\n${pricesContext}`,
      `---\nQuestion: ${query}`,
    ].filter(Boolean).join("\n\n");

    const answer = await geminiChat(prompt);

    const sources = filteredDocs.map((d: any) => ({
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
