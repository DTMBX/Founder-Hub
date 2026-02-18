/**
 * apps/sitegen/safety/__tests__/template-safe-subset.test.ts
 *
 * Tests for P6 — Template Safe Subset.
 * Covers allowlists, blocked routes, content safety, external URL gate,
 * and aggregate safe-mode evaluation.
 */
import { describe, it, expect } from 'vitest'
import {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  BLOCKED_ROUTE_PREFIXES,
  BLOCKED_EXACT_ROUTES,
  isAllowedExtension,
  isAllowedMimeType,
  isRouteBlocked,
  checkContentSafety,
  ALLOWED_EXTERNAL_DOMAINS,
  isAllowedExternalUrl,
  evaluateSafeMode,
} from '../TemplateSafeSubset.js'

// ─── Asset Allowlist ─────────────────────────────────────────────────

describe('Asset Allowlist', () => {
  it('has at least 10 allowed MIME types', () => {
    expect(ALLOWED_MIME_TYPES.length).toBeGreaterThanOrEqual(10)
  })

  it('has at least 10 allowed extensions', () => {
    expect(ALLOWED_EXTENSIONS.length).toBeGreaterThanOrEqual(10)
  })

  describe('isAllowedExtension', () => {
    it.each(['.html', '.css', '.png', '.webp', '.woff2', '.json'])('allows %s', ext => {
      expect(isAllowedExtension(ext)).toBe(true)
    })

    it.each(['.js', '.ts', '.exe', '.sh', '.php', '.py'])('blocks %s', ext => {
      expect(isAllowedExtension(ext)).toBe(false)
    })

    it('normalizes without leading dot', () => {
      expect(isAllowedExtension('png')).toBe(true)
    })

    it('is case-insensitive', () => {
      expect(isAllowedExtension('.PNG')).toBe(true)
      expect(isAllowedExtension('.Css')).toBe(true)
    })
  })

  describe('isAllowedMimeType', () => {
    it.each(['text/html', 'text/css', 'image/png', 'image/webp', 'font/woff2'])('allows %s', mime => {
      expect(isAllowedMimeType(mime)).toBe(true)
    })

    it.each(['application/javascript', 'text/javascript', 'application/x-php'])('blocks %s', mime => {
      expect(isAllowedMimeType(mime)).toBe(false)
    })
  })
})

// ─── Blocked Routes ──────────────────────────────────────────────────

describe('Route Blocking', () => {
  it('has blocked prefixes', () => {
    expect(BLOCKED_ROUTE_PREFIXES.length).toBeGreaterThan(5)
  })

  it('has blocked exact routes', () => {
    expect(BLOCKED_EXACT_ROUTES.length).toBeGreaterThan(0)
  })

  describe('isRouteBlocked', () => {
    it.each(['/admin', '/admin/settings', '/api/internal', '/api/internal/keys', '/settings', '/billing', '/users', '/debug', '/dev-tools', '/__vite', '/__webpack'])('blocks prefix %s', route => {
      expect(isRouteBlocked(route)).toBe(true)
    })

    it.each(['/logout', '/impersonate', '/export-all', '/purge'])('blocks exact %s', route => {
      expect(isRouteBlocked(route)).toBe(true)
    })

    it.each(['/', '/home', '/about', '/contact', '/services', '/faq'])('allows safe route %s', route => {
      expect(isRouteBlocked(route)).toBe(false)
    })

    it('blocks empty string (fail-closed)', () => {
      expect(isRouteBlocked('')).toBe(true)
    })

    it('blocks path without leading slash', () => {
      expect(isRouteBlocked('admin')).toBe(true)
    })

    it('strips query params before checking', () => {
      expect(isRouteBlocked('/admin?page=1')).toBe(true)
    })

    it('strips hash before checking', () => {
      expect(isRouteBlocked('/admin#section')).toBe(true)
    })

    it('is case-insensitive', () => {
      expect(isRouteBlocked('/Admin')).toBe(true)
      expect(isRouteBlocked('/ADMIN/settings')).toBe(true)
    })
  })
})

// ─── Content Safety ──────────────────────────────────────────────────

