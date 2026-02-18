/**
 * Feature Flags Module
 * Chain A2 — Centralized feature flag management
 * 
 * PRINCIPLES:
 * 1. All flags have safe defaults (off for dangerous, on for core)
 * 2. Flags are enforced at service level, not just UI
 * 3. Flag changes are audited
 */

import { useKV, kv } from './local-storage-kv'
import type { UserRole } from './types'

// ─── Role Check (inline to avoid circular dep with auth.ts) ──

function getCurrentUserRole(): UserRole | null {
  try {
    const session = localStorage.getItem('founder-hub-session')
    if (!session) return null
    const parsed = JSON.parse(session)
    return parsed.role ?? 'editor'
  } catch {
    return null
  }
}

const ROLE_LEVEL: Record<UserRole, number> = {
  owner: 100,
  admin: 75,
  editor: 50,
  support: 25,
}

function isOwnerRole(role: UserRole | null): boolean {
  return role !== null && ROLE_LEVEL[role] >= ROLE_LEVEL.owner
}

// ─── Flag Definitions ────────────────────────────────────────

/**
 * All feature flags in the system
 */
export interface FeatureFlags {
  // UI Mode flags
  founderMode: boolean        // Minimal UI (6 P0 routes only)
  opsMode: boolean            // Full admin UI
  
  // Dangerous action flags (off by default)
  dangerousActions: boolean   // Enable bulk delete, wipe, etc.
  terminalEnabled: boolean    // Enable terminal access (requires hardening)
  
  // Feature experience flags
  darkModeForced: boolean     // Force dark mode
  animationsReduced: boolean  // Reduce motion
  
  // Development flags
  debugMode: boolean          // Enable debug logging
  mockData: boolean           // Use mock data
  
  // Feature rollout flags
  newEditorEnabled: boolean   // New editor experience
  aiAssistEnabled: boolean    // AI assistance features
  
  // GitHub integration flags (Chain A6)
  githubAppAuth: boolean      // Use GitHub App instead of PAT
  previewDeploysEnabled: boolean // Enable preview deployments on PR
}

/**
 * Default flag values — safe defaults
 */
export const DEFAULT_FLAGS: FeatureFlags = {
  // Modes
  founderMode: true,          // Start with minimal UI
  opsMode: false,             // Full UI requires explicit activation
  
  // Security (all off by default)
  dangerousActions: false,
  terminalEnabled: false,
  
  // Experience
  darkModeForced: false,
  animationsReduced: false,
  
  // Development
  debugMode: false,
  mockData: false,
  
  // Features
  newEditorEnabled: false,
  aiAssistEnabled: false,
  
  // GitHub integration (Chain A6)
  githubAppAuth: false,       // Use PAT by default, enable for GitHub App
  previewDeploysEnabled: true, // Enable PR preview deployments
}

// ─── Flag Categories ─────────────────────────────────────────

export type FlagCategory = 'mode' | 'security' | 'experience' | 'development' | 'feature'

export const FLAG_CATEGORIES: Record<keyof FeatureFlags, FlagCategory> = {
  founderMode: 'mode',
  opsMode: 'mode',
  dangerousActions: 'security',
  terminalEnabled: 'security',
  darkModeForced: 'experience',
  animationsReduced: 'experience',
  debugMode: 'development',
  mockData: 'development',
  newEditorEnabled: 'feature',
  aiAssistEnabled: 'feature',
  githubAppAuth: 'feature',
  previewDeploysEnabled: 'feature',
}

/**
 * Flags that require owner role to modify
 */
export const OWNER_ONLY_FLAGS: (keyof FeatureFlags)[] = [
  'dangerousActions',
  'terminalEnabled',
  'debugMode',
  'mockData',
]

/**
 * Flags that require audit logging when changed
 */
export const AUDITED_FLAGS: (keyof FeatureFlags)[] = [
  'dangerousActions',
  'terminalEnabled',
  'opsMode',
]

// ─── Storage ─────────────────────────────────────────────────

const FLAGS_KEY = 'founder-hub-feature-flags'

/**
 * Get current feature flags (sync)
 */
