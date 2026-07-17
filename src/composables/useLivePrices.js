import { shallowRef, triggerRef, onMounted, onUnmounted } from 'vue'
import { livePrices, applyLiveFlashes, getLiveQuote } from '../services/livePrices.js'

export function useLivePrices(getCoinIds) {
  const liveData = shallowRef({})
  const liveFlashes = shallowRef({})
  const liveFlashTick = shallowRef({})
  const isLive = shallowRef(false)

  let unsubscribe = null

  onMounted(() => {
    const coins =
      typeof getCoinIds === 'function'
        ? getCoinIds()
        : getCoinIds?.value ?? getCoinIds ?? []

    livePrices.start(Array.isArray(coins) ? coins : [])

    unsubscribe = livePrices.subscribe((data) => {
      const { directions, tick } = applyLiveFlashes(
        liveFlashes.value,
        liveData.value,
        data,
      )
      Object.assign(liveFlashes.value, directions)
      Object.assign(liveFlashTick.value, tick)
      Object.assign(liveData.value, data)
      isLive.value = true
      triggerRef(liveData)
    })
  })

  onUnmounted(() => {
    if (unsubscribe) unsubscribe()
    livePrices.stop()
  })

  function applyLive(coin) {
    const id = String(coin.coingeckoId || coin.id)
    const live = getLiveQuote(liveData.value, coin)
    if (!live) return coin

    return {
      ...coin,
      price: live.usd ?? coin.price,
      change24h: live.usd_24h_change ?? coin.change24h ?? 0,
      _flash: liveFlashes.value[id],
      _flashTick: !!liveFlashTick.value[id],
    }
  }

  return { liveData, isLive, applyLive }
}
