import { fetchUsdtTickers, findUsdtTicker } from "./binance.js";
import { rateLimiter } from "./rateLimiter.js";

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

async function fetchCoinGeckoMarkets(perPage = 250) {
  const fetchSize = Math.max(perPage, 100)
  const url = `${COINGECKO_MARKETS}?vs_currency=usd&order=volume_desc&per_page=${fetchSize}&page=1&sparkline=false&price_change_percentage=24h`
  const json = await rateLimiter.get(url, {}, 120_000)
  if (!Array.isArray(json)) throw new Error('Invalid response')
  return json.map(mapCoin)
}

async function fetchCoinGeckoById(id) {
  const url = `${COINGECKO_DETAIL}/${encodeURIComponent(id)}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`
  const c = await rateLimiter.get(url, {}, 120_000)
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
  async getTopCoins() {
    const [tickers, coins] = await Promise.all([
      fetchUsdtTickers(),
      fetchCoinGeckoMarkets(250),
    ])

    const binanceSymbols = new Set(tickers.map(t => t.symbol))

    return coins
      .filter(c => binanceSymbols.has(c.symbol))
      .map(c => {
        const t = findUsdtTicker(tickers, c.symbol)
        if (t) {
          c.price = t.price
          c.change24h = t.change24h
          c.volume24h = t.volume24h
        }
        c._hasBinanceChart = true
        return c
      })
  },

  async getTrendingCoins() {
    const coins = await this.getTopCoins()
    return coins.sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 12)
  },

  async getCoinById(id) {
    const coin = await fetchCoinGeckoById(id)
    coin._hasBinanceChart = false

    try {
      const tickers = await fetchUsdtTickers({ useCache: false })
      const ticker = findUsdtTicker(tickers, coin.symbol)
      if (ticker) {
        coin._hasBinanceChart = true
        coin.price = ticker.price
        coin.change24h = ticker.change24h
        coin.volume24h = ticker.volume24h
        coin.high24h = ticker.price * (1 + Math.max(ticker.change24h, 0) / 200)
        coin.low24h = Math.max(0, ticker.price * (1 - Math.max(-ticker.change24h, 0) / 200))
      }
    } catch {
      /* Binance is optional for detail */
    }

    return coin
  },
}

export default api
