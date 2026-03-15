/**
 * generate-og-images.mjs
 *
 * Generates branded 1200×630 PNG Open Graph images for every major route
 * and blog post. Uses satori (JSX → SVG) and @resvg/resvg-js (SVG → PNG)
 * with no headless browser dependency.
 *
 * Layout:
 *   - Devon Tyler Barber wordmark + colored category pill (top-left)
 *   - Page title in 64px white on dark background
 *   - One-line description in 24px gray below
 *   - Subtle grid pattern as background texture
 *   - Blog posts additionally show category badge + date (bottom-right)
 *
 * Output: public/og/{route-slug}.png
 *
 * Run:  node scripts/generate-og-images.mjs
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OG_DIR = resolve(ROOT, 'public/og')

mkdirSync(OG_DIR, { recursive: true })

// ── Font loading ──────────────────────────────────────────────────────────
// Fetch Inter from Google Fonts CDN at build time (Regular 400 + Bold 700)
async function loadFonts() {
  const fontUrls = [
    { url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf', weight: 400 },
    { url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjQ.ttf', weight: 700 },
  ]
  const fonts = await Promise.all(
    fontUrls.map(async ({ url, weight }) => {
      const res = await fetch(url)
      const data = await res.arrayBuffer()
      return { name: 'Inter', data, weight, style: 'normal' }
    }),
  )
  return fonts
}

// ── Blog post data extraction ─────────────────────────────────────────────
const postsSource = readFileSync(resolve(ROOT, 'src/data/posts.ts'), 'utf-8')
const postMatches = [...postsSource.matchAll(/id:\s*'([^']+)'/gm)]
const postTitleMatches = [...postsSource.matchAll(/title:\s*'([^']+)'/gm)]
const postCategoryMatches = [...postsSource.matchAll(/category:\s*'([^']+)'/gm)]
const postDateMatches = [...postsSource.matchAll(/date:\s*'([^']+)'/gm)]

const posts = postMatches.map((m, i) => ({
  id: m[1],
  title: postTitleMatches[i]?.[1] || m[1],
  category: postCategoryMatches[i]?.[1] || 'update',
  date: postDateMatches[i]?.[1] || '',
}))

const BRAND = 'DEVON TYLER BARBER'
const DOMAIN = 'devon-tyler.com'

const ROUTES = [
  { slug: 'home', title: 'Entrepreneur & Technologist', subtitle: 'Building civic technology, home improvement platforms, and accountability tools.', pill: 'Homepage' },
  { slug: 'evident', title: 'Evident Technologies', subtitle: 'Enterprise e-discovery and evidence processing platform.', pill: 'Platform' },
  { slug: 'evident-site', title: 'Evident Technologies LLC', subtitle: 'Evidence Processing at Enterprise Scale', pill: 'Enterprise' },
  { slug: 'tillerstead', title: 'Tillerstead LLC', subtitle: 'Licensed NJ Home Improvement Contractor — NJ HIC #13VH10808800', pill: 'Contracting' },
  { slug: 'about', title: 'About Devon Tyler Barber', subtitle: 'Founder, operator, and technologist building for accountability.', pill: 'About' },
  { slug: 'accountability', title: 'Accountability', subtitle: 'Proof of work, transparency, and public record.', pill: 'Trust' },
  { slug: 'projects-index', title: 'Projects', subtitle: '9 ventures across civic technology, legal transparency, and contracting.', pill: 'Portfolio' },
  { slug: 'blog', title: 'Blog', subtitle: 'Updates from the Evident Technologies ecosystem.', pill: 'Blog' },
  { slug: 'invest', title: 'Investment', subtitle: 'Capital allocation across the Evident and Tillerstead ecosystem.', pill: 'Investor' },
  { slug: 'activity', title: 'Ecosystem Activity', subtitle: 'Real-time development activity across all ventures.', pill: 'Activity' },
  { slug: 'intelligence', title: 'Ecosystem Intelligence', subtitle: 'Metrics, insights, and health monitoring.', pill: 'Intel' },
  { slug: 'data', title: 'Public Data API', subtitle: 'Machine-readable ecosystem data for developers and integrators.', pill: 'API' },
  { slug: 'developers', title: 'Developer Portal', subtitle: 'API documentation, endpoints, and integration guides.', pill: 'Developers' },
  { slug: 'evident-demo', title: 'Evident Platform Demo', subtitle: 'Interactive demonstration of e-discovery capabilities.', pill: 'Demo' },
  { slug: 'system-status', title: 'System Status', subtitle: 'Real-time operational status and uptime for the Evident ecosystem.', pill: 'Status' },
]

// ── Color helpers ─────────────────────────────────────────────────────────
function getAccentColor(slug) {
  if (slug.includes('tillerstead')) return '#10b981'
  if (slug.includes('evident')) return '#10b981'
  if (slug.includes('invest')) return '#f59e0b'
  return '#3b82f6'
}

const CATEGORY_COLORS = {
  platform: '#3b82f6',
  project: '#10b981',
  ecosystem: '#8b5cf6',
  update: '#f59e0b',
}

// ── Satori element builders ───────────────────────────────────────────────
// satori uses a React-like element format: { type, props, ... }
function h(type, props, ...children) {
  return { type, props: { ...props, children: children.length === 1 ? children[0] : children.length === 0 ? undefined : children } }
}

function buildRouteImage(title, subtitle, pill, accentColor) {
  return h('div', {
    style: {
      width: 1200, height: 630, display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 100%)',
      fontFamily: 'Inter', position: 'relative', padding: '60px 80px',
    },
  },
    // Top accent bar
    h('div', { style: { position: 'absolute', top: 0, left: 0, width: 1200, height: 4, background: accentColor } }),
    // Grid overlay (simulated with repeating dots)
    h('div', { style: {
      position: 'absolute', top: 0, left: 0, width: 1200, height: 630,
      backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    } }),
    // Brand wordmark + pill
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 } },
      h('div', { style: { color: accentColor, fontSize: 18, fontWeight: 700, letterSpacing: 2 } }, BRAND),
      h('div', { style: {
        background: accentColor + '22', color: accentColor, fontSize: 13, fontWeight: 600,
        padding: '4px 12px', borderRadius: 20, border: `1px solid ${accentColor}44`,
      } }, pill),
    ),
    // Accent line
    h('div', { style: { width: 200, height: 2, background: accentColor, opacity: 0.4, marginBottom: 40 } }),
    // Title
    h('div', { style: { color: 'white', fontSize: 64, fontWeight: 700, lineHeight: 1.15, maxWidth: 1000, marginBottom: 16 } }, title),
    // Subtitle
    h('div', { style: { color: '#94a3b8', fontSize: 24, fontWeight: 400, maxWidth: 900 } }, subtitle),
    // Footer
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' } },
      h('div', { style: { color: '#475569', fontSize: 16 } }, DOMAIN),
      h('div', { style: {
        width: 48, height: 48, borderRadius: 24, border: `2px solid ${accentColor}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accentColor, fontSize: 16, fontWeight: 700, opacity: 0.5,
      } }, 'DT'),
    ),
  )
}

function buildBlogImage(title, category, date) {
  const catColor = CATEGORY_COLORS[category] || '#8b5cf6'
  const catLabel = category.charAt(0).toUpperCase() + category.slice(1)

  return h('div', {
    style: {
      width: 1200, height: 630, display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 100%)',
      fontFamily: 'Inter', position: 'relative', padding: '60px 80px',
    },
  },
    // Top accent bar
    h('div', { style: { position: 'absolute', top: 0, left: 0, width: 1200, height: 4, background: catColor } }),
    // Grid overlay
    h('div', { style: {
      position: 'absolute', top: 0, left: 0, width: 1200, height: 630,
      backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
    } }),
    // Brand wordmark + blog pill
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 } },
      h('div', { style: { color: catColor, fontSize: 18, fontWeight: 700, letterSpacing: 2 } }, BRAND),
      h('div', { style: {
        background: catColor + '22', color: catColor, fontSize: 13, fontWeight: 600,
        padding: '4px 12px', borderRadius: 20, border: `1px solid ${catColor}44`,
      } }, 'Blog'),
    ),
    // Accent line
    h('div', { style: { width: 200, height: 2, background: catColor, opacity: 0.4, marginBottom: 40 } }),
    // Title
    h('div', { style: { color: 'white', fontSize: 64, fontWeight: 700, lineHeight: 1.15, maxWidth: 1000, marginBottom: 16 } }, title),
    // Subtitle
    h('div', { style: { color: '#94a3b8', fontSize: 24, fontWeight: 400 } }, `${catLabel} — ${DOMAIN}`),
    // Footer with category badge + date (bottom-right)
    h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' } },
      h('div', { style: { color: '#475569', fontSize: 16 } }, DOMAIN),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 12 } },
        h('div', { style: {
          background: catColor + '22', color: catColor, fontSize: 14, fontWeight: 600,
          padding: '4px 14px', borderRadius: 20, border: `1px solid ${catColor}44`,
        } }, catLabel),
        date ? h('div', { style: { color: '#64748b', fontSize: 14 } }, date) : undefined,
      ),
    ),
  )
}

// ── Render pipeline ───────────────────────────────────────────────────────
async function renderToPng(element, fonts) {
  const svg = await satori(element, {
    width: 1200,
    height: 630,
    fonts,
  })
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
  return resvg.render().asPng()
}

async function main() {
  console.log('Loading fonts...')
  const fonts = await loadFonts()

  const tasks = []

  // Generate route OG images
  for (const route of ROUTES) {
    const accent = getAccentColor(route.slug)
    const element = buildRouteImage(route.title, route.subtitle, route.pill, accent)
    tasks.push(
      renderToPng(element, fonts).then(png => {
        writeFileSync(resolve(OG_DIR, `${route.slug}.png`), png)
      }),
    )
  }

  // Generate blog post OG images
  for (const post of posts) {
    const element = buildBlogImage(post.title, post.category, post.date)
    tasks.push(
      renderToPng(element, fonts).then(png => {
        writeFileSync(resolve(OG_DIR, `blog-${post.id}.png`), png)
      }),
    )
  }

  await Promise.all(tasks)
  const total = ROUTES.length + posts.length
  console.log(`✔ OG images generated → ${OG_DIR}  (${total} PNG images)`)
}

main().catch(err => {
  console.error('OG image generation failed:', err)
  process.exit(1)
})
