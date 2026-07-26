<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { X } from "@lucide/vue";

const year = new Date().getFullYear();
const showPopup = ref(null);

function openPopup(type) {
  showPopup.value = type;
}

function closePopup() {
  showPopup.value = null;
}
</script>

<template>
  <footer class="crypto-footer">
    <div class="footer-glow"></div>

    <div class="container">
      <div class="footer-grid">
        <div class="footer-col footer-brand-col">
          <RouterLink to="/" class="footer-logo">
            <img src="/site-logo.png" alt="CryptoDash" width="28" height="28" />
            <span>CryptoDash</span>
          </RouterLink>
          <p class="footer-desc">
            Real-time cryptocurrency market tracker with AI-powered insights, live charts, and community-driven news.
          </p>
          <div class="footer-social">
            <a href="#" class="social-btn" aria-label="Twitter / X">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="#" class="social-btn" aria-label="GitHub">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
            <a href="#" class="social-btn" aria-label="CoinGecko">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            </a>
          </div>
        </div>

        <div class="footer-col">
          <h6 class="footer-heading">Markets</h6>
          <ul class="footer-links">
            <li><RouterLink :to="{ name: 'Markets' }">All Coins</RouterLink></li>
            <li><RouterLink :to="{ name: 'Markets', query: { sort: 'gainers' } }">Top Gainers</RouterLink></li>
            <li><RouterLink :to="{ name: 'Markets', query: { sort: 'losers' } }">Top Losers</RouterLink></li>
          </ul>
        </div>

        <div class="footer-col">
          <h6 class="footer-heading">Resources</h6>
          <ul class="footer-links">
            <li><RouterLink :to="{ name: 'News' }">News Feed</RouterLink></li>
            <li><RouterLink :to="{ name: 'Watchlist' }">Watchlist</RouterLink></li>
            <li><RouterLink :to="{ name: 'About' }">About</RouterLink></li>
          </ul>
        </div>

        <div class="footer-col">
          <h6 class="footer-heading">Student</h6>
          <div class="student-card">
            <div class="student-rows">
              <div class="student-row"><span class="s-label">Name:</span><span class="s-value">Đỗ Đức Duy</span></div>
              <div class="student-row"><span class="s-label">ID:</span><span class="s-value">105550034</span></div>
              <div class="student-row"><span class="s-label">Uni:</span><span class="s-value">Swinburne University</span></div>
              <div class="student-row"><span class="s-label">Phone:</span><span class="s-value">0906688341</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-divider"></div>

      <div class="footer-bottom">
        <span class="footer-copy">
          &copy; {{ year }} CryptoDash &middot; COS30043 &middot; Swinburne University
        </span>
        <span class="footer-legal">
          <button class="footer-btn" @click="openPopup('privacy')">Privacy</button>
          <button class="footer-btn" @click="openPopup('terms')">Terms</button>
          <span class="footer-data">Data via CoinGecko &amp; Binance</span>
        </span>
      </div>
    </div>

    <!-- Privacy Popup -->
    <Teleport to="body">
      <div v-if="showPopup" class="popup-overlay" @click.self="closePopup">
        <div class="popup-card">
          <div class="popup-header">
            <h3 class="popup-title">{{ showPopup === 'privacy' ? 'Privacy Policy' : 'Terms of Service' }}</h3>
            <button class="popup-close" @click="closePopup"><X :size="18" /></button>
          </div>
          <div class="popup-body">
            <div v-if="showPopup === 'privacy'">
              <p>This application is developed as part of COS30043 — Interface Design &amp; Development at Swinburne University.</p>
              <p>No personal data is collected, stored, or shared with third parties beyond the authentication system provided by Supabase. User credentials (email and password) are handled exclusively through Supabase Auth and are never exposed to the application server.</p>
              <p>Cryptocurrency price data is fetched from public APIs (Binance and CoinGecko) and displayed in real-time. No financial advice is provided, and all market data is for informational purposes only.</p>
              <p>This project uses browser localStorage solely for theme preference persistence and guest watchlist storage. No cookies are used for tracking or advertising.</p>
            </div>
            <div v-else>
              <p>This application is provided for educational purposes as part of COS30043 at Swinburne University.</p>
              <p>By using this platform, you acknowledge that:</p>
              <ul>
                <li>All cryptocurrency data is provided for informational purposes only and should not be considered financial advice.</li>
                <li>The AI assistant uses a Large Language Model (Groq) and may occasionally produce inaccurate information. Always verify critical data from primary sources.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>The developers reserve the right to modify or discontinue the service at any time without prior notice.</li>
                <li>This project is not affiliated with Binance, CoinGecko, or any cryptocurrency exchange.</li>
              </ul>
            </div>
          </div>
          <div class="popup-footer">
            <button class="btn btn-accent btn-sm px-4" @click="closePopup">Close</button>
          </div>
        </div>
      </div>
    </Teleport>
  </footer>
