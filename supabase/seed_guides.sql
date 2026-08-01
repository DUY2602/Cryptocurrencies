-- =============================================================================
-- Guides table — source of truth for RAG guide documents
-- Run in Supabase Studio > SQL Editor
-- After inserting, trigger sync-guides Edge Function to embed into documents
-- =============================================================================

create table if not exists public.guides (
  id        text primary key,
  title     text not null,
  content   text not null,
  category  text not null default 'general',
  updated_at timestamptz not null default now()
);

-- Overwrite all guides (DELETE + INSERT for full replacement)
delete from public.guides;
insert into public.guides (id, title, content, category) values

('app-overview', 'CryptoDash App Overview',
'CryptoDash is a cryptocurrency market dashboard and news platform. Tech stack: Vue 3, Vite, Vue Router 4, Bootstrap 5, Supabase (PostgreSQL + Auth + Edge Functions), Binance WebSocket/REST, CoinGecko API, TipTap (rich text editor), Lightweight Charts, DOMPurify, marked, bcryptjs, Google Gemini AI (embeddings), Groq (LLM). Key features: live prices via Binance WebSocket, interactive candlestick charts with MA/EMA, personalized watchlist, news feed from CoinDesk RSS (hourly), AI Assistant with RAG (Groq + Gemini embeddings), admin CMS for news/users/settings/Knowledge Base, dark/light theme. Color scheme: gold accent (#ffc837/#f59e0b) with purple (#667eea) secondary accents.',
'general'),

('nav-topbar', 'Top Navigation Bar (Navbar)',
'The top navigation bar (Navbar.vue) is sticky and always visible. Left side: "CryptoDash" brand/logo — click to go home (/). Nav links: "Home" → /, "Markets" → /markets, "News" → /news, "About" → /about, "Watchlist" → /watchlist (always visible, but content requires login). Right side: sun/moon ThemeToggle icon, then user area — if logged in: "Admin" nav link with star icon (only if admin role), then avatar initial with name → dropdown with "Profile" (/profile), "Admin dashboard" (/admin, only if admin role), "Logout". If guest: "Login" button → /login. On mobile: hamburger menu with Bootstrap collapse, auto-closes on route change.',
'navigation'),

('nav-routes', 'All Routes & Pages',
'Public: / (Home), /markets (Markets), /coin/:id (CoinDetail), /news (News), /news/:id (NewsDetail), /about (About), /set-password (SetPassword), /watchlist (Watchlist — page is public but shows a login prompt for guests). Guest-only: /login, /register. Auth-required: /profile. Admin-required: /admin (Dashboard), /admin/news (CMS), /admin/news/:id (Editor), /admin/rag (Knowledge Base), /admin/users (Users), /admin/settings (Settings). Navigation guard: requiresAuth redirects to /login?redirect=, guestOnly redirects to /, requiresAdmin renders locked screen inside AdminLayout.',
'navigation'),

('nav-footer', 'Footer',
'Footer at the bottom of every page shows: CryptoDash brand name, university credit "COS30043 · Swinburne University", and dynamic copyright year.',
'navigation'),

('page-home', 'Home Page /',
'The home page (/) is the landing page. Hero section (HeroSection.vue): large "Track Crypto Markets in Real Time" headline with HUD stat pills (100+ Coins Tracked, 24/7 Live Updates, Free No Cost Registration). Two CTA buttons: "Explore Markets" → /markets, "View News" → /news. Below hero: "Market Glance" gradient panel with 5 live stats — Market Cap, 24h Volume, BTC Dominance, Avg 24h change, Active coins. "Trending" — up to 10 most volatile coins in a live dash-table (rank, coin, price with arrow, 24h; click any row → /coin/:id). "Top by Volume (24h)" — top 10 coins by volume in a live dash-table. "Latest News" — horizontal scrolling news-track of recent articles (click any → /news/:id). "Global Crypto Adoption" — interactive world map (canvas + GeoJSON), colored by adoption level, hover for tooltip with country name, rank, score, level. All prices update live via WebSocket with green/red flash animation on change.',
'pages'),

