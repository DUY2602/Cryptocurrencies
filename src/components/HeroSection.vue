<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  title: {
    type: String,
    default: 'Track Crypto Markets in Real Time',
  },
  subtitle: {
    type: String,
    default: 'Your university cryptocurrency dashboard — explore markets, news, and trends with a clean, professional interface.',
  },
  ctaText: {
    type: String,
    default: 'Explore Markets',
  },
  ctaLink: {
    type: String,
    default: '/markets',
  },
})
</script>

<template>
  <section class="hero-section">
    <div class="container">
      <div class="row align-items-center g-4 g-lg-5">
        <div class="col-lg-7 col-xl-7">
          <h1 class="hero-title">{{ title }}</h1>
          <p class="hero-subtitle">{{ subtitle }}</p>
          <RouterLink :to="ctaLink" class="btn btn-accent btn-lg px-4">
            {{ ctaText }}
          </RouterLink>
        </div>
        <div class="col-lg-5 col-xl-5">
          <div class="hero-visual">
            <img
              src="/hero.jpg"
              alt="Bitcoin and digital coins"
              class="hero-img rounded-3 w-100"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  padding: 3rem 0 2rem;
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
  border-bottom: 1px solid var(--border-color);
}

.hero-title {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 1rem;
}

.hero-subtitle {
  color: var(--text-secondary);
  font-size: 1.05rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  max-width: 100%;
}

.hero-visual {
  margin-left: auto;
  max-width: 420px;
  padding-left: 0.5rem;
}

.hero-img {
  object-fit: cover;
  height: 180px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow);
}

@media (min-width: 992px) {
  .hero-visual {
    margin-left: auto;
    margin-right: 0;
    padding-left: 1.5rem;
    max-width: 100%;
  }
}

@media (min-width: 768px) {
  .hero-img {
    height: 220px;
  }
}
</style>
