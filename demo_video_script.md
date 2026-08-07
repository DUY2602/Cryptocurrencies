# CryptoDash — Demo Video Script (~15 min)

**Language:** English · **Duration:** ~15 minutes
**Format:** Each bullet below is a spoken talking point you read as if presenting to an audience / a client. Keep 2 browser tabs open while recording: the main app + Supabase Studio.

> Goal: spend the bulk of the 15 minutes on the advanced features (Live WebSocket, charts, AI RAG, admin CMS, RAG management, users, Edge Functions) and keep the overview sections brisk.

---

## 0:00 — 2:20 · Overview (intro, login, home)

**0:00 – 0:30 — "Meet CryptoDash"**
- 👉 As I open the app you see the hero home page: a clean, modern header with the logo, and navigation for every section. I'm going to sign in as the admin account first, because that unlocks the full feature set I'll show you today.
- 👉 I want you to notice right away this isn't a UI mockup sitting on static data — everything you're about to see is being fed from a live backend. So let's log in and I'll take you through it.

**0:30 – 1:40 — Home: market summary at a glance**
- 👉 Look at the top of the home page. We serve a **Market Summary** immediately: the **Top 10 trending coins** ranked by their 24‑hour percentage change, so you can tell at a glance which assets are moving today.
- 👉 Directly beside it I have the **Top 10 by trading volume** — the coins people are actively buying and selling right now, not just the famous ones.
- 👉 Below that, a **"Latest news"** strip with the two newest stories pulled in automatically — so the dashboard always feels current.
- 👉 Finally, the centerpiece of the home view is this **Geo Heat Map**. Each country is shaded by its crypto adoption score. I'm going to hover over a few countries so you can see the actual adoption score in the tooltip — USA, Singapore, parts of Europe render in a deep colour, which tells you those are the highest-adoption markets.

**1:40 – 2:20 — Theme & navigation**
- 👉 Notice the **Day/Night toggle** up in the header. I'll flip it a couple of times — every chart, table and card re-themes instantly because it's all driven by a shared design system.
- 👉 And the same navigation links you see up top live in the footer as well — so no matter where you scroll, you can always get back to Markets, News, or your Watchlist.

---

## 2:20 — 6:20 · Markets / Live Data

**2:20 – 3:20 — "This is the part I'm proudest of: live WebSocket prices"**
- 👉 Let's open the **Markets** page. This table doesn't just sit still — it's a **live** price table. I've wired it directly to the **Binance WebSocket**, subscribing to the mini-ticker stream that pushes fresh prices roughly every 500 milliseconds.
- 👉 As prices tick, watch the cells — they **flash green when the price is up** and **flash red when it's down**. That instant visual feedback is what makes the page feel alive instead of like a frozen spreadsheet.
- 👉 And that little squiggle under each row is a **24‑hour sparkline**, so you get a micro-trend for every single coin without leaving the table.
- 👉 ‹Bonus› If the WebSocket ever drops on a flaky network, my code doesn't panic — it **automatically fails over to Binance's REST API** with a backoff strategy, so the prices never stop updating. To you, the app just looks continuous.

**3:20 – 4:00 — "Persistent, per-user Watchlist"**
- 👉 The Watchlist is one of those small features that show care: **guests** get it saved in their browser via `localStorage`, so it works even before you create an account.
- 👉 But because I'm logged in as admin, my savings are written to **Supabase** and stored against my account. I'll star a few coins ... and when I open **/watchlist** you'll see my exact saved set, safe across devices and browser sessions.

**4:00 – 4:20 — "Finding coins fast"**
- 👉 Every table lets you **filter by the coin's name or its symbol** — type `BTC`, `eth`, anything, and it narrows live.
- 👉 And under "Sort" I've built an **advanced sort**: order by highest market cap, by the highest price, or by **top gainer / top loser** in the last 24 hours. One click and the whole list reorders.
- 👉 And so the page stays snappy, I paginate — **every page lists exactly 20 coins**.

---

## 4:20 — 6:20 · Coin Detail & Interactive Chart