describe('Content Safety', () => {
  it('passes safe HTML', () => {
    const html = '<div class="hero"><h1>Hello World</h1><p>Welcome.</p></div>'
    const result = checkContentSafety(html)
    expect(result.safe).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('fails on inline script tag', () => {
    const result = checkContentSafety('<div><script>alert("xss")</script></div>')
    expect(result.safe).toBe(false)
    expect(result.violations.length).toBeGreaterThan(0)
  })

  it('fails on javascript: protocol', () => {
    const result = checkContentSafety('<a href="javascript:void(0)">Click</a>')
    expect(result.safe).toBe(false)
  })

  it('fails on inline event handler', () => {
    const result = checkContentSafety('<div onclick="doEvil()">Click</div>')
    expect(result.safe).toBe(false)
  })

  it('fails on eval', () => {
    const result = checkContentSafety('<div>eval(\"bad\")</div>')
    expect(result.safe).toBe(false)
  })

  it('fails on document.write', () => {
    const result = checkContentSafety('<div>document.write("bad")</div>')
    expect(result.safe).toBe(false)
  })

  it('fails on document.cookie', () => {
    const result = checkContentSafety('<div>document.cookie</div>')
    expect(result.safe).toBe(false)
  })

  it('fails on innerHTML assignment', () => {
    const result = checkContentSafety('<div>el.innerHTML = "bad"</div>')
    expect(result.safe).toBe(false)
  })

  it('fails on data:text/html', () => {
    const result = checkContentSafety('<iframe src="data: text/html,<h1>bad</h1>"></iframe>')
    expect(result.safe).toBe(false)
  })

  it('fails on empty input (fail-closed)', () => {
    const result = checkContentSafety('')
    expect(result.safe).toBe(false)
  })

  it('collects multiple violations', () => {
    const html = '<div onclick="evil()"><script>eval("x")</script></div>'
    const result = checkContentSafety(html)
    expect(result.violations.length).toBeGreaterThan(2)
  })
})

// ─── External URL Gate ───────────────────────────────────────────────

describe('External URL Gate', () => {
  it('has allowed external domains', () => {
    expect(ALLOWED_EXTERNAL_DOMAINS.length).toBeGreaterThan(0)
  })

  it.each([
    'https://fonts.googleapis.com/css2?family=Inter',
    'https://fonts.gstatic.com/s/inter/v13/abc.woff2',
    'https://cdn.jsdelivr.net/npm/lib@1.0.0/dist/lib.min.css',
    'https://unpkg.com/htmx.org@1.9.2',
  ])('allows %s', url => {
    expect(isAllowedExternalUrl(url)).toBe(true)
  })

  it.each([
    'https://evil.com/track.js',
    'https://analytics.google.com/collect',
    'ftp://random-server.net/file',
  ])('blocks %s', url => {
    expect(isAllowedExternalUrl(url)).toBe(false)
  })

  it('allows relative URLs', () => {
    expect(isAllowedExternalUrl('/assets/hero.png')).toBe(true)
    expect(isAllowedExternalUrl('./styles.css')).toBe(true)
    expect(isAllowedExternalUrl('../images/logo.svg')).toBe(true)
  })

  it('allows data:image URIs', () => {
    expect(isAllowedExternalUrl('data:image/png;base64,abc123')).toBe(true)
  })

  it('blocks data:text/html URIs', () => {
    expect(isAllowedExternalUrl('data:text/html,<h1>bad</h1>')).toBe(false)
  })

  it('blocks empty input', () => {
    expect(isAllowedExternalUrl('')).toBe(false)
  })
})

// ─── Aggregate Safe Mode Evaluation ──────────────────────────────────

describe('evaluateSafeMode', () => {
  const safeHtml = '<div class="hero"><h1>Welcome</h1></div>'

  it('passes fully safe page', () => {
    const report = evaluateSafeMode('/home', safeHtml, ['https://fonts.googleapis.com/css2'])
    expect(report.safeMode).toBe(true)
    expect(report.routeBlocked).toBe(false)
    expect(report.contentSafe).toBe(true)
    expect(report.assetsAllowed).toBe(true)
    expect(report.violations).toHaveLength(0)
  })

  it('fails on blocked route', () => {
    const report = evaluateSafeMode('/admin', safeHtml, [])
    expect(report.safeMode).toBe(false)
    expect(report.routeBlocked).toBe(true)
  })

  it('fails on unsafe content', () => {
    const report = evaluateSafeMode('/home', '<script>bad</script>', [])
    expect(report.safeMode).toBe(false)
    expect(report.contentSafe).toBe(false)
  })

  it('fails on blocked external URL', () => {
    const report = evaluateSafeMode('/home', safeHtml, ['https://evil.com/track.js'])
    expect(report.safeMode).toBe(false)
    expect(report.assetsAllowed).toBe(false)
  })

  it('aggregates all violations', () => {
    const report = evaluateSafeMode(
      '/admin',
      '<script>eval("x")</script>',
      ['https://evil.com/track.js'],
    )
    expect(report.safeMode).toBe(false)
    expect(report.violations.length).toBeGreaterThan(3)
  })

  it('handles empty external URLs array', () => {
    const report = evaluateSafeMode('/home', safeHtml, [])
    expect(report.safeMode).toBe(true)
    expect(report.assetsAllowed).toBe(true)
  })
})
