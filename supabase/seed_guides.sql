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
'CryptoDash is a cryptocurrency market dashboard and news platform. Tech stack: Vue 3, Vite, Vue Router 5, Bootstrap 5, Supabase (PostgreSQL + Auth + Edge Functions), Binance WebSocket/REST, CoinGecko API, TipTap (rich text editor), Lightweight Charts, DOMPurify, marked, bcryptjs, Google Gemini AI. Key features: live prices via Binance WebSocket, interactive candlestick charts with MA/EMA, personalized watchlist, news feed from CoinDesk RSS (hourly), AI Assistant with RAG (Gemini), admin CMS for news/users/settings, dark/light theme. Color scheme: dark theme with accent purple (#667eea, #764ba2) and gold (#f0b90b).',
'general'),

('nav-topbar', 'Top Navigation Bar (Navbar)',
'The top navigation bar (Navbar.vue) is sticky and always visible. Left side: "CryptoDash" brand/logo — click to go home (/). Nav links: "Home" → /, "Markets" → /markets, "News" → /news, "About" → /about, "Watchlist" → /watchlist (only visible when logged in). Right side: sun/moon ThemeToggle icon, then user area — if logged in: user avatar initial → dropdown with "Profile" (/profile), "Admin" (/admin, only if admin role), "Logout". If guest: "Login" button → /login. On mobile: hamburger menu with Bootstrap collapse, auto-closes on route change. Admin users see a small "Admin" badge near their avatar.',
'navigation'),

('nav-routes', 'All Routes & Pages',
'Public: / (Home), /markets (Markets), /coin/:id (CoinDetail), /news (News), /news/:id (NewsDetail), /about (About), /set-password (SetPassword). Guest-only: /login, /register. Auth-required: /profile, /watchlist. Admin-required: /admin (Dashboard), /admin/news (CMS), /admin/news/:id (Editor), /admin/users (Users), /admin/settings (Settings). Navigation guard: requiresAuth redirects to /login?redirect=, guestOnly redirects to /, requiresAdmin renders locked screen.',
'navigation'),

('nav-footer', 'Footer',
'Footer at the bottom of every page shows: CryptoDash brand name, university credit "COS30043 · Swinburne University", and dynamic copyright year.',
'navigation'),

('page-home', 'Home Page /',
'The home page (/) is the landing page. Hero section: large "Track Every Move" headline with stat pills (100+ Coins, 24/7 Live, Free). Two CTA buttons: "Explore Markets" → /markets, "Read News" → /news. Below hero: "Market at a Glance" — 3 StatCards showing total tracked coins, total market cap (top 50), and average 24h change. "Trending Now" — 6 most volatile coins in animated cards (click any → /coin/:id). "Top by Volume" — grid of top volume coins with price/change. "Latest News" — 3 most recent news cards (click "Read More" → /news/:id). "Global Crypto Adoption" — interactive world map (canvas + GeoJSON), colored by adoption level, hover for tooltip with country name, rank, score, level. All prices update live via WebSocket with green/red flash animation on change.',
'pages'),

('page-markets', 'Markets Page /markets',
'To browse all tracked coins: go to /markets (click "Markets" in top navbar). The page shows a banner with total coins tracked, gainers, and losers counts. Use the search bar to filter by coin name or symbol (e.g. type "btc" to find Bitcoin). Use the sort dropdown to sort by market cap (default), price, top gainers, or top losers. The table shows: rank #, coin icon + name + symbol, live price (flashes green/red on change), 24h change % with arrow, sparkline mini-chart, 24h volume, market cap. Click the star ★ to add to watchlist, or click "Trade" to go to coin detail. 20 coins per page with pagination at bottom. Shows "No matches" if search finds nothing. Data refreshes in real-time via WebSocket.',
'pages'),

