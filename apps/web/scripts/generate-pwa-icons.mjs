// One-off utility to (re)generate the placeholder PWA icons from an inline
// SVG monogram. Run with: node scripts/generate-pwa-icons.mjs
// Swap for real brand assets whenever they're ready — this is a placeholder.
import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const PRIMARY = '#00A155'

function iconSvg({ size, padding }) {
  const fontSize = (size - padding * 2) * 0.52
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="${PRIMARY}" />
      <text
        x="50%"
        y="50%"
        text-anchor="middle"
        dominant-baseline="central"
        font-family="Arial, Helvetica, sans-serif"
        font-weight="700"
        font-size="${fontSize}"
        fill="#ffffff"
      >JT</text>
    </svg>
  `
}

async function generate(name, size, padding) {
  const svg = iconSvg({ size, padding })
  await sharp(Buffer.from(svg))
    .png()
    .toFile(join(publicDir, name))
  console.log(`wrote ${name}`)
}

await mkdir(publicDir, { recursive: true })
await generate('pwa-192x192.png', 192, 20)
await generate('pwa-512x512.png', 512, 50)
// Maskable icons get cropped into arbitrary shapes by the OS — keep the
// glyph inside a safe zone (~80% of the canvas, centered).
await generate('pwa-maskable-512x512.png', 512, 110)
