// B11 – Operations + Growth Automation Layer
// B11-06 — Messaging Adapters (email + SMS, pluggable, mock-default)
// B11.1 — Hardened: SafeMode SSOT, egress validation, PII redaction

import { getOpsAuditLogger } from '../audit/OpsAuditLogger';
import { SafeMode } from '../../core/SafeMode';
import { validateEgressUrl, safeFetch } from '../../security/egress/DomainAllowlist';
import { redactForAudit } from '../../security/pii/redact';
import { currentCorrelationId } from '../../core/correlation';

// ─── Message Types ───────────────────────────────────────────────

export type MessageChannel = 'email' | 'sms';

export interface OutboundMessage {
  /** Unique message ID. */
  id: string;
  /** Channel. */
  channel: MessageChannel;
  /** Recipient address (email or phone). */
  to: string;
  /** Subject (email only). */
  subject?: string;
  /** Message body (plain text). */
  body: string;
  /** Associated lead ID. */
  leadId?: string;
  /** ISO 8601 — when the message was created. */
  createdAt: string;
  /** Current status. */
  status: 'draft' | 'queued' | 'sent' | 'failed' | 'blocked';
  /** Error detail if failed/blocked. */
  error?: string;
}

export interface SendResult {
  success: boolean;
  messageId: string;
  error?: string;
}

// ─── Adapter Interface ───────────────────────────────────────────

export interface IMessageAdapter {
  readonly name: string;
  readonly channel: MessageChannel;
  send(message: OutboundMessage, safeMode: boolean): Promise<SendResult>;
  healthCheck(): Promise<boolean>;
}

// ─── Recipient Allowlist ─────────────────────────────────────────

const EMAIL_ALLOWLIST: Set<string> = new Set();
const PHONE_ALLOWLIST: Set<string> = new Set();

export function addAllowedEmail(email: string): void {
  EMAIL_ALLOWLIST.add(email.toLowerCase());
}
export function removeAllowedEmail(email: string): void {
  EMAIL_ALLOWLIST.delete(email.toLowerCase());
}
export function getAllowedEmails(): string[] {
  return Array.from(EMAIL_ALLOWLIST);
}

export function addAllowedPhone(phone: string): void {
  PHONE_ALLOWLIST.add(phone.replace(/\s/g, ''));
}
export function removeAllowedPhone(phone: string): void {
  PHONE_ALLOWLIST.delete(phone.replace(/\s/g, ''));
}
export function getAllowedPhones(): string[] {
  return Array.from(PHONE_ALLOWLIST);
}

function isRecipientAllowed(channel: MessageChannel, to: string): boolean {
  if (channel === 'email') {
    return EMAIL_ALLOWLIST.size === 0 || EMAIL_ALLOWLIST.has(to.toLowerCase());
  }
  return PHONE_ALLOWLIST.size === 0 || PHONE_ALLOWLIST.has(to.replace(/\s/g, ''));
}

// ─── Mock Email Adapter ──────────────────────────────────────────

export class MockEmailAdapter implements IMessageAdapter {
  readonly name = 'mock-email';
  readonly channel: MessageChannel = 'email';
  readonly sentMessages: OutboundMessage[] = [];

