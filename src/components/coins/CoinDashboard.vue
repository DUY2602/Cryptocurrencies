<script>
import { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts'
import { coinWebSocket } from "../../services/websocket.js"
import { livePrices, getLiveQuote } from "../../services/livePrices.js"
import { useTheme } from "../../composables/useTheme.js"
import { formatPrice, formatChange, formatMarketCap, changeClass, formatVolume } from "../../utils/format.js"

const TIMEFRAME_SECONDS = {
  '1s': 1,
  '1m': 60,
  '3m': 180,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '2h': 7200,
  '4h': 14400,
  '6h': 21600,
  '8h': 28800,
  '12h': 43200,
  '1d': 86400,
  '1w': 604800,
  '1M': 2592000,
}

const TIMEFRAME_FETCH_LIMIT = {
  '1s': 200,
  '1m': 300,
  '3m': 300,
  '5m': 300,
  '15m': 500,
  '30m': 500,
  '1h': 500,
  '2h': 500,
  '4h': 500,
  '6h': 500,
  '8h': 500,
  '12h': 500,
  '1d': 500,
  '1w': 200,
  '1M': 100,
}

const TIMEFRAME_BAR_SPACING = {
  '1s': 8,
  '1m': 8,
  '3m': 8,
  '5m': 8,
  default: 8,
}

const TIMEFRAME_LABELS = {
  '1s': '1s',
  '1m': '1m',
  '3m': '3m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '2h': '2h',
  '4h': '4h',
  '6h': '6h',
  '8h': '8h',
  '12h': '12h',
  '1d': '1D',
  '1w': '1W',
  '1M': '1M',
}

export default {
  name: 'CoinDashboard',
  props: {
    coin: { type: Object, required: true },
  },
  data() {
    return {
      currentPrice: null,
      change24h: null,
      volume24h: null,
      timeframe: '1h',
      timeframes: ['1s', '1m', '5m', '15m', '1h', '4h', '12h', '1d', '1w'],
      loading: true,
      error: null,
      noChart: false,
      chartSource: 'binance',
      flashDirection: '',
      flashKey: 0,
      chart: null,
      candlestickSeries: null,
      volumeSeries: null,
      maSeries: null,
      emaSeries: null,
      resizeObserver: null,
      candles: [],
      volumes: [],
      maData: [],
      emaData: [],
      
      // New reactive states for Web3 Dashboard Redesign
      activeIndicator: 'Price',
      bullishPercent: 68,
      bearishPercent: 32,
    }
  },
  computed: {
    isDark() {
      const { isDark } = useTheme()
      return isDark.value
    },
  },
  watch: {
    'coin.id': { handler() { this.resetDashboard() } },
    isDark() { this.updateChartTheme() },
    activeIndicator(val) {
      if (this.candlestickSeries) this.candlestickSeries.applyOptions({ visible: val === 'Price' })
      if (this.maSeries) this.maSeries.applyOptions({ visible: val === 'MA' })
      if (this.emaSeries) this.emaSeries.applyOptions({ visible: val === 'EMA' })
      if (this.volumeSeries) {
        this.volumeSeries.applyOptions({ visible: val === 'Vol' })
        if (val === 'Vol') {
          this.volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0, bottom: 0 },
          })
        } else {
          this.volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
          })
        }
      }
    }
  },
  mounted() {
    this.resetDashboard()
    this.subscribeRealtime()
  },
  beforeUnmount() {
    this.cleanupChart()
    if (this._unsub) this._unsub()
    if (this.flashTimer) clearTimeout(this.flashTimer)
  },
  methods: {
    formatPrice,
    formatChange,
    formatMarketCap,
    changeClass,
    formatVolume,

    async resetDashboard() {
      this.loading = true
      this.error = null
      this.noChart = false
      this.currentPrice = this.coin.price ?? null
      this.change24h   = this.coin.change24h ?? null
      this.volume24h   = this.coin.volume24h ?? null
      this.cleanupChart()
      await this.loadHistoricalData()
    },

    async loadHistoricalData() {
      this.loading = true
      this.error = null
      this.chartSource = 'binance'

      const symbol = this.coin.symbol
      const pair = coinWebSocket.toBinancePair(symbol)

      if (!pair) {
        this.error = 'Trading pair not found on Binance.'
        this.loading = false
        return
      }

      try {
        const limit = TIMEFRAME_FETCH_LIMIT[this.timeframe] || 500
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${this.timeframe}&limit=${limit}`,
          { signal: controller.signal }
        )
        clearTimeout(timeoutId)
        if (!res.ok) throw new Error(`Binance API error (${res.status})`)
        const data = await res.json()

        this.candles = data.map((d) => ({
          time:  Math.floor(d[0] / 1000),
          open:  parseFloat(d[1]),
          high:  parseFloat(d[2]),
          low:   parseFloat(d[3]),
          close: parseFloat(d[4]),
        }))

        if (this.timeframe === '1s' && this.candles.length > 1) {
          for (let i = 1; i < this.candles.length; i++) {
            const prev = this.candles[i - 1]
            const curr = this.candles[i]
            curr.open = prev.close
            curr.high = Math.max(curr.high, prev.close, curr.close)
            curr.low  = Math.min(curr.low,  prev.close, curr.close)
          }
        }

        this.volumes = data.map((d) => {
          const open  = parseFloat(d[1])
          const close = parseFloat(d[4])
          return {
            time:  Math.floor(d[0] / 1000),
            value: parseFloat(d[5]),
            color: close >= open ? 'rgba(14, 203, 129, 0.45)' : 'rgba(246, 70, 93, 0.45)',
          }
        })

        let emaVal = this.candles.length > 0 ? this.candles[0].close : 0
        const k = 2 / (20 + 1)
        this.maData = []
        this.emaData = []
        for (let i = 0; i < this.candles.length; i++) {
          const c = this.candles[i]
          if (i === 0) emaVal = c.close
          else emaVal = (c.close - emaVal) * k + emaVal
          this.emaData.push({ time: c.time, value: emaVal })

          if (i >= 19) {
            let sum = 0
            for (let j = 0; j < 20; j++) sum += this.candles[i - j].close
            this.maData.push({ time: c.time, value: sum / 20 })
          }
        }

        this.$nextTick(() => {
          try { this.initChart() } catch (e) {
            console.error('[CoinDashboard] initChart error:', e)
            this.error = e.message || 'Error rendering chart'
          }
        })
      } catch (err) {
        console.error('[CoinDashboard]', err)
        this.error = 'Failed to load chart data from Binance.'
      } finally {
        this.loading = false
      }
    },

    initChart() {
      const container = this.$refs.chartContainer
      if (!container) return

      if (this.chart && this.candlestickSeries && this.volumeSeries) {
        this.candlestickSeries.setData(this.candles)
        this.volumeSeries.setData(this.volumes)
        if (this.maSeries) this.maSeries.setData(this.maData)
        if (this.emaSeries) this.emaSeries.setData(this.emaData)
        this.chart.timeScale().scrollToRealTime()
        return
      }

      this.chart = createChart(container, {
        width:  container.clientWidth,
        height: 400,
        layout: {
          background: { type: ColorType.Solid, color: this.isDark ? '#0b0f19' : '#ffffff' },
          textColor:  this.isDark ? '#9ca3af' : '#475569',
        },
        localization: {
          timeFormatter: (time) => {
            const d = new Date(time * 1000)
            const vn = (opts) => new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false, ...opts }).format(d)
            if (this.timeframe === '1s') return vn({ hour: '2-digit', minute: '2-digit', second: '2-digit' })
            if (['1d', '1w', '1M'].includes(this.timeframe)) return vn({ year: 'numeric', month: '2-digit', day: '2-digit' })
            return vn({ year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
          },
        },
        grid: {
          vertLines: { color: this.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)' },
          horzLines: { color: this.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)' },
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: this.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)', visible: true },
        timeScale: {
          borderColor:    this.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
          timeVisible:    true,
          secondsVisible: this.timeframe === '1s',
          rightOffset:    3,
          barSpacing:     TIMEFRAME_BAR_SPACING[this.timeframe] || TIMEFRAME_BAR_SPACING.default || 8,
          tickMarkFormatter: (time, tickMarkType) => {
            const d = new Date(time * 1000)
            const vn = (opts) =>
              new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false, ...opts }).format(d)
            if (tickMarkType === 0) return vn({ year: 'numeric' })
            if (tickMarkType === 1) return vn({ month: 'short', year: 'numeric' })
            if (tickMarkType === 2) return vn({ day: 'numeric', month: 'short' })
            if (tickMarkType === 4) return vn({ hour: '2-digit', minute: '2-digit', second: '2-digit' })
            return vn({ hour: '2-digit', minute: '2-digit' })
          },
        },
      })

      this.candlestickSeries = this.chart.addSeries(CandlestickSeries, {
        upColor:        '#0ecb81',
        downColor:      '#f6465d',
        borderUpColor:  '#0ecb81',
        borderDownColor:'#f6465d',
        wickUpColor:    '#0ecb81',
        wickDownColor:  '#f6465d',
        visible: this.activeIndicator === 'Price',
      })
      this.candlestickSeries.setData(this.candles)

      this.maSeries = this.chart.addSeries(LineSeries, {
        color: '#f0b90b',
        lineWidth: 2,
        visible: this.activeIndicator === 'MA',
      })
      this.maSeries.setData(this.maData)

      this.emaSeries = this.chart.addSeries(LineSeries, {
        color: '#7d2ae8',
        lineWidth: 2,
        visible: this.activeIndicator === 'EMA',
      })
      this.emaSeries.setData(this.emaData)

      this.volumeSeries = this.chart.addSeries(HistogramSeries, {
        priceFormat:       { type: 'volume' },
        priceScaleId:      '',
        lastValueVisible:  false,
        priceLineVisible:  false,
        visible: this.activeIndicator === 'Vol',
      })
      this.volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
      this.volumeSeries.setData(this.volumes)

      this.chart.timeScale().scrollToRealTime()

      this.setupTooltip()
      this.setupResizeObserver()
    },

    updateChartTheme() {
      if (!this.chart) return
      this.chart.applyOptions({
        layout: {
          background: { type: ColorType.Solid, color: this.isDark ? '#0b0f19' : '#ffffff' },
          textColor:  this.isDark ? '#9ca3af' : '#475569',
        },
        grid: {
          vertLines: { color: this.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)' },
          horzLines: { color: this.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)' },
        },
        rightPriceScale: { borderColor: this.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)' },
        timeScale:       { borderColor: this.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)' },
      })
    },

    setupTooltip() {
      const tooltip   = this.$refs.tooltip
      const container = this.$refs.chartContainer

      this.chart.subscribeCrosshairMove((param) => {
        if (
          !param.time ||
          param.point === undefined ||
          param.point.x < 0 || param.point.x > container.clientWidth ||
          param.point.y < 0 || param.point.y > container.clientHeight
        ) {
          tooltip.style.display = 'none'
          return
        }

        const data       = param.seriesData.get(this.candlestickSeries)
        const volumeData = param.seriesData.get(this.volumeSeries)
        if (!data) { tooltip.style.display = 'none'; return }

        const { open, high, low, close } = data
        const volume = volumeData ? volumeData.value : 0
        const time   = param.time

        let formattedTime = ''
        if (typeof time === 'number') {
          const vn = (opts) =>
            new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false, ...opts }).format(new Date(time * 1000))
          if (['1d', '1w', '1M'].includes(this.timeframe)) {
            formattedTime = vn({ year: 'numeric', month: '2-digit', day: '2-digit' })
          } else if (this.timeframe === '1s') {
            formattedTime = vn({ hour: '2-digit', minute: '2-digit', second: '2-digit' })
          } else {
            formattedTime = vn({ year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
          }
        } else {
          formattedTime = String(time)
        }

        tooltip.innerHTML = `
          <div class="tooltip-header d-flex justify-content-between align-items-center mb-1">
            <span class="fw-bold text-emphasis">${this.coin.symbol.toUpperCase()}/USDT</span>
            <span class="tooltip-time text-secondary small font-monospace">${formattedTime}</span>
          </div>
          <div class="tooltip-divider"></div>
          <div class="tooltip-body mt-1">
            <div class="tooltip-row"><span class="tooltip-lbl">O:</span><span class="tooltip-val">${this.formatPrice(open)}</span></div>
            <div class="tooltip-row"><span class="tooltip-lbl">H:</span><span class="tooltip-val text-positive">${this.formatPrice(high)}</span></div>
            <div class="tooltip-row"><span class="tooltip-lbl">L:</span><span class="tooltip-val text-negative">${this.formatPrice(low)}</span></div>
            <div class="tooltip-row"><span class="tooltip-lbl">C:</span><span class="tooltip-val">${this.formatPrice(close)}</span></div>
            <div class="tooltip-row"><span class="tooltip-lbl">Vol:</span><span class="tooltip-val">${this.formatVolume(volume)}</span></div>
          </div>
        `

        const tw = 180, th = 135
        let left = param.point.x + 15, top = param.point.y + 15
        if (left + tw > container.clientWidth)  left = param.point.x - tw - 15
        if (top  + th > container.clientHeight) top  = param.point.y - th - 15
        tooltip.style.left    = `${left}px`
        tooltip.style.top     = `${top}px`
        tooltip.style.display = 'block'
      })
    },

    setupResizeObserver() {
      const container = this.$refs.chartContainer
      if (!container) return
      this.resizeObserver = new ResizeObserver((entries) => {
        if (!entries.length || !this.chart) return
        const { width, height } = entries[0].contentRect
        this.chart.resize(width, height || 400)
      })
      this.resizeObserver.observe(container)
    },

    cleanupChart() {
      if (this.resizeObserver) { this.resizeObserver.disconnect(); this.resizeObserver = null }
      if (this.chart) {
        this.chart.remove()
        this.chart = null
        this.candlestickSeries = null
        this.volumeSeries      = null
        this.maSeries          = null
        this.emaSeries         = null
      }
    },

    subscribeRealtime() {
      this._unsub = livePrices.subscribe((prices) => {
        const quote = getLiveQuote(prices, this.coin)
        if (!quote) return

        if (quote.usd != null) {
          if (this.currentPrice !== null && this.currentPrice !== quote.usd) {
            const prev = this.flashDirection
            this.flashDirection = quote.usd > this.currentPrice ? 'up' : 'down'
            this.flashKey += 1
            if (this.flashTimer) clearTimeout(this.flashTimer)
            this.flashTimer = setTimeout(() => { this.flashDirection = '' }, 1200)
          }
          this.currentPrice = quote.usd
        }
        if (quote.usd_24h_change != null) this.change24h = quote.usd_24h_change
        if (quote.usd_24h_volume != null) this.volume24h = quote.usd_24h_volume

        if (quote.usd != null && this.chart && this.candles.length) {
          this.updateChartRealtime(quote.usd, quote.timestamp || Date.now())
        }
      })
    },

    updateChartRealtime(price, tickTimeMs) {
      if (!this.candlestickSeries || !this.candles.length) return

      const lastBar     = this.candles[this.candles.length - 1]
      const nowSec      = Math.floor(tickTimeMs / 1000)
      const intervalSec = TIMEFRAME_SECONDS[this.timeframe]
      let barTime       = Math.floor(nowSec / intervalSec) * intervalSec

      if (barTime < lastBar.time) barTime = lastBar.time

      let updatedBar
      if (barTime === lastBar.time) {
        lastBar.high  = Math.max(lastBar.high, price)
        lastBar.low   = Math.min(lastBar.low,  price)
        lastBar.close = price
        updatedBar = lastBar
      } else if (barTime > lastBar.time) {
        const newOpen = this.timeframe === '1s' ? lastBar.close : price
        updatedBar = {
          time:  barTime,
          open:  newOpen,
          high:  Math.max(newOpen, price),
          low:   Math.min(newOpen, price),
          close: price,
        }
        this.candles.push(updatedBar)
      }

      if (updatedBar) {
        this.candlestickSeries.update(updatedBar)

        if (this.volumeSeries && this.volumes.length) {
          const lastVol = this.volumes[this.volumes.length - 1]
          let volBar
          if (barTime === lastVol.time) {
            lastVol.color = updatedBar.close >= updatedBar.open
              ? 'rgba(14, 203, 129, 0.45)' : 'rgba(246, 70, 93, 0.45)'
            volBar = lastVol
          } else if (barTime > lastVol.time) {
            volBar = {
              time:  barTime,
              value: 0,
              color: price >= lastBar.close ? 'rgba(14, 203, 129, 0.45)' : 'rgba(246, 70, 93, 0.45)'
            }
            this.volumes.push(volBar)
          }
          if (volBar) this.volumeSeries.update(volBar)
        }
        
        // Note: For simplicity we only append to EMA/MA if requested specifically for real-time.
        // It recalculates when switching indicators or timeframes.
      }
    },

    tfLabel(tf) { return TIMEFRAME_LABELS[tf] || tf },

    changeTimeframe(tf) {
      if (this.timeframe === tf) return
      this.timeframe = tf
      this.cleanupChart()
      this.loadHistoricalData()
    },
  },
}
</script>

<template>
  <div class="card card-crypto coin-dashboard h-100 d-flex flex-column web3-dashboard">
    <!-- Dashboard Header -->
    <div class="dashboard-header p-3 border-bottom d-flex flex-wrap align-items-center justify-content-between gap-3">
      <div class="d-flex align-items-center gap-3">
        <span class="symbol-badge font-monospace">{{ coin.symbol.toUpperCase() }}/USDT</span>
        
         <div class="price-display-wrapper rounded px-2 py-1">
           <span class="price-val fw-bold" :class="flashDirection === 'up' ? 'text-positive' : flashDirection === 'down' ? 'text-negative' : ''">
             {{ formatPrice(currentPrice) }}
           </span>
         </div>
      </div>

      <!-- Timeframe Selector -->
      <div class="timeframe-selector d-flex align-items-center flex-wrap gap-1 bg-secondary-custom rounded p-1">
        <button
          v-for="tf in timeframes"
          :key="tf"
          class="btn-tf"
          :class="{ active: timeframe === tf }"
          @click="changeTimeframe(tf)"
        >
          {{ tfLabel(tf) }}
        </button>
      </div>
    </div>

    <!-- Main Content Area: Row -->
    <div class="row g-0 flex-grow-1 dashboard-body">
      <!-- Main Column: Chart & Stats -->
      <div class="col-12 d-flex flex-column">
        
        <!-- Indicator Buttons -->
        <div class="p-2 border-bottom border-secondary border-opacity-25 d-flex gap-2 indicator-bar">
          <button class="btn btn-sm rounded-pill indicator-btn" :class="{ 'active': activeIndicator === 'Price' }" @click="activeIndicator = 'Price'">Price</button>
          <button class="btn btn-sm rounded-pill indicator-btn" :class="{ 'active': activeIndicator === 'MA' }" @click="activeIndicator = 'MA'">MA</button>
          <button class="btn btn-sm rounded-pill indicator-btn" :class="{ 'active': activeIndicator === 'EMA' }" @click="activeIndicator = 'EMA'">EMA</button>
          <button class="btn btn-sm rounded-pill indicator-btn" :class="{ 'active': activeIndicator === 'Vol' }" @click="activeIndicator = 'Vol'">Volume</button>
        </div>

        <!-- Chart / Spinner Area -->
        <div class="flex-grow-1 chart-area-wrapper position-relative p-3">
          <div v-if="loading" class="chart-loading-overlay d-flex flex-column align-items-center justify-content-center">
            <div class="spinner-crypto mb-2"></div>
            <span class="text-secondary small">Loading chart data...</span>
          </div>

          <div v-else-if="error" class="chart-error-overlay d-flex flex-column align-items-center justify-content-center text-center p-3">
            <AlertTriangle :size="24" class="mb-2" />
            <span class="text-danger fw-semibold mb-2">{{ error }}</span>
            <button class="btn btn-sm btn-outline-accent" @click="loadHistoricalData">Retry</button>
          </div>

          <div v-else-if="noChart" class="chart-error-overlay d-flex flex-column align-items-center justify-content-center text-center p-3">
            <BarChart3 :size="24" class="mb-2" />
            <span class="text-secondary fw-semibold mb-2">Chart not available for this coin</span>
          </div>

          <div class="chart-outer-container w-100 h-100" v-show="!loading && !error && !noChart">
            <div ref="chartContainer" class="chart-container-el w-100 h-100"></div>
            <div ref="tooltip" class="chart-tooltip"></div>
          </div>
        </div>

        <!-- Market Sentiment (Moved below chart) -->
        <div class="p-3 px-4 border-top border-secondary border-opacity-25">
          <h6 class="text-uppercase text-muted fw-bold mb-2 panel-title">Market Sentiment</h6>
          <div class="d-flex justify-content-between small mb-1">
            <span>Bullish ({{ bullishPercent }}%)</span>
            <span>Bearish ({{ bearishPercent }}%)</span>
          </div>
          <div class="progress mb-0 sentiment-progress">
            <div class="progress-bar bg-positive" :style="{ width: bullishPercent + '%' }"></div>
            <div class="progress-bar bg-negative" :style="{ width: bearishPercent + '%' }"></div>
          </div>
        </div>

        <!-- Bottom Stat Cards -->
        <div class="row g-3 p-3 stat-cards-container border-top border-secondary border-opacity-25">
          <div class="col-md-3 col-6">
            <div class="card stat-card border-0 h-100 p-2">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="text-muted small">Market Cap</div>
                  <div class="fw-bold mt-1">{{ formatMarketCap(coin.marketCap) }}</div>
                </div>
                <div class="sparkline-placeholder"><svg width="40" height="20"><path d="M0 20 Q10 5, 20 15 T40 0" fill="none" stroke="var(--accent)" stroke-width="2"/></svg></div>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-6">
            <div class="card stat-card border-0 h-100 p-2">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="text-muted small">24h Volume</div>
                  <div class="fw-bold mt-1">{{ formatVolume(coin.volume24h) }}</div>
                </div>
                <div class="sparkline-placeholder"><svg width="40" height="20"><path d="M0 10 Q10 20, 20 10 T40 5" fill="none" stroke="#7d2ae8" stroke-width="2"/></svg></div>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-6">
            <div class="card stat-card border-0 h-100 p-2">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="text-muted small">24h High</div>
                  <div class="fw-bold text-positive mt-1">{{ formatPrice(coin.high24h) }}</div>
                </div>
                <div class="sparkline-placeholder"><svg width="40" height="20"><path d="M0 20 L40 0" fill="none" stroke="#0ecb81" stroke-width="2"/></svg></div>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-6">
            <div class="card stat-card border-0 h-100 p-2">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="text-muted small">24h Low</div>
                  <div class="fw-bold text-negative mt-1">{{ formatPrice(coin.low24h) }}</div>
                </div>
                <div class="sparkline-placeholder"><svg width="40" height="20"><path d="M0 0 L40 20" fill="none" stroke="#f6465d" stroke-width="2"/></svg></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.web3-dashboard {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow);
  color: var(--text-primary);
}

.dashboard-header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color) !important;
}

.symbol-badge {
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  letter-spacing: 0.5px;
  font-weight: 700;
}

.price-display-wrapper {
  padding: 4px 12px;
}

.price-val {
  font-size: 1.5rem;
  letter-spacing: -0.5px;
  color: var(--text-emphasis);
  transition: color 0.2s ease;
}

.bg-secondary-custom {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.btn-tf {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
}

.btn-tf:hover {
  color: var(--text-emphasis);
  background: var(--bg-card-hover);
}

.btn-tf.active {
  background: var(--border-color);
  color: var(--text-emphasis);
}

.indicator-bar {
  background: var(--bg-secondary);
}

.indicator-btn {
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid transparent;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 12px;
}

.indicator-btn:hover {
  color: var(--text-emphasis);
  background: var(--bg-card-hover);
}

.indicator-btn.active {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  border-color: color-mix(in srgb, var(--accent) 20%, transparent);
}

.chart-area-wrapper {
  min-height: 300px;
  height: 50vh;
  max-height: 600px;
  position: relative;
  background: var(--bg-secondary);
}

.chart-loading-overlay,
.chart-error-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 10;
  background: var(--bg-card);
}

/* Tooltip */
.chart-tooltip {
  position: absolute;
  display: none;
  padding: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  font-size: 12px;
  color: var(--text-primary);
  z-index: 100;
  pointer-events: none;
  box-shadow: var(--shadow);
  min-width: 180px;
}

:deep(.tooltip-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.tooltip-divider) {
  height: 1px;
  background: var(--border-color);
  margin: 8px 0;
}

:deep(.tooltip-row) {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

:deep(.tooltip-lbl) {
  color: var(--text-secondary);
  font-weight: 500;
}

:deep(.tooltip-val) {
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-primary);
}

/* Stat Cards */
.stat-cards-container {
  background: var(--bg-secondary);
}

.stat-card {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 10px;
}

.stat-card:hover {
  background: var(--bg-card-hover) !important;
}

.sparkline-placeholder {
  opacity: 0.7;
}

.right-analytics-panel {
  background: var(--bg-card);
}

.panel-title {
  font-size: 0.75rem;
  letter-spacing: 1px;
  color: var(--text-secondary) !important;
}

.sentiment-progress {
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.bg-positive {
  background-color: var(--positive) !important;
}

.bg-negative {
  background-color: var(--negative) !important;
}

.text-positive {
  color: var(--positive) !important;
}

.text-negative {
  color: var(--negative) !important;
}

.text-emphasis {
  color: var(--text-emphasis);
}

@keyframes flashPulseGreen {
  0%   { background-color: color-mix(in srgb, var(--positive) 35%, transparent); }
  100% { background-color: transparent; }
}

@keyframes flashPulseRed {
  0%   { background-color: color-mix(in srgb, var(--negative) 35%, transparent); }
  100% { background-color: transparent; }
}

.flash-bg-up {
  animation: flashPulseGreen 1.4s ease-out;
}

.flash-bg-down {
  animation: flashPulseRed 1.4s ease-out;
}
</style>
