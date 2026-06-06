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
