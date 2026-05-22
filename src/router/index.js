import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Markets from '../views/Markets.vue'
import News from '../views/News.vue'
import About from '../views/About.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import CoinDetail from '../views/CoinDetail.vue'
import Watchlist from '../views/Watchlist.vue'
import Profile from '../views/Profile.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/markets', name: 'Markets', component: Markets },
  { path: '/coin/:id', name: 'CoinDetail', component: CoinDetail },
  { path: '/watchlist', name: 'Watchlist', component: Watchlist },
  { path: '/news', name: 'News', component: News },
  { path: '/about', name: 'About', component: About },
  { path: '/login', name: 'Login', component: Login, meta: { guestOnly: true } },
  { path: '/register', name: 'Register', component: Register, meta: { guestOnly: true } },
  { path: '/profile', name: 'Profile', component: Profile, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, _from, next) => {
  let user = null
  try {
    const raw = localStorage.getItem('cryptodash-auth')
    user = raw ? JSON.parse(raw) : null
  } catch {
    user = null
  }

  if (to.meta.requiresAuth && !user) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  if (to.meta.guestOnly && user) {
    next({ name: 'Home' })
    return
  }
  next()
})

export default router
