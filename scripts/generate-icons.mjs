/**
 * Generate raster (PNG) icons from SVG sources.
 * 
 * Outputs:
 *   public/og-preview.png       — 1200×630 Open Graph image
 *   public/icon-192.png         — 192×192 PWA icon
 *   public/icon-512.png         — 512×512 PWA icon
 *   public/apple-touch-icon.png — 180×180 Apple touch icon
 */

import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '..', 'public')

async function generate() {
  // OG preview: 1200×630
  const ogSvg = readFileSync(resolve(publicDir, 'og-preview.svg'))
  await sharp(ogSvg)
    .resize(1200, 630)
    .png({ quality: 90 })
    .toFile(resolve(publicDir, 'og-preview.png'))
  console.log('✓ og-preview.png (1200×630)')

  // PWA + Apple touch icons from apple-touch-icon.svg
  const iconSvg = readFileSync(resolve(publicDir, 'apple-touch-icon.svg'))
  
  await sharp(iconSvg)
    .resize(192, 192)
    .png({ quality: 90 })
    .toFile(resolve(publicDir, 'icon-192.png'))
  console.log('✓ icon-192.png (192×192)')

  await sharp(iconSvg)
    .resize(512, 512)
    .png({ quality: 90 })
    .toFile(resolve(publicDir, 'icon-512.png'))
  console.log('✓ icon-512.png (512×512)')

  await sharp(iconSvg)
    .resize(180, 180)
    .png({ quality: 90 })
    .toFile(resolve(publicDir, 'apple-touch-icon.png'))
  console.log('✓ apple-touch-icon.png (180×180)')
}

generate().catch(err => {
  console.error('Failed to generate icons:', err)
  process.exit(1)
})
