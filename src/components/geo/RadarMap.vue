<template>
  <div class="map-section">
    <canvas ref="canvasEl" class="map-canvas" @mousemove="onMove" @mouseleave="onLeave" />
    <div v-if="tip" class="map-tooltip" :style="tipPos">
      <div class="tip-name">{{ tip.name }}</div>
      <div class="tip-rank">Rank #{{ tip.rank }} / {{ total }}</div>
      <div class="tip-row"><span class="tip-label">Score</span><span class="tip-val">{{ tip.score.toFixed(3) }}</span></div>
      <div class="tip-row"><span class="tip-label">Level</span><span class="tip-lvl" :style="{color:tip.color}">{{ tip.level }}</span></div>
      <div class="tip-bar"><div class="tip-fill" :style="{width:(tip.score*100)+'%',background:tip.color}" /></div>
    </div>
    <div class="legend">
      <span class="legend-item"><span class="swatch" style="background:#e03131" /> Very Low</span>
      <span class="legend-item"><span class="swatch" style="background:#ff6b35" /> Low</span>
      <span class="legend-item"><span class="swatch" style="background:#ffd43b" /> Low-Med</span>
      <span class="legend-item"><span class="swatch" style="background:#a8e36d" /> Medium</span>
      <span class="legend-item"><span class="swatch" style="background:#57e389" /> Med-High</span>
      <span class="legend-item"><span class="swatch" style="background:#2b9348" /> High</span>
      <span class="legend-item"><span class="swatch" style="background:#0b5e2e" /> Very High</span>
    </div>
    <div class="map-note">
      Based on Chainalysis 2025 Global Crypto Adoption Index &mdash; measures how widely ordinary people use cryptocurrency in each country, adjusted for population size and economic power. Green = crypto is commonly used in daily life; Red = crypto usage is still rare.
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import adoptionData from '../../data/adoptionIndex.json'

const GEOJSON_URL = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'

const NAME_MAP = {
  'USA': 'United States',
  'South Korea': 'Korea, Rep.',
  'Russia': 'Russian Federation',
  'Vietnam': 'Viet Nam',
  'Turkey': 'Turkiye',
  'Czech Republic': 'Czechia',
  'Egypt': 'Egypt, Arab Rep.',
  'Slovakia': 'Slovak Republic',
  'Yemen': 'Yemen, Rep.',
  'Venezuela': 'Venezuela, RB',
  'Laos': 'Lao PDR',
  'Brunei': 'Brunei Darussalam',
  'The Bahamas': 'Bahamas, The',
  'Kyrgyzstan': 'Kyrgyz Republic',
  'Macedonia': 'North Macedonia',
  'Swaziland': 'Eswatini',
  'Cape Verde': 'Cabo Verde',
  'East Timor': 'Timor-Leste',
  'Syria': 'Syrian Arab Republic',
  'Ivory Coast': "Cote d'Ivoire",
  'United Republic of Tanzania': 'Tanzania',
  'Republic of Serbia': 'Serbia',
  'West Bank': 'West Bank and Gaza',
  'England': 'United Kingdom',
}

function norm(name) {
  return NAME_MAP[name] || name
}

const COLORS = ['#e03131','#ff6b35','#ffd43b','#a8e36d','#57e389','#2b9348','#0b5e2e']
const LEVELS = ['Very Low','Low','Low-Med','Medium','Med-High','High','Very High']

function scoreColor(s) {
  if (s >= 0.92) return COLORS[6]
  if (s >= 0.75) return COLORS[5]
  if (s >= 0.55) return COLORS[4]
  if (s >= 0.35) return COLORS[3]
  if (s >= 0.15) return COLORS[2]
  if (s >= 0.04) return COLORS[1]
  return COLORS[0]
}

function scoreLevel(s) {
  if (s >= 0.92) return LEVELS[6]
  if (s >= 0.75) return LEVELS[5]
  if (s >= 0.55) return LEVELS[4]
  if (s >= 0.35) return LEVELS[3]
  if (s >= 0.15) return LEVELS[2]
  if (s >= 0.04) return LEVELS[1]
  return LEVELS[0]
}