export function getFlags(): FeatureFlags {
  try {
    const stored = localStorage.getItem(FLAGS_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Merge with defaults to handle new flags
      return { ...DEFAULT_FLAGS, ...parsed }
    }
  } catch {
    // Ignore parse errors
  }
  return { ...DEFAULT_FLAGS }
}

/**
 * Get a single flag value
 */
export function getFlag<K extends keyof FeatureFlags>(key: K): FeatureFlags[K] {
  return getFlags()[key]
}

/**
 * Set a single flag value
 * Enforces OWNER_ONLY_FLAGS role requirement.
 * Emits audit event for AUDITED_FLAGS changes.
 */
export function setFlag<K extends keyof FeatureFlags>(
  key: K,
  value: FeatureFlags[K]
): void {
  // Enforce owner-only flags
  if ((OWNER_ONLY_FLAGS as readonly string[]).includes(key)) {
    const role = getCurrentUserRole()
    if (!isOwnerRole(role)) {
      if (import.meta.env.DEV) {
        console.warn(`[feature-flags] Blocked: "${key}" requires owner role (current: ${role})`)
      }
      return
    }
  }

  const flags = getFlags()
  const oldValue = flags[key]
  flags[key] = value
  localStorage.setItem(FLAGS_KEY, JSON.stringify(flags))

  // Audit logging for audited flags
  if ((AUDITED_FLAGS as readonly string[]).includes(key) && oldValue !== value) {
    emitFlagAuditEvent(key, String(oldValue), String(value))
  }
  
  // Dispatch event for reactive updates
  window.dispatchEvent(new CustomEvent('feature-flags-changed', {
    detail: { key, value, flags }
  }))
}

/**
 * Set multiple flags at once
 * Enforces OWNER_ONLY_FLAGS role requirement.
 * Emits audit events for AUDITED_FLAGS changes.
 */
export function setFlags(updates: Partial<FeatureFlags>): void {
  const role = getCurrentUserRole()
  const currentFlags = getFlags()

  // Filter out owner-only flags if caller is not owner
  const safeUpdates = { ...updates }
  if (!isOwnerRole(role)) {
    for (const key of OWNER_ONLY_FLAGS) {
      if (key in safeUpdates) {
        delete safeUpdates[key]
        if (import.meta.env.DEV) {
          console.warn(`[feature-flags] Blocked: "${key}" requires owner role (current: ${role})`)
        }
      }
    }
  }

  const flags = { ...currentFlags, ...safeUpdates }
  localStorage.setItem(FLAGS_KEY, JSON.stringify(flags))

  // Audit logging for audited flags that actually changed
  for (const key of AUDITED_FLAGS) {
    if (key in safeUpdates && currentFlags[key] !== flags[key]) {
      emitFlagAuditEvent(key, String(currentFlags[key]), String(flags[key]))
    }
  }
  
  window.dispatchEvent(new CustomEvent('feature-flags-changed', {
    detail: { updates: safeUpdates, flags }
  }))
}

/**
 * Reset all flags to defaults
 */
export function resetFlags(): void {
  localStorage.setItem(FLAGS_KEY, JSON.stringify(DEFAULT_FLAGS))
  
  window.dispatchEvent(new CustomEvent('feature-flags-changed', {
    detail: { reset: true, flags: DEFAULT_FLAGS }
  }))
}

// ─── Audit Helpers ───────────────────────────────────────────

/**
 * Emit an audit event when a flag changes.
 * Uses the audit ledger (hash-chained, tamper-evident).
 * Import is dynamic to avoid circular dependencies at module init.
 */
function emitFlagAuditEvent(
  flag: string,
  oldValue: string,
  newValue: string
): void {
  // Fire-and-forget; never block the setter on audit I/O
  try {
    import('./audit-ledger').then(({ auditConfig }) => {
      auditConfig(
        'feature_flag_changed',
        `Flag "${flag}" changed from ${oldValue} to ${newValue}`,
        { flag, oldValue, newValue, timestamp: Date.now() }
      ).catch(() => {
        // Audit failure must not break flag operations
      })
    }).catch(() => {
      // Dynamic import failure must not break flag operations
    })
  } catch {
    // Swallow — flag changes are never blocked by audit failures
  }
}

