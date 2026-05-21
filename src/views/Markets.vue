<script>
import { coins } from '../data/coins.js'
import CoinTable from '../components/CoinTable.vue'
import SearchBar from '../components/SearchBar.vue'
import Pagination from '../components/Pagination.vue'

const ITEMS_PER_PAGE = 6

export default {
  components: {
    CoinTable,
    SearchBar,
    Pagination,
  },
  data() {
    return {
      allCoins: coins,
      searchQuery: '',
      currentPage: 1,
      itemsPerPage: ITEMS_PER_PAGE,
    }
  },
  computed: {
    filteredCoins() {
      const q = this.searchQuery.trim().toLowerCase()
      if (!q) return this.allCoins
      return this.allCoins.filter(
        (coin) =>
          coin.name.toLowerCase().includes(q) ||
          coin.symbol.toLowerCase().includes(q)
      )
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredCoins.length / this.itemsPerPage))
    },
    paginatedCoins() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      return this.filteredCoins.slice(start, start + this.itemsPerPage)
    },
  },
  watch: {
    searchQuery() {
      this.currentPage = 1
    },
    filteredCoins() {
      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages
      }
    },
  },
  methods: {
    onPageChange(page) {
      this.currentPage = page
    },
  },
}
</script>

<template>
  <section class="page-section">
    <div class="container">
      <h1 class="page-title">Markets</h1>
      <p class="page-subtitle">
        Overview of cryptocurrency prices, market cap, and 24h change — local fake data.
      </p>

      <div class="row mb-4">
        <div class="col-12 col-md-6 col-lg-4">
          <SearchBar
            v-model="searchQuery"
            label="Search coins"
            placeholder="Search by name or symbol..."
          />
        </div>
        <div class="col-12 col-md-6 col-lg-8 d-flex align-items-end justify-content-md-end">
          <p class="text-secondary small mb-0">
            Showing {{ paginatedCoins.length }} of {{ filteredCoins.length }} coins
          </p>
        </div>
      </div>

      <CoinTable :coins="paginatedCoins" />

      <div class="mt-4">
        <Pagination
          :current-page="currentPage"
          :total-pages="totalPages"
          @page-change="onPageChange"
        />
      </div>
    </div>
  </section>
</template>