export default {
  name: 'AdoptionMap',
  setup() {
    const canvasEl = ref(null)
    const tip = ref(null)
    const tipPos = ref({})
    const geo = ref([])
    const loaded = ref(false)
    const total = ref(0)

    let ctx = null
    let ro = null
    let paths = []

    const index = adoptionData || {}
    const ranked = Object.entries(index).sort((a, b) => b[1] - a[1])
    total.value = ranked.length

    function proj(lat, lng, w, h) {
      return { x: (lng + 180) / 360 * w, y: (90 - lat) / 180 * h }
    }

    function pointInPolygon(px, py, rings) {
      let inside = false
      for (const ring of rings) {
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const xi = ring[i].x, yi = ring[i].y
          const xj = ring[j].x, yj = ring[j].y
          if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
            inside = !inside
          }
        }
      }
      return inside
    }

    function pointInMultiPolygon(px, py, polygons) {
      for (const poly of polygons) {
        if (pointInPolygon(px, py, poly)) return true
      }
      return false
    }

    async function loadGeo() {
      try {
        const r = await fetch(GEOJSON_URL)
        if (!r.ok) throw Error(String(r.status))
        const d = await r.json()
        geo.value = d.features || []
        loaded.value = true
        draw()
      } catch (e) {
        console.warn('[map] GeoJSON fail:', e.message)
      }
    }

    function draw() {
      if (!ctx || !canvasEl.value || !loaded.value) return
      const rect = canvasEl.value.getBoundingClientRect()
      const cw = rect.width * devicePixelRatio
      const ch = rect.height * devicePixelRatio
      if (canvasEl.value.width !== cw || canvasEl.value.height !== ch) {
        canvasEl.value.width = cw
        canvasEl.value.height = ch
      }
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
      ctx.clearRect(0, 0, rect.width, rect.height)

      ctx.fillStyle = '#0b1220'
      ctx.fillRect(0, 0, rect.width, rect.height)

      paths = []

      for (const feat of geo.value) {
        const raw = feat.properties?.name
        if (!raw) continue
        const key = norm(raw)
        const hasData = key in index
        const s = hasData ? index[key] : 0
        const color = scoreColor(s)
        const g = feat.geometry
        if (!g || !g.coordinates) continue
        const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates
        const entry = { key, polygons: [] }
        for (const poly of polys) {
          const rings = []
          for (const ring of poly) {
            const pts = []
            ctx.beginPath()
            for (let i = 0; i < ring.length; i++) {
              const p = proj(ring[i][1], ring[i][0], rect.width, rect.height)
              pts.push(p)
              i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
            }
            ctx.closePath()
            rings.push(pts)
            if (hasData) {
              ctx.fillStyle = color
              ctx.fill()
            }
            ctx.strokeStyle = hasData ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)'
            ctx.lineWidth = 1.0
            ctx.stroke()
          }
          entry.polygons.push(rings)
        }
        if (hasData) paths.push(entry)
      }
    }

    function onMove(e) {
      const rect = canvasEl.value?.getBoundingClientRect()
      if (!rect) return
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      let hit = null
      for (const entry of paths) {
        if (pointInMultiPolygon(mx, my, entry.polygons)) {
          hit = entry.key
          break
        }
      }

      if (hit && (hit in index)) {
        const score = index[hit]
        const rank = ranked.findIndex(r => r[0] === hit) + 1
        tip.value = { name: hit, score, rank, level: scoreLevel(score), color: scoreColor(score) }
        let tx = e.clientX - rect.left + 14
        let ty = e.clientY - rect.top - 10
        if (tx + 150 > rect.width) tx = e.clientX - rect.left - 150
        if (ty < 4) ty = 4
        tipPos.value = { left: tx + 'px', top: ty + 'px' }
      } else {
        tip.value = null
      }
    }

    function onLeave() { tip.value = null }

    onMounted(() => {
      if (!canvasEl.value) return
      ctx = canvasEl.value.getContext('2d')
      loadGeo()
      ro = new ResizeObserver(() => draw())
      ro.observe(canvasEl.value)
    })

    onUnmounted(() => { if (ro) ro.disconnect() })

    return { canvasEl, tip, tipPos, total, onMove, onLeave }
  },
}
</script>

<style scoped>
.map-section {
  position: relative;
  width: 100%;
  height: 560px;
  border-radius: 12px;
  overflow: hidden;
  background: #0b1220;
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
}
.map-canvas { display: block; width: 100%; height: 100%; outline: none; }

.legend {
  position: absolute; bottom: 48px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 4px;
  padding: 6px 14px;
  background: rgba(11,18,32,0.85);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  z-index: 2;
}
.legend-item {
  display: flex; align-items: center; gap: 3px;
  font-size: 9px; color: rgba(255,255,255,0.4);
  letter-spacing: 0.5px;
}
.swatch { display: inline-block; width: 12px; height: 12px; border-radius: 2px; }

.map-tooltip {
  position: absolute; pointer-events: none; z-index: 10;
  background: rgba(11,18,32,0.92);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 10px 14px;
  min-width: 150px;
  backdrop-filter: blur(8px);
}
.tip-name { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 2px; }
.tip-rank { font-size: 10px; color: rgba(255,255,255,0.35); margin-bottom: 6px; }
.tip-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.tip-label { font-size: 10px; color: rgba(255,255,255,0.3); letter-spacing: 0.5px; }
.tip-val { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.85); font-family: 'Courier New', monospace; }
.tip-lvl { font-size: 11px; font-weight: 600; }
.tip-bar { margin-top: 6px; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; }
.tip-fill { height: 100%; border-radius: 2px; transition: width 0.1s; }

.map-note {
  position: absolute; bottom: 12px; left: 0; right: 0; text-align: center;
  font-size: 9px; color: rgba(255,255,255,0.25); letter-spacing: 0.3px;
  padding: 0 16px;
  z-index: 1;
}

@media (max-width: 768px) {
  .map-section { height: 400px; }
}
</style>
