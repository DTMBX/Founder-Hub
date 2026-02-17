/**
 * Rate Limiter — Chain 5: Embedded Governed Terminal
 * 
 * Token bucket / sliding window rate limiting to prevent command flooding.
 * Security principle: Throttle abuse, log violations.
 */

import type {
  RateLimitConfig,
  RateLimitState,
  RateLimitResult,
} from './types';

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

/**
 * Default rate limit configuration
 * - 10 commands per 60 seconds
 * - 5 minute block on violation
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = Object.freeze({
  maxCommands: 10,
  windowMs: 60_000, // 1 minute
  blockDurationMs: 300_000, // 5 minutes
});

/**
 * Strict rate limit configuration (for production environments)
 */
export const STRICT_RATE_LIMIT_CONFIG: RateLimitConfig = Object.freeze({
  maxCommands: 5,
  windowMs: 60_000, // 1 minute
  blockDurationMs: 600_000, // 10 minutes
});

// =============================================================================
// RATE LIMITER CLASS
// =============================================================================

/**
 * Sliding window rate limiter with session tracking
 */
export class RateLimiter {
  private static instance: RateLimiter | null = null;
  private readonly config: RateLimitConfig;
  private readonly sessions: Map<string, RateLimitState>;
  private readonly violations: Map<string, number>;
  
  private constructor(config?: RateLimitConfig) {
    this.config = config ?? DEFAULT_RATE_LIMIT_CONFIG;
    this.sessions = new Map();
    this.violations = new Map();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(config?: RateLimitConfig): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter(config);
    }
    return RateLimiter.instance;
  }
  
  /**
   * Reset singleton (for testing)
   */
  public static reset(): void {
    RateLimiter.instance = null;
  }
  
  /**
   * Check if a session can execute a command
   */
  public check(sessionId: string): RateLimitResult {
    const now = Date.now();
    const state = this.getOrCreateState(sessionId);
    
    // Check if blocked
    if (state.blockedUntil && state.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetMs: state.blockedUntil - now,
        blockedUntilMs: state.blockedUntil,
      };
    }
    
    // Clear block if expired
    if (state.blockedUntil && state.blockedUntil <= now) {
      this.clearBlock(sessionId);
    }
    
    // Get commands in current window
    const windowStart = now - this.config.windowMs;
    const commandsInWindow = state.commands.filter(ts => ts > windowStart);
    
    // Check limit
    const remaining = Math.max(0, this.config.maxCommands - commandsInWindow.length);
    const oldestInWindow = commandsInWindow[0];
    const resetMs = oldestInWindow 
      ? (oldestInWindow + this.config.windowMs) - now 
      : 0;
    
    return {
      allowed: remaining > 0,
      remaining,
      resetMs: Math.max(0, resetMs),
    };
  }
  
  /**
   * Record a command execution
   */
  public record(sessionId: string): RateLimitResult {
    const now = Date.now();
    
    // Check first
    const checkResult = this.check(sessionId);
    
    if (!checkResult.allowed) {
      // Increment violation counter
      this.incrementViolation(sessionId);
      return checkResult;
    }
    
    // Record the command
    const state = this.getOrCreateState(sessionId);
    const windowStart = now - this.config.windowMs;
    
    // Clean old entries and add new one
    const updatedCommands = [
      ...state.commands.filter(ts => ts > windowStart),
      now,
    ];
    
    this.sessions.set(sessionId, {
      ...state,
      commands: updatedCommands,
    });
    
    // Check if we just hit the limit
    if (updatedCommands.length >= this.config.maxCommands) {
      return {
        allowed: true,
        remaining: 0,
        resetMs: this.config.windowMs,
      };
    }
    
    return {
      allowed: true,
      remaining: this.config.maxCommands - updatedCommands.length,
      resetMs: this.config.windowMs,
    };
  }
  
  /**
   * Block a session (manual block for abuse)
   */
  public block(sessionId: string, durationMs?: number): void {
    const now = Date.now();
    const duration = durationMs ?? this.config.blockDurationMs;
    const state = this.getOrCreateState(sessionId);
    
    this.sessions.set(sessionId, {
      ...state,
      blockedUntil: now + duration,
    });
  }
  
  /**
   * Unblock a session
   */
  public unblock(sessionId: string): void {
    this.clearBlock(sessionId);
  }
  
  /**
   * Check if a session is currently blocked
   */
  public isBlocked(sessionId: string): boolean {
    const state = this.sessions.get(sessionId);
    if (!state?.blockedUntil) return false;
    return state.blockedUntil > Date.now();
  }
  
  /**
   * Get remaining time until unblocked
   */
  public getBlockedRemaining(sessionId: string): number {
    const state = this.sessions.get(sessionId);
    if (!state?.blockedUntil) return 0;
    return Math.max(0, state.blockedUntil - Date.now());
  }
  
  /**
   * Get violation count for a session
   */
  public getViolationCount(sessionId: string): number {
    return this.violations.get(sessionId) ?? 0;
  }
  
  /**
   * Clear session state
   */
  public clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    this.violations.delete(sessionId);
  }
  
  /**
   * Get current configuration
   */
  public getConfig(): RateLimitConfig {
    return this.config;
  }
  
  /**
   * Get state for debugging
   */
  public getState(sessionId: string): RateLimitState | null {
    return this.sessions.get(sessionId) ?? null;
  }
  
  // ---------------------------------------------------------------------------
  // PRIVATE METHODS
  // ---------------------------------------------------------------------------
  
  private getOrCreateState(sessionId: string): RateLimitState {
    const existing = this.sessions.get(sessionId);
    
    if (existing) {
      return existing;
    }
    
    const newState: RateLimitState = {
      sessionId,
      commands: [],
      blockedUntil: null,
    };
    
    this.sessions.set(sessionId, newState);
    return newState;
  }
  
  private clearBlock(sessionId: string): void {
    const state = this.sessions.get(sessionId);
    if (!state) return;
    
    this.sessions.set(sessionId, {
      ...state,
      blockedUntil: null,
    });
  }
  
  private incrementViolation(sessionId: string): void {
    const current = this.violations.get(sessionId) ?? 0;
    this.violations.set(sessionId, current + 1);
    
    // Auto-block after 3 violations
    if (current + 1 >= 3) {
      this.block(sessionId);
    }
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Get the rate limiter instance
 */
export function getRateLimiter(config?: RateLimitConfig): RateLimiter {
  return RateLimiter.getInstance(config);
}

/**
 * Reset the rate limiter (for testing)
 */
export function resetRateLimiter(): void {
  RateLimiter.reset();
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check and record a command execution
 */
export function checkRateLimit(sessionId: string): RateLimitResult {
  return getRateLimiter().check(sessionId);
}

/**
 * Record a command and return updated rate limit status
 */
export function recordCommand(sessionId: string): RateLimitResult {
  return getRateLimiter().record(sessionId);
}

/**
 * Check if session is blocked
 */
export function isSessionBlocked(sessionId: string): boolean {
  return getRateLimiter().isBlocked(sessionId);
}

/**
 * Format rate limit result for display
 */
export function formatRateLimitMessage(result: RateLimitResult): string {
  if (!result.allowed) {
    const seconds = Math.ceil(result.resetMs / 1000);
    return `Rate limited. Try again in ${seconds}s.`;
  }
  
  if (result.remaining <= 2) {
    return `Warning: ${result.remaining} commands remaining in rate limit window.`;
  }
  
  return '';
}
