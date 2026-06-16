<script>
import PageHero from "../../components/PageHero.vue";

export default {
  components: { PageHero },
  data() {
    return {
      techStack: ['Vue 3', 'Vite', 'Vue Router', 'Bootstrap 5', 'JavaScript'],
      firstName: '',
      lastName: '',
      preferredCoin: 'btc',
    }
  },
  computed: {
    welcomeMessage() {
      const name = [this.firstName, this.lastName].filter(Boolean).join(' ') || 'Guest'
      const coinName = this.preferredCoin === 'btc' ? 'Bitcoin' : 'Ethereum'
      return {
        primary: `Welcome to CryptoDash`,
        secondary: `${name}, your favourite is ${coinName}`
      }
    },
    coinData() {
      return this.preferredCoin === 'btc'
        ? {
            symbol: 'BTC',
            name: 'Bitcoin',
            heroEmoji: '₿',
            color: '#f7931a',
            description: 'The original cryptocurrency. Digital gold, store of value, and the backbone of the crypto market.',
          }
        : {
            symbol: 'ETH',
            name: 'Ethereum',
            heroEmoji: 'Ξ',
            color: '#627eea',
            description: 'The world computer. Smart contracts, DeFi, NFTs, and the foundation of Web3 applications.',
          }
    },
  },
}
</script>

<template>
  <section class="page-section about-page">
    <PageHero
      title="About CryptoDash"
      subtitle="A real-time cryptocurrency dashboard tracking live prices, market caps, and news — built with Vue 3 and Bootstrap."
    />

    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-8 col-xl-7">

          <article class="card card-crypto card-glow mb-4 anim-fade-up-d1">
            <div class="card-body p-4 p-md-5">
              <h2 class="block-title">What this site does</h2>
              <p class="about-p">
                On the <RouterLink to="/" class="link-glow">Home</RouterLink> page you can see trending coins with live prices and 24h changes via Binance WebSocket.
                The <RouterLink to="/markets" class="link-glow">Markets</RouterLink> page lists coins in a sortable, searchable table with market cap data from CoinGecko.
              </p>
              <p class="about-p">
                <RouterLink to="/news" class="link-glow">News</RouterLink> loads articles from a local JSON source with full-text search and pagination.
                Logged-in users can comment and like articles.
              </p>
            </div>
          </article>

          <article class="card card-crypto card-glow mb-4 anim-fade-up-d1">
            <div class="card-body p-4 p-md-5">
              <h2 class="block-title">Why crypto dashboards?</h2>
              <p class="about-p">
                Crypto markets run 24/7. Traders and investors need instant access to prices, volume, and sentiment — all in one place.
                Market cap shows relative size; 24h % shows momentum; news explains why prices move.
              </p>
            </div>
          </article>

          <article class="card card-crypto card-glow mb-4 anim-fade-up-d2">
            <div class="card-body p-4 p-md-5">
              <h2 class="block-title">Say hello</h2>
              <p class="about-p mb-3">Enter your name and pick your favourite crypto.</p>

              <form class="row g-3 mb-4" @submit.prevent="() => {}" autocomplete="off">
                <div class="col-12 col-md-6">
                  <label for="aboutFirstName" class="form-label">First name</label>
                  <input
                    id="aboutFirstName"
                    v-model="firstName"
                    type="text"
                    class="form-control"
                    placeholder="e.g. John"
                    aria-label="First name"
                    autocomplete="off"
                  />
                </div>
                <div class="col-12 col-md-6">
                  <label for="aboutLastName" class="form-label">Last name</label>
                  <input
                    id="aboutLastName"
                    v-model="lastName"
                    type="text"
                    class="form-control"
                    placeholder="e.g. Smith"
                    aria-label="Last name"
                    autocomplete="off"
                  />
                </div>

                <div class="col-12">
                  <label class="form-label fw-semibold mb-2">Preferred coin</label>
                  <div class="coin-selector d-flex gap-3">
                    <button
                      type="button"
                      class="coin-option flex-grow-1"
                      :class="preferredCoin === 'btc' ? 'coin-active' : ''"
                      :style="{
                        '--coin-color': '#f7931a',
                        '--coin-glow': preferredCoin === 'btc' ? 'rgba(247,147,26,0.4)' : 'transparent'
                      }"
                      @click="preferredCoin = 'btc'"
                    >
                      <span class="coin-emoji anim-float">₿</span>
                      <span class="coin-name">Bitcoin</span>
                      <span class="coin-symbol">BTC</span>
                    </button>
                    <button
                      type="button"
                      class="coin-option flex-grow-1"
                      :class="preferredCoin === 'eth' ? 'coin-active' : ''"
                      :style="{
                        '--coin-color': '#627eea',
                        '--coin-glow': preferredCoin === 'eth' ? 'rgba(98,126,234,0.4)' : 'transparent'
                      }"
                      @click="preferredCoin = 'eth'"
                    >
                      <span class="coin-emoji anim-float" style="animation-delay: 0.4s">Ξ</span>
                      <span class="coin-name">Ethereum</span>
                      <span class="coin-symbol">ETH</span>
                    </button>
                  </div>
                </div>
              </form>

              <div class="welcome-block anim-pop" :style="{ borderColor: coinData.color }">
                <p class="welcome-primary mb-1">{{ welcomeMessage.primary }}</p>
                <p class="welcome-secondary" :style="{ color: coinData.color }">{{ welcomeMessage.secondary }}</p>
              </div>

              <div class="hero-emoji-block mt-4" :style="{ borderColor: coinData.color }">
                <div class="hero-emoji-circle" :style="{ background: `linear-gradient(135deg, ${coinData.color}44, transparent)` }">
                  <span class="hero-emoji" :style="{ color: coinData.color }">{{ coinData.heroEmoji }}</span>
                </div>
                <p class="hero-desc text-secondary mt-3 mb-0">{{ coinData.description }}</p>
              </div>
            </div>
          </article>

          <article class="card card-crypto card-glow anim-fade-up-d2">
            <div class="card-body p-4 p-md-5">
              <h2 class="block-title">Built with</h2>
              <ul class="stack-list list-unstyled mb-4">
                <li v-for="tech in techStack" :key="tech" class="stack-item">{{ tech }}</li>
              </ul>
              <h2 class="block-title">Pages</h2>
              <ul class="page-list">
                <li><RouterLink to="/" class="link-glow">Home</RouterLink> — landing + trending</li>
                <li><RouterLink to="/markets" class="link-glow">Markets</RouterLink> — price table</li>
                <li><RouterLink to="/news" class="link-glow">News</RouterLink> — articles</li>
                <li><RouterLink to="/login" class="link-glow">Login</RouterLink></li>
                <li><RouterLink to="/register" class="link-glow">Register</RouterLink></li>
              </ul>
            </div>
          </article>

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
  letter-spacing: 0.5px;
}

