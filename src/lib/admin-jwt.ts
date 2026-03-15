/**
 * JWT-based admin authentication guard.
 *
 * Issues and validates JSON Web Tokens for admin sessions using
 * WebCrypto HMAC-SHA256. Tokens are stored in sessionStorage
 * and validated on every admin route render.
 *
 * The signing key is derived from the admin password hash at login time
 * (never stored in plaintext). In production with Supabase, the JWT
 * comes from Supabase Auth instead and this module validates the
 * standard `sub` / `exp` claims.
 *
 * PUBLIC SITE GUARANTEE: The public-facing site never imports this module.
 * All public pages render from the static PROJECT_REGISTRY and build-time 
 * JSON — they never depend on admin data being present.
 */

const JWT_STORAGE_KEY = 'founder-hub-jwt'
const JWT_ISSUER = 'founder-hub'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JWTPayload {
  sub: string   // user ID
  role: string  // 'owner' | 'editor'
  iss: string
  iat: number
  exp: number
}

// ---------------------------------------------------------------------------
// WebCrypto key derivation
// ---------------------------------------------------------------------------

let signingKey: CryptoKey | null = null

/**
 * Initialize the signing key from a password-derived secret.
 * Call this once at login time with the user's credential hash.
 */
export async function initJWTKey(secret: string): Promise<void> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
  signingKey = keyMaterial
}

// ---------------------------------------------------------------------------
// Token creation
// ---------------------------------------------------------------------------

function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (str.length % 4)) % 4)
  return atob(padded)
}

/**
 * Issue a signed JWT for an authenticated admin user.
 * Token expires in 4 hours (matches existing session duration).
 */
export async function issueToken(userId: string, role: string): Promise<string> {
  if (!signingKey) throw new Error('JWT signing key not initialized')

  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload: JWTPayload = {
    sub: userId,
    role,
    iss: JWT_ISSUER,
    iat: now,
    exp: now + 4 * 60 * 60, // 4 hours
  }

  const headerB64 = base64urlEncode(JSON.stringify(header))
  const payloadB64 = base64urlEncode(JSON.stringify(payload))
  const message = `${headerB64}.${payloadB64}`

  const encoder = new TextEncoder()
  const sig = await crypto.subtle.sign('HMAC', signingKey, encoder.encode(message))

  return `${message}.${base64url(sig)}`
}

// ---------------------------------------------------------------------------
// Token validation
// ---------------------------------------------------------------------------

/**
 * Validate a JWT and return its payload, or null if invalid/expired.
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  if (!signingKey) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [headerB64, payloadB64, sigB64] = parts
  const message = `${headerB64}.${payloadB64}`

  // Reconstruct signature bytes
  const sigStr = base64urlDecode(sigB64)
  const sigBytes = new Uint8Array(sigStr.length)
  for (let i = 0; i < sigStr.length; i++) sigBytes[i] = sigStr.charCodeAt(i)

  const encoder = new TextEncoder()
  const valid = await crypto.subtle.verify('HMAC', signingKey, sigBytes, encoder.encode(message))
  if (!valid) return null

  try {
    const payload = JSON.parse(base64urlDecode(payloadB64)) as JWTPayload

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    // Check issuer
    if (payload.iss !== JWT_ISSUER) return null

    return payload
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Session storage helpers
// ---------------------------------------------------------------------------

/** Store a JWT in sessionStorage. */
export function storeToken(token: string): void {
  try {
    sessionStorage.setItem(JWT_STORAGE_KEY, token)
  } catch {
    // sessionStorage unavailable
  }
}

/** Retrieve the stored JWT, or null if none. */
export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(JWT_STORAGE_KEY)
  } catch {
    return null
  }
}

/** Clear the stored JWT (logout). */
export function clearToken(): void {
  try {
    sessionStorage.removeItem(JWT_STORAGE_KEY)
  } catch {
    // noop
  }
}

/**
 * Quick check: is there a stored token that appears valid (not expired)?
 * Does NOT verify the signature — use verifyToken() for full validation.
 */
export function hasValidToken(): boolean {
  const token = getStoredToken()
  if (!token) return false

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const payload = JSON.parse(base64urlDecode(parts[1])) as JWTPayload
    return payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}
