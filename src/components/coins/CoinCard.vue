<script>
import PriceWithArrow from "../ui/PriceWithArrow.vue";
import { formatChange, changeClass } from "../../utils/format.js";

export default {
  components: { PriceWithArrow },
  props: {
    coin: { type: Object, required: true },
  },
  methods: {
    formatChange(val) {
      if (val == null) return '—'
      const sign = val >= 0 ? '+' : ''
      return sign + Number(val).toFixed(2) + '%'
    },
    changeClass(val) {
      return val >= 0 ? 'text-positive' : 'text-negative'
    },
  },
  computed: {
    changeCls() {
      return this.changeClass(this.coin.change24h)
    },
  },
};
</script>

<template>
  <RouterLink
    :to="{ name: 'CoinDetail', params: { id: coin.id } }"
    class="text-decoration-none coin-card-link"
    :class="{ 'pe-none': coin._hasBinanceChart === false }"
  >
    <div class="card card-crypto coin-card h-100 anim-fade-slide" :class="{ 'opacity-50': coin._hasBinanceChart === false }">
      <div class="card-body p-3">
        <div class="d-flex align-items-center gap-2 mb-3">
          <img
            v-if="coin.image"
            :src="coin.image"
            :alt="coin.name"
            class="coin-icon rounded-circle"
            width="32"
            height="32"
          />
          <div>
            <h6 class="mb-0 coin-name">
              {{ coin.name }}
              <small class="text-secondary">{{ coin.symbol }}</small>
            </h6>
          </div>
        </div>
        <p class="coin-price mb-1">
          <PriceWithArrow
            :price="coin.price"
            :flash="coin._flash"
            :pulse="!!coin._flashTick"
            :inline="false"
          />
        </p>
        <span class="small fw-semibold" :class="changeCls">
          {{ formatChange(coin.change24h) }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.coin-card {
  border-radius: 14px;
  border: 1px solid var(--border-color);
  background: linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01));
  backdrop-filter: blur(10px);
  transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
}

.coin-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 14px 40px rgba(0,0,0,0.5);
  border-color: rgba(240, 185, 11, 0.4);
  animation: glow-pulse 2.2s ease-in-out infinite;
}

.coin-icon {
  object-fit: cover;
  background: var(--bg-secondary);
}

.coin-name {
  font-weight: 700;
  color: var(--text-emphasis);
  font-size: 0.92rem;
  line-height: 1.3;
}

.coin-name small {
  font-weight: 400;
  color: var(--text-secondary);
  font-size: 0.78rem;
  margin-left: 0.15rem;
}

.coin-price {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-emphasis);
  margin-bottom: 0.3rem;
  letter-spacing: -0.01em;
}

.coin-change {
  font-weight: 700;
  font-size: 0.88rem;
}
</style>
