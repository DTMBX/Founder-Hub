/**
 * B16-P5 — WAF-Like Abuse Protection Layer
 *
 * Adaptive rate limiter with:
 *   - Per-IP request tracking with sliding windows
 *   - IP anomaly detection (burst detection)
 *   - Search throttling
 *   - Exponential backoff calculation
 *   - Soft ban capability with automatic expiry
 *
 * All decisions are deterministic, auditable, and fail-closed.
 */

import { createHash } from 'crypto';

// ── Types ───────────────────────────────────────────────────────

export type AbuseAction = 'allowed' | 'throttled' | 'blocked' | 'banned';

export interface AbuseCheckResult {
  action: AbuseAction;
  ip: string;
  reason?: string;
  retryAfterMs?: number;
}

export interface AbuseEvent {
  eventId: string;
  ip: string;
  action: AbuseAction;
  timestamp: string;
  detail: string;
}

export interface SoftBan {
  ip: string;
  bannedAt: number;
  expiresAt: number;
  reason: string;
}

export interface AbuseProtectionConfig {
  /** Max requests per IP per window */
  maxRequestsPerWindow: number;
  /** Window duration in ms */
  windowMs: number;
  /** Burst threshold: max requests in burstWindowMs */
  burstThreshold: number;
  /** Burst detection window in ms */
  burstWindowMs: number;
  /** Soft ban duration in ms */
  softBanDurationMs: number;
  /** Base backoff in ms for exponential backoff */
  baseBackoffMs: number;
  /** Max backoff in ms */
  maxBackoffMs: number;
}

// ── Defaults ────────────────────────────────────────────────────

export const DEFAULT_ABUSE_CONFIG: AbuseProtectionConfig = {
  maxRequestsPerWindow: 60,
  windowMs: 60_000,
  burstThreshold: 15,
  burstWindowMs: 5_000,
  softBanDurationMs: 10 * 60 * 1000,  // 10 minutes
  baseBackoffMs: 1_000,
  maxBackoffMs: 60_000,
};

// ── Abuse Protection Service ────────────────────────────────────

export class AbuseProtection {
  private config: AbuseProtectionConfig;
  private requestLog: Map<string, number[]> = new Map();
  private violationCounts: Map<string, number> = new Map();
  private softBans: Map<string, SoftBan> = new Map();
  private auditLog: AbuseEvent[] = [];

  constructor(config: AbuseProtectionConfig = DEFAULT_ABUSE_CONFIG) {
    this.config = { ...config };
  }

  /**
   * Check whether a request from an IP should be allowed.
   * Returns the action to take and optional retry delay.
   */
  check(ip: string): AbuseCheckResult {
    if (!ip || ip.trim().length === 0) {
      return { action: 'blocked', ip: '', reason: 'IP address is required' };
    }

    // Check soft ban first
    const ban = this.softBans.get(ip);
    if (ban) {
      const now = Date.now();
      if (now < ban.expiresAt) {
        this.logEvent(ip, 'banned', `Soft ban active until ${new Date(ban.expiresAt).toISOString()}`);
        return {
          action: 'banned',
          ip,
          reason: 'IP is temporarily banned',
          retryAfterMs: ban.expiresAt - now,
        };
      }
      // Ban expired — remove it
      this.softBans.delete(ip);
    }

    const now = Date.now();
    const timestamps = this.getTimestamps(ip);
    timestamps.push(now);

    // Clean old entries outside the main window
    const windowStart = now - this.config.windowMs;
    const recent = timestamps.filter((t) => t > windowStart);
    this.requestLog.set(ip, recent);

    // Check burst (short window)
    const burstWindowStart = now - this.config.burstWindowMs;
    const burstCount = recent.filter((t) => t > burstWindowStart).length;

    if (burstCount > this.config.burstThreshold) {
      this.recordViolation(ip);
      const violations = this.violationCounts.get(ip) ?? 0;

      // Auto soft-ban after 3 violations
      if (violations >= 3) {
        this.softBan(ip, 'Repeated burst violations');
        return { action: 'banned', ip, reason: 'Repeated burst violations' };
      }

      const backoff = this.calculateBackoff(violations);
      this.logEvent(ip, 'throttled', `Burst detected: ${burstCount} in ${this.config.burstWindowMs}ms`);
      return {
        action: 'throttled',
        ip,
        reason: 'Request burst detected',
        retryAfterMs: backoff,
      };
    }

    // Check window rate limit
    if (recent.length > this.config.maxRequestsPerWindow) {
      this.recordViolation(ip);
      const violations = this.violationCounts.get(ip) ?? 0;
      const backoff = this.calculateBackoff(violations);

      this.logEvent(ip, 'blocked', `Rate limit exceeded: ${recent.length}/${this.config.maxRequestsPerWindow}`);
      return {
        action: 'blocked',
        ip,
        reason: 'Rate limit exceeded',
        retryAfterMs: backoff,
      };
    }

    return { action: 'allowed', ip };
  }

  /**
   * Manually soft-ban an IP.
   */
  softBan(ip: string, reason: string): SoftBan {
    const now = Date.now();
    const ban: SoftBan = {
      ip,
      bannedAt: now,
      expiresAt: now + this.config.softBanDurationMs,
      reason,
    };
    this.softBans.set(ip, ban);
    this.logEvent(ip, 'banned', reason);
    return ban;
  }

  /**
   * Remove a soft ban.
   */
  removeBan(ip: string): boolean {
    return this.softBans.delete(ip);
  }

  /**
   * Check if an IP is currently banned.
   */
  isBanned(ip: string): boolean {
    const ban = this.softBans.get(ip);
    if (!ban) return false;
    if (Date.now() >= ban.expiresAt) {
      this.softBans.delete(ip);
      return false;
    }
    return true;
  }

  /**
   * Get the audit log.
   */
  getAuditLog(): AbuseEvent[] {
    return [...this.auditLog];
  }

  /**
   * Calculate exponential backoff for a given violation count.
   */
  calculateBackoff(violations: number): number {
    const backoff = this.config.baseBackoffMs * Math.pow(2, violations);
    return Math.min(backoff, this.config.maxBackoffMs);
  }

  // ── Internal ────────────────────────────────────────────────

  private getTimestamps(ip: string): number[] {
    return this.requestLog.get(ip) ?? [];
  }

  private recordViolation(ip: string): void {
    const count = (this.violationCounts.get(ip) ?? 0) + 1;
    this.violationCounts.set(ip, count);
  }

  private logEvent(ip: string, action: AbuseAction, detail: string): void {
    this.auditLog.push({
      eventId: `ABE-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      ip,
      action,
      timestamp: new Date().toISOString(),
      detail,
    });
  }

  _reset(): void {
    this.requestLog.clear();
    this.violationCounts.clear();
    this.softBans.clear();
    this.auditLog = [];
  }
}
