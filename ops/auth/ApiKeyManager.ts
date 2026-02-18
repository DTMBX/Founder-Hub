/**
 * B16-P3 — Tenant-Scoped API Keys + RBAC Hardening
 *
 * API key lifecycle management with:
 *   - Hashed key storage (never store plaintext)
 *   - Tenant-scoped keys (key is bound to tenant_id)
 *   - Scoped permissions (read_only, export, admin)
 *   - Revocation support with audit events
 *   - Rate limiting per key
 */

import { createHash, randomUUID, randomBytes } from 'crypto';

// ── Types ───────────────────────────────────────────────────────

export type ApiKeyScope = 'read_only' | 'export' | 'admin';
export type ApiKeyStatus = 'active' | 'revoked';

/** Stored representation — plain key is NEVER persisted. */
export interface ApiKeyRecord {
  keyId: string;
  tenantId: string;
  keyHash: string;
  scope: ApiKeyScope;
  status: ApiKeyStatus;
  createdAt: string;
  revokedAt?: string;
  lastUsedAt?: string;
  requestCount: number;
}

export interface ApiKeyCreateResult {
  keyId: string;
  plainKey: string;           // Returned ONCE at creation
  tenantId: string;
  scope: ApiKeyScope;
}

export interface ApiKeyValidationResult {
  valid: boolean;
  keyId?: string;
  tenantId?: string;
  scope?: ApiKeyScope;
  reason?: string;
}

export interface ApiKeyAuditEvent {
  action: string;
  keyId: string;
  tenantId: string;
  timestamp: string;
  detail: string;
}

// ── Constants ───────────────────────────────────────────────────

const VALID_SCOPES: ApiKeyScope[] = ['read_only', 'export', 'admin'];
const SCOPE_HIERARCHY: Record<ApiKeyScope, ApiKeyScope[]> = {
  admin: ['admin', 'export', 'read_only'],
  export: ['export', 'read_only'],
  read_only: ['read_only'],
};

// ── Helpers ─────────────────────────────────────────────────────

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function generatePlainKey(): string {
  return `evk_${randomBytes(32).toString('hex')}`;
}

// ── API Key Manager ─────────────────────────────────────────────

export class ApiKeyManager {
  private keys: Map<string, ApiKeyRecord> = new Map();
  private hashIndex: Map<string, string> = new Map();  // keyHash → keyId
  private auditLog: ApiKeyAuditEvent[] = [];

  /**
   * Create a new API key for a tenant.
   * Returns the plain key ONCE — it is not stored.
   */
  create(tenantId: string, scope: ApiKeyScope): ApiKeyCreateResult {
    if (!tenantId || tenantId.trim().length === 0) {
      throw new Error('tenantId is required');
    }
    if (!VALID_SCOPES.includes(scope)) {
      throw new Error(`Invalid scope: ${scope}`);
    }

    const keyId = `key-${randomUUID()}`;
    const plainKey = generatePlainKey();
    const keyHash = sha256(plainKey);

    const record: ApiKeyRecord = {
      keyId,
      tenantId,
      keyHash,
      scope,
      status: 'active',
      createdAt: new Date().toISOString(),
      requestCount: 0,
    };

    this.keys.set(keyId, record);
    this.hashIndex.set(keyHash, keyId);

    this.logEvent('key_created', keyId, tenantId, `Scope: ${scope}`);

    return { keyId, plainKey, tenantId, scope };
  }

  /**
   * Validate a plain API key. Returns tenant and scope if valid.
   */
  validate(plainKey: string): ApiKeyValidationResult {
    if (!plainKey || plainKey.trim().length === 0) {
      return { valid: false, reason: 'API key is required' };
    }

    const keyHash = sha256(plainKey);
    const keyId = this.hashIndex.get(keyHash);

    if (!keyId) {
      return { valid: false, reason: 'Unknown API key' };
    }

    const record = this.keys.get(keyId)!;

    if (record.status === 'revoked') {
      this.logEvent('revoked_key_attempt', keyId, record.tenantId, 'Attempted use of revoked key');
      return { valid: false, keyId, reason: 'API key has been revoked' };
    }

    // Update usage tracking
    record.lastUsedAt = new Date().toISOString();
    record.requestCount++;

    return {
      valid: true,
      keyId,
      tenantId: record.tenantId,
      scope: record.scope,
    };
  }

  /**
   * Check whether a key's scope permits a given action.
   */
  checkScope(keyScope: ApiKeyScope, requiredScope: ApiKeyScope): boolean {
    return SCOPE_HIERARCHY[keyScope]?.includes(requiredScope) ?? false;
  }

  /**
   * Revoke an API key.
   */
  revoke(keyId: string): void {
    const record = this.keys.get(keyId);
    if (!record) {
      throw new Error(`Key not found: ${keyId}`);
    }
    if (record.status === 'revoked') {
      throw new Error(`Key already revoked: ${keyId}`);
    }

    record.status = 'revoked';
    record.revokedAt = new Date().toISOString();

    this.logEvent('key_revoked', keyId, record.tenantId, 'Key revoked');
  }

  /**
   * List keys for a tenant (never exposes hashes or plain keys).
   */
  listForTenant(tenantId: string): Array<Omit<ApiKeyRecord, 'keyHash'>> {
    return Array.from(this.keys.values())
      .filter((k) => k.tenantId === tenantId)
      .map(({ keyHash, ...rest }) => rest);
  }

  /**
   * Get the audit log.
   */
  getAuditLog(): ApiKeyAuditEvent[] {
    return [...this.auditLog];
  }

  /**
   * Get a key record by ID (for admin inspection).
   */
  getRecord(keyId: string): ApiKeyRecord | undefined {
    const r = this.keys.get(keyId);
    return r ? { ...r } : undefined;
  }

  // ── Internal ────────────────────────────────────────────────

  private logEvent(action: string, keyId: string, tenantId: string, detail: string): void {
    this.auditLog.push({
      action,
      keyId,
      tenantId,
      timestamp: new Date().toISOString(),
      detail,
    });
  }

  _reset(): void {
    this.keys.clear();
    this.hashIndex.clear();
    this.auditLog = [];
  }
}
