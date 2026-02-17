// B11 – Operations + Growth Automation Layer
// Ops Audit Event Type Definitions

/**
 * All event categories for the Ops audit stream.
 * Every automated action must emit one of these events.
 */
export type OpsEventCategory =
  // Lead lifecycle
  | 'lead.created'
  | 'lead.updated'
  | 'lead.deleted'
  | 'lead.status_changed'
  | 'lead.exported'
  // Client lifecycle
  | 'client.created'
  | 'client.updated'
  | 'client.archived'
  // Automation engine
  | 'automation.rule_created'
  | 'automation.rule_updated'
  | 'automation.rule_toggled'
  | 'automation.rule_triggered'
  | 'automation.execution_started'
  | 'automation.execution_completed'
  | 'automation.execution_failed'
  | 'automation.rule_completed'
  | 'automation.rule_failed'
  | 'automation.schedule_fired'
  // Messaging
  | 'message.draft_created'
  | 'message.email_queued'
  | 'message.email_sent'
  | 'message.sms_queued'
  | 'message.sms_sent'
  | 'message.sent'
  | 'message.send_failed'
  | 'message.send_blocked'
  | 'message.opt_out'
  // Content ops
  | 'content.request_created'
  | 'content.publish_triggered'
  | 'content.workflow_dispatched'
  // CRM
  | 'crm.sync_outbound'
  | 'crm.sync_inbound'
  | 'crm.adapter_switched'
  // Console
  | 'console.login'
  | 'console.logout'
  | 'console.action'
  | 'console.safe_mode_toggled'
  // Settings & system
  | 'settings.updated'
  | 'system.startup'
  | 'system.error'
  | 'system.config_changed';

/** Severity levels for ops events. */
export type OpsEventSeverity = 'info' | 'warn' | 'error' | 'critical';

/** Structured ops audit event. */
export interface OpsAuditEvent {
  /** Unique event ID (UUID v4). */
  id: string;
  /** ISO 8601 UTC timestamp. */
  timestamp: string;
  /** Event category from the taxonomy. */
  category: OpsEventCategory;
  /** Severity level. */
  severity: OpsEventSeverity;
  /** Actor who initiated the action (username or 'system'). */
  actor: string;
  /** Human-readable description. */
  description: string;
  /** Structured payload (no PII unless redacted). */
  payload: Record<string, unknown>;
  /** SHA-256 hash of the JSON-serialized payload. */
  payloadHash: string;
  /** Optional correlation ID for related events. */
  correlationId?: string;
}

/** Input for creating an audit event (id, timestamp, payloadHash auto-generated). */
export type OpsAuditEventInput = Omit<OpsAuditEvent, 'id' | 'timestamp' | 'payloadHash'>;
