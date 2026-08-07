<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../../../supabase/supabase.js'
import { livePrices } from '../../services/livePrices.js'

import { useAdmin } from '../../composables/useAdmin.js'
import { user } from '../../composables/useAuth.js'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { X, MessageCircle } from '@lucide/vue'

marked.setOptions({ breaks: true, gfm: true })

function renderMarkdown(text) {
  return DOMPurify.sanitize(marked.parse(text || ''))
}

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
    const chatHistory = messages.value
      .slice(-12, -1)
      .map(m => ({ role: m.role, text: m.text }))
    const { data, error } = await supabase.functions.invoke('chat', {
      body: {
        query: text,
        history: chatHistory,
        livePrices: prices,
        role: role.value,
        currentView: route.name || route.path,
      },
    })

    let reply
    if (error) {
      const status = error.context?.status
      reply = status === 429
        ? 'AI is busy (rate limited). Please wait a few seconds and try again.'
        : `Error: ${error.message}`
    } else if (data?.busy || data?.answer == null) {
      reply = 'AI is busy (rate limited). Please wait a few seconds and try again.'
    } else {
      reply = (data?.answer || 'No response').replace(/\s*\[\d+\]/g, '')
    }
    messages.value.push({ role: 'assistant', text: reply })
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
      <div v-if="!user" class="d-flex flex-column align-items-center justify-content-center p-4 text-center" style="min-height: 240px">
        <p class="text-secondary mb-3">Please login or register to use the AI Assistant.</p>
        <RouterLink to="/login" class="btn btn-accent btn-sm mb-2 w-100">Login</RouterLink>
        <RouterLink to="/register" class="btn btn-outline-accent btn-sm w-100">Register</RouterLink>
      </div>
      <template v-else>
      <div class="p-3 border-bottom" style="border-color: var(--border-color)">
        <strong class="text-emphasis">Crypto Assistant</strong>
        <p class="small text-secondary mb-0">Powered by Groq + live prices</p>
      </div>
      <div class="flex-grow-1 overflow-auto p-3" style="max-height: 240px">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="mb-2 small"
          :class="msg.role === 'user' ? 'text-end' : ''"
        >
          <div class="d-inline-block text-start" :style="{ maxWidth: '90%' }">

            <span
              class="d-inline-block p-2 rounded"
              :style="{
                background: msg.role === 'user' ? 'rgba(240,185,11,0.2)' : 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }"
            >
              <span v-html="renderMarkdown(msg.text)"></span>
            </span>
          </div>
        </div>
        <div v-if="loading" class="text-center text-secondary small py-2">
          <span class="spinner-border spinner-border-sm me-1"></span>Thinking...
        </div>
      </div>
      <div class="p-2 border-top d-flex flex-wrap gap-1" style="border-color: var(--border-color)">
        <button type="button" class="btn btn-sm btn-outline-accent" @click="quickPrompt('Summarise the market')">
          Market summary
        </button>
        <button type="button" class="btn btn-sm btn-outline-accent" @click="quickPrompt('Explain Bitcoin')">
          Explain BTC
        </button>
      </div>
      <form class="p-3 border-top d-flex gap-2" style="border-color: var(--border-color)" @submit.prevent="send">
        <input v-model="input" type="text" class="form-control form-control-sm" placeholder="Ask about crypto..." :disabled="loading" />
        <button type="submit" class="btn btn-sm btn-accent" :disabled="loading">Send</button>
      </form>
      </template>
    </div>
    <button type="button" class="ai-fab" aria-label="Open assistant" @click="toggle">
      <X :size="20" v-if="open" />
      <MessageCircle :size="20" v-else />
    </button>
  </div>
</template>
