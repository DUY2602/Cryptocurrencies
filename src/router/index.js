import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/general/Home.vue";
import Markets from "../views/coins/Markets.vue";
import News from "../views/news/News.vue";
import NewsDetail from "../views/news/NewsDetail.vue";
import About from "../views/general/About.vue";
import Login from "../views/auth/Login.vue";
import Register from "../views/auth/Register.vue";
import CoinDetail from "../views/coins/CoinDetail.vue";
import Watchlist from "../views/coins/Watchlist.vue";
import Profile from "../views/auth/Profile.vue";
import SetPassword from "../views/auth/SetPassword.vue";

// Admin
import AdminLayout from "../views/admin/AdminLayout.vue";
import AdminDashboard from "../views/admin/AdminDashboard.vue";
import AdminNews from "../views/admin/AdminNews.vue";
import AdminNewsEdit from "../views/admin/AdminNewsEdit.vue";
import AdminUsers from "../views/admin/AdminUsers.vue";
import AdminRag from "../views/admin/AdminRag.vue";

import { supabase } from "../../supabase/supabase.js";
import { user } from "../composables/useAuth.js";

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

  /* ─────────────── Admin section ─────────────── */
  {
    path: "/admin",
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: "",
        name: "AdminDashboard",
        component: AdminDashboard,
      },
      {
        path: "news",
        name: "AdminNews",
        component: AdminNews,
      },
      {
        path: "news/:id",
        name: "AdminNewsEdit",
        component: AdminNewsEdit,
      },
      {
        path: "users",
        name: "AdminUsers",
        component: AdminUsers,
      },
      {
        path: "rag",
        name: "AdminRag",
        component: AdminRag,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

let sessionChecked = false;
router.beforeEach(async (to) => {
  if (!sessionChecked) {
    const { data: { session } } = await supabase.auth.getSession();
    sessionChecked = true;
  }
  const currentUser = user.value;

  if (to.meta.requiresAuth && !currentUser) {
    return { name: "Login", query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && currentUser) {
    return { name: "Home" };
  }
  // requiresAdmin: bail out (the layout itself renders a friendly
  // "promote yourself" screen) and let the AdminLayout handle the
  // permission display.
});

export default router;
