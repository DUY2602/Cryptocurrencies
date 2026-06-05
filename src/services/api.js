import { coins as localCoins } from '../data/coins.js'
import { fetchUsdtTickers, findUsdtTicker } from './binance.js'

const symbolToLocal = new Map(
  localCoins.map((c) => [String(c.symbol).toUpperCase(), c])
)

const idToLocal = new Map(
  localCoins.flatMap((c) => {
    const keys = [String(c.id), String(c.coingeckoId || c.id)]
    return keys.map((k) => [k, c])
  })
)

const geckoIdToLocal = new Map(
  localCoins.map((c) => [String(c.coingeckoId || c.id).toLowerCase(), c])
)

function mapMarketCoin(c) {
  return {
    id: c.id,
    coingeckoId: c.coingeckoId || c.id,
    name: c.name,
    symbol: (c.symbol || '').toUpperCase(),
    price: c.current_price ?? c.price ?? 0,
    marketCap: c.market_cap ?? c.marketCap ?? 0,
    volume24h: c.total_volume ?? c.volume24h ?? 0,
    change24h: c.price_change_percentage_24h ?? c.change24h ?? 0,
    image: c.image,
  }
}

function mapLocalCoin(c) {
  return {
    ...mapMarketCoin(c),
    volume24h: c.volume24h ?? c.marketCap * 0.08,
  }
}

function tickerToCoin(t) {
  const local = symbolToLocal.get(t.symbol)
  if (local) {
    return mapLocalCoin({
      ...local,
      price: t.price,
      change24h: t.change24h,
      volume24h: t.volume24h,
    })
  }

  const slug = t.symbol.toLowerCase()
  return {
    id: slug,
    coingeckoId: slug,
    name: t.symbol,
    symbol: t.symbol,
    price: t.price,
    marketCap: 0,
    volume24h: t.volume24h,
    change24h: t.change24h,
    image: null,
  }
}

async function enrichWithMarketCaps(coins) {
  if (!coins.length) return coins
  const { fetchCoinMeta } = await import('./coingecko.js')
  const idToGeckoId = new Map(
    coins.map((c) => [String(c.coingeckoId || c.id), String(c.coingeckoId || c.id).toLowerCase()])
  )
  const uniqueIds = [...new Set(idToGeckoId.values())]
  const meta = await fetchCoinMeta(uniqueIds)

  return coins.map((c) => {
    const gid = String(c.coingeckoId || c.id).toLowerCase()
    const m = meta[gid] || {}
    return {
      ...c,
      marketCap: m.marketCap ?? c.marketCap ?? 0,
      image: c.image || m.image || null,
    }
  })
}

async function getBinanceTopCoins(perPage = 50) {
  const tickers = await fetchUsdtTickers()
  const coins = [...tickers]
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, perPage)
    .map(tickerToCoin)
  return enrichWithMarketCaps(coins)
}

export const api = {
  async getTopCoins(perPage = 50) {
    try {
      const coins = await getBinanceTopCoins(perPage)
      if (coins.length) return coins
    } catch (err) {
      console.warn('[api] Binance markets failed, using local:', err.message)
    }
    return enrichWithMarketCaps(localCoins.slice(0, perPage))
  },

  getAllLocalCoins() {
    return enrichWithMarketCaps(localCoins)
  },

  async getTrendingCoins() {
    try {
      const tickers = await fetchUsdtTickers()
      const top = [...tickers]
        .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
        .slice(0, 6)
        .map(tickerToCoin)
      if (top.length) return enrichWithMarketCaps(top)
    } catch (err) {
      console.warn('[api] trending:', err.message)
    }
    return enrichWithMarketCaps(localCoins.slice(0, 6))
  },

  async getCoinById(id) {
    const strId = String(id)
    const local = idToLocal.get(strId) || geckoIdToLocal.get(strId.toLowerCase())

    try {
      const tickers = await fetchUsdtTickers({ useCache: false })
      let ticker = null

      if (local) {
        ticker = findUsdtTicker(tickers, local.symbol)
      }

      if (!ticker) {
        ticker = findUsdtTicker(tickers, strId)
      }

      if (!ticker && local?.coingeckoId) {
        ticker = findUsdtTicker(tickers, local.coingeckoId)
      }

      if (ticker) {
        const base = local ? mapLocalCoin(local) : tickerToCoin(ticker)
        const price = ticker.price
        const geckoId = local
          ? String(local.coingeckoId || local.id)
          : ticker.symbol.toLowerCase()
        const { fetchCoinMeta } = await import('./coingecko.js')
        const meta = await fetchCoinMeta([geckoId])
        const m = meta[geckoId.toLowerCase()] || {}
        return {
          ...base,
          marketCap: m.marketCap ?? base.marketCap ?? 0,
          image: base.image || m.image || null,
          price,
          change24h: ticker.change24h,
          volume24h: ticker.volume24h,
          high24h: price * (1 + Math.max(ticker.change24h, 0) / 200),
          low24h: price * (1 - Math.max(-ticker.change24h, 0) / 200),
          ath: local?.price ? local.price * 1.5 : price * 1.2,
          description:
            base.description ||
            `${base.name} — live price from Binance (${base.symbol}/USDT).`,
        }
      }
    } catch (err) {
      console.warn('[api] coin detail:', err.message)
    }

    if (local) {
      const { fetchCoinMeta } = await import('./coingecko.js')
      const meta = await fetchCoinMeta([String(local.coingeckoId || local.id)])
      const m = meta[String(local.coingeckoId || local.id).toLowerCase()] || {}
      return {
        ...mapLocalCoin(local),
        marketCap: m.marketCap ?? local.marketCap ?? 0,
        image: local.image || m.image || null,
        high24h: local.price * 1.02,
        low24h: local.price * 0.98,
        ath: local.price * 1.5,
        description: `${local.name} market data (offline fallback).`,
      }
    }
    throw new Error('Coin not found')
  },
}

export default api
