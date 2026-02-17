// B11 – Operations + Growth Automation Layer
// B11-04 — CRM Adapter Interface & Implementations
// B11.1 — Hardened: SafeMode SSOT, centralized egress, PII redaction, correlation IDs

import type { Lead } from '../leads/LeadModel';
import { getOpsAuditLogger } from '../audit/OpsAuditLogger';
import { SafeMode } from '../../core/SafeMode';
import { validateEgressUrl, safeFetch } from '../../security/egress/DomainAllowlist';
import { redactForAudit } from '../../security/pii/redact';
import { currentCorrelationId } from '../../core/correlation';

// ─── CRM Record ──────────────────────────────────────────────────

export interface CrmContact {
  /** CRM-specific identifier. */
  externalId: string;
  /** Local lead ID (if linked). */
  leadId: string;
  /** Display name. */
  name: string;
  /** Contact email. */
  email?: string;
  /** Contact phone. */
  phone?: string;
  /** CRM-side status or stage. */
  stage: string;
  /** Last sync timestamp (ISO 8601). */
  lastSyncedAt: string;
  /** Raw CRM payload for reference. */
  raw?: Record<string, unknown>;
}

export type CrmSyncDirection = 'outbound' | 'inbound';

export interface CrmSyncResult {
  success: boolean;
  direction: CrmSyncDirection;
  contactId: string;
  error?: string;
}

// ─── Adapter Interface ───────────────────────────────────────────

export interface ICrmAdapter {
  /** Human-readable adapter name. */
  readonly name: string;
  /** Push a lead to the CRM. */
  pushLead(lead: Lead): Promise<CrmSyncResult>;
  /** Pull a contact from the CRM by external ID. */
  pullContact(externalId: string): Promise<CrmContact | null>;
  /** List all synced contacts. */
  listContacts(): Promise<CrmContact[]>;
  /** Health check — returns true if the adapter can reach its target. */
  healthCheck(): Promise<boolean>;
}

// ─── LocalJsonCrmAdapter (default, no external dependency) ───────

export class LocalJsonCrmAdapter implements ICrmAdapter {
  readonly name = 'local-json';
  private store = new Map<string, CrmContact>();

  async pushLead(lead: Lead): Promise<CrmSyncResult> {
    const contact: CrmContact = {
      externalId: `local-${lead.id}`,
      leadId: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      stage: lead.status,
      lastSyncedAt: new Date().toISOString(),
    };

    this.store.set(contact.externalId, contact);

    await getOpsAuditLogger().log({
      category: 'crm.sync_outbound',
      severity: 'info',
      actor: 'system',
      description: `Lead synced to local CRM: ${lead.name}`,
      payload: { leadId: lead.id, externalId: contact.externalId, adapter: this.name },
    });

    return { success: true, direction: 'outbound', contactId: contact.externalId };
  }

  async pullContact(externalId: string): Promise<CrmContact | null> {
    const contact = this.store.get(externalId);
    if (contact) {
      await getOpsAuditLogger().log({
        category: 'crm.sync_inbound',
        severity: 'info',
        actor: 'system',
        description: `Contact pulled from local CRM: ${contact.name}`,
        payload: { externalId, adapter: this.name },
      });
    }
    return contact ? { ...contact } : null;
  }

  async listContacts(): Promise<CrmContact[]> {
    return Array.from(this.store.values()).map((c) => ({ ...c }));
  }

  async healthCheck(): Promise<boolean> {
    return true; // always healthy — local store
  }
}

// ─── WebhookCrmAdapter ──────────────────────────────────────────

export interface WebhookCrmConfig {
  /** Outbound webhook URL. */
  endpoint: string;
  /** Authorization header value (e.g., Bearer token). */
  authHeader?: string;
  /** Request timeout in milliseconds. */
  timeoutMs?: number;
}

/**
 * B11.1 — Domain validation now delegated to centralized DomainAllowlist (D1).
 * Legacy per-adapter allowlist removed. Use addAllowedEgressDomain() from
 * ops/security/egress/DomainAllowlist.ts instead.
 */

export class WebhookCrmAdapter implements ICrmAdapter {
  readonly name = 'webhook';
  private config: WebhookCrmConfig;

