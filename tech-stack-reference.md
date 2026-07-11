# Technology Stack Reference — CryptoDash

> Source reference for "Technology Selection Justification" section.
> Each entry: what it is, why chosen, how it's used in this project.

---

## 1. WebSocket — Real-Time Architecture

### What
WebSocket is a full-duplex communication protocol that maintains a persistent connection between client and server, enabling bi-directional data flow without repeated HTTP requests.

### Why
- REST polling for live prices would require ~100+ HTTP requests per page load (one per coin), creating significant network overhead.
- WebSocket pushes data from server to client on every tick (~1 second), delivering real-time updates with minimal bandwidth.
- A single WebSocket connection streams data for ALL tracked symbols simultaneously.

### How used in project

**Binance WebSocket** (`src/services/websocket.js`):
```
Endpoint: wss://stream.binance.com:9443/ws/!miniTicker@arr
Protocol: WebSocket (persistent)
Frequency: Every ~1 second
Data: { symbol, price, change24h, volume }
```
- `LivePriceWebSocket` class manages connection lifecycle: connect, reconnect (exponential backoff, max 8 attempts), disconnect.
- Maps Binance symbols (e.g. `BTCUSDT`) to local coin IDs.
- Parses mini-ticker and full-ticker payloads into normalized price objects.
- Notifies all subscribed components via observer pattern.

**Supabase Realtime** (`src/services/news.js`):
```
Trigger: INSERT / UPDATE / DELETE on `news` table
Protocol: WebSocket (Supabase Realtime subscription)
```
- Subscribes to `supabase_realtime` publication on the `news` table.
- Admin panel and public news list update instantly across sessions when an article is created/edited/deleted.
- No polling required — changes propagate in real-time.

**Files:**
- `src/services/websocket.js` — Binance WS connection manager
- `src/services/livePrices.js` — price aggregation layer + subscriber pattern
- `src/composables/useLivePrices.js` — Vue composable for components
- `src/services/news.js` — Supabase Realtime subscription

---

## 2. RAG (Retrieval-Augmented Generation)

### What
RAG is an AI architecture pattern that combines information retrieval with large language model generation. Instead of relying solely on the LLM's training data, RAG retrieves relevant documents from a vector database and injects them as context into the LLM prompt, producing grounded, factual responses.

### Why
- Cryptocurrency data changes rapidly — LLMs have knowledge cutoff dates and cannot provide current prices or recent news.
- RAG allows the chatbot to answer questions about specific coins and news articles in the database.
- Vector similarity search finds semantically relevant documents even when the user's query doesn't match exact keywords.

### How used in project

**Pipeline flow:**
```
User Query
    │
    ▼
ragContext.js (injects live prices into context)
    │
    ▼
Supabase Edge Function: chat/index.ts
    │
    ├──► Step 1: Embed query using Gemini text-embedding-004
    │    (converts text → vector of 768 dimensions)
    │
    ├──► Step 2: pgvector cosine similarity search
    │    SELECT * FROM documents
    │    ORDER BY embedding <=> query_vector
    │    LIMIT 5;
    │
    ├──► Step 3: Build prompt
    │    system prompt + matched documents + live prices + user query
    │
    └──► Step 4: Gemini LLM call (gemini-pro)
         → Response with sources
```

**Vector store** (`documents` table in `supabase/complete_schema.sql`):
```sql
CREATE TABLE documents (
  id         BIGSERIAL PRIMARY KEY,
  source     TEXT,          -- 'coin' | 'news'
  source_id  TEXT,          -- coin.id or news.id
  title      TEXT,
  content    TEXT,          -- plain text for embedding
  metadata   JSONB,
  embedding  VECTOR(768),   -- pgvector, 768-dim
  created_at TIMESTAMPTZ
);

-- HNSW index for fast cosine similarity search
CREATE INDEX idx_documents_embedding
  ON documents USING hnsw (embedding vector_cosine_ops);
```

**Embedding model:** Google Gemini `text-embedding-004` (768 dimensions, `outputDimensionality=768`)

**Files:**
- `supabase/rag_setup.sql` — vector store schema + pgvector extension
- `supabase/functions/chat/index.ts` — Edge Function (embed → search → LLM)
- `src/services/ragContext.js` — context builder (injects live prices)
- `src/components/AiAssistant.vue` — chat UI