('page-coindetail', 'Coin Detail Page /coin/:id',
'To view a coin detailed chart and stats: click any coin name on /markets, or a coin card on home page, or click "Trade" in the markets table — navigates to /coin/:id (e.g. /coin/bitcoin). The page header shows: coin image, name + symbol, a pulsing green "Live" badge (when WebSocket connected), and a star ★ button to add to watchlist. The main chart (CoinDashboard) uses Lightweight Charts: select timeframe from 1s (seconds) up to 1w (week). Toggle indicators: Price line, MA (Moving Average), EMA (Exponential), Volume bars. Hover over chart for crosshair tooltip with OHLCV data. Chart updates in real-time via WebSocket. Below chart: 4 StatCards (Market Cap, Volume, 24h High, 24h Low) + sentiment bar showing 68% bullish / 32% bearish (static). Bottom: "About" section with coin description from CoinGecko. If coin ID is invalid: shows "Coin not found" with a back link. Loading state shows a spinner.',
'pages'),

('page-watchlist', 'Watchlist Page /watchlist',
'To add coins to your watchlist: go to /markets (click "Markets" in navbar), find a coin, click the star ★ icon on the right side of its row — it will fill in ★ to show it is saved. You can also star coins on the home page trending section or on a coin detail page /coin/:id. To view your watchlist: go to /watchlist (click "Watchlist" in navbar) — shows your starred coins in a table with price, 24h change, volume, etc. If empty: shows "Watchlist is empty" with a "Browse Markets" button. Login required for server-side sync; guests save to browser localStorage.',
'pages'),

('page-news', 'News Page /news',
'To read crypto news: go to /news (click "News" in top navbar). The page shows a hero banner "Crypto News". Featured article: the latest news shown as a large card with image, category badge, title, summary, author, date, read time. Below: category filter buttons (e.g. Bitcoin, Technology, Regulation) with count badges — click to filter by category. Article grid in 3 columns: each card shows image, category, date, title, source, read time, summary, 2 tag pills, and a ❤️ like button. Use the search bar to find articles by title, summary, content, category, date, source, or tags. 9 articles per page with pagination. Click any article to open full detail at /news/:id. Shows "No articles match your search" if no results. Data from Supabase news table, updated hourly from CoinDesk RSS.',
'pages'),

('page-newsdetail', 'News Detail Page /news/:id',
'To read a full article: click any news card on /news to go to /news/:id (e.g. /news/1). Shows hero image, category badge, estimated read time, and article title. Author section: avatar initial, name, publish date, source. Full HTML article content below (sanitized, safe). Click any tag pill → /news?q=tag to find related articles. ❤️ NewsLikeButton to like/unlike. "View Original" link to source. Comments section at bottom: read comments (username, date, text, oldest first). To post a comment: login required — type in textarea and submit. Delete your own comments with × button. "Related Articles" section at bottom matches by category or tags. Loading: spinner. If article not found: EmptyState with "Not found" message.',
'pages'),

('page-login', 'Login Page /login',
'To login: go to /login (click "Login" in navbar, or redirected automatically when accessing a page that requires login). The card shows title "Login" with subtitle "Sign in to your account". Step 1: enter your email in "Email address" field (placeholder "you@example.com"). Step 2: enter your password in "Password" field (placeholder "Your password") — use 👁️ to toggle visibility. Step 3: click "Sign in" button (blue accent full-width, shows spinner + "Signing in..." while loading). If email format is wrong: "Please enter a valid email address." If password empty: "Please enter your password." On success: redirected to the page you were trying to access (or home if no redirect). If you do not have an account: click "Register" link at bottom. On error: red alert auto-dismisses after 5s. Guest-only — if already logged in, redirects to home.',
'auth'),

('page-register', 'Register Page /register',
'To register: go to /register (click "Register" link in navbar or at bottom of Login page). Card titled "Register" with subtitle "Create your account with email verification". Step 1: fill in "Name (optional)" field (text input, placeholder "Your name"). Step 2: fill in "Email address" field (email input, placeholder "you@example.com"). Step 3: click the "Send verification email" button (blue gradient full-width). If email is invalid: "Please enter a valid email address." After submitting: "Registration successful. Please check your email to verify your account." → redirect /login after 3 seconds. Step 4: check email (including spam) for verification link. Step 5: click link → /set-password, enter password (min 6 chars) in "Password" field, confirm in "Confirm password" field, click "Set password" → redirected to home. Guest-only route.',
'auth'),

