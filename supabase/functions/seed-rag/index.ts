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
  { id: "app-overview", title: "CryptoDash App Overview", content: `CryptoDash is a cryptocurrency market dashboard and news platform. Tech stack: Vue 3, Vite, Vue Router 5, Bootstrap 5, Supabase (PostgreSQL + Auth + Edge Functions), Binance WebSocket/REST, CoinGecko API, TipTap (rich text editor), Lightweight Charts, DOMPurify, marked, bcryptjs, Google Gemini AI. Key features: live prices via Binance WebSocket, interactive candlestick charts with MA/EMA, personalized watchlist, news feed from CoinDesk RSS (hourly), AI Assistant with RAG (Gemini), admin CMS for news/users/settings, dark/light theme. Color scheme: dark theme with accent purple (#667eea, #764ba2) and gold (#f0b90b).` },
  { id: "nav-topbar", title: "Top Navigation Bar", content: `The top navigation bar (Navbar.vue) is sticky and always visible. Left: "CryptoDash" brand/logo → /. Nav links: Home → /, Markets → /markets, News → /news, About → /about, Watchlist → /watchlist (logged in). Right: ThemeToggle, user dropdown (Profile, Admin if admin, Logout) or Login button. Mobile: hamburger menu. Admin badge for admin users.` },
  { id: "nav-footer", title: "Footer", content: `Footer.vue - simple bar. Shows "CryptoDash" + "COS30043 · Swinburne University" + copyright year. mt-auto layout.` },
  { id: "nav-routes", title: "All Routes", content: `Public: / (Home), /markets, /coin/:id, /news, /news/:id, /about, /set-password. Guest-only: /login, /register. Auth: /profile, /watchlist. Admin: /admin, /admin/news, /admin/news/:id, /admin/users, /admin/settings. Navigations: requiresAuth → /login?redirect=, guestOnly → /, requiresAdmin → locked.` },
  { id: "page-home", title: "Home Page", content: `Landing page /. Hero: "Track Every Move" + stat pills + CTA to /markets, /news. Sections: Market at a Glance (3 StatCards), Trending Now (6 volatile coins), Top by Volume, Latest News (3 cards), Global Crypto Adoption (GeoJSON canvas map). Live WebSocket price flash.` },
  { id: "page-markets", title: "Markets Page", content: `Go to /markets (click "Markets" in navbar). Banner with counts. Search bar, sort dropdown (market cap/price/gainers/losers). Table: rank, coin+image+name+symbol, live price flash, 24h change arrow, sparkline, volume, market cap, star ★, Trade link. 20/page pagination. Star to add watchlist.` },
  { id: "page-coindetail", title: "Coin Detail Page", content: `Go to /coin/:id from /markets or home. Header: image, name+sym, Live badge, star ★. Chart (Lightweight Charts): timeframes 1s-1w, indicators Price/MA/EMA/Vol, real-time WebSocket. StatCards: Market Cap, Volume, High, Low + sentiment 68/32. About: CoinGecko description.` },
  { id: "page-watchlist", title: "Watchlist Page", content: `Go to /watchlist. Starred coins in table. Star on /markets/home/coin/:id to add. Empty: "Watchlist is empty" + Browse Markets. Auth: Supabase, guests: localStorage.` },
  { id: "page-news", title: "News Page", content: `Go to /news. Hero + featured article. Category filter buttons. Article grid 3-col: image, category, date, title, source, read time, summary, tags, ❤️ like. Search + pagination 9/page.` },
  { id: "page-newsdetail", title: "News Detail Page", content: `/news/:id. Hero image, category badge, read time, title, author, date, source. HTML content. Tag pills. ❤️ like. Comments: view, post (login), delete own. Related articles.` },
  { id: "page-login", title: "Login Page", content: `/login (guest-only). Card "Login" / "Sign in to your account". Email + password fields with 👁️ toggle. "Sign in" button (spinner when loading). Validation: email format, password non-empty. Link to /register. Success: redirect ?redirect= or /. Error: alert 5s.` },
  { id: "page-register", title: "Register Page", content: `/register (guest-only). Card "Register" / "Create your account with email verification". Name (optional) + email fields. "Send verification email" button. Validation: email regex. Success: "check your email" → redirect /login after 3s. Then email verification link → /set-password. Set password (min 6 chars) + confirm → "Set password" → redirect home.` },
  { id: "page-setpassword", title: "Set Password Page", content: `/set-password (reached via email link). Password + confirm fields, 👁️ toggle, min 6 chars. "Set password" button. Success: redirect / after 2s.` },
  { id: "page-profile", title: "Profile Page", content: `/profile (auth-required). Shows name, email, link to /watchlist, Logout button.` },
  { id: "page-about", title: "About Page", content: `/about. Tech stack: Vue 3, Vite, Vue Router, Bootstrap, JS. Interactive demo: first+last name + coin selector → welcome message. Cosmetic only.` },
  { id: "ai-assistant", title: "AI Assistant", content: `Click 💬 bottom-right. Panel: "Crypto Assistant" header, messages, quick prompts (Market summary, Explain BTC), text input. Powered by Gemini 2.5 Flash Lite via Edge Function. Answers include markdown + cited sources.` },
  { id: "workflow-auth", title: "Auth Workflow", content: `Register: /register → email+name → temp password → signUp(emailRedirectTo=/set-password) → upsert profile role=user → verification email → redirect /login 3s. Set password: click email → /set-password → updateUser({password}) + bcrypt hash → redirect /. Login: /login → signInWithPassword → redirect. Logout: navbar or /profile → signOut → home. Session onAuthStateChange. Guest-only: /login,/register. Auth: /profile,/watchlist.` },
  { id: "workflow-watchlist", title: "Watchlist Workflow", content: `Star ★ toggles favorite. Auth: Supabase watchlist table. Guests: localStorage. /watchlist shows saved coins. Empty: "Watchlist is empty" + CTA.` },
  { id: "workflow-comments", title: "Comments Workflow", content: `View on /news/:id. Post: login required. Delete: × on own comments only (RLS).` },
  { id: "faq-live-prices", title: "FAQ Live Prices", content: `Q: How? Binance WebSocket + REST fallback 3s, reconnect backoff max 8. Q: Tracked? USDT pairs except stablecoins/leveraged. Q: Flash? Green/red pulse. Q: Delay? ~1s.` },
  { id: "faq-chart", title: "FAQ Charts", content: `Q: View? /coin/:id. Q: Library? Lightweight Charts. Q: Timeframes? 1s-1w. Q: Indicators? MA, EMA, Vol. Q: Real-time? Yes via WebSocket.` },
  { id: "faq-auth", title: "FAQ Auth", content: `Q: Create account? /register → email → verification → /set-password. Q: No email? Check spam. Q: Forgot password? Not implemented. Q: Become admin? Admin promotes via /admin/users or SQL.` },
  { id: "faq-general", title: "FAQ General", content: `Q: Add watchlist? Star ★ on any coin. Q: AI? 💬 bottom-right. Q: Theme? Sun/moon toggle in navbar. Q: Mobile? Responsive Bootstrap. Q: Navigate? Top navbar.` },
];

serve(async () => {
  try {
    for (const doc of guideDocs) {
      await supabase.from("documents").upsert({
        source: "guide",
        source_id: doc.id,
        title: doc.title,
        content: doc.content,
      }, { onConflict: "source,source_id" });
    }

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
      guides: guideDocs.length,
      indexed,
    }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("[seed-rag]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
  }
});