---

## 3. Row-Level Security (RLS)

### What
Row-Level Security is a PostgreSQL feature that restricts which rows a user can read/write based on policies defined at the database level. Enforcement happens inside the database engine — the application cannot bypass it.

### Why
- Security is enforced at the data layer, not the application layer — even if the client-side code is tampered with, the database still enforces access rules.
- Eliminates the need for complex server-side authorization logic for each query.
- Supabase integrates RLS natively with `auth.uid()`, making it seamless to implement role-based access.

### How used in project

**Admin check function:**
```sql
CREATE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role = 'admin'
  );
$$;
```

**RLS policies by table:**

| Table | Policy | Rule |
|-------|--------|------|
| `news` | Public read | `SELECT` allowed for all |
| `news` | Admin write | `INSERT/UPDATE/DELETE` only if `is_admin(auth.uid())` |
| `comments` | Public read | `SELECT` allowed for all |
| `comments` | User insert | `INSERT` only if `auth.uid() = user_id` |
| `comments` | User delete | `DELETE` only own comments |
| `watchlist` | User CRUD | All operations only on own rows (`auth.uid() = user_id`) |
| `news_likes` | User CRUD | All operations only on own rows |
| `documents` | Public read | `SELECT` allowed for all |
| `documents` | Admin write | `INSERT/UPDATE/DELETE` only if admin |
| `profiles` | User read own | `SELECT` own profile |
| `profiles` | Admin read all | Admin can read all profiles |

**Files:**
- `supabase/complete_schema.sql` — lines 128–236 (all RLS policies)

---

## 4. Edge Functions (Serverless)

### What
Edge Functions are serverless functions that run on the edge infrastructure (close to users), triggered by HTTP requests or scheduled tasks. They handle backend logic without managing servers.

### Why
- RSS feed fetching requires server-side execution (CORS restrictions, XML parsing, database writes).
- AI chatbot requires server-side execution to securely store API keys (Gemini secret key cannot be exposed to the client).
- Supabase Edge Functions are free-tier friendly, auto-scaling, and integrate directly with the Supabase database.

### How used in project

