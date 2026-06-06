<script>
export default {
  props: {
    trend: { type: String, default: 'up' },
    width: { type: Number, default: 80 },
    height: { type: Number, default: 24 },
  },
  mounted() {
    this.draw()
  },
  watch: {
    trend() {
      this.draw()
    },
  },
  methods: {
    draw() {
      const canvas = this.$refs.canvas
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      const w = this.width
      const h = this.height
      canvas.width = w * 2
      canvas.height = h * 2
      ctx.clearRect(0, 0, w * 2, h * 2)

      const steps = 48
      const points = []
      let y = h / 2
      const isUp = this.trend === 'up'
      const drift = isUp ? -0.18 : 0.18

      for (let i = 0; i < steps; i++) {
        y += drift + (Math.random() - 0.5) * h * 0.45
        y = Math.max(2, Math.min(h - 2, y))
        points.push({ x: (i / (steps - 1)) * w, y })
      }

      const color = isUp ? '#0ecb81' : '#f6465d'

      ctx.beginPath()
      ctx.moveTo(0, points[0].y * 2)
      for (let i = 1; i < points.length; i++) {
        const xc = (points[i - 1].x + points[i].x) / 2
        const yc = (points[i - 1].y + points[i].y) / 2
        ctx.quadraticCurveTo(points[i - 1].x * 2, points[i - 1].y * 2, xc * 2, yc * 2)
      }
      ctx.lineTo(w * 2, points[points.length - 1].y * 2)
      ctx.strokeStyle = color
      ctx.lineWidth = 2.2
      ctx.stroke()

      const grad = ctx.createLinearGradient(0, 0, 0, h * 2)
      grad.addColorStop(0, isUp ? 'rgba(14,203,129,0.28)' : 'rgba(246,70,93,0.28)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.lineTo(w * 2, h * 2)
      ctx.lineTo(0, h * 2)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()
    },
  },
}
</script>

<template>
  <canvas ref="canvas" :width="width * 2" :height="height * 2" class="sparkline-canvas" />
</template>

<style scoped>
.sparkline-canvas {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0.95;
}
</style>
