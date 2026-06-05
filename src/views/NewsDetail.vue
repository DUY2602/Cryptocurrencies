<script>
import { fetchNewsById } from "../services/news.js";
import NewsLikeButton from "../components/NewsLikeButton.vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import EmptyState from "../components/EmptyState.vue";
import { getComments, postComment, removeComment } from "../composables/useComments.js";
import { user } from "../composables/useAuth.js";

export default {
  components: { NewsLikeButton, LoadingSpinner, EmptyState },
  data() {
    return {
      article: null,
      loading: true,
      error: null,
      newComment: '',
      submitting: false,
      comments: [],
    }
  },
  watch: {
    "$route.params.id": {
      immediate: true,
      handler() {
        this.loadArticle()
      },
    },
  },
  methods: {
    async loadArticle() {
      this.loading = true
      this.error = null
      this.article = null
      try {
        this.article = await fetchNewsById(this.$route.params.id)
        if (!this.article) {
          this.error = "Article not found"
        } else {
          this.comments = await getComments(this.article.id)
        }
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },
    submitComment() {
      if (!this.newComment.trim() || !this.article || !this.user) return
      this.submitting = true
      postComment(this.article.id, this.newComment, this.user).then((comment) => {
        this.submitting = false
        if (comment) {
          this.newComment = ''
          this.comments = [...this.comments, comment]
        }
      })
    },
    removeComment(comment) {
      removeComment(comment.id, this.user).then((ok) => {
        if (ok) {
          this.comments = this.comments.filter((c) => c.id !== comment.id)
        }
      })
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString("en-AU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    },
  },
}
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
          aria-label="Go back"
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
            <span class="blog-category" role="status">{{ article.category }}</span>
            <time class="text-secondary small" :datetime="article.date">{{ formatDate(article.date) }}</time>
            <span v-if="article.source_name" class="text-secondary small"
              >· {{ article.source_name }}</span
            >
          </div>
          <h1 class="page-title">{{ article.title }}</h1>
        </header>

        <div
          class="article-body text-secondary"
          v-html="article.full_content"
          role="article"
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

        <section class="comments-section mt-5" aria-labelledby="commentsHeading">
          <h2 id="commentsHeading" class="h4 mb-3">Comments</h2>

          <div v-if="comments.length === 0" class="text-secondary small mb-4">
            No comments yet.
          </div>

          <div class="comments-list mb-4">
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="comment-card card-crypto card-hover-lift p-3 mb-2"
            >
              <div class="d-flex justify-content-between align-items-start gap-2">
                <div>
                  <strong class="comment-author">{{ comment.userName }}</strong>
                  <span class="text-secondary small ms-2">
                    <time :datetime="comment.createdAt">{{ formatDate(comment.createdAt) }}</time>
                  </span>
                </div>
                <button
                  v-if="user && comment.userId === user.id"
                  type="button"
                  class="btn btn-sm btn-outline-accent py-0 px-2"
                  aria-label="Delete comment by {{ comment.userName }}"
                  @click="removeComment(comment)"
                >
                  ×
                </button>
              </div>
              <p class="mb-0 mt-2 text-secondary">{{ comment.text }}</p>
            </div>
          </div>

          <form
            v-if="user"
            class="comment-form"
            @submit.prevent="submitComment"
            aria-label="Add a comment"
          >
            <label for="newComment" class="form-label visually-hidden">Your comment</label>
            <textarea
              id="newComment"
              v-model="newComment"
              class="form-control mb-2"
              rows="3"
              placeholder="Write a comment..."
              :disabled="submitting"
              aria-required="true"
            ></textarea>
            <button
              type="submit"
              class="btn btn-accent btn-sm"
              :disabled="submitting || !newComment.trim()"
            >
              {{ submitting ? 'Posting...' : 'Post comment' }}
            </button>
          </form>
        </section>
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

.comment-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.comment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.comment-author {
  color: var(--text-emphasis);
}
</style>
