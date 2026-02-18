/**
 * Visitor Preview Panel — Types
 *
 * Defines data structures for the preview system:
 * tokens, sessions, rate limits, and preview results.
 */

// ─── Token ───────────────────────────────────────────────────

/** A signed preview token for share links. */
export interface PreviewToken {
  /** Unique token identifier. */
  readonly tokenId: string
  /** Site ID this token grants access to. */
  readonly siteId: string
  /** Operator who created the token. */
  readonly operatorId: string
  /** ISO 8601 creation timestamp. */
  readonly createdAt: string
  /** ISO 8601 expiration timestamp. */
  readonly expiresAt: string
  /** HMAC signature (hex). */
  readonly signature: string
}

/** Payload embedded in a preview token (before signing). */
export interface TokenPayload {
  readonly siteId: string
  readonly operatorId: string
  readonly createdAt: string
  readonly expiresAt: string
}

// ─── Rate Limit ──────────────────────────────────────────────

/** Rate limit configuration. */
export interface RateLimitConfig {
  /** Maximum requests per window. */
  readonly maxRequests: number
  /** Window duration in milliseconds. */
  readonly windowMs: number
}

/** Result of a rate limit check. */
export interface RateLimitResult {
  /** Whether the request is allowed. */
  readonly allowed: boolean
  /** Remaining requests in current window. */
  readonly remaining: number
  /** Epoch ms when the window resets. */
  readonly resetsAt: number
}

/** A single rate limit entry for a client. */
export interface RateLimitEntry {
  count: number
  windowStart: number
}

// ─── Preview Session ─────────────────────────────────────────

/** A preview session for a visitor. */
export interface PreviewSession {
  /** Unique session identifier. */
  readonly sessionId: string
  /** Site being previewed. */
  readonly siteId: string
  /** Token used for access. */
  readonly tokenId: string
  /** ISO 8601 start time. */
  readonly startedAt: string
  /** Pages viewed during session. */
  readonly pagesViewed: readonly string[]
}

// ─── Preview Result ──────────────────────────────────────────

/** Result of a preview request. */
export interface PreviewResult {
  readonly success: boolean
  readonly session?: PreviewSession
  readonly error?: string
}

/** Result of a token validation. */
export interface TokenValidationResult {
  readonly valid: boolean
  readonly error?: string
  readonly payload?: TokenPayload
}
