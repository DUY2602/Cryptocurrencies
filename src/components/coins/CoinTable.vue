<script>
import { RouterLink } from 'vue-router'
import FavoriteButton from '../ui/FavoriteButton.vue'
import PriceWithArrow from '../ui/PriceWithArrow.vue'
import { formatMarketCap, formatChange, changeClass } from "../../utils/format.js"

export default {
  components: { RouterLink, FavoriteButton, PriceWithArrow },
  props: {
    coins: { type: Array, required: true },
    showRank: { type: Boolean, default: true },
    startRank: { type: Number, default: 1 },
  },
  methods: {
    formatMarketCap,
    formatChange,
    changeClass,
    rowClass(coin) {
      if (!coin._flashTick) return ''
      if (coin._flash === 'up') return 'price-flash-up'
      if (coin._flash === 'down') return 'price-flash-down'
      return ''
    },
    handleImageError(e) {
      e.target.style.display = 'none'
      if (e.target.nextElementSibling) {
        e.target.nextElementSibling.style.display = 'flex'
      }
    }
  },
}
</script>

<template>
  <div class="table-responsive">
    <table class="table table-hover table-dark-custom mb-0 align-middle">
      <thead>
        <tr>
          <th v-if="showRank" scope="col" class="d-none d-sm-table-cell">#</th>
          <th scope="col">Coin</th>
          <th scope="col" class="text-end d-none d-md-table-cell">Price</th>
          <th scope="col" class="text-end d-none d-lg-table-cell">Market Cap</th>
          <th scope="col" class="text-end">24h %</th>
          <th scope="col" class="text-end">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="coins.length === 0">
          <td :colspan="showRank ? 6 : 5" class="text-center text-secondary py-4">
            <slot name="empty">No coins found.</slot>
          </td>
        </tr>
        <tr
          v-for="(coin, index) in coins"
          :key="coin.id"
          class="table-row-link"
          :class="[rowClass(coin)]"
        >
          <td v-if="showRank" class="text-secondary d-none d-sm-table-cell">{{ startRank + index }}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <img
                v-if="coin.image"
                :src="coin.image"
                :alt="coin.name"
                width="28"
                height="28"
                class="rounded-circle"
                @error="handleImageError"
              />
              <div 
                class="coin-icon-placeholder rounded-circle" 
                style="width:28px; height:28px; display:none; align-items:center; justify-content:center; background: var(--bg-secondary); color: var(--accent); font-weight:700; font-size:12px;"
              >
                {{ coin.symbol?.charAt(0)?.toUpperCase() }}
              </div>
              <div>
                <RouterLink
                  :to="{ name: 'CoinDetail', params: { id: coin.id } }"
                  class="fw-semibold text-emphasis text-decoration-none"
                >
                  {{ coin.name }}
                </RouterLink>
                <small class="text-secondary ms-1">{{ coin.symbol }}</small>
                <span v-if="coin._hasBinanceChart === false" class="badge-gecko-sm">CoinGecko</span>
                <div class="d-md-none small text-secondary">
                  <PriceWithArrow
                    :price="coin.price"
                    :flash="coin._flash"
                    :pulse="!!coin._flashTick"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </td>
          <td class="text-end d-none d-md-table-cell">
            <PriceWithArrow
              :price="coin.price"
              :flash="coin._flash"
              :pulse="!!coin._flashTick"
            />
          </td>
          <td class="text-end d-none d-lg-table-cell text-secondary">{{ formatMarketCap(coin.marketCap) }}</td>
          <td class="text-end fw-semibold" :class="changeClass(coin.change24h)">
            {{ formatChange(coin.change24h) }}
          </td>
          <td class="text-end">
            <div class="d-flex gap-1 justify-content-end align-items-center">
              <FavoriteButton :coin-id="coin.id" />
              <RouterLink
                :to="{ name: 'CoinDetail', params: { id: coin.id } }"
                class="btn btn-sm btn-outline-accent"
              >
                Details
              </RouterLink>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.badge-gecko-sm {
  font-size: 0.55rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 5px;
  border-radius: 4px;
  background: color-mix(in srgb, #f0b90b 12%, transparent);
  color: #f0b90b;
  border: 1px solid color-mix(in srgb, #f0b90b 25%, transparent);
  white-space: nowrap;
  vertical-align: middle;
  margin-left: 0.25rem;
}
</style>
