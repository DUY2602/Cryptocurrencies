<script>
import { fetchNews } from "../services/news.js";
import SearchBar from "../components/SearchBar.vue";
import Pagination from "../components/Pagination.vue";
import NewsLikeButton from "../components/NewsLikeButton.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";

const ITEMS_PER_PAGE = 4;

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
      selectedArticle: null,
      showModal: false,
    };
  },
  computed: {
    filteredArticles() {
      const q = this.searchQuery.trim().toLowerCase();
      if (!q) return this.articles;
      return this.articles.filter((article) => {
        const dateStr = String(article.date).toLowerCase();
        const title = article.title.toLowerCase();
        const content = article.content.toLowerCase();
        const category = article.category.toLowerCase();
        const source = (article.source_name || "").toLowerCase();
        return (
          title.includes(q) ||
          content.includes(q) ||
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
    openArticle(article) {
      this.selectedArticle = article;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.selectedArticle = null;
    },
  },
};
</script>

<template>
  <section class="page-section">
    <div class="container">
      <h1 class="page-title">Crypto News</h1>
      <p class="page-subtitle">
        Headlines from local data — search by title, content, category, or date.
      </p>

      <div v-if="loadError" class="alert alert-theme small mb-3" role="alert">
        {{ loadError }}
      </div>

      <div class="row mb-4">
        <div class="col-12 col-md-8 col-lg-6">
          <SearchBar
            v-model="searchQuery"
            label="Search articles"
            placeholder="Search title, content, category, or date..."
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
            <article class="blog-card h-100" @click="openArticle(article)">
              <div class="blog-card-header">
                <span class="blog-category">{{ article.category }}</span>
                <span class="blog-date">{{ formatDate(article.date) }}</span>
              </div>
              <h3 class="blog-title">{{ article.title }}</h3>
              <p class="blog-meta" v-if="article.source_name">
                {{ article.source_name }}
              </p>
              <p class="blog-excerpt" v-html="article.content"></p>
              <div class="blog-footer">
                <NewsLikeButton :article-id="article.id" @click.stop />
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

    <!-- Article Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeModal">&times;</button>
        <div v-if="selectedArticle" class="article-detail">
          <div class="article-header">
            <span class="article-category">{{ selectedArticle.category }}</span>
            <span class="article-date">{{
              formatDate(selectedArticle.date)
            }}</span>
          </div>
          <h2 class="article-title">{{ selectedArticle.title }}</h2>
          <p v-if="selectedArticle.source_name" class="article-source">
            {{ selectedArticle.source_name }}
          </p>
          <div class="article-body" v-html="selectedArticle.content"></div>
          <div class="article-footer">
            <NewsLikeButton :article-id="selectedArticle.id" />
            <a
              v-if="selectedArticle.source_url"
              :href="selectedArticle.source_url"
              target="_blank"
              class="btn btn-outline-light btn-sm"
            >
              Read More
            </a>
          </div>
        </div>
      </div>
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
  padding: 24px;
  transition: all 0.3s ease;
}

.blog-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.blog-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.blog-category {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.blog-date {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.blog-title {
  color: white;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
  line-height: 1.4;
  transition: color 0.3s ease;
}

.blog-card:hover .blog-title {
  color: #667eea;
}

.blog-meta {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  margin-bottom: 16px;
  font-style: italic;
}

.blog-excerpt {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 20px;
}

.blog-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: linear-gradient(
    135deg,
    rgba(30, 30, 40, 0.95),
    rgba(20, 20, 30, 0.95)
  );
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  font-size: 32px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.article-detail {
  padding: 40px;
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.article-category {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.article-date {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.article-title {
  color: white;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 16px;
  line-height: 1.3;
}

.article-source {
  color: rgba(255, 255, 255, 0.5);
  font-size: 15px;
  margin-bottom: 24px;
  font-style: italic;
}

.article-body {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 32px;
}

.article-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