.page-title {
  font-size: clamp(2rem, 5vw, 3rem);
}

.about-intro {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text-secondary);
  max-width: 680px;
}

.block-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-emphasis);
  margin-bottom: 1rem;
}

.about-p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 1rem;
}

.card-glow {
  transition: transform 0.35s ease, box-shadow 0.35s ease;
}

.card-glow:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}

/* Swing badge */
.swing-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-radius: 40px;
  border: 2px solid var(--swing-color);
  background: color-mix(in srgb, var(--swing-color) 14%, transparent);
  animation: swingBadge 2.2s ease-in-out infinite;
}

.swing-icon {
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--swing-color);
  display: inline-block;
  animation: rotateIcon 3.5s linear infinite;
}

.swing-label {
  font-weight: 700;
  color: var(--text-emphasis);
  font-size: 0.95rem;
}

/* Coin selector */
.coin-selector {
  display: flex;
  gap: 0.75rem;
}

.coin-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 0.9rem 0.5rem;
  border-radius: 18px;
  border: 2px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.03);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.28s ease;
  position: relative;
  overflow: hidden;
}

.coin-option::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--coin-glow);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.coin-option:hover::before { opacity: 1; }

.coin-option:hover {
  border-color: var(--coin-color);
  transform: translateY(-3px);
  color: #fff;
}

.coin-active {
  border-color: var(--coin-color) !important;
  box-shadow: 0 0 24px var(--coin-glow);
  color: #fff;
}

.coin-active::before { opacity: 1; }

.coin-emoji {
  font-size: 2rem;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));
}

.coin-active .coin-emoji {
  animation: kilo-float 2s ease-in-out infinite;
}

.coin-name {
  font-weight: 700;
  font-size: 0.9rem;
  position: relative;
  z-index: 1;
}

.coin-symbol {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  position: relative;
  z-index: 1;
  opacity: 0.7;
}

/* Welcome block */
.welcome-block {
  padding: 1.5rem;
  border-radius: 18px;
  border: 2.5px solid;
  background: rgba(255,255,255,0.03);
  text-align: center;
}

.welcome-primary {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
}

.welcome-secondary {
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0;
  animation: textGlow 1.8s ease-in-out infinite alternate;
}

/* Hero emoji block */
.hero-emoji-block {
  text-align: center;
  padding: 2rem 1rem;
  border-radius: 20px;
  border: 2px solid;
  background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
}

.hero-emoji-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  border: 3px solid;
}

.hero-emoji {
  font-size: 3.5rem;
  line-height: 1;
  animation: kilo-float 3s ease-in-out infinite;
}

.hero-desc {
  font-size: 1rem;
  line-height: 1.6;
  max-width: 420px;
  margin: 0 auto;
}

/* Stack + page lists */
.stack-item {
  padding: 0.55rem 0;
  color: var(--text-primary);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  gap: 0.55rem;
  transition: padding-left 0.2s ease, color 0.2s ease;
}

.stack-item::before {
  content: '◆';
  font-size: 0.5rem;
  color: #a78bfa;
}

.stack-item:hover {
  padding-left: 0.6rem;
  color: var(--text-emphasis);
}

.page-list {
  padding-left: 0;
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 2.1;
}

.page-list li {
  border-bottom: 1px solid rgba(255,255,255,0.05);
  transition: color 0.2s ease;
}

.page-list li:hover { color: var(--text-primary); }
.page-list li:last-child { border-bottom: none; }

/* ── Keyframes ─────────────────────────────── */

@keyframes swingBadge {
  0%, 100% { transform: rotate(0deg); }
  30%      { transform: rotate(-3deg); }
  70%      { transform: rotate(3deg); }
}

@keyframes rotateIcon {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes textGlow {
  from { text-shadow: 0 0 10px rgba(247,147,26,0.35); }
  to   { text-shadow: 0 0 22px rgba(247,147,26,0.75); }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(26px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pop {
  0%   { transform: scale(0.93); opacity: 0; }
  70%  { transform: scale(1.03); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(240,185,11,0.22); }
  50%      { box-shadow: 0 0 26px 4px rgba(240,185,11,0.14); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-7px); }
}

/* responsive */
@media (max-width: 575px) {
  .coin-option { padding: 0.7rem 0.35rem; }
  .coin-emoji { font-size: 1.6rem; }
  .hero-emoji-circle { width: 90px; height: 90px; }
  .hero-emoji { font-size: 2.8rem; }
}
</style>
