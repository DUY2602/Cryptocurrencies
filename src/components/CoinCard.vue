<script>
import PriceWithArrow from "./PriceWithArrow.vue";
import { formatChange, changeClass } from "../utils/format.js";

export default {
  components: { PriceWithArrow },
  props: {
    coin: { type: Object, required: true },
  },
  methods: {
    formatChange,
    changeClass,
    handleImageError(e) {
      e.target.style.display = "none";
      if (e.target.nextElementSibling) {
        e.target.nextElementSibling.style.display = "flex";
      }
    },
  },
  computed: {
    changeCls() {
      return changeClass(this.coin.change24h);
    },
  },
};
</script>

<template>
  <div class="card card-crypto card-hover-lift coin-card h-100">
    <div class="card-body">
      <div class="d-flex align-items-center gap-3 mb-3">
        <img
          v-if="coin.image"
          :src="coin.image"
          :alt="coin.name"
          class="coin-icon rounded-circle"
          width="40"
          height="40"
          @error="handleImageError"
        />
        <div
          class="coin-icon-placeholder rounded-circle"
          style="
            width: 40px;
            height: 40px;
            display: none;
            align-items: center;
            justify-content: center;
            background: var(--bg-secondary);
            color: var(--accent);
            font-weight: 700;
            font-size: 14px;
          "
        >
          {{ coin.symbol?.charAt(0)?.toUpperCase() }}
        </div>
        <div>
          <h6 class="mb-0 coin-name">{{ coin.name }}</h6>
          <small class="text-secondary">{{ coin.symbol }}</small>
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
      <span class="fw-semibold" :class="changeCls">{{
        formatChange(coin.change24h)
      }}</span>
    </div>
  </div>
</template>
