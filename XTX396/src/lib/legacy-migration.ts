/**
 * Legacy Auth Migration — B26
 *
 * Detects and manages migration from localStorage-based auth
 * to Supabase provider auth.
 *
 * RULES:
 * - Never silently delete legacy data
 * - Require explicit user confirmation for migration
 * - Emit audit events for all migration actions
 * - Preserve legacy mode for unconfigured installs
 *
 * @module
 */

import { kv } from './local-storage-kv'
import { logAudit } from './auth'
import { isSupabaseConfigured } from './supabase'
import type { User } from './types'

// ─── Legacy Storage Keys ────────────────────────────────────────

const LEGACY_USERS_KEY = 'founder-hub-users'
const LEGACY_SESSION_KEY = 'founder-hub-session'
const LEGACY_LOGIN_ATTEMPTS_KEY = 'founder-hub-login-attempts'
const LEGACY_AUDIT_LOG_KEY = 'founder-hub-audit-log'
const LEGACY_PENDING_2FA_KEY = 'founder-hub-pending-2fa'

const MIGRATION_STATUS_KEY = 'b26-migration-status'

// ─── Types ──────────────────────────────────────────────────────

export type MigrationStatus =
  | 'not-started'   // Legacy data exists, no migration attempted
  | 'in-progress'   // Migration started but not completed
  | 'completed'     // Migration completed, legacy data removed
  | 'skipped'       // User explicitly skipped migration
  | 'not-needed'    // No legacy data found

export interface LegacyDetectionResult {
  /** Whether legacy localStorage auth data exists */
  hasLegacyData: boolean
  /** Number of legacy user accounts found */
  userCount: number
  /** Legacy admin email, if found */
  adminEmail: string | null
  /** Whether Supabase is configured (migration target available) */
  providerAvailable: boolean
  /** Current migration status */
  migrationStatus: MigrationStatus
}

// ─── Detection ──────────────────────────────────────────────────

/**
 * Detect whether legacy localStorage auth data exists.
 * This is safe to call at any time — read-only.
 */
export async function detectLegacyAuth(): Promise<LegacyDetectionResult> {
  const users = await kv.get<User[]>(LEGACY_USERS_KEY)
  const status = await kv.get<MigrationStatus>(MIGRATION_STATUS_KEY)

  if (!users || users.length === 0) {
    return {
      hasLegacyData: false,
      userCount: 0,
      adminEmail: null,
      providerAvailable: isSupabaseConfigured(),
      migrationStatus: status ?? 'not-needed',
    }
  }

  const admin = users.find(u => u.role === 'owner') ?? users[0]

  return {
    hasLegacyData: true,
    userCount: users.length,
    adminEmail: admin?.email ?? null,
    providerAvailable: isSupabaseConfigured(),
    migrationStatus: status ?? 'not-started',
  }
}

// ─── Migration Actions ──────────────────────────────────────────

/**
 * Clear legacy auth data from localStorage.
 * Requires explicit caller confirmation.
 *
 * @param confirmedBy - Email of the user confirming the action
 */
export async function clearLegacyAuthData(confirmedBy: string): Promise<{
  success: boolean
  keysRemoved: string[]
  error?: string
}> {
  const keysRemoved: string[] = []

  try {
    // Remove legacy keys one at a time, tracking what was removed
    for (const key of [
      LEGACY_USERS_KEY,
      LEGACY_SESSION_KEY,
      LEGACY_LOGIN_ATTEMPTS_KEY,
      LEGACY_PENDING_2FA_KEY,
    ]) {
      const exists = await kv.get(key)
      if (exists !== null && exists !== undefined) {
        await kv.delete(key)
        keysRemoved.push(key)
      }
    }

    // NOTE: Audit log is NOT removed — it is append-only per governance policy
    // It remains in localStorage as a historical record

    // Mark migration as completed
    await kv.set(MIGRATION_STATUS_KEY, 'completed' as MigrationStatus)

    // Emit audit event
    await logAudit(
      'system', confirmedBy,
      'login', // Using existing audit action type
      `Legacy auth data cleared. Keys removed: ${keysRemoved.join(', ')}. Audit log preserved.`,
      'migration',
      'b26-legacy-clear'
    )

    return { success: true, keysRemoved }
  } catch (error) {
    return {
      success: false,
      keysRemoved,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Mark migration as skipped (user chose not to migrate now).
 */
export async function skipMigration(userEmail: string): Promise<void> {
  await kv.set(MIGRATION_STATUS_KEY, 'skipped' as MigrationStatus)
  await logAudit(
    'system', userEmail,
    'login',
    'Legacy auth migration skipped by user',
    'migration',
    'b26-migration-skip'
  )
}

/**
 * Check if the current install should show the legacy migration banner.
 */
export async function shouldShowMigrationBanner(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  const detection = await detectLegacyAuth()
  return detection.hasLegacyData && detection.migrationStatus === 'not-started'
}

/**
 * Get a summary of legacy data for the migration UI.
 */
export async function getLegacyDataSummary(): Promise<{
  users: Array<{ email: string; role: string; lastLogin: number }>
  auditLogEntries: number
  hasSession: boolean
}> {
  const users = await kv.get<User[]>(LEGACY_USERS_KEY) ?? []
  const auditLog = await kv.get<unknown[]>(LEGACY_AUDIT_LOG_KEY) ?? []
  const session = await kv.get(LEGACY_SESSION_KEY)

  return {
    users: users.map(u => ({
      email: u.email,
      role: u.role,
      lastLogin: u.lastLogin,
    })),
    auditLogEntries: auditLog.length,
    hasSession: session !== null,
  }
}
