/**
 * Audit Client — Client-side Audit Logging
 *
 * Provides audit logging for the Founder-Hub control plane.
 * This is for operational visibility only — not forensic evidence.
 *
 * SECURITY NOTE:
 * - Client-side audit logs are NOT tamper-proof
 * - For forensic/evidentiary audit trails, use Evident's server-side audit
 * - This module is for operational/admin visibility only
 *
 * @module
 */

import type { AuditAction } from './types'

// ─── Types ──────────────────────────────────────────────────────

export interface AuditEvent {
  id: string
  userId: string
  userEmail: string
  action: AuditAction
  details: string
  entityType?: string
  entityId?: string
  timestamp: number
  clientInfo?: {
    userAgent: string
    origin: string
  }
}

// ─── Audit Storage Key ──────────────────────────────────────────

const AUDIT_LOG_KEY = 'founder-hub-audit-log'
const MAX_ENTRIES = 500

// ─── Audit Functions ────────────────────────────────────────────

/**
 * Log an audit event (client-side, non-forensic).
 *
 * This is for operational visibility in the admin panel.
 * For forensic audit trails, events should be sent to Evident.
 */
export async function logAudit(
  userId: string,
  userEmail: string,
  action: AuditAction,
  details: string,
  entityType?: string,
  entityId?: string
): Promise<void> {
  try {
    const event: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId,
      userEmail,
      action,
      details,
      entityType,
      entityId,
      timestamp: Date.now(),
      clientInfo: typeof window !== 'undefined' ? {
        userAgent: navigator.userAgent,
        origin: window.location.origin,
      } : undefined,
    }

    // Get existing log
    const rawLog = localStorage.getItem(AUDIT_LOG_KEY)
    const log: AuditEvent[] = rawLog ? JSON.parse(rawLog) : []

    // Prepend new event
    log.unshift(event)

    // Trim to max entries
    if (log.length > MAX_ENTRIES) {
      log.splice(MAX_ENTRIES)
    }

    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(log))
  } catch (error) {
    // Fail silently — audit logging should not break app flow
    console.warn('[audit] Failed to log event:', error)
  }
}

/**
 * Get audit log entries (client-side only).
 */
export function getAuditLog(): AuditEvent[] {
  try {
    const rawLog = localStorage.getItem(AUDIT_LOG_KEY)
    return rawLog ? JSON.parse(rawLog) : []
  } catch {
    return []
  }
}

/**
 * Clear audit log (admin action, should be logged first).
 */
export function clearAuditLog(): void {
  localStorage.removeItem(AUDIT_LOG_KEY)
}
