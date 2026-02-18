/**
 * Visitor Preview Panel — Token
 *
 * HMAC-based token generation and verification for preview share links.
 * Tokens are time-limited and tied to a specific site + operator.
 *
 * Uses Web Crypto API for HMAC-SHA256 (deterministic, no external deps).
 *
 * Invariants:
 * - Same payload + key always produces the same signature.
 * - Expired tokens always fail validation.
 * - Tokens are bound to siteId + operatorId.
 */

import type { PreviewToken, TokenPayload, TokenValidationResult } from './types'

// ─── Constants ───────────────────────────────────────────────

/** Default token TTL: 24 hours. */
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000

// ─── HMAC Key Import ─────────────────────────────────────────

/**
 * Imports a raw string key for HMAC-SHA256.
 * Returns a CryptoKey usable with sign/verify.
 */
async function importKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

// ─── HMAC Sign ───────────────────────────────────────────────

/**
 * Computes HMAC-SHA256 of data using the given key.
 * Returns hex-encoded signature.
 */
async function hmacSign(data: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder()
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  const sigArray = Array.from(new Uint8Array(sigBuffer))
  return sigArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ─── HMAC Verify ─────────────────────────────────────────────

/**
 * Verifies an HMAC-SHA256 signature.
 * Recomputes and compares (constant-time not guaranteed in JS,
 * but sufficient for preview token use case).
 */
async function hmacVerify(
  data: string,
  signature: string,
  key: CryptoKey,
): Promise<boolean> {
  const expected = await hmacSign(data, key)
  if (expected.length !== signature.length) return false
  let mismatch = 0
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return mismatch === 0
}

// ─── Canonical Payload String ────────────────────────────────

/**
 * Produces a canonical string from a token payload for signing.
 * Field order is fixed for determinism.
 */
function canonicalize(payload: TokenPayload): string {
  return [
    payload.siteId,
    payload.operatorId,
    payload.createdAt,
    payload.expiresAt,
  ].join('|')
}

// ─── Token ID Generation ────────────────────────────────────

/**
 * Generates a deterministic token ID from payload fields.
 * Uses a simple hash of the canonical string.
 */
async function generateTokenId(payload: TokenPayload, key: CryptoKey): Promise<string> {
  const sig = await hmacSign(`tokenid:${canonicalize(payload)}`, key)
  return `ptk_${sig.slice(0, 16)}`
}

// ─── Create Token ────────────────────────────────────────────

/**
 * Creates a signed preview token.
 *
 * @param siteId - Site this token grants preview access to
 * @param operatorId - Operator creating the token
 * @param secret - HMAC signing key
 * @param ttlMs - Token time-to-live in ms (default: 24h)
 * @param now - Current time override (for testing)
 */
export async function createToken(
  siteId: string,
  operatorId: string,
  secret: string,
  ttlMs: number = DEFAULT_TTL_MS,
  now?: Date,
): Promise<PreviewToken> {
  const created = now ?? new Date()
  const expires = new Date(created.getTime() + ttlMs)

  const payload: TokenPayload = {
    siteId,
    operatorId,
    createdAt: created.toISOString(),
    expiresAt: expires.toISOString(),
  }

  const key = await importKey(secret)
  const data = canonicalize(payload)
  const signature = await hmacSign(data, key)
  const tokenId = await generateTokenId(payload, key)

  return { tokenId, ...payload, signature }
}

// ─── Verify Token ────────────────────────────────────────────

/**
 * Verifies a preview token's signature and expiration.
 *
 * @param token - Token to verify
 * @param secret - HMAC signing key (must match creation key)
 * @param now - Current time override (for testing)
 */
export async function verifyToken(
  token: PreviewToken,
  secret: string,
  now?: Date,
): Promise<TokenValidationResult> {
  const currentTime = now ?? new Date()

  // Check expiration first
  const expiresAt = new Date(token.expiresAt)
  if (currentTime >= expiresAt) {
    return { valid: false, error: 'Token has expired' }
  }

  // Verify signature
  const payload: TokenPayload = {
    siteId: token.siteId,
    operatorId: token.operatorId,
    createdAt: token.createdAt,
    expiresAt: token.expiresAt,
  }

  const key = await importKey(secret)
  const data = canonicalize(payload)
  const valid = await hmacVerify(data, token.signature, key)

  if (!valid) {
    return { valid: false, error: 'Invalid token signature' }
  }

  return { valid: true, payload }
}
