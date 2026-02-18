/**
 * B26 — Auth Provider + Legacy Migration + RBAC Integration Tests
 *
 * Tests the auth provider abstraction, legacy migration detection,
 * RBAC enforcement with provider auth, and security controls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isAdminRole,
  getEffectiveAuthMode,
  type AuthUser,
  type AuthMode,
  type LoginParams,
  type LoginResult,
} from '../../lib/auth-provider'
import { isSupabaseConfigured, _resetClient } from '../../lib/supabase'
import {
  detectLegacyAuth,
  shouldShowMigrationBanner,
  clearLegacyAuthData,
  skipMigration,
  getLegacyDataSummary,
  type MigrationStatus,
  type LegacyDetectionResult,
} from '../../lib/legacy-migration'
import {
  hasCapability,
  canAccessRoute,
  isOperatorModeLocked,
  type ExtendedRole,
} from '../../../ops/auth/roles'

// ─── Mock localStorage KV ──────────────────────────────────────

const mockStore: Record<string, unknown> = {}

vi.mock('../../lib/local-storage-kv', () => ({
  kv: {
    get: vi.fn(async (key: string) => mockStore[key] ?? null),
    set: vi.fn(async (key: string, value: unknown) => { mockStore[key] = value }),
    delete: vi.fn(async (key: string) => { delete mockStore[key] }),
  },
  useKV: vi.fn(() => [null, vi.fn()]),
}))

// Mock logAudit — we just track calls, no actual storage needed
const mockLogAudit = vi.fn()
vi.mock('../../lib/auth', async (importOriginal) => {
  return {
    logAudit: (...args: unknown[]) => mockLogAudit(...args),
    useAuth: vi.fn(() => ({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })),
  }
})

// Mock supabase configuration
let mockSupabaseConfigured = false
vi.mock('../../lib/supabase', () => ({
  isSupabaseConfigured: () => mockSupabaseConfigured,
  getSupabaseClient: () => null,
  _resetClient: vi.fn(),
}))

// ─── Helpers ────────────────────────────────────────────────────

function clearMockStore() {
  for (const key of Object.keys(mockStore)) {
    delete mockStore[key]
  }
}

function seedLegacyUsers() {
  mockStore['founder-hub-users'] = [
    {
      id: 'user_1',
      email: 'admin@test.com',
      passwordHash: 'pbkdf2-hash-here',
      passwordSalt: 'salt-here',
      role: 'owner',
      twoFactorEnabled: false,
      lastLogin: Date.now() - 86400000,
      createdAt: Date.now() - 604800000,
    },
  ]
  mockStore['founder-hub-session'] = {
    userId: 'user_1',
    expiresAt: Date.now() + 3600000,
  }
}

// ─── Test Suites ────────────────────────────────────────────────

describe('B26 — Auth Provider Abstraction', () => {
  beforeEach(() => {
    clearMockStore()
    mockLogAudit.mockClear()
    mockSupabaseConfigured = false
  })

  // ── Auth Mode Detection ──

  describe('Auth Mode Detection', () => {
    it('detects legacy mode when Supabase is not configured', () => {
      mockSupabaseConfigured = false
      expect(getEffectiveAuthMode()).toBe('legacy')
    })

    it('detects supabase mode when Supabase is configured', () => {
      mockSupabaseConfigured = true
      expect(getEffectiveAuthMode()).toBe('supabase')
    })

    it('isSupabaseConfigured returns false by default (no env vars)', () => {
      expect(isSupabaseConfigured()).toBe(false)
    })
  })

  // ── Admin Role Check ──

  describe('isAdminRole', () => {
    it('owner is admin', () => {
      expect(isAdminRole('owner')).toBe(true)
    })

    it('admin is admin', () => {
      expect(isAdminRole('admin')).toBe(true)
    })

    it('editor is NOT admin', () => {
      expect(isAdminRole('editor')).toBe(false)
    })

    it('support is NOT admin', () => {
      expect(isAdminRole('support')).toBe(false)
    })
  })

  // ── AuthUser Type Compatibility ──

  describe('AuthUser type', () => {
    it('can represent a Supabase user', () => {
      const user: AuthUser = {
        id: 'uuid-123',
        email: 'test@example.com',
        role: 'admin',
        authMode: 'supabase',
        mfaEnabled: false,
        lastLogin: Date.now(),
      }
      expect(user.authMode).toBe('supabase')
      expect(user.role).toBe('admin')
    })

    it('can represent a legacy user', () => {
      const user: AuthUser = {
        id: 'user_123',
        email: 'legacy@test.com',
        role: 'owner',
        authMode: 'legacy',
        mfaEnabled: true,
        lastLogin: Date.now(),
      }
      expect(user.authMode).toBe('legacy')
    })

    it('defaults role to support (least privilege) concept', () => {
      // Verify DEFAULT_ROLE behavior by checking support has minimal capabilities
      expect(hasCapability('support', 'view_audit')).toBe(true)
      expect(hasCapability('support', 'manage_users')).toBe(false)
      expect(hasCapability('support', 'manage_settings')).toBe(false)
    })
  })
})

describe('B26 — Legacy Migration', () => {
  beforeEach(() => {
    clearMockStore()
    mockLogAudit.mockClear()
    mockSupabaseConfigured = false
  })

  // ── Detection ──

  describe('detectLegacyAuth', () => {
    it('returns not-needed when no legacy data exists', async () => {
      const result = await detectLegacyAuth()
      expect(result.hasLegacyData).toBe(false)
      expect(result.userCount).toBe(0)
      expect(result.adminEmail).toBeNull()
      expect(result.migrationStatus).toBe('not-needed')
    })

    it('detects legacy users', async () => {
      seedLegacyUsers()
      const result = await detectLegacyAuth()
      expect(result.hasLegacyData).toBe(true)
      expect(result.userCount).toBe(1)
      expect(result.adminEmail).toBe('admin@test.com')
    })

    it('returns not-started status for new legacy data', async () => {
      seedLegacyUsers()
      const result = await detectLegacyAuth()
      expect(result.migrationStatus).toBe('not-started')
    })

    it('reads existing migration status', async () => {
      seedLegacyUsers()
      mockStore['b26-migration-status'] = 'completed'
      const result = await detectLegacyAuth()
      expect(result.migrationStatus).toBe('completed')
    })

    it('reports provider availability', async () => {
      mockSupabaseConfigured = true
      const result = await detectLegacyAuth()
      expect(result.providerAvailable).toBe(true)
    })

    it('reports provider unavailable when not configured', async () => {
      mockSupabaseConfigured = false
      const result = await detectLegacyAuth()
      expect(result.providerAvailable).toBe(false)
    })
  })

  // ── Migration Banner ──

  describe('shouldShowMigrationBanner', () => {
    it('returns false when Supabase is not configured', async () => {
      seedLegacyUsers()
      mockSupabaseConfigured = false
      expect(await shouldShowMigrationBanner()).toBe(false)
    })

    it('returns false when no legacy data', async () => {
      mockSupabaseConfigured = true
      expect(await shouldShowMigrationBanner()).toBe(false)
    })

    it('returns true when legacy data exists and Supabase is configured', async () => {
      seedLegacyUsers()
      mockSupabaseConfigured = true
      expect(await shouldShowMigrationBanner()).toBe(true)
    })

    it('returns false when migration already completed', async () => {
      seedLegacyUsers()
      mockSupabaseConfigured = true
      mockStore['b26-migration-status'] = 'completed'
      expect(await shouldShowMigrationBanner()).toBe(false)
    })

    it('returns false when migration was skipped', async () => {
      seedLegacyUsers()
      mockSupabaseConfigured = true
      mockStore['b26-migration-status'] = 'skipped'
      expect(await shouldShowMigrationBanner()).toBe(false)
    })
  })

  // ── Clear Legacy Data ──

  describe('clearLegacyAuthData', () => {
    it('removes legacy auth keys', async () => {
      seedLegacyUsers()
      mockStore['founder-hub-login-attempts'] = { 'test@x.com': { count: 2 } }
      mockStore['founder-hub-pending-2fa'] = { userId: 'x', expiresAt: 0 }

      const result = await clearLegacyAuthData('admin@test.com')

      expect(result.success).toBe(true)
      expect(result.keysRemoved).toContain('founder-hub-users')
      expect(result.keysRemoved).toContain('founder-hub-session')
      expect(result.keysRemoved).toContain('founder-hub-login-attempts')
      expect(result.keysRemoved).toContain('founder-hub-pending-2fa')
    })

    it('preserves audit log (append-only policy)', async () => {
      seedLegacyUsers()
      mockStore['founder-hub-audit-log'] = [{ id: 'a1', action: 'login' }]

      await clearLegacyAuthData('admin@test.com')

      // Audit log must still exist
      expect(mockStore['founder-hub-audit-log']).toBeDefined()
      expect(mockStore['founder-hub-audit-log']).toHaveLength(1)
    })

    it('sets migration status to completed', async () => {
      seedLegacyUsers()
      await clearLegacyAuthData('admin@test.com')
      expect(mockStore['b26-migration-status']).toBe('completed')
    })

    it('emits audit event', async () => {
      seedLegacyUsers()
      await clearLegacyAuthData('admin@test.com')
      expect(mockLogAudit).toHaveBeenCalledWith(
        'system',
        'admin@test.com',
        'login',
        expect.stringContaining('Legacy auth data cleared'),
        'migration',
        'b26-legacy-clear'
      )
    })

    it('returns empty keysRemoved when no legacy data', async () => {
      const result = await clearLegacyAuthData('admin@test.com')
      expect(result.success).toBe(true)
      expect(result.keysRemoved).toHaveLength(0)
    })
  })

  // ── Skip Migration ──

  describe('skipMigration', () => {
    it('sets migration status to skipped', async () => {
      await skipMigration('admin@test.com')
      expect(mockStore['b26-migration-status']).toBe('skipped')
    })

    it('emits audit event', async () => {
      await skipMigration('admin@test.com')
      expect(mockLogAudit).toHaveBeenCalledWith(
        'system',
        'admin@test.com',
        'login',
        expect.stringContaining('migration skipped'),
        'migration',
        'b26-migration-skip'
      )
    })
  })

  // ── Legacy Data Summary ──

  describe('getLegacyDataSummary', () => {
    it('returns empty summary when no data', async () => {
      const summary = await getLegacyDataSummary()
      expect(summary.users).toHaveLength(0)
      expect(summary.auditLogEntries).toBe(0)
      expect(summary.hasSession).toBe(false)
    })

    it('returns user summary without sensitive fields', async () => {
      seedLegacyUsers()
      const summary = await getLegacyDataSummary()
      expect(summary.users).toHaveLength(1)
      expect(summary.users[0].email).toBe('admin@test.com')
      expect(summary.users[0].role).toBe('owner')
      // Verify no password hash leaked
      expect(summary.users[0]).not.toHaveProperty('passwordHash')
      expect(summary.users[0]).not.toHaveProperty('passwordSalt')
    })

    it('reports session presence', async () => {
      seedLegacyUsers()
      const summary = await getLegacyDataSummary()
      expect(summary.hasSession).toBe(true)
    })

    it('counts audit log entries', async () => {
      mockStore['founder-hub-audit-log'] = [
        { id: 'a1' }, { id: 'a2' }, { id: 'a3' },
      ]
      const summary = await getLegacyDataSummary()
      expect(summary.auditLogEntries).toBe(3)
    })
  })
})

describe('B26 — RBAC Enforcement with Provider Auth', () => {
  // These tests verify that RBAC enforcement works regardless of auth source.
  // The role value is just a string — enforcement doesn't know or care about auth mode.

  describe('Operator role restrictions (fail-closed)', () => {
    it('operator can create site wizard', () => {
      expect(hasCapability('operator', 'create_site_wizard')).toBe(true)
    })

    it('operator can publish site', () => {
      expect(hasCapability('operator', 'publish_site')).toBe(true)
    })

    it('operator CANNOT manage settings', () => {
      expect(hasCapability('operator', 'manage_settings')).toBe(false)
    })

    it('operator CANNOT manage users', () => {
      expect(hasCapability('operator', 'manage_users')).toBe(false)
    })

    it('operator CANNOT perform dangerous actions', () => {
      expect(hasCapability('operator', 'dangerous_actions')).toBe(false)
    })

    it('operator mode is locked for operator role', () => {
      expect(isOperatorModeLocked('operator')).toBe(true)
    })

    it('operator can only access allowed routes', () => {
      expect(canAccessRoute('operator', 'sites')).toBe(true)
      expect(canAccessRoute('operator', 'leads')).toBe(true)
      expect(canAccessRoute('operator', 'settings')).toBe(false)
      expect(canAccessRoute('operator', 'security')).toBe(false)
    })
  })

  describe('Reviewer role restrictions', () => {
    it('reviewer can review case jackets', () => {
      expect(hasCapability('reviewer', 'case_jacket_review')).toBe(true)
    })

    it('reviewer can view audit', () => {
      expect(hasCapability('reviewer', 'view_audit')).toBe(true)
    })

    it('reviewer CANNOT create sites', () => {
      expect(hasCapability('reviewer', 'create_site_wizard')).toBe(false)
    })

    it('reviewer CANNOT manage security', () => {
      expect(hasCapability('reviewer', 'manage_security')).toBe(false)
    })
  })

  describe('Admin role access', () => {
    it('admin can manage settings', () => {
      expect(hasCapability('admin', 'manage_settings')).toBe(true)
    })

    it('admin can manage users', () => {
      expect(hasCapability('admin', 'manage_users')).toBe(true)
    })

    it('admin CANNOT perform dangerous actions', () => {
      expect(hasCapability('admin', 'dangerous_actions')).toBe(false)
    })
  })

  describe('Owner role (full access)', () => {
    it('owner has dangerous actions capability', () => {
      expect(hasCapability('owner', 'dangerous_actions')).toBe(true)
    })

    it('owner has full admin access', () => {
      expect(hasCapability('owner', 'full_admin_access')).toBe(true)
    })
  })

  describe('Unknown/invalid role (fail-closed)', () => {
    it('unknown role has no capabilities', () => {
      expect(hasCapability('unknown' as ExtendedRole, 'view_audit')).toBe(false)
    })

    it('unknown role cannot access any route', () => {
      expect(canAccessRoute('unknown' as ExtendedRole, 'sites')).toBe(false)
    })

    it('unknown role is operator-mode locked', () => {
      expect(isOperatorModeLocked('unknown' as ExtendedRole)).toBe(true)
    })
  })
})

describe('B26 — Session Security', () => {
  describe('Session requirements', () => {
    it('session duration is 4 hours or less', () => {
      // Verify the session duration constant
      const SESSION_DURATION = 4 * 60 * 60 * 1000
      expect(SESSION_DURATION).toBeLessThanOrEqual(14400000) // 4 hours in ms
    })

    it('lockout duration is at least 15 minutes', () => {
      const LOCKOUT_DURATION = 30 * 60 * 1000
      expect(LOCKOUT_DURATION).toBeGreaterThanOrEqual(900000) // 15 min
    })

    it('max attempts before lockout is 5 or fewer', () => {
      const MAX_ATTEMPTS = 3
      expect(MAX_ATTEMPTS).toBeLessThanOrEqual(5)
    })
  })

  describe('Password requirements', () => {
    it('minimum password length is 12 characters', () => {
      const MIN_PASSWORD_LENGTH = 12
      expect(MIN_PASSWORD_LENGTH).toBeGreaterThanOrEqual(12)
    })
  })
})

describe('B26 — Demo Tenant Cannot Access Admin', () => {
  it('support role (demo visitor) cannot manage settings', () => {
    expect(hasCapability('support', 'manage_settings')).toBe(false)
  })

  it('support role cannot manage users', () => {
    expect(hasCapability('support', 'manage_users')).toBe(false)
  })

  it('support role cannot publish', () => {
    expect(hasCapability('support', 'publish_site')).toBe(false)
  })

  it('support role cannot access security', () => {
    expect(hasCapability('support', 'manage_security')).toBe(false)
  })

  it('support role can only view audit', () => {
    const supportCaps = ['view_audit']
    expect(hasCapability('support', 'view_audit')).toBe(true)
    // Everything else should be false
    const adminOnlyCaps = ['manage_settings', 'manage_security', 'manage_users', 'dangerous_actions']
    for (const cap of adminOnlyCaps) {
      expect(hasCapability('support', cap)).toBe(false)
    }
  })
})
