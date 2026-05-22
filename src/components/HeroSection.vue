<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  title: {
    type: String,
    default: 'Track Crypto Markets in Real Time',
  },
  subtitle: {
    type: String,
    default: 'Check prices, market cap, and news in one place. Built for COS30043 at Swinburne.',
  },
  ctaText: { type: String, default: 'Explore Markets' },
  ctaLink: { type: String, default: '/markets' },
})
</script>

<template>
  <section class="hero-section">
    <div class="container">
      <div class="row align-items-center g-4 g-lg-5">
        <div class="col-lg-7">
          <h1 class="hero-title">{{ title }}</h1>
          <p class="hero-subtitle">{{ subtitle }}</p>
          <RouterLink :to="ctaLink" class="btn btn-accent btn-lg px-4">
            {{ ctaText }}
          </RouterLink>
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