('page-markets', 'Markets Page /markets',
'To browse all tracked coins: go to /markets (click "Markets" in top navbar). The page shows a PageHero banner with subtitle "N coins · X gainers · Y losers" (total tracked, gainers, losers counts). Use the search bar to filter by coin name or symbol (e.g. type "btc" to find Bitcoin). Use the sort dropdown to sort by market cap (default), price, top gainers, or top losers. The table (table-crypto) shows: rank #, coin icon + name + symbol, live price (flashes green/red on change, USDT suffix), 24h change % with arrow, sparkline mini-chart (green up/red down), 24h volume, market cap. Click the star ★ to add to watchlist, or click "View" to go to coin detail. 20 coins per page with pagination at bottom. Shows "No matches" if search finds nothing. Data refreshes in real-time via WebSocket.',
'pages'),

('page-coindetail', 'Coin Detail Page /coin/:id',
'To view a coin detailed chart and stats: click any coin name on /markets, a row on the home page dash-tables, or "View" in the markets table — navigates to /coin/:id (e.g. /coin/bitcoin). The page header shows: coin image, name + symbol, a pulsing green "Live" badge (when WebSocket connected), a star ★ FavoriteButton to add to watchlist, and a "Markets" back link. The main chart (CoinDashboard) uses Lightweight Charts: select timeframe from 1s (seconds) up to 1w (week). Toggle indicators: Price, MA (Moving Average), EMA (Exponential), Volume. Hover over chart for crosshair tooltip with OHLCV data. Chart updates in real-time via WebSocket. Below chart: "Market Sentiment" bar (Bullish 68% / Bearish 32%, static) and 4 StatCards (Market Cap, 24h Volume, 24h High, 24h Low). Bottom: "About" section with coin description from CoinGecko. If coin ID is invalid: shows "Coin not found" EmptyState with a "Back to Markets" link. Loading state shows a spinner.',
'pages'),

('page-watchlist', 'Watchlist Page /watchlist',
'To add coins to your watchlist: go to /markets (click "Markets" in navbar), find a coin, click the star ★ icon on the right side of its row — it will fill in ★ to show it is saved. You can also star coins on a coin detail page /coin/:id (star next to the Live badge). To view your watchlist: go to /watchlist (click "Watchlist" in navbar) — login required (guests see "Please login or register to use the Watchlist." with Login/Register buttons). Shows your starred coins in a table with price, 24h change, volume, etc. If empty: shows "Watchlist is empty" with a "Browse markets" button. Starring on other pages works for logged-in users (Supabase watchlist table sync) and guests (browser localStorage "cryptodash-watchlist").',
'pages'),

('page-news', 'News Page /news',
'To read crypto news: go to /news (click "News" in top navbar). The page shows a hero banner "Crypto News" (hero.jpg bg). Filter bar: search by title, category dropdown with count badges (e.g. Bitcoin (N)), date range dropdown (Today / This week / This month / This year), and a "Clear" button. Featured article: the article flagged featured (a.featured) shown as a large card with image, "Featured" badge, category, title, summary, author avatar + name, date, read time — hidden while searching or category-filtering (not hidden by date filter alone). Article grid in 3 columns: each card shows image, category, date, title, source, read time, summary, and a NewsReactions like/dislike row at the footer. 9 articles per page with pagination (search or category filter fetches up to 500; date filter applies client-side). Click any article to open full detail at /news/:id. Shows "No articles match your search." if no results. Data from Supabase news table, updated hourly from CoinDesk RSS.',
'pages'),

('page-newsdetail', 'News Detail Page /news/:id',
'To read a full article: click any news card on /news to go to /news/:id (e.g. /news/1). Shows hero image, category badge, estimated read time, and article title. Author section: avatar initial, name, publish date, source. Full HTML article content below (sanitized, safe). Click any tag pill → /news?q=tag to find related articles. Like/dislike reaction row (login required). "Read original source" link to the article source. Comments section at bottom: read comments (username, date, text, oldest first). To post a comment: login required — type in textarea and submit. Delete your own comments with × button. "Related Articles" section at bottom matches by category or tags. Loading: spinner ("Loading article..."). If article not found: EmptyState titled "Article not found" with a "Back to News" button.',
'pages'),

