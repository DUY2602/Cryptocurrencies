const COINGECKO_MARKETS = 'https://api.coingecko.com/api/v3/coins/markets'

const CACHE_MS = 5 * 60 * 1000
let cache = {}
let cacheAt = 0

export async function fetchCoinMeta(symbols) {
  if (!symbols?.length) return {}

  const now = Date.now()
  if (now - cacheAt < CACHE_MS) return cache

  const ids = symbols
    .map((s) => String(s).toLowerCase())
    .filter(Boolean)
    .join(',')

  if (!ids) return cache

  try {
    const url = `${COINGECKO_MARKETS}?vs_currency=usd&ids=${encodeURIComponent(ids)}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`)
    const json = await res.json()

    const out = {}
    for (const row of json) {
      const id = String(row.id).toLowerCase()
      out[id] = {
        marketCap: row.market_cap ?? null,
        image: row.image?.small ?? null,
      }
    }
    cache = out
    cacheAt = now
    return out
  } catch (e) {
    console.warn('[coingecko] fetchCoinMeta failed:', e.message)
    return cache
  }
}

export async function fetchMarketCaps(coinList) {
  if (!coinList?.length) return {}

  const idToGeckoId = new Map(
    coinList.map((c) => [String(c.coingeckoId || c.id), String(c.coingeckoId || c.id).toLowerCase()])
  )

  const uniqueIds = [...new Set(idToGeckoId.values())]
  const meta = await fetchCoinMeta(uniqueIds)

  const result = {}
  for (const [localId, geckoId] of idToGeckoId.entries()) {
    result[localId] = meta[geckoId]?.marketCap ?? null
  }

  return result
}

export async function fetchCoinImages(coinList) {
  if (!coinList?.length) return {}

  const idToGeckoId = new Map(
    coinList.map((c) => [String(c.coingeckoId || c.id), String(c.coingeckoId || c.id).toLowerCase()])
  )

  const uniqueIds = [...new Set(idToGeckoId.values())]
  const meta = await fetchCoinMeta(uniqueIds)

  const result = {}
  for (const [localId, geckoId] of idToGeckoId.entries()) {
    result[localId] = meta[geckoId]?.image ?? null
  }

  return result
}

export async function refreshCoinMeta(coins) {
  const idToGeckoId = new Map(
    coins.map((c) => [String(c.coingeckoId || c.id), String(c.coingeckoId || c.id).toLowerCase()])
  )
  const uniqueIds = [...new Set(idToGeckoId.values())]
  const meta = await fetchCoinMeta(uniqueIds)

  return coins.map((c) => {
    const geckoId = String(c.coingeckoId || c.id).toLowerCase()
    const m = meta[geckoId] || {}
    return {
      ...c,
      marketCap: m.marketCap ?? c.marketCap ?? 0,
      image: c.image || m.image || null,
    }
  })
}

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3'
const geckoPriceCache = {}
const GECKO_PRICE_CACHE_MS = 30 * 1000

export async function fetchCoinPrice(coinId) {
  if (!coinId) return null
  const id = String(coinId).toLowerCase()

  const cached = geckoPriceCache[id]
  if (cached && Date.now() - cached.time < GECKO_PRICE_CACHE_MS) {
    return cached.data
  }

  try {
    const url = `${COINGECKO_BASE_URL}/simple/price?ids=${encodeURIComponent(id)}&vs_currency=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`)
    const json = await res.json()
    const row = json[id]
    if (!row) return null

    const data = {
      usd: row.usd ?? null,
      usd_24h_change: row.usd_24h_change ?? 0,
      usd_24h_volume: row.usd_24h_volume ?? 0,
      usd_market_cap: row.usd_market_cap ?? 0,
      source: 'coingecko',
    }

    geckoPriceCache[id] = { data, time: Date.now() }
    return data
  } catch (e) {
    console.warn('[coingecko] fetchCoinPrice failed:', e.message)
    return geckoPriceCache[id]?.data ?? null
  }
}

export async function fetchMarketChart(coinId, days = 7) {
  if (!coinId) return null
  const id = String(coinId).toLowerCase()

  try {
    const url = `${COINGECKO_BASE_URL}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=${days}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`)
    const json = await res.json()

    const candles = (json.prices || []).map(([time, price]) => ({
      time: Math.floor(time / 1000),
      value: price,
    }))

    const volumes = (json.total_volumes || []).map(([time, vol]) => ({
      time: Math.floor(time / 1000),
      value: vol,
    }))

    return { candles, volumes, source: 'coingecko' }
  } catch (e) {
    console.warn('[coingecko] fetchMarketChart failed:', e.message)
    return null
  }
}
