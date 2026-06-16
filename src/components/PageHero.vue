<script>
export default {
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    background: { type: String, default: "/hero.jpg" },
  },
};
</script>

<template>
  <div class="page-hero" :style="{ backgroundImage: `url(${background})` }">
    <div class="page-hero-overlay"></div>
    <div class="page-hero-content">
      <h1 class="page-hero-title">{{ title }}</h1>
      <p v-if="subtitle" class="page-hero-subtitle">{{ subtitle }}</p>
    </div>
  </div>
</template>

<style scoped>
.page-hero {
  position: relative; width: 100%; min-height: 140px;
  background-size: cover; background-position: center;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.page-hero::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  opacity: 0.4;
  z-index: 2;
}
.page-hero-overlay {
  position: absolute; inset: 0;
  background: var(--hero-overlay);
  transition: background var(--transition);
}
.page-hero-content {
  position: relative; z-index: 1;
  text-align: center; padding: 50px 20px 40px;
}
.page-hero-title {
  font-size: 40px; font-weight: 800; color: var(--hero-text);
  margin-bottom: 10px; letter-spacing: -0.5px;
  text-shadow: 0 2px 12px rgba(0,0,0,0.3);
  transition: color var(--transition);
}
.page-hero-subtitle {
  font-size: 17px; color: var(--hero-text-secondary);
  max-width: 520px; margin: 0 auto;
  line-height: 1.5;
  transition: color var(--transition);
}
@media (max-width: 767.98px) {
  .page-hero { min-height: 100px; }
  .page-hero-content { padding: 30px 16px 24px; }
  .page-hero-title { font-size: 22px; }
  .page-hero-subtitle { font-size: 13px; }
}
</style>