('page-login', 'Login Page /login',
'To login: go to /login (click "Login" in navbar, or redirected automatically when accessing a page that requires login). The card shows title "Login" with subtitle "Sign in to your account". Step 1: enter your email in "Email address" field (placeholder "you@example.com"). Step 2: enter your password in "Password" field (placeholder "Your password") — use 👁️ to toggle visibility. Step 3: click "Sign in" button (gold btn-accent full-width, shows spinner + "Signing in..." while loading). If email format is wrong: "Please enter a valid email address." If password empty: "Please enter your password." On success: success alert, then redirected after ~0.5s to the page you were trying to access (or home if no redirect). If you do not have an account: click "Register" link at bottom. On error: red alert auto-dismisses after 5s. Guest-only — if already logged in, redirects to home.',
'auth'),

('page-register', 'Register Page /register',
'To register: go to /register (click "Register" link in navbar or at bottom of Login page). Card titled "Register" with subtitle "Create your account with email verification". Step 1: fill in "Name (optional)" field (text input, placeholder "Your name"). Step 2: fill in "Email address" field (email input, placeholder "you@example.com"). Step 3: click the "Send verification email" button (gold btn-accent full-width). If email is invalid: "Please enter a valid email address." After submitting: "Registration successful. Please check your email to verify your account." → redirect /login after 3 seconds. Step 4: check email (including spam) for verification link. Step 5: click link → /set-password, enter password (min 6 chars) in "Password" field, confirm in "Confirm password" field, click "Set password" → redirected to home. Guest-only route.',
'auth'),

('page-setpassword', 'Set Password Page /set-password',
'Reached via email verification link. Card: title "Set Password", subtitle "Your email has been verified. Set your password to complete registration." Step 1: type password in "Password" field (min 6 chars, placeholder "At least 6 characters") — 👁️ to toggle visibility. Step 2: re-enter in "Confirm password" field (placeholder "Re-enter password"). Step 3: click "Set password" button (gold btn-accent full-width). If too short: "Password must be at least 6 characters." If mismatch: "Passwords must match." On success: redirected to home after 2 seconds.',
'auth'),

('page-profile', 'Profile Page /profile',
'Auth-required route (redirects to /login?redirect=/profile if not logged in). Profile card: avatar with initial, display name (from profiles/name or auth metadata), email, role badge (Admin gold / User gray). Info: Member since (from auth user UUID timestamp), Theme (Dark/Light value + Toggle button). Quick links: Watchlist (→ /watchlist), Admin dashboard (→ /admin, only if admin role). Logout button (btn-outline-accent, calls useAuth().logout() then redirects home). No edit/update functionality currently.',
'auth'),

('page-about', 'About Page /about',
'Go to /about (click "About" in navbar). PageHero banner "About CryptoDash". Three feature cards: Core Purpose, Live Streams, Market Intelligence (each with icon + highlights). "Technical Matrix" — 6 categories of tech badges with icons: Framework (Vue 3, Vite, Pinia), UI & Styling (Bootstrap 5, CSS3, TipTap), Data & API (CoinGecko, CoinDesk, Binance), AI & ML (Gemini, Groq, RAG), Tooling (Vercel, Lightweight Charts, WebSocket), Supabase (Supabase, Edge Function, Authentication). "Say hello" demo: enter first name + last name (letters only, validated), pick preferred coin (Bitcoin BTC or Ethereum ETH radio) — shows "Welcome to CryptoDash / {name}, your favourite is {coin}" plus a hero emoji card with the coin description. Cosmetic only — no data saved.',
'pages'),

('admin-layout', 'Admin Panel Layout',
'All /admin/* routes share AdminLayout. Left sidebar (collapsible, mobile-friendly): Dashboard, News CMS, Knowledge Base, Users, Settings — each with an icon. Bottom of sidebar: user card (avatar initial, name, email) with Profile / Site / Logout buttons. Topbar: page title, realtime connection pill (live/connecting/disconnected based on Supabase postgres_changes subscription on news table), + New article button (only on news routes). Permission gate: locked screen if not admin (points to SQL snippet in complete_schema.sql, refresh + Back to site); role checked fresh on mount.',
'admin'),

('admin-dashboard', 'Admin Dashboard /admin',
'KPI cards: total articles, featured, trending, this week. "User registrations" cumulative line chart (Lightweight Charts, gold #ffc837 line, from profiles.created_at). "Articles by category" breakdown with horizontal bars. Top authors ranked #1-#5 with avatar/initial + article count. Recent articles clickable list (top 5: thumbnail, category/featured/trending badges, title, summary, date → opens editor). Footer stats: total words written, avg words/article, unique categories, unique authors. Realtime auto-refresh on news table changes. Header buttons: "All articles" and "New article".',
'admin'),