  constructor(config: WebhookCrmConfig) {
    this.config = config;
  }

  async pushLead(lead: Lead): Promise<CrmSyncResult> {
    const correlationId = currentCorrelationId();

    // B11.1 — Safe Mode enforced via SSOT (D2)
    if (!SafeMode.isExternalAllowed()) {
      await getOpsAuditLogger().log({
        category: 'crm.sync_outbound',
        severity: 'info',
        actor: 'system',
        description: `CRM push blocked (safe mode): ${lead.name}`,
        payload: redactForAudit({ leadId: lead.id, adapter: this.name, blocked: true, correlationId }),
      });
      return {
        success: true,
        direction: 'outbound',
        contactId: `safe-${lead.id}`,
      };
    }

    // B11.1 — Centralized egress validation (D1) replaces per-adapter allowlist
    const egressResult = validateEgressUrl(this.config.endpoint);
    if (!egressResult.allowed) {
      await getOpsAuditLogger().log({
        category: 'crm.sync_outbound',
        severity: 'warn',
        actor: 'system',
        description: `CRM push blocked (egress): ${egressResult.reason}`,
        payload: redactForAudit({ leadId: lead.id, adapter: this.name, reason: egressResult.reason, correlationId }),
      });
      return {
        success: false,
        direction: 'outbound',
        contactId: '',
        error: `Egress blocked: ${egressResult.reason}`,
      };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        this.config.timeoutMs ?? 10_000,
      );

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.config.authHeader) {
        headers['Authorization'] = this.config.authHeader;
      }

      // B11.1 — safeFetch validates redirects against egress allowlist (D1)
      // B11.1 — PII redacted from outbound webhook payload (D5)
      const response = await safeFetch(this.config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(redactForAudit({
          leadId: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          status: lead.status,
          source: lead.source,
          tags: lead.tags,
          createdAt: lead.createdAt,
        })),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const externalId = `webhook-${lead.id}`;

      await getOpsAuditLogger().log({
        category: 'crm.sync_outbound',
        severity: response.ok ? 'info' : 'warn',
        actor: 'system',
        description: `CRM webhook ${response.ok ? 'sent' : 'failed'}: ${lead.name} (HTTP ${response.status})`,
        payload: {
          leadId: lead.id, adapter: this.name,
          httpStatus: response.status, externalId,
        },
      });

      return {
        success: response.ok,
        direction: 'outbound',
        contactId: externalId,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';

      await getOpsAuditLogger().log({
        category: 'crm.sync_outbound',
        severity: 'error',
        actor: 'system',
        description: `CRM webhook error: ${message}`,
        payload: { leadId: lead.id, adapter: this.name, error: message },
      });

      return {
        success: false,
        direction: 'outbound',
        contactId: '',
        error: message,
      };
    }
  }

  async pullContact(_externalId: string): Promise<CrmContact | null> {
    // Webhook adapter is push-only by design
    return null;
  }

  async listContacts(): Promise<CrmContact[]> {
    // Webhook adapter does not maintain local contact state
    return [];
  }

  async healthCheck(): Promise<boolean> {
    if (!SafeMode.isExternalAllowed()) return true; // assume healthy in safe mode
    if (!validateEgressUrl(this.config.endpoint).allowed) return false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5_000);
      const response = await fetch(this.config.endpoint, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ─── Adapter Factory ─────────────────────────────────────────────

let _adapter: ICrmAdapter | null = null;

/** Get the active CRM adapter (defaults to LocalJsonCrmAdapter). */
export function getCrmAdapter(): ICrmAdapter {
  if (!_adapter) {
    _adapter = new LocalJsonCrmAdapter();
  }
  return _adapter;
}

/** Replace the active CRM adapter. */
export function setCrmAdapter(adapter: ICrmAdapter): void {
  getOpsAuditLogger().log({
    category: 'crm.adapter_switched',
    severity: 'warn',
    actor: 'system',
    description: `CRM adapter switched to: ${adapter.name}`,
    payload: { newAdapter: adapter.name, previousAdapter: _adapter?.name ?? 'none' },
  });
  _adapter = adapter;
}

/** Reset to default adapter (for testing). */
export function resetCrmAdapter(): void {
  _adapter = null;
}