**4:20 – 5:10 — "A professional charting experience"**
- 👉 Clicking any coin takes you to its **detail page**, and the hero here is a real candlestick chart built on **TradingView's Lightweight Charts** — the same rendering engine serious market platforms use.
- 👉 I can layer technical indicators directly on it. This orange line is the **MA — Moving Average**: it draws the average of the last N closing prices. This purple one is the **EMA — Exponential Moving Average**; it weights more recent prices more heavily, so it responds faster to just happened moves. For one sentence: *"MA is a simple average; EMA reacts faster because it cares more about recent prices."*
- 👉 Now hover anywhere on the chart — a **tooltip** pops up showing the exact **Open, High, Low, Close, and Volume** for that specific candle. That's everything you need to read the bar at that moment.

**5:10 – 5:30 — "Flexible timeframes"**
- 👉 And I can re-render the entire chart across any timeframe — from **1 second all the way up to a month**. I'll flip it between 15 min, 4 hours, and 1 day; the chart immediately fetches fresh kline data from Binance for that window.

**5:30 – 6:20 — "Sentiment + KPIs"**
- 👉 Below the chart, a **market-sentiment bar** visually sums the **Bullish vs Bearish** ratio — is the crowd expecting prices up or having doubts?
- 👉 Next to it, a row of **KPI cards** tick through the essentials: Market Cap, 24h Volume, 24h High, and 24h Low — everything you need to judge a coin's health in one glance.
- 👉 And see that little chat bubble bottom-right? That kicks off our AI assistant, which I'll show next.

---

## 6:20 — 8:20 · The AI Assistant (RAG)

**6:20 – 7:20 — "A chatbot that doesn't hallucinate"**
- 👉 I'll open the **AI assistant** and ask something simple: *"Explain Bitcoin in simple terms."* It answers fast, with **numbered source citations [1], [2] attached** to the reply — that's a big deal, because it means the bot isn't just making things up.
- 👉 Here's the engine room, and it's a proper **hybrid RAG** pipeline:
  - Your question is **embedded into a vector** using the Gemini embedding model.
  - That vector is matched against our **pgvector** database using similarity search.
  - In parallel, a **full-text keyword search** runs over the docs.
  - Both result sets are fused by **Reciprocal Rank Fusion** into one ranked list.
  - Finally **Groq's Llama 3.1** turns the retrieved context into a clear answer — and it tags the sources it used.
- 👉 If I tap one of those `[1]` source chips it jumps to the exact documentation it answered from.

**7:20 – 8:20 — "It's aware of the live market and your identity"**
- 👉 Ask it *"summarise today's market,"* and it answers using **live prices** injected into its context — so the number it quotes for BTC, ETH is the current market, not a stale cached answer.
- 👉 And notice this: because it knows I'm classified as an **admin**, it can surface **admin-only guidance** that a normal visitor wouldn't see. It's role-aware.

---

## 8:30 — 9:40 · Watchlist & News

**8:30 – 8:50 — Watchlist recap**
- 👉 Quick stop at the **Watchlist** page to see our saved coins from earlier — proving the Supabase persistence works end to end.

**8:50 – 9:40 — The News engine**
- 👉 Simple and important reason the news page is live: it's populated right from the **CoinDesk RSS feed**, so the piping works.
- 👉 A free-tier API wouldn't give us full article bodies — so our **`fetch-news` Edge Function** sends each short item to an **LLM (Groq/Gemini)** to expand it into a complete, readable article. Every story here has full content, not just a blurb.
- 👉 Readers can **sort by title, category, or published time** to find what matters to them.
- 👉 The **social layer only appears for logged-in users**: authenticated users can **like/dislike** and leave **comments**; each article carries a **link back to the original source**.
- 👉 And I paginate the feed so each page fits **9 articles**.

---

## 9:40 — 10:10 · About

- 👉 The **About** page opens with three punchy intro cards: **Core Purpose**, **Live Streaming Data**, and **Market Intelligence** — a story of what this product does, how it stays live, and the smarts it adds.
- 👉 Then the **Technical Matrix**: a visual board of the key technologies powering the app — Vue/Vite for the front end, Supabase for the backend, TradingView charts, TipTap editing, pgvector for search, Binance for data, and Groq + Gemini for the AI. Each one is paired with a one-line note about how it contributes to the app.

---

## 10:10 — 14:10 · Admin Panel