('admin-news-list', 'Admin News CMS /admin/news',
'Full article table (10 per page, server-side pagination): thumbnail, title, summary, category badge, author, date, featured/trending badges. Sortable columns (title, category, author, published/date). Actions: Preview (public view), Edit, Delete (confirmation modal). Search across title/summary/author/category (debounced 350ms). Category filter. + New Article button → /admin/news/new. "CoinDesk" button calls the fetch-news Edge Function (shows result count). Realtime auto-refresh (re-fetch on INSERT/UPDATE/DELETE).',
'admin'),

('admin-news-editor', 'Admin News Editor /admin/news/:id',
'GDocs-style editor. Topbar: back, title, save status (unsaved/saved), word count, preview toggle, metadata toggle, view on site link, Save button. Editor: title input, summary textarea (auto-summary button, 240 char limit), TipTap rich text (bold, italic, underline, strike, H1-H4, lists, blockquote, code, link, image up to 2MB, undo/redo, word count). Preview panel: rendered article (DOMPurify sanitized). Metadata panel (collapsible): category select (General, Bitcoin, Ethereum, DeFi, NFT, Regulation, Markets, Altcoins, Mining, Web3), tags (max 12 chips, Enter/comma to add), cover image URL (with preview), author name + avatar URL, source name + URL, featured/trending switches, read time slider (1-30 min). Validation: title min 8, body min 20 chars, summary required, category required, image URL must be http(s). Dirty state beforeunload protection.',
'admin'),

('admin-users', 'Admin Users /admin/users',
'Stats: total/admins/users counts. Search by name/ID/role. "Add User" button opens a create modal (name, email, role). User table: avatar initial, name, email, "you" badge, join date, role badge, Edit (modal for name+role) and Delete buttons (confirmation modal). Delete self prevented ("You cannot delete yourself"). Read-only for non-admins.',
'admin'),

('admin-settings', 'Admin Settings /admin/settings',
'Database card: connection status badge (Online/Checking…/Error), news article count, profiles count, last check time, Re-check button (calls supabase count queries). "Your account" card: name, role badge (Admin with star / User), role check indicator, Refresh role button. "Preferences" card: dark theme switch (uses useTheme toggle) + Maintenance section with "Clear local cache" button (clears localStorage + sessionStorage then reloads after ~0.9s). No RAG section.',
'admin'),

('comp-cointable', 'CoinTable Component',
'CoinTable.vue (src/components/coins/CoinTable.vue) - legacy/unused component, not imported by any page. The Markets (/markets) and Watchlist (/watchlist) pages render their own inline "table-crypto" markup directly (columns: #, Name with icon+symbol, Last Price with live flash + USDT suffix, 24h Change with arrow, [sparkline on Markets], 24h Volume, Market Cap, Action with star + View button).',
'components'),

('comp-coindashboard', 'CoinDashboard Chart Component',
'CoinDashboard.vue - OHLCV chart using Lightweight Charts. Timeframes: 1s,1m,5m,15m,1h,4h,12h,1d,1w. Indicators: Price, MA, EMA, Vol. Crosshair tooltip. Responsive. Real-time WebSocket stream. Bottom: StatCards (Market Cap, 24h Volume, 24h High, 24h Low) + sentiment bar 68/32. Data: Binance klines API + WebSocket. Error: overlay with retry.',
'components'),

('comp-livebadge', 'LiveBadge Component',
'LiveBadge.vue - small badge showing a dot + label text ("Live" default). Displayed when WebSocket connection to Binance is active (isLive). Used on CoinDetail page next to coin name and Home "Trending" dash-card title (imported but unused on Markets).',
'components'),

('comp-favoritebutton', 'FavoriteButton Component',
'FavoriteButton.vue (src/components/ui/FavoriteButton.vue) - star toggle button. Props: coinId, size (sm default, "btn-sm" when sm). Filled ★ (gold accent) = saved, outline ☆ = not. Uses useWatchlist composable. If guest, clicking redirects to /login?redirect=. Used on CoinDetail (next to Live badge) and inside the (unused) CoinTable.vue. Markets/Watchlist render their own inline star buttons (which save to localStorage for guests via useWatchlist).',
'components'),

