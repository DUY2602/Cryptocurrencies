import { coins as localCoins } from "../data/coins.js";
import { fetchUsdtTickers, findUsdtTicker } from "./binance.js";

const symbolToLocal = new Map(
  localCoins.map((c) => [String(c.symbol).toUpperCase(), c]),
);

const idToLocal = new Map(
  localCoins.flatMap((c) => {
    const keys = [String(c.id), String(c.coingeckoId || c.id)];
    return keys.map((k) => [k, c]);
  }),
);

function mapMarketCoin(c) {
  return {
    id: c.id,
    coingeckoId: c.coingeckoId || c.id,
    name: c.name,
    symbol: (c.symbol || "").toUpperCase(),
    price: c.current_price ?? c.price ?? 0,
    marketCap: c.market_cap ?? c.marketCap ?? 0,
    volume24h: c.total_volume ?? c.volume24h ?? 0,
    change24h: c.price_change_percentage_24h ?? c.change24h ?? 0,
    image: c.image,
  };
}

function mapLocalCoin(c) {
  return {
    ...mapMarketCoin(c),
    volume24h: c.volume24h ?? c.marketCap * 0.08,
  };
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

async function getBinanceTopCoins(perPage = 50) {
  const tickers = await fetchUsdtTickers();

  // Prioritize coins that are in our local list first
  const localSymbols = Array.from(symbolToLocal.keys());
  const sortedTickers = [...tickers].sort((a, b) => {
    const aIsLocal = localSymbols.includes(a.symbol);
    const bIsLocal = localSymbols.includes(b.symbol);
    if (aIsLocal && !bIsLocal) return -1;
    if (!aIsLocal && bIsLocal) return 1;
    return b.volume24h - a.volume24h;
  });

  return sortedTickers.slice(0, perPage).map(tickerToCoin);
}

export const api = {
  async getTopCoins(perPage = 50) {
    // Always use local coins first (they have proper logos)
    const localList = localCoins.slice(0, perPage).map(mapLocalCoin);

    try {
      const binanceCoins = await getBinanceTopCoins(perPage);
      // Merge: keep local coins, add Binance data if available
      const localIds = new Set(localList.map((c) => c.symbol.toUpperCase()));
      const merged = [
        ...localList.map((local) => {
          const binance = binanceCoins.find(
            (b) => b.symbol.toUpperCase() === local.symbol.toUpperCase(),
          );
          if (binance) {
            return {
              ...local,
              price: binance.price,
              change24h: binance.change24h,
              volume24h: binance.volume24h,
            };
          }
          return local;
        }),
        ...binanceCoins
          .filter((b) => !localIds.has(b.symbol.toUpperCase()))
          .slice(0, Math.max(0, perPage - localList.length)),
      ];
      return merged.slice(0, perPage);
    } catch (err) {
      console.warn(
        "[api] Binance markets failed, using local only:",
        err.message,
      );
    }

    return localList;
  },

  getAllLocalCoins() {
    return localCoins.map(mapLocalCoin);
  },

  async getTrendingCoins() {
    try {
      const tickers = await fetchUsdtTickers();
      const top = [...tickers]
        .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
        .slice(0, 6)
        .map(tickerToCoin);
      if (top.length) return top;
    } catch (err) {
      console.warn("[api] trending:", err.message);
    }
    return localCoins.slice(0, 6).map(mapLocalCoin);
  },

  async getCoinById(id) {
    const local = idToLocal.get(String(id));

    try {
      const tickers = await fetchUsdtTickers();
      const ticker = local
        ? findUsdtTicker(tickers, local.symbol)
        : findUsdtTicker(tickers, id);

      if (ticker) {
        const base = local ? mapLocalCoin(local) : tickerToCoin(ticker);
        const price = ticker.price;
        return {
          ...base,
          price,
          change24h: ticker.change24h,
          volume24h: ticker.volume24h,
          high24h: price * (1 + Math.max(ticker.change24h, 0) / 200),
          low24h: price * (1 - Math.max(-ticker.change24h, 0) / 200),
          ath: local?.price ? local.price * 1.5 : price * 1.2,
          description:
            base.description ||
            `${base.name} — live price from Binance (${base.symbol}/USDT).`,
        };
      }
    } catch (err) {
      console.warn("[api] coin detail:", err.message);
    }

    if (local) {
      return {
        ...mapLocalCoin(local),
        high24h: local.price * 1.02,
        low24h: local.price * 0.98,
        ath: local.price * 1.5,
        description: `${local.name} market data (offline fallback).`,
      };
    }
    throw new Error("Coin not found");
  },
};

export default api;
