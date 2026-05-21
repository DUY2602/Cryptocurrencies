<script>
export default {
  props: {
    coins: {
      type: Array,
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
    formatMarketCap(value) {
      if (value >= 1e12) return '$' + (value / 1e12).toFixed(2) + 'T'
      if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B'
      if (value >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M'
      return '$' + value.toLocaleString()
    },
    formatChange(value) {
      const sign = value >= 0 ? '+' : ''
      return sign + value.toFixed(2) + '%'
    },
    changeClass(value) {
      return value >= 0 ? 'text-positive' : 'text-negative'
    },
  },
}
</script>

<template>
  <div class="table-responsive rounded-3 border border-secondary border-opacity-25">
    <table class="table table-hover table-dark-custom mb-0 align-middle">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Coin</th>
          <th scope="col" class="text-end d-none d-md-table-cell">Price</th>
          <th scope="col" class="text-end d-none d-lg-table-cell">Market Cap</th>
          <th scope="col" class="text-end">24h %</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="coins.length === 0">
          <td colspan="5" class="text-center text-secondary py-4">No coins found.</td>
        </tr>
        <tr v-for="(coin, index) in coins" :key="coin.id">
          <td class="text-secondary">{{ index + 1 }}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <img
                v-if="coin.image"
                :src="coin.image"
                :alt="coin.name"
                width="28"
                height="28"
                class="rounded-circle"
              />
              <div>
                <span class="fw-semibold">{{ coin.name }}</span>
                <small class="text-secondary ms-1">{{ coin.symbol }}</small>
                <div class="d-md-none small text-secondary">{{ formatPrice(coin.price) }}</div>
              </div>
            </div>
          </td>
          <td class="text-end d-none d-md-table-cell">{{ formatPrice(coin.price) }}</td>
          <td class="text-end d-none d-lg-table-cell text-secondary">{{ formatMarketCap(coin.marketCap) }}</td>
          <td class="text-end fw-semibold" :class="changeClass(coin.change24h)">
            {{ formatChange(coin.change24h) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
