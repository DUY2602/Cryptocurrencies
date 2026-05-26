<script setup>
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import AiAssistant from './components/AiAssistant.vue'
</script>

<template>
  <div class="app-wrapper d-flex flex-column min-vh-100">
    <Navbar />
    <main class="flex-grow-1">
      <RouterView v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
    <Footer />
    <AiAssistant />
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
