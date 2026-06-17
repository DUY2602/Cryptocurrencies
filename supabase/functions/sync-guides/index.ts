import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function embed(text: string, retries = 5): Promise<number[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({ content: { parts: [{ text }] } }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.embedding.values;
    }
    const body = await res.text();
    const delay = res.status === 429
      ? Math.max(parseInt(body.match(/retry in (\d+)/i)?.[1] || "30", 10), 5) * 1000
      : (attempt + 1) * 3000;
    console.log(`embed ${res.status}, retry ${attempt + 1}/${retries} in ${delay}ms`);
    await new Promise((r) => setTimeout(r, delay));
  }
  throw new Error("embedding exhausted retries");
}

serve(async () => {
  try {
    const { data: guides } = await supabase.from("guides").select("*");
    if (!guides?.length) throw new Error("No guides found in guides table");

    for (const g of guides) {
      await supabase.from("documents").upsert({
        source: "guide",
        source_id: g.id,
        title: g.title,
        content: g.content,
        metadata: { category: g.category },
      }, { onConflict: "source,source_id" });
    }

    const { data: docs } = await supabase
      .from("documents")
      .select("id, content")
      .is("embedding", null)
      .eq("source", "guide");

    let indexed = 0;
    for (const doc of docs || []) {
      const embedding = await embed(doc.content);
      await supabase.from("documents").update({ embedding }).eq("id", doc.id);
      indexed++;
    }

    return new Response(JSON.stringify({ guides: guides.length, indexed }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[sync-guides]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
