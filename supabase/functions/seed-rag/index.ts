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
  { id: "nav-topbar", title: "Top Navigation Bar (Navbar)", content: `Navbar.vue - sticky top navigation. Left: brand logo + "CryptoDash" links to /, nav links: Home, Markets, News, About, Watchlist. Right: ThemeToggle, user dropdown (Profile, Admin if admin, Logout) or Login button for guests. Bootstrap 5 collapse for mobile, auto-closes on route change. Admin badge shown if user has admin role.` },
  { id: "nav-footer", title: "Footer", content: `Footer.vue - simple bar at bottom. Shows brand + "CryptoDash" + "COS30043 · Swinburne University" + dynamic copyright year. mt-auto layout pushes it down.` },
  { id: "nav-routes", title: "All Routes & Pages", content: `Public: / (Home), /markets (Markets), /coin/:id (CoinDetail), /news (News), /news/:id (NewsDetail), /about (About), /set-password (SetPassword). Guest-only: /login, /register. Auth-required: /profile, /watchlist. Admin-required: /admin (Dashboard), /admin/news (CMS), /admin/news/:id (Editor), /admin/users (Users), /admin/settings (Settings). Navigation guard: requiresAuth redirects to /login?redirect=, guestOnly redirects to /, requiresAdmin renders locked screen.` },
  { id: "page-home", title: "Home Page /", content: `Full hero: "Track Every Move" title, stat pills (100+ Coins, 24/7 Live, Free), CTA to /markets and /news. Sections: "Market at a Glance" (3 StatCards: tracked coins, market cap, avg change from top 50), "Trending Now" (6 most volatile coins with TransitionGroup animation), "Top by Volume" (MarketOverviewCards grid), "Latest News" (3 news cards), "Global Crypto Adoption" (canvas map with GeoJSON, colored by adoption level, hover tooltip). Data: api.getTrendingCoins(), api.getTopCoins(50), fetchNews({page:1, pageSize:3}). Live WebSocket merge with flash animation.` },
  { id: "page-markets", title: "Markets Page /markets", content: `PageHero banner with total coins/gainers/losers. SearchBar (filter by name/symbol), SortSelect (market cap, price, gainers, losers). CoinTable: rank, coin+image, price with live flash, 24h change arrow, sparkline chart, volume, market cap, actions (star + Trade link). Pagination 20/page. Empty: "No matches". Data: api.getTopCoins(100) + WebSocket live merge.` },
  { id: "page-coindetail", title: "Coin Detail Page /coin/:id", content: `Header: coin image, name, symbol, LiveBadge, FavoriteButton. CoinDashboard chart (Lightweight Charts): timeframe selector 1s-1w, indicators Price/MA/EMA/Vol, crosshair tooltip, responsive resize, real-time WebSocket updates. Bottom: StatCards (Market Cap, Volume, High, Low) + Sentiment bar (68/32 static). About section: CoinGecko description (1000 chars). Loading: spinner. Not found: EmptyState "Coin not found" with back link.` },
  { id: "page-watchlist", title: "Watchlist Page /watchlist", content: `Shows user's favorited coins in CoinTable layout. Filters api.getTopCoins(50) by watchlist IDs. Empty: "Watchlist is empty" with "Browse Markets" button. Auth users: synced to Supabase watchlist table. Guests: localStorage.` },
  { id: "page-news", title: "News Page /news", content: `Hero banner "Crypto News". SearchBar searches title/summary/content/category/date/source/tags. Featured article: large card with image, badge, category, title, summary, author, date, read time. Category filter buttons with count badges. Article grid 3 columns: image, category, date, title, source, read time, summary, 2 tags, NewsLikeButton. Pagination 9/page. Empty: "No articles match your search." Data: fetchNews() from Supabase news table.` },
  { id: "page-newsdetail", title: "News Detail Page /news/:id", content: `Hero image, category badge, read time, title. Author section: avatar, name, date, source. Full HTML content (sanitized). Clickable tag links → /news?q=tag. NewsLikeButton + source link. Comments: list with username/date/text, delete own comments, post form (login required). Related articles by category/tag match. Loading: spinner. Not found: EmptyState.` },
  { id: "page-login", title: "Login Page /login", content: `Guest-only. Email + password inputs with show/hide toggle. Submit button with spinner. Error alert auto-dismiss 5s. Link to /register. On success: redirect to ?redirect= or /. Uses useAuth().login().` },
  { id: "page-register", title: "Register Page /register", content: `Guest-only. Name (optional) + email inputs. "Send verification email" button. Generates temp password, calls supabase.auth.signUp with emailRedirectTo=/set-password, upserts profile with role='user'. Success: message + redirect /login after 3s.` },
  { id: "page-setpassword", title: "Set Password Page /set-password", content: `Reached via email link. Password + confirm inputs, show/hide toggles, min 6 chars. Calls supabase.auth.updateUser({password}), upserts profile with name + bcrypt hash. Success: redirect / after 2s.` },
  { id: "page-profile", title: "Profile Page /profile", content: `Auth-required. Shows email, name, link to /watchlist, Logout button. Uses useAuth().user.` },
  { id: "page-about", title: "About Page /about", content: `Tech stack list (Vue 3, Vite, Router, Bootstrap, JS). Interactive demo: first + last name inputs, coin selector (BTC/ETH), dynamic welcome message. Cosmetic only, no data saved.` },
  { id: "admin-layout", title: "Admin Panel Layout", content: `All /admin/* routes share AdminLayout. Left sidebar: Dashboard, News CMS, Users, Settings. Topbar: page title, realtime connection pill (live/connecting/disconnected), + New article button. Bottom: user card (avatar initial, name, email, Site link, Logout). Permission gate: locked screen if not admin with SQL promotion instructions.` },
  { id: "admin-dashboard", title: "Admin Dashboard /admin", content: `KPI cards: total articles, featured, trending, this week. Category bar chart. Top authors ranked #1-#5 with avatars. Recent articles clickable list. Footer stats: total words, avg words/article, unique categories, unique authors. Realtime auto-refresh on news table changes.` },
  { id: "admin-news-list", title: "Admin News CMS /admin/news", content: `Full article table: thumbnail, title, summary, category badge, author, date, featured/trending badges. Actions: Preview (public view), Edit, Delete (confirmation modal). Search by title/summary/author/tags. Category filter. + New Article button → /admin/news/new. "Import from CoinDesk" button calls fetch-news Edge Function. Realtime auto-refresh.` },
  { id: "admin-news-editor", title: "Admin News Editor /admin/news/:id", content: `GDocs-style. Topbar: back, title, save status (unsaved/saved), word count, preview toggle, metadata toggle, view on site link, Save button. Editor: title input, summary textarea (auto-generate, 240 char limit), TipTap rich text (bold, italic, underline, strike, H1-H4, lists, blockquote, code, link, image up to 2MB, undo/redo, word count). Preview panel: rendered article. Metadata panel: category, tags (max 12), cover image URL, author, source, featured/trending toggles, read time slider. Validation: title min 8, body min 20 chars. Dirty state beforeunload protection.` },
  { id: "admin-users", title: "Admin Users /admin/users", content: `Stats: total/admins/users counts. Search by name/ID/role. User table: avatar initial, name, email, "you" badge, join date, role badge, Promote/Demote buttons (with confirmation). Self-demotion prevented. Read-only for non-admins.` },
  { id: "admin-settings", title: "Admin Settings /admin/settings", content: `Database status: connection, news count, profiles count, last check, re-check button. Account: name, role, refresh. Preferences: dark theme toggle, clear localStorage. RAG section: "Coming soon" placeholder.` },
  { id: "comp-cointable", title: "CoinTable Component", content: `CoinTable.vue - sortable coin table. Columns: rank, coin+image+name+symbol, price with flash, 24h change arrow, sparkline, volume, market cap, star+Trade. Sorting: market cap/price/gainers/losers. Search filtering via SearchBar. Props: coins array. Live price merge applied. Component file: src/components/CoinTable.vue` },
  { id: "comp-coincard", title: "CoinCard Component", content: `CoinCard.vue - compact card. Shows image, name, symbol, price with arrow, 24h change. Clickable → /coin/:id. Hover lift effect. Used on Home trending section.` },
  { id: "comp-coindashboard", title: "CoinDashboard Chart Component", content: `CoinDashboard.vue - OHLCV chart using Lightweight Charts. Timeframes: 1s,1m,5m,15m,1h,4h,12h,1d,1w. Indicators: Price, MA, EMA, Vol. Crosshair tooltip. Responsive. Real-time WebSocket stream. Bottom: StatCards (Market Cap, Volume, High, Low) + sentiment bar 68/32. Data: Binance klines API + WebSocket. Error: overlay with retry.` },
  { id: "comp-livebadge", title: "LiveBadge Component", content: `LiveBadge.vue - animated pulsing green dot + "Live". Shown when WebSocket connected. Used on CoinDetail, Admin topbar.` },
  { id: "comp-favoritebutton", title: "FavoriteButton Component", content: `FavoriteButton.vue - star toggle. Props: coinId, size (sm/md/lg). Filled ★ = saved, empty ☆ = not. Uses useWatchlist: Supabase for auth, localStorage for guests. Used on Markets, CoinDetail, Home.` },
  { id: "comp-newslikebutton", title: "NewsLikeButton Component", content: `NewsLikeButton.vue - like toggle for news. Props: articleId. Shows ❤️ Liked / 🤍 Like. Uses useReactions: Supabase news_likes (auth) or localStorage (guests). Used on News cards, NewsDetail.` },
  { id: "comp-searchbar", title: "SearchBar Component", content: `SearchBar.vue - search input with magnifying glass icon, clear X button. Props: modelValue, label, placeholder. Used on Markets, News, Admin pages.` },
  { id: "comp-pagination", title: "Pagination Component", content: `Pagination.vue - page nav. Props: currentPage, totalPages. Emits: page-change. Prev/next + page numbers with ellipsis. Disabled states. Used on Markets, News.` },
  { id: "comp-themetoggle", title: "ThemeToggle Component", content: `ThemeToggle.vue - sun/moon toggle. Uses useTheme: localStorage 'theme' key, data-theme on <html>, CSS variables, default dark. Smooth CSS transitions.` },
  { id: "comp-prices", title: "Live Prices & PriceWithArrow", content: `livePrices.js service: singleton subscription manager with ref counting. start(coins), stop(), getLatest(), applyLiveFlashes(). PriceWithArrow.vue: props price/flash/pulse/size/inline, formats price, shows green↑/red↓ arrow with pulsing flash. WebSocket (websocket.js): Binance stream !miniTicker@arr, REST polling fallback 3s, reconnect exponential backoff max 8.` },
  { id: "comp-richtexteditor", title: "RichTextEditor (TipTap)", content: `RichTextEditor.vue - WYSIWYG editor. Extensions: StarterKit (bold, italic, H1-H4, lists, blockquote, code, hr), Underline, Link, Image (URL/paste/drag/upload max 2MB), Placeholder. Toolbar with icons. Word/char counter. v-model. HTML sanitized server-side via DOMPurify.` },
  { id: "comp-pagehero", title: "PageHero Component", content: `PageHero.vue - full-width banner with /hero.jpg background, dark overlay, title, subtitle. Used on Markets, Watchlist, About, News.` },
  { id: "comp-loading-emptystate", title: "LoadingSpinner & EmptyState", content: `LoadingSpinner.vue - centered spinner with message prop, CSS .spinner-crypto. Used on all pages during fetch. EmptyState.vue - placeholder for empty/error. Props: icon, title, message. Default slot for action buttons. Used on Markets ("No matches"), CoinDetail ("Coin not found"), Watchlist ("empty"), NewsDetail ("not found").` },
  { id: "comp-binancesparkline", title: "BinanceSparkline Component", content: `BinanceSparkline.vue - canvas sparkline. Props: trend (up/down), width, height. Random-walk line with green/red gradient. Used in CoinTable rows.` },
  { id: "comp-statcard", title: "StatCard Component", content: `StatCard.vue - stat display. Props: label, value, changeClass. Used on Home "Market at a Glance", CoinDetail stats.` },
  { id: "comp-radarmap", title: "RadarMap (Adoption Map)", content: `RadarMap.vue (components/geo/) - world map canvas with GeoJSON. Colors by Chainalysis 2025 adoption level. Hover tooltip: country, rank, score, level. Legend. Data: src/data/adoptionIndex.json. Used on Home page.` },
  { id: "composable-liveprices", title: "useLivePrices Composable", content: `useLivePrices.js - component-level composable. Exports: liveData ref, isLive ref, applyLive(coin). Calls livePrices.start() on mount, stop() on unmount. Used by Home, Markets, CoinDetail, Watchlist.` },
  { id: "ai-assistant", title: "AI Assistant (Chatbot)", content: `AiAssistant.vue - floating 💬 button bottom-right. Panel: "Crypto Assistant" header, message area, quick prompts ("Market summary", "Explain BTC"), text input. Flow: user query → collect livePrices + role + route → supabase.functions.invoke('chat') → Edge Function embeds query (Gemini), match_documents() vector search (top 5), builds prompt with context + prices, Gemini 2.5 Flash Lite generates answer. Returns {answer (markdown), sources}. Renders via marked.js + DOMPurify. Sources shown with similarity %. Welcome message. Role-aware.` },
  { id: "ai-rag-system", title: "RAG System", content: `Retrieval-Augmented Generation. Documents table: id, source ('coin'|'news'|'guide'), source_id, title, content, embedding vector(768), created_at. Unique (source,source_id). HNSW index. match_documents(query_embedding, match_count) using cosine distance. Seed process: fetch 250 CoinGecko coins, fetch top 30 descriptions, index coin data (name, symbol, price, market cap, change, volume, ATH, description), index all news from news table (title + summary + content), index guide docs (~40 items covering pages, components, workflows, admin, FAQ). Generate embeddings via Gemini Embedding-001 for docs without them. Note: coin prices in docs are snapshots; live prices come separately in chat requests.` },
  { id: "workflow-auth", title: "Authentication Workflow", content: `REGISTER: /register → email + name → generate temp password → supabase.auth.signUp({emailRedirectTo:/set-password}) → upsert profile role='user' → email sent → redirect /login after 3s. SET PASSWORD: click email link → /set-password → new password min 6 chars → supabase.auth.updateUser → upsert profile bcrypt hash → redirect /. LOGIN: /login → email + password → supabase.auth.signInWithPassword → redirect ?redirect= or /. LOGOUT: dropdown or profile → supabase.auth.signOut → user=null → redirect /. SESSION: on load supabase.auth.getSession(), onAuthStateChange listener keeps user ref synced. useAdmin watches user.id for role. useWatchlist/useReactions switch between Supabase and localStorage.` },
  { id: "workflow-watchlist", title: "Watchlist Workflow", content: `Star icon on any coin toggles favorite. Auth: saves to Supabase watchlist table (user_id, coin_id). Guests: localStorage 'watchlist_ids'. Watchlist page /watchlist shows saved coins in CoinTable. Empty: "Watchlist is empty" with CTA. useWatchlist composable: watchlistIds, isFavorite, toggleFavorite, removeFavorite.` },
  { id: "workflow-news-cms", title: "News CMS Workflow (Admin)", content: `AUTO: Supabase cron hourly → fetch-news Edge Function → CoinDesk RSS → parse XML → Gemini expand short content → deduplicate by source_url → insert into news table. Also callable via "Import from CoinDesk" button. MANUAL: /admin/news → New Article → TipTap editor → title (min 8), summary (max 240), body (min 20), optional metadata (category, tags max 12, image, author, source, featured/trending, read time) → Save. EDIT: click Edit → modify → auto-save indicator → Preview toggle → Save. DELETE: trash icon → confirmation modal → delete (cascade comments/likes). Realtime auto-refresh.` },
  { id: "workflow-comments", title: "Comments Workflow", content: `VIEW: all users see comments on /news/:id (username, date, text, oldest first). POST: login required → textarea → supabase.comments insert (article_id, user_id, user_name, text). DELETE: × button on own comments only (RLS auth.uid()). Cache: localStorage.` },
  { id: "workflow-errors", title: "Error Handling Patterns", content: `Pattern 1: inline error alert (Markets, News, Admin). Pattern 2: EmptyState with error + back button (CoinDetail "not found", NewsDetail "not found"). Pattern 3: try/catch console.log + error state. Pattern 4: chart error overlay with retry. Pattern 5: WebSocket reconnect exponential backoff max 8 + REST polling fallback. Pattern 6: permission locked screen for non-admins, read-only banners. Pattern 7: form validation inline (email format, password min 6/match, title min 8, body min 20, max 12 tags, image URL).` },
  { id: "faq-live-prices", title: "FAQ - Live Prices", content: `Q: How do live prices work? A: Binance WebSocket !miniTicker@arr with REST poll fallback 3s, reconnect exponential backoff max 8. Q: Symbols tracked? A: All USDT pairs except stablecoins and leveraged tokens. Q: Why flash green/red? A: Price change pulse animation. Q: Delay? A: Near real-time (~1s).` },
  { id: "faq-chart", title: "FAQ - Charts", content: `Q: Library? A: Lightweight Charts. Q: Timeframes? A: 1s,1m,5m,15m,1h,4h,12h,1d,1w. Q: Indicators? A: MA, EMA, Volume. Q: Real-time? A: Yes via WebSocket stream.` },
  { id: "faq-auth", title: "FAQ - Authentication", content: `Q: Create account? A: /register → email → verification email → set password. Q: No email? A: Check spam. Q: Forgot password? A: Not implemented, contact admin. Q: Use without login? A: Yes for browsing, need login for watchlist/comments/likes. Q: Become admin? A: Ask admin via /admin/users or SQL UPDATE.` },
  { id: "faq-data-sources", title: "FAQ - Data Sources", content: `Q: Coin data? A: CoinGecko API + Binance WebSocket/REST. Q: News? A: CoinDesk RSS hourly + Gemini expansion. Q: How current? A: Prices near real-time, news hourly, CoinGecko every few minutes. Q: Adoption map? A: Chainalysis 2025 data with GeoJSON canvas render.` },
  { id: "faq-general", title: "FAQ - General", content: `Q: Add to watchlist? A: Star icon on any coin. Q: AI Assistant? A: 💬 button bottom-right. Q: Theme? A: Sun/moon toggle on navbar, saved in localStorage. Q: Mobile? A: Responsive Bootstrap, no dedicated app. Q: Share articles? A: Copy URL from browser. Q: Built by? A: COS30043 Swinburne University.` },
  { id: "service-api", title: "API Service (api.js)", content: `api.js - main API facade. Orchestrates CoinGecko + Binance data. Exports: api.getTopCoins(perPage=50) - fetches sorted coin list from CoinGecko markets endpoint, returns id, name, symbol, price, marketCap, volume24h, change24h, image, circulatingSupply. api.getTrendingCoins() - fetches 6 coins, sorts by abs(24h change). api.getCoinById(id) - fetches single coin detail from CoinGecko + Binance ticker overlay for live price override. Uses mapCoin() to normalize CoinGecko response. Maps Binance ticker onto coin detail for price/change/volume. File: src/services/api.js` },
  { id: "service-coingecko", title: "CoinGecko Service (coingecko.js)", content: `coingecko.js - CoinGecko API client with 5-minute cache. Exports: fetchCoinMeta(symbols) - batch fetch metadata for given symbols. fetchMarketCaps(coinList) - market cap data. fetchCoinImages(coinList) - image URLs. refreshCoinMeta(coins) - refresh cached metadata. Cache keyed by 'coingecko_meta' in module scope Map with 5min TTL. Dev proxy: /api/coingecko → https://api.coingecko.com. File: src/services/coingecko.js` },
  { id: "service-binance", title: "Binance Service (binance.js)", content: `binance.js - Binance 24hr ticker API with 60s cache. Fetches from https://api.binance.com/api/v3/ticker/24hr. Exports: fetchUsdtTickers({useCache=true}) - returns all USDT trading pairs excluding stablecoins (USDC, BUSD, DAI, FDUSD, TUSD, USDD) and leveraged tokens (UP/DOWN/BEAR/BULL). findUsdtTicker(tickers, idOrSymbol) - find specific ticker. parseUsdtTicker(row) - normalize Binance response. Each ticker: symbol, price, change24h, volume24h, high24h, low24h. Dev proxy: /api/binance → https://api.binance.com. File: src/services/binance.js` },
  { id: "service-websocket", title: "WebSocket Service (websocket.js)", content: `websocket.js - Binance WebSocket connection manager. Connects to wss://stream.binance.com:9443/ws/!miniTicker@arr. Exports coinWebSocket instance with: setTrackedCoins(coins) - set which symbols to track (all by default). subscribe(cb) - register callback for ticker updates. disconnect() - clean disconnect. toBinancePair(symbol) - convert local ID to Binance symbol (e.g., BTC → BTCUSDT). Incoming messages parsed from JSON array of mini-ticker objects: {s, c, h, l, v, P} (symbol, close, high, low, volume, change%). Reconnects on error with exponential backoff (max 8 attempts). REST polling fallback every 3 seconds if WebSocket fails. File: src/services/websocket.js` },
  { id: "service-news", title: "News Service (news.js)", content: `news.js - News CRUD operations. Primary store: Supabase 'news' table. Fallback: src/data/news.json (static). Exports: fetchNews({page, pageSize}) - paginated list ordered by published_at desc, reads Supabase first, falls back to local JSON. fetchNewsCount() - total count from Supabase. fetchCategoryCounts() - grouped category counts. fetchNewsById(id) - single article, tries Supabase then local. createNews(payload, userId) - admin only, inserts with sanitized HTML. updateNews(id, payload, userId) - admin only, updates with sanitized HTML. deleteNews(id) - admin only. subscribeNews(callback) - realtime subscription to news table changes. normalizeArticle(row) - maps DB row to UI shape (id, title, summary, content, category, date, image_url, source, author, tags, featured, trending, read_time). sanitizeHtml(html) - DOMPurify with allowed tags: p,br,strong,em,u,s,code,pre,h1-h4,ul,ol,li,a,img,blockquote,span,div. Allowed attrs: href,target,rel,src,alt,title,class. File: src/services/news.js` },
  { id: "composable-useauth", title: "useAuth Composable", content: `useAuth.js - authentication state and methods. Module-level refs: user (current Supabase user), isLoggedIn (computed). Methods: login(email, password) - supabase.auth.signInWithPassword. logout() - supabase.auth.signOut. signUp(email, password, name) - supabase.auth.signUp. requestRegistration(email, name) - generates temp password, signUp with emailRedirectTo=/set-password, upserts profile with role='user'. setPassword(password) - supabase.auth.updateUser, upserts profile + bcrypt hash. On init: loads session via supabase.auth.getSession(). Listens to onAuthStateChange to keep user ref reactive. File: src/composables/useAuth.js` },
  { id: "composable-useadmin", title: "useAdmin Composable", content: `useAdmin.js - admin role management. Module-level refs: profile (user profile from profiles table), loading. Computed: role - profile?.role || null. isAdmin - role === 'admin'. Methods: refresh() - reloads profile from Supabase. Watches user.id to auto-load profile on auth change. Used by admin layout for permission gating and by Navbar for admin badge. File: src/composables/useAdmin.js` },
  { id: "composable-usewatchlist", title: "useWatchlist Composable", content: `useWatchlist.js - watchlist state management. Module-level ref: ids (array of coin IDs). Computed: watchlistIds (sorted). Methods: isFavorite(coinId) - boolean check. toggleFavorite(coinId) - adds or removes. removeFavorite(coinId) - removes. Watches user ref: when logged in, loads from Supabase watchlist table (user_id, coin_id). When guest, uses localStorage key 'watchlist_ids'. Synced across tabs. File: src/composables/useWatchlist.js` },
  { id: "composable-usereactions", title: "useReactions Composable", content: `useReactions.js - likes and votes. Module-level ref: state { newsLikes, coinVotes }. Methods: isNewsLiked(articleId), toggleNewsLike(articleId), getNewsLikeCount(articleId), getCoinVote(coinId), setCoinVote(coinId, vote). News likes: Supabase news_likes table (auth) or localStorage key 'crypto_reactions' (guests). Coin votes: localStorage only. Watches user to switch storage. File: src/composables/useReactions.js` },
  { id: "composable-usecomments", title: "useComments Composable", content: `useComments.js - comment CRUD. Module-level ref: cache (localStorage). Methods: getComments(articleId) - fetches from Supabase comments table ordered by created_at asc, caches in localStorage. postComment(articleId, text, currentUser) - inserts to Supabase with article_id, user_id, user_name, text. removeComment(commentId, currentUser) - deletes if userId matches. File: src/composables/useComments.js` },
  { id: "composable-usetheme", title: "useTheme Composable", content: `useTheme.js - dark/light theme. Module-level ref: theme ('dark'|'light'), persisted in localStorage key 'theme'. Computed: isDark (boolean). Methods: setTheme(value), toggleTheme(), initTheme(). Default: 'dark'. Sets data-theme attribute on <html> element. CSS variables control all colors throughout the app. Used by ThemeToggle component and globally on app init. File: src/composables/useTheme.js` },
  { id: "utils-format", title: "Format Utilities", content: `format.js - number formatting helpers. formatPrice(value) - formats cryptocurrency prices: >1 → 2 decimal places, >0.01 → 4 places, >0.0001 → 6 places, else 8 places. formatMarketCap(value) - B for billions, M for millions. formatVolume(value) - same as market cap. formatChange(value) - percentage with + prefix for positive, colored output. changeClass(value) - returns CSS class 'up' or 'down'. File: src/utils/format.js` },
  { id: "layout-app", title: "App.vue Root Layout", content: `App.vue - root component. Structure: .app-wrapper (d-flex flex-column min-vh-100) → Navbar (sticky-top) → main (flex-grow-1 with <Transition name="page"> wrapping RouterView) → Footer (mt-auto) → AiAssistant (floating). Page transition: fade + slide (opacity + translateY). CSS variables for theming via data-theme attribute. File: src/App.vue` },
  { id: "data-files", title: "Data Files (local JSON)", content: `src/data/news.json - fallback news articles (~20 static articles with id, title, summary, full_content, category, date, image, source, author, tags, featured, trending, read_time). Used when Supabase is unavailable. src/data/adoptionIndex.json - Chainalysis 2025 Global Crypto Adoption Index by country: country name, rank, score, adoption level. Used by RadarMap component.` },
  { id: "vite-config", title: "Vite Configuration", content: `vite.config.js - Vite build config with Vue plugin. Dev proxy to avoid CORS: /api/binance → https://api.binance.com, /api/coingecko → https://api.coingecko.com. Rewrites remove /api prefix. Build: vite build outputs to /dist. Dev server default port.` },
  { id: "global-css", title: "Global CSS Architecture", content: `src/assets/global.css - all app styles. CSS custom properties for theming under [data-theme="dark"] and [data-theme="light"]: --bg-primary, --bg-secondary, --bg-card, --text-primary, --text-secondary, --text-emphasis, --border-color, --accent (#667eea), --accent-hover (#5a6fd6), --accent-secondary (#764ba2), --crypto-gold (#f0b90b), --green (#00c853), --red (#ff1744), --shadow, --hero-overlay, --hero-text, --hero-text-secondary. Bootstrap overrides. Card style: .card-crypto with glassmorphism (backdrop-filter, border, rounded). Button styles: .btn-accent gradient. Page section layout. CoinDashboard chart container. Admin layout styles. Responsive breakpoints. File: src/assets/global.css` },
]

serve(async () => {
  try {
    const marketsRes = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false",
    );
    if (!marketsRes.ok) throw new Error(`CoinGecko markets API: ${marketsRes.status}`);
    const markets = await marketsRes.json();

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

    const { data: news } = await supabase.from("news").select("id, title, summary, content");
    for (const a of news || []) {
      await supabase.from("documents").upsert({
        source: "news",
        source_id: String(a.id),
        title: a.title,
        content: `${a.title}. ${a.summary || ""} ${(a.content || "").replace(/<[^>]+>/g, " ")}`.slice(0, 5000),
      }, { onConflict: "source,source_id" });
    }

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
