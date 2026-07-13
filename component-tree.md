# CryptoDash — Component Tree

```
src/
│
├── App.vue                                    # Root shell
│   ├── Navbar                                 # src/components/layout/Navbar.vue
│   │   ├── ThemeToggle                        # src/components/ui/ThemeToggle.vue
│   │   └── [useTheme, useAuth, useAdmin]      # Composables
│   │
│   ├── <RouterView>                           # Page-level route content
│   │   ├── Home.vue                           # src/views/general/Home.vue
│   │   │   ├── HeroSection                    # src/components/layout/HeroSection.vue
│   │   │   ├── StatCard × 4                   # src/components/ui/StatCard.vue
│   │   │   ├── CoinCard × N                   # src/components/coins/CoinCard.vue
│   │   │   │   ├── PriceWithArrow             # src/components/ui/PriceWithArrow.vue
│   │   │   │   └── FavoriteButton             # src/components/ui/FavoriteButton.vue
│   │   │   ├── [CoinTable]                    # src/components/coins/CoinTable.vue
│   │   │   │   └── PriceWithArrow
│   │   │   └── [news cards]                   # Inline news markup
│   │   │
│   │   ├── Markets.vue                        # src/views/coins/Markets.vue
│   │   │   ├── ThemeToggle
│   │   │   ├── LoadingSpinner                 # src/components/ui/LoadingSpinner.vue
│   │   │   ├── EmptyState                     # src/components/ui/EmptyState.vue
│   │   │   └── CoinTable                      # src/components/coins/CoinTable.vue
│   │   │       ├── PriceWithArrow
│   │   │       └── FavoriteButton
│   │   │
│   │   ├── CoinDetail.vue                     # src/views/coins/CoinDetail.vue
│   │   │   ├── PriceWithArrow
│   │   │   ├── FavoriteButton
│   │   │   └── CoinDashboard                  # src/components/coins/CoinDashboard.vue
│   │   │       ├── TradingView Chart          # Lightweight Charts (canvas)
│   │   │       │   └── CandlestickSeries / LineSeries / HistogramSeries
│   │   │       └── EmptyState
│   │   │
│   │   ├── Watchlist.vue                      # src/views/coins/Watchlist.vue
│   │   │   ├── LoadingSpinner
│   │   │   ├── EmptyState
│   │   │   ├── PageHero                       # src/components/layout/PageHero.vue
│   │   │   └── [watchlist table]              # Inline table markup
│   │   │       └── PriceWithArrow
│   │   │
│   │   ├── Login.vue / Register.vue           # src/views/auth/
│   │   │   └── [form + validation UI]         # Pure inline forms
│   │   │
│   │   ├── Profile.vue                        # src/views/auth/Profile.vue
│   │   │   └── [profile card + stats]
│   │   │
│   │   ├── News.vue / NewsDetail.vue          # src/views/news/
│   │   │   ├── LoadingSpinner
│   │   │   ├── EmptyState
│   │   │   └── [comments + reactions]         # Via useComments, useReactions composables
│   │   │
│   │   ├── About.vue                          # src/views/general/About.vue
│   │   │   └── PageHero
│   │   │
│   │   └── [Admin nested routes]              # src/views/admin/
│   │       ├── AdminLayout                    # src/views/admin/AdminLayout.vue
│   │       │   └── <RouterView>               # Admin children
│   │       │       ├── AdminDashboard
│   │       │       │   └── StatCard × N
│   │       │       ├── AdminNews
│   │       │       │   └── LoadingSpinner / EmptyState
│   │       │       ├── AdminNewsEdit
│   │       │       │   └── RichTextEditor     # TipTap wrapper
│   │       │       └── AdminUsers
│   │       │           └── LoadingSpinner / EmptyState
│   │
│   ├── Footer                                 # src/components/layout/Footer.vue
│   └── AiAssistant                            # src/components/ai/AiAssistant.vue
│       └── [chat bubble UI]
│           └── marked + DOMPurify             # Markdown rendering + XSS sanitization
│
├── services/                                  # Data layer
│   ├── api.js                                 # CoinGecko REST client
│   ├── binance.js                             # Binance REST klines
│   ├── coingecko.js                           # CoinGecko fallback endpoints
│   ├── websocket.js                           # Binance WebSocket connection manager
│   ├── livePrices.js                          # Price aggregation + subscriber pattern
│   └── news.js                                # RSS + Supabase Realtime
│
├── composables/                               # Stateful logic
│   ├── useAuth.js                             # Authentication state (module singleton)
│   ├── useTheme.js                            # Dark/light theme (localStorage persist)
│   ├── useAdmin.js                            # Admin role check
│   ├── useWatchlist.js                        # Watchlist (Supabase + localStorage)
│   ├── useLivePrices.js                       # Live price subscription composable
│   ├── useComments.js                         # Article comments CRUD
│   └── useReactions.js                        # News likes/reactions
│
├── utils/
│   └── format.js                              # formatPrice, formatMarketCap, formatChange
│
├── router/
│   └── index.js                               # 15 routes, auth guards
│
├── assets/
│   └── global.css                             # 461 lines — CSS custom properties, animations
│
└── main.js                                    # App entry, custom directives (v-focus, v-permission)
```

