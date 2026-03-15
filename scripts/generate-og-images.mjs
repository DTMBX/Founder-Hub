/**
 * generate-og-images.mjs
 *
 * Generates branded 1200×630 PNG Open Graph images for every major route.
 * Uses Sharp to rasterize SVG templates into PNG — universally supported
 * by all social platforms (LinkedIn, X, Facebook, iMessage).
 *
 * Output: public/og/{route-name}.png
 *
 * Run:  node scripts/generate-og-images.mjs
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OG_DIR = resolve(ROOT, 'public/og')

mkdirSync(OG_DIR, { recursive: true })

// Load blog post IDs and titles
const postsSource = readFileSync(resolve(ROOT, 'src/data/posts.ts'), 'utf-8')
const postMatches = [...postsSource.matchAll(/id:\s*'([^']+)'/gm)]
const postTitleMatches = [...postsSource.matchAll(/title:\s*'([^']+)'/gm)]
const postCategoryMatches = [...postsSource.matchAll(/category:\s*'([^']+)'/gm)]

const posts = postMatches.map((m, i) => ({
  id: m[1],
  title: postTitleMatches[i]?.[1] || m[1],
  category: postCategoryMatches[i]?.[1] || 'update',
}))

const BRAND = 'Devon Tyler Barber'
const DOMAIN = 'devon-tyler.com'

const ROUTES = [
  { slug: 'home', title: 'Entrepreneur & Technologist', subtitle: 'Building civic technology, home improvement platforms, and accountability tools.' },
  { slug: 'evident', title: 'Evident Technologies', subtitle: 'Enterprise e-discovery and evidence processing platform.' },
  { slug: 'evident-site', title: 'Evident Technologies LLC', subtitle: 'Evidence Processing at Enterprise Scale' },
  { slug: 'tillerstead', title: 'Tillerstead LLC', subtitle: 'Licensed NJ Home Improvement Contractor — NJ HIC #13VH10808800' },
  { slug: 'accountability', title: 'Accountability', subtitle: 'Proof of work, transparency, and public record.' },
  { slug: 'projects-index', title: 'Projects', subtitle: '9 ventures across civic technology, legal transparency, and contracting.' },
  { slug: 'blog', title: 'Blog', subtitle: 'Updates from the Evident Technologies ecosystem.' },
  { slug: 'invest', title: 'Investment', subtitle: 'Capital allocation across the Evident and Tillerstead ecosystem.' },
  { slug: 'activity', title: 'Ecosystem Activity', subtitle: 'Real-time development activity across all ventures.' },
  { slug: 'intelligence', title: 'Ecosystem Intelligence', subtitle: 'Metrics, insights, and health monitoring.' },
  { slug: 'data', title: 'Public Data API', subtitle: 'Machine-readable ecosystem data for developers and integrators.' },
  { slug: 'developers', title: 'Developer Portal', subtitle: 'API documentation, endpoints, and integration guides.' },
  { slug: 'evident-demo', title: 'Evident Platform Demo', subtitle: 'Interactive demonstration of e-discovery capabilities.' },
]

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function generateSVG(title, subtitle, accentColor = '#10b981') {
  // Word-wrap title at ~30 chars per line
  const titleLines = []
  const words = title.split(' ')
  let currentLine = ''
  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length > 30) {
      titleLines.push(currentLine.trim())
      currentLine = word
    } else {
      currentLine += ' ' + word
    }
  }
  if (currentLine.trim()) titleLines.push(currentLine.trim())

  const titleY = titleLines.length > 1 ? 260 : 290
  const titleEls = titleLines.map((line, i) =>
    `<text x="80" y="${titleY + i * 60}" fill="white" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="48" font-weight="700">${escapeXml(line)}</text>`
  ).join('\n    ')

  const subtitleY = titleY + titleLines.length * 60 + 20

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0a0e1a"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect x="0" y="0" width="1200" height="4" fill="${accentColor}"/>
  <text x="80" y="120" fill="${accentColor}" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="18" font-weight="600" letter-spacing="2">${escapeXml(BRAND.toUpperCase())}</text>
  <line x1="80" y1="145" x2="280" y2="145" stroke="${accentColor}" stroke-width="2" opacity="0.4"/>
    ${titleEls}
  <text x="80" y="${subtitleY}" fill="#94a3b8" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="20" font-weight="400">${escapeXml(subtitle)}</text>
  <text x="80" y="570" fill="#475569" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="16" font-weight="400">${DOMAIN}</text>
  <circle cx="1120" cy="560" r="24" fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.3"/>
  <text x="1110" y="567" fill="${accentColor}" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="16" font-weight="700" opacity="0.5">DT</text>
</svg>`
}

async function generatePNG(svgString, outPath) {
  const pngBuffer = await sharp(Buffer.from(svgString))
    .resize(1200, 630)
    .png({ quality: 90, compressionLevel: 9 })
    .toBuffer()
  writeFileSync(outPath, pngBuffer)
}

async function main() {
  const tasks = []

  // Generate route OG images
  for (const route of ROUTES) {
    const accent = route.slug.includes('tillerstead') ? '#10b981'
      : route.slug.includes('evident') ? '#10b981'
      : '#3b82f6'
    const svg = generateSVG(route.title, route.subtitle, accent)
    const outPath = resolve(OG_DIR, `${route.slug}.png`)
    tasks.push(generatePNG(svg, outPath))
  }

  // Generate blog post OG images
  for (const post of posts) {
    const categoryLabel = post.category.charAt(0).toUpperCase() + post.category.slice(1)
    const svg = generateSVG(post.title, `${categoryLabel} — ${BRAND}`, '#8b5cf6')
    const outPath = resolve(OG_DIR, `blog-${post.id}.png`)
    tasks.push(generatePNG(svg, outPath))
  }

  await Promise.all(tasks)
  const total = ROUTES.length + posts.length
  console.log(`OG images generated → ${OG_DIR}  (${total} PNG images)`)
}

main().catch(err => {
  console.error('OG image generation failed:', err)
  process.exit(1)
})
