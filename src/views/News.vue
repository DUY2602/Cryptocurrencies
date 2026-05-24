<script>
import { fetchNews } from "../services/news.js";
import SearchBar from "../components/SearchBar.vue";
import Pagination from "../components/Pagination.vue";
import NewsLikeButton from "../components/NewsLikeButton.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";

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
    };
  },
  computed: {
    filteredArticles() {
      const q = this.searchQuery.trim().toLowerCase();
      if (!q) return this.articles;
      return this.articles.filter((article) => {
        const dateStr = String(article.date).toLowerCase();
        const title = article.title.toLowerCase();
        const summary = (article.summary || "").toLowerCase();
        const full = (article.full_content || "").toLowerCase();
        const category = article.category.toLowerCase();
        const source = (article.source_name || "").toLowerCase();
        return (
          title.includes(q) ||
          summary.includes(q) ||
          full.includes(q) ||
          category.includes(q) ||
          dateStr.includes(q) ||
          source.includes(q)
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
    filteredArticles() {
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }
    },
  },
  async mounted() {
    try {
      this.articles = await fetchNews();
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
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString("en-AU", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
  },
};
</script>

<template>
  <section class="page-section">
    <div class="container">
      <h1 class="page-title">Crypto News</h1>
      <p class="page-subtitle">
        Browse headlines — click a card for the full article.
      </p>

      <div v-if="loadError" class="alert alert-theme small mb-3" role="alert">
        {{ loadError }}
      </div>

      <div class="row mb-4">
        <div class="col-12 col-md-8 col-lg-6">
          <SearchBar
            v-model="searchQuery"
            label="Search articles"
            placeholder="Search title, summary, category, or date..."
          />
        </div>
      </div>

      <LoadingSpinner v-if="loading" message="Loading news..." />

      <template v-else>
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
                <div class="blog-card-body p-3 flex-grow-1">
                  <div
                    class="blog-card-header d-flex justify-content-between align-items-center gap-2 mb-2"
                  >
                    <span class="blog-category">{{ article.category }}</span>
                    <span class="blog-date text-secondary small">{{
                      formatDate(article.date)
                    }}</span>
                  </div>
                  <h3 class="blog-title h5 mb-2">{{ article.title }}</h3>
                  <p
                    v-if="article.source_name"
                    class="blog-meta small text-secondary mb-2"
                  >
                    {{ article.source_name }}
                  </p>
                  <p class="blog-excerpt small text-secondary mb-0">
                    {{ article.summary }}
                  </p>
                </div>
              </RouterLink>
              <div class="blog-footer px-3 pb-3">
                <NewsLikeButton :article-id="article.id" />
              </div>
            </article>
          </div>
        </div>

        <Pagination
          :current-page="currentPage"
          :total-pages="totalPages"
          @page-change="onPageChange"
        />
      </template>
    </div>
  </section>
</template>

<style scoped>
.blog-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.05)
  );
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.blog-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.blog-card-link {
  color: inherit;
}

.blog-img {
  height: 200px;
  object-fit: cover;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.blog-card-header {
  margin-bottom: 12px;
}

.blog-category {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.blog-date {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.blog-title {
  color: white;
  font-weight: 700;
  margin-bottom: 8px;
  line-height: 1.4;
  transition: color 0.3s ease;
}

.blog-card:hover .blog-title {
  color: #667eea;
}

.blog-meta {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.blog-excerpt {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.blog-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
