<script>
export default {
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: 'Search...' },
    label: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  methods: {
    onInput(event) {
      this.$emit('update:modelValue', event.target.value)
    },
    clear() {
      this.$emit('update:modelValue', '')
    },
  },
}
</script>

<template>
  <div class="search-bar">
    <label v-if="label" class="form-label text-secondary small mb-1">{{ label }}</label>
    <div class="input-group">
      <span class="input-group-text">
        <Search :size="16" />
      </span>
      <input
        type="search"
        class="form-control"
        :placeholder="placeholder"
        :value="modelValue"
        @input="onInput"
      />
      <button
        v-if="modelValue"
        class="btn btn-outline-accent"
        type="button"
        @click="clear"
        aria-label="Clear search"
      >
        <X :size="16" />
      </button>
    </div>
  </div>
</template>