('page-setpassword', 'Set Password Page /set-password',
'Reached via email verification link. Card: title "Set Password", subtitle "Your email has been verified. Set your password to complete registration." Step 1: type password in "Password" field (min 6 chars, placeholder "At least 6 characters") — 👁️ to toggle visibility. Step 2: re-enter in "Confirm password" field (placeholder "Re-enter password"). Step 3: click "Set password" button (blue accent full-width). If too short: "Password must be at least 6 characters." If mismatch: "Passwords must match." On success: redirected to home after 2 seconds.',
'auth'),

('page-profile', 'Profile Page /profile',
'Auth-required route (redirects to /login?redirect=/profile if not logged in). Simple card: user name (from auth metadata), email, link to /watchlist ("View Watchlist"), Logout button (calls useAuth().logout()). No edit/update functionality currently.',
'auth'),

('page-about', 'About Page /about',
'Go to /about (click "About" in navbar). Shows tech stack: Vue 3, Vite, Vue Router, Bootstrap 5, JavaScript. Interactive demo: enter first name + last name, select a coin (BTC or ETH) — shows dynamic welcome message like "Hello John Doe, welcome to BTC." Cosmetic only — no data saved.',
'pages'),

('admin-layout', 'Admin Panel Layout',
'All /admin/* routes share AdminLayout. Left sidebar: Dashboard, News CMS, Users, Settings. Topbar: page title, realtime connection pill (live/connecting/disconnected), + New article button. Bottom: user card (avatar initial, name, email, Site link, Logout). Permission gate: locked screen if not admin with SQL promotion instructions.',
'admin'),

('admin-dashboard', 'Admin Dashboard /admin',
'KPI cards: total articles, featured, trending, this week. Category bar chart. Top authors ranked #1-#5 with avatars. Recent articles clickable list. Footer stats: total words, avg words/article, unique categories, unique authors. Realtime auto-refresh on news table changes.',
'admin'),

('admin-news-list', 'Admin News CMS /admin/news',
'Full article table: thumbnail, title, summary, category badge, author, date, featured/trending badges. Actions: Preview (public view), Edit, Delete (confirmation modal). Search by title/summary/author/tags. Category filter. + New Article button → /admin/news/new. "Import from CoinDesk" button calls fetch-news Edge Function. Realtime auto-refresh.',
'admin'),

('admin-news-editor', 'Admin News Editor /admin/news/:id',
'GDocs-style editor. Topbar: back, title, save status (unsaved/saved), word count, preview toggle, metadata toggle, view on site link, Save button. Editor: title input, summary textarea (auto-generate, 240 char limit), TipTap rich text (bold, italic, underline, strike, H1-H4, lists, blockquote, code, link, image up to 2MB, undo/redo, word count). Preview panel: rendered article. Metadata panel: category, tags (max 12), cover image URL, author, source, featured/trending toggles, read time slider. Validation: title min 8, body min 20 chars. Dirty state beforeunload protection.',
'admin'),

('admin-users', 'Admin Users /admin/users',
'Stats: total/admins/users counts. Search by name/ID/role. User table: avatar initial, name, email, "you" badge, join date, role badge, Promote/Demote buttons (with confirmation). Self-demotion prevented. Read-only for non-admins.',
'admin'),

('admin-settings', 'Admin Settings /admin/settings',
'Database status: connection, news count, profiles count, last check, re-check button. Account: name, role, refresh. Preferences: dark theme toggle, clear localStorage. RAG section: "Coming soon" placeholder.',
'admin'),

('comp-cointable', 'CoinTable Component',
'CoinTable.vue - sortable coin table. Columns: rank, coin+image+name+symbol, price with flash, 24h change arrow, sparkline, volume, market cap, star+Trade. Sorting: market cap/price/gainers/losers. Search filtering via SearchBar. Props: coins array. Live price merge applied. File: src/components/CoinTable.vue',
'components'),

('comp-coindashboard', 'CoinDashboard Chart Component',
'CoinDashboard.vue - OHLCV chart using Lightweight Charts. Timeframes: 1s,1m,5m,15m,1h,4h,12h,1d,1w. Indicators: Price, MA, EMA, Vol. Crosshair tooltip. Responsive. Real-time WebSocket stream. Bottom: StatCards (Market Cap, Volume, High, Low) + sentiment bar 68/32. Data: Binance klines API + WebSocket. Error: overlay with retry.',
'components'),

