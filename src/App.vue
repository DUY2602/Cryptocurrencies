<template>
  <div class="app-wrapper d-flex flex-column min-vh-100">
    <Navbar />
    <main class="flex-grow-1">
      <RouterView />
    </main>
    <Footer />
    <AiAssistant />
    <ToastContainer />
  </div>
</template>

<script setup>
import Navbar from './components/layout/Navbar.vue'
import Footer from './components/layout/Footer.vue'
import AiAssistant from './components/ai/AiAssistant.vue'
import ToastContainer from './components/ui/ToastContainer.vue'
</script>

<style></style>
