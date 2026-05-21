<script>
export default {
  props: {
    coin: {
      type: Object,
      required: true,
    },
  },
  methods: {
    formatPrice(value) {
      if (value >= 1) {
        return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      }
      return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
    },
    formatChange(value) {
      const sign = value >= 0 ? '+' : ''
      return sign + value.toFixed(2) + '%'
    },
  },
  computed: {
    changeClass() {
      return this.coin.change24h >= 0 ? 'text-positive' : 'text-negative'
    },
  },
}
</script>

<template>
  <div class="card card-crypto coin-card h-100">
    <div class="card-body">
      <div class="d-flex align-items-center gap-3 mb-3">
        <img
          v-if="coin.image"
          :src="coin.image"
          :alt="coin.name"
          class="coin-icon"
          width="40"
          height="40"
        />
        <div>
          <h6 class="mb-0 coin-name">{{ coin.name }}</h6>
          <small class="text-secondary">{{ coin.symbol }}</small>
        </div>
      </div>
      <p class="coin-price mb-1">{{ formatPrice(coin.price) }}</p>
      <span :class="['change-badge', changeClass]">{{ formatChange(coin.change24h) }}</span>
    </div>
  </div>
</template>

<style scoped>
.coin-card .card-body {
  padding: 1.25rem;
}

.coin-icon {
  border-radius: 50%;
}

.coin-name {
  font-weight: 600;
  color: var(--text-emphasis);
}

.coin-price {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-emphasis);
}

.change-badge {
  font-size: 0.9rem;
  font-weight: 600;
}
</style>
