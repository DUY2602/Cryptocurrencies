/**
 * Live price WebSocket — Binance mini-tickers + REST backup poll.
 */

const BINANCE_WS = 'wss://stream.binance.com:9443/ws/!miniTicker@arr'
const BINANCE_REST = 'https://api.binance.com/api/v3/ticker/24hr'
const NOTIFY_MS = 500
const REST_POLL_MS = 3000
const MAX_RECONNECT = 8

const SYMBOL_TO_BINANCE = {
  MATIC: 'POLUSDT',
}

class LivePriceWebSocket {
  constructor() {
    this.ws = null
    this.symbolToLocalId = new Map()
    this.prices = {}
    this.listeners = new Set()
    this.reconnectAttempts = 0
    this.reconnectTimer = null
    this.notifyTimer = null
    this.restPollTimer = null
    this.wsConnected = false
    this.intentionalClose = false
    this.trackingActive = false
  }

  toBinancePair(symbol) {
    if (!symbol) return null
    const upper = String(symbol).toUpperCase()
    if (SYMBOL_TO_BINANCE[upper]) return SYMBOL_TO_BINANCE[upper]
    return `${upper}USDT`
  }

  setTrackedCoins(coins) {
    this.symbolToLocalId.clear()

    for (const coin of coins) {
      const localId = String(coin.id)
      const pair = this.toBinancePair(coin.symbol)
      if (pair) this.symbolToLocalId.set(pair, localId)
    }

    this.trackingActive = this.symbolToLocalId.size > 0

    if (!this.trackingActive) {
      this.stopRestPoll()
      return
    }

    this.startRestPoll()

    if (this.ws?.readyState === WebSocket.OPEN) return
    if (this.ws?.readyState === WebSocket.CONNECTING) return

    this.connectBinance()
  }

  connectBinance() {
    if (!this.trackingActive) return
    if (this.ws?.readyState === WebSocket.OPEN) return
    if (this.ws?.readyState === WebSocket.CONNECTING) return

    this.closeSocket()
    this.intentionalClose = false
    this.wsConnected = false

    try {
      this.ws = new WebSocket(BINANCE_WS)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.wsConnected = true
        console.info('[WebSocket] Binance connected')
      }

      this.ws.onmessage = (event) => {
        const tickers = this.parseTickerPayload(event.data)
        if (tickers?.length) this.handleBinanceTickers(tickers)
      }

      this.ws.onerror = () => {
        this.wsConnected = false
      }

      this.ws.onclose = () => {
        this.ws = null
        this.wsConnected = false
        if (!this.intentionalClose && this.trackingActive) {
          this.scheduleReconnect()
        }
      }
    } catch {
      this.scheduleReconnect()
    }
  }

  parseMiniTicker(t) {
    const price = parseFloat(t.c)
    if (Number.isNaN(price)) return null

    const open = parseFloat(t.o)
    let change = 0
    if (!Number.isNaN(open) && open > 0) {
      change = ((price - open) / open) * 100
    }

    return { price, change }
  }

  parseFullTicker(t) {
    const price = parseFloat(t.c)
    const change = parseFloat(t.P)
    if (Number.isNaN(price)) return null
    return {
      price,
      change: Number.isNaN(change) ? 0 : change,
    }
  }

  async fetchBinanceRest() {
    if (!this.symbolToLocalId.size) return false

    const symbols = [...this.symbolToLocalId.keys()]
    const chunkSize = 100
    let changed = false

    for (let i = 0; i < symbols.length; i += chunkSize) {
      const chunk = symbols.slice(i, i + chunkSize)
      const url = `${BINANCE_REST}?symbols=${encodeURIComponent(JSON.stringify(chunk))}`

      try {
        const res = await fetch(url)
        if (!res.ok) continue
        const rows = await res.json()
        if (!Array.isArray(rows)) continue

        for (const row of rows) {
          const localId = this.symbolToLocalId.get(row.symbol)
          if (!localId) continue
          const price = parseFloat(row.lastPrice)
          const change = parseFloat(row.priceChangePercent)
          if (Number.isNaN(price)) continue
          this.prices[localId] = {
            usd: price,
            usd_24h_change: Number.isNaN(change)
              ? this.prices[localId]?.usd_24h_change ?? 0
              : change,
          }
          changed = true
        }
      } catch (e) {
        console.warn('[WebSocket] REST poll failed:', e.message)
      }
    }

    if (changed) this.scheduleNotify()
    return changed
  }

  startRestPoll() {
    if (this.restPollTimer) return
    this.fetchBinanceRest()
    this.restPollTimer = setInterval(() => this.fetchBinanceRest(), REST_POLL_MS)
  }

  stopRestPoll() {
    if (this.restPollTimer) {
      clearInterval(this.restPollTimer)
      this.restPollTimer = null
    }
  }

  parseTickerPayload(raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
      if (Array.isArray(parsed?.data)) return parsed.data
      return null
    } catch {
      return null
    }
  }

  handleBinanceTickers(tickers) {
    let matched = 0

    for (const t of tickers) {
      const localId = this.symbolToLocalId.get(t.s)
      if (!localId) continue

      const parsed = t.P != null ? this.parseFullTicker(t) : this.parseMiniTicker(t)
      if (!parsed) continue

      this.prices[localId] = {
        usd: parsed.price,
        usd_24h_change: parsed.change,
      }
      matched += 1
    }

    if (matched) this.scheduleNotify()
  }

  /** Trailing throttle — always flush latest prices after NOTIFY_MS */
  scheduleNotify() {
    if (this.notifyTimer) clearTimeout(this.notifyTimer)
    this.notifyTimer = setTimeout(() => {
      this.notifyTimer = null
      const snapshot = { ...this.prices }
      this.listeners.forEach((cb) => {
        try {
          cb(snapshot)
        } catch (e) {
          console.error('[WebSocket] listener error:', e)
        }
      })
    }, NOTIFY_MS)
  }

  scheduleReconnect() {
    if (!this.trackingActive) return
    if (this.reconnectAttempts >= MAX_RECONNECT) return
    if (this.reconnectTimer) return

    this.reconnectAttempts += 1
    const delay = Math.min(2000 * this.reconnectAttempts, 12000)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connectBinance()
    }, delay)
  }

  subscribe(callback) {
    this.listeners.add(callback)
    if (Object.keys(this.prices).length) callback({ ...this.prices })
    return () => this.listeners.delete(callback)
  }

  closeSocket() {
    if (this.ws) {
      this.ws.onopen = null
      this.ws.onmessage = null
      this.ws.onerror = null
      this.ws.onclose = null
      try {
        this.ws.close()
      } catch {
        /* ignore */
      }
      this.ws = null
    }
  }

  disconnect() {
    this.intentionalClose = true
    this.trackingActive = false
    this.wsConnected = false
    clearTimeout(this.reconnectTimer)
    clearTimeout(this.notifyTimer)
    this.stopRestPoll()
    this.reconnectTimer = null
    this.notifyTimer = null
    this.closeSocket()
    this.listeners.clear()
    this.symbolToLocalId.clear()
    this.prices = {}
    this.reconnectAttempts = 0
  }
}

export const coinWebSocket = new LivePriceWebSocket()
export default coinWebSocket