('comp-livebadge', 'LiveBadge Component',
'LiveBadge.vue - animated pulsing green dot with "Live" text. Displayed when WebSocket connection to Binance is active. Used on CoinDetail page next to coin name and Admin topbar.',
'components'),

('comp-favoritebutton', 'FavoriteButton Component',
'FavoriteButton.vue - star toggle. Props: coinId, size (sm/md/lg). Filled ★ = saved, empty ☆ = not. Uses useWatchlist: Supabase for auth, localStorage for guests. Used on Markets, CoinDetail, Home.',
'components'),

('comp-newslikebutton', 'NewsLikeButton Component',
'NewsLikeButton.vue - like toggle for news. Props: articleId. Shows ❤️ Liked / 🤍 Like. Uses useReactions: Supabase news_likes (auth) or localStorage (guests). Used on News cards, NewsDetail.',
'components'),

('comp-searchbar', 'SearchBar Component',
'SearchBar.vue - search input with magnifying glass icon, clear X button. Props: modelValue, label, placeholder. Used on Markets, News, Admin pages.',
'components'),

('comp-pagination', 'Pagination Component',
'Pagination.vue - page nav. Props: currentPage, totalPages. Emits: page-change. Prev/next + page numbers with ellipsis. Disabled states. Used on Markets, News.',
'components'),

('comp-themetoggle', 'ThemeToggle Component',
'ThemeToggle.vue - sun/moon toggle. Uses useTheme: localStorage "theme" key, data-theme on <html>, CSS variables, default dark. Smooth CSS transitions.',
'components'),

('comp-prices', 'Live Prices & PriceWithArrow',
'livePrices.js service: singleton subscription manager with ref counting. start(coins), stop(), getLatest(), applyLiveFlashes(). PriceWithArrow.vue: props price/flash/pulse/size/inline, formats price, shows green↑/red↓ arrow with pulsing flash. WebSocket (websocket.js): Binance stream !miniTicker@arr, REST polling fallback 3s, reconnect exponential backoff max 8.',
'components'),

('comp-richtexteditor', 'RichTextEditor (TipTap)',
'RichTextEditor.vue - WYSIWYG editor. Extensions: StarterKit (bold, italic, H1-H4, lists, blockquote, code, hr), Underline, Link, Image (URL/paste/drag/upload max 2MB), Placeholder. Toolbar with icons. Word/char counter. v-model. HTML sanitized server-side via DOMPurify.',
'components'),

('comp-pagehero', 'PageHero Component',
'PageHero.vue - full-width banner with /hero.jpg background, dark overlay, title, subtitle. Used on Markets, Watchlist, About, News.',
'components'),

('comp-loading-emptystate', 'LoadingSpinner & EmptyState',
'LoadingSpinner.vue - centered spinner with message prop, CSS .spinner-crypto. Used on all pages during fetch. EmptyState.vue - placeholder for empty/error. Props: icon, title, message. Default slot for action buttons. Used on Markets ("No matches"), CoinDetail ("Coin not found"), Watchlist ("empty"), NewsDetail ("not found").',
'components'),

('comp-binancesparkline', 'BinanceSparkline Component',
'BinanceSparkline.vue - canvas sparkline. Props: trend (up/down), width, height. Random-walk line with green/red gradient. Used in CoinTable rows.',
'components'),

('comp-statcard', 'StatCard Component',
'StatCard.vue - stat display. Props: label, value, changeClass. Used on Home "Market at a Glance", CoinDetail stats.',
'components'),

('comp-radarmap', 'RadarMap (Adoption Map)',
'RadarMap.vue (components/geo/) - world map canvas with GeoJSON. Colors by Chainalysis 2025 adoption level. Hover tooltip: country, rank, score, level. Legend. Data: src/data/adoptionIndex.json. Used on Home page.',
'components'),

