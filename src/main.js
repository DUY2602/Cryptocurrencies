import { createApp } from 'vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/global.css'
import { initTheme } from './composables/useTheme.js'
import App from './App.vue'
import router from './router'

initTheme()

createApp(App).use(router).mount('#app')
