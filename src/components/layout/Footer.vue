<script>
export default {
  computed: {
    currentYear() {
      return new Date().getFullYear()
    },
  },
}
</script>

<template>
  <footer class="crypto-footer mt-auto">
    <div class="container py-3">
      <div class="row g-3">
        <div class="col-12 col-md-4">
          <div class="d-flex align-items-center gap-2 mb-2">
            <img src="/site-logo.png" alt="" width="26" height="26" class="flex-shrink-0" />
            <span class="footer-brand">CryptoDash</span>
          </div>
          <p class="text-secondary small mb-3" style="max-width: 280px">
            Real-time cryptocurrency market data, news, and portfolio tracking.
          </p>
          <div class="d-flex gap-2">
            <a href="#" class="social-link" aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" class="social-link" aria-label="GitHub">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
        <div class="col-6 col-md-2">
          <h6 class="footer-heading">Markets</h6>
          <ul class="footer-links">
            <li><RouterLink :to="{ name: 'Markets' }">All coins</RouterLink></li>
            <li><RouterLink :to="{ name: 'Markets' }">Gainers</RouterLink></li>
            <li><RouterLink :to="{ name: 'Markets' }">Losers</RouterLink></li>
          </ul>
        </div>
        <div class="col-6 col-md-2">
          <h6 class="footer-heading">News</h6>
          <ul class="footer-links">
            <li><RouterLink :to="{ name: 'News' }">Latest</RouterLink></li>
            <li><RouterLink :to="{ name: 'News' }">Featured</RouterLink></li>
          </ul>
        </div>
        <div class="col-6 col-md-2">
          <h6 class="footer-heading">Account</h6>
          <ul class="footer-links">
            <li><RouterLink :to="{ name: 'Profile' }">Profile</RouterLink></li>
            <li><RouterLink :to="{ name: 'Watchlist' }">Watchlist</RouterLink></li>
          </ul>
        </div>
        <div class="col-6 col-md-2">
          <h6 class="footer-heading">Support</h6>
          <ul class="footer-links">
            <li><RouterLink :to="{ name: 'About' }">About</RouterLink></li>
          </ul>
        </div>
      </div>
      <hr class="my-2" style="border-color: var(--border-color)" />
      <div class="row align-items-center gy-2">
        <div class="col-md-6 text-center text-md-start">
          <small class="text-secondary">&copy; {{ currentYear }} CryptoDash. COS30043 &middot; Swinburne University</small>
        </div>
        <div class="col-md-6 text-center text-md-end">
          <small class="text-secondary">Data powered by CoinGecko &amp; Binance</small>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.crypto-footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}
.footer-brand {
  font-family: 'Orbitron', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-emphasis);
  letter-spacing: -0.3px;
}
.footer-heading {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
  margin-bottom: 10px;
}
.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}
.footer-links li {
  margin-bottom: 6px;
}
.footer-links a {
  color: var(--text-tertiary);
  font-size: 14px;
  transition: color 0.2s ease;
  text-decoration: none;
}
.footer-links a:hover {
  color: var(--accent);
}
.social-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  transition: all 0.2s ease;
  text-decoration: none;
}
.social-link:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-bg-subtle);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 200, 55, 0.15);
}
</style>
