/** Sequential (single-hue) color/size scaling for magnitude data — job
 * counts per location. One hue, light-to-dark, per dataviz convention. */

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16)
  ]
}

function toHex(channel: number): string {
  return Math.round(channel).toString(16).padStart(2, '0')
}

function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 1
  return Math.min(1, Math.max(0, (value - min) / (max - min)))
}

/** Maps a value within [min, max] to a color between two hex endpoints
 * on the brand's sequential ramp (light = low, dark = high). */
export function sequentialColor(
  value: number,
  min: number,
  max: number,
  fromHex = '#B3F5D1',
  toHex_ = '#007F45'
): string {
  const t = normalize(value, min, max)
  const [r1, g1, b1] = hexToRgb(fromHex)
  const [r2, g2, b2] = hexToRgb(toHex_)
  return `#${toHex(r1 + (r2 - r1) * t)}${toHex(g1 + (g2 - g1) * t)}${toHex(b1 + (b2 - b1) * t)}`
}

/** Area-proportional (sqrt) size scaling so magnitude differences read
 * honestly — a dot twice the count is not twice the radius. */
export function sequentialSize(
  value: number,
  min: number,
  max: number,
  minSize = 0.7,
  maxSize = 2.6
): number {
  const t = Math.sqrt(normalize(value, min, max))
  return minSize + t * (maxSize - minSize)
}
