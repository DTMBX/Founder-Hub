/**
 * B11.1 – Gap-Fill Hardening Tests
 *
 * D1 — Network Egress (DomainAllowlist)
 * D2 — SafeMode SSOT
 * D3 — Atomic Audit Sink (truncation detection)
 * D4 — Idempotent Executor
 * D5 — PII Redaction
 * D7 — Correlation IDs
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ────────────────────────────────────────────────────────────────
// D1 — DomainAllowlist
// ────────────────────────────────────────────────────────────────

import {
  validateEgressUrl,
  addAllowedDomain,
  removeAllowedDomain,
  EgressBlockedError,
} from '../security/egress/DomainAllowlist';

describe('D1 — DomainAllowlist', () => {
  beforeEach(() => {
    // Reset by removing test domains
    removeAllowedDomain('hooks.example.com');
    removeAllowedDomain('safe.example.com');
  });

  it('blocks non-HTTPS schemes', () => {
    addAllowedDomain('example.com');
    const result = validateEgressUrl('http://example.com/webhook');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('HTTPS');
    removeAllowedDomain('example.com');
  });

  it('blocks non-443 ports', () => {
    addAllowedDomain('example.com');
    const result = validateEgressUrl('https://example.com:8443/api');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('port');
    removeAllowedDomain('example.com');
  });

  it('blocks credentials in URL', () => {
    addAllowedDomain('example.com');
    const result = validateEgressUrl('https://user:pass@example.com/api');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Credentials');
    removeAllowedDomain('example.com');
  });

  it('blocks localhost/loopback addresses', () => {
    addAllowedDomain('localhost');
    const r1 = validateEgressUrl('https://localhost/api');
    expect(r1.allowed).toBe(false);
    expect(r1.reason).toContain('blocked');

    const r2 = validateEgressUrl('https://127.0.0.1/api');
    expect(r2.allowed).toBe(false);

    removeAllowedDomain('localhost');
  });

  it('blocks private IP ranges (10.x, 172.16-31.x, 192.168.x)', () => {
    const r1 = validateEgressUrl('https://10.0.0.1/api');
    expect(r1.allowed).toBe(false);

    const r2 = validateEgressUrl('https://172.16.0.1/api');
    expect(r2.allowed).toBe(false);

    const r3 = validateEgressUrl('https://192.168.1.1/api');
    expect(r3.allowed).toBe(false);
  });

  it('blocks metadata IP (169.254.169.254)', () => {
    const result = validateEgressUrl('https://169.254.169.254/latest/meta-data/');
    expect(result.allowed).toBe(false);
  });

  it('allows valid HTTPS URL with allowlisted domain', () => {
    addAllowedDomain('hooks.example.com');
    const result = validateEgressUrl('https://hooks.example.com/webhook');
    expect(result.allowed).toBe(true);
    removeAllowedDomain('hooks.example.com');
  });

  it('rejects URL not in allowlist', () => {
    const result = validateEgressUrl('https://evil.attacker.com/steal');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('allowlist');
  });

  it('normalises hostnames (case, trailing dot)', () => {
    addAllowedDomain('HOOKS.EXAMPLE.COM');
    const result = validateEgressUrl('https://hooks.example.com./webhook');
    expect(result.allowed).toBe(true);
    removeAllowedDomain('hooks.example.com');
  });

  it('rejects unparseable URLs', () => {
    const result = validateEgressUrl('not-a-url');
    expect(result.allowed).toBe(false);
  });

  it('api.github.com is allowed by default', () => {
    const result = validateEgressUrl('https://api.github.com/repos/test');
    expect(result.allowed).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────
// D2 — SafeMode SSOT
// ────────────────────────────────────────────────────────────────

import { SafeModeController, SafeModeBlockError } from '../core/SafeMode';

describe('D2 — SafeMode SSOT', () => {
  let sm: SafeModeController;

  beforeEach(() => {
    sm = new SafeModeController();
  });

  it('defaults to enabled (fail-closed)', () => {
    expect(sm.isExternalAllowed()).toBe(false);
  });

  it('can be disabled', () => {
    sm.disable();
    expect(sm.isExternalAllowed()).toBe(true);
  });

  it('assertExternalAllowed throws when enabled', () => {
    expect(() => sm.assertExternalAllowed('test')).toThrow(SafeModeBlockError);
  });

  it('assertExternalAllowed does not throw when disabled', () => {
    sm.disable();
    expect(() => sm.assertExternalAllowed('test')).not.toThrow();
  });

  it('panic forces ON and locks out', () => {
    sm.disable();
    sm.panic();
    expect(sm.isExternalAllowed()).toBe(false);
    // Cannot disable during lockout
    sm.disable();
    expect(sm.isExternalAllowed()).toBe(false);
  });

  it('clearLockout allows disable again', () => {
    sm.panic();
    sm.clearLockout();
    sm.disable();
    expect(sm.isExternalAllowed()).toBe(true);
  });

  it('subscribe notifies on state change', () => {
    const listener = vi.fn();
    const unsub = sm.subscribe(listener);

    sm.disable();
    expect(listener).toHaveBeenCalledTimes(1);

    sm.enable();
    expect(listener).toHaveBeenCalledTimes(2);

    unsub();
    sm.disable();
    expect(listener).toHaveBeenCalledTimes(2); // no more calls after unsub
  });
});

// ────────────────────────────────────────────────────────────────
// D3 — Audit Truncation Detection
// ────────────────────────────────────────────────────────────────

import { detectTruncation } from '../automation/audit/AtomicJsonlSink';

describe('D3 — Audit Truncation Detection', () => {
  it('detects valid JSONL with no truncation', () => {
    const content = '{"id":"1","ts":"2025-01-01"}\n{"id":"2","ts":"2025-01-02"}\n';
    const report = detectTruncation(content);
    expect(report.truncatedLines).toBe(0);
    expect(report.totalLines).toBe(2);
  });

  it('detects truncated/corrupt line', () => {
    const content = '{"id":"1","ts":"2025-01-01"}\n{"id":"2","ts":"2025\n{"id":"3"}\n';
    const report = detectTruncation(content);
    expect(report.truncatedLines).toBeGreaterThan(0);
  });

  it('ignores trailing empty lines', () => {
    const content = '{"id":"1"}\n\n';
    const report = detectTruncation(content);
    expect(report.truncatedLines).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────
// D4 — Idempotent Executor
// ────────────────────────────────────────────────────────────────

import {
  IdempotentExecutor,
  buildIdempotencyKey,
} from '../automation/engine/IdempotentExecutor';

describe('D4 — IdempotentExecutor', () => {
  let executor: IdempotentExecutor;

  beforeEach(() => {
    executor = new IdempotentExecutor(undefined, { baseDelayMs: 1, maxDelayMs: 5 });
  });

  it('executes action on first call', async () => {
    const key = { ruleId: 'r1', subjectId: 's1', timeWindowMs: 60_000 };
    const action = vi.fn().mockResolvedValue({ success: true, detail: 'ok' });

    const result = await executor.execute(key, action);
    expect(result.status).toBe('completed');
    expect(result.executed).toBe(true);
    expect(action).toHaveBeenCalledOnce();
  });

  it('skips duplicate execution for same key', async () => {
    const key = { ruleId: 'r1', subjectId: 's1', timeWindowMs: 60_000 };
    const action = vi.fn().mockResolvedValue({ success: true, detail: 'ok' });

    await executor.execute(key, action);
    const result = await executor.execute(key, action);
    expect(result.status).toBe('completed');
    expect(result.executed).toBe(false); // skipped
    expect(action).toHaveBeenCalledOnce(); // not called again
  });

  it('sends permanent failures to DLQ', async () => {
    const key = { ruleId: 'r2', subjectId: 's2', timeWindowMs: 60_000 };
    const action = vi.fn().mockRejectedValue(new TypeError('Invalid input'));

    const result = await executor.execute(key, action);
    expect(result.status).toBe('dlq');

    // Second call should skip (already in DLQ)
    const result2 = await executor.execute(key, action);
    expect(result2.status).toBe('dlq');
    expect(result2.executed).toBe(false);
  });

  it('different subjectIds execute independently', async () => {
    const key1 = { ruleId: 'r1', subjectId: 's1', timeWindowMs: 60_000 };
    const key2 = { ruleId: 'r1', subjectId: 's2', timeWindowMs: 60_000 };
    const action = vi.fn().mockResolvedValue({ success: true });

    await executor.execute(key1, action);
    await executor.execute(key2, action);
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('buildIdempotencyKey produces deterministic output', () => {
    const k1 = buildIdempotencyKey({ ruleId: 'r1', subjectId: 's1', timeWindowMs: 60_000 });
    const k2 = buildIdempotencyKey({ ruleId: 'r1', subjectId: 's1', timeWindowMs: 60_000 });
    expect(k1).toBe(k2);
  });
});

// ────────────────────────────────────────────────────────────────
// D5 — PII Redaction
// ────────────────────────────────────────────────────────────────

import { redactPii, redactForAudit } from '../security/pii/redact';

describe('D5 — PII Redaction', () => {
  it('redacts email to domain-only', () => {
    const result = redactPii({ email: 'john@example.com' }) as Record<string, unknown>;
    expect(result.email).toBe('***@example.com');
  });

  it('redacts phone to last 4 digits', () => {
    const result = redactPii({ phone: '+1 (555) 867-5309' }) as Record<string, unknown>;
    expect(result.phone).toBe('***5309');
  });

  it('redacts SSN', () => {
    const result = redactPii({ ssn: '123-45-6789' }) as Record<string, unknown>;
    expect(result.ssn).toBe('***-**-6789');
  });

  it('redacts nested objects', () => {
    const input = {
      lead: {
        name: 'John Doe',
        email: 'john@example.com',
        meta: { phone: '+1-555-1234' },
      },
    };
    const result = redactPii(input) as any;
    expect(result.lead.email).toBe('***@example.com');
    expect(result.lead.meta.phone).toBe('***1234');
  });

  it('redacts sensitive fields entirely', () => {
    const result = redactPii({ password: 'hunter2', apiKey: 'sk-123' }) as Record<string, unknown>;
    expect(result.password).toBe('***REDACTED***');
    expect(result.apiKey).toBe('***REDACTED***');
  });

  it('redacts emails embedded in string values', () => {
    const result = redactPii({ note: 'Contact john@test.com for details' }) as Record<string, unknown>;
    expect(result.note).toBe('Contact ***@test.com for details');
  });

  it('passes through non-PII fields unchanged', () => {
    const result = redactPii({ status: 'active', count: 42, enabled: true }) as Record<string, unknown>;
    expect(result.status).toBe('active');
    expect(result.count).toBe(42);
    expect(result.enabled).toBe(true);
  });

  it('handles null/undefined gracefully', () => {
    expect(redactPii(null)).toBeNull();
    expect(redactPii(undefined)).toBeUndefined();
  });

  it('redactForAudit returns object', () => {
    const result = redactForAudit({ email: 'a@b.com', leadId: '123' });
    expect(result.email).toBe('***@b.com');
    expect(result.leadId).toBe('123');
  });
});

// ────────────────────────────────────────────────────────────────
// D7 — Correlation IDs
// ────────────────────────────────────────────────────────────────

import {
  generateCorrelationId,
  pushCorrelation,
  popCorrelation,
  currentCorrelationId,
  withCorrelation,
} from '../core/correlation';

describe('D7 — Correlation IDs', () => {
  beforeEach(() => {
    // Drain stack
    while (currentCorrelationId()) popCorrelation();
  });

  it('generates prefixed IDs', () => {
    const id = generateCorrelationId();
    expect(id).toMatch(/^cor_/);
    expect(id.length).toBeGreaterThan(10);
  });

  it('push/pop/current works as LIFO stack', () => {
    pushCorrelation('cor_aaa');
    pushCorrelation('cor_bbb');
    expect(currentCorrelationId()).toBe('cor_bbb');
    popCorrelation();
    expect(currentCorrelationId()).toBe('cor_aaa');
    popCorrelation();
    expect(currentCorrelationId()).toBeUndefined();
  });

  it('withCorrelation scopes and cleans up', async () => {
    const result = await withCorrelation('cor_scoped', () => {
      return currentCorrelationId();
    });
    expect(result).toBe('cor_scoped');
    expect(currentCorrelationId()).toBeUndefined();
  });

  it('withCorrelation cleans up on error', async () => {
    try {
      await withCorrelation('cor_err', () => {
        throw new Error('boom');
      });
    } catch { /* expected */ }
    expect(currentCorrelationId()).toBeUndefined();
  });
});
