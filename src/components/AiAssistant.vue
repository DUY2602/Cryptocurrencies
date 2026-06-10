<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../../supabase/supabase'
import { livePrices } from '../services/livePrices'
import { useAdmin } from '../composables/useAdmin'

const { role } = useAdmin()
const route = useRoute()
const open = ref(false)
const input = ref('')
const loading = ref(false)
const messages = ref([
  {
    role: 'assistant',
    text: 'Hi — I can explain coins, summarise markets, or suggest what to check on the dashboard.',
  },
])

function toggle() {
  open.value = !open.value
}

async function send() {
  const text = input.value.trim()
  if (!text || loading.value) return
  messages.value.push({ role: 'user', text })
  input.value = ''
  loading.value = true

  try {
    const prices = livePrices.getLatest()
    const { data, error } = await supabase.functions.invoke('chat', {
      body: {
        query: text,
        livePrices: prices,
        role: role.value,
        currentView: route.name || route.path,
      },
    })

    const reply = error ? `Error: ${error.message}` : data?.answer || 'No response'
    messages.value.push({
      role: 'assistant',
      text: reply,
      sources: data?.sources || null,
    })
  } catch (e) {
    messages.value.push({ role: 'assistant', text: `Error: ${e.message}` })
  } finally {
    loading.value = false
  }
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
        <p class="small text-secondary mb-0">Powered by Gemini + live prices</p>
      </div>
      <div class="flex-grow-1 overflow-auto p-3" style="max-height: 240px">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="mb-2 small"
          :class="msg.role === 'user' ? 'text-end' : ''"
        >
          <div class="d-inline-block text-start" :style="{ maxWidth: '90%' }">
            <div v-if="msg.sources" class="text-secondary small opacity-50 mb-1" style="font-size: 0.65rem; line-height: 1.2">
              <div v-for="(s, si) in msg.sources" :key="si">
                {{ s.source }} · {{ s.title }} ({{ s.similarity }}%)
              </div>
            </div>
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
        <div v-if="loading" class="text-center text-secondary small py-2">
          <span class="spinner-border spinner-border-sm me-1"></span>Thinking...
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
        <input v-model="input" type="text" class="form-control form-control-sm" placeholder="Ask about crypto..." :disabled="loading" />
        <button type="submit" class="btn btn-sm btn-accent" :disabled="loading">Send</button>
      </form>
    </div>
    <button type="button" class="ai-fab" aria-label="Open assistant" @click="toggle">
      {{ open ? "×" : "💬" }}
    </button>
  </div>
</template>
