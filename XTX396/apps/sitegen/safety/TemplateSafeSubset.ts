/**
 * apps/sitegen/safety/TemplateSafeSubset.ts
 *
 * P6 — Template Safe Subset.
 * Defines the allowlisted assets, blocked routes, and operator-mode
 * restrictions that ensure preview/demo sites cannot leak sensitive
 * data or execute unsafe operations.
 *
 * Safe Mode ON = operator cannot reach admin routes, inject scripts,
 * or reference external assets outside the allowlist.
 */

// ─── Asset Allowlist ─────────────────────────────────────────────────

/**
 * MIME types permitted in preview/demo templates.
 * Anything not on this list is blocked.
 */
export const ALLOWED_MIME_TYPES = Object.freeze([
  'text/html',
  'text/css',
  'text/plain',
  'application/json',
  'image/svg+xml',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'font/woff2',
  'font/woff',
] as const)

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

/**
 * File extensions that map to allowed MIME types.
 */
export const ALLOWED_EXTENSIONS = Object.freeze([
  '.html',
  '.css',
  '.json',
  '.txt',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.avif',
  '.woff2',
  '.woff',
] as const)

export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number]

/**
 * Check whether a file extension is on the safe allowlist.
 */
export function isAllowedExtension(ext: string): ext is AllowedExtension {
  const normalized = ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(normalized)
}

/**
 * Check whether a MIME type is on the safe allowlist.
 */
export function isAllowedMimeType(mime: string): mime is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime.toLowerCase())
}

// ─── Blocked Routes ──────────────────────────────────────────────────

/**
 * Route prefixes blocked in operator/preview mode.
 * Any navigation or fetch to these prefixes should be denied.
 */
export const BLOCKED_ROUTE_PREFIXES = Object.freeze([
  '/admin',
  '/api/internal',
  '/api/admin',
  '/settings',
  '/billing',
  '/users',
  '/debug',
  '/dev-tools',
  '/__vite',
  '/__webpack',
] as const)

/**
 * Exact routes blocked in operator/preview mode.
 */
export const BLOCKED_EXACT_ROUTES = Object.freeze([
  '/logout',
  '/impersonate',
  '/export-all',
  '/purge',
] as const)

/**
 * Check whether a route path is blocked for operator preview mode.
 * Fail-closed: if the path is empty or malformed, it is blocked.
 */
export function isRouteBlocked(path: string): boolean {
  if (!path || typeof path !== 'string') return true

  const normalized = path.toLowerCase().split('?')[0].split('#')[0]
  if (!normalized.startsWith('/')) return true

  for (const prefix of BLOCKED_ROUTE_PREFIXES) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return true
    }
  }

  for (const exact of BLOCKED_EXACT_ROUTES) {
    if (normalized === exact) return true
  }

  return false
}

// ─── Content Security Policy (template-level) ───────────────────────

/**
 * Inline-script detection patterns.
 * Templates must not contain any of these.
 */
const UNSAFE_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /data:\s*text\/html/i,
  /eval\s*\(/i,
  /Function\s*\(/i,
  /document\.write/i,
  /document\.cookie/i,
  /window\.location\s*=/i,
  /innerHTML\s*=/i,
] as const

export interface ContentSafetyResult {
  readonly safe: boolean
  readonly violations: readonly string[]
}

/**
 * Scan HTML content for unsafe patterns.
 * Fail-closed: empty or non-string input is unsafe.
 */
export function checkContentSafety(html: string): ContentSafetyResult {
  if (!html || typeof html !== 'string') {
    return { safe: false, violations: ['Content is empty or invalid.'] }
  }

  const violations: string[] = []

  for (const pattern of UNSAFE_PATTERNS) {
    if (pattern.test(html)) {
      violations.push(`Unsafe pattern detected: ${pattern.source}`)
    }
  }

  return {
    safe: violations.length === 0,
    violations,
  }
}

// ─── External Reference Gate ─────────────────────────────────────────

/**
 * Allowed external domains for asset references (e.g., fonts, CDN).
 * Everything else is blocked.
 */
export const ALLOWED_EXTERNAL_DOMAINS = Object.freeze([
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
] as const)

/**
 * Check whether a URL references an allowed external source.
 * Local (relative) paths are always allowed.
 * Fail-closed: malformed URLs are blocked.
 */
export function isAllowedExternalUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false

  const trimmed = url.trim()

  // Relative URLs are fine
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return true
  }

  // Data URIs for images only
  if (trimmed.startsWith('data:image/')) return true

  // Protocol-relative or absolute
  try {
    const parsed = new URL(trimmed, 'https://placeholder.local')
    const hostname = parsed.hostname.toLowerCase()

    return (ALLOWED_EXTERNAL_DOMAINS as readonly string[]).includes(hostname)
  } catch {
    return false
  }
}

// ─── Aggregate Safe Mode Evaluation ──────────────────────────────────

export interface SafeModeReport {
  readonly safeMode: boolean
  readonly routeBlocked: boolean
  readonly contentSafe: boolean
  readonly assetsAllowed: boolean
  readonly violations: readonly string[]
}

/**
 * Evaluate a page for safe-mode compliance.
 * Checks route, content safety, and external references.
 */
export function evaluateSafeMode(
  route: string,
  html: string,
  externalUrls: readonly string[],
): SafeModeReport {
  const violations: string[] = []

  const routeBlocked = isRouteBlocked(route)
  if (routeBlocked) {
    violations.push(`Route "${route}" is blocked in safe mode.`)
  }

  const contentResult = checkContentSafety(html)
  if (!contentResult.safe) {
    violations.push(...contentResult.violations)
  }

  const blockedUrls = externalUrls.filter(u => !isAllowedExternalUrl(u))
  const assetsAllowed = blockedUrls.length === 0
  if (!assetsAllowed) {
    for (const u of blockedUrls) {
      violations.push(`External URL blocked: ${u}`)
    }
  }

  return {
    safeMode: violations.length === 0,
    routeBlocked,
    contentSafe: contentResult.safe,
    assetsAllowed,
    violations,
  }
}