('ai-assistant', 'AI Assistant (Chatbot)',
'To use the AI assistant: click the 💬 button at the bottom-right corner of any page. Panel titled "Crypto Assistant" with message area, quick prompt buttons ("Market summary", "Explain BTC"), and text input at bottom. Type question and press Enter. The AI uses RAG: (1) query rewriting via Gemini 1.5 Flash, (2) hybrid retrieval (vector similarity + full-text search, merged via Reciprocal Rank Fusion), (3) context assembly with matched documents, live prices, page context, (4) answer generation via Gemini 1.5 Flash. Answers include markdown formatting and cited sources [1],[2] etc. After each answer, source documents are shown with ✓ for cited ones. Welcome message: "Hi — I can explain coins, summarise markets, or suggest what to check on the dashboard." Quick prompts: "Market summary" for market overview, "Explain BTC" for Bitcoin details. Powered by Gemini 1.5 Flash via Supabase Edge Function. Role-aware: extra features for admin users. Conversation history is remembered within the chat window. Backend: supabase/functions/chat/index.ts.',
'ai'),

('workflow-auth', 'Authentication Workflow',
'Registration (2 phases): (1) Go to /register (click "Register" in navbar or login page footer). Fill "Name (optional)" + "Email address". Click "Send verification email". Check email inbox/spam for verification link. (2) Click link → /set-password. Enter password (min 6 chars) + confirm. Click "Set password" → redirected to home. Technical: requestRegistration() generates 20-char temp password → supabase.auth.signUp({email,tempPassword, options:{emailRedirectTo:/set-password}}) → upsert profiles(id,email,name,role:"user"). setPassword() → supabase.auth.updateUser({password}) + bcrypt hash in profiles.password. LOGIN: /login → email+password → signInWithPassword → redirect ?redirect= or home. LOGOUT: navbar dropdown or /profile → signOut → home. Session: onAuthStateChange. Guest-only: /login, /register. Auth-required: /profile, /watchlist. No OAuth, no password reset.',
'workflows'),

('workflow-watchlist', 'Watchlist Workflow',
'Star icon on any coin toggles favorite. Auth: saves to Supabase watchlist table (user_id, coin_id). Guests: localStorage "watchlist_ids". Watchlist page /watchlist shows saved coins in CoinTable. Empty: "Watchlist is empty" with CTA. useWatchlist composable: watchlistIds, isFavorite, toggleFavorite, removeFavorite.',
'workflows'),

('workflow-news-cms', 'News CMS Workflow (Admin)',
'AUTO: Supabase cron hourly → fetch-news Edge Function → CoinDesk RSS → parse XML → Gemini expand short content → deduplicate by source_url → insert into news table. Also callable via "Import from CoinDesk" button in /admin/news. MANUAL: /admin/news → New Article → TipTap editor → title (min 8), summary (max 240), body (min 20), optional metadata (category, tags max 12, image, author, source, featured/trending, read time) → Save. EDIT: click Edit → modify → auto-save indicator → Preview toggle → Save. DELETE: trash icon → confirmation modal → delete. Realtime auto-refresh.',
'workflows'),

('workflow-comments', 'Comments Workflow',
'VIEW: all users see comments on /news/:id (username, date, text, oldest first). POST: login required → textarea → supabase.comments insert (article_id, user_id, user_name, text). DELETE: × button on own comments only (RLS auth.uid()). Cache: localStorage.',
'workflows'),

('workflow-errors', 'Error Handling Patterns',
'Pattern 1: inline error alert (Markets, News, Admin). Pattern 2: EmptyState with error + back button (CoinDetail "not found", NewsDetail "not found"). Pattern 3: try/catch console.log + error state. Pattern 4: chart error overlay with retry. Pattern 5: WebSocket reconnect exponential backoff max 8 + REST polling fallback. Pattern 6: permission locked screen for non-admins, read-only banners. Pattern 7: form validation (email format, password min 6/match, title min 8, body min 20, max 12 tags).',
'workflows'),