## Component Dependency Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                         App.vue (Shell)                            │
│                                                                    │
│  ┌───────────┐  ┌──────────────────────────┐  ┌──────────┐       │
│  │  Navbar   │  │     <RouterView />        │  │  Footer  │       │
│  │           │  │                           │  │          │       │
│  │ • Theme-  │  │  ┌─────────────────────┐  │  │ • Social │       │
│  │   Toggle  │  │  │   Home.vue           │  │  │   links  │       │
│  │ • useAuth │  │  │ ┌──────┐ ┌────────┐ │  │  └──────────┘       │
│  │ • useAdmin│  │  │ │Hero  │ │StatCard│ │  │                     │
│  │           │  │  │ │Sect. │ │ ×4     │ │  │  ┌──────────┐       │
│  └───────────┘  │  │ └──────┘ └────────┘ │  │  │AiAssistant│       │
│                 │  │ ┌────────┐ ┌──────┐ │  │  │           │       │
│                 │  │ │CoinCard│ │Coin..│ │  │  │ • live    │       │
│                 │  │ │ ×N     │ │Table │ │  │  │   prices  │       │
│                 │  │ └────────┘ └──────┘ │  │  │ • Edge    │       │
│                 │  └─────────────────────┘  │  │   Function│       │
│                 │                           │  └──────────┘       │
│                 │  ┌─────────────────────┐  │                     │
│                 │  │   Markets.vue        │  │                     │
│                 │  │ ┌──────────┐        │  │                     │
│                 │  │ │CoinTable │        │  │                     │
│                 │  │ │• search  │        │  │                     │
│                 │  │ │• sort    │        │  │                     │
│                 │  │ │• paginate│        │  │                     │
│                 │  │ └──────────┘        │  │                     │
│                 │  └─────────────────────┘  │                     │
│                 │                           │                     │
│                 │  ┌─────────────────────┐  │                     │
│                 │  │  CoinDetail.vue      │  │                     │
│                 │  │ ┌─────────────┐     │  │                     │
│                 │  │ │CoinDashboard │     │  │                     │
│                 │  │ │• Binance     │     │  │                     │
│                 │  │ │  candlestick │     │  │                     │
│                 │  │ │  chart       │     │  │                     │
│                 │  │ │• CoinGecko   │     │  │                     │
│                 │  │ │  fallback    │     │  │                     │
│                 │  │ │  line chart  │     │  │                     │
│                 │  │ └─────────────┘     │  │                     │
│                 │  └─────────────────────┘  │                     │
│                 │                           │                     │
│                 │  ┌─────────────────────┐  │                     │
│                 │  │  Watchlist.vue       │  │                     │
│                 │  │ ┌─────────────────┐ │  │                     │
│                 │  │ │Inline table     │ │  │                     │
│                 │  │ │+ live dot       │ │  │                     │
│                 │  │ └─────────────────┘ │  │                     │
│                 │  └─────────────────────┘  │                     │
│                 │                           │                     │
│                 │  ┌─────────────────────┐  │                     │
│                 │  │  Auth Pages         │  │                     │
│                 │  │ (Login / Register / │  │                     │
│                 │  │  Profile)           │  │                     │
│                 │  │ • form validation   │  │                     │
│                 │  │ • Supabase Auth     │  │                     │
│                 │  └─────────────────────┘  │                     │
│                 │                           │                     │
│                 │  ┌─────────────────────┐  │                     │
│                 │  │  Admin (nested)      │  │                     │
│                 │  │ ┌─────────────┐     │  │                     │
│                 │  │ │AdminDashboard│     │  │                     │
│                 │  │ │AdminNews    │     │  │                     │
│                 │  │ │AdminNewsEdit│     │  │                     │
│                 │  │ │• TipTap RT  │     │  │                     │
│                 │  │ │  editor     │     │  │                     │
│                 │  │ └─────────────┘     │  │                     │
│                 │  └─────────────────────┘  │                     │
│                 │                           │                     │
│                 └───────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Shared Service Layer

```
All views + components ──────► src/services/
                                    │
                        ┌───────────┼───────────┐
                        │           │           │
                        ▼           ▼           ▼
                    api.js     websocket.js  news.js
                  (CoinGecko)  (Binance)    (RSS + Realtime)
                        │           │
                        │           ▼
                        │     livePrices.js
                        │     (aggregation +
                        │      subscriber pattern)
                        │
                        ▼
                 coingecko.js
                 (fallback endpoints)
```

## Composable Usage Map

| Composable | Used By | Purpose |
|-----------|---------|---------|
| `useTheme` | `Navbar`, `ThemeToggle`, `CoinDashboard` | Dark/light mode |
| `useAuth` | `App.vue` (v-permission), `Navbar`, `Login`, `Register`, `Profile`, `useWatchlist` | Auth state singletons |
| `useAdmin` | `Navbar`, `AiAssistant`, `AdminLayout` | Admin role check |
| `useWatchlist` | `Watchlist`, `Home`, `Markets`, `CoinDetail`, `FavoriteButton` | Favorites management |
| `useLivePrices` | `Home`, `Markets`, `Watchlist` | Real-time subscriptions |
| `useComments` | `NewsDetail` | Comment CRUD |
| `useReactions` | `NewsDetail` | Like/reaction toggles |
