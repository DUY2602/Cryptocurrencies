<script>
import { fetchNews, fetchNewsById } from "../../services/news.js";
import NewsReactions from "../../components/news/NewsReactions.vue";
import LoadingSpinner from "../../components/ui/LoadingSpinner.vue";
import EmptyState from "../../components/ui/EmptyState.vue";
import {
  getComments,
  postComment,
  removeComment,
} from "../../composables/useComments.js";
import { user } from "../../composables/useAuth.js";
import {
  fetchReactionCounts,
  loadUserReactions,
} from "../../composables/useReactions.js";
import { useToast } from "../../composables/useToast.js";

export default {
  components: { NewsReactions, LoadingSpinner, EmptyState },
  setup() {
    return { user, toast: useToast() };
  },
  data() {
    return {
      article: null,
      allArticles: [],
      loading: true,
      error: null,
      newComment: "",
      submitting: false,
      comments: [],
      commentCount: 0,
    };
  },
  computed: {
    relatedArticles() {
      if (!this.article || !this.allArticles.length) return [];
      return this.allArticles
        .filter(
          (a) =>
            a.id !== this.article.id &&
            (a.category === this.article.category ||
              a.tags?.some((tag) => this.article.tags?.includes(tag))),
        )
        .slice(0, 4);
    },
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
        if (!this.article) {
          this.error = "Article not found";
        } else {
          this.comments = await getComments(this.article.id);
          this.commentCount = this.comments.length;
          await Promise.all([
            fetchReactionCounts([this.article.id]),
            loadUserReactions(),
          ]);
        }
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
    submitComment() {
      if (!this.newComment.trim() || !this.article || !this.user) return;
      this.submitting = true;
      postComment(this.article.id, this.newComment, this.user).then(
        (comment) => {
          this.submitting = false;
          if (comment) {
            this.newComment = "";
            this.comments = [...this.comments, comment];
            this.commentCount++;
          } else {
            this.toast.error("Failed to post comment. Please try again.");
          }
        },
      );
    },
      removeComment(comment) {
        removeComment(comment.id, this.user).then((ok) => {
          if (ok) {
            this.comments = this.comments.filter((c) => c.id !== comment.id);
            this.commentCount--;
          }
        });
      },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString("en-AU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },
    formatDateTime(dateStr) {
      return new Date(dateStr).toLocaleString("en-AU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
        <RouterLink to="/news" class="btn btn-accent btn-sm mt-3">
          Back to News
        </RouterLink>
      </EmptyState>

      <article v-else>
        <button
          type="button"
          class="btn btn-outline-accent btn-sm mb-4"
          @click="$router.back()"
          aria-label="Go back"
        >
          <ArrowLeft :size="16" /> Back
        </button>

        <img
          :src="article.image_url"
          :alt="article.title"
          class="article-hero-img w-100 rounded-3 mb-4"
        />

        <header class="article-header mb-4">
          <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
            <span class="blog-category">{{ article.category }}</span>
            <span
              v-if="article.read_time"
              class="read-time-badge text-secondary small"
            >
              {{ article.read_time }} min read
            </span>
          </div>
          <h1 class="page-title mb-3">{{ article.title }}</h1>

          <div
            class="article-meta d-flex flex-wrap gap-4 align-items-center pt-3 border-top border-secondary border-opacity-25"
          >
            <div
              v-if="article.author"
              class="author-section d-flex align-items-center gap-3"
            >
              <img
                v-if="article.author.avatar"
                :src="article.author.avatar"
                :alt="article.author.name"
                class="author-avatar-lg rounded-circle"
                width="48"
                height="48"
              />
              <div class="author-info">
                <div class="author-name fw-bold">{{ article.author.name }}</div>
                <div class="text-secondary small">
                  {{ formatDateTime(article.date) }}
                  <span v-if="article.source_name">
                    · {{ article.source_name }}</span
                  >
                </div>
              </div>
            </div>
            <div v-else class="text-secondary small">
              {{ formatDateTime(article.date) }}
              <span v-if="article.source_name">
                · {{ article.source_name }}</span
              >
            </div>
          </div>
        </header>

        <div
          class="article-body text-secondary"
          v-html="article.full_content"
          role="article"
        ></div>

        <div
          v-if="article.tags && article.tags.length"
          class="article-tags-section mt-5 pt-4 border-top border-secondary border-opacity-25"
        >
          <h5 class="mb-3 text-white">Tags</h5>
          <div class="tags-list d-flex flex-wrap gap-2">
            <RouterLink
              v-for="tag in article.tags"
              :key="tag"
              :to="{ name: 'News', query: { q: tag } }"
              class="tag-item text-decoration-none"
            >
              #{{ tag }}
            </RouterLink>
          </div>
        </div>

        <footer
          class="d-flex flex-wrap gap-3 align-items-center mt-4 pt-4 border-top border-secondary border-opacity-25"
        >
          <NewsReactions :article-id="article.id" />
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

        <section
          class="comments-section mt-5"
          aria-labelledby="commentsHeading"
        >
          <h2 id="commentsHeading" class="h4 mb-3">
            Comments
            <span class="text-secondary small fw-normal ms-1">({{ commentCount }})</span>
          </h2>

          <div v-if="comments.length === 0" class="text-secondary small mb-4">
            No comments yet.
          </div>

          <div class="comments-list mb-4">
            <div
              v-for="comment in comments"
              :key="comment.id"
              class="comment-card card-crypto card-hover-lift p-3 mb-2"
            >
              <div
                class="d-flex justify-content-between align-items-start gap-2"
              >
                <div>
                  <strong class="comment-author">{{ comment.userName }}</strong>
                  <span class="text-secondary small ms-2">
                    <time :datetime="comment.createdAt">{{
                      formatDate(comment.createdAt)
                    }}</time>
                  </span>
                </div>
                <button
                  v-if="user && comment.userId === user.id"
                  type="button"
                  class="btn btn-sm btn-outline-accent py-0 px-2"
                  :aria-label="`Delete comment by ${comment.userName}`"
                  @click="removeComment(comment)"
                >
                  <X :size="16" />
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
            <label for="newComment" class="form-label visually-hidden"
              >Your comment</label
            >
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
              {{ submitting ? "Posting..." : "Post comment" }}
            </button>
          </form>
        </section>
      </article>
    </div>
  </section>
</template>

<style scoped>
.article-detail-page { padding: 40px 0; }

.article-hero-img {
  max-height: 450px; object-fit: cover; width: 100%;
  border-radius: 16px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
.article-header { margin-bottom: 2rem; }

.blog-category {
  background: var(--accent-gradient);
  color: var(--accent-text);
  padding: 6px 16px; border-radius: 20px;
  font-size: 12px; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.8px;
  box-shadow: 0 0 12px rgba(255,200,55,0.25);
}

.read-time-badge { background: var(--bg-card-hover); padding: 4px 12px; border-radius: 12px; color: var(--text-secondary); }
.article-meta { padding-top: 1rem; }
.author-avatar-lg { object-fit: cover; }
.author-name { color: var(--text-emphasis); font-size: 15px; }
article { max-width: 100%; }

.article-body {
  font-size: 18px; line-height: 1.8;
  color: var(--text-primary);
}
.article-body :deep(p) { margin-bottom: 1.5em; }
.article-body :deep(h2), .article-body :deep(h3) {
  color: var(--text-emphasis);
  margin-top: 2em; margin-bottom: 1em; font-weight: 700;
}
.article-body :deep(h2) { font-size: 26px; }
.article-body :deep(h3) { font-size: 22px; }
.article-body :deep(ul), .article-body :deep(ol) { margin-bottom: 1.5em; padding-left: 2em; }
.article-body :deep(li) { margin-bottom: 0.5em; }
.article-body :deep(blockquote) {
  border-left: 4px solid var(--accent);
  background: rgba(255,200,55,0.04);
  padding: 1em 1.5em; margin: 1.5em 0;
  border-radius: 0 8px 8px 0;
  font-style: italic;
  color: var(--text-secondary);
}

.comment-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }
.comment-card:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25); }
.comment-author { color: var(--text-emphasis); }
.article-tags-section h5 { font-size: 16px; font-weight: 700; }

.tags-list { display: flex; flex-wrap: wrap; gap: 8px; }
.tag-item {
  background: var(--accent-bg-subtle);
  color: var(--accent);
  border: 1px solid var(--accent-bg-hover);
  padding: 6px 14px; border-radius: 20px;
  font-size: 14px; font-weight: 600;
  text-decoration: none; transition: all 0.2s ease;
}
.tag-item:hover {
  background: var(--accent-bg-hover);
  color: var(--accent-active);
  transform: translateY(-2px);
}
.article-footer { margin-top: 2rem; }

.sidebar-card { border-radius: 16px; overflow: hidden; }
.sidebar-header {
  background: var(--accent-bg);
  border: 1px solid var(--border-color);
  font-size: 16px; font-weight: 700; color: var(--text-emphasis); 
}

.related-list { display: flex; flex-direction: column; }
.related-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
  transition: all 0.2s ease;
}
.related-item:last-child { border-bottom: none; padding-bottom: 0; }
.related-item:hover { transform: translateX(4px); }
.related-img { object-fit: cover; flex-shrink: 0; }
.related-category { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
.related-title {
  color: var(--text-emphasis);
  font-weight: 600; line-height: 1.4; margin-bottom: 4px;
  transition: color 0.2s ease;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.related-item:hover .related-title { color: var(--accent); }
.related-meta { font-size: 12px; }

.share-buttons .btn { border-color: rgba(102, 126, 234, 0.3); transition: all 0.2s ease; }
.share-buttons .btn:hover { background: var(--bg-card-hover); border-color: var(--border-light); color: var(--text-emphasis); }

@media (max-width: 991.98px) {
  .article-hero-img { max-height: 300px; }
  .article-body { font-size: 16px; }
  .article-body :deep(h2) { font-size: 22px; }
  .article-body :deep(h3) { font-size: 20px; }
}
</style>
