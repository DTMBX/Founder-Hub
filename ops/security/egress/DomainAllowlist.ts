// B11.1 – Gap-Fill Hardening
// D1 — Network Egress: Domain Allowlist with SSRF protection
//
// This module is the SINGLE authority for deciding whether an outbound
// HTTP request may proceed. Every adapter that performs fetch() must
// call validateEgressUrl() before opening a connection.

// ─── Private-IP / Metadata Detection ─────────────────────────────

/**
 * Returns true if the hostname resolves to a private, loopback,
 * link-local, or cloud metadata IP range.  Works on the textual
 * hostname only (no DNS resolution — that is intentional so the
 * check cannot be bypassed by DNS rebinding after validation).
 */
function isBlockedHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();

  // Loopback
  if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1') return true;

  // Metadata endpoints (AWS, GCP, Azure, DigitalOcean, etc.)
  if (h === '169.254.169.254' || h === 'metadata.google.internal') return true;

  // Bare IPv4: detect RFC-1918 / link-local / loopback numerically
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [, a, b] = ipv4.map(Number);
    if (a === 10) return true;                              // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true;       // 172.16.0.0/12
    if (a === 192 && b === 168) return true;                 // 192.168.0.0/16
    if (a === 127) return true;                              // 127.0.0.0/8
    if (a === 169 && b === 254) return true;                 // 169.254.0.0/16 link-local
    if (a === 0) return true;                                // 0.0.0.0/8
  }

  // IPv6 loopback / link-local (simplified textual check)
  if (h.startsWith('[')) {
    const inner = h.slice(1, -1);
    if (inner === '::1') return true;
    if (inner.startsWith('fe80:')) return true;
    if (inner.startsWith('fc') || inner.startsWith('fd')) return true; // ULA
  }

  return false;
}

// ─── Hostname Normalisation ──────────────────────────────────────

/**
 * Normalise a hostname for allowlist comparison:
 * - lowercase
 * - strip trailing dot (DNS root)
 * - ASCII-encode IDN / punycode via URL constructor
 * - strip brackets from IPv6
 */
function normaliseHostname(raw: string): string {
  let h = raw.toLowerCase();
  // Strip trailing dot
  if (h.endsWith('.')) h = h.slice(0, -1);
  // Strip IPv6 brackets
  if (h.startsWith('[') && h.endsWith(']')) h = h.slice(1, -1);
  return h;
}

// ─── Allowlist Store ─────────────────────────────────────────────

const _allowedDomains = new Set<string>();

/** Add a domain to the egress allowlist. Normalised on add. */
export function addAllowedDomain(domain: string): void {
  _allowedDomains.add(normaliseHostname(domain));
}

/** Remove a domain from the egress allowlist. */
export function removeAllowedDomain(domain: string): void {
  _allowedDomains.delete(normaliseHostname(domain));
}

/** Return a copy of the current allowlist. */
export function getAllowedDomains(): string[] {
  return Array.from(_allowedDomains);
}

/** Clear all allowed domains (for testing). */
export function resetAllowedDomains(): void {
  _allowedDomains.clear();
}

// Always allow GitHub API for content ops
addAllowedDomain('api.github.com');

// ─── Allowed Schemes ────────────────────────────────────────────

const ALLOWED_SCHEMES = new Set(['https:']);

// ─── Validation Result ──────────────────────────────────────────

export interface EgressValidation {
  allowed: boolean;
  reason?: string;
  normalisedUrl?: string;
}

// ─── Core Validator ──────────────────────────────────────────────

/**
 * Validate a URL against the egress policy.
 *
 * Checks (in order):
 * 1. URL is parseable.
 * 2. Scheme is HTTPS only (no http, ftp, file, data, etc.).
 * 3. Hostname is not a private/loopback/metadata address.
 * 4. Hostname (normalised) is in the allowlist.
 * 5. Port, if specified, must be 443 (the default for HTTPS).
 */
export function validateEgressUrl(url: string): EgressValidation {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { allowed: false, reason: 'Unparseable URL.' };
  }

  // Scheme check
  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    return { allowed: false, reason: `Scheme '${parsed.protocol}' not allowed. Only HTTPS is permitted.` };
  }

  // Port check — only default HTTPS port
  if (parsed.port !== '' && parsed.port !== '443') {
    return { allowed: false, reason: `Non-standard port '${parsed.port}' not allowed.` };
  }

  // Auth in URL check (user:pass@host)
  if (parsed.username || parsed.password) {
    return { allowed: false, reason: 'Credentials in URL not allowed.' };
  }

  const hostname = normaliseHostname(parsed.hostname);

  // Private / metadata block
  if (isBlockedHostname(hostname)) {
    return { allowed: false, reason: `Hostname '${hostname}' resolves to a blocked address range.` };
  }

  // Allowlist check
  if (!_allowedDomains.has(hostname)) {
    return { allowed: false, reason: `Hostname '${hostname}' is not in the egress allowlist.` };
  }

  return { allowed: true, normalisedUrl: parsed.href };
}

// ─── Redirect Policy ────────────────────────────────────────────

/**
 * Validate a redirect target URL.
 * Returns false if the redirect would escape the allowlist or hit
 * a blocked address. Callers should abort the request chain.
 */
export function isRedirectAllowed(redirectUrl: string): boolean {
  return validateEgressUrl(redirectUrl).allowed;
}

/**
 * Create a fetch wrapper that enforces egress policy and blocks
 * redirects to non-allowlisted destinations.
 *
 * Usage: const response = await safeFetch(url, init);
 */
export async function safeFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const validation = validateEgressUrl(url);
  if (!validation.allowed) {
    throw new EgressBlockedError(url, validation.reason ?? 'Blocked by egress policy.');
  }

  // Use manual redirect to intercept and validate each hop
  const response = await fetch(url, {
    ...init,
    redirect: 'manual',
  });

  // Handle redirects
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (!location) {
      throw new EgressBlockedError(url, 'Redirect with no Location header.');
    }

    // Resolve relative redirects
    const absoluteLocation = new URL(location, url).href;

    if (!isRedirectAllowed(absoluteLocation)) {
      throw new EgressBlockedError(
        absoluteLocation,
        `Redirect to '${absoluteLocation}' blocked by egress policy.`,
      );
    }

    // Follow the validated redirect (one hop only — no recursive chasing)
    return fetch(absoluteLocation, {
      ...init,
      redirect: 'manual',
    });
  }

  return response;
}

// ─── Error Class ─────────────────────────────────────────────────

export class EgressBlockedError extends Error {
  readonly blockedUrl: string;
  readonly policyReason: string;

  constructor(blockedUrl: string, reason: string) {
    super(`Egress blocked: ${reason} (URL: ${blockedUrl})`);
    this.name = 'EgressBlockedError';
    this.blockedUrl = blockedUrl;
    this.policyReason = reason;
  }
}
