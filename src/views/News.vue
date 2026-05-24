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

        <div class="d-lg-none row g-3 mb-4">
          <div
            v-for="article in paginatedArticles"
            :key="article.id"
            class="col-12 col-sm-6"
          >
            <article class="card card-crypto h-100">
              <img
                v-if="article.image_url"
                :src="article.image_url"
                :alt="article.title"
                class="card-img-top"
                style="max-height: 140px; object-fit: cover"
              />
              <div class="card-body">
                <div
                  class="d-flex justify-content-between align-items-start mb-2"
                >
                  <span class="badge badge-category">{{
                    article.category
                  }}</span>
                  <small class="text-secondary">{{
                    formatDate(article.date)
                  }}</small>
                </div>
                <h5 class="card-title news-title">{{ article.title }}</h5>
                <p v-if="article.source_name" class="small text-secondary mb-1">
                  {{ article.source_name }}
                </p>
                <div
                  class="card-text text-secondary small mb-2"
                  v-html="article.content"
                ></div>
                <NewsLikeButton :article-id="article.id" />
              </div>
            </article>
          </div>
        </div>

        <div
          class="d-none d-lg-block table-responsive rounded-3 border border-secondary border-opacity-25 mb-4"
        >
          <table class="table table-hover table-dark-custom mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th>Content</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="article in paginatedArticles"
                :key="'table-' + article.id"
              >
                <td class="text-secondary text-nowrap">
                  {{ formatDate(article.date) }}
                </td>
                <td class="fw-semibold">{{ article.title }}</td>
                <td>
                  <span class="badge badge-category">{{
                    article.category
                  }}</span>
                </td>
                <td class="text-secondary small">
                  <div class="mb-2" v-html="article.content"></div>
                  <NewsLikeButton :article-id="article.id" />
                </td>
              </tr>
            </tbody>
          </table>
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