  async send(message: OutboundMessage, safeMode: boolean): Promise<SendResult> {
    // B11.1 — Safe Mode enforced via SSOT (D2), parameter kept for interface compat
    if (safeMode || !SafeMode.isExternalAllowed()) {
      await getOpsAuditLogger().log({
        category: 'message.send_blocked',
        severity: 'info',
        actor: 'system',
        description: `Email blocked (safe mode): ${message.to}`,
        payload: redactForAudit({ messageId: message.id, to: message.to, channel: 'email' }),
      });
      return { success: true, messageId: message.id, error: 'Blocked by safe mode.' };
    }

    if (!isRecipientAllowed('email', message.to)) {
      await getOpsAuditLogger().log({
        category: 'message.send_blocked',
        severity: 'warn',
        actor: 'system',
        description: `Email blocked (recipient not in allowlist): ${message.to}`,
        payload: { messageId: message.id, to: message.to },
      });
      return { success: false, messageId: message.id, error: 'Recipient not in allowlist.' };
    }

    // Mock: record the send
    this.sentMessages.push({ ...message, status: 'sent' });

    await getOpsAuditLogger().log({
      category: 'message.email_sent',
      severity: 'info',
      actor: 'system',
      description: `Mock email sent to ${message.to}`,
      payload: { messageId: message.id, to: message.to, subject: message.subject },
    });

    return { success: true, messageId: message.id };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

// ─── Mock SMS Adapter ────────────────────────────────────────────

export class MockSmsAdapter implements IMessageAdapter {
  readonly name = 'mock-sms';
  readonly channel: MessageChannel = 'sms';
  readonly sentMessages: OutboundMessage[] = [];

  async send(message: OutboundMessage, safeMode: boolean): Promise<SendResult> {
    // B11.1 — Safe Mode enforced via SSOT (D2)
    if (safeMode || !SafeMode.isExternalAllowed()) {
      await getOpsAuditLogger().log({
        category: 'message.send_blocked',
        severity: 'info',
        actor: 'system',
        description: `SMS blocked (safe mode): ${message.to}`,
        payload: redactForAudit({ messageId: message.id, to: message.to, channel: 'sms' }),
      });
      return { success: true, messageId: message.id, error: 'Blocked by safe mode.' };
    }

    if (!isRecipientAllowed('sms', message.to)) {
      await getOpsAuditLogger().log({
        category: 'message.send_blocked',
        severity: 'warn',
        actor: 'system',
        description: `SMS blocked (recipient not in allowlist): ${message.to}`,
        payload: { messageId: message.id, to: message.to },
      });
      return { success: false, messageId: message.id, error: 'Recipient not in allowlist.' };
    }

    this.sentMessages.push({ ...message, status: 'sent' });

    await getOpsAuditLogger().log({
      category: 'message.sms_sent',
      severity: 'info',
      actor: 'system',
      description: `Mock SMS sent to ${message.to}`,
      payload: { messageId: message.id, to: message.to },
    });

    return { success: true, messageId: message.id };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

// ─── Webhook Email Adapter ───────────────────────────────────────

export interface WebhookEmailConfig {
  endpoint: string;
  authHeader?: string;
  timeoutMs?: number;
}

export class WebhookEmailAdapter implements IMessageAdapter {
  readonly name = 'webhook-email';
  readonly channel: MessageChannel = 'email';
  private config: WebhookEmailConfig;

  constructor(config: WebhookEmailConfig) {
    this.config = config;
  }

  async send(message: OutboundMessage, safeMode: boolean): Promise<SendResult> {
    // B11.1 — Safe Mode enforced via SSOT (D2)
    if (safeMode || !SafeMode.isExternalAllowed()) {
      await getOpsAuditLogger().log({
        category: 'message.send_blocked',
        severity: 'info',
        actor: 'system',
        description: `Webhook email blocked (safe mode): ${message.to}`,
        payload: redactForAudit({ messageId: message.id, to: message.to }),
      });
      return { success: true, messageId: message.id, error: 'Blocked by safe mode.' };
    }

    if (!isRecipientAllowed('email', message.to)) {
      await getOpsAuditLogger().log({
        category: 'message.send_blocked',
        severity: 'warn',
        actor: 'system',
        description: `Webhook email blocked (allowlist): ${message.to}`,
        payload: redactForAudit({ messageId: message.id, to: message.to }),
      });
      return { success: false, messageId: message.id, error: 'Recipient not in allowlist.' };
    }

    // B11.1 — Centralized egress validation (D1)
    const egressResult = validateEgressUrl(this.config.endpoint);
    if (!egressResult.allowed) {
      await getOpsAuditLogger().log({
        category: 'message.send_blocked',
        severity: 'warn',
        actor: 'system',
        description: `Webhook email blocked (egress): ${egressResult.reason}`,
        payload: redactForAudit({
          messageId: message.id, to: message.to,
          reason: egressResult.reason, correlationId: currentCorrelationId(),
        }),
      });
      return { success: false, messageId: message.id, error: `Egress blocked: ${egressResult.reason}` };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 10_000);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.config.authHeader) headers['Authorization'] = this.config.authHeader;

      // B11.1 — safeFetch validates redirects against egress allowlist (D1)
      const response = await safeFetch(this.config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(redactForAudit({
          to: message.to,
          subject: message.subject,
          body: message.body,
          messageId: message.id,
        })),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        await getOpsAuditLogger().log({
          category: 'message.email_sent',
          severity: 'info',
          actor: 'system',
          description: `Webhook email sent to ${message.to}`,
          payload: { messageId: message.id, to: message.to, httpStatus: response.status },
        });
        return { success: true, messageId: message.id };
      }

      const error = `HTTP ${response.status}`;
      await getOpsAuditLogger().log({
        category: 'message.send_failed',
        severity: 'warn',
        actor: 'system',
        description: `Webhook email failed: ${error}`,
        payload: { messageId: message.id, to: message.to, httpStatus: response.status },
      });
      return { success: false, messageId: message.id, error };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      await getOpsAuditLogger().log({
        category: 'message.send_failed',
        severity: 'error',
        actor: 'system',
        description: `Webhook email error: ${error}`,
        payload: { messageId: message.id, to: message.to, error },
      });
      return { success: false, messageId: message.id, error };
    }
  }

  async healthCheck(): Promise<boolean> {
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

// ─── Message Queue ───────────────────────────────────────────────

export class MessageQueue {
  private adapters = new Map<MessageChannel, IMessageAdapter>();
  private queue: OutboundMessage[] = [];

  registerAdapter(adapter: IMessageAdapter): void {
    this.adapters.set(adapter.channel, adapter);
  }

  getAdapter(channel: MessageChannel): IMessageAdapter | undefined {
    return this.adapters.get(channel);
  }

  /** Create a draft message and add it to the queue. */
  enqueue(draft: Omit<OutboundMessage, 'id' | 'createdAt' | 'status'>): OutboundMessage {
    const message: OutboundMessage = {
      ...draft,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'queued',
    };
    this.queue.push(message);

    getOpsAuditLogger().log({
      category: message.channel === 'email' ? 'message.email_queued' : 'message.sms_queued',
      severity: 'info',
      actor: 'system',
      description: `Message queued (${message.channel}): ${message.to}`,
      payload: { messageId: message.id, channel: message.channel, to: message.to },
    });

    return message;
  }

  /** Process all queued messages through their channel adapters. */
  async flush(safeMode: boolean): Promise<SendResult[]> {
    const results: SendResult[] = [];
    const pending = this.queue.filter((m) => m.status === 'queued');

    for (const message of pending) {
      const adapter = this.adapters.get(message.channel);
      if (!adapter) {
        message.status = 'failed';
        message.error = `No adapter registered for channel: ${message.channel}`;
        results.push({ success: false, messageId: message.id, error: message.error });
        continue;
      }

      const result = await adapter.send(message, safeMode);
      message.status = result.success ? 'sent' : 'failed';
      message.error = result.error;
      results.push(result);
    }

    return results;
  }

  getQueue(): OutboundMessage[] {
    return [...this.queue];
  }

  clearSent(): void {
    this.queue = this.queue.filter((m) => m.status !== 'sent');
  }
}

// ─── Singleton ───────────────────────────────────────────────────

let _queue: MessageQueue | null = null;

export function getMessageQueue(): MessageQueue {
  if (!_queue) {
    _queue = new MessageQueue();
    _queue.registerAdapter(new MockEmailAdapter());
    _queue.registerAdapter(new MockSmsAdapter());
  }
  return _queue;
}

export function resetMessageQueue(): void {
  _queue = null;
}
