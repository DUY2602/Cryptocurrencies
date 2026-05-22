<script setup>
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import AiAssistant from './components/AiAssistant.vue'
</script>

<template>
  <div class="app-wrapper d-flex flex-column min-vh-100">
    <Navbar />
    <main class="flex-grow-1">
      <RouterView />
    </main>
    <Footer />
    <AiAssistant />
  </div>
</template>