**10:10 — 11:00 — The control room**
- 👉 Now if you happened to have the admin role, the admin area opens up. First, the **dashboard**:
  - a row of **KPI cards** at the top (and I seeded 300 test users so the numbers look real),
  - a **line chart** showing **total accounts created over time**,
  - and a **bar chart** showing **how many accounts are created per day** — I seeded bursty signups so you actually see peaks and dips,
  - plus a **news categories summary** and a **"recent articles"** list.

**11:00 — 12:40 — News CMS with TipTap**
- 👉 **`/admin/news`** is a full editorial workstation. I can create news, **fetch articles from CoinDesk**, search, filter, and delete.
- 👉 The editor itself is the star — built with **TipTap**, it lets you style and customize **everything** in a story: bold, italics, headings, bullet and numbered lists, quotes, links, and inline images you can even drag-and-drop in.
- 👉 Along the side there's a **metadata panel** — category, tags, a featured/trending switch, and a read-time slider — and the footer shows a **live word count** plus a **live preview pane** rendering the sanitized HTML as you type.
- 👉 It's edit what-you-see-you-get editing, exactly how a real editorial team would want it.

**12:40 – 13:30 · RAG Knowledge Management**
- 👉 The **RAG admin** page is where the assistant's brain lives. I'll **add a context document**, then hit **Sync** — and here's a very clean automation: that triggers the **`sync-guides` Edge Function**, which generates the **Gemini embedding** and upserts the document into our **pgvector** `documents` table.
- 👉 Everything I add here is immediately available to the chatbot pipeline I demonstrated earlier — so the assistant learns as I build the knowledge base.
- 👉 I can search documents, edit them, or delete them on the spot, and the list paginates at **10 documents a page**.

**13:30 — 14:10 · Users Management**
- 👉 The last admin tool is **user management**. As admin I can **add brand new users**, **search by name**, **re-assign roles (guest → user / admin)**, or delete an account.
- 👉 Like the other lists it paginates — **10 users per page**. And it bookends the whole story: the user roles you manage right here are exactly what gate the feature access I've been showing you.

---

## 14:10 — 15:00 · Supabase backend & wrap-up

**14:10 – 14:50 — "Look under the hood"**
- 👉 Let's flip to Supabase and drop all the abstraction. Here's the **schema**: `profiles`, `watchlist`, `news`, `documents`, `news_likes`, and `comments` — a PostgreSQL database with embedded **pgvector** for the RAG embeddings.
- 👉 Note the **Row-Level Security**: RLS rules act at database level so a user can never reach another user's rows, even if someone poked at the API.
- 👉 And the **Edge Functions** that tie it together:
  - `chat` — the RAG + LLM assistant backend I demoed,
  - `fetch-news` — the scheduled CoinDesk ingestion,
  - `sync-guides` — the document indexing in RAG management.
- Each one fires live in this demo — this is not slides, this is shipped code.

**14:50 – 15:00 — "Pulling it together"**
- Let's pull it together. The complete product ships as a full-stack system:
  - a **Vue 3** front end for a reactive UI,
  - a **Supabase** backend (auth, database, real-time, edge functions) with **security**,
  - **Binance WebSocket** raw real-time market data,
  - and a **hybrid RAG AI assistant** that answers with real, cited, live-aware content.
- 👉 That's CryptoDash — thank you for watching!

---

## Timeline summary

| Time | Section | Focus |
|------|---------|-------|
| 0:00–2:20 | Intro, login, Home, Heat map, theme | Context |
| 2:20–6:20 | Markets — live WebSocket, watchlist, sort/filter, chart/detail | **Advanced** |
| 6:20–8:20 | AI Chatbot (RAG) + live answers | **Advanced** |
| 8:30–9:40 | Watchlist + News (CoinDesk/LLM) | Advanced |
| 9:40–10:10 | About — technical matrix | Context |
| 10:10–14:10 | Admin Dashboard, TipTap CMS, RAG admin, Users | **Advanced** |
| 14:10–15:00 | Supabase schema + Edge Functions + wrap-up | **Advanced** |

## Recording notes
- Have `npm run dev` running and deploy the three edge functions (chat, fetch-news, sync-guides).
- Admin demo account: **user1@test.com** / `Test1234!`.
- Talk in natural, first-person presentational tone — you're explaining, not reciting.
- Press on the words "**live**", "**real-time**", and the tech names so the interviewer hears them.
- Keep two browser tabs open (app + Supabase) for the final "under the hood" moment.