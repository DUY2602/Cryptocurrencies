<script>
import newsData from '../data/news.json'
import SearchBar from '../components/SearchBar.vue'
import Pagination from '../components/Pagination.vue'
import NewsLikeButton from '../components/NewsLikeButton.vue'

const ITEMS_PER_PAGE = 4

export default {
  components: {
    SearchBar,
    Pagination,
    NewsLikeButton,
  },
  data() {
    return {
      articles: newsData,
      searchQuery: '',
      currentPage: 1,
      itemsPerPage: ITEMS_PER_PAGE,
    }
  },
  computed: {
    filteredArticles() {
      const q = this.searchQuery.trim().toLowerCase()
      if (!q) return this.articles
      return this.articles.filter((article) => {
        const dateStr = article.date.toLowerCase()
        const title = article.title.toLowerCase()
        const content = article.content.toLowerCase()
        const category = article.category.toLowerCase()
        return (
          title.includes(q) ||
          content.includes(q) ||
          category.includes(q) ||
          dateStr.includes(q)
        )
      })
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredArticles.length / this.itemsPerPage))
    },
    paginatedArticles() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      return this.filteredArticles.slice(start, start + this.itemsPerPage)
    },
  },
  watch: {
    searchQuery() {
      this.currentPage = 1
    },
    filteredArticles() {
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages
      }
    },
  },
  methods: {
    onPageChange(page) {
      this.currentPage = page
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },
  },
}
</script>

<template>
  <section class="page-section">
    <div class="container">
      <h1 class="page-title">Crypto News</h1>
      <p class="page-subtitle">
        Latest headlines loaded from local JSON — search by title, content, category, or date.
      </p>

      <div class="row mb-4">
        <div class="col-12 col-md-8 col-lg-6">
          <SearchBar
            v-model="searchQuery"
            label="Search articles"
            placeholder="Search title, content, category, or date..."
          />
        </div>
      </div>

      <div v-if="paginatedArticles.length === 0" class="text-center text-secondary py-5">
        No articles match your search.
      </div>

      <!-- Card layout: mobile & tablet -->
      <div class="d-lg-none row g-3 mb-4">
        <div v-for="article in paginatedArticles" :key="article.id" class="col-12 col-sm-6">
          <article class="card card-crypto news-card h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="badge badge-category">{{ article.category }}</span>
                <small class="text-secondary">{{ formatDate(article.date) }}</small>
              </div>
              <h5 class="card-title news-title">{{ article.title }}</h5>
              <p class="card-text text-secondary small mb-2">{{ article.content }}</p>
              <NewsLikeButton :article-id="article.id" />
            </div>
          </article>
        </div>
      </div>

      <!-- Table layout: desktop -->
      <div class="d-none d-lg-block table-responsive rounded-3 border border-secondary border-opacity-25 mb-4">
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
            <tr v-for="article in paginatedArticles" :key="'table-' + article.id">
              <td class="text-secondary text-nowrap">{{ formatDate(article.date) }}</td>
              <td class="fw-semibold">{{ article.title }}</td>
              <td><span class="badge badge-category">{{ article.category }}</span></td>
              <td class="text-secondary small">
                <p class="mb-2">{{ article.content }}</p>
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
    </div>
  </section>
</template>

