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
  <section class="hero-section">
    <div class="hero-bg"></div>
    <div class="cyber-grid"></div>
    <div class="hero-glow"></div>
    <div class="hero-glow hero-glow-2"></div>
    <div class="hero-overlay"></div>
    <div class="container">
      <div class="hero-content text-center">
        <h1 class="hero-title anim-fade-slide-d1">{{ title }}</h1>
        <p class="hero-subtitle anim-fade-slide-d1">{{ subtitle }}</p>

        <div class="hero-hud-stats mt-4 mb-4 anim-fade-slide-d2">
          <div class="hud-stat">
            <span class="hud-value font-monospace">100+</span>
            <span class="hud-label">Coins Tracked</span>
          </div>
          <div class="hud-divider"></div>
          <div class="hud-stat">
            <span class="hud-value font-monospace">24/7</span>
            <span class="hud-label">Live Updates</span>
          </div>
          <div class="hud-divider"></div>
          <div class="hud-stat">
            <span class="hud-value font-monospace">Free</span>
            <span class="hud-label">No Cost Registration</span>
          </div>
        </div>

        <div class="d-flex gap-3 justify-content-center anim-fade-slide-d2">
          <RouterLink :to="ctaLink" class="btn btn-accent btn-hero px-5">
            {{ ctaText }}
          </RouterLink>
          <RouterLink to="/news" class="btn btn-outline-accent btn-hero px-5">
            View News
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  padding: 3.5rem 0 3rem;
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  position: relative;
  width: 100%;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: url('/hero/coin_hero_solid.png') center/contain no-repeat;
  background-size: 420px;
  opacity: 0.7;
  mix-blend-mode: var(--hero-blend);
  filter: var(--hero-filter);
  animation: float-coin 9s ease-in-out infinite alternate;
  z-index: 0;
}

.cyber-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 200, 55, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 200, 55, 0.04) 1px, transparent 1px);
  background-size: 44px 44px;
  background-position: center;
  mask-image: radial-gradient(circle at center, black 20%, transparent 75%);
  -webkit-mask-image: radial-gradient(circle at center, black 20%, transparent 75%);
  pointer-events: none;
  z-index: 1;
}

.hero-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255, 200, 55, 0.08) 0%, rgba(255, 200, 55, 0.02) 50%, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
  z-index: 1;
  animation: glow-breathe 7s ease-in-out infinite alternate;
}

.hero-glow-2 {
  top: 20%;
  left: 80%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255, 200, 55, 0.06) 0%, transparent 70%);
  animation-delay: -3s;
}

@keyframes glow-breathe {
  0% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
}

@keyframes float-coin {
  0% { transform: translateY(0) rotate(-3deg); }
  100% { transform: translateY(-18px) rotate(8deg); }
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: var(--hero-overlay);
  pointer-events: none;
  z-index: 2;
}

.hero-section .container {
  position: relative;
  z-index: 3;
  padding: 0 20px;
}

.hero-content {
  max-width: 820px;
  margin: 0 auto;
}

/* Eyebrow label */
.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--accent-bg-subtle);
  border: 1px solid var(--accent-bg-hover);
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 5px 14px;
  border-radius: 999px;
  margin-bottom: 1.25rem;
}

.hero-live-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--positive);
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5);
  animation: live-pulse 1.8s infinite;
}

@keyframes live-pulse {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
  70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.hero-title {
  font-family: 'Orbitron', sans-serif;
  font-size: clamp(1.85rem, 5vw, 3.2rem);
  font-weight: 800;
  line-height: 1.12;
  margin-bottom: 1.1rem;
  letter-spacing: -1px;
  background: linear-gradient(135deg, var(--hero-title-gradient-start) 20%, var(--accent) 80%, #ffeb3b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: clamp(0.9rem, 2.5vw, 1.05rem);
  color: var(--text-secondary);
  max-width: 580px;
  margin: 0 auto 1.75rem;
  line-height: 1.7;
}

/* HUD Stats */
.hero-hud-stats {
  display: inline-flex;
  align-items: center;
  gap: 0;
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 18px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 200, 55, 0.06);
}

.hud-stat {
  text-align: center;
  padding: 0.9rem 1.6rem;
}

.hud-value {
  display: block;
  font-family: 'Orbitron', monospace;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent);
  text-shadow: 0 0 12px rgba(255, 200, 55, 0.25);
  line-height: 1.2;
}

.hud-label {
  display: block;
  font-size: 0.67rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1.2px;
  margin-top: 3px;
  font-weight: 600;
}

.hud-divider {
  width: 1px;
  height: 100%;
  align-self: stretch;
  background: var(--border-color);
}

/* Hero CTA buttons */
.btn-hero {
  height: 46px;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

@media (max-width: 767.98px) {
  .hero-section {
    min-height: auto;
    padding: 2.5rem 0 2rem;
  }
  .hero-hud-stats {
    flex-direction: column;
    width: 100%;
  }
  .hud-stat {
    padding: 0.75rem 1.25rem;
    width: 100%;
    border-bottom: 1px solid var(--border-color);
  }
  .hud-stat:last-child { border-bottom: none; }
  .hud-divider { display: none; }
}
</style>
