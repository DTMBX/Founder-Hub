/**
 * generate-sitemap.mjs
 *
 * Generates public/sitemap.xml from the central project registry
 * and the known set of hash-based page routes.
 *
 * Run:  node scripts/generate-sitemap.mjs
 * Also invoked automatically by "npm run build" (see package.json).
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SITE = 'https://devon-tyler.com'
const TODAY = new Date().toISOString().slice(0, 10)

// ── Load the project registry via a lightweight TS→JSON extraction ──
// We read the raw TS file and parse project IDs to avoid needing tsx/ts-node.
const registrySource = readFileSync(resolve(ROOT, 'src/data/projects.ts'), 'utf-8')
const idMatches = [...registrySource.matchAll(/id:\s*'([^']+)'/g)]
const projectIds = idMatches.map(m => m[1])

// ── Load blog post IDs ──
const postsSource = readFileSync(resolve(ROOT, 'src/data/posts.ts'), 'utf-8')
const postIdMatches = [...postsSource.matchAll(/^\s*id:\s*'([^']+)'/gm)]
const postIds = postIdMatches.map(m => m[1])

// ── Static routes ──
const staticRoutes = [
  { loc: '/',                 priority: '1.0', changefreq: 'weekly' },
  { loc: '/#evident',         priority: '0.9', changefreq: 'weekly' },
  { loc: '/#tillerstead',     priority: '0.9', changefreq: 'weekly' },
  { loc: '/#about',           priority: '0.8', changefreq: 'monthly' },
  { loc: '/#projects-index',  priority: '0.9', changefreq: 'weekly' },
  { loc: '/#accountability',  priority: '0.7', changefreq: 'monthly' },
  { loc: '/#invest',          priority: '0.7', changefreq: 'monthly' },
  { loc: '/#data',            priority: '0.6', changefreq: 'monthly' },
  { loc: '/#developers',      priority: '0.6', changefreq: 'monthly' },
  { loc: '/#activity',        priority: '0.6', changefreq: 'daily' },
  { loc: '/#intelligence',    priority: '0.7', changefreq: 'weekly' },
  { loc: '/#evident-site',    priority: '0.8', changefreq: 'monthly' },
  { loc: '/#blog',            priority: '0.7', changefreq: 'weekly' },
  { loc: '/#system-status',   priority: '0.5', changefreq: 'daily' },
  { loc: '/privacy.html',     priority: '0.3', changefreq: 'yearly' },
  { loc: '/terms.html',       priority: '0.3', changefreq: 'yearly' },
]

// ── Dynamic project routes ──
const projectRoutes = projectIds.map(id => ({
  loc: `/#project/${id}`,
  priority: '0.6',
  changefreq: 'monthly',
}))

// ── Blog post routes ──
const blogRoutes = postIds.map(id => ({
  loc: `/#blog/${id}`,
  priority: '0.5',
  changefreq: 'weekly',
}))

const allRoutes = [...staticRoutes, ...projectRoutes, ...blogRoutes]

// ── Build XML ──
const urlEntries = allRoutes.map(r => `  <url>
    <loc>${SITE}${r.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <priority>${r.priority}</priority>
    <changefreq>${r.changefreq}</changefreq>
  </url>`).join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`

const outPath = resolve(ROOT, 'public/sitemap.xml')
writeFileSync(outPath, xml, 'utf-8')
console.log(`Sitemap written → ${outPath}  (${allRoutes.length} URLs)`)
