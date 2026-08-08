# CryptoDash — Cryptocurrency Market Dashboard

A real-time cryptocurrency market tracker built with **Vue 3** and **Supabase**, featuring live Binance prices, interactive TradingView-style charts, a full admin-powered news CMS with TipTap rich-text editing, social features (likes, dislikes, comments), and a RAG-powered AI assistant.

**Live deployment:** [CryptoDash on Vercel](https://cryptodash.vercel.app)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Key Features](#2-key-features)
3. [Screens & Routes](#3-screens--routes)
4. [Tech Stack](#4-tech-stack)
5. [Project Architecture](#5-project-architecture)
6. [Getting Started](#6-getting-started)
7. [Environment Variables](#7-environment-variables)
8. [Database Schema](#8-database-schema)
9. [Supabase Edge Functions](#9-supabase-edge-functions)
10. [Authentication & Roles](#10-authentication--roles)
11. [Live Price Pipeline](#11-live-price-pipeline)
12. [The AI Chatbot (RAG)](#12-the-ai-chatbot-rag)
13. [Design System & UX](#13-design-system--ux)
14. [Advanced Techniques](#14-advanced-techniques)
15. [Security](#15-security)
16. [Deployment](#16-deployment)
17. [Project Status](#17-project-status)
18. [Reflection & Challenges](#18-reflection--challenges)

---

## 1. Overview

CryptoDash is a full-stack single-page application that lets users track cryptocurrency markets in real time. It is split into three main pillars:

- **Market Data** — live prices streamed from Binance WebSocket (with REST failover), interactive candlestick charts, market overview cards, sortable coin tables, per-coin detail pages, and a personalised watchlist.
- **News CMS** — a complete editorial system with an admin panel. Articles are written in a TipTap rich-text editor, auto-fetched from CoinDesk RSS via an hourly Edge Function, enriched with AI, and published to a public news feed with search, category/date filters, comments, and likes.
- **AI Assistant** — a floating chat panel that answers questions about crypto and the app itself. It combines a Retrieval-Augmented Generation (RAG) pipeline (pgvector + full-text search fused by Reciprocal Rank Fusion) with live price context, so answers stay factual and up-to-date.

The project was built in stages: it began as a simple three-page Vue application (Home / News / About) and grew into a production-shaped system with authentication, role-based administration, real-time data, and an AI layer.

---

## 2. Key Features

### Market Data
- **Live prices** — Binance WebSocket (`wss://stream.binance.com`) streams mini-tickers for every tracked symbol with ~1s latency. Automatic fallback to Binance REST polling when the socket is unavailable.
- **Interactive charts** — Lightweight Charts (TradingView) renders candlestick + volume charts with MA/EMA indicators on every coin detail page.
- **Coin detail pages** — Price history, market cap, 24h high/low, ATH, live price, description, and chart.
- **Watchlist** — Star your favourite coins. Persisted per-user in Supabase (with optimistic updates + rollback), or in `localStorage` for guests.
- **Sort & filter** — Markets page with sortable columns and search by name or symbol.
- **Global adoption map** — interactive radar-style map visualising crypto adoption across countries.
- **Sparklines** — mini 24h price charts on every coin row.

### News CMS
- **TipTap rich-text editor** — bold, italic, underline, headings, lists, links, images, code blocks, blockquotes.
- **Admin panel** — full CRUD, featured/trending flags, tags, categories, author management, real-time sync across sessions via Supabase Realtime.
- **CoinDesk auto-fetch** — an Edge Function pulls the CoinDesk RSS feed every hour, deduplicates by URL, expands short descriptions into full articles with Groq (Llama 3.1) or Gemini, and inserts them into Supabase.
- **Social layer** — authenticated users can like/dislike articles and post comments on each article.
- **Fallback data** — graceful error states when Supabase is unavailable.

### Authentication & Users
- **Supabase Auth** — email/password registration and login.
- **Invite-style registration** — users register with just email + name; a temporary password is emailed and they set a real one via a magic link.
- **Role-based access** — `admin` role gates the CMS, user management, and RAG administration panels.
- **User profiles** — name, avatar, watchlist, reactions, and comments tied to the authenticated user.
- **Password hashing** — bcrypt hash stored on the profile for extra defense in depth.

### AI Assistant
- **Floating chat UI** — collapsible panel with message history, quick prompts, and Markdown rendering with sanitisation.
- **RAG pipeline** — hybrid search over a `documents` table: vector similarity (pgvector, 768-dim Gemini embeddings) fused with Postgres full-text search using Reciprocal Rank Fusion (RRF).
- **Live data injection** — the assistant receives current live prices and the user's current view, so answers reflect the here-and-now.
- **Role-aware** — the assistant knows whether the user is an admin and adjusts its answers accordingly.
- **Source citations** — answers cite the documents used, rendered as numbered source chips.

---

## 3. Screens & Routes

| Path | Page | Access |
|------|------|--------|
| `/` | Home — hero, trending coins, top by volume, latest news, adoption map | Public |
| `/markets` | Markets — sortable live coin table | Public |
| `/coin/:id` | Coin detail — chart, stats, live price, watchlist button | Public |
| `/watchlist` | Watchlist — saved coins | Public |
| `/news` | News feed — search, category & date filters, pagination | Public |
| `/news/:id` | News detail — full article, reactions, comments | Public |
| `/about` | About — tech matrix, "Say hello" form with validation | Public |
| `/login` | Login | Guests |
| `/register` | Register (email + name) | Guests |
| `/set-password` | Set real password after invite | All |
| `/admin` | Admin dashboard — KPIs, charts, stats | Admin |
| `/admin/news` | News CMS list (real-time sync) | Admin |
| `/admin/news/edit/new` | Create article | Admin |
| `/admin/news/edit/:id` | Edit article | Admin |
| `/admin/users` | User role management | Admin |
| `/admin/settings` | System settings | Admin |
| `/admin/rag` | RAG document management & indexing | Admin |

Route guards: `meta.requiresAuth`, `meta.guestOnly`, and `meta.requiresAdmin` (the admin layout renders a friendly "promote yourself" screen for non-admins).

---

## 4. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | **Vue 3** (Composition + Options API) | Reactive UI |
| Build tool | **Vite 5** | Dev server + production bundling |
| Routing | **Vue Router 4** | SPA routing + guards |
| Styling | **Bootstrap 5** + custom CSS variables | Responsive layout + dark/light themes |
| Charts | **Lightweight Charts** (TradingView) | Candlestick, volume, MA/EMA |
| Rich text | **TipTap 3** (ProseMirror) | News editor |
| Icons | **Lucide Vue** | UI icon set |
| Markdown | **marked** + **DOMPurify** | AI assistant rendering (sanitised) |
| Backend | **Supabase** (PostgreSQL + Auth + Realtime + Storage) | Persistence, auth, RLS |
| Live data | **Binance REST + WebSocket API** | Real-time prices |
| Static data | **CoinGecko API** | Market caps, images, history |
| News source | **CoinDesk RSS** | Auto-fetched articles |
| Vector search | **pgvector** (768-dim) | RAG embeddings |
| LLM | **Gemini** (embeddings + fallback) & **Groq / Llama 3.1** (generation) | AI assistant |
| Password hashing | **bcryptjs** | Defense-in-depth on profiles |
| Rate limiting | Custom token-bucket client (`rateLimiter.js`) | Respect external API quotas |

---

## 5. Project Architecture

```
Client (Vue 3 + Vite)
  ├── Binance REST / WebSocket ──── live prices (stream + failover)
  ├── CoinGecko API ─────────────── market caps, images, chart history
  ├── Supabase ──────────────────── auth, database, realtime, edge functions
  └── Custom rate limiter ───────── token bucket + cache + dedupe

Supabase Stack
  ├── Tables: profiles, watchlist, news, news_likes, comments, documents, guides
  ├── Auth: email/password, invite flow, RLS
  ├── Realtime: news table sync to admin CMS
  ├── pgvector: 768-dim embeddings (gemini-embedding-2)
  └── Edge Functions: fetch-news (RSS → articles), sync-guides (docs → vectors), chat (RAG + LLM)
```

### Directory Structure

```
src/
├── main.js                # Entry point — registers custom directives
├── App.vue                # Root layout
├── router/index.js        # All routes + guards
├── icons.js               # Lucide icon registration
├── assets/                # Global CSS + images
├── components/
│   ├── layout/            # Navbar, Footer, HeroSection, PageHero
│   ├── ui/                # SearchBar, Pagination, LoadingSpinner, StatCard, ThemeToggle, ...
│   ├── coins/             # CoinTable, CoinCard, CoinDashboard, BinanceSparkline
│   ├── news/              # NewsReactions
│   ├── admin/             # RichTextEditor (TipTap)
│   ├── ai/                # AiAssistant (chat UI)
│   └── geo/               # RadarMap (adoption map)
├── composables/           # useAuth, useAdmin, useWatchlist, useComments,
│                          # useReactions, useTheme, useLivePrices
├── services/              # api, binance, coingecko, news, websocket,
│                          # livePrices, rateLimiter
├── utils/format.js        # Currency / percentage / date formatting
├── data/adoptionIndex.json# Static adoption dataset for the map
└── views/
    ├── general/           # Home, About
    ├── coins/             # Markets, CoinDetail, Watchlist
    ├── news/              # News, NewsDetail
    ├── auth/              # Login, Register, Profile, SetPassword
    └── admin/             # AdminLayout, AdminDashboard, AdminNews, AdminNewsEdit,
                           # AdminUsers, AdminSettings, AdminRag

supabase/
├── complete_schema.sql    # Full database schema (tables + RLS + indexes + pgvector)
├── rag_setup.sql          # pgvector + FTS functions (match_documents, match_documents_fts)
├── migration_like_dislike.sql  # like/dislike support for news_likes
├── seed_guides.sql        # Seed guides for the RAG document store
├── seed_users.sql         # Seed demo users (incl. an admin)
├── supabase.js            # Supabase client config
└── functions/
    ├── fetch-news/        # CoinDesk RSS → news table (hourly cron)
    ├── sync-guides/       # Guides → documents + embeddings
    └── chat/              # RAG + LLM assistant backend
```

---

## 6. Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- A **Supabase** project (free tier is fine)
- (Optional) **Groq** and **Gemini** API keys for AI features

### Install & run

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (see Section 7)
#    Copy .env.example to .env and fill in your Supabase URL + anon key

# 3. Start the dev server (http://localhost:5173)
npm run dev
```

### Production build

```bash
npm run build     # outputs to dist/
npm run preview   # serve the production build locally
```

### Database setup
1. Run `supabase/complete_schema.sql` in the Supabase SQL editor.
2. Run `supabase/rag_setup.sql` for the vector/FTS functions.
3. Run `supabase/migration_like_dislike.sql` if the schema predates it.
4. (Optional) Run `supabase/seed_guides.sql` and `supabase/seed_users.sql`.

### Edge Functions
Deploy the functions in `supabase/functions/` with the Supabase CLI:

```bash
npx supabase functions deploy fetch-news
npx supabase functions deploy sync-guides
npx supabase functions deploy chat
```

`fetch-news` can be scheduled with a cron job (e.g. hourly) via Supabase's cron integration.

---

## 7. Environment Variables

Copy `.env.example` to `.env`:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `GEMINI_API_KEY` | Google Gemini API key (RAG embeddings, AI fallback) |
| `GROQ_API_KEY` | Groq API key (fast LLM generation) |

> The anon key is safe to ship in a client app — Supabase Row-Level Security (RLS) is the actual gatekeeper. Secret keys such as the service-role key and LLM keys are only used server-side inside Edge Functions via `Deno.env.get(...)`, never in the browser.

---

## 8. Database Schema

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `profiles` | User accounts + role | `id` (FK → auth.users), `email`, `password` (bcrypt), `name`, `role` ('user'/'admin') |
| `watchlist` | Saved coins | `user_id`, `coin_id`, unique `(user_id, coin_id)` |
| `news` | Articles | `title`, `summary`, `content` (HTML), `category`, `tags[]`, `featured`, `trending`, `read_time`, `published_at`, `author_name`, `source_url`, `image_url` |
| `news_likes` | Reactions | `user_id`, `article_id`, `type` ('like'/'dislike'), unique `(user_id, article_id)` |
| `comments` | Article comments | `article_id`, `user_id`, `user_name`, `text` |
| `documents` | RAG knowledge base | `source`, `source_id`, `title`, `content`, `embedding` (vector(768)), `metadata` |
| `guides` | Admin-written docs for RAG | `title`, `content`, `category` |

### Row-Level Security
RLS policies enforce the business rules server-side:
- `profiles`: users read/write only their own row.
- `watchlist`: users manage only their own entries.
- `news`: public read; create/update/delete restricted to `role = 'admin'`.
- `news_likes`: authenticated users insert/update/delete only their own reactions.
- `comments`: authenticated users post/delete only their own comments.
- `documents`: public read for non-admin docs; admin docs filtered in the Edge Function.

### Vector & Full-Text Search
`rag_setup.sql` provides two SQL functions:
- `match_documents(query_embedding vector(768), match_count int)` — cosine-similarity search over `documents.embedding`.
- `match_documents_fts(query_text text, match_count int)` — Postgres `tsvector` keyword search with `ts_rank` scoring.

---

## 9. Supabase Edge Functions

### `fetch-news` — CoinDesk RSS ingestion
- Fetches the CoinDesk RSS feed, parses it with `fast-xml-parser`.
- Deduplicates articles by `source_url`.
- **Tier 1**: fetches the original article and has an LLM rewrite it into a fuller piece.
- **Tier 2**: expands the RSS summary into a 2–3 paragraph article (Groq first, Gemini fallback).
- Supports `POST` actions: `expand` (expand one short article) and `batch-expand` (expand all short articles, capped at 30).
- Sanitises HTML, strips scripts/styles/event handlers, extracts images and authors.

### `sync-guides` — RAG document indexing
- Reads all rows from the `guides` table, upserts them into `documents`.
- Generates 768-dim embeddings with Gemini for any document missing one.

### `chat` — AI assistant backend
- **Query rewriting**: uses the LLM to turn the user's question (plus last 4 turns of history) into a standalone search query.
- **Hybrid retrieval**: runs vector search and full-text search in parallel, then fuses results with Reciprocal Rank Fusion (RRF, k=60).
- **Admin filtering**: admin-only guides are only surfaced to admins.
- **Context assembly**: injects matched documents (capped per source) plus current live prices into the system prompt.
- **Generation**: Groq Llama 3.1 (with retry/backoff on 429/503), response cites sources as `[1]`, `[2]`, etc.
- Returns `{ answer, sources }` where sources carry a `cited` flag parsed from the response.

---

## 10. Authentication & Roles

Flow:
1. **Register** — a user enters email + name. Supabase creates the account with a random temporary password and emails a magic link.
2. **Set password** — following the link, the user lands on `/set-password` and chooses a real password. A bcrypt hash is also stored on the profile.
3. **Login** — email + password via `supabase.auth.signInWithPassword`.
4. **Roles** — the `profiles.role` column determines access. `useAdmin` exposes `isAdmin` computed; route meta + the admin layout both gate admin pages.

Differentiated visibility:
- Guests: public market data, news, watchlist (localStorage).
- Authenticated: watchlist in Supabase, likes/dislikes, comments, profile.
- Admins: CMS CRUD, user management, settings, RAG administration.

---

## 11. Live Price Pipeline

1. **Symbol mapping** (`websocket.js`) — coin IDs/symbols are mapped to Binance pairs (e.g. `MATIC → POLUSDT`), filtering out stablecoins and leveraged tokens.
2. **Primary stream** — a single WebSocket to `!miniTicker@arr` streams all symbols; messages are parsed (mini or full ticker) and matched to local coin IDs (including a base-symbol fallback matcher).
3. **REST failover** — if the socket is not connected, a 3s REST poll to `/api/v3/ticker/24hr` (chunked at 100 symbols) keeps prices fresh.
4. **Throttled notify** — subscribers are flushed at most every 500ms with only the changed symbols.
5. **Reconnect** — exponential backoff (2s → 12s, max 8 attempts) with intentional-close handling.
6. **Subscription layer** (`livePrices.js`) — reference-counted `start`/`stop`, de-duplication of tracked ids, and `applyLiveFlashes` to compute up/down flash directions for the UI.
7. **CoinGecko enrichment** (`api.js`) — the coin list is enriched with market caps, images, and 24h stats, merged with live Binance data (via a shared rate-limiter with 60s caches).

The dev server proxies `/api/binance` and `/api/coingecko` to the real hosts to avoid CORS issues in development (`vite.config.js`).

---

## 12. The AI Chatbot (RAG)

The assistant (`AiAssistant.vue` + `chat` Edge Function) is the showcase Stage 3 feature:

- **UI** — floating button opens a chat panel; messages render as sanitised Markdown; quick-prompt chips; loading state with typing indicator.
- **RAG** — the server performs query rewriting → hybrid search (vector + FTS) → RRF fusion → LLM answer with cited sources.
- **Live context** — the client sends the current `livePrices` map and the active route (`currentView`) so the model knows the user's screen and can quote real-time prices.
- **Admin awareness** — admins receive admin-guide context; regular users never see admin content.
- **Source chips** — each response includes source cards (title + similarity) with a `cited` badge.

The `documents` table is fed by the `sync-guides` function from the `guides` table (managed in the Admin RAG panel).

---

## 13. Design System & UX

- **Dark-mode-first** fintech aesthetic: deep black backgrounds, gold accents, high-contrast text, Orbitron/Exo 2/Plus Jakarta Sans font pairing.
- **CSS custom properties** in `src/assets/global.css` define a token vocabulary (backgrounds, accents, positive/negative, borders, shadows) for both dark and light themes.
- **Theme toggle** — `useTheme.js` persists the choice in `localStorage`; an inline script in `index.html` applies the theme before the app boots to avoid flash-of-wrong-theme.
- **Responsive & mobile-first** — Bootstrap grid + custom media queries (`@media (max-width: 575px)`, etc.). Layouts collapse gracefully from desktop → tablet → phone.
- **Accessibility** — `aria-label` on inputs, `aria-describedby` for error messages, semantic `label`/`fieldset`/`legend`, focus-visible styles, `aria-live` regions on dynamic content.
- **Form validation** — the About "Say hello" form validates required fields, rejects numbers, and restricts input to letters (including accented characters) with inline error feedback.
- **Micro-interactions** — price up/down flash animations, skeleton loaders, animated page heroes, card hover glows.

---

## 14. Advanced Techniques

The following techniques go well beyond the basics and demonstrate depth of research:

1. **WebSocket real-time streaming** — single-socket streaming for all symbols, REST failover, throttled subscriber notifications, exponential-backoff reconnection, symbol-normalisation matching.
2. **Hybrid Retrieval-Augmented Generation** — pgvector cosine search fused with Postgres full-text search via **Reciprocal Rank Fusion** (RRF), with LLM query rewriting and citation parsing.
3. **Custom rate limiter & cache** — token-bucket algorithm, in-memory + `localStorage` cache, in-flight request deduplication, retry with backoff, queue draining on tab visibility.
4. **Optimistic UI with rollback** — watchlist toggles update the UI instantly and roll back on sync failure.
5. **Supabase Realtime** — the admin news list stays in sync across sessions via realtime subscriptions.
6. **Custom Vue directives** — `v-focus` (auto-focus) and `v-permission` (show/hide by auth state) registered in `main.js`.
7. **Invite-based registration** — temporary password + magic link + `/set-password` flow.
8. **RLS-gated multi-role admin** — client UI and database policies both enforce roles.
9. **Content sanitisation** — DOMPurify for stored HTML (TipTap output) and rendered Markdown, plus server-side HTML sanitisation in the RSS pipeline.

---

## 15. Security

- **RLS everywhere** — every table enforces row-level security; the client uses the public anon key only.
- **Secrets stay server-side** — Groq/Gemini/service-role keys are read from Edge Function env, never bundled in the client.
- **XSS protection** — DOMPurify sanitises TipTap HTML before writing and Markdown before rendering; the RSS pipeline strips scripts/styles/event handlers.
- **bcrypt password hashes** — stored on profiles as defense in depth alongside Supabase Auth.
- **Sanitised external content** — RSS/LLM-expanded HTML is escaped or stripped before insert.
- **CORS** — Edge Functions return explicit CORS headers.

---

## 16. Deployment

### Vercel (frontend)
- Framework preset: **Vite**, build command `vite build`, output `dist`.
- `vercel.json` rewrites all routes to `/index.html` for SPA history-mode routing.

### Supabase (backend)
- Database schema, functions, and RLS via `supabase/*.sql`.
- Edge Functions deployed with the Supabase CLI and invoked from the client by URL.

---

## 17. Project Status

- **Live prices & charts** — implemented and working.
- **Auth (register / login / invite / set password)** — implemented.
- **Watchlist with optimistic updates** — implemented.
- **News CMS + TipTap editor** — implemented.
- **CoinDesk RSS auto-fetch** — implemented via Edge Function + cron.
- **Likes / dislikes / comments** — implemented.
- **RAG AI assistant** — implemented (hybrid search + LLM + citations).
- **Admin dashboard, user management, settings, RAG admin** — implemented.
- **Form validation & accessibility** — implemented.

---

## 18. Reflection & Challenges

A few of the challenges encountered and how they were addressed:

- **Real-time at scale** — Polling each coin individually would fire hundreds of HTTP requests. The solution was a single Binance WebSocket streaming all mini-tickers, a REST failover for resilience, and a throttled observer to avoid re-render storms.
- **External API rate limits** — CoinGecko and Binance impose strict quotas. A token-bucket rate limiter with caching and request deduplication was built from scratch (`rateLimiter.js`) rather than importing a library.
- **Hybrid search quality** — Vector search alone misses exact keyword matches. Adding Postgres FTS and fusing both with RRF produced noticeably better retrieval, with LLM query rewriting to bridge the user-question/document vocabulary gap.
- **Stored XSS risk** — A rich-text editor means users can paste arbitrary HTML. DOMPurify (plus server-side sanitisation in the RSS pipeline) became a mandatory part of the write path.
- **Auth friction** — Users dislike passwords they never chose. The invite flow (temporary password + magic link + set-password page) made onboarding smoother while keeping security.
- **Admin content separation** — Admin-only guides had to stay hidden from regular users in both retrieval and display, which required filtering at the RAG retrieval step, not just the UI.

---

## Author

Built with Vue 3, Supabase, Binance, CoinGecko, and a lot of coffee. See `tech-stack-reference.md`, `ui-ux-report.md`, and `Interface Report.md` for deeper write-ups.
