<script>
import PageHero from "../../components/layout/PageHero.vue"
import { Compass, Radio, TrendingUp } from '@lucide/vue'

const iconFiles = import.meta.glob('../../assets/tech-icons/*.{png,jpg,jpeg,svg,gif}', { eager: true, query: '?url', import: 'default' })

export default {
  components: { PageHero, Compass, Radio, TrendingUp },
  data() {
    return {
      firstName: '',
      lastName: '',
      preferredCoin: 'btc',
      errors: { firstName: '', lastName: '' },
      submitted: false,
      icons: {},
      techCategories: [
        {
          label: 'Framework',
          items: [
            { name: 'Vue 3', color: '#4fc08d', icon: 'vue-3' },
            { name: 'Vite', color: '#646cff', icon: 'vite' },
            { name: 'Pinia', color: '#ffd859', icon: 'pinia' },
          ],
        },
        {
          label: 'UI & Styling',
          items: [
            { name: 'Bootstrap 5', color: '#7952b3', icon: 'bootstrap' },
            { name: 'CSS3', color: '#1572b6', icon: 'css3' },
            { name: 'TipTap', color: '#ffffff', icon: 'tiptap' },
          ],
        },
        {
          label: 'Data & API',
          items: [
            { name: 'CoinGecko', color: '#8dc63f', icon: 'coingecko' },
            { name: 'CoinDesk', color: '#f8bf1e', icon: 'coindesk' },
            { name: 'Binance', color: '#f0b90b', icon: 'binance' },
          ],
        },
        {
          label: 'AI & ML',
          items: [
            { name: 'Gemini', color: '#4285f4', icon: 'gemini' },
            { name: 'Groq', color: '#f97316', icon: 'groq' },
            { name: 'RAG', color: '#a855f7', icon: 'rag' },
          ],
        },
        {
          label: 'Tooling',
          items: [
            { name: 'Vercel', color: '#ffffff', icon: 'vercel' },
            { name: 'Lightweight Charts', color: '#000000', icon: 'lightweight-charts' },
            { name: 'WebSocket', color: '#3c790a', icon: 'websocket' },
          ],
        },
        {
          label: 'Supabase',
          items: [
            { name: 'Supabase', color: '#3ecf8e', icon: 'supabase' },
            { name: 'Edge Function', color: '#3ecf8e', icon: 'edge-function' },
            { name: 'Authentication', color: '#3ecf8e', icon: 'authentication' },
          ],
        },
      ],
      features: [
        {
          icon: Compass,
          title: 'Core Purpose',
          desc: 'Track every move in crypto â€” live prices, market caps, and 24h changes â€” all in one real-time dashboard built with modern web technologies.',
          highlights: ['Live WebSocket streaming from Binance', '100+ coins tracked simultaneously', 'Dark/light theme with premium UI'],
        },
        {
          icon: Radio,
          title: 'Live Streams',
          desc: 'Real-time price updates via Binance WebSocket with automatic failover to REST polling. Green/red flash animations show price direction at a glance.',
          highlights: ['~1s latency from exchange to screen', 'Auto-reconnect with exponential backoff', 'Sparkline mini-charts for every coin'],
        },
        {
          icon: TrendingUp,
          title: 'Market Intelligence',
          desc: 'CoinGecko-powered market data merged with live prices. Interactive charts with MA/EMA indicators, sortable tables, and personalised watchlists.',
          highlights: ['OHLCV candlestick charts', 'Top gainers & losers sorting', 'Global crypto adoption map'],
        },
      ],
    }
  },
  methods: {
    iconUrl(name) {
      if (!name || name.startsWith('inline:') || name.startsWith('data:') || name.startsWith('http')) return name
      const key = Object.keys(iconFiles).find(k => k.includes(name))
      return key ? iconFiles[key] : null
    },
    validateName(value) {
      const trimmed = value.trim()
      if (!trimmed) return 'This field is required.'
      if (/\d/.test(trimmed)) return 'Numbers are not allowed.'
      if (/[^a-zA-ZÀ-ỹ\s'-]/.test(trimmed)) return 'Only letters are allowed.'
      return ''
    },
    validateForm() {
      this.submitted = true
      this.errors.firstName = this.validateName(this.firstName)
      this.errors.lastName = this.validateName(this.lastName)
      return !this.errors.firstName && !this.errors.lastName
    },
    clearError(field) {
      if (this.submitted) this.errors[field] = this.validateName(this[field])
    }
  },
  computed: {
    welcomeMessage() {
      const name = [this.firstName, this.lastName].filter(Boolean).join(' ') || 'Guest'
      const coinName = this.preferredCoin === 'btc' ? 'Bitcoin' : 'Ethereum'
      return {
        primary: `Welcome to CryptoDash`,
        secondary: `${name}, your favourite is ${coinName}`,
      }
    },
    coinData() {
      return this.preferredCoin === 'btc'
        ? {
            symbol: 'BTC',
            name: 'Bitcoin',
            heroEmoji: '\u20BF',
            color: '#f7931a',
            image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&h=400&fit=crop',
            description: 'The original cryptocurrency. Digital gold, store of value, and the backbone of the crypto market.',
          }
        : {
            symbol: 'ETH',
            name: 'Ethereum',
            heroEmoji: '\u039E',
            color: '#627eea',
            image: 'https://images.unsplash.com/photo-1622630998477-20aa696fab60?w=600&h=400&fit=crop',
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
      subtitle="A real-time cryptocurrency dashboard tracking live prices, market caps, and news â€” built with Vue 3 and Bootstrap."
    />

    <div class="container pt-4 pb-5">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-10 col-xl-9">

          <!-- Feature Cards -->
          <div class="row g-4 mb-5">
            <div
              v-for="(f, i) in features"
              :key="i"
              class="col-12 col-md-6 col-lg-4"
            >
              <article class="card card-crypto card-feature h-100 anim-fade-up" :style="{ animationDelay: `${i * 0.1}s` }">
                <div class="card-body p-4">
                  <div class="feature-icon-wrap mb-3">
                    <component :is="f.icon" :size="24" class="feature-icon" />
                  </div>
                  <h3 class="feature-title">{{ f.title }}</h3>
                  <p class="feature-desc">{{ f.desc }}</p>
                  <ul class="feature-list list-unstyled mb-0">
                    <li v-for="(h, j) in f.highlights" :key="j" class="feature-item">
                      <span class="feature-dot"></span>
                      {{ h }}
                    </li>
                  </ul>
                </div>
              </article>
            </div>
          </div>

          <!-- Technical Matrix -->
          <article class="card card-crypto card-glow mb-5 anim-fade-up">
            <div class="card-body p-4 p-md-5">
              <h2 class="block-title mb-4">Technical Matrix</h2>
              <div class="tech-grid">
                <div v-for="(cat, i) in techCategories" :key="i" class="tech-category">
                  <span class="tech-category-label">{{ cat.label }}</span>
                  <div class="tech-badges">
                    <span
                      v-for="(t, j) in cat.items"
                      :key="j"
                      class="tech-badge"
                      :class="t.badgeClass"
                      :style="{ '--badge-color': t.color }"
                      :title="t.name"
                    >
                      <img v-if="t.icon && !t.icon.startsWith('inline:')" :src="iconUrl(t.icon)" :alt="t.name" class="tech-icon" :class="t.imgClass" />
                      <svg v-else-if="t.icon && t.icon.startsWith('inline:')" class="tech-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path :d="icons[t.icon.slice(7)]" />
                      </svg>
                      <span v-else class="tech-icon-fallback">{{ t.name.charAt(0) }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <!-- Say hello -->
          <article class="card card-crypto card-glow anim-fade-up">
            <div class="card-body p-4 p-md-5">
              <h2 class="block-title">Say hello</h2>
              <p class="about-p mb-3">Enter your name and pick your favourite crypto.</p>

              <form class="row g-3 mb-4" @submit.prevent="validateForm" autocomplete="off" novalidate>
                <div class="col-12 col-md-6">
                  <label for="aboutFirstName" class="form-label">First name</label>
                  <input
                    id="aboutFirstName"
                    v-model="firstName"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': errors.firstName }"
                    placeholder="e.g. John"
                    aria-label="First name"
                    aria-describedby="aboutFirstNameError"
                    autocomplete="off"
                    @input="clearError('firstName')"
                  />
                  <div v-if="errors.firstName" id="aboutFirstNameError" class="invalid-feedback d-block">
                    {{ errors.firstName }}
                  </div>
                </div>
                <div class="col-12 col-md-6">
                  <label for="aboutLastName" class="form-label">Last name</label>
                  <input
                    id="aboutLastName"
                    v-model="lastName"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': errors.lastName }"
                    placeholder="e.g. Smith"
                    aria-label="Last name"
                    aria-describedby="aboutLastNameError"
                    autocomplete="off"
                    @input="clearError('lastName')"
                  />
                  <div v-if="errors.lastName" id="aboutLastNameError" class="invalid-feedback d-block">
                    {{ errors.lastName }}
                  </div>
                </div>

                <div class="col-12">
                  <div class="d-flex align-items-center gap-3">
                    <button type="submit" class="btn btn-accent px-4">Say hello</button>
                    <span v-if="submitted && !errors.firstName && !errors.lastName" class="text-success small">
                      Looks good — welcome!
                    </span>
                  </div>
                </div>

                <div class="col-12">
                  <fieldset>
                    <legend class="form-label fw-semibold mb-2 p-0">Preferred coin</legend>
                    <div class="coin-selector d-flex gap-3">
                      <label
                        class="coin-option flex-grow-1"
                        :class="preferredCoin === 'btc' ? 'coin-active' : ''"
                        :style="{
                          '--coin-color': '#f7931a',
                          '--coin-glow': preferredCoin === 'btc' ? 'rgba(247,147,26,0.4)' : 'transparent'
                        }"
                      >
                        <input type="radio" id="coinBtc" v-model="preferredCoin" value="btc" class="visually-hidden" />
                        <span class="coin-emoji anim-float">₿</span>
                        <span class="coin-name">Bitcoin</span>
                        <span class="coin-symbol">BTC</span>
                      </label>
                      <label
                        class="coin-option flex-grow-1"
                        :class="preferredCoin === 'eth' ? 'coin-active' : ''"
                        :style="{
                          '--coin-color': '#627eea',
                          '--coin-glow': preferredCoin === 'eth' ? 'rgba(98,126,234,0.4)' : 'transparent'
                        }"
                      >
                        <input type="radio" id="coinEth" v-model="preferredCoin" value="eth" class="visually-hidden" />
                        <span class="coin-emoji anim-float" style="animation-delay: 0.4s">Ξ</span>
                        <span class="coin-name">Ethereum</span>
                        <span class="coin-symbol">ETH</span>
                      </label>
                    </div>
                  </fieldset>
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

        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.about-page { padding-top: 0; }

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

/* â”€â”€ Feature Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.card-feature {
  border-top: 2px solid var(--accent) !important;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card-feature:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}

.feature-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--accent) 0%, #764ba2 100%);
  color: var(--accent-text);
}

.feature-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-emphasis);
  margin-bottom: 0.6rem;
}

.feature-desc {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.feature-item {
  font-size: 0.82rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.feature-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

/* â”€â”€ Technical Matrix â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.tech-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.tech-category {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tech-category-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  opacity: 0.6;
}

.tech-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.tech-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  color: var(--badge-color);
  background: color-mix(in srgb, var(--badge-color) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--badge-color) 28%, transparent);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: default;
}

.tech-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--badge-color) 25%, transparent);
}

.tech-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: block;
}

.tech-icon-fallback {
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
}



/* â”€â”€ Coin selector â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
  border: 2px solid var(--border-light);
  background: var(--bg-card);
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
  color: var(--text-emphasis);
}

.coin-active {
  border-color: var(--coin-color) !important;
  box-shadow: 0 0 24px var(--coin-glow);
  color: var(--text-emphasis);
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

/* â”€â”€ Welcome block â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€ Hero emoji block â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€ Keyframes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

@keyframes kilo-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-7px); }
}

/* â”€â”€ Utility â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.anim-fade-up {
  animation: fadeUp 0.5s ease both;
}

.anim-pop {
  animation: pop 0.4s ease both;
}

/* responsive */
@media (max-width: 575px) {
  .coin-option { padding: 0.7rem 0.35rem; }
  .coin-emoji { font-size: 1.6rem; }
  .hero-emoji-circle { width: 90px; height: 90px; }
  .hero-emoji { font-size: 2.8rem; }
  .tech-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
}
</style>
