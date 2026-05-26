<script>
export default {
  data() {
    return {
      techStack: ["Vue 3", "Vite", "Vue Router", "Bootstrap 5", "JavaScript"],
      firstName: "",
      lastName: "",
      selectedCrypto: "bitcoin",
      cryptoOptions: {
        bitcoin: {
          name: "Bitcoin",
          color: "#F7931A",
          image:
            "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&h=500&fit=crop",
          description: "Digital gold, store of value",
        },
        ethereum: {
          name: "Ethereum",
          color: "#627EEA",
          image:
            "https://images.unsplash.com/photo-1622630998477-20aa696fab60?w=800&h=500&fit=crop",
          description: "Smart contracts, DeFi ecosystem",
        },
      },
    };
  },
  computed: {
    welcomeMessage() {
      if (this.firstName || this.lastName) {
        return (
          `Hello, ${this.firstName} ${this.lastName}`.trim() +
          "! Welcome to CryptoDash."
        );
      }
      return "";
    },
    selectedOption() {
      return this.cryptoOptions[this.selectedCrypto];
    },
  },
};
</script>

<template>
  <section class="page-section about-page">
    <div class="container">
      <header class="mb-5">
        <p class="unit-line mb-2">COS30043 — Swinburne University</p>
        <h1 class="page-title">About</h1>
        <p class="about-intro">
          CryptoDash is a website for checking cryptocurrency prices and reading
          crypto news. It was made for a web development assignment. The layout
          is based on sites like Binance and CoinMarketCap — dark background,
          price tables, and simple cards.
        </p>
      </header>

      <div class="row g-4">
        <div class="col-lg-8">
          <article class="card card-crypto mb-4 interactive-card">
            <div class="card-body p-5">
              <h2 class="block-title">Get to know us</h2>

              <div
                v-if="welcomeMessage"
                class="alert alert-theme mb-4 welcome-alert"
                role="alert"
              >
                <span class="emoji">👋</span>
                {{ welcomeMessage }}
              </div>

              <div class="row g-3 mb-5">
                <div class="col-12 col-md-6">
                  <label for="firstName" class="form-label">First name</label>
                  <input
                    type="text"
                    id="firstName"
                    class="form-control modern-input"
                    v-model="firstName"
                    placeholder="Enter your first name"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <label for="lastName" class="form-label">Last name</label>
                  <input
                    type="text"
                    id="lastName"
                    class="form-control modern-input"
                    v-model="lastName"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div class="mb-5">
                <label class="form-label d-block mb-3 crypto-preference-label"
                  >What would you prefer?</label
                >
                <div class="crypto-selector">
                  <div
                    v-for="(option, key) in cryptoOptions"
                    :key="key"
                    class="crypto-option"
                    :class="{ selected: selectedCrypto === key }"
                    @click="selectedCrypto = key"
                  >
                    <div class="crypto-radio">
                      <div
                        class="radio-inner"
                        :class="{ active: selectedCrypto === key }"
                      ></div>
                    </div>
                    <div class="crypto-info">
                      <div class="crypto-name">{{ option.name }}</div>
                      <div class="crypto-desc">{{ option.description }}</div>
                    </div>
                    <div
                      class="crypto-color"
                      :style="{ backgroundColor: option.color }"
                    ></div>
                  </div>
                </div>
              </div>

              <div class="crypto-image-container">
                <div
                  class="glow"
                  :style="{
                    background: `radial-gradient(circle, ${selectedOption.color}33 0%, transparent 70%)`,
                  }"
                ></div>
                <img
                  :src="selectedOption.image"
                  :alt="selectedOption.name"
                  class="img-fluid crypto-image"
                />
              </div>
            </div>
          </article>

          <article class="card card-crypto">
            <div class="card-body p-4">
              <h2 class="block-title">What this site does</h2>
              <p class="about-p">
                On the <RouterLink to="/">Home</RouterLink> page you can see a
                few trending coins with the current price and 24-hour change.
                The <RouterLink to="/markets">Markets</RouterLink> page lists
                more coins in a table — name, symbol, price, market cap, and
                whether the price went up or down today. You can search and flip
                through pages because the full list is longer than one screen.
              </p>
              <p class="about-p">
                The <RouterLink to="/news">News</RouterLink> page loads articles
                from a JSON file on the server (no live news API yet). Each post
                has a date, title, body text, and category such as Bitcoin,
                Ethereum, or Regulation.
              </p>
              <p class="about-p mb-0">
                Login and Register are only front-end forms for now — nothing is
                sent to a server. Coin images and numbers are fake local data
                until a real API is hooked up later.
              </p>
            </div>
          </article>

          <article class="card card-crypto mt-4">
            <div class="card-body p-4">
              <h2 class="block-title">Why crypto dashboards?</h2>
              <p class="about-p">
                Bitcoin and other coins trade 24 hours a day. Exchanges publish
                prices every few seconds. Most people do not need every tick —
                they want a quick table: what is BTC at right now, how much did
                ETH move this week, which altcoins are up.
              </p>
              <p class="about-p mb-0">
                A dashboard puts that in one place instead of opening five
                different tabs. Market cap tells you how big a coin is relative
                to others; the 24h % column shows short-term momentum. News sits
                beside prices because headlines often move the market the same
                day.
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
                <li>
                  <RouterLink to="/">Home</RouterLink> — landing + trending
                  coins
                </li>
                <li>
                  <RouterLink to="/markets">Markets</RouterLink> — price table
                </li>
                <li>
                  <RouterLink to="/news">News</RouterLink> — articles from JSON
                </li>
                <li>
                  <RouterLink to="/login">Login</RouterLink> — form UI only
                </li>
                <li>
                  <RouterLink to="/register">Register</RouterLink> — form UI
                  only
                </li>
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
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-emphasis);
  margin-bottom: 1rem;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.about-p {
  color: var(--text-secondary);
  line-height: 1.75;
  margin-bottom: 1.25rem;
}

