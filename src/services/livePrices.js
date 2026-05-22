import { api } from './api.js'

const subscribers = new Set()
let intervalId = null
let coinIds = []

function notify(prices) {
  subscribers.forEach((cb) => cb(prices))
}

async function poll() {
  if (!coinIds.length) return
  try {
    const data = await api.getSimplePrices(coinIds)
    notify(data)
  } catch {
    /* silent — retry next tick */
  }
}

export const livePrices = {
  subscribe(callback) {
    subscribers.add(callback)
    return () => subscribers.delete(callback)
  },

  start(ids, intervalMs = 12000) {
    coinIds = [...new Set(ids.filter(Boolean))]
    if (intervalId) clearInterval(intervalId)
    if (!coinIds.length) return
    poll()
    intervalId = setInterval(poll, intervalMs)
  },

  stop() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    coinIds = []
  },
}

export default livePrices
