import { coins as localCoins } from '../data/coins.js'

const BASE = 'https://api.coingecko.com/api/v3'
const CACHE_MS = 60_000

const cache = new Map()

async function fetchJson(path, retries = 2) {
  const url = `${BASE}${path}`
  let lastError
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      lastError = err
      if (i < retries) await new Promise((r) => setTimeout(r, 800 * (i + 1)))
    }
  }
  throw lastError
}

function mapMarketCoin(c) {
  return {
    id: c.id,
    coingeckoId: c.id,
    name: c.name,
    symbol: (c.symbol || '').toUpperCase(),
    price: c.current_price ?? 0,
    marketCap: c.market_cap ?? 0,
    volume24h: c.total_volume ?? 0,
    change24h: c.price_change_percentage_24h ?? 0,
    image: c.image,
  }
}

function mapLocalCoin(c) {
  return {
    ...c,
    coingeckoId: c.coingeckoId || c.id,
    volume24h: c.volume24h ?? c.marketCap * 0.08,
  }
}

export const api = {
  async getTopCoins(perPage = 50) {
    const key = `markets-${perPage}`
    const hit = cache.get(key)
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.data

    try {
      const data = await fetchJson(
        `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false&price_change_percentage=24h`
      )
      const mapped = data.map(mapMarketCoin)
      cache.set(key, { at: Date.now(), data: mapped })
      return mapped
    } catch {
      return localCoins.map(mapLocalCoin)
    }
  },

  async getTrendingCoins() {
    const key = 'trending'
    const hit = cache.get(key)
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.data

    try {
      const data = await fetchJson('/search/trending')
      const items = (data.coins || []).slice(0, 6).map((entry) => {
        const item = entry.item
        return {
          id: item.id,
          coingeckoId: item.id,
          name: item.name,
          symbol: (item.symbol || '').toUpperCase(),
          price: item.data?.price ?? 0,
          marketCap: item.data?.market_cap ? parseFloat(String(item.data.market_cap).replace(/[^0-9.eE+-]/g, '')) : 0,
          volume24h: 0,
          change24h: item.data?.price_change_percentage_24h?.usd ?? 0,
          image: item.small || item.thumb,
        }
      })
      cache.set(key, { at: Date.now(), data: items })
      return items
    } catch {
      return localCoins.slice(0, 6).map(mapLocalCoin)
    }
  },

  async getCoinById(id) {
    const key = `coin-${id}`
    const hit = cache.get(key)
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.data

    const local = localCoins.find(
      (c) => String(c.id) === String(id) || c.coingeckoId === id
    )

    try {
      const cgId = local?.coingeckoId || id
      const data = await fetchJson(
        `/coins/${cgId}?localization=false&tickers=false&community_data=false&developer_data=false`
      )
      const mapped = {
        id: data.id,
        coingeckoId: data.id,
        name: data.name,
        symbol: (data.symbol || '').toUpperCase(),
        price: data.market_data?.current_price?.usd ?? 0,
        marketCap: data.market_data?.market_cap?.usd ?? 0,
        volume24h: data.market_data?.total_volume?.usd ?? 0,
        change24h: data.market_data?.price_change_percentage_24h ?? 0,
        high24h: data.market_data?.high_24h?.usd ?? 0,
        low24h: data.market_data?.low_24h?.usd ?? 0,
        ath: data.market_data?.ath?.usd ?? 0,
        image: data.image?.large || data.image?.small,
        description: data.description?.en?.replace(/<[^>]+>/g, '').slice(0, 280) || '',
      }
      cache.set(key, { at: Date.now(), data: mapped })
      return mapped
    } catch {
      if (local) {
        return {
          ...mapLocalCoin(local),
          high24h: local.price * 1.02,
          low24h: local.price * 0.98,
          ath: local.price * 1.5,
          description: `${local.name} market data (offline fallback).`,
        }
      }
      throw new Error('Coin not found')
    }
  },

  async getSimplePrices(ids) {
    if (!ids.length) return {}
    const param = ids.join(',')
    const data = await fetchJson(`/simple/price?ids=${param}&vs_currencies=usd&include_24hr_change=true`)
    return data
  },
}

export default api
