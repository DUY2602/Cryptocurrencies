<script>
import { fetchNewsById } from "../services/news.js";
import NewsLikeButton from "../components/NewsLikeButton.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import EmptyState from "../components/EmptyState.vue";

export default {
  components: { NewsLikeButton, LoadingSpinner, EmptyState },
  data() {
    return {
      article: null,
      loading: true,
      error: null,
    };
  },
  watch: {
    "$route.params.id": {
      immediate: true,
      handler() {
        this.loadArticle();
      },
    },
  },
  methods: {
    async loadArticle() {
      this.loading = true;
      this.error = null;
      this.article = null;
      try {
        this.article = await fetchNewsById(this.$route.params.id);
        if (!this.article) this.error = "Article not found";
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString("en-AU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
  },
};
</script>

<template>
  <section class="page-section article-detail-page">
    <div class="container">
      <LoadingSpinner v-if="loading" message="Loading article..." />

      <EmptyState
        v-else-if="error || !article"
        title="Article not found"
        :message="error || 'This article does not exist.'"
      >
        <RouterLink to="/news" class="btn btn-accent btn-sm mt-3"
          >Back to News</RouterLink
        >
      </EmptyState>

      <article v-else>
        <button
          type="button"
          class="btn btn-outline-accent btn-sm mb-4"
          @click="$router.back()"
        >
          ← Back
        </button>

        <img
          :src="article.image_url"
          :alt="article.title"
          class="article-hero-img w-100 rounded-3 mb-4"
        />

        <header class="mb-4">
          <div class="d-flex flex-wrap gap-2 align-items-center mb-2">
            <span class="blog-category">{{ article.category }}</span>
            <span class="text-secondary small">{{
              formatDate(article.date)
            }}</span>
            <span v-if="article.source_name" class="text-secondary small"
              >· {{ article.source_name }}</span
            >
          </div>
          <h1 class="page-title">{{ article.title }}</h1>
        </header>

        <div
          class="article-body text-secondary"
          v-html="article.full_content"
        ></div>

        <footer
          class="d-flex flex-wrap gap-3 align-items-center mt-4 pt-4 border-top border-secondary border-opacity-25"
        >
          <NewsLikeButton :article-id="article.id" />
          <a
            v-if="article.source_url"
            :href="article.source_url"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-sm btn-outline-accent"
          >
            Read original source
          </a>
        </footer>
      </article>
    </div>
  </section>
</template>

<style scoped>
.article-detail-page {
  padding: 40px 0;
}

.article-hero-img {
  max-height: 400px;
  object-fit: cover;
  width: 100%;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.blog-category {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

article {
  max-width: 900px;
  margin: 0 auto;
}

.article-body {
  font-size: 18px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.85);
}

.article-body :deep(p) {
  margin-bottom: 1.5em;
}

.article-body :deep(h2),
.article-body :deep(h3) {
  color: white;
  margin-top: 2em;
  margin-bottom: 1em;
  font-weight: 700;
}

.article-body :deep(h2) {
  font-size: 24px;
}

.article-body :deep(h3) {
  font-size: 20px;
}

.article-body :deep(ul),
.article-body :deep(ol) {
  margin-bottom: 1.5em;
  padding-left: 2em;
}

.article-body :deep(li) {
  margin-bottom: 0.5em;
}

.article-body :deep(blockquote) {
  border-left: 4px solid #667eea;
  padding-left: 1.5em;
  margin: 1.5em 0;
  font-style: italic;
  color: rgba(255, 255, 255, 0.7);
}

.article-body :deep(a) {
  color: #667eea;
  text-decoration: none;
  transition: color 0.3s ease;
}

.article-body :deep(a:hover) {
  color: #764ba2;
  text-decoration: underline;
}

.article-body :deep(code) {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
}

.article-body :deep(pre) {
  background: rgba(0, 0, 0, 0.3);
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1.5em 0;
}

.article-body :deep(pre code) {
  background: none;
  padding: 0;
}
</style>
