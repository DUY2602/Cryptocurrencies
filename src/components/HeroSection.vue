<script setup>
import { RouterLink } from "vue-router";

defineProps({
  title: {
    type: String,
    default: "Track Crypto Markets in Real Time",
  },
  subtitle: {
    type: String,
    default:
      "View live prices, market caps, and trends for Bitcoin, Ethereum, and 50+ altcoins. Stay updated with the latest crypto news.",
  },
  ctaText: { type: String, default: "Explore Markets" },
  ctaLink: { type: String, default: "/markets" },
});
</script>

<template>
  <section class="hero-section" :style="{ backgroundImage: `url(/hero.jpg)` }">
    <div class="hero-overlay"></div>
    <div class="container">
      <div class="hero-content text-center">
        <h1 class="hero-title">{{ title }}</h1>
        <p class="hero-subtitle">{{ subtitle }}</p>
        <div class="hero-stats d-flex justify-content-center gap-2 gap-md-3 mt-2 mb-2">
          <div class="hero-stat">
            <span class="hero-stat-value">100+</span>
            <span class="hero-stat-label">Coins Tracked</span>
          </div>
          <div class="hero-stat-divider"></div>
          <div class="hero-stat">
            <span class="hero-stat-value">24/7</span>
            <span class="hero-stat-label">Live Updates</span>
          </div>
          <div class="hero-stat-divider"></div>
          <div class="hero-stat">
            <span class="hero-stat-value">Free</span>
            <span class="hero-stat-label">No Cost Registration</span>
          </div>
        </div>
        <div class="d-flex gap-2 justify-content-center">
          <RouterLink :to="ctaLink" class="btn btn-accent btn-sm px-3">
            {{ ctaText }}
          </RouterLink>
          <RouterLink to="/news" class="btn btn-outline-accent btn-sm px-3">
            View News
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  position: relative; width: 100%; min-height: 80px;
  background-size: cover; background-position: center;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.hero-section::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  opacity: 0.4;
  z-index: 2;
}
.hero-overlay {
  position: absolute; inset: 0;
  background: var(--hero-overlay);
  transition: background var(--transition);
}
.hero-section .container {
  position: relative; z-index: 1;
  padding: 16px 20px;
}
.hero-content {
  max-width: 700px; margin: 0 auto;
}
.hero-title {
  font-size: 38px; font-weight: 800; color: var(--hero-text);
  margin-bottom: 8px; letter-spacing: -0.5px;
  text-shadow: 0 2px 12px rgba(0,0,0,0.3);
  transition: color var(--transition);
}
.hero-subtitle {
  font-size: 16px; color: var(--hero-text-secondary);
  max-width: 560px; margin: 0 auto;
  line-height: 1.4;
  transition: color var(--transition);
}
.hero-stats {
  flex-wrap: wrap;
}
.hero-stat {
  text-align: center;
}
.hero-stat-value {
  display: block;
  font-size: 16px; font-weight: 800; color: var(--accent);
  line-height: 1.1;
}
.hero-stat-label {
  display: block;
  font-size: 11px; color: var(--hero-text-secondary);
  text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;
}
.hero-stat-divider {
  width: 1px; background: rgba(255,255,255,0.15);
}
@media (max-width: 767.98px) {
  .hero-section { min-height: 60px; }
  .hero-section .container { padding: 12px 16px; }
  .hero-title { font-size: 18px; }
  .hero-subtitle { font-size: 11px; }
}
</style>
