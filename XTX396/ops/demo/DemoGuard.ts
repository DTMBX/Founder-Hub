/**
 * B16-P2 — Public Demo Mode Hardening
 *
 * Enforces strict output bounding, rate limiting, and feature
 * restrictions for publicly accessible demo deployments.
 *
 * All limits are fail-closed: exceeding any bound rejects the
 * request rather than silently truncating.
 */

import { createHash } from 'crypto';
import type { Tenant } from '../tenancy/TenantModel';

// ── Types ───────────────────────────────────────────────────────

export interface DemoModeConfig {
  /** Maximum rows returned per query */
  maxRows: number;
  /** Maximum export file size in bytes */
  maxExportBytes: number;
  /** Maximum preview length in characters */
  maxPreviewChars: number;
  /** File uploads allowed */
  allowFileUpload: boolean;
  /** External API adapters enabled */
  allowExternalApis: boolean;
  /** Billing operations enabled */
  allowBilling: boolean;
  /** Messaging adapters enabled */
  allowMessaging: boolean;
}

export interface BoundCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface DemoAuditEvent {
  action: string;
  tenantId: string;
  timestamp: string;
  detail: string;
}

// ── Defaults ────────────────────────────────────────────────────

export const PUBLIC_DEMO_CONFIG: DemoModeConfig = {
  maxRows: 100,
  maxExportBytes: 5 * 1024 * 1024,    // 5 MB
  maxPreviewChars: 10_000,
  allowFileUpload: false,
  allowExternalApis: false,
  allowBilling: false,
  allowMessaging: false,
};

// ── Demo Guard ──────────────────────────────────────────────────

export class DemoGuard {
  private config: DemoModeConfig;
  private enabled: boolean;
  private auditLog: DemoAuditEvent[] = [];
  private ipRequestCounts: Map<string, { count: number; windowStart: number }> = new Map();

  constructor(config: DemoModeConfig = PUBLIC_DEMO_CONFIG, enabled = true) {
    this.config = { ...config };
    this.enabled = enabled;
  }

  /**
   * Check whether demo mode is currently active.
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if a row count is within bounds.
   */
  checkRowLimit(rowCount: number, tenantId: string): BoundCheckResult {
    if (!this.enabled) return { allowed: true };
    if (rowCount > this.config.maxRows) {
      this.logEvent(tenantId, 'row_limit_exceeded', `Requested ${rowCount}, max ${this.config.maxRows}`);
      return { allowed: false, reason: `Row limit exceeded: ${rowCount} > ${this.config.maxRows}` };
    }
    return { allowed: true };
  }

  /**
   * Check if an export file size is within bounds.
   */
  checkExportSize(sizeBytes: number, tenantId: string): BoundCheckResult {
    if (!this.enabled) return { allowed: true };
    if (sizeBytes > this.config.maxExportBytes) {
      this.logEvent(tenantId, 'export_size_exceeded', `Size ${sizeBytes}, max ${this.config.maxExportBytes}`);
      return { allowed: false, reason: `Export size exceeded: ${sizeBytes} > ${this.config.maxExportBytes}` };
    }
    return { allowed: true };
  }

  /**
   * Check if file upload is permitted.
   */
  checkFileUpload(tenantId: string): BoundCheckResult {
    if (!this.enabled) return { allowed: true };
    if (!this.config.allowFileUpload) {
      this.logEvent(tenantId, 'file_upload_blocked', 'File upload disabled in demo mode');
      return { allowed: false, reason: 'File upload is disabled in demo mode' };
    }
    return { allowed: true };
  }

  /**
   * Check if an external API call is permitted.
   */
  checkExternalApi(tenantId: string): BoundCheckResult {
    if (!this.enabled) return { allowed: true };
    if (!this.config.allowExternalApis) {
      this.logEvent(tenantId, 'external_api_blocked', 'External APIs disabled in demo mode');
      return { allowed: false, reason: 'External APIs are disabled in demo mode' };
    }
    return { allowed: true };
  }

  /**
   * Check if billing operations are permitted.
   */
  checkBilling(tenantId: string): BoundCheckResult {
    if (!this.enabled) return { allowed: true };
    if (!this.config.allowBilling) {
      this.logEvent(tenantId, 'billing_blocked', 'Billing disabled in demo mode');
      return { allowed: false, reason: 'Billing is disabled in demo mode' };
    }
    return { allowed: true };
  }

  /**
   * Check if messaging adapters are permitted.
   */
  checkMessaging(tenantId: string): BoundCheckResult {
    if (!this.enabled) return { allowed: true };
    if (!this.config.allowMessaging) {
      this.logEvent(tenantId, 'messaging_blocked', 'Messaging disabled in demo mode');
      return { allowed: false, reason: 'Messaging is disabled in demo mode' };
    }
    return { allowed: true };
  }

  /**
   * Truncate a preview string to the configured max length.
   */
  truncatePreview(text: string): string {
    if (!this.enabled) return text;
    if (text.length <= this.config.maxPreviewChars) return text;
    return text.slice(0, this.config.maxPreviewChars) + '… [truncated]';
  }

  /**
   * Per-IP rate limiting for demo mode.
   */
  checkIpRate(ip: string, limitPerMinute: number, tenantId: string): BoundCheckResult {
    if (!this.enabled) return { allowed: true };

    const now = Date.now();
    const windowMs = 60_000;
    let entry = this.ipRequestCounts.get(ip);

    if (!entry || now - entry.windowStart > windowMs) {
      entry = { count: 0, windowStart: now };
      this.ipRequestCounts.set(ip, entry);
    }

    entry.count++;

    if (entry.count > limitPerMinute) {
      this.logEvent(tenantId, 'ip_rate_limited', `IP ${ip} exceeded ${limitPerMinute} req/min`);
      return { allowed: false, reason: `IP rate limit exceeded for ${ip}` };
    }

    return { allowed: true };
  }

  /**
   * Get the audit log.
   */
  getAuditLog(): DemoAuditEvent[] {
    return [...this.auditLog];
  }

  /**
   * Get current config (read-only copy).
   */
  getConfig(): DemoModeConfig {
    return { ...this.config };
  }

  // ── Internal ────────────────────────────────────────────────

  private logEvent(tenantId: string, action: string, detail: string): void {
    this.auditLog.push({
      action,
      tenantId,
      timestamp: new Date().toISOString(),
      detail,
    });
  }

  _reset(): void {
    this.auditLog = [];
    this.ipRequestCounts.clear();
  }
}
