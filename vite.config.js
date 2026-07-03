import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/binance': {
        target: 'https://api.binance.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/binance/, '/api/v3/ticker/24hr'),
      },
      '/api/coingecko': {
        target: 'https://api.coingecko.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/coingecko/, '/api/v3'),
      },
    },
  },
  build: {
    // Optimize chunk size to avoid large bundles
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          vue: ['vue', 'vue-router'],
          lucide: ['@lucide/vue'],
          bootstrap: ['bootstrap'],
          'lightweight-charts': ['lightweight-charts'],
        },
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Minify CSS for smaller payloads
    cssMinify: true,
  },
  // Optimize dependencies for faster dev server
  optimizeDeps: {
    include: ['vue', 'vue-router', 'bootstrap', 'lightweight-charts'],
  },
})
