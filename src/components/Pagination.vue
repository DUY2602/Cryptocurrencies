<script>
export default {
  props: {
    currentPage: { type: Number, required: true },
    totalPages: { type: Number, required: true },
  },
  emits: ['page-change'],
  computed: {
    pages() {
      const pages = []
      for (let i = 1; i <= this.totalPages; i++) pages.push(i)
      return pages
    },
    showPagination() {
      return this.totalPages > 1
    },
  },
  methods: {
    goTo(page) {
      if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
        this.$emit('page-change', page)
      }
    },
  },
}
</script>

<template>
  <nav v-if="showPagination" class="pagination-nav" aria-label="Pagination">
    <ul class="pagination pagination-sm justify-content-center mb-0">
      <li class="page-item" :class="{ disabled: currentPage === 1 }">
        <button class="page-link" type="button" @click="goTo(currentPage - 1)">Prev</button>
      </li>
      <li
        v-for="page in pages"
        :key="page"
        class="page-item"
        :class="{ active: page === currentPage }"
      >
        <button class="page-link" type="button" @click="goTo(page)">{{ page }}</button>
      </li>
      <li class="page-item" :class="{ disabled: currentPage === totalPages }">
        <button class="page-link" type="button" @click="goTo(currentPage + 1)">Next</button>
      </li>
    </ul>
  </nav>
</template>
