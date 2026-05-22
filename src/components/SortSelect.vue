<script>
export default {
  props: {
    modelValue: { type: String, default: 'default' },
  },
  emits: ['update:modelValue'],
  methods: {
    onChange(e) {
      this.$emit('update:modelValue', e.target.value)
    },
  },
}
</script>

<template>
  <div>
    <label class="form-label text-secondary small mb-1">Sort by</label>
    <select class="form-select" :value="modelValue" @change="onChange">
      <option value="default">Market cap (default)</option>
      <option value="price">Highest price</option>
      <option value="gainers">Top gainers</option>
      <option value="losers">Top losers</option>
    </select>
  </div>
</template>
