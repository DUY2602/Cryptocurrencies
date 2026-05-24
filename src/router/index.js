import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Markets from "../views/Markets.vue";
import News from "../views/News.vue";
import NewsDetail from "../views/NewsDetail.vue";
import About from "../views/About.vue";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import CoinDetail from "../views/CoinDetail.vue";
import Watchlist from "../views/Watchlist.vue";
import Profile from "../views/Profile.vue";
import SetPassword from "../views/SetPassword.vue";
import { supabase } from "../../supabase/supabase.js";

const routes = [
  { path: "/", name: "Home", component: Home },
  { path: "/markets", name: "Markets", component: Markets },
  { path: "/coin/:id", name: "CoinDetail", component: CoinDetail },
  { path: "/watchlist", name: "Watchlist", component: Watchlist },
  { path: "/news", name: "News", component: News },
  { path: "/news/:id", name: "NewsDetail", component: NewsDetail },
  { path: "/about", name: "About", component: About },
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { guestOnly: true },
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
    meta: { guestOnly: true },
  },
  { path: "/set-password", name: "SetPassword", component: SetPassword },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach(async (to) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user || null;

  if (to.meta.requiresAuth && !user) {
    return { name: "Login", query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && user) {
    return { name: "Home" };
  }
});

export default router;
