# Architecture Diagrams — CryptoDash Report

---

## Diagram 1: Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                               │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                     Vue 3 SPA (Vite + Bootstrap 5)                    │  │
│  │                                                                        │  │
│  │   ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌─────────┐  ┌────────┐ │  │
│  │   │  Router   │  │Composable│  │ Components │  │ Services│  │  Views │ │  │
│  │   │ Vue Router│  │ useAuth  │  │ Navbar     │  │ binance │  │ Home   │ │  │
│  │   │          │  │ useAdmin │  │ CoinCard   │  │ coingecko│ │ Markets│ │  │
│  │   │ 12 routes │  │ useTheme │  │ RichEditor │  │ news    │  │ Admin  │ │  │
│  │   │          │  │ ...7 more│  │ AiAssist   │  │ websocket│ │ Auth   │ │  │
│  │   └──────────┘  └──────────┘  └───────────┘  └─────────┘  └────────┘ │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└─────────┬──────────────┬──────────────┬───────────────┬──────────────┬───────┘
          │              │               │               │              │
   REST + WS       REST API       Supabase SDK     Edge Function   Vercel CDN
          │              │               │               │              │
          ▼              ▼               ▼               ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌─────────────────┐ ┌───────────┐ ┌─────────┐
│   Binance    │ │  CoinGecko   │ │    Supabase      │ │ Supabase  │ │  Vercel │
│              │ │              │ │    Platform      │ │ Functions │ │         │
│ • REST /v3/  │ │ • /coins     │ │                  │ │           │ │ • SPA   │
│   ticker/24h │ │   /markets   │ │ • PostgreSQL     │ │ • chat/   │ │ • Edge  │
│ • WebSocket  │ │ • /coins/    │ │ • Auth           │ │   index.ts│ │ • Rules │
│   wss://     │ │   {id}       │ │ • Realtime       │ │ • fetch-  │ │         │
│   stream.    │ │ • Images     │ │ • pgvector       │ │   news/   │ │         │
│   binance    │ │              │ │ • RLS            │ │ • sync-   │ │         │
│   .com       │ │              │ │ • Storage        │ │   guides/ │ │         │
└──────────────┘ └──────────────┘ └─────────────────┘ └───────────┘ └─────────┘
                                        │
                                 ┌──────┴──────┐
                                 │   pg_cron   │
                                 │ fetch-news  │
                                 │ every hour  │
                                 └─────────────┘
