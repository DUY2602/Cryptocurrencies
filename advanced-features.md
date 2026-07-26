# Advanced Features — Cryptocurrency Dashboard

## 1. Binance WebSocket — Real-Time Price Streaming

**Live price feed** via Binance's WebSocket stream (`wss://stream.binance.com:9443/ws/!miniTicker@arr`), with automatic REST fallback when the connection drops.

### Architecture

```
┌─────────────┐     WS / REST      ┌─────────────────┐
│  Binance     │ ──────────────▶    │  websocket.js    │
│  (stream)    │                    │  (LivePriceWebSocket)
└─────────────┘                    └────────┬──────────┘
                                            │ notify (throttled 500ms)
                                            ▼
                                    ┌─────────────────┐
                                    │  livePrices.js   │
                                    │  (subscriber     │
                                    │   manager)       │
                                    └──┬──────────┬────┘
                              subscribe │          │ track()
                                        ▼          ▼
                              ┌──────────────┐  ┌──────────────┐
                              │ CoinDashboard│  │ CoinsListView│
                              │ (chart)      │  │ (table)      │
                              └──────────────┘  └──────────────┘
```

### Key Implementation Details

**`src/services/websocket.js`** (`LivePriceWebSocket` class):
- Connects to Binance's combined mini-ticker stream for all symbols in one connection
- Maps Binance symbols (e.g. `BTCUSDT`) to local coin IDs via a stable symbol list
- Filters out leverage (UP/DOWN) tokens
- Notifies subscribers at most every 500ms (throttled via `notifyThrottled`)
- **REST fallback**: if WS disconnects, polls `https://api.binance.com/api/v3/ticker/24hr` every 3 seconds with exponential backoff up to 8 retries
- Parses both the mini-ticker (`e: "24hrMiniTicker"`) and full 24hr ticker (`e: "24hrTicker"`) format
- Live price updates are applied to the last candlestick on the chart for real-time visual continuity

**`src/services/livePrices.js`** (Subscriber manager):
- `subscribe(callback)` — adds a subscriber, starts the WS (reference-counted)
- `unsubscribe(callback)` — removes a subscriber, stops WS when count reaches 0
- `getLiveQuote(liveMap, coin)` — lookup helper by local ID or symbol
- `applyLiveFlashes(stored, prevMap, nextMap)` — direction tracking for up/down flash CSS animations
- `track()` — add tracked coins without bumping the reference count

### Data Flow

1. Component calls `subscribe(callback)` → starts Binance WebSocket
2. WS pushes ~3KB JSON array of all mini-tickers every ~500ms
3. `LivePriceWebSocket` parses, throttles, and calls all subscriber callbacks
4. Subscribers receive `{ [coinId]: { usd, usd_24h_change, symbol } }`
5. CoinDashboard applies updates to the last candle; CoinsListView flashes prices green/red

---

## 2. AI Chatbot — Hybrid RAG (Retrieval-Augmented Generation)

**Context-aware crypto assistant** powered by Groq (LLM) with Gemini embeddings and a Supabase pgvector-backed RAG pipeline.

### Architecture

```
┌──────────┐   POST /chat   ┌─────────────────────────────────┐
│  Browser  │ ────────────▶  │  Supabase Edge Function (chat)  │
│  AiAssistant.vue          │     supabase/functions/chat/    │
└──────────┘                └──┬──────────────┬──────────────┘
                               │              │
                     embed(query)    supabase.rpc()
                     (Gemini)        │              │
                     ▼               ▼              ▼
                  Gemini          match_documents  match_documents_fts
               embedding-2       (pgvector)        (pg_bigm FTS)
                     │               │              │
                     └─────── Reciprocal Rank Fusion ────┘
                                        │
                                    docs (top 5)
                                        │
                                    Groq LLM
                                   (llama-3.1-8b-instant)
                                        │
                                    answer + sources
                                        │
                                    Browser
```

### Key Implementation Details

**`src/components/ai/AiAssistant.vue`** (Frontend):
- FAB-style floating button (MessageCircle icon), opens a slide-over chat panel
- Sends `{ query, livePrices, role, currentView, history }` to the edge function
- Renders responses as Markdown via `marked` + `DOMPurify` sanitization
- Quick prompt buttons: "Market summary", "Explain BTC in simple terms"
- Auth gate: prompts login/register if unauthenticated

