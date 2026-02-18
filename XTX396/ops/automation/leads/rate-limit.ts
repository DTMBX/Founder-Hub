// B11 – Operations + Growth Automation Layer
// B11-03 — Lead capture rate limiting

export interface RateLimitConfig {
  /** Maximum requests within the window. */
  maxRequests: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60_000, // 1 minute
};

interface RateLimitEntry {
  timestamps: number[];
}

/**
 * Simple in-memory rate limiter keyed by client identifier (IP, token, etc.).
 * Not designed for distributed use — suitable for single-process deployments.
 */
export class LeadRateLimiter {
  private entries = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config?: Partial<RateLimitConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check whether a request from the given key is allowed.
   * Returns { allowed: true } or { allowed: false, retryAfterMs }.
   */
  check(key: string): { allowed: true } | { allowed: false; retryAfterMs: number } {
    const now = Date.now();
    const cutoff = now - this.config.windowMs;

    let entry = this.entries.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.entries.set(key, entry);
    }

    // Prune expired timestamps
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

    if (entry.timestamps.length >= this.config.maxRequests) {
      const oldest = entry.timestamps[0];
      const retryAfterMs = oldest + this.config.windowMs - now;
      return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 0) };
    }

    entry.timestamps.push(now);
    return { allowed: true };
  }

  /** Reset all rate limit state (for testing). */
  reset(): void {
    this.entries.clear();
  }
}

// ─── Singleton ───────────────────────────────────────────────────

let _limiter: LeadRateLimiter | null = null;

export function getLeadRateLimiter(): LeadRateLimiter {
  if (!_limiter) {
    _limiter = new LeadRateLimiter();
  }
  return _limiter;
}

export function resetLeadRateLimiter(): void {
  _limiter = null;
}
