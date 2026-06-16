import { fetchUsdtTickers, findUsdtTicker } from "./binance.js";

const isProd = import.meta.env.PROD
const COINGECKO_BASE = isProd ? 'https://api.coingecko.com/api/v3' : '/api/coingecko'
const COINGECKO_MARKETS = `${COINGECKO_BASE}/coins/markets`
const COINGECKO_DETAIL = `${COINGECKO_BASE}/coins`

function mapCoin(c) {
  return {
    id: c.id,
    coingeckoId: c.id,
    name: c.name,
    symbol: (c.symbol || '').toUpperCase(),
    price: c.current_price ?? c.price ?? 0,
    marketCap: c.market_cap ?? c.marketCap ?? 0,
    volume24h: c.total_volume ?? c.volume24h ?? 0,
    change24h: c.price_change_percentage_24h ?? c.change24h ?? 0,
    image: c.image || null,
    circulatingSupply: c.circulating_supply ?? null,
  }
}

async function fetchCoinGeckoMarkets(perPage = 100) {
  const url = `${COINGECKO_MARKETS}?vs_currency=usd&order=volume_desc&per_page=${perPage}&page=1&sparkline=false&price_change_percentage=24h`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`)
  const json = await res.json()
  if (!Array.isArray(json)) throw new Error('Invalid response')
  return json.map(mapCoin)
}

async function fetchCoinGeckoById(id) {
  const url = `${COINGECKO_DETAIL}/${encodeURIComponent(String(id).toLowerCase())}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`)
  const c = await res.json()
  return {
    id: c.id,
    coingeckoId: c.id,
    name: c.name,
    symbol: (c.symbol || '').toUpperCase(),
    price: c.market_data?.current_price?.usd ?? 0,
    marketCap: c.market_data?.market_cap?.usd ?? 0,
    volume24h: c.market_data?.total_volume?.usd ?? 0,
    change24h: c.market_data?.price_change_percentage_24h ?? 0,
    high24h: c.market_data?.high_24h?.usd ?? 0,
    ath: c.market_data?.ath?.usd ?? 0,
    circulatingSupply: c.market_data?.circulating_supply ?? null,
    image: c.image?.large || c.image?.small || c.image?.thumb || null,
    description: c.description?.en
      ? c.description.en.replace(/<[^>]*>/g, '').slice(0, 1000)
      : `${c.name} — live market data from CoinGecko.`,
  }
}

export const api = {
  async getTopCoins(perPage = 50) {
    return fetchCoinGeckoMarkets(perPage)
  },

  async getTrendingCoins() {
    const coins = await fetchCoinGeckoMarkets(6)
    return coins.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
  },

  async getCoinById(id) {
    const coin = await fetchCoinGeckoById(id)

    try {
      const tickers = await fetchUsdtTickers({ useCache: false })
      const ticker = findUsdtTicker(tickers, coin.symbol)
      if (ticker) {
        coin.price = ticker.price
        coin.change24h = ticker.change24h
        coin.volume24h = ticker.volume24h
        coin.high24h = ticker.price * (1 + Math.max(ticker.change24h, 0) / 200)
        coin.low24h = ticker.price * (1 - Math.max(-ticker.change24h, 0) / 200)
      }
    } catch {
      /* Binance is optional for detail */
    }

    return coin
  },
}

export default api
