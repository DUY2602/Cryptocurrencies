<script setup>
import { RouterLink } from 'vue-router'
import { formatPrice, formatMarketCap, formatChange, changeClass } from '../utils/format.js'

defineProps({
  coins: { type: Array, required: true },
  title: { type: String, required: true },
})
</script>

<template>
  <div class="mb-4">
    <h3 class="section-heading h5 mb-3">{{ title }}</h3>
    <div class="row g-2">
      <div v-for="coin in coins" :key="coin.id" class="col-6 col-md-4 col-lg-2">
        <RouterLink :to="{ name: 'CoinDetail', params: { id: coin.id } }" class="text-decoration-none">
          <div class="card card-crypto coin-card h-100">
            <div class="card-body p-2 p-md-3">
              <div class="d-flex align-items-center gap-2 mb-2">
                <img v-if="coin.image" :src="coin.image" :alt="coin.name" width="24" height="24" class="rounded-circle coin-icon" />
                <div class="overflow-hidden">
        <div class="fw-semibold text-emphasis small text-truncate" style="font-size:0.88rem; font-weight:700">{{ coin.name }}</div>
        <div class="text-secondary" style="font-size:0.72rem">{{ coin.symbol }}</div>
                </div>
              </div>
              <div class="d-flex justify-content-between align-items-end gap-1">
                <div class="small fw-semibold text-emphasis" style="font-size:0.85rem">
                  {{ formatPrice(coin.price) }}
                </div>
                <div class="small fw-semibold" :class="changeClass(coin.change24h)" style="font-size:0.78rem">
                  {{ formatChange(coin.change24h) }}
                </div>
              </div>
              <div class="text-secondary mt-1" style="font-size:0.7rem">
                {{ formatMarketCap(coin.marketCap) }}
              </div>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
