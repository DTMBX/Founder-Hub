/**
 * CI Static Site Generator
 *
 * Node.js script invoked during the GitHub Actions build step.
 * Reads site index from public/data/sites-index.json (if present),
 * loads each site's data, and generates static HTML + site.json
 * artifacts under dist/sites/{slug}/.
 *
 * Falls back gracefully if no site data is present (fresh repos).
 *
 * Usage: node scripts/generate-static-sites.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { createHash } from 'node:crypto'

// ─── Inline Helpers (avoiding TS import chain for CI) ────────

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/&/g, '&amp;')
}

function renderMetaTags(seo, canonical) {
  const tags = [
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(seo.title)}</title>`,
  ]
  if (seo.description) {
    tags.push(`<meta name="description" content="${escapeAttr(seo.description)}" />`)
  }
  tags.push(`<meta property="og:title" content="${escapeAttr(seo.title)}" />`)
  if (seo.description) {
    tags.push(`<meta property="og:description" content="${escapeAttr(seo.description)}" />`)
  }
  if (seo.ogImage) {
    tags.push(`<meta property="og:image" content="${escapeAttr(seo.ogImage)}" />`)
  }
  tags.push('<meta property="og:type" content="website" />')
  tags.push('<meta name="twitter:card" content="summary_large_image" />')
  tags.push(`<meta name="twitter:title" content="${escapeAttr(seo.title)}" />`)
  if (seo.description) {
    tags.push(`<meta name="twitter:description" content="${escapeAttr(seo.description)}" />`)
  }
  if (canonical) {
    tags.push(`<link rel="canonical" href="${escapeAttr(canonical)}" />`)
  }
  return tags.join('\n    ')
}

function renderLawFirmBody(data) {
  const c = data.config
  const b = data.branding
  const primary = b.primaryColor
  const accent = b.secondaryColor || c.accentColor || '#c7a44a'
  const name = c.firmName || data.name
  const year = new Date().getFullYear()
  const sections = []

  sections.push(`<nav style="background:white;border-bottom:1px solid #e5e7eb;padding:16px 0;">
    <div style="max-width:1280px;margin:0 auto;padding:0 24px;display:flex;align-items:center;">
      <span style="font-weight:700;font-size:18px;color:${primary}">${escapeHtml(name)}</span>
    </div></nav>`)

  sections.push(`<section style="background:${primary};color:white;padding:80px 0;text-align:center;">
    <div style="max-width:1280px;margin:0 auto;padding:0 24px;">
      <h1 style="font-size:48px;font-weight:700;margin-bottom:16px;">${escapeHtml(name)}</h1>
      ${c.tagline ? `<p style="font-size:20px;opacity:0.9;max-width:768px;margin:0 auto;">${escapeHtml(c.tagline)}</p>` : ''}
    </div></section>`)

  if (data.practiceAreas && data.practiceAreas.length > 0) {
    const cards = [...data.practiceAreas]
      .sort((a, b) => a.order - b.order)
      .map(area => `<div style="background:white;border-radius:12px;padding:24px;border:1px solid #f3f4f6;">
        <h3 style="font-size:18px;font-weight:600;color:${primary};margin-bottom:8px;">${escapeHtml(area.name)}</h3>
        <p style="font-size:14px;color:#4b5563;">${escapeHtml(area.description)}</p></div>`)
      .join('')
    sections.push(`<section style="padding:64px 0;background:#f9fafb;">
      <div style="max-width:1280px;margin:0 auto;padding:0 24px;">
        <h2 style="font-size:30px;font-weight:700;text-align:center;color:${primary};margin-bottom:48px;">Practice Areas</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;">${cards}</div>
      </div></section>`)
  }

  if (data.attorneys && data.attorneys.length > 0) {
    const cards = [...data.attorneys]
      .sort((a, b) => a.order - b.order)
      .slice(0, 6)
      .map(att => `<div style="background:white;border-radius:12px;border:1px solid #f3f4f6;overflow:hidden;">
        <div style="padding:20px;">
          <h3 style="font-weight:600;font-size:18px;">${escapeHtml(att.name)}</h3>
          <p style="font-size:14px;color:${accent};">${escapeHtml(att.title)}</p>
          <p style="font-size:14px;color:#4b5563;margin-top:8px;">${escapeHtml(att.bio.slice(0, 200))}</p>
        </div></div>`)
      .join('')
    sections.push(`<section style="padding:64px 0;">
      <div style="max-width:1280px;margin:0 auto;padding:0 24px;">
        <h2 style="font-size:30px;font-weight:700;text-align:center;color:${primary};margin-bottom:48px;">Our Attorneys</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:32px;">${cards}</div>
      </div></section>`)
  }

  sections.push(`<footer style="background:${primary};color:white;padding:48px 0;">
    <div style="max-width:1280px;margin:0 auto;padding:0 24px;text-align:center;">
      <p style="font-weight:700;font-size:18px;margin-bottom:8px;">${escapeHtml(name)}</p>
      ${c.phone ? `<p style="font-size:14px;opacity:0.8;">${escapeHtml(c.phone)}</p>` : ''}
      ${c.email ? `<p style="font-size:14px;opacity:0.8;">${escapeHtml(c.email)}</p>` : ''}
      <p style="font-size:12px;opacity:0.4;margin-top:16px;">&copy; ${year} ${escapeHtml(name)}</p>
    </div></footer>`)

  return sections.join('\n')
}

function renderSMBBody(data) {
  const c = data.config
  const b = data.branding
  const primary = b.primaryColor
  const accent = b.secondaryColor || c.accentColor || '#f59e0b'
  const name = c.businessName || data.name
  const year = new Date().getFullYear()
  const sections = []

  sections.push(`<nav style="background:white;border-bottom:1px solid #e5e7eb;padding:16px 0;">
    <div style="max-width:1280px;margin:0 auto;padding:0 24px;">
      <span style="font-weight:700;font-size:18px;color:${primary}">${escapeHtml(name)}</span>
    </div></nav>`)

  if (c.sections && c.sections.hero) {
    sections.push(`<section style="background:linear-gradient(135deg, ${primary} 0%, ${primary}dd 100%);color:white;padding:80px 0;text-align:center;">
      <div style="max-width:1280px;margin:0 auto;padding:0 24px;">
        <h1 style="font-size:48px;font-weight:700;margin-bottom:16px;">${escapeHtml(name)}</h1>
        ${c.tagline ? `<p style="font-size:20px;opacity:0.9;">${escapeHtml(c.tagline)}</p>` : ''}
      </div></section>`)
  }

  if (c.sections && c.sections.services && data.services && data.services.length > 0) {
    const cards = [...data.services]
      .sort((a, b) => a.order - b.order)
      .map(svc => `<div style="border:1px solid #f3f4f6;border-radius:12px;padding:20px;">
        <h3 style="font-weight:600;font-size:18px;margin-bottom:4px;">${escapeHtml(svc.name)}</h3>
        ${svc.price ? `<div style="font-size:14px;font-weight:500;color:${accent};margin-bottom:8px;">${escapeHtml(svc.price)}</div>` : ''}
        <p style="font-size:14px;color:#4b5563;">${escapeHtml(svc.description)}</p></div>`)
      .join('')
    sections.push(`<section style="padding:64px 0;">
      <div style="max-width:1280px;margin:0 auto;padding:0 24px;">
        <h2 style="font-size:30px;font-weight:700;text-align:center;color:${primary};margin-bottom:48px;">Our Services</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;">${cards}</div>
      </div></section>`)
  }

  if (c.sections && c.sections.contact) {
    sections.push(`<section style="padding:64px 0;background:#f9fafb;">
      <div style="max-width:768px;margin:0 auto;padding:0 24px;text-align:center;">
        <h2 style="font-size:30px;font-weight:700;color:${primary};margin-bottom:16px;">Get in Touch</h2>
        ${c.phone ? `<p style="font-size:14px;color:#4b5563;">${escapeHtml(c.phone)}</p>` : ''}
        ${c.email ? `<p style="font-size:14px;color:#4b5563;">${escapeHtml(c.email)}</p>` : ''}
        ${c.address ? `<p style="font-size:14px;color:#4b5563;">${escapeHtml(c.address)}</p>` : ''}
      </div></section>`)
  }

  sections.push(`<footer style="background:${primary};color:white;padding:32px 0;text-align:center;">
    <p style="font-size:14px;opacity:0.8;">&copy; ${year} ${escapeHtml(name)}</p></footer>`)

  return sections.join('\n')
}

function renderAgencyBody(data) {
  const c = data.config
  const name = c.agencyName || data.name
  const year = new Date().getFullYear()
  const launched = (data.projects || []).filter(p => p.status === 'launched' || p.status === 'maintenance')
  const sections = []

  sections.push(`<nav style="background:#030712;border-bottom:1px solid #1f2937;padding:16px 0;">
    <div style="max-width:1280px;margin:0 auto;padding:0 24px;">
      <span style="font-weight:700;font-size:18px;color:white;">${escapeHtml(name)}</span>
    </div></nav>`)

  sections.push(`<section style="background:#030712;color:white;padding:96px 0;">
    <div style="max-width:1280px;margin:0 auto;padding:0 24px;">
      <h1 style="font-size:56px;font-weight:700;margin-bottom:24px;">${escapeHtml(name)}</h1>
      <p style="font-size:20px;color:#9ca3af;">${launched.length} project${launched.length !== 1 ? 's' : ''} delivered.</p>
    </div></section>`)

  if (launched.length > 0) {
    const cards = launched.map(proj => `<div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:24px;">
      <h3 style="font-weight:600;color:white;font-size:18px;margin-bottom:4px;">${escapeHtml(proj.projectName || proj.clientName)}</h3>
      ${proj.domain ? `<p style="font-size:12px;color:#60a5fa;">${escapeHtml(proj.domain)}</p>` : ''}
      ${proj.deliverables && proj.deliverables.length > 0 ? `<p style="font-size:12px;color:#6b7280;margin-top:12px;">${proj.deliverables.slice(0, 3).map(d => escapeHtml(d)).join(' · ')}</p>` : ''}
    </div>`).join('')
    sections.push(`<section style="background:#030712;padding:64px 0;border-top:1px solid #1f2937;">
      <div style="max-width:1280px;margin:0 auto;padding:0 24px;">
        <h2 style="font-size:30px;font-weight:700;color:white;margin-bottom:40px;">Selected Work</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(400px,1fr));gap:24px;">${cards}</div>
      </div></section>`)
  }

  sections.push(`<footer style="background:#030712;border-top:1px solid #1f2937;padding:24px 0;text-align:center;">
    <p style="font-size:12px;color:#4b5563;">&copy; ${year} ${escapeHtml(name)}</p></footer>`)

  return sections.join('\n')
}

function renderSiteToStaticHtml(siteData, options = {}) {
  const { canonicalUrl } = options
  let bodyHtml
  switch (siteData.type) {
    case 'law-firm': bodyHtml = renderLawFirmBody(siteData); break
    case 'small-business': bodyHtml = renderSMBBody(siteData); break
    case 'agency': bodyHtml = renderAgencyBody(siteData); break
    default: bodyHtml = `<p>Unknown site type</p>`
  }
  const metaTags = renderMetaTags(siteData.seo, canonicalUrl)
  const serializedData = JSON.stringify(siteData).replace(/</g, '\\u003c')
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    ${metaTags}
    ${siteData.branding.favicon ? `<link rel="icon" href="${escapeAttr(siteData.branding.favicon)}" />` : ''}
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #111827; }
      img { max-width: 100%; height: auto; }
      a { color: inherit; text-decoration: none; }
    </style>
  </head>
  <body>
    ${bodyHtml}
    <script type="application/json" id="site-data">${serializedData}</script>
  </body>
</html>`
}

// ─── Main ────────────────────────────────────────────────────

const DIST_DIR = join(process.cwd(), 'dist')
const DATA_DIR = join(DIST_DIR, 'data')
const BASE_URL = process.env.SITE_BASE_URL || 'https://xtx396.com'

function main() {
  console.log('[static-sites] Starting static site generation...')

  // Check if dist/ exists
  if (!existsSync(DIST_DIR)) {
    console.log('[static-sites] No dist/ directory. Run `npm run build` first.')
    process.exit(1)
  }

  // Try to read site index from the built data files
  const indexPath = join(DATA_DIR, 'sites-index.json')
  if (!existsSync(indexPath)) {
    console.log('[static-sites] No sites-index.json found. Skipping static site generation.')
    console.log('[static-sites] (Site data is managed via the admin panel at runtime.)')
    process.exit(0)
  }

  let sites
  try {
    sites = JSON.parse(readFileSync(indexPath, 'utf-8'))
  } catch {
    console.error('[static-sites] Failed to parse sites-index.json')
    process.exit(1)
  }

  if (!Array.isArray(sites) || sites.length === 0) {
    console.log('[static-sites] No sites in index. Nothing to generate.')
    process.exit(0)
  }

  const deployable = sites.filter(s => s.status === 'public' || s.status === 'demo')
  console.log(`[static-sites] Found ${deployable.length} deployable site(s) out of ${sites.length} total.`)

  let generated = 0
  let cnameContent = null

  for (const summary of deployable) {
    const dataPath = join(DATA_DIR, `sites-${summary.siteId}.json`)
    if (!existsSync(dataPath)) {
      console.warn(`[static-sites] Missing data for "${summary.name}" (${summary.siteId}). Skipping.`)
      continue
    }

    let siteData
    try {
      siteData = JSON.parse(readFileSync(dataPath, 'utf-8'))
    } catch {
      console.warn(`[static-sites] Failed to parse data for "${summary.name}". Skipping.`)
      continue
    }

    // Generate static HTML
    const canonical = `${BASE_URL}/s/${summary.slug}`
    const html = renderSiteToStaticHtml(siteData, { canonicalUrl: canonical })

    // Build snapshot
    const snapshot = {
      exportedAt: new Date().toISOString(),
      siteId: summary.siteId,
      slug: summary.slug,
      type: summary.type,
      name: summary.name,
      domain: summary.domain,
      data: siteData,
    }

    // Hash for integrity
    const hash = createHash('sha256').update(html).digest('hex')
    snapshot.htmlSha256 = hash

    // Write artifacts
    const outDir = join(DIST_DIR, 'sites', summary.slug)
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'index.html'), html, 'utf-8')
    writeFileSync(join(outDir, 'site.json'), JSON.stringify(snapshot, null, 2), 'utf-8')

    console.log(`[static-sites] ✓ ${summary.name} → sites/${summary.slug}/ (${hash.slice(0, 12)}...)`)
    generated++

    // CNAME: first public site with a domain
    if (summary.domain && summary.status === 'public' && !cnameContent) {
      cnameContent = summary.domain
    }
  }

  // Write CNAME if a primary domain site exists
  // Note: the base CNAME (xtx396.com) is injected by the GH Actions workflow
  // This only applies if a client site overrides it
  if (cnameContent) {
    console.log(`[static-sites] Primary domain: ${cnameContent}`)
  }

  console.log(`[static-sites] Done. Generated ${generated} static site(s).`)
}

main()
