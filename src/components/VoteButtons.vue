<script setup>
import { computed } from 'vue'
import { useReactions } from '../composables/useReactions.js'

const props = defineProps({
  coinId: { type: [String, Number], required: true },
})

const { getCoinVote, setCoinVote } = useReactions()

const vote = computed(() => getCoinVote(props.coinId))

function bullish() {
  setCoinVote(props.coinId, 'bullish')
}

function bearish() {
  setCoinVote(props.coinId, 'bearish')
}
</script>

<template>
  <div class="d-flex gap-2 flex-wrap">
    <button
      type="button"
      class="btn btn-sm"
      :class="vote === 'bullish' ? 'btn-accent' : 'btn-outline-accent'"
      @click="bullish"
    >
      Bullish
    </button>
    <button
      type="button"
      class="btn btn-sm"
      :class="vote === 'bearish' ? 'btn-accent' : 'btn-outline-accent'"
      @click="bearish"
    >
      Bearish
    </button>
  </div>
</template>