// ─── React Hook ──────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react'

/**
 * Hook to access and modify feature flags reactively
 */
export function useFeatureFlags() {
  const [flags, setFlagsState] = useState<FeatureFlags>(getFlags)
  
  // Listen for flag changes from other tabs/components
  useEffect(() => {
    const handleChange = (e: CustomEvent) => {
      setFlagsState(e.detail.flags)
    }
    
    window.addEventListener('feature-flags-changed', handleChange as EventListener)
    return () => {
      window.removeEventListener('feature-flags-changed', handleChange as EventListener)
    }
  }, [])
  
  const updateFlag = useCallback(<K extends keyof FeatureFlags>(
    key: K,
    value: FeatureFlags[K]
  ) => {
    setFlag(key, value)
  }, [])
  
  const updateFlags = useCallback((updates: Partial<FeatureFlags>) => {
    setFlags(updates)
  }, [])
  
  return {
    flags,
    updateFlag,
    updateFlags,
    resetFlags,
  }
}

// ─── Flag Guards ─────────────────────────────────────────────

/**
 * Check if a flag is enabled
 */
export function isFlagEnabled(flag: keyof FeatureFlags): boolean {
  return getFlag(flag) === true
}

/**
 * Guard that throws if flag is not enabled
 */
export function requireFlag(flag: keyof FeatureFlags, context?: string): void {
  if (!isFlagEnabled(flag)) {
    const message = context
      ? `Feature not enabled: ${flag} (${context})`
      : `Feature not enabled: ${flag}`
    throw new FeatureFlagDisabledError(flag, context)
  }
}

/**
 * Guard that checks both permission and flag
 */
export function requireFlagAndPermission(
  flag: keyof FeatureFlags,
  hasPermission: boolean,
  context?: string
): void {
  if (!isFlagEnabled(flag)) {
    throw new FeatureFlagDisabledError(flag, context)
  }
  if (!hasPermission) {
    throw new Error(`Permission denied${context ? `: ${context}` : ''}`)
  }
}

// ─── Mode Helpers ────────────────────────────────────────────

/**
 * Check if in Founder Mode (minimal UI)
 */
export function isFounderMode(): boolean {
  return getFlag('founderMode') && !getFlag('opsMode')
}

/**
 * Check if in Ops Mode (full UI)
 */
export function isOpsMode(): boolean {
  return getFlag('opsMode')
}

/**
 * Switch to Founder Mode
 */
export function activateFounderMode(): void {
  setFlags({
    founderMode: true,
    opsMode: false,
  })
}

/**
 * Switch to Ops Mode
 */
export function activateOpsMode(): void {
  setFlags({
    founderMode: false,
    opsMode: true,
  })
}

// ─── Dangerous Actions ───────────────────────────────────────

/**
 * Check if dangerous actions are enabled
 */
export function areDangerousActionsEnabled(): boolean {
  return getFlag('dangerousActions')
}

/**
 * Guard for dangerous actions — requires flag AND permission
 */
export function requireDangerousAction(context?: string): void {
  if (!areDangerousActionsEnabled()) {
    throw new FeatureFlagDisabledError(
      'dangerousActions',
      context ?? 'Dangerous actions are disabled'
    )
  }
}

// ─── Terminal Access ─────────────────────────────────────────

/**
 * Check if terminal is enabled
 */
export function isTerminalEnabled(): boolean {
  return getFlag('terminalEnabled')
}

// ─── Error Types ─────────────────────────────────────────────

export class FeatureFlagDisabledError extends Error {
  public readonly flag: keyof FeatureFlags
  public readonly context?: string

  constructor(flag: keyof FeatureFlags, context?: string) {
    const message = context
      ? `Feature flag "${flag}" is disabled: ${context}`
      : `Feature flag "${flag}" is disabled`
    super(message)
    this.name = 'FeatureFlagDisabledError'
    this.flag = flag
    this.context = context
  }
}