('faq-live-prices', 'FAQ - Live Prices',
'Q: How do live prices work? A: Binance WebSocket (wss://stream.binance.com:9443/ws/!miniTicker@arr). Falls back to REST API polling every 3 seconds. Reconnects with exponential backoff (max 8). Q: Which coins? A: All USDT pairs except stablecoins (USDC, BUSD, DAI, FDUSD, TUSD, USDD) and leveraged tokens (UP/DOWN/BEAR/BULL). Q: Flash colors? A: Green pulse for increase, red for decrease. Q: Delay? A: ~1 second. Q: Where to see? A: Home page, /markets table, /coin/:id chart, /watchlist.',
'faq'),

('faq-chart', 'FAQ - Charts',
'Q: How to view charts? A: Go to /coin/:id (click any coin on /markets or home). Q: Chart library? A: TradingView Lightweight Charts. Q: Timeframes? A: 1s,1m,5m,15m,1h,4h,12h,1d,1w. Q: Indicators? A: Moving Average (MA), Exponential MA (EMA), Volume bars. Q: Real-time? A: Yes, via WebSocket stream. Q: How to read? A: Hover for crosshair tooltip with open, high, low, close, volume.',
'faq'),

('faq-auth', 'FAQ - Authentication',
'Q: Create account? A: /register → email + optional name → "Send verification email" → check email → click link → /set-password → set password (min 6 chars) → done. Q: No email? A: Check spam folder. Q: Forgot password? A: Not implemented, contact admin. Q: Browse without login? A: Yes, login only for watchlist, comments, likes. Q: Become admin? A: Existing admin promotes you via /admin/users, or SQL: UPDATE profiles SET role="admin" WHERE email="your@email.com". Q: Change name? A: Not currently.',
'faq'),

('faq-data-sources', 'FAQ - Data Sources',
'Q: Coin data? A: CoinGecko API (market data, images, descriptions) + Binance WebSocket/REST (live prices). Q: News? A: CoinDesk RSS, fetched hourly by fetch-news Edge Function, expanded by Gemini. Q: How current? A: Prices near real-time (~1s), news hourly, CoinGecko cached 5 min.',
'faq'),

('faq-general', 'FAQ - General',
'Q: Add to watchlist? A: Click star ★ on any coin in /markets, home, or coin detail. Q: AI Assistant? A: 💬 button bottom-right. Q: Switch theme? A: Sun/moon toggle in top navbar. Q: Mobile? A: Responsive Bootstrap 5. Q: Share articles? A: Copy URL from browser at /news/:id. Q: Built by? A: COS30043 Swinburne University. Q: Navigate? A: Top navbar: Home, Markets, News, About, Watchlist. Admin users see Admin link.',
'faq'),

-- =============================================================================
-- Edge Functions (user-facing summary)
-- =============================================================================

('edge-fetchnews', 'News Import (fetch-news)',
'News articles are automatically imported from CoinDesk RSS every hour. This keeps the news feed up to date with the latest crypto news. Short news snippets are expanded into full articles for a better reading experience. Admin users can also manually trigger an import via the "Import from CoinDesk" button in the Admin panel.',
'edge-functions'),

('edge-chat', 'AI Assistant (chat)',
'The AI Assistant (chatbot) uses Google Gemini 1.5 Flash with RAG to answer your questions about crypto coins, markets, and the CryptoDash app itself. It searches through documentation, coin data, and news articles to provide accurate, cited answers. The assistant also has access to live prices and knows which page you are on for context-aware responses.',
'edge-functions'),

('edge-syncguides', 'Guide Sync (sync-guides)',
'This process syncs the app documentation from the guides table into the vector database so the AI Assistant can search and retrieve relevant information to answer your questions.',
'edge-functions'),

('comp-chartplaceholder', 'Chart Placeholder',
'When chart data is temporarily unavailable, a placeholder with the text "Price chart — coming soon" is shown on the Coin Detail page.',
'components'),

('comp-marketoverviewcards', 'Market Overview Cards',
'Compact coin cards shown on the Home page "Top by Volume" section. Each card shows coin image, name, symbol, price, 24h change, and market cap. Click any card to view the coin detail page.',
'components'),

('comp-coincard', 'Trending Coin Cards',
'Trending coin cards on the Home page show the 6 most volatile coins with image, name, symbol, price with directional arrow, and 24h change percentage. Click any card to view the coin detail page.',
'components')

;
