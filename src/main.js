import { createApp } from 'vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/global.css'
import { initTheme } from './composables/useTheme.js'
import App from './App.vue'
import router from './router'
import { user } from './composables/useAuth.js'
import { watch } from 'vue'

initTheme()

const permTargets = []

function togglePerm(el) {
  const requiresAuth = el._perm === 'auth'
  el.style.display = requiresAuth && !user.value ? 'none' : ''
}

watch(user, () => {
  permTargets.forEach((el) => togglePerm(el))
})

const app = createApp(App)
app.use(router)

app.directive('focus', {
  mounted(el) {
    el.focus()
  },
})

app.directive('permission', {
  mounted(el, binding) {
    permTargets.push(el)
    el._perm = binding.value
    togglePerm(el)
  },
  updated(el, binding) {
    el._perm = binding.value
    togglePerm(el)
  },
  unmounted(el) {
    const i = permTargets.indexOf(el)
    if (i >= 0) permTargets.splice(i, 1)
  },
})

app.mount('#app')
