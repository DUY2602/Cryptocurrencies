<script>
import { formatPrice } from '../utils/format.js'

export default {
  props: {
    price: { type: Number, required: true },
    flash: { type: String, default: null },
    change24h: { type: Number, default: null },
    size: {
      type: String,
      default: 'md',
      validator: (v) => ['sm', 'md', 'lg'].includes(v),
    },
    inline: { type: Boolean, default: true },
  },
  computed: {
    direction() {
      if (this.flash === 'up' || this.flash === 'down') return this.flash
      if (this.change24h == null || Number.isNaN(this.change24h)) return null
      return this.change24h >= 0 ? 'up' : 'down'
    },
    arrowClass() {
      if (this.direction === 'up') return 'text-positive'
      if (this.direction === 'down') return 'text-negative'
      return ''
    },
    flashClass() {
      if (this.flash === 'up') return 'price-flash-up'
      if (this.flash === 'down') return 'price-flash-down'
      return ''
    },
    sizeClass() {
      if (this.size === 'sm') return 'price-with-arrow--sm'
      if (this.size === 'lg') return 'price-with-arrow--lg'
      return ''
    },
  },
  methods: {
    formatPrice,
  },
}
</script>

<template>
  <span
    class="price-with-arrow"
    :class="[sizeClass, flashClass, inline ? 'd-inline-flex' : 'd-flex', 'align-items-center gap-1']"
  >
    <span
      v-if="direction"
      class="price-arrow"
      :class="arrowClass"
      :title="direction === 'up' ? 'Price up' : 'Price down'"
      aria-hidden="true"
    >{{ direction === 'up' ? '▲' : '▼' }}</span>
    <span class="price-with-arrow__value">{{ formatPrice(price) }}</span>
  </span>
</template>