**`supabase/functions/chat/index.ts`** (Edge Function — full Hybrid RAG pipeline):

| Step | Component | Detail |
|------|-----------|--------|
| 1. **Query Rewriting** | Groq LLM | Rewrites the user's question into a concise standalone search query using last 4 messages of history |
| 2. **Vector Search** | Gemini Embedding v2 + `match_documents` (pgvector) | Embeds the search query (768-dimensional), searches Supabase via cosine similarity |
| 3. **Full-Text Search** | `match_documents_fts` (pg_bigm) | Token-based search for keyword matching |
| 4. **Merge** | Reciprocal Rank Fusion | Combines vector + FTS results using RRF formula `score = 1/(K + rank)` with `K=60`, keeps top 5 |
| 5. **Admin Filtering** | Source/content check | Admin-only guides are filtered out for non-admin users |
| 6. **Context Assembly** | Edge Function | Builds a prompt with: system context, matched documents (truncated to 1500 chars each), current live prices, user's current view, conversation history (last 8 messages) |
| 7. **Generation** | Groq LLM | Generates answer with citation markers `[1]`, `[2]`, etc. |
| 8. **Citation Parsing** | Edge Function | Extracts cited sources and returns them alongside the answer for source rendering on the frontend |

### Key Constants
- `RRF_K = 60` — smoothing constant for RRF
- `HYBRID_TOP_K = 20` — candidates retrieved from each method
- `FINAL_TOP_K = 5` — final documents after fusion
- Retry logic for LLM/embedding calls (exponential backoff, up to 10s max, 3 retries)

---

## 3. BaaS & Auth & Email — Supabase Backend

**Supabase-powered authentication** with email/password, admin roles, and email redirect URL configuration.

### Key Implementation Details

**`src/composables/useAuth.js`** (Auth state singleton):
- Exposes `user`, `session`, `profile`, `isAdmin`, `isAuthenticated` as reactive refs
- `login(email, password)` — signs in via `supabase.auth.signInWithPassword`
- `logout()` — signs out and resets all state
- `register(email, password, displayName)` — signs up, auto-login on success
- `requestRegistration(email, password)` — calls custom `signUpWithRole` edge function for admin-assigned registration
- **Email redirect** uses `VITE_APP_URL` env variable with fallback to `window.location.origin`:
  ```js
  const siteUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  ```
- Profile fetching via RPC (`get_profile`) after auth state change

**`src/views/auth/Register.vue`** (Registration page):
- Toggle between self-registration and admin-invite modes
- Password strength indicator (length, uppercase, lowercase, digit)
- Email OTP verification notice
- Terms acceptance checkbox

**Supabase Configuration:**
- **Redirect URLs** (must be configured in Supabase Dashboard > Authentication > URL Configuration):
  - `http://localhost:5173/**` (development)
  - Production deploy URL
- **Row-Level Security (RLS)** enforced on all tables
- Profiles table with `role` column (`user` / `admin`)
- `signUpWithRole` edge function for admin-gated registration with predefined role

### Auth Flow

```
Register ──▶ Supabase Auth ──▶ OTP Email ──▶ Click Link ──▶ Redirect
                                                               │
                                                    VITE_APP_URL or
                                                    window.location.origin
                                                               │
                                                          auto-login
                                                               │
                                                     fetch_profile (RPC)
                                                               │
                                                     isAdmin check
```

---

## 4. Admin News Editor — TipTap Rich Text

**Full-featured news article editor** with TipTap v3 (Vue 3), designed for administrators to create, edit, and manage cryptocurrency news.

### Key Implementation Details

**`src/views/admin/AdminNewsEdit.vue`** (Full page editor):
- **Dual mode**: `/admin/news/new` = create, `/admin/news/:id` = edit (pre-fills from Supabase)
- **GDocs-style top bar**: Back button, save status badge (`● Unsaved` / `Saved HH:MM`), word count
- **Metadata panel** (left sidebar, resizable via drag handle):
  - Category selector (dropdown), tags (chip input with add/remove), cover image URL, author, source
  - Featured / trending toggle switches
  - Read time slider (1–30 min)
- **Live preview pane**: Renders sanitized HTML side-by-side
- **Auto-summary**: Extracts first 180 characters from body as summary
- **Validation**: title ≥ 8 chars, body ≥ 20 chars, URL format check
- **Unsaved changes warning**: `beforeunload` event and route guard
- **Mobile responsive**: metadata collapses to full-screen overlay with backdrop

