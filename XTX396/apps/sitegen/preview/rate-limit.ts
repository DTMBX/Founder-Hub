/**
 * Visitor Preview Panel — Rate Limiter
 *
 * In-memory fixed-window rate limiter for preview requests.
 * Prevents abuse of preview share links.
 *
 * Invariants:
 * - Requests within window and under limit are allowed.
 * - Requests exceeding the limit are denied.
 * - Windows reset automatically after expiration.
 * - Each client (identified by key) has independent limits.
 */

import type { RateLimitConfig, RateLimitResult, RateLimitEntry } from './types'

// ─── Defaults ────────────────────────────────────────────────

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000, // 1 minute
}

// ─── Rate Limiter ────────────────────────────────────────────

/**
 * Fixed-window rate limiter.
 *
 * Usage:
 *   const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 })
 *   const result = limiter.check('client-ip-or-token')
 */
export class RateLimiter {
  private readonly _config: RateLimitConfig
  private readonly _entries = new Map<string, RateLimitEntry>()

  constructor(config?: Partial<RateLimitConfig>) {
    this._config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Checks whether a request from the given client key is allowed.
   *
   * @param clientKey - Unique identifier (IP, token ID, etc.)
   * @param now - Current epoch ms (for testing)
   * @returns RateLimitResult
   */
  check(clientKey: string, now?: number): RateLimitResult {
    const currentMs = now ?? Date.now()
    const entry = this._entries.get(clientKey)

    // No existing entry — start fresh window
    if (!entry) {
      this._entries.set(clientKey, { count: 1, windowStart: currentMs })
      return {
        allowed: true,
        remaining: this._config.maxRequests - 1,
        resetsAt: currentMs + this._config.windowMs,
      }
    }

    // Window expired — reset
    if (currentMs >= entry.windowStart + this._config.windowMs) {
      entry.count = 1
      entry.windowStart = currentMs
      return {
        allowed: true,
        remaining: this._config.maxRequests - 1,
        resetsAt: currentMs + this._config.windowMs,
      }
    }

    // Within window — check limit
    entry.count += 1
    const remaining = Math.max(0, this._config.maxRequests - entry.count)
    const resetsAt = entry.windowStart + this._config.windowMs

    if (entry.count > this._config.maxRequests) {
      return { allowed: false, remaining: 0, resetsAt }
    }

    return { allowed: true, remaining, resetsAt }
  }

  /**
   * Resets all rate limit entries.
   * For testing only.
   */
  reset(): void {
    this._entries.clear()
  }

  /**
   * Returns the number of tracked clients.
   */
  get size(): number {
    return this._entries.size
  }
}
