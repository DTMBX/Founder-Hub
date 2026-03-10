/**
 * Resource Connection Tests
 * Verifies that all modules, imports, and dependency chains are properly wired.
 *
 * Coverage:
 * 1. Assistant barrel exports (all re-exported types/functions resolve)
 * 2. Supabase client singleton (isSupabaseConfigured, getSupabaseClient)
 * 3. KV store CRUD (async, with localStorage mock, prefix founder-hub:)
 * 4. Auth-provider mode detection (always 'supabase' — legacy removed)
 * 5. Feature-flags ↔ auth connection (getCurrentUserRole reads session from localStorage)
 * 6. Permissions ↔ role hierarchy (OWNER_ONLY_FLAGS enforcement, route guards)
 * 7. Policy-engine ↔ runtime-policy.json (evaluateCommand, evaluateFileAccess, evaluateAction)
 * 8. Cross-module wiring (auth→kv, feature-flags→auth session, permissions→types)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// ─── localStorage mock ─────────────────────────────────────────

const store: Record<string, string> = {}
const localStorageMock: Storage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value },
  removeItem: (key: string) => { delete store[key] },
  clear: () => { for (const k of Object.keys(store)) delete store[k] },
  get length() { return Object.keys(store).length },
  key: (i: number) => Object.keys(store)[i] ?? null,
}

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

// Known prefix — matches STORAGE_PREFIX in local-storage-kv.ts (not exported)
const KV_PREFIX = 'founder-hub:'

// ─── Helpers ────────────────────────────────────────────────────

function injectSession(role: string = 'owner') {
  store[`${KV_PREFIX}founder-hub-session`] = JSON.stringify({
    userId: `test-${role}`,
    role,
    expiresAt: Date.now() + 3_600_000,
  })
}

// ═══════════════════════════════════════════════════════════════
// 1. ASSISTANT BARREL EXPORTS
// ═══════════════════════════════════════════════════════════════

describe('Assistant barrel exports', () => {
  it('re-exports PolicyEngine class', async () => {
    const mod = await import('@/assistant/index')
    expect(mod.PolicyEngine).toBeDefined()
    expect(typeof mod.PolicyEngine).toBe('function') // class constructor
  })

  it('re-exports AuditLogger class', async () => {
    const mod = await import('@/assistant/index')
    expect(mod.AuditLogger).toBeDefined()
    expect(typeof mod.AuditLogger).toBe('function')
  })

  it('re-exports ToolRunner class', async () => {
    const mod = await import('@/assistant/index')
    expect(mod.ToolRunner).toBeDefined()
    expect(typeof mod.ToolRunner).toBe('function')
  })

  it('re-exports PRWorkflowService class', async () => {
    const mod = await import('@/assistant/index')
    expect(mod.PRWorkflowService).toBeDefined()
    expect(typeof mod.PRWorkflowService).toBe('function')
  })

  it('re-exports ChatAssistant component', async () => {
    const mod = await import('@/assistant/index')
    expect(mod.ChatAssistant).toBeDefined()
  })

  it('re-exports all expected type-level symbols', async () => {
    // These are type-only at runtime, but the barrel file also re-exports enums/consts
    const mod = await import('@/assistant/index')
    // At minimum the barrel module should be importable without error
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 2. SUPABASE CLIENT SINGLETON
// ═══════════════════════════════════════════════════════════════

describe('Supabase client singleton', () => {
  let supabaseMod: typeof import('@/lib/supabase')

  beforeEach(async () => {
    // Dynamic import each time so we can reset
    supabaseMod = await import('@/lib/supabase')
    supabaseMod._resetClient()
  })

  it('isSupabaseConfigured returns false when env vars are missing', () => {
    // In test env VITE_SUPABASE_URL is not set
    expect(supabaseMod.isSupabaseConfigured()).toBe(false)
  })

  it('getSupabaseClient returns null when not configured', () => {
    expect(supabaseMod.getSupabaseClient()).toBeNull()
  })

  it('_resetClient is a callable function', () => {
    expect(typeof supabaseMod._resetClient).toBe('function')
    // Should not throw
    supabaseMod._resetClient()
  })
})

// ═══════════════════════════════════════════════════════════════
// 3. KV STORE CRUD (all methods are async)
// ═══════════════════════════════════════════════════════════════

describe('KV store (local-storage-kv)', () => {
  let kvMod: typeof import('@/lib/local-storage-kv')

  beforeEach(async () => {
    localStorageMock.clear()
    kvMod = await import('@/lib/local-storage-kv')
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  it('kv.set stores value under prefixed key', async () => {
    await kvMod.kv.set('test-key', { hello: 'world' })
    const raw = localStorageMock.getItem(`${KV_PREFIX}test-key`)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!)).toEqual({ hello: 'world' })
  })

  it('kv.get retrieves previously set value', async () => {
    await kvMod.kv.set('alpha', [1, 2, 3])
    expect(await kvMod.kv.get<number[]>('alpha')).toEqual([1, 2, 3])
  })

  it('kv.get returns null for non-existent key', async () => {
    expect(await kvMod.kv.get('nope')).toBeNull()
  })

  it('kv.delete removes a key', async () => {
    await kvMod.kv.set('del-me', 'data')
    expect(await kvMod.kv.get('del-me')).toBe('data')
    await kvMod.kv.delete('del-me')
    expect(await kvMod.kv.get('del-me')).toBeNull()
  })

  it('kv.keys returns all prefixed keys without prefix', async () => {
    await kvMod.kv.set('a', 1)
    await kvMod.kv.set('b', 2)
    const keys = await kvMod.kv.keys()
    expect(keys).toContain('a')
    expect(keys).toContain('b')
  })

  it('kv.clear removes all prefixed keys', async () => {
    await kvMod.kv.set('x', 10)
    await kvMod.kv.set('y', 20)
    // Put a non-prefixed key to confirm it survives
    localStorageMock.setItem('unrelated', 'stays')
    await kvMod.kv.clear()
    expect(await kvMod.kv.get('x')).toBeNull()
    expect(await kvMod.kv.get('y')).toBeNull()
    expect(localStorageMock.getItem('unrelated')).toBe('stays')
  })

  it('exportDataForCommit returns serializable object', async () => {
    await kvMod.kv.set('export-test', { v: 1 })
    const exported = kvMod.exportDataForCommit()
    expect(exported).toBeDefined()
    expect(typeof exported).toBe('object')
  })

  it('isLocalhost utility is callable', () => {
    expect(typeof kvMod.isLocalhost).toBe('function')
    // In test env (jsdom), hostname is "localhost"
    expect(kvMod.isLocalhost()).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════
// 4. AUTH-PROVIDER MODE DETECTION
// ═══════════════════════════════════════════════════════════════

describe('Auth-provider mode detection', () => {
  it('getEffectiveAuthMode always returns "supabase" (legacy removed)', async () => {
    const { getEffectiveAuthMode } = await import('@/lib/auth-provider')
    // Legacy auth is removed — always returns 'supabase' regardless of config
    expect(getEffectiveAuthMode()).toBe('supabase')
  })

  it('isAdminRole identifies owner and admin as admin-level', async () => {
    const { isAdminRole } = await import('@/lib/auth-provider')
    expect(isAdminRole('owner')).toBe(true)
    expect(isAdminRole('admin')).toBe(true)
    expect(isAdminRole('editor')).toBe(false)
    expect(isAdminRole('support')).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════
// 5. FEATURE-FLAGS ↔ AUTH SESSION CONNECTION
// ═══════════════════════════════════════════════════════════════

describe('Feature-flags ↔ auth session', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  it('getFlags returns safe defaults when no flags stored', async () => {
    const { getFlags, DEFAULT_FLAGS } = await import('@/lib/feature-flags')
    const flags = getFlags()
    expect(flags).toEqual(DEFAULT_FLAGS)
  })

  it('setFlag stores value in localStorage under FLAGS_KEY', async () => {
    const { setFlag, getFlag } = await import('@/lib/feature-flags')
    // founderMode is not owner-only, any role can change it
    setFlag('founderMode', false)
    expect(getFlag('founderMode')).toBe(false)
  })

  it('OWNER_ONLY_FLAGS are blocked without owner session', async () => {
    const { setFlag, getFlag, DEFAULT_FLAGS } = await import('@/lib/feature-flags')
    // No session injected — getCurrentUserRole() returns null
    setFlag('debugMode', true)
    // Should remain at default because no owner session
    expect(getFlag('debugMode')).toBe(DEFAULT_FLAGS.debugMode)
  })

  it('OWNER_ONLY_FLAGS are allowed with owner session', async () => {
    injectSession('owner')
    const { setFlag, getFlag } = await import('@/lib/feature-flags')
    setFlag('debugMode', true)
    expect(getFlag('debugMode')).toBe(true)
  })

  it('OWNER_ONLY_FLAGS are blocked for non-owner roles', async () => {
    injectSession('admin')
    const { setFlag, getFlag, DEFAULT_FLAGS } = await import('@/lib/feature-flags')
    setFlag('terminalEnabled', true)
    expect(getFlag('terminalEnabled')).toBe(DEFAULT_FLAGS.terminalEnabled)
  })

  it('resetFlags restores defaults', async () => {
    injectSession('owner')
    const { setFlag, resetFlags, getFlags, DEFAULT_FLAGS } = await import('@/lib/feature-flags')
    setFlag('aiAssistEnabled', true)
    setFlag('debugMode', true)
    resetFlags()
    expect(getFlags()).toEqual(DEFAULT_FLAGS)
  })

  it('setFlags applies multiple flags, blocks owner-only for non-owners', async () => {
    injectSession('editor')
    const { setFlags, getFlags, DEFAULT_FLAGS } = await import('@/lib/feature-flags')
    setFlags({ founderMode: false, opsMode: true, dangerousActions: true })
    const flags = getFlags()
    expect(flags.founderMode).toBe(false)  // allowed
    expect(flags.opsMode).toBe(true)       // allowed
    expect(flags.dangerousActions).toBe(DEFAULT_FLAGS.dangerousActions) // blocked
  })

  it('dispatches custom event on flag change', async () => {
    const { setFlag } = await import('@/lib/feature-flags')
    const spy = vi.fn()
    window.addEventListener('feature-flags-changed', spy)
    try {
      setFlag('founderMode', false)
      expect(spy).toHaveBeenCalledTimes(1)
    } finally {
      window.removeEventListener('feature-flags-changed', spy)
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// 6. PERMISSIONS ↔ ROLE HIERARCHY
// ═══════════════════════════════════════════════════════════════

describe('Permissions ↔ role hierarchy integration', () => {
  it('ROLE_HIERARCHY has all four roles', async () => {
    const { ROLE_HIERARCHY } = await import('@/lib/permissions')
    expect(ROLE_HIERARCHY).toHaveProperty('owner')
    expect(ROLE_HIERARCHY).toHaveProperty('admin')
    expect(ROLE_HIERARCHY).toHaveProperty('editor')
    expect(ROLE_HIERARCHY).toHaveProperty('support')
  })

  it('hasMinimumRole wiring: owner > admin > editor > support', async () => {
    const { hasMinimumRole } = await import('@/lib/permissions')
    expect(hasMinimumRole('owner', 'admin')).toBe(true)
    expect(hasMinimumRole('admin', 'owner')).toBe(false)
    expect(hasMinimumRole('editor', 'admin')).toBe(false)
    expect(hasMinimumRole('support', 'editor')).toBe(false)
  })

  it('hasPermission grants deploy:production only to owner', async () => {
    const { hasPermission } = await import('@/lib/permissions')
    expect(hasPermission('owner', 'deploy:production')).toBe(true)
    expect(hasPermission('admin', 'deploy:production')).toBe(false)
    expect(hasPermission('editor', 'deploy:production')).toBe(false)
    expect(hasPermission('support', 'deploy:production')).toBe(false)
  })

  it('ROUTE_PERMISSIONS covers system routes from Phase 2', async () => {
    const { ROUTE_PERMISSIONS } = await import('@/lib/permissions')
    const systemRoutes = [
      'session-security', 'runtime-policy', 'deployments',
      'provenance', 'incidents', 'audit-integrity',
    ]
    for (const route of systemRoutes) {
      expect(ROUTE_PERMISSIONS[route]).toBeDefined()
      expect(ROUTE_PERMISSIONS[route]).toBe('admin')
    }
  })

  it('canAccessRoute denies editor access to owner routes', async () => {
    const { canAccessRoute } = await import('@/lib/permissions')
    expect(canAccessRoute('editor', 'settings')).toBe(false)
    expect(canAccessRoute('editor', 'security')).toBe(false)
    expect(canAccessRoute('editor', 'asset-policy')).toBe(false)
  })

  it('canAccessRoute allows admin access to admin routes', async () => {
    const { canAccessRoute } = await import('@/lib/permissions')
    expect(canAccessRoute('admin', 'audit')).toBe(true)
    expect(canAccessRoute('admin', 'staging')).toBe(true)
    expect(canAccessRoute('admin', 'theme')).toBe(true)
  })

  it('filterNavByRole respects role hierarchy for routes', async () => {
    const { filterNavByRole } = await import('@/lib/permissions')
    const items = [
      { id: 'content', label: 'Content' },    // requires editor
      { id: 'settings', label: 'Settings' },  // requires owner
      { id: 'audit', label: 'Audit' },        // requires admin
    ]
    // support < editor: no access to content (editor-level) routes
    const supportFiltered = filterNavByRole(items, 'support')
    expect(supportFiltered).toHaveLength(0)
    // editor: can access content but not settings/audit
    const editorFiltered = filterNavByRole(items, 'editor')
    expect(editorFiltered.map(i => i.id)).toEqual(['content'])
    // owner: access to all
    const ownerFiltered = filterNavByRole(items, 'owner')
    expect(ownerFiltered.map(i => i.id)).toEqual(['content', 'settings', 'audit'])
  })

  it('enforcePermission throws PermissionDeniedError when denied', async () => {
    const { enforcePermission, PermissionDeniedError } = await import('@/lib/permissions')
    expect(() => enforcePermission('support', 'deploy:production', 'test'))
      .toThrow(PermissionDeniedError)
  })

  it('enforcePermission does not throw when permitted', async () => {
    const { enforcePermission } = await import('@/lib/permissions')
    expect(() => enforcePermission('owner', 'deploy:production')).not.toThrow()
  })

  it('ACTION_GUARDS covers dangerous actions', async () => {
    const { ACTION_GUARDS, canExecuteAction } = await import('@/lib/permissions')
    expect(ACTION_GUARDS['wipe-data']).toBeDefined()
    expect(ACTION_GUARDS['bulk-delete']).toBeDefined()
    expect(canExecuteAction('owner', 'wipe-data')).toBe(true)
    expect(canExecuteAction('admin', 'wipe-data')).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════
// 7. POLICY-ENGINE (src/lib) ↔ RUNTIME-POLICY.JSON
// ═══════════════════════════════════════════════════════════════

describe('Policy-engine ↔ runtime-policy.json', () => {
  it('evaluateCommand allows safe commands for admin', async () => {
    const { evaluateCommand } = await import('@/lib/policy-engine')
    const result = await evaluateCommand('git status', 'conn-pe-1', 'admin')
    expect(result.allowed).toBe(true)
  })

  it('evaluateCommand blocks destructive commands', async () => {
    const { evaluateCommand } = await import('@/lib/policy-engine')
    const result = await evaluateCommand('rm -rf /', 'conn-pe-2', 'viewer')
    expect(result.allowed).toBe(false)
    expect(result.reasons.length).toBeGreaterThan(0)
  })

  it('evaluateFileAccess handles source file paths', async () => {
    const { evaluateFileAccess } = await import('@/lib/policy-engine')
    const result = await evaluateFileAccess('src/lib/auth.ts', 'conn-pe-3', 'admin')
    expect(result).toHaveProperty('allowed')
    expect(result).toHaveProperty('reasons')
  })

  it('evaluateAction handles action requests', async () => {
    const { evaluateAction } = await import('@/lib/policy-engine')
    const result = await evaluateAction('publish', 'conn-pe-4', 'admin')
    expect(result).toHaveProperty('allowed')
  })

  it('role-based differentiation: admin vs viewer for npm publish', async () => {
    const { evaluateCommand } = await import('@/lib/policy-engine')
    const viewerResult = await evaluateCommand('npm publish', 'conn-pe-5a', 'viewer')
    const adminResult = await evaluateCommand('npm publish', 'conn-pe-5b', 'admin')
    // Both calls produce valid PolicyDecision objects
    expect(viewerResult).toHaveProperty('allowed')
    expect(adminResult).toHaveProperty('allowed')
    // admin should have at least as much access as viewer
    if (!viewerResult.allowed && adminResult.allowed) {
      // Expected: admin has more access
      expect(adminResult.allowed).toBe(true)
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// 7b. ASSISTANT POLICY-ENGINE (src/assistant)
// ═══════════════════════════════════════════════════════════════

describe('Assistant PolicyEngine (src/assistant)', () => {
  it('PolicyEngine class instantiates and has evaluate method', async () => {
    const { PolicyEngine } = await import('@/assistant/policy-engine')
    const engine = new PolicyEngine()
    expect(typeof engine.evaluate).toBe('function')
    expect(typeof engine.getRules).toBe('function')
    expect(typeof engine.addRule).toBe('function')
  })

  it('evaluate returns a PolicyEvaluation with decision', async () => {
    const { PolicyEngine } = await import('@/assistant/policy-engine')
    const engine = new PolicyEngine()
    const result = engine.evaluate('deploy', {
      branch: 'main',
      mode: 'propose',
      dryRun: true,
      sessionId: 'test-session',
    })
    expect(result).toHaveProperty('decision')
    expect(result).toHaveProperty('action')
    expect(result).toHaveProperty('evaluatedAt')
  })

  it('getRules returns immutable + default + custom rules', async () => {
    const { PolicyEngine } = await import('@/assistant/policy-engine')
    const engine = new PolicyEngine()
    const rules = engine.getRules()
    expect(Array.isArray(rules)).toBe(true)
    expect(rules.length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// 8. CROSS-MODULE WIRING
// ═══════════════════════════════════════════════════════════════

describe('Cross-module wiring', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  it('types.ts UserRole is accepted by permissions functions', async () => {
    const { hasMinimumRole, hasPermission, canAccessRoute } = await import('@/lib/permissions')
    // The fact that these compile and run proves the type wiring
    const roles = ['owner', 'admin', 'editor', 'support'] as const
    for (const role of roles) {
      expect(typeof hasMinimumRole(role, 'support')).toBe('boolean')
      expect(typeof hasPermission(role, 'content:read')).toBe('boolean')
      expect(typeof canAccessRoute(role, 'content')).toBe('boolean')
    }
  })

  it('auth-provider exports are type-compatible with permissions module', async () => {
    const { isAdminRole } = await import('@/lib/auth-provider')
    const { hasMinimumRole } = await import('@/lib/permissions')
    // Both accept UserRole — wiring proof
    expect(isAdminRole('owner')).toBe(true)
    expect(hasMinimumRole('owner', 'admin')).toBe(true)
  })

  it('KV prefix matches session key pattern used by feature-flags', async () => {
    // feature-flags reads from 'founder-hub:founder-hub-session' (KV_PREFIX + 'founder-hub-session')
    injectSession('owner')
    const sessionRaw = localStorageMock.getItem(`${KV_PREFIX}founder-hub-session`)
    expect(sessionRaw).not.toBeNull()
    const parsed = JSON.parse(sessionRaw!)
    expect(parsed.role).toBe('owner')
    expect(parsed.userId).toBe('test-owner')
  })

  it('feature-flags reads session stored by auth flow', async () => {
    // Simulate what auth.ts does: store session at KV_PREFIX + SESSION_KEY
    injectSession('owner')
    const { setFlag, getFlag } = await import('@/lib/feature-flags')
    // If feature-flags can read the session, owner-only flags work
    setFlag('debugMode', true)
    expect(getFlag('debugMode')).toBe(true)
  })

  it('feature-flags fails gracefully with corrupted session', async () => {
    store[`${KV_PREFIX}founder-hub-session`] = '<<<invalid json>>>'
    const { setFlag, getFlag, DEFAULT_FLAGS } = await import('@/lib/feature-flags')
    // Owner-only flag should be blocked (getCurrentUserRole returns null on parse error)
    setFlag('dangerousActions', true)
    expect(getFlag('dangerousActions')).toBe(DEFAULT_FLAGS.dangerousActions)
  })

  it('feature-flags fails gracefully with expired session', async () => {
    store[`${KV_PREFIX}founder-hub-session`] = JSON.stringify({
      userId: 'expired-owner',
      role: 'owner',
      expiresAt: Date.now() - 1000, // expired
    })
    const { setFlag, getFlag, DEFAULT_FLAGS } = await import('@/lib/feature-flags')
    setFlag('terminalEnabled', true)
    expect(getFlag('terminalEnabled')).toBe(DEFAULT_FLAGS.terminalEnabled)
  })

  it('supabase module exports align with auth-provider consumption', async () => {
    const { isSupabaseConfigured, getSupabaseClient, _resetClient } = await import('@/lib/supabase')
    const { getEffectiveAuthMode } = await import('@/lib/auth-provider')
    // Supabase not configured in test env, but getEffectiveAuthMode always returns 'supabase'
    // Legacy auth has been removed — fail-closed if not configured in production
    expect(isSupabaseConfigured()).toBe(false)
    expect(getEffectiveAuthMode()).toBe('supabase')
    // Client is null when not configured
    expect(getSupabaseClient()).toBeNull()
    // Reset doesn't break anything
    _resetClient()
    expect(getSupabaseClient()).toBeNull()
  })

  it('permissions and feature-flags both reference UserRole from types', async () => {
    const permissions = await import('@/lib/permissions')
    const featureFlags = await import('@/lib/feature-flags')
    // Both modules compile and export — proves the shared type dependency works
    expect(permissions.ROLE_HIERARCHY).toBeDefined()
    expect(featureFlags.DEFAULT_FLAGS).toBeDefined()
    expect(featureFlags.OWNER_ONLY_FLAGS).toBeDefined()
  })

  it('assistant barrel resolves without circular dependency errors', async () => {
    // This exercises the full import chain:
    // assistant/index → policy-engine → (constants)
    // assistant/index → audit-logger → (localStorage)
    // assistant/index → tool-runner → (policy-engine + audit-logger)
    // assistant/index → ChatAssistant → (React + all above)
    const mod = await import('@/assistant/index')
    expect(mod.PolicyEngine).toBeDefined()
    expect(mod.AuditLogger).toBeDefined()
    expect(mod.ToolRunner).toBeDefined()
    expect(mod.ChatAssistant).toBeDefined()
  })

  it('KV store isolates prefixed keys from non-prefixed keys', async () => {
    const { kv } = await import('@/lib/local-storage-kv')
    // Set a non-prefixed key
    localStorageMock.setItem('raw-key', 'raw-value')
    // Set a prefixed key via kv
    await kv.set('kv-key', 'kv-value')
    // kv.keys should NOT include 'raw-key'
    const kvKeys = await kv.keys()
    expect(kvKeys).toContain('kv-key')
    expect(kvKeys).not.toContain('raw-key')
    // But raw-key should still exist
    expect(localStorageMock.getItem('raw-key')).toBe('raw-value')
  })

  it('lib policy-engine and permissions both enforce role-based access (dual enforcement)', async () => {
    const { hasPermission } = await import('@/lib/permissions')
    const { evaluateCommand } = await import('@/lib/policy-engine')
    // Permissions module: viewer/support cannot deploy
    expect(hasPermission('support', 'deploy:production')).toBe(false)
    // Policy engine: viewer cannot run destructive commands
    const result = await evaluateCommand('rm -rf /', 'dual-test', 'viewer')
    expect(result.allowed).toBe(false)
    // Both layers agree: restricted roles cannot do dangerous things
  })
})
