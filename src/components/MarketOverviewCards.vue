<script setup>
import { RouterLink } from 'vue-router'
import { formatMarketCap, formatChange, changeClass } from '../utils/format.js'

defineProps({
  coins: { type: Array, required: true },
  title: { type: String, required: true },
})
</script>

<template>
  <div class="mb-4">
    <h3 class="section-heading h5 mb-3">{{ title }}</h3>
    <div class="row g-3">
      <div v-for="coin in coins" :key="coin.id" class="col-6 col-md-4 col-lg-2">
        <RouterLink :to="{ name: 'CoinDetail', params: { id: coin.id } }" class="text-decoration-none">
          <div class="card card-crypto card-hover-lift h-100">
            <div class="card-body p-3">
              <div class="d-flex align-items-center gap-2 mb-2">
                <img v-if="coin.image" :src="coin.image" :alt="coin.name" width="24" height="24" class="rounded-circle" />
                <span class="small fw-semibold text-emphasis">{{ coin.symbol }}</span>
              </div>
              <p class="small mb-1 text-secondary">{{ formatMarketCap(coin.marketCap) }}</p>
              <span class="small fw-semibold" :class="changeClass(coin.change24h)">
                {{ formatChange(coin.change24h) }}
              </span>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
