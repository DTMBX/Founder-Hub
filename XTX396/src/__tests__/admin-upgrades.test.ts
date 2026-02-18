/**
 * Admin Upgrade Tests — Phase 3
 * 
 * Tests for:
 * 1. Feature flag enforcement (OWNER_ONLY_FLAGS, AUDITED_FLAGS)
 * 2. Capabilities registry integrity
 * 3. Dangerous actions safety
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DEFAULT_FLAGS,
  OWNER_ONLY_FLAGS,
  AUDITED_FLAGS,
  FLAG_CATEGORIES,
  getFlags,
  getFlag,
  setFlag,
  setFlags,
  resetFlags,
  isFounderMode,
  isOpsMode,
  areDangerousActionsEnabled,
  type FeatureFlags,
} from '../lib/feature-flags'

// ─── Setup ───────────────────────────────────────────────────

function setSession(role: string): void {
  localStorage.setItem('founder-hub-session', JSON.stringify({
    userId: 'test-user',
    role,
    expiresAt: Date.now() + 3600000,
  }))
}

function clearSession(): void {
  localStorage.removeItem('founder-hub-session')
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

// ─── Default Flag Safety ─────────────────────────────────────

describe('Default Flag Safety', () => {
  it('dangerousActions defaults to false', () => {
    expect(DEFAULT_FLAGS.dangerousActions).toBe(false)
  })

  it('terminalEnabled defaults to false', () => {
    expect(DEFAULT_FLAGS.terminalEnabled).toBe(false)
  })

  it('founderMode defaults to true', () => {
    expect(DEFAULT_FLAGS.founderMode).toBe(true)
  })

  it('opsMode defaults to false', () => {
    expect(DEFAULT_FLAGS.opsMode).toBe(false)
  })

  it('all security flags default to off', () => {
    const securityFlags = Object.entries(FLAG_CATEGORIES)
      .filter(([, cat]) => cat === 'security')
      .map(([key]) => key as keyof FeatureFlags)
    
    for (const flag of securityFlags) {
      expect(DEFAULT_FLAGS[flag]).toBe(false)
    }
  })
})

// ─── OWNER_ONLY_FLAGS Enforcement ────────────────────────────

describe('OWNER_ONLY_FLAGS Enforcement', () => {
  it('OWNER_ONLY_FLAGS includes all expected flags', () => {
    expect(OWNER_ONLY_FLAGS).toContain('dangerousActions')
    expect(OWNER_ONLY_FLAGS).toContain('terminalEnabled')
    expect(OWNER_ONLY_FLAGS).toContain('debugMode')
    expect(OWNER_ONLY_FLAGS).toContain('mockData')
  })

  it('owner can set owner-only flags via setFlag', () => {
    setSession('owner')
    setFlag('dangerousActions', true)
    expect(getFlag('dangerousActions')).toBe(true)
  })

  it('admin cannot set owner-only flags via setFlag', () => {
    setSession('admin')
    setFlag('dangerousActions', true)
    expect(getFlag('dangerousActions')).toBe(false)
  })

  it('editor cannot set owner-only flags via setFlag', () => {
    setSession('editor')
    setFlag('terminalEnabled', true)
    expect(getFlag('terminalEnabled')).toBe(false)
  })

  it('no session blocks owner-only flags via setFlag', () => {
    clearSession()
    setFlag('dangerousActions', true)
    expect(getFlag('dangerousActions')).toBe(false)
  })

  it('owner can set owner-only flags via setFlags', () => {
    setSession('owner')
    setFlags({ dangerousActions: true, terminalEnabled: true })
    expect(getFlag('dangerousActions')).toBe(true)
    expect(getFlag('terminalEnabled')).toBe(true)
  })

  it('admin cannot set owner-only flags via setFlags', () => {
    setSession('admin')
    setFlags({ dangerousActions: true, opsMode: true })
    // dangerousActions should be blocked, opsMode should pass
    expect(getFlag('dangerousActions')).toBe(false)
    expect(getFlag('opsMode')).toBe(true)
  })

  it('non-owner-only flags remain settable by any role', () => {
    setSession('editor')
    setFlag('darkModeForced', true)
    expect(getFlag('darkModeForced')).toBe(true)
  })

  it('non-owner-only flags settable without session', () => {
    clearSession()
    setFlag('animationsReduced', true)
    expect(getFlag('animationsReduced')).toBe(true)
  })
})

// ─── AUDITED_FLAGS ───────────────────────────────────────────

describe('AUDITED_FLAGS Configuration', () => {
  it('AUDITED_FLAGS includes expected flags', () => {
    expect(AUDITED_FLAGS).toContain('dangerousActions')
    expect(AUDITED_FLAGS).toContain('terminalEnabled')
    expect(AUDITED_FLAGS).toContain('opsMode')
  })

  it('all audited flags are real flag keys', () => {
    const allKeys = Object.keys(DEFAULT_FLAGS)
    for (const flag of AUDITED_FLAGS) {
      expect(allKeys).toContain(flag)
    }
  })
})

// ─── Mode Helpers ────────────────────────────────────────────

describe('Mode Helpers', () => {
  it('isFounderMode returns true by default', () => {
    expect(isFounderMode()).toBe(true)
  })

  it('isOpsMode returns false by default', () => {
    expect(isOpsMode()).toBe(false)
  })

  it('isFounderMode returns false when opsMode is on', () => {
    setSession('owner')
    setFlags({ founderMode: true, opsMode: true })
    expect(isFounderMode()).toBe(false)
  })

  it('isOpsMode returns true when opsMode is set', () => {
    setSession('owner')
    setFlag('opsMode', true)
    expect(isOpsMode()).toBe(true)
  })
})

// ─── Reset Safety ────────────────────────────────────────────

describe('Reset Safety', () => {
  it('resetFlags restores all defaults', () => {
    setSession('owner')
    setFlags({ dangerousActions: true, terminalEnabled: true, opsMode: true })
    resetFlags()
    
    const flags = getFlags()
    expect(flags).toEqual(DEFAULT_FLAGS)
  })

  it('resetFlags disables dangerous actions', () => {
    setSession('owner')
    setFlag('dangerousActions', true)
    expect(areDangerousActionsEnabled()).toBe(true)
    
    resetFlags()
    expect(areDangerousActionsEnabled()).toBe(false)
  })
})

// ─── Capabilities Registry ──────────────────────────────────

describe('Capabilities Registry Integrity', () => {
  it('registry file is valid JSON', async () => {
    // Import the JSON to verify it parses
    const registry = await import('../../governance/admin/capabilities_registry.json')
    expect(registry).toBeDefined()
    expect(registry.version).toBe('1.0.0')
  })

  it('registry roles match ROLE_HIERARCHY', async () => {
    const registry = await import('../../governance/admin/capabilities_registry.json')
    expect(registry.roles.owner.level).toBe(100)
    expect(registry.roles.admin.level).toBe(75)
    expect(registry.roles.editor.level).toBe(50)
    expect(registry.roles.support.level).toBe(25)
  })

  it('registry feature flags match DEFAULT_FLAGS', async () => {
    const registry = await import('../../governance/admin/capabilities_registry.json')
    const registryFlags = registry.featureFlags as Record<string, { default: boolean }>
    
    for (const [key, meta] of Object.entries(registryFlags)) {
      const defaultVal = DEFAULT_FLAGS[key as keyof FeatureFlags]
      expect(meta.default).toBe(defaultVal)
    }
  })

  it('registry owner-only flags match OWNER_ONLY_FLAGS', async () => {
    const registry = await import('../../governance/admin/capabilities_registry.json')
    const registryFlags = registry.featureFlags as Record<string, { ownerOnly: boolean }>
    
    for (const flag of OWNER_ONLY_FLAGS) {
      expect(registryFlags[flag]?.ownerOnly).toBe(true)
    }
  })

  it('registry audited flags match AUDITED_FLAGS', async () => {
    const registry = await import('../../governance/admin/capabilities_registry.json')
    const registryFlags = registry.featureFlags as Record<string, { audited: boolean }>
    
    for (const flag of AUDITED_FLAGS) {
      expect(registryFlags[flag]?.audited).toBe(true)
    }
  })
})

// ─── CustomEvent Dispatch ────────────────────────────────────

describe('Flag Change Events', () => {
  it('setFlag dispatches feature-flags-changed event', () => {
    const handler = vi.fn()
    window.addEventListener('feature-flags-changed', handler)
    
    setFlag('darkModeForced', true)
    
    expect(handler).toHaveBeenCalledTimes(1)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.key).toBe('darkModeForced')
    expect(detail.value).toBe(true)
    
    window.removeEventListener('feature-flags-changed', handler)
  })

  it('setFlags dispatches event with updates', () => {
    const handler = vi.fn()
    window.addEventListener('feature-flags-changed', handler)
    
    setFlags({ darkModeForced: true, animationsReduced: true })
    
    expect(handler).toHaveBeenCalledTimes(1)
    
    window.removeEventListener('feature-flags-changed', handler)
  })

  it('blocked owner-only flag does NOT dispatch event', () => {
    setSession('editor')
    const handler = vi.fn()
    window.addEventListener('feature-flags-changed', handler)
    
    setFlag('dangerousActions', true)
    
    // Should not dispatch because the setter returned early
    expect(handler).not.toHaveBeenCalled()
    
    window.removeEventListener('feature-flags-changed', handler)
  })

  it('resetFlags dispatches event with reset flag', () => {
    const handler = vi.fn()
    window.addEventListener('feature-flags-changed', handler)
    
    resetFlags()
    
    expect(handler).toHaveBeenCalledTimes(1)
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail
    expect(detail.reset).toBe(true)
    
    window.removeEventListener('feature-flags-changed', handler)
  })
})
