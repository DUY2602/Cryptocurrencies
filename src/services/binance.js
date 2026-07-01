/**
 * Binance public API — prices & 24h stats (no API key, browser-friendly).
 */

const isProd = import.meta.env.PROD
const BINANCE_24H = isProd
  ? 'https://api.binance.com/api/v3/ticker/24hr'
  : '/api/binance'

const STABLE_BASES = new Set([
  'USDC',
  'USDT',
  'BUSD',
  'DAI',
  'TUSD',
  'FDUSD',
  'USDP',
  'USDS',
  'USD1',
])

const LEVERAGE_PATTERN = /(UP|DOWN|BULL|BEAR|\d+L|\d+S)$/i

let tickerCache = null
let tickerCacheAt = 0
const CACHE_MS = 60_000

export function parseUsdtTicker(row) {
  if (!row?.symbol?.endsWith('USDT')) return null
  const base = row.symbol.slice(0, -4)
  if (!base || STABLE_BASES.has(base) || LEVERAGE_PATTERN.test(base)) return null
  if (!/^[A-Z0-9]{2,10}$/.test(base)) return null

  const price = parseFloat(row.lastPrice)
  const change24h = parseFloat(row.priceChangePercent)
  const volume24h = parseFloat(row.quoteVolume)
  if (Number.isNaN(price)) return null

  return {
    symbol: base,
    price,
    change24h: Number.isNaN(change24h) ? 0 : change24h,
    volume24h: Number.isNaN(volume24h) ? 0 : volume24h,
  }
}

export async function fetchUsdtTickers({ useCache = true } = {}) {
  if (useCache && tickerCache && Date.now() - tickerCacheAt < CACHE_MS) {
    return tickerCache
  }

  const res = await fetch(BINANCE_24H)
  if (!res.ok) throw new Error(`Binance ${res.status}`)

  const rows = await res.json()
  tickerCache = rows.map(parseUsdtTicker).filter(Boolean)
  tickerCacheAt = Date.now()
  return tickerCache
}

export function findUsdtTicker(tickers, idOrSymbol) {
  const key = String(idOrSymbol).toUpperCase()
  return (
    tickers.find((t) => t.symbol === key) ||
    tickers.find((t) => t.symbol === key.replace(/USDT$/, ''))
  )
}
