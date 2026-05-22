<script setup>
import { ref } from 'vue'

const open = ref(false)
const input = ref('')
const messages = ref([
  {
    role: 'assistant',
    text: 'Hi — I can explain coins, summarise markets, or suggest what to check on the dashboard. (Demo UI — no live AI API yet.)',
  },
])

const replies = [
  'BTC often leads the market. Check Markets for 24h % and the coin detail page for more stats.',
  'Top gainers today are on the Home page. Add coins to your Watchlist with the star button.',
  'Use the News page to filter headlines. Like posts to save your reaction locally.',
  'Markets supports sorting by price, gainers, and losers. Prices refresh on a live interval when API is connected.',
]

function toggle() {
  open.value = !open.value
}

function send() {
  const text = input.value.trim()
  if (!text) return
  messages.value.push({ role: 'user', text })
  input.value = ''
  const reply = replies[Math.floor(Math.random() * replies.length)]
  setTimeout(() => {
    messages.value.push({ role: 'assistant', text: reply })
  }, 400)
}

function quickPrompt(prompt) {
  input.value = prompt
  send()
}
</script>

<template>
  <div>
    <div v-if="open" class="ai-panel">
      <div class="p-3 border-bottom" style="border-color: var(--border-color) !important">
        <strong class="text-emphasis">Crypto Assistant</strong>
        <p class="small text-secondary mb-0">Market helper (demo)</p>
      </div>
      <div class="flex-grow-1 overflow-auto p-3" style="max-height: 240px">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="mb-2 small"
          :class="msg.role === 'user' ? 'text-end' : ''"
        >
          <span
            class="d-inline-block p-2 rounded"
            :style="{
              background: msg.role === 'user' ? 'rgba(240,185,11,0.2)' : 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }"
          >
            {{ msg.text }}
          </span>
        </div>
      </div>
      <div class="p-2 border-top d-flex flex-wrap gap-1" style="border-color: var(--border-color) !important">
        <button type="button" class="btn btn-sm btn-outline-accent" @click="quickPrompt('Summarise the market')">
          Market summary
        </button>
        <button type="button" class="btn btn-sm btn-outline-accent" @click="quickPrompt('Explain Bitcoin')">
          Explain BTC
        </button>
      </div>
      <form class="p-3 border-top d-flex gap-2" style="border-color: var(--border-color) !important" @submit.prevent="send">
        <input v-model="input" type="text" class="form-control form-control-sm" placeholder="Ask about crypto..." />
        <button type="submit" class="btn btn-sm btn-accent">Send</button>
      </form>
    </div>
    <button type="button" class="ai-fab" aria-label="Open assistant" @click="toggle">
      {{ open ? '×' : '💬' }}
    </button>
  </div>
</template>
