import { ref, onMounted, onUnmounted } from 'vue'
import { livePrices, priceFlashDirection, getLiveQuote } from '../services/livePrices.js'

export function useLivePrices(getCoinIds) {
  const liveData = ref({})
  const liveFlashes = ref({})
  const isLive = ref(false)

  let unsubscribe = null

  onMounted(() => {
    const coins =
      typeof getCoinIds === 'function'
        ? getCoinIds()
        : getCoinIds?.value ?? getCoinIds ?? []

    livePrices.start(Array.isArray(coins) ? coins : [])

    unsubscribe = livePrices.subscribe((data) => {
      liveFlashes.value = priceFlashDirection(liveData.value, data)
      liveData.value = data
      isLive.value = true
    })
  })

  onUnmounted(() => {
    if (unsubscribe) unsubscribe()
    livePrices.stop()
  })

  function applyLive(coin) {
    const live = getLiveQuote(liveData.value, coin)
    if (!live) return coin

    return {
      ...coin,
      price: live.usd ?? coin.price,
      change24h: live.usd_24h_change ?? coin.change24h ?? 0,
      _flash: liveFlashes.value[id] ?? coin._flash,
    }
  }

  return { liveData, isLive, applyLive }
}
