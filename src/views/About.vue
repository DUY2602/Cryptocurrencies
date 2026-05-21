<script>
export default {
  data() {
    return {
      techStack: ['Vue 3', 'Vite', 'Vue Router', 'Bootstrap 5', 'JavaScript'],
    }
  },
}
</script>

<template>
  <section class="page-section about-page">
    <div class="container">
      <header class="mb-4">
        <p class="unit-line mb-2">COS30043 — Swinburne University</p>
        <h1 class="page-title">About</h1>
        <p class="about-intro">
          CryptoDash is a website for checking cryptocurrency prices and reading crypto news.
          It was made for a web development assignment. The layout is based on sites like
          Binance and CoinMarketCap — dark background, price tables, and simple cards.
        </p>
      </header>

      <div class="row g-4">
        <div class="col-lg-8">
          <article class="card card-crypto">
            <div class="card-body p-4">
              <h2 class="block-title">What this site does</h2>
              <p class="about-p">
                On the <RouterLink to="/">Home</RouterLink> page you can see a few trending coins
                with the current price and 24-hour change. The
                <RouterLink to="/markets">Markets</RouterLink> page lists more coins in a table —
                name, symbol, price, market cap, and whether the price went up or down today.
                You can search and flip through pages because the full list is longer than one screen.
              </p>
              <p class="about-p">
                The <RouterLink to="/news">News</RouterLink> page loads articles from a JSON file
                on the server (no live news API yet). Each post has a date, title, body text, and
                category such as Bitcoin, Ethereum, or Regulation.
              </p>
              <p class="about-p mb-0">
                Login and Register are only front-end forms for now — nothing is sent to a server.
                Coin images and numbers are fake local data until a real API is hooked up later.
              </p>
            </div>
          </article>

          <article class="card card-crypto mt-4">
            <div class="card-body p-4">
              <h2 class="block-title">Why crypto dashboards?</h2>
              <p class="about-p">
                Bitcoin and other coins trade 24 hours a day. Exchanges publish prices every few
                seconds. Most people do not need every tick — they want a quick table: what is BTC
                at right now, how much did ETH move this week, which altcoins are up.
              </p>
              <p class="about-p mb-0">
                A dashboard puts that in one place instead of opening five different tabs.
                Market cap tells you how big a coin is relative to others; the 24h % column shows
                short-term momentum. News sits beside prices because headlines often move the market
                the same day.
              </p>
            </div>
          </article>
        </div>

        <div class="col-lg-4">
          <aside class="card card-crypto">
            <div class="card-body p-4">
              <h2 class="block-title">Built with</h2>
              <ul class="stack-list list-unstyled mb-4">
                <li v-for="tech in techStack" :key="tech">{{ tech }}</li>
              </ul>

              <h2 class="block-title">Pages</h2>
              <ul class="page-list">
                <li><RouterLink to="/">Home</RouterLink> — landing + trending coins</li>
                <li><RouterLink to="/markets">Markets</RouterLink> — price table</li>
                <li><RouterLink to="/news">News</RouterLink> — articles from JSON</li>
                <li><RouterLink to="/login">Login</RouterLink> — form UI only</li>
                <li><RouterLink to="/register">Register</RouterLink> — form UI only</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.unit-line {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

.about-intro {
  font-size: 1.05rem;
  line-height: 1.6;
  color: var(--text-secondary);
  max-width: 640px;
  margin-bottom: 0;
}

.block-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-emphasis);
  margin-bottom: 0.75rem;
}

.about-p {
  color: var(--text-secondary);
  line-height: 1.65;
  margin-bottom: 1rem;
}

.stack-list li {
  padding: 0.35rem 0;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.stack-list li:last-child {
  border-bottom: none;
}

.page-list {
  padding-left: 1.1rem;
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.7;
}

.page-list li {
  margin-bottom: 0.35rem;
}
</style>
