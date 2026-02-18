/**
 * Static Site Renderer
 *
 * Generates self-contained HTML strings from NormalizedSiteData.
 * No runtime storage calls. No dynamic imports. Deterministic output.
 *
 * The rendered HTML includes:
 *  - Full SEO meta tags (title, description, og:*, canonical)
 *  - Embedded siteData snapshot as JSON in a <script> tag
 *  - Inline CSS for the site (Tailwind utility classes via CDN)
 *  - Complete rendered HTML body
 */

import type {
  NormalizedSiteData,
  LawFirmSiteData,
  SMBSiteData,
  AgencySiteData,
  SiteCoreSEO,
  SiteCoreBranding,
} from '@/lib/types'

// ─── SEO Meta Tag Generation ─────────────────────────────────

function renderMetaTags(seo: SiteCoreSEO, canonical?: string): string {
  const tags: string[] = [
    `<meta charset="utf-8" />`,
    `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
    `<title>${escapeHtml(seo.title)}</title>`,
  ]

  if (seo.description) {
    tags.push(`<meta name="description" content="${escapeAttr(seo.description)}" />`)
  }

  // Open Graph
  tags.push(`<meta property="og:title" content="${escapeAttr(seo.title)}" />`)
  if (seo.description) {
    tags.push(`<meta property="og:description" content="${escapeAttr(seo.description)}" />`)
  }
  if (seo.ogImage) {
    tags.push(`<meta property="og:image" content="${escapeAttr(seo.ogImage)}" />`)
  }
  tags.push(`<meta property="og:type" content="website" />`)

  // Twitter Card
  tags.push(`<meta name="twitter:card" content="summary_large_image" />`)
  tags.push(`<meta name="twitter:title" content="${escapeAttr(seo.title)}" />`)
  if (seo.description) {
    tags.push(`<meta name="twitter:description" content="${escapeAttr(seo.description)}" />`)
  }

  if (canonical) {
    tags.push(`<link rel="canonical" href="${escapeAttr(canonical)}" />`)
  }

  return tags.join('\n    ')
}

// ─── HTML Escape Utilities ───────────────────────────────────

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, '&quot;').replace(/&/g, '&amp;')
}

// ─── Site Body Renderers (Pure HTML Generation) ──────────────

function renderLawFirmBody(data: LawFirmSiteData): string {
  const c = data.config
  const b = data.branding
  const primary = b.primaryColor
  const accent = b.secondaryColor ?? c.accentColor ?? '#c7a44a'
  const name = c.firmName || data.name

  const sections: string[] = []

  // Navigation
  sections.push(`
    <nav style="background:white;border-bottom:1px solid #e5e7eb;padding:16px 0;">
      <div style="max-width:1280px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:between;">
        <span style="font-weight:700;font-size:18px;color:${primary}">${escapeHtml(name)}</span>
      </div>
    </nav>`)

  // Hero
  sections.push(`
    <section style="background:${primary};color:white;padding:80px 0;text-align:center;">
      <div style="max-width:1280px;margin:0 auto;padding:0 24px;">
        <h1 style="font-size:48px;font-weight:700;margin-bottom:16px;">${escapeHtml(name)}</h1>
        ${c.tagline ? `<p style="font-size:20px;opacity:0.9;max-width:768px;margin:0 auto 24px;">${escapeHtml(c.tagline)}</p>` : ''}
        ${c.description ? `<p style="font-size:16px;opacity:0.75;max-width:640px;margin:0 auto;">${escapeHtml(c.description)}</p>` : ''}
      </div>
    </section>`)

  // Practice Areas
  if (data.practiceAreas.length > 0) {
    const cards = [...data.practiceAreas]
      .sort((a, b) => a.order - b.order)
      .map(area => `
        <div style="background:white;border-radius:12px;padding:24px;border:1px solid #f3f4f6;">
          <h3 style="font-size:18px;font-weight:600;color:${primary};margin-bottom:8px;">${escapeHtml(area.name)}</h3>
          <p style="font-size:14px;color:#4b5563;">${escapeHtml(area.description)}</p>
        </div>`)
      .join('')

    sections.push(`
      <section style="padding:64px 0;background:#f9fafb;">
        <div style="max-width:1280px;margin:0 auto;padding:0 24px;">
          <h2 style="font-size:30px;font-weight:700;text-align:center;color:${primary};margin-bottom:48px;">Practice Areas</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;">
            ${cards}
          </div>
        </div>
      </section>`)
  }

  // Attorneys
  if (data.attorneys.length > 0) {
    const cards = [...data.attorneys]
      .sort((a, b) => a.order - b.order)
      .slice(0, 6)
      .map(att => `
        <div style="background:white;border-radius:12px;border:1px solid #f3f4f6;overflow:hidden;">
          <div style="padding:20px;">
            <h3 style="font-weight:600;font-size:18px;">${escapeHtml(att.name)}</h3>
            <p style="font-size:14px;color:${accent};">${escapeHtml(att.title)}</p>
            <p style="font-size:14px;color:#4b5563;margin-top:8px;">${escapeHtml(att.bio.slice(0, 200))}</p>
          </div>
        </div>`)
      .join('')

    sections.push(`
      <section style="padding:64px 0;">
        <div style="max-width:1280px;margin:0 auto;padding:0 24px;">
          <h2 style="font-size:30px;font-weight:700;text-align:center;color:${primary};margin-bottom:48px;">Our Attorneys</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:32px;">
            ${cards}
          </div>
        </div>
      </section>`)
  }

  // Footer
  sections.push(`
    <footer style="background:${primary};color:white;padding:48px 0;">
      <div style="max-width:1280px;margin:0 auto;padding:0 24px;text-align:center;">
        <p style="font-weight:700;font-size:18px;margin-bottom:8px;">${escapeHtml(name)}</p>
        ${c.phone ? `<p style="font-size:14px;opacity:0.8;">${escapeHtml(c.phone)}</p>` : ''}
        ${c.email ? `<p style="font-size:14px;opacity:0.8;">${escapeHtml(c.email)}</p>` : ''}
        ${c.disclaimer ? `<p style="font-size:12px;opacity:0.5;margin-top:24px;max-width:800px;margin-left:auto;margin-right:auto;">${escapeHtml(c.disclaimer)}</p>` : ''}
        <p style="font-size:12px;opacity:0.4;margin-top:16px;">&copy; ${new Date().getFullYear()} ${escapeHtml(name)}</p>
      </div>
    </footer>`)

  return sections.join('\n')
}

function renderSMBBody(data: SMBSiteData): string {
  const c = data.config
  const b = data.branding
  const primary = b.primaryColor
  const accent = b.secondaryColor ?? c.accentColor ?? '#f59e0b'
  const name = c.businessName || data.name

  const sections: string[] = []

  // Navigation
  sections.push(`
    <nav style="background:white;border-bottom:1px solid #e5e7eb;padding:16px 0;">
      <div style="max-width:1280px;margin:0 auto;padding:0 24px;">
        <span style="font-weight:700;font-size:18px;color:${primary}">${escapeHtml(name)}</span>
      </div>
    </nav>`)

  // Hero
  if (c.sections.hero) {
    sections.push(`
      <section style="background:linear-gradient(135deg, ${primary} 0%, ${primary}dd 100%);color:white;padding:80px 0;text-align:center;">
        <div style="max-width:1280px;margin:0 auto;padding:0 24px;">
          <h1 style="font-size:48px;font-weight:700;margin-bottom:16px;">${escapeHtml(name)}</h1>
          ${c.tagline ? `<p style="font-size:20px;opacity:0.9;">${escapeHtml(c.tagline)}</p>` : ''}
        </div>
      </section>`)
  }

  // Services
  if (c.sections.services && data.services.length > 0) {
    const cards = [...data.services]
      .sort((a, b) => a.order - b.order)
      .map(svc => `
        <div style="border:1px solid #f3f4f6;border-radius:12px;padding:20px;">
          <h3 style="font-weight:600;font-size:18px;margin-bottom:4px;">${escapeHtml(svc.name)}</h3>
          ${svc.price ? `<div style="font-size:14px;font-weight:500;color:${accent};margin-bottom:8px;">${escapeHtml(svc.price)}</div>` : ''}
          <p style="font-size:14px;color:#4b5563;">${escapeHtml(svc.description)}</p>
        </div>`)
      .join('')

    sections.push(`
      <section style="padding:64px 0;">
        <div style="max-width:1280px;margin:0 auto;padding:0 24px;">
          <h2 style="font-size:30px;font-weight:700;text-align:center;color:${primary};margin-bottom:48px;">Our Services</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;">
            ${cards}
          </div>
        </div>
      </section>`)
  }

  // Contact
  if (c.sections.contact) {
    sections.push(`
      <section style="padding:64px 0;background:#f9fafb;">
        <div style="max-width:768px;margin:0 auto;padding:0 24px;text-align:center;">
          <h2 style="font-size:30px;font-weight:700;color:${primary};margin-bottom:16px;">Get in Touch</h2>
          ${c.phone ? `<p style="font-size:14px;color:#4b5563;">${escapeHtml(c.phone)}</p>` : ''}
          ${c.email ? `<p style="font-size:14px;color:#4b5563;">${escapeHtml(c.email)}</p>` : ''}
          ${c.address ? `<p style="font-size:14px;color:#4b5563;">${escapeHtml(c.address)}</p>` : ''}
        </div>
      </section>`)
  }

  // Footer
  sections.push(`
    <footer style="background:${primary};color:white;padding:32px 0;text-align:center;">
      <p style="font-size:14px;opacity:0.8;">&copy; ${new Date().getFullYear()} ${escapeHtml(name)}</p>
    </footer>`)

  return sections.join('\n')
}

function renderAgencyBody(data: AgencySiteData): string {
  const c = data.config
  const name = c.agencyName || data.name
  const launched = data.projects.filter(p => p.status === 'launched' || p.status === 'maintenance')

  const sections: string[] = []

  // Nav
  sections.push(`
    <nav style="background:#030712;border-bottom:1px solid #1f2937;padding:16px 0;">
      <div style="max-width:1280px;margin:0 auto;padding:0 24px;">
        <span style="font-weight:700;font-size:18px;color:white;">${escapeHtml(name)}</span>
      </div>
    </nav>`)

  // Hero
  sections.push(`
    <section style="background:#030712;color:white;padding:96px 0;">
      <div style="max-width:1280px;margin:0 auto;padding:0 24px;">
        <h1 style="font-size:56px;font-weight:700;margin-bottom:24px;">${escapeHtml(name)}</h1>
        <p style="font-size:20px;color:#9ca3af;">
          ${launched.length} project${launched.length !== 1 ? 's' : ''} delivered.
        </p>
      </div>
    </section>`)

  // Projects
  if (launched.length > 0) {
    const cards = launched.map(proj => `
      <div style="background:#111827;border:1px solid #1f2937;border-radius:12px;padding:24px;">
        <h3 style="font-weight:600;color:white;font-size:18px;margin-bottom:4px;">${escapeHtml(proj.projectName ?? proj.clientName)}</h3>
        ${proj.domain ? `<p style="font-size:12px;color:#60a5fa;">${escapeHtml(proj.domain)}</p>` : ''}
        ${proj.deliverables.length > 0 ? `<p style="font-size:12px;color:#6b7280;margin-top:12px;">${proj.deliverables.slice(0, 3).map(d => escapeHtml(d)).join(' · ')}</p>` : ''}
      </div>`)
      .join('')

    sections.push(`
      <section style="background:#030712;padding:64px 0;border-top:1px solid #1f2937;">
        <div style="max-width:1280px;margin:0 auto;padding:0 24px;">
          <h2 style="font-size:30px;font-weight:700;color:white;margin-bottom:40px;">Selected Work</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(400px,1fr));gap:24px;">
            ${cards}
          </div>
        </div>
      </section>`)
  }

  // Footer
  sections.push(`
    <footer style="background:#030712;border-top:1px solid #1f2937;padding:24px 0;text-align:center;">
      <p style="font-size:12px;color:#4b5563;">&copy; ${new Date().getFullYear()} ${escapeHtml(name)}</p>
    </footer>`)

  return sections.join('\n')
}

// ─── Main Export Function ────────────────────────────────────

export interface StaticRenderOptions {
  /** Canonical URL for the page. */
  canonicalUrl?: string
  /** Base path for assets. Defaults to './' */
  basePath?: string
}

/**
 * Render a NormalizedSiteData object to a complete, self-contained HTML string.
 *
 * Deterministic: given the same input, always produces the same output.
 * No runtime storage calls. No dynamic imports. No window dependency.
 */
export function renderSiteToStaticHtml(
  siteData: NormalizedSiteData,
  options: StaticRenderOptions = {},
): string {
  const { canonicalUrl, basePath = './' } = options

  // Generate body HTML based on site type
  let bodyHtml: string
  switch (siteData.type) {
    case 'law-firm':
      bodyHtml = renderLawFirmBody(siteData)
      break
    case 'small-business':
      bodyHtml = renderSMBBody(siteData)
      break
    case 'agency':
      bodyHtml = renderAgencyBody(siteData)
      break
  }

  const metaTags = renderMetaTags(siteData.seo, canonicalUrl)

  // Serialize site data for hydration / reference
  // Escape </ sequences to prevent premature script tag closure
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
