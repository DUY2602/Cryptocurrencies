<script setup>
import { computed, ref } from 'vue'
import { useReactions } from '../composables/useReactions.js'
import { useAuth } from '../composables/useAuth.js'

const props = defineProps({
  articleId: { type: [String, Number], required: true },
})

const { isNewsLiked, toggleNewsLike } = useReactions()
const { isLoggedIn } = useAuth()
const busy = ref(false)

const liked = computed(() => isNewsLiked(props.articleId))

async function onClick() {
  if (busy.value) return
  busy.value = true
  try {
    await toggleNewsLike(props.articleId)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <button
    type="button"
    class="btn btn-sm"
    :class="liked ? 'btn-accent' : 'btn-outline-accent'"
    :disabled="busy"
    @click="onClick"
  >
    {{ liked ? '♥ Liked' : '♡ Like' }}
    <span v-if="!isLoggedIn" class="visually-hidden"> (saved locally when logged out)</span>
  </button>
</template>
