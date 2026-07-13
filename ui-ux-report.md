# Cryptocurrency Dashboard — User Interface & User Experience

## Table of Contents

1. [Overall Design and Visual Hierarchy](#1-overall-design-and-visual-hierarchy)
2. [Component Architecture & Reusability](#2-component-architecture--reusability)
3. [Responsive Design and Usability](#3-responsive-design-and-usability)
4. [Key UI Components & User Flows](#4-key-ui-components--user-flows)
5. [References](#5-references)

---

## 1. Overall Design and Visual Hierarchy

### 1.1 Design Language and Aesthetic Philosophy

CryptoDash adopts a **dark-mode-first, fintech-oriented visual language** inspired by modern cryptocurrency exchanges and Web3 applications. The design system is anchored by a CSS custom property architecture defined in `src/assets/global.css`, which establishes a consistent token vocabulary across the entire application. The default theme is a dark aesthetic (`:root, [data-theme="dark"]`) built around deep black backgrounds (`#000000`), subtle gold accent tones (`#ffc837`), and high-contrast text (`#f8f9fa` primary, `#ffffff` emphasis) that evoke the visual language of premium financial terminals.

The light theme (`[data-theme="light"]`) inverts the palette to a warm white base (`#ffffff`) with amber accents (`#f59e0b`), preserving brand coherence while reducing visual fatigue in daylight environments. Both themes share an identical structural grammar—border radii, spacing scales, shadows, and transition curves—which ensures that the visual identity remains coherent regardless of the user's theme preference.

### 1.2 Color System and Semantic Encoding

The color system is organised into three functional tiers:

| Token | Dark Value | Light Value | Purpose |
|-------|-----------|-------------|---------|
| `--bg-primary` | `#000000` | `#ffffff` | Page background |
| `--accent` | `#ffc837` | `#f59e0b` | Brand accent, CTAs, highlights |
| `--positive` | `#10b981` | `#059669` | Price increase, success states |
| `--negative` | `#f43f5e` | `#dc2626` | Price decrease, error states |
| `--text-primary` | `#f8f9fa` | `#171717` | Body text |
| `--text-secondary` | `#a3a3a3` | `#525252` | Labels, captions |
| `--text-tertiary` | `#737373` | `#a3a3a3` | Disabled, placeholder |

The `--positive` and `--negative` tokens serve a dual semantic role: they encode both financial meaning (gains/losses) and system state (success/error feedback). This dual encoding is a deliberate design decision aligned with financial domain conventions, where green universally signals upward movement and red signals downward movement. The system enforces this through utility classes such as `.text-positive`, `.text-negative`, `.price-flash-up`, and `.price-flash-down` defined in `global.css` (lines 293–331).

### 1.3 Typography Hierarchy

The typographic system employs a three-tier hierarchy:

- **Display/Heading**: `'Orbitron', sans-serif` — used for page titles (`.page-title`), hero headlines (`.hero-title`), section headings (`.section-heading`), and the brand name in the navigation bar. The typeface is a geometric sans-serif with a technological character appropriate for a fintech application. Font sizes use `clamp()` for fluid scaling: `clamp(1.75rem, 3.5vw, 2.25rem)` for page titles and `clamp(1.85rem, 5vw, 3.2rem)` for hero headlines (`HeroSection.vue`, line 192).

- **Monospace/Data**: `'JetBrains Mono', monospace` — used exclusively for numerical values (prices, market caps, volumes) via the `.font-monospace` utility class and the `.stat-card-value` style. This choice ensures that price digits align vertically using `font-variant-numeric: tabular-nums` (`global.css`, line 245), critical for scanability in data-dense tables.

- **Body/UI**: `"Exo 2", "Plus Jakarta Sans", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif` — the primary body typeface (`global.css`, line 124), selected for legibility at small sizes and its clean geometric structure. The fallback chain ensures consistent rendering across platforms.

### 1.4 Visual Hierarchy and Focal Points

The visual hierarchy follows a Z-pattern reading flow adapted for data dashboards:

1. **Navigation Bar** (top): Fixed sticky navbar with `z-index: 1050+` establishes global navigation. The brand logo and "CryptoDash" text serve as the primary anchor point. On scroll, the navbar transitions from transparent to solid background with reduced padding (`.navbar-scrolled` class, `global.css`, lines 349–368), creating a visual compression effect that signals content depth.

2. **Hero Section** (`HeroSection.vue`): The landing page hero occupies a `min-height: 440px` viewport section with layered visual depth—background image, animated glow orbs (`::before`, `::after` pseudo-elements), a cyber-grid overlay (CSS `background-image` with `mask-image` radial gradient), and a dark overlay gradient. The title uses a gradient text fill (`linear-gradient(135deg, var(--hero-title-gradient-start) 20%, var(--accent) 80%, #ffeb3b 100%)`) to create maximum visual impact. The HUD stats bar (`hero-hud-stats`) uses glassmorphism (`backdrop-filter: blur(16px)`) to float above the background while maintaining readability.

3. **Data Cards and Tables**: Content sections use `card-crypto` glassmorphism cards with semi-transparent backgrounds (`rgba(20, 18, 10, 0.45)`), subtle borders (`rgba(255, 200, 55, 0.15)`), and `border-radius: 18px`. Hover states elevate cards with `box-shadow` expansion and background lightening (`global.css`, lines 226–241). Data tables (`.table-crypto`) use alternating row indicators via left-border color coding: green (`--positive`) for gainers, red (`--negative`) for losers, and gold (`--accent`) on hover (`Watchlist.vue`, lines 300–303).

4. **Call-to-Action Buttons**: The `.btn-accent` class uses a gradient background (`linear-gradient(135deg, var(--accent) 0%, #f59e0b 100%)`) with box-shadow glow (`0 4px 12px rgba(245, 158, 11, 0.25)`) to create visual prominence against dark backgrounds. Hover states intensify the glow (`0 6px 18px rgba(245, 158, 11, 0.35)`), reinforcing interactivity.

### 1.5 Ambient Visual Effects

The application employs several ambient visual effects to create depth and a premium aesthetic:

- **Animated mesh blobs**: Two `body::before` and `body::after` pseudo-elements create slow-drifting radial gradient blobs (`45s` and `60s` animation cycles) with `filter: blur(80px)`, establishing a subtle animated background texture (`global.css`, lines 137–175).

- **Price flash animations**: Real-time price updates trigger CSS animations (`textFlashGreen`, `textFlashRed`, `flashGreen`, `flashRed`) with `0.55s` duration and `text-shadow` glow effects (`global.css`, lines 318–331).

- **Page transitions**: Route changes are animated via Vue's `<Transition>` component with `pageIn` (opacity 0→1, translateY 12→0) and `pageOut` (opacity 1→0, translateY 0→-8) keyframes, using `0.32s` and `0.18s` durations respectively (`App.vue`, lines 23–36).

- **Reduced motion support**: All animations respect `prefers-reduced-motion: reduce` media query, collapsing durations to `0.01ms` (`global.css`, lines 190–196).

---

## 2. Component Architecture & Reusability

### 2.1 Architectural Overview

CryptoDash follows a **feature-based directory structure** with clear separation of concerns:

```
src/
├── assets/          # Global CSS, static styles
├── components/
│   ├── layout/      # Structural: Navbar, Footer, HeroSection, PageHero
│   ├── ui/          # Reusable: StatCard, PriceWithArrow, EmptyState, LoadingSpinner, ThemeToggle, FavoriteButton
│   ├── coins/       # Domain: CoinCard, CoinTable, CoinDashboard
│   └── ai/          # Feature: AiAssistant
├── composables/     # Stateful logic: useAuth, useTheme, useWatchlist, useLivePrices, useComments, useReactions, useAdmin
├── views/           # Route-level pages
│   ├── general/     # Home, About
│   ├── coins/       # Markets, CoinDetail, Watchlist
│   ├── news/        # News, NewsDetail
│   ├── auth/        # Login, Register, Profile, SetPassword
│   └── admin/       # AdminLayout, AdminDashboard, AdminNews, AdminNewsEdit, AdminUsers, AdminSettings
├── services/        # Data layer: api.js, binance.js, coingecko.js, livePrices.js, websocket.js, news.js
├── utils/           # Pure functions: format.js
├── router/          # Route definitions and guards
├── main.js          # App entry, directives
└── App.vue          # Root shell
```

This structure enforces a clear dependency hierarchy: `views` → `components` → `composables` → `services`, with `utils/` and `assets/` serving as leaf dependencies with no upward imports.

### 2.2 Component Design Patterns

#### 2.2.1 Atomic UI Components (`components/ui/`)

The `components/ui/` directory contains **stateless, prop-driven atomic components** designed for maximum reusability across views:

**StatCard** (`src/components/ui/StatCard.vue`):
- Props: `label` (String, required), `value` (String, required), `changeClass` (String, default `''`)
- Architecture: 14-line `<script setup>` component with zero internal state
- Usage: Consumed in `Home.vue`, `AdminDashboard.vue`, `CoinDetail.vue` for metric display
- Reusability: Accepts arbitrary label/value pairs; the `changeClass` prop enables conditional styling (positive/negative color) without the component knowing about the domain

**PriceWithArrow** (`src/components/ui/PriceWithArrow.vue`):
- Props: `price` (Number, required), `flash` (String: `'up'`|`'down'|null`), `pulse` (Boolean), `size` (String: `'sm'|'md'|'lg'`), `inline` (Boolean)
- Architecture: Options API component with computed properties deriving `direction`, `arrowClass`, `flashClass`, and `sizeClass` from props
- Usage: Embedded in coin tables and detail views for live price rendering
- Design decision: The component is purely presentational—it receives flash direction and pulse state from parent components via the `useLivePrices` composable, maintaining a unidirectional data flow

**EmptyState** (`src/components/ui/EmptyState.vue`):
- Props: `title` (String, required), `message` (String, default `''`), `icon` (String, default `'FolderOpen'`)
- Slots: default slot for custom content (e.g., action buttons)
- Usage: Displayed in `Watchlist.vue` when no coins are tracked, in `News.vue` for empty search results, and in `CoinDashboard.vue` for missing chart data

**LoadingSpinner** (`src/components/ui/LoadingSpinner.vue`):
- A pure presentational component with `role="status"` and `aria-label="Loading"` attributes
- Uses the `.spinner-crypto` CSS class with a custom `border-top-color: var(--accent)` animation (`global.css`, lines 408–410)

**FavoriteButton** (`src/components/ui/FavoriteButton.vue`):
- Props: `coinId` (String|Number, required), `size` (Number, default `18`)
- Composable integration: Uses `useWatchlist()` internally, calling `isFavorite()` and `toggleFavorite()`
- Accessibility: Dynamic `aria-label` toggles between "Add to watchlist" and "Remove from watchlist" based on state

**ThemeToggle** (`src/components/ui/ThemeToggle.vue`):
- Uses `useTheme()` composable for `isDark` state and `toggleTheme()` method
- ARIA: `role="switch"`, `aria-checked`, and `aria-label="Toggle dark mode"` (`ThemeToggle.vue`, lines 14–19)

#### 2.2.2 Layout Components (`components/layout/`)

Layout components define the application's structural shell:

**Navbar** (`src/components/layout/Navbar.vue`):
- Architecture: `<script setup>` composition with `useTheme()`, `useAuth()`, `useAdmin()` composables
- Scroll detection: `handleScroll()` listener (passive) toggles `isScrolled` state at 20px threshold, which controls navbar visual compression via `.navbar-scrolled` class
- Mobile responsiveness: Bootstrap 5 Collapse API for hamburger menu, with programmatic `closeNav()` on route change (`router.afterEach(() => closeNav())`, line 50)
- User menu: Custom dropdown (not Bootstrap's) with `aria-expanded` toggle and document click-outside listener for dismissal
- Admin visibility: Conditional rendering via `v-if="isAdmin"` composable value

**HeroSection** (`src/components/layout/HeroSection.vue`):
- Props: `title`, `subtitle`, `ctaText`, `ctaLink` (all with defaults)
- Visual layers: `.hero-bg` (background image with `mix-blend-mode` and `filter` theming), `.cyber-grid` (CSS grid overlay with `mask-image`), `.hero-glow` / `.hero-glow-2` (animated radial gradients), `.hero-overlay` (darkening gradient)
- HUD stats bar: Three metric cells (100+ Coins, 24/7 Live Updates, Free Registration) in a glassmorphism container with `backdrop-filter: blur(16px)` and vertical dividers

**Footer** (`src/components/layout/Footer.vue`):
- Semantic `<footer>` element with social links using `aria-label` attributes for icon-only links
- Links: GitHub, Twitter, Discord, LinkedIn (external, `target="_blank"`, `rel="noopener noreferrer"`)

#### 2.2.3 Composables — Stateful Logic Extraction

Composables encapsulate reusable stateful logic, following Vue 3's Composition API convention:

**useTheme** (`src/composables/useTheme.js`):
- Manages `data-theme` attribute on `<html>` element
- Persists preference to `localStorage` key `"cryptodash-theme"`
- Initializes on app boot via `initTheme()` called in `main.js`

**useAuth** (`src/composables/useAuth.js`):
- Exports reactive `user` ref (module-level singleton shared across components)
- Methods: `login(email, password)`, `logout()`, `requestRegistration(data)`
- Integrates with Supabase Auth for session management

**useWatchlist** (`src/composables/useWatchlist.js`):
- Dual storage strategy: Supabase `watchlist` table for authenticated users, `localStorage` for guests
- Automatic sync on auth state change via `watch(user, (u) => syncForUser(u), { immediate: true })`
- Returns: `watchlistIds` (computed), `isFavorite(id)`, `toggleFavorite(id)`, `removeFavorite(id)`
- Error handling: Graceful fallback to localStorage on Supabase failures (`console.warn` + fallback)

**useLivePrices** (`src/composables/useLivePrices.js`):
- Subscribes to `livePrices` service (Binance WebSocket feed)
- Tracks price directions and flash states per coin ID
- Returns: `liveData`, `isLive`, `applyLive(coin)` — the latter merges live data onto a coin object, overriding `price` and `change24h` with real-time values
- Lifecycle: Starts on `onMounted`, unsubscribes on `onUnmounted`

**useComments** (`src/composables/useComments.js`):
- CRUD operations for article comments via Supabase
- Client-side caching: Reads/writes `localStorage` key `"cryptodash-comments"` to reduce Supabase queries
- Functions: `getCommentCount(articleId)`, `getComments(articleId)`, `postComment(articleId, text, user)`, `removeComment(commentId, user)`

### 2.3 Service Layer Abstraction

The service layer (`src/services/`) isolates external API interactions:

**api.js**: Central data service wrapping CoinGecko API calls (`getTopCoins()`, `getCoinById()`, `getCoinMarketChart()`)

**binance.js**: Binance REST API client for historical klines (`getKlines(symbol, interval, limit)`)

**coingecko.js**: CoinGecko-specific endpoints (`fetchCoinMeta()`, `fetchMarketCaps()`, `fetchCoinImages()`, `refreshCoinMeta()`, `fetchCoinPrice()`, `fetchMarketChart()`)

**livePrices.js**: Binance WebSocket connection manager with subscription pattern, reconnection logic, and price direction tracking

**websocket.js**: Low-level WebSocket wrapper for Binance streaming

**news.js**: News data fetching from RSS sources

### 2.4 Custom Directives

Two custom directives registered in `main.js`:

- **v-focus**: Auto-focuses an element on mount (`app.directive('focus', { mounted(el) { el.focus() } })`)
- **v-permission**: Conditionally hides elements based on auth state (`v-permission="'auth'"` hides the element when no user is logged in). Maintains a global `permTargets` array and re-evaluates on `user` ref changes.

### 2.5 Reusability Assessment

The component architecture demonstrates several reusability patterns:

| Pattern | Example | Reusability Score |
|---------|---------|-------------------|
| Prop-driven atoms | `StatCard`, `PriceWithArrow` | High — used across 5+ views |
| Composable extraction | `useWatchlist`, `useLivePrices` | High — shared across `Markets`, `Watchlist`, `CoinDetail`, `Home` |
| Slot-based composition | `EmptyState` default slot | Medium — allows custom CTA injection |
| Layout shells | `Navbar`, `Footer`, `HeroSection` | High — used in every page |
| Service abstraction | `api.js`, `coingecko.js` | High — decoupled from UI |

The weakest reusability point is the `CoinCard` and `CoinDashboard` components, which are tightly coupled to the Binance/CoinGecko data schema. Refactoring these into more generic chart/card abstractions would improve flexibility for future features (e.g., NFT tracking, DeFi dashboards).

---

## 3. Responsive Design and Usability

### 3.1 Breakpoint Strategy

CryptoDash employs a **mobile-first, five-breakpoint responsive system** aligned with Bootstrap 5 conventions but extended with custom media queries:

| Breakpoint | Width | Primary Behaviour |
|------------|-------|-------------------|
| xs | `<576px` | Single-column layout, compact table cells, reduced icon sizes |
| sm | `≥576px` | Minor table column adjustments |
| md | `≥768px` | Two-column form layouts, table minimum width reduction |
| lg | `≥991px` | Full table visibility (Volume, Market Cap columns revealed) |
| xl | `≥1200px` | Maximum content width constraint |

### 3.2 Responsive Patterns

#### 3.2.1 Navigation Collapse

The navbar uses Bootstrap 5's Collapse API for mobile hamburger menu:
- The `navbar-toggler` button with `data-bs-toggle="collapse"` and `data-bs-target="#mainNavbar"` controls a `ref="navbarCollapse"` element
- The collapse is initialized programmatically via `new Collapse(navbarCollapse.value, { toggle: false })` to prevent flash on mount
- Route changes automatically close the mobile nav: `router.afterEach(() => closeNav())` (`Navbar.vue`, line 50)
- The hamburger icon uses `var(--navbar-toggler-filter)` to invert in light theme (`global.css`, line 383)

#### 3.2.2 Data Table Responsiveness

Tables are the most complex responsive challenge. CryptoDash handles this through **progressive column disclosure**:

1. **Full desktop** (`≥991px`): All 7 columns visible (Rank, Name, Price, 24h Change, Volume, Market Cap, Action)
2. **Tablet** (`768px–990px`): Volume and Market Cap columns hidden via `d-none d-lg-table-cell` (`Watchlist.vue`, lines 200–204)
3. **Mobile** (`<768px`): Table maintains `min-width: 480px` with horizontal scroll (`-webkit-overflow-scrolling: touch`), compact cell padding, and reduced icon sizes
4. **Small mobile** (`<575px`): Minimum width drops to `380px`, coin icons shrink to `22px`, button padding reduces

The table wrapper (`.table-crypto-wrap`) uses:
- `overflow-x: auto` for horizontal scrolling
- `-webkit-overflow-scrolling: touch` for momentum scrolling on iOS
- `border-radius: var(--radius-lg)` with `overflow: hidden` to clip content at rounded corners

#### 3.2.3 Hero Section Responsiveness

The hero section adapts across three tiers:
1. **Desktop**: Horizontal layout with coin image floating beside content, `min-height: 440px`
2. **Tablet** (`<768px`): Reduced padding (`4rem 0 3.5rem`), `min-height: auto`
3. **Mobile** (`<768px`): HUD stats switch from horizontal flex to vertical stack (`flex-direction: column`), dividers hidden, full-width stat cells (`HeroSection.vue`, lines 270–286)

#### 3.2.4 Form Layout Responsiveness

Auth forms (Login, Register) use Bootstrap's grid system:
- Desktop: `col-12 col-md-8 col-lg-5` — centered, constrained width
- Mobile: Full width with `12px 16px` padding, `15px` font size for inputs
- Password toggle button: Fixed `0 14px` padding with `border-radius: 0 10px 10px 0` to visually merge with input

### 3.3 Usability Features

#### 3.3.1 Real-Time Price Feedback

The live price system provides immediate visual feedback:
- **Price flash**: When a price updates, the cell background briefly changes to `rgba(16, 185, 129, 0.25)` (green) or `rgba(244, 63, 94, 0.25)` (red) via `.price-flash-up` / `.price-flash-down` classes, transitioning back over `0.6s` (`global.css`, lines 328–329)
- **Arrow indicators**: `PriceWithArrow` component shows directional arrows (`ArrowUp`/`ArrowDown` Lucide icons) with color-coded text
- **Row border indicator**: Table rows show a `3px inset box-shadow` in the color corresponding to 24h performance (`is-gainer` = green, `is-loser` = red)

#### 3.3.2 Scroll-Responsive Navbar

The navbar compresses on scroll:
- **Default**: `padding: 0.85rem 0`, transparent background
- **Scrolled** (`>20px`): `padding: 0.35rem 0`, solid `--bg-primary` background, `box-shadow: 0 4px 20px rgba(0,0,0,0.08)`, brand text shrinks from `1.25rem` to `1.15rem`, logo scales to `0.85` (`global.css`, lines 349–368)
- Implementation: Passive scroll listener with `isScrolled` boolean threshold check (`Navbar.vue`, lines 22–27)

#### 3.3.3 Form Validation UX

Login form (`Login.vue`) demonstrates a progressive validation pattern:
- **Initial state**: No validation feedback shown (computed properties return `null` when `!submitted && !value`)
- **On submit**: `submitted = true` triggers validation display; `is-valid` / `is-invalid` CSS classes provide green/red border and glow feedback
- **Email validation**: Regex pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Password validation**: Minimum length check (`password.length >= 1`)
- **Loading state**: Submit button shows spinner and "Signing in..." text; all inputs are disabled
- **Success flow**: Auto-redirect to intended page (`$route.query.redirect || "/"`) after 500ms delay with success message
- **Error flow**: Alert banner with 5-second auto-dismiss via `setTimeout`

#### 3.3.4 Empty State Handling

Empty states are handled consistently across views:
- **Watchlist** (empty): `EmptyState` component with `title="Watchlist is empty"`, `icon="Star"`, descriptive text, and a "Browse markets" CTA button
- **News search** (no results): Similar pattern with search-specific messaging
- **CoinDashboard** (no chart data): Shows `EmptyState` with `title="No chart data available"` when neither Binance nor CoinGecko data is available

#### 3.3.5 Accessible Keyboard Navigation

- `:focus-visible` global style (`global.css`, lines 183–187) provides a `2px solid var(--accent)` outline with `3px` offset on all focusable elements, ensuring keyboard users can identify the current focus position
- The navbar toggler includes `aria-controls="mainNavbar"` and `aria-expanded="false"` attributes
- `ThemeToggle` uses `role="switch"` with `aria-checked` state
- `FavoriteButton` uses dynamic `aria-label` toggling between "Add to watchlist" and "Remove from watchlist"
- `LoadingSpinner` uses `role="status"` for screen reader announcements

### 3.4 Performance Considerations

- **Font loading**: Google Fonts (Exo 2, Plus Jakarta Sans, Orbitron, JetBrains Mono) are loaded via the HTML `<link>` tag with `display=swap` to prevent invisible text during font loading
- **Image optimization**: Coin images served from CoinGecko CDN are used at `width="28" height="28"` with `object-fit: cover` and `loading="lazy"` where applicable
- **Animation budget**: CSS animations use `will-change` sparingly; the floating blob animations (`45s`, `60s`) are GPU-composited via `transform` only
- **Passive listeners**: Scroll event listeners use `{ passive: true }` to prevent scroll jank (`Navbar.vue`, line 31)

---

## 4. Key UI Components & User Flows

### 4.1 Navigation Architecture

The application defines 15 routes across 5 functional sections (`src/router/index.js`):

| Route | Component | Auth Required | Admin Only |
|-------|-----------|---------------|------------|
| `/` | `Home` | No | No |
| `/markets` | `Markets` | No | No |
| `/coin/:id` | `CoinDetail` | No | No |
| `/watchlist` | `Watchlist` | No | No |
| `/news` | `News` | No | No |
| `/news/:id` | `NewsDetail` | No | No |
| `/about` | `About` | No | No |
| `/login` | `Login` | No (guest only) | No |
| `/register` | `Register` | No (guest only) | No |
| `/set-password` | `SetPassword` | No | No |
| `/profile` | `Profile` | Yes | No |
| `/admin` | `AdminLayout` | Yes | Yes |
| `/admin/news` | `AdminNews` | Yes | Yes |
| `/admin/news/:id` | `AdminNewsEdit` | Yes | Yes |
| `/admin/users` | `AdminUsers` | Yes | Yes |

**Route guards** (`router/index.js`, lines 92–109):
- `requiresAuth` routes redirect to `/login` with `?redirect=` query parameter when no user is authenticated
- `guestOnly` routes (Login, Register) redirect to `/` when a user is already authenticated
- `requiresAdmin` routes are handled by `AdminLayout`, which renders a permission-denied screen if the user lacks admin role

### 4.2 Home Page Flow

**Entry point**: `Home.vue` — the landing page serves as the primary discovery surface.

**Component composition**:
```
Home.vue
├── HeroSection (title, subtitle, CTA buttons)
├── StatCard × 4 (Market Cap, 24h Volume, BTC Dominance, Active Coins)
├── SearchBar (filter coins by name/symbol)
├── Section: "Trending Coins"
│   └── CoinCard × N (live-updating price cards with sparkline)
├── Section: "Top Volume"
│   └── table rows with coin data
└── Section: "Latest News"
    └── news article cards
```

**Data flow**:
1. `Home.vue` calls `api.getTopCoins(50)` to fetch coin data from CoinGecko
2. `useLivePrices()` composable subscribes to Binance WebSocket for real-time price updates
3. `applyLive(coin)` merges live data onto each coin object, triggering reactive re-renders
4. `PriceWithArrow` components display the merged data with flash animations

**User interactions**:
- Click a coin card → navigates to `/coin/:id` (CoinDetail)
- Click star icon on coin → toggles watchlist (authenticated: Supabase; guest: localStorage)
- Click "Explore Markets" CTA → navigates to `/markets`
- Click news article → navigates to `/news/:id`
- Type in search → filters coin list by name/symbol match

### 4.3 Markets Page Flow

**Component**: `Markets.vue` — the full coin listing with sortable table.

**Features**:
- Paginated table with page size selector (20, 50, 100 coins per page)
- Sortable columns: Rank, Name, Price, 24h Change, Volume, Market Cap
- Client-side filtering via search input
- Live price updates with flash animations
- Favorite toggle (star icon) per row

**Table column visibility** (progressive disclosure):
```
Desktop (≥991px):  Rank | Name | Price | Change | Volume | Market Cap | Action
Tablet (768-990px): Rank | Name | Price | Change | — | — | Action
Mobile (<768px):   Horizontal scroll, all columns at minimum width
```

**Empty state**: When no coins match search, `EmptyState` with `title="No coins found"` is displayed.

### 4.4 Coin Detail Flow

**Component**: `CoinDetail.vue` — individual coin view with chart and metadata.

**Component composition**:
```
CoinDetail.vue
├── CoinHeader (name, symbol, icon, price with arrow, 24h change)
├── CoinDashboard (chart container)
│   ├── Binance candlestick chart (primary, via Lightweight Charts)
│   └── CoinGecko line chart (fallback, when Binance data unavailable)
├── CoinMeta (description, links, market data)
├── FavoriteButton
└── Related coins section
```

**Chart loading strategy** (`CoinDashboard.vue`):
1. Attempt to fetch Binance klines data (`binance.getKlines()`)
2. If Binance data available → render candlestick chart via `createChart()` + `addCandlestickSeries()`
3. If Binance data unavailable → fetch CoinGecko `market_chart` data, render line chart via `addLineSeries()`
4. 8-second AbortController timeout on Binance fetch as safety net
5. If both fail → show `EmptyState` with "No chart data available"

**Price display**: Uses `PriceWithArrow` component with `size="lg"` prop for prominent display.

### 4.5 Authentication Flow

#### 4.5.1 Registration Flow

**Entry**: `/register` → `Register.vue`

```
Register form
  → Submit → requestRegistration({ email, password, name })
  → Supabase Edge Function validates + creates user
  → Response: success/failure message
  → On success: redirect to /login with success flash
  → On failure: display error message (5s auto-dismiss)
```

**Form fields**: Email, Password, Name (first + last)
**Validation**: Email regex, password length ≥ 6, name required
**Post-registration**: User must log in (no auto-login after registration)

#### 4.5.2 Login Flow

**Entry**: `/login` → `Login.vue`

```
Login form
  → Submit → login(email, password)
  → useAuth().login() → Supabase.auth.signInWithPassword()
  → On success:
    → Update reactive `user` ref
    → Show success message
    → Redirect to ?redirect= query or "/" after 500ms
  → On failure:
    → Show error message (5s auto-dismiss)
```

**Password visibility toggle**: Eye/EyeOff icons toggle input type between `password` and `text`

#### 4.5.3 Authenticated State

Once logged in:
- Navbar shows user avatar (first letter of name/email in gold circle) with dropdown menu
- Dropdown items: Profile, Admin dashboard (if admin), Logout
- `v-permission="'auth'"` directive reveals auth-only elements
- `useAdmin()` composable checks role in Supabase `profiles` table

### 4.6 Watchlist Flow

**Entry**: `/watchlist` → `Watchlist.vue`

**Component composition**:
```
Watchlist.vue
├── PageHero (title, subtitle)
├── LoadingSpinner (while fetching)
├── EmptyState (if no favorites)
└── Data table (if favorites exist)
    ├── Live dot indicator
    ├── Coin count
    ├── "Browse markets" CTA
    └── Table rows with live prices
```

**Data flow**:
1. `useWatchlist()` returns `watchlistIds` (array of coin IDs)
2. Fetch top 50 coins from CoinGecko, filter to only watchlisted IDs
3. Subscribe to Binance WebSocket for watchlisted coins only (optimization)
4. `mergeLive(coin)` overlays real-time data onto each row

**Dual storage**:
- Authenticated: Supabase `watchlist` table (cloud-synced across devices)
- Guest: `localStorage` key `"cryptodash-watchlist"` (device-local)

### 4.7 AI Assistant Flow

**Component**: `AiAssistant.vue` — floating action button (FAB) with chat panel.

**UI structure**:
```
AiAssistant
├── FAB button (fixed bottom-right, 50px circle)
└── Chat panel (fixed position, 360px wide, 440px max-height)
    ├── Message list (user + assistant bubbles)
    └── Input area (text input + send button)
```

**Data flow**:
1. User types question and presses Enter/clicks Send
2. Panel sends POST to Supabase Edge Function (`/functions/v1/ai-chat`)
3. Edge Function calls Gemini LLM API
4. Response rendered via `marked` (Markdown parser) + `DOMPurify` (XSS sanitization)
5. Messages appended to local array (no persistence)

**Positioning**: Fixed `bottom: 1.5rem; right: 1.5rem` with `z-index: 1050`, ensuring it floats above all content including the navbar.

### 4.8 News Flow

**Entry**: `/news` → `News.vue`

**Features**:
- Article cards with title, excerpt, date, source
- Full-text search with debounced input
- Pagination with page controls
- Logged-in users can: comment on articles, like/react to articles

**NewsDetail** (`/news/:id`):
- Full article content
- Comment section (CRUD via `useComments`)
- Reaction/like buttons (via `useReactions`)
- Back navigation to news list

### 4.9 Admin Flow

**Entry**: `/admin` → `AdminLayout.vue` (wrapper with sidebar)

**Protected routes**: All admin routes require `meta: { requiresAuth: true, requiresAdmin: true }`
**Admin check**: `useAdmin()` composable queries Supabase `profiles` table for `role = 'admin'`

**AdminDashboard** (`/admin`):
- System statistics (total users, articles, comments)
- Quick actions (add news, manage users)

**AdminNews** (`/admin/news`):
- Article list with edit/delete actions
- Link to create new article

**AdminNewsEdit** (`/admin/news/:id`):
- Rich text editor (TipTap) for article content
- Title, category, featured image fields
- Save/update/delete actions

**AdminUsers** (`/admin/users`):
- User list with role management
- Promote/demote admin functionality

---

## 5. References

1. `src/assets/global.css` — CSS custom properties, responsive breakpoints, component styles (461 lines)
2. `src/components/ui/StatCard.vue` — Reusable metric display card
3. `src/components/ui/PriceWithArrow.vue` — Live price with directional indicators
4. `src/components/ui/EmptyState.vue` — Generic empty state with slot composition
5. `src/components/ui/LoadingSpinner.vue` — Accessible loading indicator
6. `src/components/ui/FavoriteButton.vue` — Watchlist toggle with ARIA labels
7. `src/components/ui/ThemeToggle.vue` — Dark/light mode switch with `role="switch"`
8. `src/components/layout/Navbar.vue` — Sticky navbar with scroll compression and mobile collapse
9. `src/components/layout/HeroSection.vue` — Layered hero with glassmorphism HUD stats
10. `src/components/layout/Footer.vue` — Semantic footer with accessible social links
11. `src/components/ai/AiAssistant.vue` — FAB-based LLM chat interface
12. `src/composables/useTheme.js` — Theme persistence and toggle logic
13. `src/composables/useAuth.js` — Authentication state and Supabase integration
14. `src/composables/useWatchlist.js` — Dual-storage watchlist management
15. `src/composables/useLivePrices.js` — Real-time price subscription composable
16. `src/composables/useComments.js` — Comment CRUD with localStorage caching
17. `src/views/general/Home.vue` — Landing page with trending coins and news
18. `src/views/coins/Markets.vue` — Full coin listing with sortable table
19. `src/views/coins/CoinDetail.vue` — Individual coin view with chart
20. `src/views/coins/Watchlist.vue` — User's saved coins with live data
21. `src/views/auth/Login.vue` — Login form with progressive validation
22. `src/views/auth/Register.vue` — Registration with Supabase Edge Function
23. `src/views/general/About.vue` — About page with interactive coin selector
24. `src/router/index.js` — Route definitions and navigation guards
25. `src/main.js` — App entry, custom directives, Bootstrap integration
26. `src/App.vue` — Root shell with page transitions
27. `src/utils/format.js` — Price/market cap/change formatters
