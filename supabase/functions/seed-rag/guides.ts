export const guideDocs = [
  /* ========== APP OVERVIEW ========== */
  {
    id: "app-overview",
    title: "CryptoDash App Overview",
    category: "general",
    content: `CryptoDash is a cryptocurrency market dashboard and news platform.
Tech stack: Vue 3, Vite, Vue Router 5, Bootstrap 5, Supabase (PostgreSQL + Auth + Edge Functions), Binance WebSocket/REST, CoinGecko API, TipTap (rich text editor), Lightweight Charts (trading charts), DOMPurify, marked, bcryptjs, Google Gemini AI.

Key features:
- Live cryptocurrency prices via Binance WebSocket (real-time, no refresh needed)
- Interactive OHLCV candlestick charts with MA/EMA indicators and timeframe selection
- Personalized watchlist (star coins to track them)
- News feed from CoinDesk RSS, auto-updated hourly via Supabase cron
- AI Assistant (chatbot) powered by Gemini with RAG - can answer questions about coins, markets, and the app itself
- Admin CMS for managing news articles, users, and settings
- Dark/light theme toggle, persistent via localStorage

Color scheme: Dark theme with accent colors (#667eea purple, #764ba2 violet, gold #f0b90b for crypto elements). Light theme also available.`,
  },

  /* ========== NAVIGATION ========== */
  {
    id: "nav-topbar",
    title: "Top Navigation Bar (Navbar)",
    category: "layout",
    content: `The top navigation bar (Navbar.vue) is sticky and always visible.
On the left:
- Brand logo + "CryptoDash" text → links to Home (/)
- Nav links: Home, Markets, News, About, Watchlist
On the right:
- ThemeToggle button (sun/moon icon) - toggles dark/light mode
- If logged in: User dropdown showing avatar initial + name. Menu: Profile, Admin (if admin role, also shows "★ Admin" badge on navbar), Logout (red text)
- If guest: "Login" button with accent style

Navbar uses Bootstrap 5 collapse for mobile. It closes automatically on route change.
The "Watchlist" link and Admin badge are conditionally shown based on auth state.`,
  },

  {
    id: "nav-footer",
    title: "Footer",
    category: "layout",
    content: `Footer (Footer.vue) is a simple bar at the bottom of every page.
Shows: Brand logo + "CryptoDash" name + university credit "COS30043 · Swinburne University" + dynamic copyright year.
Layout: mt-auto on main content pushes footer to bottom.`,
  },

  {
    id: "nav-routes",
    title: "All Routes & Pages",
    category: "layout",
    content: `Complete list of routes:

Public pages (no login required):
  / (Home) - Market summary, trending coins, adoption map
  /markets (Markets) - Sortable coin table with search, filter, pagination
  /coin/:id (CoinDetail) - Coin detail with interactive chart, stats, description
  /news (News) - News grid with search, category filter, pagination
  /news/:id (NewsDetail) - Full article with comments
  /about (About) - Tech stack info, interactive demo form
  /set-password (SetPassword) - Set password after email verification

Guest-only pages (redirect to / if logged in):
  /login (Login) - Email + password login
  /register (Register) - Registration with email verification

Auth-required pages:
  /profile (Profile) - Account info, watchlist link, logout
  /watchlist (Watchlist) - Saved coins with live prices

Admin-required pages (nested, requires admin role):
  /admin (AdminDashboard) - KPI stats, category chart, recent articles
  /admin/news (AdminNews) - Full news table, CRUD, CoinDesk import
  /admin/news/:id (AdminNewsEdit) - TipTap editor, create/edit articles
  /admin/users (AdminUsers) - User list with role management
  /admin/settings (AdminSettings) - DB status, account, preferences`,
  },

  /* ========== HOME PAGE ========== */
  {
    id: "page-home",
    title: "Home Page",
    category: "pages",
    content: `Home page at /. Full viewport hero section with:
- Title "Track Every Move" with subtitle
- Stat pills: "100+ Coins", "24/7 Live", "Free"
- CTA buttons: "Explore Markets" → /markets, "View News" → /news

Below hero:
- Section: "Market at a Glance" - 3 StatCards: Tracked coins count, Combined market cap, Average 24h change (from CoinGecko top 50 data)
- Section: "Trending Now" - Card list of 6 most volatile coins (sorted by abs(change)). Uses TransitionGroup for animated enter/leave. Each card: coin image, name, symbol, price with arrow, 24h change.
- Section: "Top by Volume" - MarketOverviewCards grid of 6 coins sorted by volume
- Section: "Latest News" - 3 most recent news cards
- Section: "Global Crypto Adoption" - Geo map of Chainalysis 2025 Global Crypto Adoption Index

Data sources: api.getTrendingCoins(), api.getTopCoins(50), fetchNews({page:1, pageSize:3})
Live prices are merged into coin data from WebSocket. Coins flash green/red on price change.
The adoption map is rendered on a canvas with GeoJSON country outlines. Countries colored by adoption level (Very Low to Very High). Hover to see country name, rank, score, level.`,
  },

  /* ========== MARKETS PAGE ========== */
  {
    id: "page-markets",
    title: "Markets Page",
    category: "pages",
    content: `Markets page at /markets.

PageHero banner with total coins, gainers, losers counts.
SearchBar: filter coins by name or symbol.
SortSelect dropdown: options - Market cap (default), Highest price, Top gainers, Top losers.
Coin table with columns: Rank #, Coin (image + name + symbol), Price (with live flash animation), 24h Change (green/red arrow + percentage), 7d Sparkline (mini line chart), Volume (24h), Market Cap, Actions (star favorite + Trade link to detail).

Pagination: 20 coins per page, prev/next buttons with visible page numbers.
Empty state: "No matches" when search yields 0 results.
Error state: inline alert.

Click any coin name → navigates to /coin/:id.
Data: api.getTopCoins(100) from CoinGecko. Live prices merged via WebSocket.`,
  },

  /* ========== COIN DETAIL ========== */
  {
    id: "page-coindetail",
    title: "Coin Detail Page",
    category: "pages",
    content: `Coin detail page at /coin/:id.

Header: coin image + name + symbol, LiveBadge (animated pulsing dot when WebSocket connected), FavoriteButton (star toggle).
Interactive chart (CoinDashboard) with:
- Timeframe selector: 1s, 1m, 5m, 15m, 1h, 4h, 12h, 1d, 1w
- Indicator buttons: Price (default), MA (Moving Average), EMA (Exponential Moving Average), Vol (Volume)
- Crosshair tooltip for precise values
- Responsive resize
- Real-time updates via WebSocket (latest price line on the right edge)
- Bottom stat cards: Market Cap, 24h Volume, 24h High, 24h Low
- Sentiment bar: 68% Bullish / 32% Bearish (static placeholder)

About section: coin description from CoinGecko (first 1000 chars, HTML stripped).

Loading state: LoadingSpinner.
Error/not-found state: EmptyState "Coin not found" with back-to-markets link.
Data: api.getCoinById(id) → CoinGecko detail + Binance ticker for live price overlay.`,
  },

  /* ========== WATCHLIST ========== */
  {
    id: "page-watchlist",
    title: "Watchlist Page",
    category: "pages",
    content: `Watchlist page at /watchlist. Shows user's saved (favorited) coins.
Uses same CoinTable layout as Markets page (search, sort, pagination).
Data: Filters api.getTopCoins(50) by user's watchlist IDs.

If watchlist is empty: EmptyState "Watchlist is empty" with "Browse Markets" CTA button.
Watchlist is synced with Supabase watchlist table (for logged-in users) or localStorage (for guests).
Add/remove coins via FavoriteButton star toggle anywhere in the app.

Requires no special auth for viewing (guests see localStorage favorites).`,
  },

  /* ========== NEWS PAGES ========== */
  {
    id: "page-news",
    title: "News Page",
    category: "pages",
    content: `News page at /news.

Hero banner with "Crypto News" title and subtitle.
SearchBar: searches across title, summary, content, category, date, source, tags.
Featured article: large card with image, "Featured" badge, category, title, summary, author avatar+name, publish date, read time. Links to /news/:id.
Category filter buttons: shows each category name with article count badge. Click to filter, click again to clear.
Article grid: 3 columns, each card shows: image, category badge, date, title, source name, read time, summary, max 2 tags, NewsLikeButton.

Pagination: 9 articles per page, prev/next with visible pages and ellipsis.
Empty state when no matches: "No articles match your search."
Data: fetchNews(), fetchNewsCount(), fetchCategoryCounts() from news service (reads Supabase news table).`,
  },

  {
    id: "page-newsdetail",
    title: "News Detail Page",
    category: "pages",
    content: `News detail page at /news/:id.

Hero image, category badge, read time badge, article title.
Author section: avatar, name, publish date and time, source name.
Full HTML content rendered with v-html (sanitized by DOMPurify on the server side).
Tag links: click any tag → navigates to /news?q=tag to search.
Action buttons: NewsLikeButton (like/unlike), "Read original source" link (opens in new tab).
Comments section:
- Shows existing comments: username, date, text
- Delete button on own comments (if user.id matches)
- If no comments: "No comments yet"
- Comment form (only visible when logged in): textarea + "Post comment" button
Related articles sidebar: computed from all articles by matching category or tags, max 4.

Data: fetchNewsById(id), getComments(article.id) from Supabase comments table.
Loading: LoadingSpinner. Not found: EmptyState "Article not found" with back-to-news link.`,
  },

  /* ========== AUTH PAGES ========== */
  {
    id: "page-login",
    title: "Login Page",
    category: "pages",
    content: `Login page at /login. Guest-only; if already logged in, redirects to /.

Login card with:
- Email input with validation (valid email format required)
- Password input with show/hide toggle (eye icon)
- Submit button with loading spinner state
- Error alert (auto-dismiss after 5s) for invalid credentials
- Link: "Don't have an account? Register here" → /register

On success: 500ms delay, then redirect to ?redirect= param or /.
Uses useAuth().login(email, password) which calls supabase.auth.signInWithPassword().`,
  },

  {
    id: "page-register",
    title: "Register Page",
    category: "pages",
    content: `Register page at /register. Guest-only; if logged in, redirects to /.

Registration card with:
- Name input (optional)
- Email input (required, must be valid format)
- Submit button "Send verification email" with loading spinner
- Success message + auto-redirect to /login after 3s
- Error alert for registration failures
- Link: "Already have an account? Login here" → /login

Flow:
1. useAuth().requestRegistration(email, name) called
2. Generates random temp password
3. Calls supabase.auth.signUp({ email, password: tempPassword, options: { emailRedirectTo: /set-password } })
4. Upserts profile in profiles table with role "user"
5. Shows success message: "Registration successful! Please check your email to set your password."`,
  },

  {
    id: "page-setpassword",
    title: "Set Password Page",
    category: "pages",
    content: `Set Password page at /set-password. Reached via email verification link.

Password card with:
- New password input with show/hide toggle (min 6 chars)
- Confirm password input with show/hide toggle
- Submit button with loading spinner
- Validation: passwords must match, min 6 characters
- Error/success alerts

Flow:
1. useAuth().setPassword(password) called
2. Calls supabase.auth.updateUser({ password })
3. Upserts profile with name from user_metadata, stores bcrypt hash in profiles.password
4. On success: redirects to / after 2s with success message`,
  },

  {
    id: "page-profile",
    title: "Profile Page",
    category: "pages",
    content: `Profile page at /profile. Requires authentication.

Simple card showing:
- User email
- User name (if set)
- Link to Watchlist → /watchlist
- Logout button (red)

Uses useAuth().user reactive ref for data.
Logout calls supabase.auth.signOut(), sets user to null, redirects to /.`,
  },

  /* ========== ABOUT PAGE ========== */
  {
    id: "page-about",
    title: "About Page",
    category: "pages",
    content: `About page at /about.

Shows tech stack list: Vue 3, Vite, Vue Router, Bootstrap 5, JavaScript.
Site description paragraph.
Interactive demo form: First name + Last name inputs + Coin selector dropdown (BTC/ETH).
When user types name and selects coin, a dynamic welcome message appears:
"Welcome to CryptoDash, {firstName} {lastName}, your favourite is {coin}!"
Below: coin description block that changes based on selected coin.

This is purely a cosmetic/demo page, no data is saved.`,
  },

  /* ========== ADMIN PAGES ========== */
  {
    id: "admin-layout",
    title: "Admin Panel Layout",
    category: "admin",
    content: `Admin panel at /admin/*. All admin routes share AdminLayout.

Layout structure:
- Left sidebar (collapsible): 4 nav items
  - Dashboard (chart icon)
  - News CMS (edit icon)
  - Users (people icon)
  - Settings (gear icon)
- Top bar: page title, realtime connection pill (live/connecting/disconnected with colored dots), "+ New article" button
- User card at sidebar bottom: avatar initial circle, name, email, "Site" link → /, Logout button

Permission gate: If user is not admin, shows a locked screen with lock icon and instructions:
"You don't have admin access yet. If you just created your account, ask an admin to promote you.
To become admin, run this SQL: UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email';"

Admin routes: /admin (Dashboard), /admin/news (News CMS), /admin/news/:id (Editor), /admin/users (Users), /admin/settings (Settings)`,
  },

  {
    id: "admin-dashboard",
    title: "Admin Dashboard",
    category: "admin",
    content: `Admin dashboard at /admin.

KPI cards row:
- Total articles count
- Featured count
- Trending count
- This week count (articles published this week)

Category breakdown: horizontal bar chart (Bootstrap progress bars) showing article count per category.

Top authors: ranked #1 to #5 with avatar circles, name, total words written, total articles.

Recent articles: clickable list of latest articles (title + date + category) → navigates to editor.

Footer stats: total words written, avg words/article, unique categories, unique authors.

Realtime subscription: auto-refreshes on any INSERT/UPDATE/DELETE on the news table via Supabase Realtime.`,
  },

  {
    id: "admin-news-list",
    title: "Admin News List (CMS)",
    category: "admin",
    content: `Admin news list at /admin/news.

Full table of all articles with columns:
- Thumbnail image
- Title
- Summary (truncated)
- Category badge (colored)
- Author name
- Published date
- Status badges: "Featured" (gold), "Trending" (blue)
- Actions row: Preview (eye icon → navigates to public /news/:id), Edit (pencil → /admin/news/:id), Delete (trash with confirmation modal saying "Are you sure?")

Search bar: filter by title/summary/author/tags.
Category filter dropdown.
"+ New Article" button → /admin/news/new.
"Import from CoinDesk" button → calls fetch-news Edge Function (admin/guest) to import RSS articles.
Read-only warning banner if user is not admin (still can view).
Realtime subscription auto-refreshes the list.
Pagination if many articles.`,
  },

  {
    id: "admin-news-editor",
    title: "Admin News Editor",
    category: "admin",
    content: `Admin news editor at /admin/news/:id. If id is "new", creates a new article.
GDocs-style layout.

Top toolbar bar:
- Back arrow ← (navigates back)
- Article title (editable, large text)
- Save status indicator: "Unsaved changes" or "Saved at HH:MM:SS"
- Word/character count
- Preview toggle (eye icon)
- Metadata panel toggle (gear icon)
- "View on site" link (only for existing articles)
- Save/Publish button (accent color)

Editor area (left, 2/3 width):
- Title input (large heading style)
- Summary textarea (with auto-generate from body button, 240 char limit, shows remaining chars)
- RichTextEditor (TipTap): Full WYSIWYG with toolbar:
  - Bold, Italic, Underline, Strike
  - Headings H1-H4
  - Bullet list, Ordered list
  - Blockquote, Code block
  - Link (URL with popover), Image (URL/paste/drag-drop, up to 2MB)
  - Horizontal rule, Undo/Redo
  - Word/character counter

Preview panel (right side, toggleable): Rendered article preview with cover image, title, content as HTML.

Metadata panel (right side, toggleable, resizable):
- Category: text input
- Tags: input with comma/enter to add, max 12 tags, click X to remove, displayed as badges
- Cover image URL + preview thumbnail
- Author name + author avatar URL
- Source name + source URL
- Featured toggle switch
- Trending toggle switch
- Read time: slider (1-15 min)

Validation on save: title min 8 chars, summary required, body min 20 chars, image URL must be valid format.
Dirty state: prevents accidental navigation away with beforeunload confirmation.
Data: Creates/updates via createNews()/updateNews() in news.js service.`,
  },

  {
    id: "admin-users",
    title: "Admin Users Management",
    category: "admin",
    content: `Admin users page at /admin/users.

Stats bar: Total users count, Admins count, Regular users count.
Search bar: filter by name, ID, or role.

User table:
- Avatar initial circle (first letter of name)
- Name
- Email
- "you" badge for current user
- Join date
- Role badge: "admin" (accent color) or "user" (secondary color)
- Actions: Promote to Admin button, Demote to User button (with confirmation modal "Are you sure you want to demote?")

Important rules:
- Self-demotion is prevented (cannot demote yourself)
- Read-only warning if current user is not admin (can view but not modify)
- Uses AdminLayout permission gate, so only admins access this page`,
  },

  {
    id: "admin-settings",
    title: "Admin Settings",
    category: "admin",
    content: `Admin settings page at /admin/settings.

Database status panel:
- Connection status icon (connected/disconnected)
- News count
- Profiles count
- Last checked timestamp
- "Re-check" button

Account panel:
- Name
- Role
- "Refresh role" button

Preferences:
- Dark theme toggle (applies immediately)
- "Clear local cache" button (clears localStorage)

RAG pipeline section: label "Coming soon" with description about news_embeddings table and Gemini Q&A integration.`,
  },

  /* ========== COMPONENTS ========== */
  {
    id: "comp-cointable",
    title: "CoinTable Component",
    category: "components",
    content: `CoinTable.vue - Sortable table of cryptocurrencies.
Used on: Markets page, Watchlist page.

Columns:
- Rank (# number)
- Coin: image (with fallback on error) + name + symbol
- Price: formatted with live flash animation (green/red background pulse)
- 24h Change: arrow up/down + percentage (green if positive, red if negative)
- 7d Sparkline: mini canvas chart
- Volume (24h): formatted volume
- Market Cap: formatted market cap
- Actions: FavoriteButton (star toggle) + "Trade" link → /coin/:id

Sorting: controlled by SortSelect component. Options: market cap desc (default), price desc, 24h change desc, 24h change asc.
Supports search filtering via SearchBar.
Data: receives coins array as prop, applies live price merge.`,
  },

  {
    id: "comp-coincard",
    title: "CoinCard Component",
    category: "components",
    content: `CoinCard.vue - Compact card for displaying a single coin.
Used on: Home page trending section.

Shows: coin image, name, symbol, price with directional arrow, 24h change percentage.
Clickable → navigates to /coin/:id.
Style: card with hover lift effect.`,
  },

  {
    id: "comp-coindashboard",
    title: "CoinDashboard Chart Component",
    category: "components",
    content: `CoinDashboard.vue - Interactive OHLCV candlestick chart using Lightweight Charts library.
Used on: CoinDetail page.

Features:
- Timeframe selector buttons: 1s, 1m, 5m, 15m, 1h, 4h, 12h, 1d, 1w
- Indicators: Price (default candlestick), MA (Moving Average line), EMA (Exponential Moving Average line), Vol (Volume histogram bars)
- Crosshair: horizontal + vertical lines with tooltip showing O/H/L/C values at cursor position
- Responsive: auto-resizes to container width
- Real-time updates: latest price from WebSocket plotted as a streaming line on the right edge
- Color scheme: green candles (up), red candles (down), matching theme

Bottom bar:
- StatCards: Market Cap, 24h Volume, 24h High, 24h Low (non-interactive)
- Sentiment bar: 68% Bullish / 32% Bearish (static visual)

Data: Binance klines/candles API for historical data, WebSocket for real-time.
Loading state: spinner. Error state: overlay with retry button.`,
  },

  {
    id: "comp-livebadge",
    title: "LiveBadge Component",
    category: "components",
    content: `LiveBadge.vue - Animated "Live" badge indicator.
Shows pulsing green dot + "Live" text.
Displayed when WebSocket has an active connection to Binance.
Used on: CoinDetail page next to coin name, Admin topbar.`,
  },

  {
    id: "comp-favoritebutton",
    title: "FavoriteButton Component",
    category: "components",
    content: `FavoriteButton.vue - Star toggle for favoriting coins.
Props: coinId (string), size ('sm' | 'md' | 'lg').
Shows filled star (★) if favorited, empty star (☆) if not.
Click toggles favorite state.
Uses useWatchlist composable:
- Logged-in users: persisted to Supabase watchlist table
- Guests: persisted to localStorage
Used on: Markets table rows, CoinDetail header, Home page coin cards.`,
  },

  {
    id: "comp-newslikebutton",
    title: "NewsLikeButton Component",
    category: "components",
    content: `NewsLikeButton.vue - Like/unlike toggle for news articles.
Props: articleId (number|string).
Shows "❤️ Liked" (if liked) or "🤍 Like" (if not).
Uses useReactions composable:
- Logged-in users: persisted to Supabase news_likes table
- Guests: persisted to localStorage
Used on: News article cards and detail page.`,
  },

  {
    id: "comp-searchbar",
    title: "SearchBar Component",
    category: "components",
    content: `SearchBar.vue - Reusable search input.
Props: modelValue (v-model), label, placeholder.
Features: magnifying glass icon on the left, clear (X) button on the right when text exists.
Used on: Markets, News list, Admin News, Admin Users.`,
  },

  {
    id: "comp-pagination",
    title: "Pagination Component",
    category: "components",
    content: `Pagination.vue - Page navigation.
Props: currentPage (number), totalPages (number).
Emits: page-change (page number).
Shows: prev button, page numbers with ellipsis for large ranges, next button.
Disabled states: prev disabled on page 1, next disabled on last page, ellipsis not clickable.
Used on: Markets page, News page.`,
  },

  {
    id: "comp-richtexteditor",
    title: "RichTextEditor (TipTap) Component",
    category: "components",
    content: `RichTextEditor.vue - Full WYSIWYG text editor using TipTap.
Used in: Admin News Editor for writing article body.

Extensions:
- StarterKit: bold, italic, heading (H1-H4), bullet list, ordered list, blockquote, code block, horizontal rule
- Underline
- Link: URL input popover, click to edit/remove
- Image: URL input, paste from clipboard, drag-and-drop, file upload (max 2MB via FileReader base64)
- Placeholder: "Write your article content here..."

Toolbar: organized formatting buttons with icons. Visual active state for current formatting.
Link/image buttons open small popovers for URL input.
Word and character counter at the bottom.
v-model compatible for content (HTML string).

Important: HTML output is sanitized server-side via DOMPurify before DB insert.`,
  },

  {
    id: "comp-themetoggle",
    title: "ThemeToggle Component",
    category: "components",
    content: `ThemeToggle.vue - Dark/light mode toggle.
Shows sun icon (for dark mode - click to switch to light) or moon icon (for light mode - click to switch to dark).
Uses useTheme composable:
- Persists preference in localStorage key 'theme'
- Sets data-theme attribute on <html> element
- CSS variables drive all color schemes throughout the app
- Default: dark mode
- CSS transitions for smooth theme switching
Used on: Navbar.`,
  },

  {
    id: "comp-prices",
    title: "Live Prices & PriceWithArrow Components",
    category: "components",
    content: `Live price system across the app:

livePrices service (livePrices.js):
- Singleton subscription manager with ref counting
- start(coins): subscribes to WebSocket for specific coin symbols
- stop(): unsubscribes when component unmounts
- getLatest(): returns current price map
- applyLiveFlashes(): applies flash animation states to coin data

PriceWithArrow.vue:
- Props: price (number), flash ('up'|'down'|null), pulse (boolean), size ('sm'|'md'|'lg'), inline (boolean)
- Formats price using formatPrice() util
- Shows arrow up (green) or down (red)
- Pulsing background flash animation on price change
- Adaptive size

WebSocket (websocket.js):
- Connects to Binance stream: wss://stream.binance.com:9443/ws/!miniTicker@arr
- Parses mini-ticker messages (24hr ticker data)
- REST polling fallback every 3s if WebSocket fails
- Reconnect logic: max 8 attempts with exponential backoff
- toBinancePair(): converts localId to Binance symbol format`,
  },

  /* ========== AI ASSISTANT ========== */
  {
    id: "ai-assistant",
    title: "AI Assistant (Chatbot)",
    category: "features",
    content: `AI Assistant (AiAssistant.vue) - Floating chat panel powered by Gemini AI with RAG.

Access: Click the floating 💬 button in the bottom-right corner of any page.
Panel opens: chat header "Crypto Assistant" + "Powered by Gemini + live prices", message area, quick prompt buttons, input field.

Quick prompts:
- "Market summary" - summarizes current market conditions using live prices
- "Explain BTC" - explains Bitcoin with coin data

How it works:
1. User types a question or clicks a quick prompt
2. Frontend collects: query text, current live prices (livePrices.getLatest()), user role, current route name
3. Calls supabase.functions.invoke('chat', { query, livePrices, role, currentView })
4. Edge Function (chat/index.ts):
   a. Embeds query using Gemini Embedding-001 (768-dimensional vector)
   b. Calls match_documents() RPC for vector similarity search against Supabase documents table
   c. Gets top 5 matching documents with similarity scores
   d. Builds prompt with: system prompt (role-aware), user context, matched documents as context, live prices, question
   e. Calls Gemini 2.5 Flash Lite for answer generation
   f. Returns { answer (markdown), sources (type, title, similarity%) }
5. Frontend renders markdown via marked.js + DOMPurify sanitization
6. Shows sources below the answer (source type, article title, match %)

Features:
- Chat history in memory (resets on page reload)
- Markdown rendering (bold, lists, code blocks) for formatted answers
- Sources display with similarity percentages
- Welcome message on first open: "Hi — I can explain coins, summarise markets, or suggest what to check on the dashboard."
- Role-aware responses (admin vs regular user)`,
  },

  {
    id: "ai-rag-system",
    title: "RAG System - How It Works",
    category: "features",
    content: `Retrieval-Augmented Generation (RAG) system for the AI Assistant.

Documents table in Supabase (public.documents):
- Columns: id, source ('coin'|'news'|'guide'), source_id, title, content (text), metadata (jsonb), embedding (vector(768)), created_at
- Unique constraint on (source, source_id) for upsert
- HNSW index on embedding for fast vector similarity search
- Vector search function: match_documents(query_embedding vector(768), match_count int default 5)
  Uses cosine distance (<=>) operator, returns id, source, title, content, similarity score

Seed process (seed-rag Edge Function):
1. Fetches top 250 coins from CoinGecko API (markets data)
2. Fetches detailed descriptions for top 30 coins from CoinGecko detail API (partial failure allowed)
3. Indexes each coin: name, symbol, price, market cap, 24h change, volume, ATH + full description
4. Fetches all news from Supabase news table and indexes: title + summary + content
5. Indexes app guide documents: overview, navigation, features, crypto terms
6. For documents without embeddings, generates embedding via Gemini Embedding-001 API (768d)
7. Stores embedding in the documents table

Document categories:
- 'coin' (250 items): Top cryptocurrencies from CoinGecko with market data and descriptions
- 'news' (varies): All published news articles with title, summary, content
- 'guide' (4 items): App documentation (overview, routes, features, crypto terms)

Note: Coin prices in documents are static snapshots from seed time. Live prices are provided separately via livePrices parameter in chat requests.`,
  },

  /* ========== WORKFLOWS ========== */
  {
    id: "workflow-auth",
    title: "Authentication Workflow",
    category: "workflows",
    content: `Complete authentication workflow:

REGISTRATION:
1. User goes to /register
2. Enters email (required) + name (optional)
3. System generates random temporary password
4. Calls supabase.auth.signUp({ email, password: tempPassword, options: { emailRedirectTo: '/set-password' } })
5. Supabase sends verification email with link to /set-password
6. Upserts profile in public.profiles table with role='user'
7. User sees success message, redirected to /login after 3s

EMAIL VERIFICATION + SET PASSWORD:
1. User clicks link in email, lands on /set-password
2. Session is already established by Supabase (from the email link)
3. User enters new password (min 6 chars) + confirm
4. Calls supabase.auth.updateUser({ password })
5. Upserts profile with name from user_metadata
6. Stores bcrypt hash of password in profiles.password
7. Success message → redirect to / after 2s

LOGIN:
1. User goes to /login
2. Enters email + password
3. Calls supabase.auth.signInWithPassword({ email, password })
4. On success: user ref updates, redirect to ?redirect= param or /
5. On error: inline error alert (auto-dismiss 5s)

LOGOUT:
1. User clicks Logout (from dropdown menu or profile page)
2. Calls supabase.auth.signOut()
3. sets user ref to null
4. Redirects to /

SESSION PERSISTENCE:
- On page load: useAuth() calls supabase.auth.getSession() to restore session
- onAuthStateChange listener keeps user ref synced
- useAdmin watches user.id to fetch profile role
- useWatchlist/useReactions switch between Supabase and localStorage based on auth state`,
  },

  {
    id: "workflow-watchlist",
    title: "Watchlist Workflow",
    category: "workflows",
    content: `Watchlist allows users to save coins for quick tracking.

Adding/removing coins:
- Click the star icon (FavoriteButton) on any coin (Markets table, CoinDetail, Home cards)
- Filled star = saved, empty star = not saved

Data persistence:
- Logged-in users: saved to Supabase 'watchlist' table
  - Columns: id (uuid), user_id (FK to auth.users), coin_id (text), created_at
  - Unique on (user_id, coin_id)
  - RLS: users can only see/manage their own watchlist
- Guest users: saved to localStorage key 'watchlist_ids' (JSON array)

Watchlist page (/watchlist):
- Shows only coins that user has saved
- Same CoinTable layout as Markets page
- Empty state: "Watchlist is empty" with "Browse Markets" button
- Remove coins from watchlist directly on the page

Watchlist composable (useWatchlist.js):
- exports: watchlistIds (computed ref), isFavorite(coinId), toggleFavorite(coinId), removeFavorite(coinId)
- Module-level watcher on user: switches between Supabase and localStorage
- Synced across tabs via reactivity`,
  },

  {
    id: "workflow-news-cms",
    title: "News CMS Workflow (Admin)",
    category: "workflows",
    content: `News content management system for admin users.

AUTOMATED IMPORT (CoinDesk RSS):
1. Supabase Cron triggers fetch-news Edge Function every hour
2. Function fetches CoinDesk RSS feed
3. Parses XML to extract articles (title, description, content, image, category, author, date)
4. For articles with short descriptions (< 60 words): calls Gemini 2.5 Flash Lite to expand content into 2-3 paragraphs
5. Deduplicates by source_url against existing DB entries
6. Inserts new articles into Supabase news table
7. Also callable manually via "Import from CoinDesk" button in Admin News list

MANUAL CREATION (Admin):
1. Go to /admin/news → "New Article" button → /admin/news/new
2. Fill in: title (min 8 chars), summary (min 1 char, max 240), body via TipTap editor (min 20 chars)
3. Optional: category, tags (max 12), cover image URL, author details, source, featured/trending toggles, read time
4. Click Save/Publish
5. Creates record in Supabase news table

EDITING:
1. Click Edit on any article row → /admin/news/:id
2. Modify content in TipTap editor
3. Auto-save status indicator
4. Preview toggle to see rendered article
5. Save/Publish updates record

DELETING:
1. Click Delete (trash icon) on any article row
2. Confirmation modal: "Are you sure?"
3. Confirm → deletes from Supabase news table (and cascades to related comments/likes)

PREVIEW:
- Click Preview (eye icon) → navigates to public /news/:id page in new tab
- "View on site" link in editor

REALTIME: Admin News list auto-refreshes on any change via Supabase Realtime subscription.`,
  },

  {
    id: "workflow-comments",
    title: "Comments Workflow",
    category: "workflows",
    content: `Comments on news articles.

VIEWING:
- All users (even guests) can see comments on /news/:id
- Shows: username, date, comment text
- Sorted by: created_at ascending (oldest first)

POSTING:
- Requires login
- Textarea at bottom of article, "Post comment" button
- Posts to Supabase comments table
- Columns: id, article_id, user_id, user_name, text, created_at
- RLS: authenticated users can insert with their own user_id

DELETING:
- Delete button (×) shown only on user's own comments
- Uses supabase.auth.uid() matching in RLS policy
- Confirms removal

DATA CACHE: useComments composable keeps a localStorage cache of comments for offline resilience.`,
  },

  /* ========== FAQ ========== */
  {
    id: "faq-live-prices",
    title: "FAQ - Live Prices",
    category: "faq",
    content: `Q: How do live prices work?
A: CryptoDash uses Binance WebSocket (wss://stream.binance.com:9443/ws/!miniTicker@arr) for real-time price updates. When the WebSocket disconnects (e.g., network issues), it automatically falls back to REST API polling every 3 seconds. The system reconnects automatically with exponential backoff (up to 8 attempts).

Q: Which symbols are tracked?
A: All USDT trading pairs from Binance. Stablecoins (USDC, BUSD, DAI, FDUSD, TUSD, USDD) and leveraged tokens are filtered out.

Q: Why do prices flash green/red?
A: Price changes trigger a flash animation: green background pulse for price up, red for price down, to give visual feedback of market movement.

Q: Are prices delayed?
A: Binance mini-ticker updates every ~1 second, so prices are near real-time.`,
  },

  {
    id: "faq-chart",
    title: "FAQ - Charts",
    category: "faq",
    content: `Q: What chart library is used?
A: TradingView's Lightweight Charts library - lightweight, performant, designed for financial charts.

Q: What timeframes are available?
A: 1 second, 1 minute, 5 minutes, 15 minutes, 1 hour, 4 hours, 12 hours, 1 day, 1 week.

Q: What indicators are available?
A: MA (Moving Average), EMA (Exponential Moving Average), Volume. You can toggle them on/off individually.

Q: Does the chart update in real-time?
A: Yes, the latest price is streamed via WebSocket and plotted as a line on the right edge of the chart.`,
  },

  {
    id: "faq-auth",
    title: "FAQ - Authentication",
    category: "faq",
    content: `Q: How do I create an account?
A: Go to /register, enter your email and optional name. You'll receive a verification email. Click the link to set your password.

Q: I didn't receive the verification email?
A: Check your spam folder. Make sure you entered the correct email address.

Q: What happens if I forget my password?
A: Password reset is not currently implemented in the UI. Contact an admin for assistance.

Q: Can I use the app without logging in?
A: Yes! You can browse markets, view coin details, read news, and use the AI assistant without an account. Login is only needed for: watchlist, comments, and liking news articles (these work with localStorage for guests, but won't sync across devices).

Q: How do I become an admin?
A: Ask an existing admin to promote you via /admin/users, or run SQL: UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email';`,
  },

  {
    id: "faq-data-sources",
    title: "FAQ - Data Sources",
    category: "faq",
    content: `Q: Where does coin data come from?
A: CoinGecko API for market data (prices, market cap, volume, descriptions, images). Binance WebSocket and REST API for real-time price updates.

Q: Where does news come from?
A: CoinDesk RSS feed (https://www.coindesk.com/arc/outboundfeeds/rss/). Articles are fetched hourly via Supabase cron job and expanded using Gemini AI for richer content.

Q: How current is the data?
A: Coin prices are near real-time via Binance WebSocket. News is updated hourly from CoinDesk. CoinGecko market cap/volume data updates every few minutes.

Q: How does the adoption map work?
A: The Global Crypto Adoption Index visualizes Chainalysis 2025 data. Countries are colored by adoption level (Very Low to Very High). Hover to see country name, global rank, adoption score, and level.`,
  },

  {
    id: "faq-general",
    title: "FAQ - General Usage",
    category: "faq",
    content: `Q: How do I add coins to my watchlist?
A: Click the star icon ★ on any coin in Markets table, Coin Detail, or Home page cards.

Q: How do I use the AI Assistant?
A: Click the 💬 button in the bottom-right corner. Type your question or use the quick prompts ("Market summary", "Explain BTC"). The AI answers using Gemini with RAG - it searches through coin data, news, and app documentation.

Q: Can I customize the theme?
A: Yes, click the sun/moon icon on the navbar to toggle between dark and light themes. Your preference is saved in your browser.

Q: Is there a mobile version?
A: The site is responsive using Bootstrap 5. The navbar collapses, tables scroll horizontally, and charts resize on mobile. No dedicated mobile app.

Q: Can I share articles?
A: There's no built-in share button. You can copy the article URL from your browser's address bar.

Q: Who built this?
A: COS30043 · Swinburne University project.`,
  },

  /* ========== ADDITIONAL COMPONENTS ========== */
  {
    id: "comp-pagehero",
    title: "PageHero Component",
    category: "components",
    content: `PageHero.vue - Reusable page header banner.
Props: title, subtitle.
Renders a full-width banner with background image (/hero.jpg) and dark overlay.
Title displayed large and bold, subtitle below.
Used on: Markets page, Watchlist page, About page, News list page.
Component file: src/components/PageHero.vue`,
  },

  {
    id: "comp-loading-emptystate",
    title: "LoadingSpinner & EmptyState Components",
    category: "components",
    content: `LoadingSpinner.vue - Centered loading indicator.
Props: message (string, default "Loading...").
Shows a CSS spinner animation with message text below.
CSS class: .spinner-crypto.
Used on virtually every page during data fetch.

EmptyState.vue - Placeholder for empty lists / errors.
Props: icon (default "∅"), title (string), message (string).
Default slot for action buttons (e.g., "Browse markets", "Back to Markets").
Used on: Markets ("No matches"), CoinDetail ("Coin not found"), Watchlist ("Watchlist is empty"), NewsDetail ("Article not found"), Admin pages.

Component files: src/components/LoadingSpinner.vue, src/components/EmptyState.vue`,
  },

  {
    id: "comp-votebuttons",
    title: "VoteButtons Component",
    category: "components",
    content: `VoteButtons.vue - Bullish/Bearish sentiment toggle.
Props: coinId.
Shows two buttons: "🐂 Bullish" and "🐻 Bearish".
Click to vote, click again to remove vote.
Uses useReactions composable with localStorage persistence.
Tracks coinVotes in localStorage key 'crypto_reactions'.
Not currently displayed on any active page (legacy component).
Component file: src/components/VoteButtons.vue`,
  },

  {
    id: "comp-binancesparkline",
    title: "BinanceSparkline Component",
    category: "components",
    content: `BinanceSparkline.vue - Mini sparkline chart rendered on canvas.
Props: trend ('up' | 'down'), width, height.
Draws a random-walk line with gradient fill on an HTML canvas element.
Green gradient for uptrend, red gradient for downtrend.
Small size, used inside CoinTable rows next to 24h change.
Component file: src/components/BinanceSparkline.vue`,
  },

  {
    id: "comp-statcard",
    title: "StatCard Component",
    category: "components",
    content: `StatCard.vue - Simple stat display card.
Props: label (string), value (string|number), changeClass (optional CSS class).
Shows label in small text, value in large bold text.
Used on: Home page ("Market at a Glance" section), CoinDetail (Market Cap, Volume, High, Low).
Component file: src/components/StatCard.vue`,
  },

  {
    id: "comp-marketoverviewcards",
    title: "MarketOverviewCards Component",
    category: "components",
    content: `MarketOverviewCards.vue - Grid of compact coin cards.
Props: coins (array), title (string).
Each card: coin image, name, symbol, price, 24h change, market cap.
Used on: Home page "Top by Volume" section.
Component file: src/components/MarketOverviewCards.vue`,
  },

  {
    id: "comp-radarmap",
    title: "RadarMap (Global Adoption Map)",
    category: "components",
    content: `RadarMap.vue (in components/geo/) - World map of Chainalysis 2025 Global Crypto Adoption Index.
Rendered on an HTML canvas using GeoJSON country outlines.
Colors countries by adoption level: Very Low (light) → Very High (dark purple).
Interactive: hover over a country to see tooltip with country name, global rank, adoption score, adoption level.
Legend at the bottom showing all 5 adoption levels.
Data source: src/data/adoptionIndex.json.
Used on: Home page bottom section.
Component file: src/components/geo/RadarMap.vue`,
  },

  {
    id: "composable-liveprices",
    title: "useLivePrices Composable",
    category: "composables",
    content: `useLivePrices.js - Component-level composable for live price subscriptions.
Usage: const { liveData, isLive, applyLive } = useLivePrices()

- liveData: ref containing current live price map { symbol: { price, change, volume } }
- isLive: ref (boolean) indicating WebSocket connection status
- applyLive(coin): merges live price data into a coin object, adds _flash and _flashTick for animations

Lifecycle: Calls livePrices.start() on component mount, livePrices.stop() on unmount.
Used by: Home page, Markets page, CoinDetail, Watchlist.
File: src/composables/useLivePrices.js`,
  },

  /* ========== ERROR HANDLING ========== */
  {
    id: "workflow-errors",
    title: "Error Handling Patterns",
    category: "workflows",
    content: `Error handling patterns across the app:

PATTERN 1 - Inline error alert:
Pages: Markets, News, Admin pages.
Uses a data property 'error' or 'errorMsg', displayed as a dismissible alert at the top.
Example: Markets.vue shows 'error' alert above the table.

PATTERN 2 - EmptyState with error message:
Pages: CoinDetail, NewsDetail.
When API fails or data not found, shows EmptyState component with error text and back-navigation button.
CoinDetail: "Coin not found" with "← Back to Markets" button.
NewsDetail: "Article not found" with "Back to News" button.

PATTERN 3 - Try/catch with console logging:
All data-fetching functions wrap in try/catch, log to console, set error state.
Edge Functions return { error: message } on failure.
Frontend catches and displays to user.

PATTERN 4 - Chart error overlay:
CoinDashboard shows a centered error message with "Retry" button if chart data fails to load.

PATTERN 5 - Network errors:
WebSocket reconnection with exponential backoff (max 8 attempts).
REST polling fallback if WebSocket fails.
Automatic reconnection when connection returns.

PATTERN 6 - Permission errors:
AdminLayout shows locked screen for non-admin users.
Admin pages show read-only warning banners for non-admin viewers.

PATTERN 7 - Form validation:
Inline validation messages on Login, Register, SetPassword, AdminNewsEdit.
Validation rules: email format, password min 6 chars, password match, title min 8 chars, body min 20 chars, max 12 tags, image URL format.`,
  },
]
