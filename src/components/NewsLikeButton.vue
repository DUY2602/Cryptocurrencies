<script setup>
import { computed } from 'vue'
import { useReactions } from '../composables/useReactions.js'

const props = defineProps({
  articleId: { type: [String, Number], required: true },
})

const { isNewsLiked, toggleNewsLike } = useReactions()

const liked = computed(() => isNewsLiked(props.articleId))
</script>

<template>
  <button
    type="button"
    class="btn btn-sm"
    :class="liked ? 'btn-accent' : 'btn-outline-accent'"
    @click="toggleNewsLike(articleId)"
  >
    {{ liked ? '♥ Liked' : '♡ Like' }}
  </button>
</template>
