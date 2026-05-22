export function formatPrice(value) {
  if (value == null || Number.isNaN(value)) return '—'
  if (value >= 1) {
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
}

export function formatMarketCap(value) {
  if (value == null) return '—'
  if (value >= 1e12) return '$' + (value / 1e12).toFixed(2) + 'T'
  if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B'
  if (value >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M'
  return '$' + value.toLocaleString()
}

export function formatVolume(value) {
  return formatMarketCap(value)
}

export function formatChange(value) {
  if (value == null) return '—'
  const sign = value >= 0 ? '+' : ''
  return sign + Number(value).toFixed(2) + '%'
}

export function changeClass(value) {
  return value >= 0 ? 'text-positive' : 'text-negative'
}