('comp-newslikebutton', 'NewsReactions Component',
'NewsReactions.vue (src/components/news/NewsReactions.vue) - like/dislike toggle for news. Props: articleId. Shows two thumb buttons (like / dislike, SVG), active state highlighted (purple #667eea), counts shown when > 0. Uses useReactions composable + news_likes table. Login required — buttons disabled with tooltips "Log in to like" / "Log in to dislike" for guests. Click again to remove reaction. Used on News cards and NewsDetail.',
'components'),

('comp-searchbar', 'SearchBar Component',
'SearchBar.vue - search input with magnifying glass icon, clear X button. Props: modelValue, label, placeholder. Used on Markets, News (Admin pages use their own inline search inputs).',
'components'),

('comp-pagination', 'Pagination Component',
'Pagination.vue - legacy/unused component (page nav with prev/next + page numbers with ellipsis, disabled states, emits page-change). Markets and News render their own inline pagination markup instead.',
'components'),

('comp-themetoggle', 'ThemeToggle Component',
'ThemeToggle.vue - sun/moon toggle. Uses useTheme: localStorage "cryptodash-theme" key, data-theme on <html>, CSS variables, default dark. Smooth CSS transitions.',
'components'),

('comp-prices', 'Live Prices & PriceWithArrow',
'livePrices.js service: singleton subscription manager with ref counting. start(coins), stop(), getLatest(), applyLiveFlashes(). PriceWithArrow.vue: props price/flash/pulse/size/inline, formats price, shows green↑/red↓ arrow with pulsing flash. WebSocket (websocket.js): Binance stream !miniTicker@arr, REST polling fallback 3s, reconnect exponential backoff max 8.',
'components'),

('comp-richtexteditor', 'RichTextEditor (TipTap)',
'RichTextEditor.vue (src/components/admin/RichTextEditor.vue) - WYSIWYG editor. Extensions: StarterKit (bold, italic, H1-H4, lists, blockquote, code, hr), Underline, Link (popover), Image (URL/paste/drag/upload max 2MB, allowBase64, inline:false), Placeholder. Toolbar with icons. v-model. HTML sanitized via DOMPurify before saving (services/news.js sanitizeHtml) and in the admin preview.',
'components'),

('comp-pagehero', 'PageHero Component',
'PageHero.vue - full-width banner with /hero.jpg background, dark overlay, title, subtitle. Used on Markets, Watchlist, About. (News page has its own news-hero banner instead.)',
'components'),

('comp-loading-emptystate', 'LoadingSpinner & EmptyState',
'LoadingSpinner.vue - centered spinner with message prop, CSS .spinner-crypto. Used on all pages during fetch. EmptyState.vue - placeholder for empty/error. Props: icon, title, message. Default slot for action buttons. Used on Markets ("No matches"), CoinDetail ("Coin not found"), Watchlist ("Watchlist is empty"), NewsDetail ("Article not found").',
'components'),

('comp-binancesparkline', 'BinanceSparkline Component',
'BinanceSparkline.vue - canvas sparkline. Props: trend (up/down), width, height. Random-walk line with green/red gradient. Used in the Markets page table-crypto rows.',
'components'),

('comp-statcard', 'StatCard Component',
'StatCard.vue - stat display. Props: label, value, changeClass. Used on CoinDetail stats.',
'components'),

('comp-radarmap', 'RadarMap (Adoption Map)',
'RadarMap.vue (components/geo/) - world map canvas with GeoJSON. Colors by Chainalysis 2025 adoption level. Hover tooltip: country, rank, score, level. Legend. Data: src/data/adoptionIndex.json. Used on Home page.',
'components'),

('ai-assistant', 'AI Assistant (Chatbot)',
'To use the AI assistant: click the 💬 button at the bottom-right corner of any page. Login required — guests see "Please login or register to use the AI Assistant." with Login/Register buttons. Panel titled "Crypto Assistant" (subtitle "Powered by Groq + live prices") with message area, quick prompt buttons ("Market summary", "Explain BTC"), and text input at bottom. Type question and press Enter. The AI uses RAG: (1) hybrid retrieval via match_documents (vector, gemini-embedding-2) + match_documents_fts (full-text) with HYBRID_TOP_K=20 each, merged via Reciprocal Rank Fusion (RRF_K=60) → top FINAL_TOP_K=5, (2) context assembly with matched documents, live prices, page context, chat history (last 12 messages), user role, (3) answer generation via Groq llama-3.1-8b-instant on the chat Edge Function. Answers include markdown formatting (rendered + sanitized via marked + DOMPurify). Citation markers like [1] are stripped from display. Welcome message: "Hi - I can explain coins, summarise markets, or suggest what to check on the dashboard." Quick prompts send: "Summarise the market" and "Explain Bitcoin". Backend: supabase/functions/chat/index.ts.',
'ai'),

