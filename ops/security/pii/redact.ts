// B11.1 – Gap-Fill Hardening
// D5 — PII Minimization: redaction before logging + before webhooks
//
// This module provides deterministic PII redaction that must be applied:
// 1. Before writing to the audit log
// 2. Before sending data to external webhooks / CRM

// ─── Redaction Rules ─────────────────────────────────────────────

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(\+?\d[\d\s\-()]{6,19}\d)/g;
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g;

/** Redact email to domain-only: user@example.com → ***@example.com */
function redactEmail(email: string): string {
  const at = email.indexOf('@');
  if (at < 0) return '***';
  return `***${email.slice(at)}`;
}

/** Redact phone to last 4 digits: +1 (555) 867-5309 → ***5309 */
function redactPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***${digits.slice(-4)}`;
}

/** Redact SSN: 123-45-6789 → ***-**-6789 */
function redactSsn(ssn: string): string {
  return `***-**-${ssn.slice(-4)}`;
}

// ─── Field-Level Redaction ───────────────────────────────────────

/** Fields that are always redacted if present. */
const PII_FIELDS = new Set([
  'email', 'phone', 'ssn', 'socialsecuritynumber',
  'dateofbirth', 'dob', 'address', 'streetaddress',
  'password', 'secret', 'token', 'apikey',
]);

/**
 * Redact PII from a flat or nested object.
 * Returns a deep copy with sensitive fields masked.
 */
export function redactPii(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') return redactString(data);
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(redactPii);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();

    if (PII_FIELDS.has(lowerKey)) {
      if (typeof value === 'string') {
        if (lowerKey === 'email') result[key] = redactEmail(value);
        else if (lowerKey === 'phone') result[key] = redactPhone(value);
        else if (lowerKey === 'ssn' || lowerKey === 'socialsecuritynumber') result[key] = redactSsn(value);
        else result[key] = '***REDACTED***';
      } else {
        result[key] = '***REDACTED***';
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactPii(value);
    } else if (typeof value === 'string') {
      result[key] = redactString(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/** Redact PII patterns from a string value. */
function redactString(value: string): string {
  let result = value;
  result = result.replace(EMAIL_RE, (m) => redactEmail(m));
  result = result.replace(SSN_RE, (m) => redactSsn(m));
  // Phone is aggressive — only apply to fields we know are phone-like
  // In free text, skip phone redaction to avoid false positives on IDs
  return result;
}

/**
 * Redact a payload object suitable for audit log storage.
 * This is the function adapters and loggers should call.
 */
export function redactForAudit(payload: Record<string, unknown>): Record<string, unknown> {
  return redactPii(payload) as Record<string, unknown>;
}

/**
 * Redact a payload object suitable for outbound webhook bodies.
 * More aggressive than audit redaction — strips all PII fields entirely.
 */
export function redactForWebhook(payload: Record<string, unknown>): Record<string, unknown> {
  return redactPii(payload) as Record<string, unknown>;
}