**fetch-news/** — CoinDesk RSS auto-fetch:
```
Trigger: pg_cron (every hour: '0 * * * *')
Protocol: HTTP POST via pg_cron → net.http_post()

Flow:
1. pg_cron triggers fetch-news Edge Function every hour
2. Edge Function fetches CoinDesk RSS feed (XML)
3. Parses XML, extracts articles
4. Deduplicates by URL (avoids re-inserting existing articles)
5. Inserts new articles into `news` table
```

**chat/** — RAG AI chatbot:
```
Trigger: HTTP POST from client (AiAssistant.vue)
Request: { query, livePrices, userRole }

Flow:
1. Receives user query + live price context
2. Embeds query using Gemini text-embedding-004
3. Searches `documents` table via pgvector cosine similarity
4. Builds prompt with matched docs + live prices
5. Calls Gemini LLM API (gemini-pro)
6. Returns response + sources
```

**sync-guides/** — Guide synchronization (additional utility function).

**Files:**
- `supabase/functions/fetch-news/` — RSS auto-fetch
- `supabase/functions/chat/index.ts` — AI chatbot backend
- `supabase/functions/sync-guides/` — guide sync
- `supabase/complete_schema.sql` — lines 278–296 (pg_cron setup)

---

## 5. Dual Data Source Architecture (Graceful Degradation)

### What
A fallback pattern where the application uses multiple data sources for the same data, automatically switching to a secondary source when the primary is unavailable or doesn't cover a specific item.

### Why
- Binance WebSocket only covers coins listed on Binance (~200+ USDT pairs), but CoinGecko covers 10,000+ coins.
- A coin not on Binance should still be viewable — the app should degrade gracefully rather than showing errors.
- Using both sources maximizes coverage: Binance for real-time precision, CoinGecko for breadth.

### How used in project

**Decision flow per coin:**
```
Coin loaded
    │
    ├── Is coin in Binance WS stream?
    │   ├── YES → Price from WebSocket (real-time, ~1s updates)
    │   │         Chart from Binance /klines (candlestick + volume)
    │   │         Badge: "Live"
    │   │
    │   └── NO  → Price from CoinGecko /simple/price (cache 30s)
    │             Chart from CoinGecko /market_chart (line chart)
    │             Badge: "CoinGecko"
    │
    └── Binance fetch timeout (8s)?
        └── Fallback → CoinGecko chart automatically
```

**Data source comparison:**

| Data | Binance | CoinGecko | Used when |
|------|---------|-----------|-----------|
| Real-time price | WebSocket (1s) | REST (5min cache) | Binance: always if available |
| Klines (OHLCV) | REST /klines | — | Binance: candlestick chart |
| Market chart | — | REST /market_chart | CoinGecko: line chart fallback |
| Market cap | — | REST /coins/{id} | Always CoinGecko |
| Coin image | — | REST /coins/{id} | Always CoinGecko |
| Description | — | REST /coins/{id} | Always CoinGecko |

**Key code:**
```javascript
// api.js — checkBinanceChart()
coin._hasBinanceChart = !!findUsdtTicker(tickers, coin.symbol)

// CoinDashboard.vue — loadHistoricalData()
if (!pair || this.coin._hasBinanceChart === false) {
  await this.loadCoinGeckoChart()  // skip Binance, go CoinGecko
  return
}

// Fallback with timeout
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 8000)
const res = await fetch(binanceUrl, { signal: controller.signal })
```

**Files:**
- `src/services/api.js` — `checkBinanceChart()`, `getCoinById()`
- `src/services/coingecko.js` — `fetchCoinPrice()`, `fetchMarketChart()`
- `src/components/coins/CoinDashboard.vue` — `loadHistoricalData()`, `loadCoinGeckoChart()`

---

## 6. TipTap Rich Text Editor

### What
TipTap is a headless, framework-agnostic rich text editor built on ProseMirror. It provides a modular extension system for formatting features (bold, italic, headings, links, images, code blocks, etc.).

### Why
- Headless design: no opinionated UI — full control over styling to match the app's dark theme.
- Vue 3 native integration via `@tiptap/vue-3`.
- ProseMirror-based: robust, well-tested document model with JSON-based content storage.
- Extension-based: only load features that are needed, keeping bundle size reasonable.

### How used in project

**Extensions installed:**
```
@tiptap/starter-kit        — Bold, italic, strike, headings, lists, blockquote, code
@tiptap/extension-image    — Image insertion (URL-based)
@tiptap/extension-link     — Hyperlink support
@tiptap/extension-placeholder — Placeholder text for empty editor
@tiptap/pm                  — ProseMirror core (peer dependency)
```

**Usage:**
- Admin panel (`AdminNewsEdit.vue`) uses TipTap for creating/editing news articles.
- Content is stored as HTML in the `news.content` column.
- `DOMPurify` sanitizes HTML output to prevent XSS.
- `marked` converts markdown to HTML when needed.

**Files:**
- `src/components/RichTextEditor.vue` — TipTap wrapper component
- `src/views/admin/AdminNewsEdit.vue` — admin article editor

---

## 7. Lightweight Charts (TradingView)

### What
Lightweight Charts is TradingView's open-source library for rendering financial charts. It supports candlestick, line, area, histogram, and custom series with high performance (60fps rendering via WebGL/Canvas).

### Why
- Purpose-built for financial data — native candlestick, volume, and indicator support.
- Tiny bundle size (~40KB gzipped) compared to full TradingView widget.
- 60fps rendering handles real-time price updates smoothly.
- Built-in crosshair, tooltips, and time scale formatting.

### How used in project

**Chart types rendered:**
```
CandlestickSeries  — OHLCV candlestick chart (primary price view)
HistogramSeries    — Volume bars (below price chart)
LineSeries         — 20 SMA (Moving Average) overlay
LineSeries         — 20 EMA (Exponential Moving Average) overlay
```

**Timeframes supported:**
```
1s, 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 1w, 1M
```

**Real-time updates:**
- `updateChartRealtime(price, timestamp)` appends new data points to the last bar or creates a new bar when the time interval changes.
- Subscribes to `livePrices` for live price ticks.

**Features:**
- Crosshair with OHLCV tooltip on hover.
- Dark/light theme switching via `useTheme()`.
- Responsive resize via `ResizeObserver`.
- CoinGecko fallback: renders LineSeries (instead of CandlestickSeries) when Binance klines are unavailable.

**Files:**
- `src/components/coins/CoinDashboard.vue` — chart component (884 lines)

---

## 8. bcrypt (Client-Side Password Hashing)

### What
bcrypt is a password hashing function designed to be slow and computationally expensive, making brute-force attacks impractical. It includes a built-in salt to prevent rainbow table attacks.

### Why
- Industry-standard password hashing algorithm (Blowfish cipher, adaptive cost factor).
- `bcryptjs` is a pure JavaScript implementation — works in the browser without native dependencies.
- Combined with Supabase Auth for layered security: Supabase handles JWT/session management, bcrypt provides an additional password hash layer in the `profiles` table.

### How used in project

**Registration flow:**
```
1. User submits email + password
2. bcrypt.hash(password, saltRounds) → bcrypt hash
3. Hash stored in profiles.password column
4. Supabase Auth.signUp() creates auth user
5. Profile record inserted with bcrypt hash
```

**Login flow:**
```
1. User submits email + password
2. Supabase Auth.signInWithPassword() validates credentials
3. Returns JWT token for session management
4. Profile fetched from profiles table (includes role)
```

**Files:**
- `src/composables/useAuth.js` — `register()`, `login()` methods
- `supabase/complete_schema.sql` — `profiles.password` column (bcrypt hash)

---

## 9. Supabase Auth

### What
Supabase Auth provides authentication and authorization as a service, supporting email/password, OAuth providers, and magic links. It integrates with PostgreSQL RLS for database-level access control.

### Why
- Built-in integration with Supabase PostgreSQL — `auth.uid()` is available directly in RLS policies.
- JWT-based sessions with automatic token refresh.
- Eliminates the need to build and maintain a custom auth server.
- Role-based access control (RBAC) via the `profiles.role` column.

### How used in project

**Authentication methods:**
- Email/password registration and login (primary)
- JWT token for session management

**User roles:**
```
'user'  — standard user (can: read news, manage watchlist, comment, like)
'admin' — administrator (can: CRUD news, manage users, manage documents)
```

**Session flow:**
```
1. Login → Supabase Auth returns JWT
2. JWT stored in Supabase client (localStorage)
3. Every Supabase query automatically includes JWT
4. RLS policies check auth.uid() and is_admin()
5. Logout → JWT cleared
```

**Files:**
- `src/composables/useAuth.js` — login, register, logout, session management
- `src/composables/useAdmin.js` — admin role check
- `src/main.js` — permission directive (`v-permission`)
- `supabase/complete_schema.sql` — `is_admin()` function, RLS policies

---

## 10. Vercel (Hosting + Edge Runtime)

### What
Vercel is a cloud platform for frontend frameworks and static sites. It provides global CDN distribution, automatic deployments from Git, and Edge Runtime for serverless functions.

### Why
- Zero-config deployment for Vite projects.
- Global CDN ensures fast page loads worldwide.
- Automatic preview deployments for pull requests.
- Integrated with Supabase (both are backend-as-a-service, reducing operational complexity).

### How used in project

**Configuration** (`vercel.json`):
```json
{
  "framework": "vite",
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Key features used:**
- SPA hosting: Vue 3 built files served from global CDN.
- URL rewrite: All routes → `index.html` for Vue Router history mode.
- Automatic deployment on git push.

**Files:**
- `vercel.json` — deployment configuration

---

## Summary Table

| # | Technology | Category | Key Benefit in Project |
|---|-----------|----------|----------------------|
| 1 | WebSocket | Communication | Real-time prices without HTTP polling |
| 2 | RAG | AI/ML | Grounded AI responses with live data |
| 3 | RLS | Security | Database-level access control |
| 4 | Edge Functions | Backend | Serverless RSS + AI chat |
| 5 | Dual Data Source | Architecture | Graceful degradation for 10,000+ coins |
| 6 | TipTap | Editor | Rich text CMS with custom styling |
| 7 | Lightweight Charts | Visualization | 60fps financial charts |
| 8 | bcrypt | Security | Password hashing |
| 9 | Supabase Auth | Auth | JWT sessions + RBAC |
| 10 | Vercel | Deployment | Global CDN + zero-config |
