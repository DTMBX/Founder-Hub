/**
 * ops/publish/safety/PublishRateLimiter.ts
 *
 * Token-bucket rate limiter for publish operations.
 * Deterministic, no external dependencies.
 * Fail-closed: if state is unclear, deny.
 */

/** Rate limiter configuration. */
export interface RateLimiterConfig {
  /** Maximum tokens (burst capacity). */
  readonly maxTokens: number
  /** Tokens restored per interval. */
  readonly refillRate: number
  /** Refill interval in milliseconds. */
  readonly refillIntervalMs: number
}

/** Default: 5 publishes per 60s, burst of 5. */
export const DEFAULT_RATE_CONFIG: RateLimiterConfig = {
  maxTokens: 5,
  refillRate: 1,
  refillIntervalMs: 60_000,
}

/** Per-key bucket state. */
interface Bucket {
  tokens: number
  lastRefill: number
}

/** Rate limiter check result. */
export interface RateLimitResult {
  readonly allowed: boolean
  readonly remaining: number
  readonly retryAfterMs: number | null
}

/**
 * Token-bucket rate limiter keyed by arbitrary string (tenantId, actorId, etc.).
 */
export class PublishRateLimiter {
  private readonly _config: RateLimiterConfig
  private readonly _buckets: Map<string, Bucket> = new Map()
  private _now: () => number

  constructor(config: Partial<RateLimiterConfig> = {}, nowFn?: () => number) {
    this._config = { ...DEFAULT_RATE_CONFIG, ...config }
    this._now = nowFn ?? (() => Date.now())
  }

  /**
   * Check + consume a token for the given key.
   * Returns whether the request is allowed.
   */
  consume(key: string): RateLimitResult {
    if (!key) return { allowed: false, remaining: 0, retryAfterMs: null }

    const now = this._now()
    const bucket = this._getOrCreateBucket(key, now)
    this._refill(bucket, now)

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        retryAfterMs: null,
      }
    }

    // Denied — compute when next token available
    const elapsed = now - bucket.lastRefill
    const msUntilNext = Math.max(0, this._config.refillIntervalMs - elapsed)
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: msUntilNext,
    }
  }

  /**
   * Peek at remaining tokens without consuming.
   */
  peek(key: string): number {
    if (!key) return 0
    const now = this._now()
    const bucket = this._buckets.get(key)
    if (!bucket) return this._config.maxTokens
    const elapsed = now - bucket.lastRefill
    const refills = Math.floor(elapsed / this._config.refillIntervalMs)
    return Math.min(this._config.maxTokens, bucket.tokens + refills * this._config.refillRate)
  }

  /**
   * Reset a specific key's bucket. For admin use.
   */
  reset(key: string): void {
    this._buckets.delete(key)
  }

  /**
   * Reset all buckets.
   */
  resetAll(): void {
    this._buckets.clear()
  }

  /** Override time function (for testing). */
  setNow(fn: () => number): void {
    this._now = fn
  }

  get bucketCount(): number {
    return this._buckets.size
  }

  private _getOrCreateBucket(key: string, now: number): Bucket {
    let bucket = this._buckets.get(key)
    if (!bucket) {
      bucket = { tokens: this._config.maxTokens, lastRefill: now }
      this._buckets.set(key, bucket)
    }
    return bucket
  }

  private _refill(bucket: Bucket, now: number): void {
    const elapsed = now - bucket.lastRefill
    if (elapsed >= this._config.refillIntervalMs) {
      const intervals = Math.floor(elapsed / this._config.refillIntervalMs)
      bucket.tokens = Math.min(
        this._config.maxTokens,
        bucket.tokens + intervals * this._config.refillRate,
      )
      bucket.lastRefill += intervals * this._config.refillIntervalMs
    }
  }
}
