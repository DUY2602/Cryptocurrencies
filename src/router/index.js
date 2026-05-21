import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Markets from '../views/Markets.vue'
import News from '../views/News.vue'
import About from '../views/About.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/markets', name: 'Markets', component: Markets },
  { path: '/news', name: 'News', component: News },
  { path: '/about', name: 'About', component: About },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
