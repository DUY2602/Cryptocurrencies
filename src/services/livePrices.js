import { coinWebSocket } from "./websocket.js";
import { coins as localCoins } from "../data/coins.js";

const subscribers = new Set();
let trackedIds = [];
let refCount = 0;
let unsubscribeWs = null;
let latestPrices = {};
let trackedCoinsMeta = [];
const hideArrowOnUnchanged = true;

function notify(prices) {
  latestPrices = { ...latestPrices, ...prices };
  const snapshot = { ...latestPrices };
  subscribers.forEach((cb) => {
    try {
      cb(snapshot);
    } catch (e) {
      console.error("[livePrices] subscriber error:", e);
    }
  });
}

function normalizeTrackedEntry(entry) {
  if (entry == null) return null;

  if (typeof entry === "object") {
    const id = String(entry.coingeckoId || entry.id || "").trim();
    const symbol = String(entry.symbol || "")
      .trim()
      .toUpperCase();
    if (id && symbol) return { id, symbol };
    if (!id) return null;
    const local = localCoins.find(
      (c) => String(c.id) === id || String(c.coingeckoId) === id,
    );
    if (local) {
      return {
        id: String(local.coingeckoId || local.id),
        symbol: local.symbol,
      };
    }
    return null;
  }

  const id = String(entry).trim();
  const local = localCoins.find(
    (c) => String(c.id) === id || String(c.coingeckoId) === id,
  );
  if (!local) return null;
  return { id: String(local.coingeckoId || local.id), symbol: local.symbol };
}

function resolveCoins(coinsOrIds) {
  const seen = new Set();
  const resolved = [];

  for (const entry of coinsOrIds) {
    const coin = normalizeTrackedEntry(entry);
    if (!coin || seen.has(coin.id)) continue;
    seen.add(coin.id);
    resolved.push(coin);
  }

  return resolved;
}

function mergeTrackedIds(newEntries) {
  const resolved = resolveCoins(newEntries);
  const set = new Set([...trackedIds, ...resolved.map((c) => c.id)]);
  trackedIds = [...set];
  return resolved;
}

function applyWebSocketTracking() {
  const coins = trackedCoinsMeta.length
    ? trackedCoinsMeta
    : resolveCoins(trackedIds);
  if (!coins.length) return;

  if (!unsubscribeWs) {
    unsubscribeWs = coinWebSocket.subscribe((prices) => notify(prices));
  }

  coinWebSocket.setTrackedCoins(coins);
}

function fullStop() {
  trackedIds = [];
  trackedCoinsMeta = [];
  latestPrices = {};

  if (unsubscribeWs) {
    unsubscribeWs();
    unsubscribeWs = null;
  }
  coinWebSocket.disconnect();
}

export function getLiveQuote(liveMap, coin) {
  const id = String(coin.coingeckoId || coin.id);
  const sym = String(coin.symbol || "").toUpperCase();
  return (
    liveMap[id] ||
    (sym ? liveMap[sym] : null) ||
    (sym ? liveMap[sym.toLowerCase()] : null)
  );
}

/**
 * Arrow direction follows actual price ticks only (not 24h %).
 * Returns persistent directions + which ids changed this tick (for pulse).
 */
export function applyLiveFlashes(stored, prevMap, nextMap) {
  const directions = { ...stored };
  const tick = {};

  Object.entries(nextMap).forEach(([id, live]) => {
    const prev = prevMap[id]?.usd;
    if (prev == null || live?.usd == null) return;
    if (prev === live.usd) {
      if (hideArrowOnUnchanged && directions[id]) {
        delete directions[id];
      }
      return;
    }

    const dir = live.usd >= prev ? "up" : "down";
    directions[id] = dir;
    tick[id] = dir;
  });

  return { directions, tick };
}

// `hideArrowOnUnchanged` is always enabled; no runtime setter exposed.

export const livePrices = {
  subscribe(callback) {
    subscribers.add(callback);
    if (Object.keys(latestPrices).length) {
      callback({ ...latestPrices });
    }
    return () => subscribers.delete(callback);
  },

  start(coinsOrIds) {
    if (!coinsOrIds?.length) return;

    if (refCount > 8) {
      console.warn("[livePrices] resetting leaked sessions");
      refCount = 0;
      fullStop();
    }

    refCount += 1;
    const resolved = mergeTrackedIds(coinsOrIds);
    if (resolved.length) {
      const byId = new Map(trackedCoinsMeta.map((c) => [c.id, c]));
      resolved.forEach((c) => byId.set(c.id, c));
      trackedCoinsMeta = [...byId.values()];
    }
    applyWebSocketTracking();
  },

  track(coinsOrIds) {
    if (!coinsOrIds?.length) return;
    const resolved = mergeTrackedIds(coinsOrIds);
    if (resolved.length) {
      const byId = new Map(trackedCoinsMeta.map((c) => [c.id, c]));
      resolved.forEach((c) => byId.set(c.id, c));
      trackedCoinsMeta = [...byId.values()];
    }
    applyWebSocketTracking();
  },

  stop() {
    refCount = Math.max(0, refCount - 1);
    if (refCount > 0) return;
    fullStop();
  },

  stopAll() {
    refCount = 0;
    fullStop();
  },

  getLatest() {
    return { ...latestPrices };
  },
};

export default livePrices;