.stack-list li {
  padding: 0.5rem 0;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.stack-list li:hover {
  padding-left: 0.5rem;
  color: #667eea;
}

.stack-list li:last-child {
  border-bottom: none;
}

.page-list {
  padding-left: 1.1rem;
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.8;
}

.page-list li {
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.page-list li:hover {
  color: #667eea;
}

.interactive-card {
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(118, 75, 162, 0.1) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.interactive-card:hover {
  transform: translateY(-8px);
  border-color: rgba(102, 126, 234, 0.4);
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.2);
}

.welcome-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.2) 0%,
    rgba(118, 75, 162, 0.2) 100%
  );
  border: 1px solid rgba(102, 126, 234, 0.3);
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome-alert .emoji {
  font-size: 1.5rem;
  animation: wave 1s ease-in-out infinite;
}

@keyframes wave {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(20deg);
  }
  75% {
    transform: rotate(-20deg);
  }
}

.modern-input {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 14px 18px;
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.3s ease;
}

.modern-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
  background: rgba(255, 255, 255, 0.08);
}

.modern-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.crypto-preference-label {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-emphasis);
}

.crypto-selector {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.crypto-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.crypto-option::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.05),
    transparent
  );
  transition: left 0.5s;
}

.crypto-option:hover::before {
  left: 100%;
}

.crypto-option:hover {
  transform: translateX(8px);
  border-color: rgba(102, 126, 234, 0.4);
  background: rgba(102, 126, 234, 0.08);
}

.crypto-option.selected {
  transform: translateX(8px);
  border-color: #667eea;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.15) 0%,
    rgba(118, 75, 162, 0.15) 100%
  );
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);
}

.crypto-radio {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.crypto-option.selected .crypto-radio {
  border-color: #667eea;
}

.radio-inner {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: transparent;
  transition: all 0.3s ease;
}

.radio-inner.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transform: scale(1);
  animation: pulse 0.4s ease-out;
}

@keyframes pulse {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

.crypto-info {
  flex: 1;
}

.crypto-name {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.crypto-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.crypto-color {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  flex-shrink: 0;
  box-shadow: 0 4px 16px currentColor;
  opacity: 0.8;
}

.crypto-image-container {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
}

.crypto-image-container .glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 150%;
  height: 150%;
  pointer-events: none;
  z-index: 1;
  animation: glowPulse 3s ease-in-out infinite;
}

@keyframes glowPulse {
  0%,
  100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

.crypto-image {
  position: relative;
  z-index: 2;
  border-radius: 20px;
  width: 100%;
  object-fit: cover;
  transition: all 0.5s ease;
}

.crypto-image:hover {
  transform: scale(1.02);
}
</style>
