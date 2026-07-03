<script>
import { fetchNews, fetchNewsCount, fetchCategoryCounts } from "../../services/news.js";
import {
  fetchReactionCounts,
  loadUserReactions,
} from "../../composables/useReactions.js";
import SearchBar from "../../components/ui/SearchBar.vue";
import NewsReactions from "../../components/news/NewsReactions.vue";
import LoadingSpinner from "../../components/ui/LoadingSpinner.vue";

const PAGE_SIZE = 9;

export default {
  components: {
    SearchBar,
    NewsReactions,
    LoadingSpinner,
  },
  data() {
    return {
      articles: [],
      searchQuery: "",
      page: 1,
      totalPages: 1,
      loading: true,
      pageLoading: false,
      loadError: null,
      selectedCategory: '',
      selectedDate: '',
      categoryCounts: [],
    };
  },
  computed: {
    categories() {
      return this.categoryCounts;
    },
    featuredArticle() {
      return this.articles.find((a) => a.featured);
    },
    trendingArticles() {
      return this.articles.filter((a) => a.trending).slice(0, 5);
    },
    filteredArticles() {
      let articles = this.searchQuery
        ? this.articles
        : this.articles.filter((a) => !a.featured);

      if (this.selectedCategory) {
        articles = articles.filter((a) => a.category === this.selectedCategory);
      }

      if (this.selectedDate) {
        const now = new Date();
        const cutoff = new Date(now);
        if (this.selectedDate === 'today') cutoff.setDate(now.getDate() - 1);
        else if (this.selectedDate === 'week') cutoff.setDate(now.getDate() - 7);
        else if (this.selectedDate === 'month') cutoff.setMonth(now.getMonth() - 1);
        else if (this.selectedDate === 'year') cutoff.setFullYear(now.getFullYear() - 1);
        articles = articles.filter((a) => new Date(a.date) >= cutoff);
      }

      const q = this.searchQuery.trim().toLowerCase();
      if (!q) return articles;

      return articles.filter((article) => {
        const title = article.title.toLowerCase();
        return title.includes(q);
      });
    },
    visiblePages() {
      const pages = [];
      const total = this.totalPages;
      const current = this.page;
      if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        if (current > 3) pages.push("...");
        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (current < total - 2) pages.push("...");
        pages.push(total);
      }
      return pages;
    },
  },
  watch: {
    searchQuery() {
      this.page = 1;
      this.fetchPage(1);
    },
    selectedCategory() {
      this.page = 1;
      this.fetchPage(1);
    },
    selectedDate() {
      this.page = 1;
      this.fetchPage(1);
    },
  },
  async mounted() {
    if (this.$route.query.q) {
      this.searchQuery = this.$route.query.q;
    }
    await this.initLoad();
  },
  methods: {
    async initLoad() {
      this.loading = true;
      this.loadError = null;
      try {
        const [count, cats] = await Promise.all([
          fetchNewsCount(),
          fetchCategoryCounts(),
        ]);
        if (count !== null) {
          this.totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
        }
        if (cats) this.categoryCounts = cats;
        const articles = await fetchNews({ page: 1, pageSize: PAGE_SIZE });
        this.articles = articles;
        await this.loadReactions();
      } catch (e) {
        this.loadError = e.message;
      } finally {
        this.loading = false;
      }
    },
    async fetchPage(page) {
      if (this.pageLoading) return;
      this.pageLoading = true;
      this.page = page;
      try {
        const pageSize = this.selectedCategory || this.searchQuery ? 500 : PAGE_SIZE;
        const articles = await fetchNews({ page, pageSize });
        this.articles = articles;
        await this.loadReactions();
      } catch (e) {
        console.warn("[news] fetch page failed:", e.message);
      } finally {
        this.pageLoading = false;
      }
    },
    goTo(page) {
      if (page < 1 || page > this.totalPages || page === this.page) return;
      this.fetchPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    selectCategory(category) {
      this.selectedCategory =
        this.selectedCategory === category ? null : category;
    },
    async loadReactions() {
      const ids = this.articles.map((a) => a.id);
      if (ids.length) {
        await Promise.all([
          fetchReactionCounts(ids),
          loadUserReactions(),
        ]);
      }
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString("en-AU", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
    formatDateTime(dateStr) {
      return new Date(dateStr).toLocaleString("en-AU", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
};
</script>

<template>
  <section class="page-section news-page">
    <div class="news-hero" :style="{ backgroundImage: `url(/hero.jpg)` }">
      <div class="news-hero-overlay"></div>
      <div class="news-hero-content">
        <h1 class="news-hero-title">Crypto News</h1>
        <p class="news-hero-subtitle">
          Stay informed with the latest updates from the crypto world
        </p>
      </div>
    </div>

    <div class="container pt-4">
      <div v-if="loadError" class="alert alert-theme small mb-3" role="alert">
        {{ loadError }}
      </div>

      <LoadingSpinner v-if="loading" message="Loading news..." />

      <template v-else>
        <div class="filter-bar mb-4">
          <div class="filter-row gap-3">
            <SearchBar
              v-model="searchQuery"
              placeholder="Search by title..."
              class="flex-grow-1"
            />
            <select
              v-model="selectedCategory"
              class="filter-select"
            >
              <option value="">All categories</option>
              <option
                v-for="cat in categories"
                :key="cat.category"
                :value="cat.category"
              >
                {{ cat.category }} ({{ cat.count }})
              </option>
            </select>
            <select
              v-model="selectedDate"
              class="filter-select"
            >
              <option value="">All time</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
            </select>
            <button
              v-if="searchQuery || selectedCategory || selectedDate"
              class="filter-clear"
              @click="searchQuery = ''; selectedCategory = ''; selectedDate = ''"
            >
              <X :size="16" /> Clear
            </button>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-12">
            <div
              v-if="featuredArticle && !searchQuery && !selectedCategory"
              class="mb-4"
            >
              <RouterLink
                :to="{ name: 'NewsDetail', params: { id: featuredArticle.id } }"
                class="text-decoration-none"
              >
                <article class="featured-article card-crypto overflow-hidden">
                  <div class="row g-0">
                    <div class="col-12 col-md-6">
                      <img
                        :src="featuredArticle.image_url"
                        :alt="featuredArticle.title"
                        class="featured-img w-100 h-100"
                      />
                    </div>
                    <div class="col-12 col-md-6">
                      <div
                        class="featured-content p-4 h-100 d-flex flex-column justify-content-center"
                      >
                        <span class="featured-badge">Featured</span>
                        <span class="blog-category d-inline-block mb-2">{{
                          featuredArticle.category
                        }}</span>
                        <h2 class="featured-title mb-2">
                          {{ featuredArticle.title }}
                        </h2>
                        <p class="featured-excerpt text-secondary mb-3">
                          {{ featuredArticle.summary }}
                        </p>
                        <div
                          class="featured-meta d-flex align-items-center gap-3 text-secondary small"
                        >
                          <span
                            v-if="featuredArticle.author"
                            class="d-flex align-items-center gap-2"
                          >
                            <img
                              v-if="featuredArticle.author.avatar"
                              :src="featuredArticle.author.avatar"
                              :alt="featuredArticle.author.name"
                              class="author-avatar rounded-circle"
                              width="24"
                              height="24"
                            />
                            {{ featuredArticle.author.name }}
                          </span>
                          <span>{{
                            formatDateTime(featuredArticle.date)
                          }}</span>
                          <span v-if="featuredArticle.read_time"
                            >{{ featuredArticle.read_time }} min read</span
                          >
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </RouterLink>
            </div>

            <div
              v-if="filteredArticles.length === 0"
              class="text-center text-secondary py-5"
            >
              No articles match your search.
            </div>

            <div class="row g-4 mb-4">
              <div
                v-for="article in filteredArticles"
                :key="article.id"
                class="col-12 col-md-6 col-lg-4"
              >
                <article
                  class="blog-card card-crypto card-hover-lift h-100 overflow-hidden d-flex flex-column"
                >
                  <RouterLink
                    :to="{ name: 'NewsDetail', params: { id: article.id } }"
                    class="blog-card-link text-decoration-none flex-grow-1 d-flex flex-column"
                  >
                    <img
                      :src="article.image_url"
                      :alt="article.title"
                      class="blog-img w-100"
                      loading="lazy"
                    />
                    <div class="blog-card-body p-2 flex-grow-1">
                      <div
                        class="blog-card-header d-flex justify-content-between align-items-center gap-2 mb-2"
                      >
                        <span class="blog-category">{{
                          article.category
                        }}</span>
                        <span class="blog-date text-secondary small">{{
                          formatDate(article.date)
                        }}</span>
                      </div>
                      <h3 class="blog-title h5 mb-2">{{ article.title }}</h3>
                      <div
                        v-if="article.source_name"
                        class="blog-meta small text-secondary mb-2"
                      >
                        {{ article.source_name }}
                        <span v-if="article.read_time">
                          · {{ article.read_time }} min read</span
                        >
                      </div>
                      <p class="blog-excerpt small text-secondary mb-0">
                        {{ article.summary }}
                      </p>
                    </div>
                  </RouterLink>
                  <div
                    class="blog-footer px-3 pb-3 d-flex justify-content-between align-items-center"
                  >
                    <NewsReactions :article-id="article.id" />
                  </div>
                </article>
              </div>
            </div>

            <nav
              v-if="!searchQuery && !selectedCategory"
              class="pagination-wrap mt-4"
              aria-label="News pagination"
            >
              <ul class="pagination justify-content-center mb-0">
                <li class="page-item" :class="{ disabled: page <= 1 || pageLoading }">
                  <button class="page-link page-prev" type="button" :disabled="pageLoading" @click="goTo(page - 1)">
                    <ChevronLeft :size="16" />
                    Prev
                  </button>
                </li>
                <li
                  v-for="(p, i) in visiblePages"
                  :key="i"
                  class="page-item"
                  :class="{ active: p === page, disabled: p === '...' }"
                >
                  <button
                    v-if="p !== '...'"
                    class="page-link"
                    type="button"
                    :disabled="pageLoading"
                    @click="goTo(p)"
                  >{{ p }}</button>
                  <span v-else class="page-link page-dots"><MoreHorizontal :size="16" /></span>
                </li>
                <li class="page-item" :class="{ disabled: page >= totalPages || pageLoading }">
                  <button class="page-link page-next" type="button" :disabled="pageLoading" @click="goTo(page + 1)">
                    Next
                    <ChevronRight :size="16" />
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.news-page { padding-top: 0; }

.news-hero {
  position: relative; width: 100%; min-height: 140px;
  background-size: cover; background-position: center;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.news-hero::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  opacity: 0.4;
  z-index: 2;
}
.news-hero-overlay {
  position: absolute; inset: 0;
  background: var(--hero-overlay);
  transition: background var(--transition);
}
.news-hero-content {
  position: relative; z-index: 1;
  text-align: center; padding: 50px 20px 40px;
}
.news-hero-title {
  font-size: 42px; font-weight: 800; color: var(--hero-text);
  margin-bottom: 12px; letter-spacing: -0.5px;
  text-shadow: 0 2px 12px rgba(0,0,0,0.3);
  transition: color var(--transition);
}
.news-hero-subtitle {
  font-size: 18px; color: var(--hero-text-secondary);
  max-width: 560px; margin: 0 auto;
  line-height: 1.5;
  transition: color var(--transition);
}
@media (max-width: 767.98px) {
  .news-hero { min-height: 100px; }
  .news-hero-content { padding: 30px 16px 24px; }
  .news-hero-title { font-size: 22px; }
  .news-hero-subtitle { font-size: 13px; }
}

.featured-article {
  border-radius: 16px; overflow: hidden; transition: all 0.35s ease;
  border: 1px solid var(--border-color);
}
.featured-article:hover {
  transform: translateY(-5px);
  border-color: var(--accent);
  box-shadow: 0 0 32px rgba(255, 200, 55, 0.18), 0 16px 48px rgba(0,0,0,0.45);
}
.featured-img { object-fit: cover; min-height: 300px; }

.featured-content {
  background: var(--bg-card);
  border: none;
}

.featured-badge {
  display: inline-block;
  background: var(--accent-gradient);
  color: var(--accent-text);
  padding: 4px 14px; border-radius: 20px;
  font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 1.5px;
  margin-bottom: 12px;
  box-shadow: 0 0 12px rgba(255,200,55,0.35);
}

.featured-title {
  font-size: 24px; font-weight: 800; line-height: 1.3;
  color: var(--text-emphasis);
  transition: color 0.3s ease;
}
.featured-article:hover .featured-title { color: var(--accent); }
.featured-excerpt { font-size: 15px; line-height: 1.6; }
.author-avatar { object-fit: cover; }

.blog-card {
  background: var(--bg-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  transition: all 0.3s ease;
}
.blog-card:hover {
  transform: translateY(-5px);
  border-color: var(--accent);
  box-shadow: 0 0 24px rgba(255,200,55,0.14), 0 8px 32px rgba(0,0,0,0.35);
}
.blog-card-link { color: inherit; }

.blog-img {
  height: 200px; object-fit: cover;
  border-bottom: 1px solid var(--border-color);
  transition: transform 0.4s ease;
}
.blog-card:hover .blog-img { transform: scale(1.05); }
.blog-card .blog-card-body { padding: 1rem; }
.blog-card-header { margin-bottom: 12px; }

.blog-category {
  background: var(--accent-gradient);
  color: var(--accent-text);
  padding: 4px 12px; border-radius: 20px;
  font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.8px;
  box-shadow: 0 0 8px rgba(255,200,55,0.2);
}

.blog-date { color: var(--text-secondary); font-size: 13px; }
.blog-title {
  color: var(--text-emphasis);
  font-size: 1.05rem;
  font-weight: 700; margin-bottom: 10px; line-height: 1.4;
  transition: color 0.3s ease;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.blog-card:hover .blog-title { color: var(--accent); }
.blog-meta { color: var(--text-secondary); font-style: italic; font-size: 13px; }
.blog-excerpt { color: var(--text-primary); font-size: 14px; line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.blog-footer { border-top: 1px solid var(--border-color); padding: 14px 1rem; }

.tag-badge { opacity: 0.7; transition: opacity 0.2s ease; }
.tag-badge:hover { opacity: 1; }

.sidebar-card { border-radius: 16px; overflow: hidden; }
.sidebar-header {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}
.sidebar-title { font-size: 16px; font-weight: 700; color: var(--text-emphasis); }
.trending-icon { margin-right: 6px; }
.trending-list { display: flex; flex-direction: column; }

.trending-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
  transition: all 0.2s ease;
}
.trending-item:last-child { border-bottom: none; padding-bottom: 0; }
.trending-item:hover { transform: translateX(4px); }

.trending-number {
  font-size: 20px; font-weight: 800;
  color: rgba(102, 126, 234, 0.5);
  min-width: 28px;
}

.trending-title {
  color: var(--text-emphasis);
  font-weight: 600; line-height: 1.4; margin-bottom: 4px;
  transition: color 0.2s ease;
}
.trending-item:hover .trending-title { color: #667eea; }
.trending-meta { font-size: 12px; }

.filter-bar {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 12px 16px;
  backdrop-filter: blur(10px);
}
.filter-row {
  display: flex; align-items: center; gap: 12px;
}
.filter-row .search-bar { min-width: 0; }
.filter-clear {
  flex-shrink: 0;
  white-space: nowrap;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 14px; font-weight: 600;
  cursor: pointer; padding: 6px 10px;
  border-radius: 8px;
  transition: all 0.2s ease;
}
.filter-clear:hover {
  color: var(--accent);
  background: var(--accent-bg-subtle);
}
.filter-select {
  flex-shrink: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 8px 32px 8px 14px;
  border-radius: 10px;
  font-size: 14px; font-weight: 600;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23f0b90b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  transition: border-color 0.2s ease;
  outline: none;
}
.filter-select:hover {
  border-color: var(--accent);
}
.filter-select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(240,185,11,0.15);
}
.filter-select option {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.pagination-wrap { display: flex; justify-content: center; }
.pagination { gap: 4px; }
.page-item { list-style: none; }
.pagination .page-link {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 8px 14px; border-radius: 10px;
  background: var(--bg-card); color: var(--text-primary);
  border: 1px solid var(--border-color);
  font-size: 14px; font-weight: 600;
  transition: all 0.25s ease; cursor: pointer;
  text-decoration: none; outline: none;
}
.pagination .page-link:hover {
  background: var(--accent-bg-subtle);
  border-color: var(--accent); color: var(--accent);
  transform: translateY(-2px);
}
.page-item.active .page-link {
  background: var(--accent-gradient);
  border-color: transparent; color: var(--accent-text);
  box-shadow: 0 4px 20px rgba(255, 200, 55, 0.4);
  transform: translateY(-2px);
  font-weight: 800;
}
.page-item.disabled .page-link {
  opacity: 0.4; cursor: not-allowed; pointer-events: none;
  transform: none; box-shadow: none;
}
.page-dots { letter-spacing: 2px; background: transparent; border-color: transparent; cursor: default; }
.page-prev:hover svg, .page-next:hover svg { transform: scale(1.15); transition: transform 0.2s ease; }
.page-prev svg, .page-next svg { transition: transform 0.2s ease; }

@media (max-width: 575.98px) {
  .page-link { padding: 6px 10px; font-size: 12px; }
  .page-next span, .page-prev span { display: none; }
}
@media (max-width: 991.98px) {
  .featured-img { min-height: 220px; }
  .featured-title { font-size: 20px; }
}
</style>