('workflow-auth', 'Authentication Workflow',
'Registration (2 phases): (1) Go to /register (click "Register" in navbar or login page footer). Fill "Name (optional)" + "Email address". Click "Send verification email". Check email inbox/spam for verification link. (2) Click link → /set-password. Enter password (min 6 chars) + confirm. Click "Set password" → redirected to home. Technical: requestRegistration() generates 20-char temp password → supabase.auth.signUp({email,tempPassword, options:{emailRedirectTo:/set-password}}) → upsert profiles(id,email,name,role:"user"). setPassword() → supabase.auth.updateUser({password}) + bcrypt hash in profiles.password. LOGIN: /login → email+password → signInWithPassword → redirect ?redirect= or home. LOGOUT: navbar dropdown or /profile → signOut → home. Session: onAuthStateChange. Guest-only: /login, /register. Auth-required: /profile. /watchlist is public (guests see an in-page login prompt). No OAuth, no password reset.',
'workflows'),

('workflow-watchlist', 'Watchlist Workflow',
'Star icon on any coin toggles favorite. Auth: saves to Supabase watchlist table (user_id, coin_id). Guests: localStorage "cryptodash-watchlist". Watchlist page /watchlist shows saved coins in a table-crypto (name+symbol, live price with flash, 24h change with arrow, 24h volume, market cap, star + View actions). Empty: "Watchlist is empty" with "Browse markets" button. useWatchlist composable: watchlistIds, isFavorite, toggleFavorite, removeFavorite.',
'workflows'),

('workflow-news-cms', 'News CMS Workflow (Admin)',
'AUTO: Supabase cron hourly → fetch-news Edge Function → CoinDesk RSS → parse XML → expand short content via Groq llama-3.1-8b-instant (Gemini 1.5 Flash fallback; first 5 articles per run fetch the original page for better rewriting) → deduplicate by source_url → insert into news table. Also callable via "CoinDesk" button in /admin/news. MANUAL: /admin/news → New Article → TipTap editor → title (min 8), summary (max 240), body (min 20), optional metadata (category, tags max 12, image, author, source, featured/trending, read time) → Save. EDIT: click Edit → modify → auto-save indicator → Preview toggle → Save. DELETE: trash icon → confirmation modal → delete. Realtime auto-refresh.',
'workflows'),

('workflow-comments', 'Comments Workflow',
'VIEW: all users see comments on /news/:id (username, date, text, oldest first). POST: login required → textarea → supabase.comments insert (article_id, user_id, user_name, text). DELETE: × button on own comments only (RLS auth.uid()). Cache: localStorage.',
'workflows'),

('workflow-errors', 'Error Handling Patterns',
'Pattern 1: inline error alert (Markets, News, Admin). Pattern 2: EmptyState with error + back button (CoinDetail "not found", NewsDetail "not found"). Pattern 3: try/catch console.log + error state. Pattern 4: chart error overlay with retry. Pattern 5: WebSocket reconnect exponential backoff max 8 + REST polling fallback. Pattern 6: permission locked screen for non-admins, read-only banners. Pattern 7: form validation (email format, password min 6/match, title min 8, body min 20, max 12 tags).',
'workflows'),

('faq-live-prices', 'FAQ - Live Prices',
'Q: How do live prices work? A: Binance WebSocket (wss://stream.binance.com:9443/ws/!miniTicker@arr). Falls back to REST API polling every 3 seconds. Reconnects with exponential backoff (max 8). Q: Which coins? A: All USDT pairs except stablecoins (USDC, USDT, BUSD, DAI, TUSD, FDUSD, USDP, USDS, USD1, PYUSD, USDE, USDG, USDD, EURI, EURC, USTC, etc.) and leveraged tokens (matching UP/DOWN/BEAR/BULL or digits+L/S suffix). MATIC maps to POLUSDT. Q: Flash colors? A: Green pulse for increase, red for decrease. Q: Delay? A: ~1 second. Q: Where to see? A: Home page, /markets table, /coin/:id chart, /watchlist.',
'faq'),

