/**
 * Visitor Preview Panel — Preview Service
 *
 * Orchestrates preview access: token validation → rate limiting → session creation.
 *
 * The preview service is the public API for preview access.
 * It coordinates token.ts and rate-limit.ts into a single flow.
 *
 * Invariants:
 * - Invalid tokens are rejected before rate limiting.
 * - Rate-limited requests are rejected before session creation.
 * - Sessions are read-only after creation (append-only page views).
 * - All operations are deterministic given the same inputs.
 */

import type {
  PreviewToken,
  PreviewResult,
  PreviewSession,
} from './types'
import { verifyToken } from './token'
import { RateLimiter } from './rate-limit'
import type { StoredSite } from '../pipeline/types'
import type { StorageAdapter } from '../pipeline/store'

// ─── Preview Service ─────────────────────────────────────────

/**
 * Configuration for the preview service.
 */
export interface PreviewServiceConfig {
  /** HMAC signing secret for token verification. */
  readonly secret: string
  /** Maximum preview requests per window. */
  readonly maxRequests?: number
  /** Rate limit window in ms. */
  readonly windowMs?: number
}

/**
 * Preview service — manages token verification, rate limiting, and session tracking.
 */
export class PreviewService {
  private readonly _secret: string
  private readonly _rateLimiter: RateLimiter
  private readonly _sessions = new Map<string, PreviewSession>()
  private _sessionCounter = 0

  constructor(config: PreviewServiceConfig) {
    this._secret = config.secret
    this._rateLimiter = new RateLimiter({
      maxRequests: config.maxRequests ?? 60,
      windowMs: config.windowMs ?? 60_000,
    })
  }

  /**
   * Initiates a preview session from a token.
   *
   * Flow: verify token → check rate limit → check site exists → create session.
   *
   * @param token - Preview token to validate
   * @param storage - Storage adapter to check site existence
   * @param now - Current time override (for testing)
   */
  async startPreview(
    token: PreviewToken,
    storage: StorageAdapter,
    now?: Date,
  ): Promise<PreviewResult> {
    // Step 1: Verify token
    const verification = await verifyToken(token, this._secret, now)
    if (!verification.valid) {
      return { success: false, error: verification.error }
    }

    // Step 2: Rate limit check (by token ID)
    const rateResult = this._rateLimiter.check(
      token.tokenId,
      now ? now.getTime() : undefined,
    )
    if (!rateResult.allowed) {
      return { success: false, error: 'Rate limit exceeded' }
    }

    // Step 3: Check site exists
    const site = await storage.get(token.siteId)
    if (!site) {
      return { success: false, error: 'Site not found' }
    }

    // Step 4: Create session
    this._sessionCounter += 1
    const sessionId = `ps_${token.siteId}_${this._sessionCounter}`
    const session: PreviewSession = {
      sessionId,
      siteId: token.siteId,
      tokenId: token.tokenId,
      startedAt: (now ?? new Date()).toISOString(),
      pagesViewed: [],
    }

    this._sessions.set(sessionId, session)

    return { success: true, session }
  }

  /**
   * Records a page view in an existing session.
   *
   * @param sessionId - Session to update
   * @param pageSlug - Page slug visited
   */
  recordPageView(sessionId: string, pageSlug: string): boolean {
    const session = this._sessions.get(sessionId)
    if (!session) return false

    // Append page view (immutable array replaced)
    const updated: PreviewSession = {
      ...session,
      pagesViewed: [...session.pagesViewed, pageSlug],
    }
    this._sessions.set(sessionId, updated)
    return true
  }

  /**
   * Retrieves a session by ID.
   */
  getSession(sessionId: string): PreviewSession | null {
    return this._sessions.get(sessionId) ?? null
  }

  /**
   * Returns count of active sessions.
   */
  get sessionCount(): number {
    return this._sessions.size
  }

  /**
   * Returns the underlying rate limiter (for testing).
   */
  get rateLimiter(): RateLimiter {
    return this._rateLimiter
  }
}
