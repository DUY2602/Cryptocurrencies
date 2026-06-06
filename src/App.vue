<template>
  <div class="app-wrapper d-flex flex-column min-vh-100">
    <Navbar />
    <main class="flex-grow-1">
      <RouterView v-slot="{ Component }">
        <Transition name="page" appear>
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <Footer />
    <AiAssistant />
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import AiAssistant from './components/AiAssistant.vue'
</script>

<style>
.page-enter-active {
  animation: pageIn 0.32s ease-out both;
}
.page-leave-active {
  animation: pageOut 0.18s ease-in both;
}
@keyframes pageIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pageOut {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-8px); }
}
</style>
