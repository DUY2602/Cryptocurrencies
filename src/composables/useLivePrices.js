import { ref, onMounted, onUnmounted } from 'vue'
import { livePrices } from '../services/livePrices.js'

export function useLivePrices(coinIdsRef) {
  const liveData = ref({})
  const isLive = ref(false)

  let unsubscribe = null

  onMounted(() => {
    unsubscribe = livePrices.subscribe((data) => {
      liveData.value = data
      isLive.value = true
    })

    const updateIds = () => {
      const ids = typeof coinIdsRef === 'function' ? coinIdsRef() : coinIdsRef?.value || coinIdsRef || []
      livePrices.start(ids)
    }

    updateIds()
  })

  onUnmounted(() => {
    if (unsubscribe) unsubscribe()
    livePrices.stop()
  })

  function applyLive(coin) {
    const id = coin.coingeckoId || coin.id
    const live = liveData.value[id]
    if (!live) return coin
    return {
      ...coin,
      price: live.usd ?? coin.price,
      change24h: live.usd_24h_change ?? coin.change24h,
      _flash: live.usd_24h_change >= 0 ? 'up' : 'down',
    }
  }

  return { liveData, isLive, applyLive }
}