```

---

## Diagram 2: API Coin (REST + WebSocket)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Binance API Integration                              │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         REST API Layer                               │   │
│  │                                                                      │   │
│  │   ┌──────────┐    proxy     ┌───────────┐     ┌──────────────────┐  │   │
│  │   │  Vite    │ ───────────> │ /api/     │ ──> │ api.binance.com  │  │   │
│  │   │  Dev     │              │ binance/* │     │ /api/v3/ticker/  │  │   │
│  │   │  Server  │              └───────────┘     │ 24hr             │  │   │
│  │   └──────────┘                                └──────────────────┘  │   │
│  │                                                                      │   │
│  │   binance.js ──── fetchAllTickers() ──── GET /api/v3/ticker/24hr   │   │
│  │                  fetchTicker(symbol) ──── GET /api/v3/ticker/24hr  │   │
│  │                  fetchKlines(symbol) ─── GET /api/v3/klines        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        WebSocket Layer                               │   │
│  │                                                                      │   │
│  │   ┌──────────┐    subscribe    ┌─────────────────────────────────┐  │   │
│  │   │websocket │ ──────────────> │  wss://stream.binance.com:9443  │  │   │
│  │   │   .js    │                 │                                 │  │   │
│  │   │          │ <────────────── │  Stream: !ticker@arr             │  │   │
│  │   │ connect  │   JSON frames   │  (all symbols, every 1s)        │  │   │
│  │   │ disconnect                │                                 │  │   │
│  │   │ reconnect                 │  Individual streams:             │  │   │
│  │   │                           │  • btcusdt@trade                 │  │   │
│  │   │  State:                   │  • ethusdt@trade                 │  │   │
│  │   │  • isConnected (ref)      │  • ... (per coin)                │  │   │
│  │   │  • lastMessage (ref)      │                                 │  │   │
│  │   │  • reconnectAttempts      └─────────────────────────────────┘  │   │
│  │   └──────────┘                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      Data Flow to UI                                 │   │
│  │                                                                      │   │
│  │   websocket.js ──> useLivePrices.js ──> Components                  │   │
│  │                         │                                            │   │
│  │                         ├── price      (current price)              │   │
│  │                         ├── change24h  (24h % change)               │   │
│  │                         ├── volume     (24h volume)                 │   │
│  │                         └── sparkline  (price history array)        │   │
│  │                                                                      │   │
│  │   binance.js ──> api.js ──> Views                                   │   │
│  │                    │                                                 │   │
│  │                    ├── getAllCoins() ──> Markets.vue (table)         │   │
│  │                    ├── getCoin(id) ───> CoinDetail.vue (chart)      │   │
│  │                    └── getKlines() ───> Lightweight Charts          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Diagram 3: News CoinDesk RSS Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        News CMS + RSS Pipeline                              │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    RSS Auto-Fetch (Hourly)                           │   │
│  │                                                                      │   │
│  │   ┌─────────┐   pg_cron    ┌──────────────┐    HTTP POST            │   │
│  │   │ pg_cron │ ───────────> │  Supabase    │ ──────────────>         │   │
│  │   │ schedule│  0 * * * *   │  Edge Fn     │                         │   │
│  │   └─────────┘              │  fetch-news/ │    ┌────────────────┐   │   │
│  │                            └──────────────┘    │  CoinDesk RSS  │   │   │
│  │                                    │           │  Feed           │   │   │
│  │                                    │           │  (XML/Atom)     │   │   │
│  │                                    │           └────────────────┘   │   │
│  │                                    ▼                                │   │
│  │                         ┌──────────────────┐                       │   │
│  │                         │  fetch-news/index.ts                     │   │
│  │                         │                  │                       │   │
│  │                         │ 1. Fetch RSS     │                       │   │
│  │                         │ 2. Parse XML     │                       │   │
│  │                         │ 3. Deduplicate   │                       │   │
│  │                         │    by URL        │                       │   │
│  │                         │ 4. Insert into   │                       │   │
│  │                         │    news table    │                       │   │
│  │                         └────────┬─────────┘                       │   │
│  │                                  │                                  │   │
│  │                                  ▼                                  │   │
│  │                    ┌────────────────────────┐                      │   │
│  │                    │     news table          │                      │   │
│  │                    │  (title, summary,       │                      │   │
│  │                    │   content, source_url,  │                      │   │
│  │                    │   published_at)         │                      │   │
│  │                    └────────────────────────┘                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Realtime Sync (Supabase)                          │   │
│  │                                                                      │   │
│  │   ┌──────────────┐  Realtime Sub  ┌──────────────┐  Reactive  ┌──┐ │   │
│  │   │   news        │ ────────────> │   news.js    │ ────────>  │UI│ │   │
│  │   │   table       │  INSERT       │   service    │  ref()     │  │ │   │
│  │   │              │  UPDATE        │              │            └──┘ │   │
│  │   └──────────────┘  DELETE        └──────────────┘                 │   │
│  │        │                                                                 │
│  │        │  supabase_realtime publication                                │   │
│  │        └── alters in complete_schema.sql                               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Manual CMS (Admin Panel)                          │   │
│  │                                                                      │   │
│  │   ┌──────────┐  CRUD   ┌──────────────┐  Supabase   ┌────────────┐ │   │
│  │   │ AdminNews│ ──────> │  api.js      │ ──────────> │ news table  │ │   │
│  │   │ Edit.vue │         │  (service)   │             │            │ │   │
│  │   └──────────┘         └──────────────┘             └────────────┘ │   │
│  │        │                                                            │   │
│  │        ▼                                                            │   │
│  │   ┌──────────────────┐                                             │   │
│  │   │  TipTap Editor   │                                             │   │
│  │   │  • Bold/Italic   │                                             │   │
│  │   │  • Headings      │                                             │   │
│  │   │  • Images        │                                             │   │
│  │   │  • Code blocks   │                                             │   │
│  │   │  • Links         │                                             │   │
│  │   └──────────────────┘                                             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Fallback (Offline)                                │   │
│  │                                                                      │   │
│  │   If Supabase unavailable ──> src/data/news.json (static)           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Diagram 4: RAG AI Assistant Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RAG AI Chatbot Pipeline                             │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                       Frontend (AiAssistant.vue)                     │   │
│  │                                                                      │   │
│  │   ┌──────────┐  user query  ┌───────────────┐                      │   │
│  │   │  Chat UI │ ──────────> │  ragContext.js │                      │   │
│  │   │          │              │                │                      │   │
│  │   │ • Input  │              │ 1. Get query   │                      │   │
│  │   │ • Messages              │ 2. Fetch live  │                      │   │
│  │   │ • Sources│              │    prices      │                      │   │
│  │   │ • Quick  │              │ 3. Build       │                      │   │
│  │   │   Prompts│              │    context     │                      │   │
│  │   └──────────┘              └───────┬───────┘                      │   │
│  │                                     │                               │   │
│  └─────────────────────────────────────┼───────────────────────────────┘   │
│                                        │                                   │
│                                        ▼                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │              Supabase Edge Function: chat/index.ts                   │   │
│  │                                                                      │   │
│  │   ┌──────────────────────────────────────────────────────────────┐  │   │
│  │   │  Request: { query, livePrices, userRole }                    │  │   │
│  │   └──────────────────────────────────────────────────────────────┘  │   │
│  │                                    │                                 │   │
│  │              ┌─────────────────────┼─────────────────────┐           │   │
│  │              │                     │                     │           │   │
│  │              ▼                     ▼                     ▼           │   │
│  │   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │   │
│  │   │  Step 1:          │  │  Step 2:          │  │  Step 3:          │ │   │
│  │   │  Embed Query      │  │  Vector Search    │  │  Build Prompt     │ │   │
│  │   │                   │  │                   │  │                   │ │   │
│  │   │  Gemini           │  │  pgvector         │  │  System prompt +  │ │   │
│  │   │  text-embedding   │  │  cosine           │  │  context docs +  │ │   │
│  │   │  -004             │  │  similarity       │  │  live prices +   │ │   │
│  │   │                   │  │                   │  │  user query      │ │   │
│  │   │  query ──> vec(768)│ │  SELECT * FROM    │  │                   │ │   │
│  │   │                   │  │  documents        │  │                   │ │   │
│  │   └─────────┬─────────┘  │  ORDER BY         │  └─────────┬─────────┘ │   │
│  │             │            │  embedding <=>     │            │           │   │
│  │             │            │  query_vec         │            │           │   │
│  │             │            │  LIMIT 5;          │            │           │   │
│  │             │            └─────────┬──────────┘            │           │   │
│  │             │                      │                       │           │   │
│  │             │                      ▼                       │           │   │
│  │             │           ┌──────────────────┐               │           │   │
│  │             │           │  Matched docs    │               │           │   │
│  │             │           │  (top 5 results) │               │           │   │
│  │             │           └─────────┬────────┘               │           │   │
│  │             │                     │                        │           │   │
│  │             └─────────┬───────────┘                        │           │   │
│  │                       │                                    │           │   │
│  │                       ▼                                    │           │   │
│  │              ┌──────────────────┐                          │           │   │
│  │              │  Step 4: Gemini  │◄─────────────────────────┘           │   │
│  │              │  LLM Call        │                                     │   │
│  │              │                  │                                     │   │
│  │              │  Model:          │                                     │   │
│  │              │  gemini-pro      │                                     │   │
│  │              │                  │                                     │   │
│  │              │  Input:          │                                     │   │
│  │              │  system prompt   │                                     │   │
│  │              │  + context docs  │                                     │   │
│  │              │  + live prices   │                                     │   │
│  │              │  + user query    │                                     │   │
│  │              └────────┬─────────┘                                     │   │
│  │                       │                                               │   │
│  │                       ▼                                               │   │
│  │              ┌──────────────────┐                                     │   │
│  │              │  Response:       │                                     │   │
│  │              │  { answer,       │                                     │   │
│  │              │    sources }     │                                     │   │
│  │              └──────────────────┘                                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Vector Store (documents table)                    │   │
│  │                                                                      │   │
│  │   ┌─────────┬──────────┬─────────────────┬────────────────────┐     │   │
│  │   │ source  │ source_id│ title           │ embedding          │     │   │
│  │   ├─────────┼──────────┼─────────────────┼────────────────────┤     │   │
│  │   │ 'coin'  │ 'bitcoin'│ "Bitcoin (BTC)" │ vec[768] ← cosine  │     │   │
│  │   │ 'news'  │ '123'    │ "Article title" │ vec[768] ← cosine  │     │   │
│  │   └─────────┴──────────┴─────────────────┴────────────────────┘     │   │
│  │                                                                      │   │
│  │   Index: HNSW on embedding (vector_cosine_ops)                      │   │
│  │   Dimension: 768 (gemini-embedding-004)                              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Diagram 5: Authentication Flow (Register + Login)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                                    │
│                                                                             │
│  ══════════════════════════════════════════════════════════════════════════ │
│  ║  REGISTER FLOW                                                         ║ │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ Register │    │  useAuth.js  │    │  Supabase    │    │  profiles    │  │
│  │  .vue    │───>│  register()  │───>│  Auth        │───>│  table       │  │
│  └──────────┘    └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                                             │
│  Step-by-step:                                                              │
│                                                                             │
│  1. User fills form                                                         │
│     ┌─────────────────────────────────────┐                                │
│     │  Email:    user@example.com          │                                │
│     │  Password: ••••••••                  │                                │
│     │  Name:     John Doe                  │                                │
│     └─────────────────────────────────────┘                                │
│                        │                                                    │
│                        ▼                                                    │
│  2. useAuth.register(email, password, name)                                │
│                        │                                                    │
│                        ▼                                                    │
│  3. bcrypt.hash(password)  ──────────────────── hash password              │
│                        │                                                    │
│                        ▼                                                    │
│  4. supabase.auth.signUp({ email, password })  ── create auth user         │
│                        │                                                    │
│                        ▼                                                    │
│  5. Insert into profiles table                                             │
│     ┌──────────────────────────────────────┐                               │
│     │  id:         auth.users.id (FK)       │                               │
│     │  email:      user@example.com         │                               │
│     │  password:   bcrypt_hash              │                               │
│     │  name:       John Doe                 │                               │
│     │  role:       'user' (default)         │                               │
│     └──────────────────────────────────────┘                               │
│                        │                                                    │
│                        ▼                                                    │
│  6. Return user object ──> redirect to /profile                            │
│                                                                             │
│  ══════════════════════════════════════════════════════════════════════════ │
│  ║  LOGIN FLOW                                                            ║ │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Login   │    │  useAuth.js  │    │  Supabase    │    │  profiles    │  │
│  │  .vue    │───>│  login()     │───>│  Auth        │───>│  table       │  │
│  └──────────┘    └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                                             │
│  Step-by-step:                                                              │
│                                                                             │
│  1. User fills form                                                         │
│     ┌─────────────────────────────────────┐                                │
│     │  Email:    user@example.com          │                                │
│     │  Password: ••••••••                  │                                │
│     └─────────────────────────────────────┘                                │
│                        │                                                    │
│                        ▼                                                    │
│  2. useAuth.login(email, password)                                         │
│                        │                                                    │
│                        ▼                                                    │
│  3. supabase.auth.signInWithPassword({ email, password })                  │
│                        │                                                    │
│                        ▼                                                    │
│  4. Supabase validates credentials                                         │
│                        │                                                    │
│              ┌─────────┴─────────┐                                         │
│              │                   │                                         │
│         Valid ✓             Invalid ✗                                      │
│              │                   │                                         │
│              ▼                   ▼                                         │
│  5a. Return JWT         5b. Return error                                  │
│              │              "Invalid login"                                │
│              ▼                                                             │
│  6. Fetch profile from profiles table                                     │
│     ┌──────────────────────────────────────┐                               │
│     │  SELECT * FROM profiles               │                               │
│     │  WHERE id = auth.uid();               │                               │
│     │                                       │                               │
│     │  Result: { role: 'admin', ... }       │                               │
│     └──────────────────────────────────────┘                               │
│              │                                                             │
│              ▼                                                             │
│  7. Set user.value = { ...profile, token }                                │
│              │                                                             │
│              ▼                                                             │
│  8. Check role ──> if admin ──> show admin nav                            │
│                      if user ──> show user nav                             │
│                                                                             │
│  ══════════════════════════════════════════════════════════════════════════ │
│  ║  RLS ENFORCEMENT (Database Level)                                     ║ │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │   Every query passes through RLS:                                    │   │
│  │                                                                      │   │
│  │   auth.uid() ──> is_admin(uid) ──> Policy check                     │   │
│  │                                                                      │   │
│  │   ┌────────────────────────────────────────────────────────────┐    │   │
│  │   │  Table        │ Public │ User         │ Admin              │    │   │
│  │   ├────────────────────────────────────────────────────────────┤    │   │
│  │   │  news         │  Read  │     -        │  CRUD              │    │   │
│  │   │  comments     │  Read  │  Insert Own  │     -              │    │   │
│  │   │  watchlist    │   -    │  CRUD Own    │     -              │    │   │
│  │   │  news_likes   │  Read  │  CRUD Own    │     -              │    │   │
│  │   │  documents    │  Read  │     -        │  CRUD              │    │   │
│  │   │  profiles     │   -    │  Read Own    │  Read All          │    │   │
│  │   └────────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Diagram 6: ERD (Entity Relationship Diagram)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ENTITY RELATIONSHIP DIAGRAM                        │
│                                                                             │
│                                                                             │
│  ┌─────────────────────┐                                                   │
│  │      profiles        │                                                   │
│  ├─────────────────────┤                                                   │
│  │ PK │ id       UUID   │──┐                                               │
│  │    │ email    TEXT   │  │                                               │
│  │    │ password TEXT   │  │  1:N                                          │
│  │    │ name     TEXT   │  ├──────────────────────────────────────┐        │
│  │    │ role     TEXT   │  │                                      │        │
│  │    │ created_at TZ  │  │                                      │        │
│  └─────────────────────┘  │                                      │        │
│                           │                                      │        │
│                           │  ┌─────────────────────┐            │        │
│                           │  │     watchlist        │            │        │
│                           │  ├─────────────────────┤            │        │
│                           │  │ PK │ id       UUID   │            │        │
│                           └─>│ FK │ user_id  UUID   │            │        │
│                              │    │ coin_id  TEXT   │            │        │
│                              │    │ created_at TZ   │            │        │
│                              │    └─────────────────┘            │        │
│                              │      unique(user_id, coin_id)     │        │
│                              │                                   │        │
│                              │  ┌─────────────────────┐         │        │
│                              │  │     comments        │         │        │
│                              │  ├─────────────────────┤         │        │
│                              │  │ PK │ id       BIGINT │         │        │
│                              ├─>│ FK │ user_id  UUID   │         │        │
│                              │  │ FK │ article_id BIGINT│◄────────┤        │
│                              │  │    │ user_name TEXT   │         │        │
│                              │  │    │ text     TEXT   │         │        │
│                              │  │    │ created_at TZ   │         │        │
│                              │  └─────────────────────┘         │        │
│                              │                                   │        │
│                              │  ┌─────────────────────┐         │        │
│                              │  │    news_likes        │         │        │
│                              │  ├─────────────────────┤         │        │
│                              │  │ PK │ id       UUID   │         │        │
│                              └─>│ FK │ user_id  UUID   │         │        │
│                                 │ FK │ article_id BIGINT│◄────────┤        │
│                                 │    │ type     TEXT   │ (like/  │        │
│                                 │    │ created_at TZ   │ dislike)│        │
│                                 │    └─────────────────┘         │        │
│                                 │      unique(user_id,article_id)│        │
│                                 │                                │        │
│                                 │  ┌─────────────────────┐      │        │
│                                 │  │        news          │      │        │
│                                 │  ├─────────────────────┤      │        │
│                                 └──│ PK │ id       BIGINT │◄─────┘        │
│                                    │    │ title    TEXT   │               │
│                                    │    │ summary  TEXT   │               │
│                                    │    │ content  TEXT   │               │
│                                    │    │ category TEXT   │               │
│                                    │    │ image_url TEXT  │               │
│                                    │    │ source_url TEXT │               │
│                                    │    │ source_name TEXT│               │
│                                    │    │ author_name TEXT│               │
│                                    │    │ tags     TEXT[] │               │
│                                    │    │ featured BOOL   │               │
│                                    │    │ trending BOOL   │               │
│                                    │    │ read_time INT   │               │
│                                    │    │ published_at TZ │               │
│                                    │    │ FK │ created_by UUID │──> auth  │
│                                    │    │ created_at TZ  │               │
│                                    │    │ updated_at TZ  │               │
│                                    └─────────────────────┘               │
│                                                                          │
│  ┌─────────────────────┐                                                 │
│  │     documents        │  (RAG Vector Store)                           │
│  ├─────────────────────┤                                                 │
│  │ PK │ id       BIGINT │                                                 │
│  │    │ source   TEXT   │  ← 'coin' | 'news'                            │
│  │    │ source_id TEXT  │  ← coin.id or news.id                        │
│  │    │ title    TEXT   │                                                 │
│  │    │ content  TEXT   │  ← plain text for embedding                   │
│  │    │ metadata JSONB  │                                                 │
│  │    │ embedding VECTOR(768) │ ← pgvector, HNSW index                  │
│  │    │ created_at TZ   │                                                 │
│  └─────────────────────┘                                                 │
│                                                                          │
│  ════════════════════════════════════════════════════════════════════════ │
│  RELATIONSHIPS SUMMARY:                                                   │
│  ════════════════════════════════════════════════════════════════════════ │
│                                                                          │
│  profiles ──1:N──> watchlist      (user saves coins)                     │
│  profiles ──1:N──> comments       (user writes comments)                 │
│  profiles ──1:N──> news_likes     (user likes/dislikes articles)         │
│  profiles ──1:N──> news           (admin creates articles)               │
│  news     ──1:N──> comments       (article has many comments)            │
│  news     ──1:N──> news_likes     (article has many likes)               │
│  news     ──1:N──> documents      (article → vector embeddings)          │
│  documents ──N:1──> (coins)       (coin → vector embeddings)             │
│                                                                          │
│  ════════════════════════════════════════════════════════════════════════ │
│  INDEXES:                                                                 │
│  ════════════════════════════════════════════════════════════════════════ │
│                                                                          │
│  idx_comments_article     ON comments(article_id, created_at ASC)        │
│  idx_news_published_at    ON news(published_at DESC)                     │
│  idx_news_category        ON news(category)                              │
│  idx_news_featured        ON news(featured) WHERE featured = true        │
│  idx_news_trending        ON news(trending) WHERE trending = true        │
│  idx_news_tags            ON news USING gin(tags)                        │
│  idx_documents_embedding  ON documents USING hnsw(embedding cosine)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Diagram 7: API + WebSocket Role Breakdown (Justification)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES — ROLE & JUSTIFICATION                    │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════════│
│  ║ BINANCE                                                                     ║│
│  ═══════════════════════════════════════════════════════════════════════════════│
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  1. WebSocket — Real-Time Price Stream                                   │  │
│  │                                                                           │  │
│  │  Endpoint:  wss://stream.binance.com:9443/ws/!ticker@arr                 │  │
│  │  Protocol: WebSocket (persistent connection)                             │  │
│  │  Frequency: Every ~1 second                                              │  │
│  │  Data:     { symbol, price, change24h, volume24h, high, low }            │  │
│  │                                                                           │  │
│  │  Used by:                                                                 │  │
│  │  ├── LiveBadge.vue          (giá nhấp nháy real-time)                   │  │
│  │  ├── PriceWithArrow.vue     (giá + mũi tên ↑↓)                          │  │
│  │  ├── CoinCard.vue           (giá trên card)                             │  │
│  │  ├── useLivePrices.js       (composable quản lý state)                  │  │
│  │  └── websocket.js           (connect/disconnect/reconnect)              │  │
│  │                                                                           │  │
│  │  Justification:                                                          │  │
│  │  • REST polling sẽ tạo HTTP overhead mỗi giây (100+ requests/pagination)│  │
│  │  • WebSocket push 1 connection cho TẤT CẢ symbols                       │  │
│  │  • Tiết kiệm bandwidth: JSON frame ~200 bytes thay vì 100 HTTP headers  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  2. REST API — Market Overview (/ticker/24hr)                            │  │
│  │                                                                           │  │
│  │  Endpoint:  GET /api/v3/ticker/24hr                                      │  │
│  │  Protocol: HTTP REST                                                     │  │
│  │  Frequency: On-demand (page load, manual refresh)                        │  │
│  │  Data:     [ { symbol, price, change, volume, count }, ... ]             │  │
│  │                                                                           │  │
│  │  Used by:                                                                 │  │
│  │  ├── Markets.vue             (sortable table all coins)                  │  │
│  │  ├── CoinDashboard.vue       (top gainers, losers, volume)               │  │
│  │  ├── SearchBar.vue           (search coin by symbol)                     │  │
│  │  └── api.js                  (service layer)                            │  │
│  │                                                                           │  │
│  │  Justification:                                                          │  │
│  │  • WebSocket chỉ stream giá, KHÔNG cung cấp排行/sorting/filtering       │  │
│  │  • REST trả về TẤT CẢ coins 1 lần cho bảng market                      │  │
│  │  • Cần data snapshot cho dashboard KPIs                                  │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  3. REST API — Historical Klines (/klines)                               │  │
│  │                                                                           │  │
│  │  Endpoint:  GET /api/v3/klines?symbol=BTCUSDT&interval=1h&limit=168     │  │
│  │  Protocol: HTTP REST                                                     │  │
│  │  Frequency: On-demand (user open coin detail)                            │  │
│  │  Data:     [ { open, high, low, close, volume, openTime }, ... ]         │  │
│  │                                                                           │  │
│  │  Used by:                                                                 │  │
│  │  └── CoinDetail.vue → Lightweight Charts                                 │  │
│  │      ├── Candlestick chart                                              │  │
│  │      ├── Volume bars                                                     │  │
│  │      └── MA/EMA indicators                                              │  │
│  │                                                                           │  │
│  │  Justification:                                                          │  │
│  │  • WebSocket KHÔNG có historical data                                    │  │
│  │  • Chỉ REST API mới trả về open/high/low/close theo thời gian           │  │
│  │  • Cần data cho chart render (candlestick, volume)                       │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════════│
│  ║ COINGECKO                                                                  ║│
│  ═══════════════════════════════════════════════════════════════════════════════│
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  4. REST API — Coin Details (/coins/{id})                                │  │
│  │                                                                           │  │
│  │  Endpoint:  GET /api/coingecko/coins/bitcoin                             │  │
│  │  Protocol: HTTP REST                                                     │  │
│  │  Frequency: On-demand (user open coin detail)                            │  │
│  │  Data:                                                                     │  │
│  │    { market_cap, market_cap_rank, description, hashing_algorithm,        │  │
│  │      categories, links, sparkline_in_7d, ath, atl, total_supply }        │  │
│  │                                                                           │  │
│  │  Used by:                                                                 │  │
│  │  ├── CoinDetail.vue           (full coin info page)                      │  │
│  │  ├── CoinCard.vue             (coin image, rank badge)                   │  │
│  │  └── coingecko.js             (service layer)                           │  │
│  │                                                                           │  │
│  │  Justification:                                                          │  │
│  │  • Binance KHÔNG có: market cap, description, image, rank               │  │
│  │  • CoinGecko là nguồn data phong phú nhất cho crypto metadata           │  │
│  │  • Cần cho coin detail page (SEO, user info)                             │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════════│
│  ║ SUPABASE                                                                   ║│
│  ═══════════════════════════════════════════════════════════════════════════════│
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  5. Supabase Client SDK — Auth + CRUD                                    │  │
│  │                                                                           │  │
│  │  Protocol: HTTPS (SDK wraps REST)                                        │  │
│  │  Used for:                                                                │  │
│  │  ├── Authentication    (signUp, signIn, session, JWT)                   │  │
│  │  ├── Database CRUD     (SELECT, INSERT, UPDATE, DELETE via PostgREST)   │  │
│  │  ├── RLS enforcement   (row-level security policies)                    │  │
│  │  └── Storage           (file upload if needed)                          │  │
│  │                                                                           │  │
│  │  Tables accessed:                                                         │  │
│  │  profiles, news, comments, watchlist, news_likes, documents              │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  6. Supabase Realtime — Live Data Sync                                  │  │
│  │                                                                           │  │
│  │  Protocol: WebSocket (Supabase Realtime)                                 │  │
│  │  Trigger:  INSERT / UPDATE / DELETE on `news` table                      │  │
│  │                                                                           │  │
│  │  Used by:                                                                 │  │
│  │  ├── AdminNews.vue          (admin sees changes across sessions)         │  │
│  │  └── News.vue               (public sees new articles instantly)         │  │
│  │                                                                           │  │
│  │  Justification:                                                          │  │
│  │  • Không cần poll server để check tin mới                               │  │
│  │  • Realtime push khi admin CRUD news                                     │  │
│  │  • Multi-session sync (nhiều admin cùng sửa)                             │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  7. Supabase Edge Functions — Serverless Logic                           │  │
│  │                                                                           │  │
│  │  Protocol: HTTPS (called by pg_cron or client)                           │  │
│  │                                                                           │  │
│  │  ├── fetch-news/   CoinDesk RSS → news table (hourly)                  │  │
│  │  ├── chat/         RAG AI chatbot → Gemini LLM                         │  │
│  │  └── sync-guides/  (guide sync logic)                                   │  │
│  │                                                                           │  │
│  │  Justification:                                                          │  │
│  │  • RSS fetch cần chạy server-side (CORS, XML parsing)                  │  │
│  │  • Chat cần server-side để gọi Gemini API (secret key)                 │  │
│  │  • Edge Fn = free tier, auto-scale, no server management                │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════════│
│  ║ VERCEL                                                                     ║│
│  ═══════════════════════════════════════════════════════════════════════════════│
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  8. Vercel — Hosting + Edge Runtime                                      │  │
│  │                                                                           │  │
│  │  Protocol: HTTPS                                                         │  │
│  │  Used for:                                                                │  │
│  │  ├── SPA hosting           (Vue 3 built files)                          │  │
│  │  ├── CDN                   (global edge caching)                        │  │
│  │  ├── URL rewrite           (/api/* → SPA fallback for Vue Router)       │  │
│  │  └── Edge runtime          (future: API routes if needed)               │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ═══════════════════════════════════════════════════════════════════════════════│
│  ║ SUMMARY TABLE                                                              ║│
│  ═══════════════════════════════════════════════════════════════════════════════│
│                                                                                 │
│  ┌────┬──────────────┬───────────┬────────────────┬──────────────────────────┐ │
│  │ #  │ Service      │ Protocol  │ What it does   │ Why not use the other?  │ │
│  ├────┼──────────────┼───────────┼────────────────┼──────────────────────────┤ │
│  │ 1  │ Binance WS   │ WebSocket │ Live prices    │ REST = HTTP overhead/   │ │
│  │    │              │ (push)    │ every 1s       │ 100+ requests/sec       │ │
│  ├────┼──────────────┼───────────┼────────────────┼──────────────────────────┤ │
│  │ 2  │ Binance REST │ HTTP GET  │ All coins      │ WS = no sorting/filter  │ │
│  │    │ /ticker/24hr │ (poll)    │ 24h snapshot   │ or bulk data            │ │
│  ├────┼──────────────┼───────────┼────────────────┼──────────────────────────┤ │
│  │ 3  │ Binance REST │ HTTP GET  │ Klines         │ WS = no historical     │ │
│  │    │ /klines      │ (poll)    │ chart data     │ data at all             │ │
│  ├────┼──────────────┼───────────┼────────────────┼──────────────────────────┤ │
│  │ 4  │ CoinGecko    │ HTTP GET  │ Coin metadata  │ Binance = no market    │ │
│  │    │ /coins/{id}  │ (poll)    │ cap, desc, img │ cap, rank, description  │ │
│  ├────┼──────────────┼───────────┼────────────────┼──────────────────────────┤ │
│  │ 5  │ Supabase SDK │ HTTPS     │ Auth + CRUD    │ Can't do auth/RLS with  │ │
│  │    │              │ (SDK)     │ + RLS          │ raw REST easily         │ │
│  ├────┼──────────────┼───────────┼────────────────┼──────────────────────────┤ │
│  │ 6  │ Supabase     │ WebSocket │ News realtime  │ REST = must poll to     │ │
│  │    │ Realtime     │ (push)    │ sync           │ detect changes          │ │
│  ├────┼──────────────┼───────────┼────────────────┼──────────────────────────┤ │
│  │ 7  │ Supabase     │ HTTPS     │ RSS fetch,     │ Client-side = CORS,    │ │
│  │    │ Edge Func    │ (server)  │ AI chat        │ can't store secrets     │ │
│  ├────┼──────────────┼───────────┼────────────────┼──────────────────────────┤ │
│  │ 8  │ Vercel       │ HTTPS     │ Hosting + CDN  │ Self-host = no global  │ │
│  │    │              │           │                │ edge, manual deploy     │ │
│  └────┴──────────────┴───────────┴────────────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```
