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
    <div class="container">
      <div class="row align-items-center g-4 g-lg-5">
        <div class="col-lg-7">
          <div class="hero-badge mb-3">
            <span class="badge-live">
              <span class="badge-live-dot"></span>
              Live Prices
            </span>
          </div>
          <h1 class="hero-title">{{ title }}</h1>
          <p class="hero-subtitle">{{ subtitle }}</p>
          <div class="d-flex gap-3 mt-4">
            <RouterLink :to="ctaLink" class="btn btn-accent btn-lg px-5">
              {{ ctaText }}
            </RouterLink>
            <RouterLink to="/news" class="btn btn-outline-accent btn-lg px-5">
              View News
            </RouterLink>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="hero-visual">
            <img
              src="/hero.jpg"
              alt="Cryptocurrency dashboard"
              class="hero-img w-100"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
