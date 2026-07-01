<script setup>
defineProps({
  type: { type: String, default: 'text' },
  lines: { type: Number, default: 3 },
  width: { type: String, default: '100%' },
  height: { type: String, default: '' },
  count: { type: Number, default: 1 },
  dark: { type: Boolean, default: false },
})
</script>

<template>
  <div v-for="i in count" :key="i" :class="['skeleton-group', { 'mb-3': count > 1 }]">
    <div v-if="type === 'card'" class="skeleton-card">
      <div class="skeleton-img" />
      <div class="skeleton-body">
        <div class="skeleton-line w-75" />
        <div class="skeleton-line w-50" />
        <div class="skeleton-line w-60" />
      </div>
    </div>
    <div v-else-if="type === 'table-row'" class="skeleton-table-row">
      <div class="skeleton-line" style="width:40px" />
      <div class="skeleton-circle" style="width:28px;height:28px" />
      <div class="skeleton-line w-25" />
      <div class="skeleton-line w-20" />
    </div>
    <div v-else-if="type === 'hero'" class="skeleton-hero">
      <div class="skeleton-line" style="width:240px;height:32px;margin-bottom:12px" />
      <div class="skeleton-line" style="width:360px;height:18px" />
    </div>
    <div v-else-if="type === 'avatar'" class="d-flex align-items-center gap-3">
      <div class="skeleton-circle" :style="{ width: height || '40px', height: height || '40px' }" />
      <div class="flex-grow-1">
        <div v-for="l in lines" :key="l" class="skeleton-line mb-2" :class="{ 'w-75': l === 1, 'w-50': l === 2 }" />
      </div>
    </div>
    <div v-else class="skeleton-text">
      <div v-for="l in lines" :key="l" class="skeleton-line mb-2" :class="{ 'w-75': l === lines, 'w-50': l === lines - 1 && lines > 1 }" />
    </div>
  </div>
</template>

<style scoped>
.skeleton-group { width: v-bind(width); }
.skeleton-line, .skeleton-img, .skeleton-circle {
  background: var(--border-color);
  border-radius: 8px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
.skeleton-line { height: 14px; border-radius: 6px; }
.skeleton-circle { border-radius: 50%; }
.skeleton-img { height: 140px; margin-bottom: 12px; border-radius: 12px; }
.skeleton-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 0;
  overflow: hidden;
}
.skeleton-body { padding: 16px; }
.skeleton-body .skeleton-line { margin-bottom: 10px; }
.skeleton-body .skeleton-line:last-child { margin-bottom: 0; }
.skeleton-table-row {
  display: flex; align-items: center; gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
}
.skeleton-table-row:last-child { border-bottom: none; }
.skeleton-hero {
  padding: 50px 20px 40px;
  display: flex; flex-direction: column; align-items: center;
}
.w-20 { width: 20%; }
.w-25 { width: 25%; }
.w-50 { width: 50%; }
.w-60 { width: 60%; }
.w-75 { width: 75%; }
.skeleton-text .skeleton-line:last-child { margin-bottom: 0; }

@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}
</style>