</template>

<style scoped>
.crypto-footer {
  position: relative;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  padding-top: 3rem;
  overflow: hidden;
}

.footer-glow {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--accent) 50%, transparent 100%);
  filter: blur(4px);
  opacity: 0.6;
  pointer-events: none;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1.3fr;
  gap: 2rem;
}

/* Brand column */
.footer-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  margin-bottom: 1rem;
}

.footer-logo span {
  font-family: 'Orbitron', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-emphasis);
  letter-spacing: -0.5px;
}

.footer-desc {
  font-size: 0.85rem;
  color: var(--text-tertiary);
  line-height: 1.65;
  margin-bottom: 1.25rem;
  max-width: 320px;
}

.footer-social {
  display: flex;
  gap: 0.5rem;
}

.social-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  color: var(--text-tertiary);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.social-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-bg-subtle);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 200, 55, 0.12);
}

/* Link columns */
.footer-heading {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.footer-links a {
  color: var(--text-tertiary);
  font-size: 0.85rem;
  text-decoration: none;
  transition: all var(--transition-fast);
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.footer-links a:hover {
  color: var(--accent);
  transform: translateX(3px);
}

/* Student card */
.student-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--accent-bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0.75rem;
  transition: all var(--transition-fast);
}

.student-card:hover {
  border-color: var(--accent-bg-hover);
  box-shadow: 0 4px 20px rgba(255, 200, 55, 0.08);
}
.student-rows {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.student-row {
  display: flex;
  gap: 0.35rem;
  font-size: 0.78rem;
  line-height: 1.5;
}

.s-label {
  color: var(--text-tertiary);
  font-weight: 600;
  min-width: 46px;
  flex-shrink: 0;
}

.s-value {
  color: var(--text-emphasis);
  font-weight: 500;
}

/* Tech badges */
.tech-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tech-badge {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-tertiary);
  background: var(--accent-bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.25rem 0.6rem;
  transition: all var(--transition-fast);
}

.tech-badge:hover {
  color: var(--accent);
  border-color: var(--accent-bg-hover);
  background: var(--accent-bg);
}

/* Divider */
.footer-divider {
  height: 1px;
  background: var(--border-color);
  margin: 1.5rem 0 1rem;
}

/* Bottom bar */
.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-bottom: 1.25rem;
}

.footer-copy {
  font-size: 0.78rem;
  color: var(--text-tertiary);
}

.footer-legal {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.78rem;
}

.footer-legal a {
  color: var(--text-tertiary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.footer-legal a:hover {
  color: var(--accent);
}

.footer-data {
  color: var(--text-tertiary);
  padding-left: 1rem;
  border-left: 1px solid var(--border-color);
}

.footer-btn {
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-size: 0.78rem;
  padding: 0;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.footer-btn:hover {
  color: var(--accent);
}

/* Popup */
.popup-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: popup-fade-in 0.15s ease-out;
}

@keyframes popup-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.popup-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 18px;
  max-width: 560px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.popup-title {
  font-family: 'Orbitron', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-emphasis);
  margin: 0;
}

.popup-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.popup-close:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-bg-subtle);
}

.popup-body {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.popup-body p {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.65;
  margin-bottom: 0.85rem;
}

.popup-body ul {
  padding-left: 1.25rem;
  margin-bottom: 0;
}

.popup-body li {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 0.4rem;
}

.popup-footer {
  padding: 0.75rem 1.5rem 1.25rem;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 991.98px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .footer-brand-col {
    grid-column: 1 / -1;
  }
}

@media (max-width: 575.98px) {
  .crypto-footer {
    padding-top: 2rem;
  }

  .footer-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .footer-bottom {
    flex-direction: column;
    text-align: center;
  }

  .footer-legal {
    flex-wrap: wrap;
    justify-content: center;
  }

  .footer-data {
    border-left: none;
    padding-left: 0;
    width: 100%;
    text-align: center;
  }
}
</style>
