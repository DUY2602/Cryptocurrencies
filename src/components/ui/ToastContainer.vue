<template>
  <Teleport to="body">
    <div class="toast-stack" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast-custom"
          :class="`toast-${t.type}`"
          role="status"
        >
          <Check v-if="t.type === 'success'" :size="16" />
          <X v-else-if="t.type === 'error'" :size="16" />
          <Info v-else :size="16" />
          <span class="toast-msg">{{ t.message }}</span>
          <button type="button" class="toast-close" aria-label="Dismiss" @click="remove(t.id)">
            <X :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from "../../composables/useToast.js";

const { toasts, remove } = useToast();
</script>

<style scoped>
.toast-stack {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 360px;
}

.toast-custom {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.9rem;
  border-radius: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  font-size: 0.85rem;
  color: var(--text-primary);
}

.toast-success svg:first-child {
  color: var(--positive);
  flex-shrink: 0;
}

.toast-error svg:first-child {
  color: var(--negative);
  flex-shrink: 0;
}

.toast-info svg:first-child {
  color: var(--accent);
  flex-shrink: 0;
}

.toast-msg {
  flex-grow: 1;
  min-width: 0;
}

.toast-close {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 2px;
  display: inline-flex;
  border-radius: 4px;
}

.toast-close:hover {
  color: var(--text-primary);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
