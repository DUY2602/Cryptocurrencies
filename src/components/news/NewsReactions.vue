<script setup>
import { ref, computed } from "vue";
import {
  getUserReaction,
  getLikesCount,
  getDislikesCount,
  react,
  removeReaction,
} from "../../composables/useReactions.js";
import { user } from "../../composables/useAuth.js";

const props = defineProps({
  articleId: { type: [String, Number], required: true },
});

const busy = ref(false);
const loggedIn = computed(() => !!user.value);

const reaction = computed(() => getUserReaction(props.articleId));
const likes = computed(() => getLikesCount(props.articleId));
const dislikes = computed(() => getDislikesCount(props.articleId));

async function onClick(type) {
  if (busy.value || !loggedIn.value) return;
  busy.value = true;
  try {
    if (reaction.value === type) {
      await removeReaction(props.articleId);
    } else {
      await react(props.articleId, type);
    }
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="reaction-buttons">
    <button
      type="button"
      class="reaction-btn"
      :class="{ active: reaction === 'like' }"
      :disabled="busy || !loggedIn"
      :title="loggedIn ? 'Like' : 'Log in to like'"
      @click="onClick('like')"
    >
      <svg
        class="reaction-icon"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        :fill="reaction === 'like' ? 'currentColor' : 'none'"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
      <span v-if="likes > 0" class="reaction-count">{{ likes }}</span>
    </button>
    <button
      type="button"
      class="reaction-btn"
      :class="{ active: reaction === 'dislike' }"
      :disabled="busy || !loggedIn"
      :title="loggedIn ? 'Dislike' : 'Log in to dislike'"
      @click="onClick('dislike')"
    >
        <svg
          class="reaction-icon"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          :fill="reaction === 'dislike' ? 'currentColor' : 'none'"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          style="transform: scaleY(-1)"
        >
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
      <span v-if="dislikes > 0" class="reaction-count">{{ dislikes }}</span>
    </button>
  </div>
</template>

<style scoped>
.reaction-buttons {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 18px;
  padding: 2px;
  overflow: hidden;
}
.reaction-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  user-select: none;
}
.reaction-btn:hover:not(:disabled) {
  background: var(--bg-card-hover);
  color: var(--text-emphasis);
}
.reaction-btn.active {
  background: rgba(102, 126, 234, 0.15);
  color: #667eea;
}
.reaction-btn.active:hover {
  background: rgba(102, 126, 234, 0.25);
}
.reaction-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.reaction-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}
.reaction-btn:active .reaction-icon {
  transform: scale(1.25);
}
.reaction-count {
  min-width: 16px;
  text-align: center;
}
</style>
