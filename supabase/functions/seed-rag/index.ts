import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

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

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const guideDocs = [
  {
    id: "app-overview",
    title: "CryptoDash App Overview",
    content: "CryptoDash is a cryptocurrency market dashboard and news platform. Features: live prices from Binance WebSocket, interactive candlestick charts, personalized watchlist, news feed with admin CMS, user authentication with email verification, admin panel for content management. Tech stack: Vue 3, Vite, Supabase (PostgreSQL + Auth), Binance API, CoinGecko API. Users can browse markets, view coin details with charts, read news, create an account, manage a watchlist, and comment on articles. Admins can create and edit news articles, manage users, and configure settings.",
  },
  {
    id: "navigation",
    title: "Navigation & Routes",
    content: "Top navbar has links: Home, Markets, News, Watchlist, Login/Register, Admin (for admins only). Home (/) — market summary with top gainers/losers, featured news, quick stats. Markets (/markets) — sortable table of all tracked coins with price, 24h change, volume, market cap. Click a coin to see its detail page. Coin Detail (/coin/:id) — interactive candlestick chart with MA/EMA indicators, price stats, description, related news. News (/news) — filterable grid of articles by category and tags. News Detail (/news/:id) — full article with comments section. Watchlist (/watchlist) — shows your saved coins with live prices. Requires login. Profile (/profile) — manage account info. Requires login. Admin Panel (/admin) — dashboard, news CMS (create/edit/delete), user management, settings. Requires admin role.",
  },
  {
    id: "features",
    title: "Features & How To Use",
    content: "Live Prices: prices update automatically via Binance WebSocket. Green arrow for price up, red for down. No manual refresh needed. Charts: OHLCV candlestick charts with configurable Moving Average (MA) and Exponential Moving Average (EMA) indicators. Timeframes: 1m, 5m, 15m, 1h, 4h, 1d. Watchlist: click the star icon on any coin to add or remove from watchlist. View saved coins under /watchlist. Search: use the search bar to find coins by name or symbol. News: browse articles filtered by category or tags. Like articles to save reactions. Comment on articles (requires login). Authentication: register with email, verify via confirmation link, set password. Login to access watchlist, comments, and profile. Admin: access /admin to write/edit/delete news with TipTap rich-text editor, manage users, view dashboard stats.",
  },
  {
    id: "crypto-basics",
    title: "Crypto Market Terms",
    content: "Price: current trading price in USD. Updates in real-time via Binance. 24h Change: percentage price change over the last 24 hours. Market Cap: total value = current price × circulating supply. Volume (24h): total trading volume in the last 24 hours. All-Time High (ATH): highest price ever reached. Candlestick Chart: shows open, high, low, close prices per time period. Green = price up, red = price down. MA (Moving Average): average price over N periods to smooth price data. EMA (Exponential Moving Average): similar to MA but gives more weight to recent prices.",
  },
];

serve(async () => {
  try {
    // Step 1 — fetch top 250 coins from CoinGecko
    const marketsRes = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false",
    );
    if (!marketsRes.ok) throw new Error(`CoinGecko markets API: ${marketsRes.status}`);
    const markets = await marketsRes.json();

    // Step 2 — fetch rich descriptions for top 30 (handle partial failure)
    const top30Ids = markets.slice(0, 30).map((m: any) => m.id);
    const descResults = await Promise.allSettled(
      top30Ids.map((id: string) =>
        fetch(`https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`)
          .then((r) => r.ok ? r.json() : null)
      ),
    );
    const descMap = new Map<string, string>();
    for (const result of descResults) {
      if (result.status === "fulfilled" && result.value?.id && result.value?.description?.en) {
        descMap.set(result.value.id, result.value.description.en.replace(/<[^>]+>/g, " ").slice(0, 2000));
      }
    }

    // Step 3 — index all coins
    for (const m of markets) {
      const description = descMap.get(m.id) || `${m.name} (${m.symbol.toUpperCase()}) is a cryptocurrency.`;

      await supabase.from("documents").upsert({
        source: "coin",
        source_id: m.id,
        title: m.name,
        content: [
          `Coin: ${m.name} (${m.symbol.toUpperCase()})`,
          `Description: ${description}`,
          `Current Price: $${m.current_price?.toLocaleString() ?? "N/A"}`,
          `Market Cap: $${(m.market_cap / 1e9).toFixed(2)}B`,
          `24h Change: ${m.price_change_percentage_24h?.toFixed(2) ?? "N/A"}%`,
          `24h Volume: $${(m.total_volume / 1e9).toFixed(2)}B`,
          `All-Time High: $${m.ath?.toLocaleString() ?? "N/A"}`,
        ].join("\n"),
      }, { onConflict: "source,source_id" });
    }

    // Step 4 — index news
    const { data: news } = await supabase.from("news").select("id, title, summary, content");
    for (const a of news || []) {
      await supabase.from("documents").upsert({
        source: "news",
        source_id: String(a.id),
        title: a.title,
        content: `${a.title}. ${a.summary || ""} ${(a.content || "").replace(/<[^>]+>/g, " ")}`.slice(0, 5000),
      }, { onConflict: "source,source_id" });
    }

    // Step 5 — index app guide
    for (const doc of guideDocs) {
      await supabase.from("documents").upsert({
        source: "guide",
        source_id: doc.id,
        title: doc.title,
        content: doc.content,
      }, { onConflict: "source,source_id" });
    }

    // Step 6 — generate embeddings for docs without them
    const { data: docs } = await supabase
      .from("documents")
      .select("id, content")
      .is("embedding", null);

    let indexed = 0;
    for (const doc of docs || []) {
      const embedding = await embed(doc.content);
      await supabase.from("documents").update({ embedding }).eq("id", doc.id);
      indexed++;
    }

    return new Response(JSON.stringify({
      coins: markets.length,
      news: news?.length || 0,
      guides: guideDocs.length,
      indexed,
    }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[seed-rag]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
  }
});
