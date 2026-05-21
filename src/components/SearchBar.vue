<script>
export default {
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: 'Search...',
    },
    label: {
      type: String,
      default: '',
    },
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
      <span class="input-group-text search-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242 1.1a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
        </svg>
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
        class="btn btn-outline-secondary"
        type="button"
        @click="clear"
        aria-label="Clear search"
      >
        &times;
      </button>
    </div>
  </div>
</template>

<style scoped>
.search-icon {
  background: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-secondary);
}

.input-group .btn-outline-secondary {
  border-color: var(--border-color);
  color: var(--text-secondary);
  background: var(--bg-secondary);
}

.input-group .btn-outline-secondary:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}
</style>