('faq-chart', 'FAQ - Charts',
'Q: How to view charts? A: Go to /coin/:id (click any coin on /markets or home). Q: Chart library? A: TradingView Lightweight Charts. Q: Timeframes? A: 1s,1m,5m,15m,1h,4h,12h,1d,1w. Q: Indicators? A: Moving Average (MA), Exponential MA (EMA), Volume bars. Q: Real-time? A: Yes, via WebSocket stream. Q: How to read? A: Hover for crosshair tooltip with open, high, low, close, volume.',
'faq'),

('faq-auth', 'FAQ - Authentication',
'Q: Create account? A: /register → email + optional name → "Send verification email" → check email → click link → /set-password → set password (min 6 chars) → done. Q: No email? A: Check spam folder. Q: Forgot password? A: Not implemented, contact admin. Q: Browse without login? A: Yes — login only for comments, likes, server-synced watchlist, profile, and the AI assistant. Q: Become admin? A: Existing admin promotes you via /admin/users, or run the promotion SQL at the bottom of supabase/complete_schema.sql (upserts profile role to admin for the chosen email; AdminLayout locked screen also points there). Q: Change name? A: Not currently.',
'faq'),

('faq-data-sources', 'FAQ - Data Sources',
'Q: Coin data? A: CoinGecko API (market data, images, descriptions) + Binance WebSocket/REST (live prices). Q: News? A: CoinDesk RSS, fetched hourly by fetch-news Edge Function, expanded by Groq (Gemini fallback). Q: How current? A: Prices near real-time (~1s), news hourly, CoinGecko cached 5 min.',
'faq'),

('faq-general', 'FAQ - General',
'Q: Add to watchlist? A: Click star ★ on any coin in /markets or coin detail (login for sync, guests saved locally). Q: AI Assistant? A: 💬 button bottom-right (login required). Q: Switch theme? A: Sun/moon toggle in top navbar. Q: Mobile? A: Responsive Bootstrap 5. Q: Share articles? A: Copy URL from browser at /news/:id. Q: Built by? A: COS30043 Swinburne University. Q: Navigate? A: Top navbar: Home, Markets, News, About, Watchlist. Admin users see Admin link.',
'faq'),

-- =============================================================================
-- Edge Functions (user-facing summary)
-- =============================================================================

('edge-fetchnews', 'News Import (fetch-news)',
'News articles are automatically imported from CoinDesk RSS every hour. This keeps the news feed up to date with the latest crypto news. Short news snippets are expanded into full articles (Groq llama-3.1-8b-instant, Gemini fallback) for a better reading experience. Admin users can also manually trigger an import via the "CoinDesk" button in the Admin panel.',
'edge-functions'),

('edge-chat', 'AI Assistant (chat)',
'The AI Assistant (chatbot) uses Groq llama-3.1-8b-instant with RAG to answer your questions about crypto coins, markets, and the CryptoDash app itself. It searches through documentation (guides vector DB) to provide accurate answers. The assistant also receives live prices, your current page, chat history, and user role for context-aware responses. Requires login.',
'edge-functions'),

('edge-syncguides', 'Guide Sync (sync-guides)',
'This process syncs the app documentation from the guides table into the vector database so the AI Assistant can search and retrieve relevant information to answer your questions.',
'edge-functions'),

('comp-chartplaceholder', 'Chart Placeholder',
'ChartPlaceholder.vue (src/components/coins/ChartPlaceholder.vue) - legacy/unused component. Shows a placeholder with the text "Price chart — coming soon" (label prop) when chart data is unavailable. Not currently imported by any page — CoinDashboard renders its own loading/error overlays.',
'components'),

('comp-marketoverviewcards', 'Market Overview Cards',
'Market Overview Cards (src/components/coins/MarketOverviewCards.vue) - legacy component, no longer rendered on any page. The Home page "Top by Volume (24h)" section now uses a dash-table (rank, coin, price, 24h change, volume) rendered directly in Home.vue instead of these cards.',
'components'),

('comp-coincard', 'Trending Coin Cards',
'Trending Coin Cards (src/components/coins/CoinCard.vue) - legacy component, no longer rendered on any page. The Home page "Trending" section now uses a dash-table (rank, coin, price with arrow, 24h change) rendered directly in Home.vue instead of these cards.',
'components')

;
