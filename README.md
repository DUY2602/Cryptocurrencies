# CryptoDash — Cryptocurrency Market Dashboard

A real-time cryptocurrency market tracker built with **Vue 3**, featuring live Binance prices, interactive charts, a full admin-powered news CMS with TipTap rich-text editing, and a RAG AI chatbot framework.

---

## Features

### Market Data
- **Live prices** — Binance WebSocket + REST API (60s cache), 24h change, volume
- **Interactive charts** — Lightweight Charts library, candlestick + volume, MA/EMA indicators
- **Coin detail pages** — Price history, market cap, high/low, 24h stats
- **Watchlist** — Star your favorite coins, persisted per user
- **Sort & filter** — Markets page with sortable columns, category filtering

### News CMS
- **TipTap rich-text editor** — Bold, italic, underline, headings, lists, links, images, code blocks, blockquotes
- **Admin panel** — Full CRUD, featured/trending flags, tags, categories, author management
- **Real-time sync** — Supabase Realtime keeps the admin list in sync across sessions
- **CoinDesk auto-fetch** — Edge Function pulls RSS hourly, deduplicates by URL, inserts into Supabase
- **Fallback data** — Local `news.json` when Supabase is unavailable

### Authentication & Users
- **Supabase Auth** — Email/password registration and login
- **Role-based access** — Admin role gates the CMS and user management panel
- **User profiles** — Watchlist, news likes, comments tied to authenticated users

### AI Chatbot (Framework)
- **Chat UI** — Floating assistant panel with message history and quick prompts
- **RAG-ready** — `documents` table with `pgvector(768)` for Gemini embeddings
- **Live data integration** — Context service layer (`ragContext.js`) for injecting real-time prices into LLM prompts

---

## Project Architecture

```
Client (Vue 3 + Vite)
  ├── Binance REST/WebSocket ──── Live prices
  ├── CoinGecko API ───────────── Market cap, images
  ├── Supabase ────────────────── Auth, database, realtime
  └── Supabase Edge Functions ─── RSS fetch, future RAG

Supabase Stack
  ├── Tables: profiles, news, comments, watchlist, news_likes, documents
  ├── Auth: email/password, row-level security (RLS)
  ├── Realtime: news table sync
  └── pgvector: 768-dim embeddings for Gemini RAG
```

### Directory Structure

```
src/
├── components/         # UI components (Navbar, CoinCard, RichTextEditor, AiAssistant…)
├── views/
│   ├── admin/          # AdminLayout, AdminNews, AdminNewsEdit, AdminUsers, AdminSettings
│   ├── general/        # Home, About
│   ├── coins/          # Markets, CoinDetail, Watchlist
│   ├── news/           # News, NewsDetail
│   └── auth/           # Login, Register, Profile, SetPassword
├── composables/        # Vue composables (useAuth, useAdmin, useWatchlist, useTheme…)
├── services/           # API layer (api, binance, coingecko, news, websocket, livePrices)
├── data/               # Fallback static data (coins.js, news.json)
├── router/index.js     # All routes (public + admin)
├── App.vue             # Root layout
└── main.js             # Entry point

supabase/
├── complete_schema.sql # Full database schema (6 tables + RLS + indexes + pgvector)
├── functions/
│   └── fetch-news/     # Edge Function: CoinDesk RSS → news table
└── supabase.js         # Client config
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 (Composition API) |
| Build | Vite 5 |
| Styling | Bootstrap 5 + custom dark theme |
| Charts | Lightweight Charts (TradingView) |
| Rich-text | TipTap (ProseMirror) |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Edge Functions) |
| Live data | Binance REST + WebSocket API |
| Static data | CoinGecko API |
| Vector search | pgvector (768-dim, text-embedding-004) |

---

## Setup

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` — keys come from Supabase project settings.

---

## Routes

| Path | Page |
|------|------|
| `/` | Home — trending coins, market overview |
| `/markets` | Markets — sortable coin table, live prices |
| `/coin/:id` | Coin detail — chart, stats, live price |
| `/watchlist` | Watchlist — saved coins |
| `/news` | News feed |
| `/news/:id` | News detail |
| `/about` | About |
| `/login` / `/register` | Auth |
| `/profile` | User profile |
| `/admin` | Dashboard (KPIs) |
| `/admin/news` | News CMS list |
| `/admin/news/edit/new` | Create article |
| `/admin/news/edit/:id` | Edit article |
| `/admin/users` | User role management |
| `/admin/settings` | System settings |

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles + role (`user` / `admin`) |
| `news` | Articles with rich HTML content |
| `comments` | Article comments |
| `watchlist` | User-saved coins |
| `news_likes` | Article likes |
| `documents` | Vector embeddings for RAG (768-dim) |

---

## Current Status

- **✅ Live** — Market data, charts, auth, watchlist, comments, news CRUD
- **✅ Admin** — Full CMS with TipTap editor, user management, settings
- **✅ RSS Fetch** — CoinDesk hourly via Edge Function
- **🔄 RAG Chatbot** — UI ready, vector store schema done, awaiting LLM integration

---

## Author

Built with Vue 3, Supabase, and the Binance API.
