<script setup>
import HeroSection from '../components/HeroSection.vue'
import CoinCard from '../components/CoinCard.vue'
import { trendingCoins } from '../data/coins.js'
</script>

<template>
  <div>
    <HeroSection />

    <section class="page-section">
      <div class="container">
        <h2 class="section-heading">Trending Coins</h2>
        <p class="page-subtitle mb-4">Top movers from our local market data (Stage 1 placeholder).</p>
        <div class="row g-4">
          <div
            v-for="coin in trendingCoins"
            :key="coin.id"
            class="col-6 col-md-4 col-lg-2"
          >
            <CoinCard :coin="coin" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.section-heading {
  font-size: 1.5rem;
  font-weight: 700;
}
</style>
