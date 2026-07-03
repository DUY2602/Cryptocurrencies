<script>
import { formatPrice } from "../../utils/format.js"

export default {
  props: {
    price: { type: Number, required: true },
    /** Last live tick direction: 'up' | 'down' (not 24h %) */
    flash: { type: String, default: null },
    /** True only on the frame when price just changed (background pulse) */
    pulse: { type: Boolean, default: false },
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
      return null
    },
    arrowClass() {
      if (this.direction === 'up') return 'text-positive'
      if (this.direction === 'down') return 'text-negative'
      return ''
    },
    flashClass() {
      if (!this.pulse) return ''
      if (this.direction === 'up') return 'price-flash-up'
      if (this.direction === 'down') return 'price-flash-down'
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
    ><ArrowUp v-if="direction === 'up'" :size="12" /><ArrowDown v-else :size="12" /></span>
    <span class="price-with-arrow__value">{{ formatPrice(price) }}</span>
  </span>
</template>
