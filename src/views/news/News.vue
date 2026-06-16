<script>
import { fetchNews } from "../../services/news.js";
import SearchBar from "../../components/SearchBar.vue";
import Pagination from "../../components/Pagination.vue";
import NewsLikeButton from "../../components/NewsLikeButton.vue";
import LoadingSpinner from "../../components/LoadingSpinner.vue";

const ITEMS_PER_PAGE = 6;

export default {
  components: {
    SearchBar,
    Pagination,
    NewsLikeButton,
    LoadingSpinner,
  },
  data() {
    return {
      articles: [],
      searchQuery: "",
      currentPage: 1,
      itemsPerPage: ITEMS_PER_PAGE,
      loading: true,
      loadError: null,
      selectedCategory: null,
    };
  },
  computed: {
    categories() {
      const cats = new Set(this.articles.map((a) => a.category));
      return Array.from(cats).sort();
    },
    featuredArticle() {
      return this.articles.find((a) => a.featured);
    },
    trendingArticles() {
      return this.articles.filter((a) => a.trending).slice(0, 5);
    },
    filteredArticles() {
      let articles = this.articles.filter((a) => !a.featured);

      if (this.selectedCategory) {
        articles = articles.filter((a) => a.category === this.selectedCategory);
      }

      const q = this.searchQuery.trim().toLowerCase();
      if (!q) return articles;

      return articles.filter((article) => {
        const dateStr = String(article.date).toLowerCase();
        const title = article.title.toLowerCase();
        const summary = (article.summary || "").toLowerCase();
        const full = (article.full_content || "").toLowerCase();
        const category = article.category.toLowerCase();
        const source = (article.source_name || "").toLowerCase();
        const tags = (article.tags || []).join(" ").toLowerCase();
        return (
          title.includes(q) ||
          summary.includes(q) ||
          full.includes(q) ||
          category.includes(q) ||
          dateStr.includes(q) ||
          source.includes(q) ||
          tags.includes(q)
        );
      });
    },
    totalPages() {
      return Math.max(
        1,
        Math.ceil(this.filteredArticles.length / this.itemsPerPage),
      );
    },
    paginatedArticles() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      return this.filteredArticles.slice(start, start + this.itemsPerPage);
    },
  },
  watch: {
    searchQuery() {
      this.currentPage = 1;
    },
    selectedCategory() {
      this.currentPage = 1;
    },
    filteredArticles() {
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }
    },
  },
  async mounted() {
    try {
      this.articles = await fetchNews();
      if (this.$route.query.q) {
        this.searchQuery = this.$route.query.q;
      }
    } catch (e) {
      this.loadError = e.message;
    } finally {
      this.loading = false;
    }
  },
  methods: {
    onPageChange(page) {
      this.currentPage = page;
    },
    selectCategory(category) {
      this.selectedCategory =
        this.selectedCategory === category ? null : category;
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
    <div class="container">
      <div class="page-header mb-4">
        <h1 class="page-title">Crypto News</h1>
        <p class="page-subtitle">
          Stay informed with the latest updates from the crypto world
        </p>
      </div>

      <div v-if="loadError" class="alert alert-theme small mb-3" role="alert">
        {{ loadError }}
      </div>

      <LoadingSpinner v-if="loading" message="Loading news..." />

      <template v-else>
        <div class="row mb-4">
          <div class="col-12 col-md-8 col-lg-6">
            <SearchBar
              v-model="searchQuery"
              label="Search articles"
              placeholder="Search title, summary, category, or tags..."
            />
          </div>
        </div>

        <div class="row g-4">
          <div class="col-12 col-lg-8">
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

            <div class="category-filters d-flex flex-wrap gap-2 mb-4">
              <button
                v-for="cat in categories"
                :key="cat"
                type="button"
                class="btn btn-sm"
                :class="
                  selectedCategory === cat ? 'btn-accent' : 'btn-outline-accent'
                "
                @click="selectCategory(cat)"
              >
                {{ cat }}
              </button>
            </div>

            <div
              v-if="paginatedArticles.length === 0"
              class="text-center text-secondary py-5"
            >
              No articles match your search.
            </div>

            <div class="row g-4 mb-4">
              <div
                v-for="article in paginatedArticles"
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
                    <NewsLikeButton :article-id="article.id" />
                    <div
                      v-if="article.tags && article.tags.length"
                      class="article-tags d-flex gap-1 flex-wrap"
                    >
                      <span
                        v-for="tag in article.tags.slice(0, 2)"
                        :key="tag"
                        class="tag-badge small text-secondary"
                      >
                        #{{ tag }}
                      </span>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @page-change="onPageChange"
            />
          </div>

          <div class="col-12 col-lg-4">
            <aside class="sidebar">
              <div
                v-if="trendingArticles.length"
                class="sidebar-card card-crypto mb-4"
              >
                <div
                  class="sidebar-header p-3 border-bottom border-secondary border-opacity-25"
                >
                  <h4 class="sidebar-title mb-0">
                    <span class="trending-icon">🔥</span> Trending Now
                  </h4>
                </div>
                <div class="sidebar-body p-3">
                  <div class="trending-list">
                    <RouterLink
                      v-for="(article, index) in trendingArticles"
                      :key="article.id"
                      :to="{ name: 'NewsDetail', params: { id: article.id } }"
                      class="trending-item d-flex gap-3 text-decoration-none mb-3"
                    >
                      <span class="trending-number">{{ index + 1 }}</span>
                      <div class="trending-content flex-grow-1">
                        <h5 class="trending-title small mb-1">
                          {{ article.title }}
                        </h5>
                        <span class="trending-meta text-secondary small">{{
                          formatDate(article.date)
                        }}</span>
                      </div>
                    </RouterLink>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.news-page { padding-top: 40px; }
.page-header { text-align: center; }

.featured-article { border-radius: 16px; overflow: hidden; transition: all 0.3s ease; }
.featured-article:hover { transform: translateY(-4px); box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4); }
.featured-img { object-fit: cover; min-height: 300px; }

.featured-content {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
}

.featured-badge {
  display: inline-block;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 4px 12px; border-radius: 20px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1px;
  margin-bottom: 12px;
}

.featured-title {
  font-size: 24px; font-weight: 800; line-height: 1.3;
  color: var(--text-emphasis);
  transition: color 0.3s ease;
}
.featured-article:hover .featured-title { color: #667eea; }
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
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow: var(--shadow);
}
.blog-card-link { color: inherit; }

.blog-img {
  height: 150px; object-fit: cover;
  border-bottom: 1px solid var(--border-color);
}
.blog-card-header { margin-bottom: 12px; }

.blog-category {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px; border-radius: 20px;
  font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.5px;
}

.blog-date { color: var(--text-secondary); font-size: 12px; }
.blog-title {
  color: var(--text-emphasis);
  font-weight: 700; margin-bottom: 8px; line-height: 1.4;
  transition: color 0.3s ease;
}
.blog-card:hover .blog-title { color: #667eea; }
.blog-meta { color: var(--text-secondary); font-style: italic; }
.blog-excerpt { color: var(--text-primary); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.blog-footer { border-top: 1px solid var(--border-color); padding-top: 12px; }

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

.category-filters .btn { transition: all 0.2s ease; }

@media (max-width: 991.98px) {
  .featured-img { min-height: 220px; }
  .featured-title { font-size: 20px; }
}
</style>
