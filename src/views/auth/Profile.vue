<script>
import { useAuth } from "../../composables/useAuth.js";
import { useAdmin } from "../../composables/useAdmin.js";
import { useTheme } from "../../composables/useTheme.js";
import { useRouter } from "vue-router";

export default {
  setup() {
    const { user, logout } = useAuth();
    const { isAdmin, profile } = useAdmin();
    const { isDark, toggle } = useTheme();
    const router = useRouter();
    return { user, logout, isAdmin, profile, isDark, toggle, router };
  },
  computed: {
    initials() {
      const name = this.profile?.name || this.user?.name || "U";
      return name.charAt(0).toUpperCase();
    },
    displayName() {
      return this.profile?.name || this.user?.name || "User";
    },
    email() {
      return this.user?.email || "—";
    },
    roleBadge() {
      return this.isAdmin
        ? { text: "Admin", cls: "role-admin" }
        : { text: "User", cls: "role-user" };
    },
    memberSince() {
      return this.user?.id
        ? new Date(parseInt(this.user.id.substring(0, 8), 16) * 1000).toLocaleDateString("en-AU", {
            year: "numeric", month: "long", day: "numeric",
          })
        : "—";
    },
  },
  methods: {
    handleLogout() {
      this.logout();
      this.router.push("/");
    },
    goWatchlist() {
      this.router.push({ name: "Watchlist" });
    },
    goAdmin() {
      this.router.push({ name: "AdminDashboard" });
    },
  },
};
</script>

<template>
  <section class="page-section profile-page">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6 col-xl-5">

          <div class="profile-card">
            <div class="profile-header">
              <div class="profile-avatar">{{ initials }}</div>
              <h1 class="profile-name">{{ displayName }}</h1>
              <span class="profile-email">{{ email }}</span>
              <span class="role-badge" :class="roleBadge.cls">{{ roleBadge.text }}</span>
            </div>

            <div class="profile-body">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Member since</span>
                  <span class="info-value">{{ memberSince }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Theme</span>
                  <div class="d-flex align-items-center gap-2">
                    <span class="info-value">{{ isDark ? "Dark" : "Light" }}</span>
                    <button class="btn btn-sm btn-outline-accent" @click="toggle">
                      Toggle
                    </button>
                  </div>
                </div>
              </div>

              <hr class="divider" />

              <div class="quick-links">
                <button class="quick-link" @click="goWatchlist">
                  <Star :size="16" />
                  Watchlist
                </button>
                <button v-if="isAdmin" class="quick-link" @click="goAdmin">
                  <Shield :size="16" />
                  Admin dashboard
                </button>
              </div>

              <hr class="divider" />

              <button class="btn btn-outline-accent w-100" @click="handleLogout">
                <LogOut :size="16" class="me-1" />
                Logout
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.profile-page {
  padding-top: 3rem;
  padding-bottom: 4rem;
}

.profile-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
}

.profile-header {
  text-align: center;
  padding: 2.5rem 2rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), #d9a60a);
  color: var(--accent-text);
  font-size: 1.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  border: 3px solid var(--border-color);
}

.profile-name {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-emphasis);
  margin-bottom: 0.25rem;
}

.profile-email {
  display: block;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
}

.role-badge {
  display: inline-block;
  padding: 0.2rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid;
}

.role-admin {
  background: rgba(240, 185, 11, 0.15);
  color: var(--accent);
  border-color: rgba(240, 185, 11, 0.4);
}

.role-user {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.profile-body {
  padding: 1.5rem 2rem 2rem;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 0.82rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.info-value {
  font-size: 0.85rem;
  color: var(--text-emphasis);
  font-weight: 600;
}

.divider {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 1.25rem 0;
  opacity: 0.5;
}

.quick-links {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.65rem 0.75rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.quick-link:hover {
  background: var(--bg-card-hover);
  color: var(--accent);
  border-color: var(--border-color);
}

.quick-link svg {
  opacity: 0.6;
  flex-shrink: 0;
}

.quick-link:hover svg {
  opacity: 1;
}
</style>
