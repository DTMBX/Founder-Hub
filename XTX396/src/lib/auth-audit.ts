/**
 * Auth Audit Events — B26-P6
 *
 * Structured audit event emitters for authentication lifecycle.
 * All events are deterministic, explainable, and append-only.
 *
 * Events are emitted to the existing `logAudit()` system.
 * Each event includes:
 * - Correlation ID (links related events)
 * - Tenant context (when available)
 * - Auth mode (supabase | legacy)
 * - No sensitive fields (passwords, tokens, etc.)
 *
 * @module
 */

import { logAudit } from './auth'
import type { AuditAction } from './types'
import type { AuthMode } from './auth-provider'

// ─── Correlation ID ─────────────────────────────────────────────

let _correlationCounter = 0

/**
 * Generate a correlation ID for linking related audit events.
 * Format: `b26-{timestamp}-{counter}`
 *
 * Deterministic within a session, unique across events.
 */
export function generateCorrelationId(): string {
  _correlationCounter += 1
  return `b26-${Date.now()}-${_correlationCounter}`
}

// ─── Event Emitters ─────────────────────────────────────────────

interface AuthAuditContext {
  /** User ID (Supabase UUID or legacy ID) */
  userId: string
  /** User email */
  userEmail: string
  /** Auth mode active when event occurred */
  authMode: AuthMode
  /** Correlation ID linking related events */
  correlationId?: string
  /** Tenant ID (when applicable) */
  tenantId?: string
}

/**
 * Emit a structured auth lifecycle audit event.
 *
 * This is the single entry point for all B26 auth events.
 * It enriches the event with auth context before delegating
 * to the existing `logAudit()` system.
 */
export async function emitAuthAuditEvent(
  action: AuditAction,
  details: string,
  context: AuthAuditContext,
): Promise<void> {
  const correlationId = context.correlationId ?? generateCorrelationId()

  // Build enriched details string (deterministic format)
  const enrichedDetails = [
    details,
    `[mode=${context.authMode}]`,
    `[cid=${correlationId}]`,
    context.tenantId ? `[tenant=${context.tenantId}]` : '',
  ]
    .filter(Boolean)
    .join(' ')

  await logAudit(
    context.userId,
    context.userEmail,
    action,
    enrichedDetails,
    'auth',
    context.userId,
  ).catch(() => {
    // Audit emit failure must not block auth operations.
    // In production, this would be logged to an external sink.
  })
}

// ─── Convenience Emitters ───────────────────────────────────────

/**
 * Login succeeded.
 */
export async function auditLoginSuccess(
  ctx: AuthAuditContext,
  method: 'password' | 'magic-link' | 'oauth' | 'legacy',
): Promise<void> {
  await emitAuthAuditEvent(
    'login',
    `Authenticated via ${method}`,
    ctx,
  )
}

/**
 * Login failed.
 */
export async function auditLoginFailure(
  ctx: AuthAuditContext,
  reason: string,
): Promise<void> {
  // Never include credentials in audit details
  const safeReason = reason
    .replace(/password[:\s]*\S+/gi, 'password:[REDACTED]')
    .replace(/token[:\s]*\S+/gi, 'token:[REDACTED]')

  await emitAuthAuditEvent(
    'login_failed',
    `Login failed: ${safeReason}`,
    ctx,
  )
}

/**
 * User logged out.
 */
export async function auditLogout(
  ctx: AuthAuditContext,
  reason: 'manual' | 'session-expired' | 'forced',
): Promise<void> {
  const action: AuditAction = reason === 'session-expired' ? 'session_expired' : 'logout'
  await emitAuthAuditEvent(action, `Session ended: ${reason}`, ctx)
}

/**
 * Session refreshed (token rotation).
 */
export async function auditSessionRefresh(ctx: AuthAuditContext): Promise<void> {
  await emitAuthAuditEvent('session_refreshed', 'Token refreshed', ctx)
}

/**
 * Magic link sent.
 */
export async function auditMagicLinkSent(
  ctx: AuthAuditContext,
): Promise<void> {
  await emitAuthAuditEvent('magic_link_sent', 'Magic link email dispatched', ctx)
}

/**
 * Password reset requested.
 */
export async function auditPasswordResetRequested(
  ctx: AuthAuditContext,
): Promise<void> {
  await emitAuthAuditEvent(
    'password_reset_requested',
    'Password reset email sent',
    ctx,
  )
}

/**
 * Password changed.
 */
export async function auditPasswordChanged(
  ctx: AuthAuditContext,
): Promise<void> {
  await emitAuthAuditEvent(
    'password_changed',
    'Password changed via provider',
    ctx,
  )
}

/**
 * Role changed.
 */
export async function auditRoleChanged(
  ctx: AuthAuditContext,
  previousRole: string,
  newRole: string,
  changedBy: string,
): Promise<void> {
  await emitAuthAuditEvent(
    'role_changed',
    `Role changed from ${previousRole} to ${newRole} by ${changedBy}`,
    ctx,
  )
}

/**
 * MFA challenge outcome.
 */
export async function auditMfaChallenge(
  ctx: AuthAuditContext,
  outcome: 'issued' | 'passed' | 'failed',
): Promise<void> {
  const actionMap: Record<string, AuditAction> = {
    issued: 'mfa_challenge_issued',
    passed: 'mfa_challenge_passed',
    failed: 'mfa_challenge_failed',
  }
  await emitAuthAuditEvent(
    actionMap[outcome],
    `MFA challenge ${outcome}`,
    ctx,
  )
}

/**
 * Legacy migration event.
 */
export async function auditLegacyMigration(
  ctx: AuthAuditContext,
  outcome: 'started' | 'completed' | 'skipped',
  details?: string,
): Promise<void> {
  const actionMap: Record<string, AuditAction> = {
    started: 'legacy_migration_started',
    completed: 'legacy_migration_completed',
    skipped: 'legacy_migration_skipped',
  }
  await emitAuthAuditEvent(
    actionMap[outcome],
    `Legacy migration ${outcome}${details ? `: ${details}` : ''}`,
    ctx,
  )
}

/**
 * Auth mode switch (legacy ↔ supabase).
 */
export async function auditAuthModeSwitch(
  ctx: AuthAuditContext,
  from: AuthMode,
  to: AuthMode,
): Promise<void> {
  await emitAuthAuditEvent(
    'auth_mode_switched',
    `Auth mode switched from ${from} to ${to}`,
    ctx,
  )
}

/**
 * Provider error (non-fatal).
 */
export async function auditProviderError(
  ctx: AuthAuditContext,
  error: string,
): Promise<void> {
  // Sanitize: redact any tokens or secrets that might leak
  const safeError = error
    .replace(/key[:\s]*\S+/gi, 'key:[REDACTED]')
    .replace(/token[:\s]*\S+/gi, 'token:[REDACTED]')
    .replace(/secret[:\s]*\S+/gi, 'secret:[REDACTED]')

  await emitAuthAuditEvent(
    'provider_error',
    `Provider error: ${safeError}`,
    ctx,
  )
}
