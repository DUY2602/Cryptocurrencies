/**
 * Rate limiter + cache layer for external APIs (CoinGecko, Binance).
 * Token-bucket throttling, localStorage cache, request deduplication,
 * exponential backoff, and queue draining on visibility change.
 */

const CACHE_PREFIX = 'cryptodash-api-'
const CACHE_DURATION_KEY = 'cryptodash-api-dur'

const defaults = {
  maxTokens: 10,
  refillPerMin: 10,
  retryMax: 2,
  retryBaseMs: 1000,
  cacheDefaultMs: 60_000,
}

let config = { ...defaults }
let tokens = config.maxTokens
let lastRefill = Date.now()
const queue = []
let processing = false
const inflight = new Map()
const memoryCache = new Map()

let cacheDurations = {}
try {
  const raw = localStorage.getItem(CACHE_DURATION_KEY)
  if (raw) cacheDurations = JSON.parse(raw)
} catch { /* ignore */ }

function saveDurations() {
  try {
    localStorage.setItem(CACHE_DURATION_KEY, JSON.stringify(cacheDurations))
  } catch { /* ignore */ }
}

function refill() {
  const now = Date.now()
  const elapsed = now - lastRefill
  const add = Math.floor((elapsed / 60000) * config.refillPerMin)
  if (add > 0) {
    tokens = Math.min(config.maxTokens, tokens + add)
    lastRefill = now
  }
}

function takeToken() {
  refill()
  if (tokens > 0) {
    tokens -= 1
    return true
  }
  return false
}

function getCacheKey(url) {
  return CACHE_PREFIX + url
}

function getCacheDuration(url) {
  return cacheDurations[url] ?? config.cacheDefaultMs
}

function setCacheDuration(url, ms) {
  cacheDurations[url] = ms
  saveDurations()
}

function readCache(url) {
  const key = getCacheKey(url)
  const mem = memoryCache.get(key)
  if (mem && Date.now() - mem.time < getCacheDuration(url)) {
    return mem.data
  }
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Date.now() - parsed.time < getCacheDuration(url)) {
        memoryCache.set(key, parsed)
        return parsed.data
      }
      localStorage.removeItem(key)
    }
  } catch { /* ignore */ }
  return null
}

function writeCache(url, data) {
  const key = getCacheKey(url)
  const entry = { data, time: Date.now() }
  memoryCache.set(key, entry)
  try {
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    if (memoryCache.size > 200) {
      const oldest = [...memoryCache.entries()].sort((a, b) => a[1].time - b[1].time)[0]
      if (oldest) {
        memoryCache.delete(oldest[0])
        try { localStorage.removeItem(getCacheKey(oldest[0])) } catch { /* ignore */ }
      }
    }
  }
}

function clearExpiredCache() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key))
          const url = key.slice(CACHE_PREFIX.length)
          if (Date.now() - parsed.time >= getCacheDuration(url)) {
            localStorage.removeItem(key)
          }
        } catch { localStorage.removeItem(key) }
      }
    }
  } catch { /* ignore */ }
}

async function fetchWithRetry(url, options, attempt = 0) {
  try {
    const response = await fetch(url, {
      ...options,
      signal: options?.signal ?? AbortSignal.timeout(15000),
    })
    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10)
        throw new RetryableError(`Rate limited (429)`, retryAfter * 1000)
      }
      if (response.status >= 500 && attempt < config.retryMax) {
        throw new RetryableError(`Server error ${response.status}`)
      }
      throw new Error(`HTTP ${response.status}`)
    }
    return await response.json()
  } catch (err) {
    if (err instanceof RetryableError && attempt < config.retryMax) {
      const delay = err.delay || (config.retryBaseMs * Math.pow(2, attempt) + Math.random() * 1000)
      await sleep(delay)
      return fetchWithRetry(url, options, attempt + 1)
    }
    throw err
  }
}

class RetryableError extends Error {
  constructor(message, delay) {
    super(message)
    this.name = 'RetryableError'
    this.delay = delay
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function processQueue() {
  if (processing) return
  processing = true

  while (queue.length > 0) {
    if (!takeToken()) {
      const waitMs = Math.ceil((60000 / config.refillPerMin))
      await sleep(waitMs)
      continue
    }

    const item = queue.shift()
    try {
      const data = await fetchWithRetry(item.url, item.options)
      if (item.cacheMs > 0) {
        writeCache(item.url, data)
        setCacheDuration(item.url, item.cacheMs)
      }
      item.resolve(data)
    } catch (err) {
      item.reject(err)
    } finally {
      inflight.delete(item.url)
    }
  }

  processing = false
}

function enqueue(url, options, cacheMs) {
  if (inflight.has(url)) {
    return inflight.get(url)
  }

  const cached = cacheMs > 0 ? readCache(url) : null
  if (cached !== null) {
    return Promise.resolve(cached)
  }

  const promise = new Promise((resolve, reject) => {
    queue.push({ url, options, cacheMs, resolve, reject })
  })

  inflight.set(url, promise)
  processQueue()
  return promise
}

export const rateLimiter = {
  get(url, options = {}, cacheMs = config.cacheDefaultMs) {
    return enqueue(url, options, cacheMs)
  },

  invalidate(urlPattern) {
    const prefix = CACHE_PREFIX
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(prefix)) {
        const url = key.slice(prefix.length)
        if (urlPattern instanceof RegExp ? urlPattern.test(url) : url.includes(urlPattern)) {
          keysToRemove.push(key)
        }
      }
    }
    keysToRemove.forEach(k => {
      localStorage.removeItem(k)
      memoryCache.delete(k)
    })
  },

  clearCache() {
    memoryCache.clear()
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX) || key === CACHE_DURATION_KEY) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
  },

  configure(opts) {
    config = { ...defaults, ...opts }
    tokens = Math.min(config.maxTokens, tokens)
  },

  getStats() {
    return {
      tokens,
      queueLength: queue.length,
      inflightCount: inflight.size,
      cacheSize: memoryCache.size,
    }
  },
}

clearExpiredCache()

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      processQueue()
    }
  })
}