**`src/components/admin/RichTextEditor.vue`** (Reusable TipTap wrapper):
- **Extensions**: StarterKit (headings H1–H4, bold, italic, strike, code, bullet/ordered list, blockquote, code block, horizontal rule), Underline, Link (autolink, noopener), Image (inline + base64), Placeholder
- **Toolbar**: organized groups with dividers — text formatting, headings, lists/quotes, media (link, image URL, file upload, HR), undo/redo
- **Image handling**: URL entry popover, file picker (max 2MB, base64), paste from clipboard, drag-and-drop
- **Word/character counter**: live stats in toolbar
- **v-model compatible**: emits `update:modelValue` with HTML content

### Data Flow

```
AdminDashboard ──▶ NewsCard (click) ──▶ AdminNewsEdit
                                           │
                              ┌────────────┼────────────┐
                              │            │            │
                         Title/Body    Metadata     Preview
                         (TipTap)      Panel        Pane
                              │            │
                              └────────────┘
                                   │
                              Save / Publish
                                   │
                              Supabase `news` table
                                   │
                              Realtime broadcast
                                   │
                              NewsList updates
```

---

## 5. Interactive Visualisations — TradingView Lightweight Charts

**Professional-grade candlestick charts** using the lightweight-charts library, with multiple timeframes, technical indicators, and real-time updates.

### Key Implementation Details

**`src/views/coins/CoinDashboard.vue`** (Chart + stats):
- **Chart engine**: `createChart` from `lightweight-charts` v5
  - `CandlestickSeries` for OHLCV candles
  - `LineSeries` for Moving Averages (MA/EMA)
  - `HistogramSeries` for volume bars
- **Timeframes**: 1s, 5s, 15s, 30s, 1m, 5m, 15m, 30m, 1H, 4H, 1D, 1W, 1M with configurable fetch limits
- **Data sourcing**: Binance REST API `api/v3/klines?symbol={SYMBOL}&interval={TF}&limit={COUNT}`
- **Real-time updates**: Last candle is updated by `livePrices.subscribe` callback — new trades update the close price of the current candle
- **Custom crosshair tooltip**: Displays O, H, L, C, Volume on hover
- **Theme awareness**: Dark/light mode via `useTheme` composable — chart background, text, grid, and candlestick colors all adapt
- **Responsive**: `ResizeObserver` to auto-resize chart on container changes
- **Indicator toggles**: Price line, MA (default 20-period), EMA (default 20-period), Volume bars — each togglable via buttons
- **Stat cards**: Market cap, 24h volume, 24h change, 24h high/low, circulating supply
- **Market sentiment bar**: Visual indicator of bullish/bearish bias

### Chart Architecture

```
CoinDashboard
    │
    ├── Timeframe selector (1s ── 1M)
    ├── Indicator toggles (Price / MA / EMA / Volume)
    ├── Lightweight Charts instance
    │       ├── CandlestickSeries (OHLC)
    │       ├── LineSeries (MA / EMA)
    │       └── HistogramSeries (Volume)
    ├── Custom tooltip overlay (O/H/L/C/Vol)
    ├── Stat cards row
    └── Market sentiment bar

Data flow:
    Mount ──▶ fetch from Binance klines API ──▶ setData(chart)
    Live ──▶ livePrices.subscribe ──▶ update last candle close
    Timeframe change ──▶ fetch & setData again
    Resize ──▶ chart.resize(width, height)
```

---

## Summary

| Feature | Key Technologies | Frontend | Backend |
|---------|-----------------|----------|---------|
| Binance WebSocket | Binance WS/REST API | `websocket.js`, `livePrices.js` | None (direct to Binance) |
| AI Chatbot (RAG) | Groq, Gemini Embedding, pgvector | `AiAssistant.vue` | Supabase Edge Function |
| Auth & Email | Supabase Auth, RLS | `useAuth.js`, `Register.vue` | Supabase (built-in) |
| News Editor | TipTap v3, Vue 3 | `AdminNewsEdit.vue`, `RichTextEditor.vue` | Supabase `news` table + realtime |
| Interactive Charts | lightweight-charts v5, Binance API | `CoinDashboard.vue` | None (direct to Binance) |
