import { ref } from 'vue'

const STORAGE_KEY = 'cryptodash-reactions'

const state = ref({
  newsLikes: {},
  coinVotes: {},
})

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) state.value = { ...state.value, ...JSON.parse(raw) }
  } catch {
    /* keep defaults */
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
}

load()

export function useReactions() {
  function isNewsLiked(articleId) {
    return !!state.value.newsLikes[articleId]
  }

  function toggleNewsLike(articleId) {
    const key = String(articleId)
    state.value.newsLikes[key] = !state.value.newsLikes[key]
    save()
  }

  function getNewsLikeCount(articleId) {
    return state.value.newsLikes[String(articleId)] ? 1 : 0
  }

  function getCoinVote(coinId) {
    return state.value.coinVotes[String(coinId)] || null
  }

  function setCoinVote(coinId, vote) {
    const key = String(coinId)
    if (state.value.coinVotes[key] === vote) {
      delete state.value.coinVotes[key]
    } else {
      state.value.coinVotes[key] = vote
    }
    save()
  }

  return {
    isNewsLiked,
    toggleNewsLike,
    getNewsLikeCount,
    getCoinVote,
    setCoinVote,
  }
}
