/**
 * studio-permissions.ts — Permission layer for the Site Studio.
 *
 * Bridges the existing RBAC system (permissions.ts, route-guards.ts)
 * into studio-specific contexts: DevCustomizer modes, command palette
 * actions, editing hooks, snapshot/bulk operations.
 *
 * HONEST DISCLOSURE:
 * All enforcement in this module is CLIENT-SIDE ONLY.
 * There is no backend API server to enforce these checks.
 * The permission model exists to:
 *   1. Support multi-role preview during development
 *   2. Gate destructive actions behind clear role boundaries
 *   3. Prepare for future server-side enforcement
 * Anyone with browser devtools can bypass these checks.
 */

import { useSyncExternalStore, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { hasPermission, hasMinimumRole, type Permission } from '@/lib/permissions'
import type { UserRole } from '@/lib/types'

// ─── Studio Permission Definitions ──────────────────────────────────────────

/**
 * Studio-specific permissions mapped to the existing Permission type.
 * Each studio action maps to the most appropriate existing permission.
 */
export type StudioAction =
  // Viewing
  | 'studio:view'
  // Section operations
  | 'studio:section-reorder'
  | 'studio:section-add'
  | 'studio:section-remove'
  | 'studio:section-duplicate'
  // Inspector editing
  | 'studio:inspect-props'
  | 'studio:edit-props'
  // Collection editing
  | 'studio:view-collection'
  | 'studio:edit-collection'
  // Snapshot operations
  | 'studio:export-snapshot'
  | 'studio:import-snapshot'
  | 'studio:manage-snapshots'
  // Bulk operations
  | 'studio:bulk-ops'
  // Audit & Governance
  | 'studio:run-audit'
  | 'studio:view-governance'
  // History
  | 'studio:view-history'
  | 'studio:undo-redo'
  // Command palette
  | 'studio:command-palette'
  // AI suggestions
  | 'studio:ai-suggest'
  | 'studio:ai-accept'
  // Style editing
  | 'studio:edit-style'
  // Workspace
  | 'studio:view-workspace'
  | 'studio:switch-site'

/**
 * Maps each studio action to the existing Permission type.
 * This avoids creating a parallel permission system — studio actions
 * resolve to the same permissions enforced elsewhere.
 */
const STUDIO_ACTION_MAP: Record<StudioAction, Permission> = {
  'studio:view':              'content:read',
  'studio:section-reorder':   'content:edit',
  'studio:section-add':       'content:edit',
  'studio:section-remove':    'content:delete',
  'studio:section-duplicate': 'content:edit',
  'studio:inspect-props':     'content:read',
  'studio:edit-props':        'content:edit',
  'studio:view-collection':   'content:read',
  'studio:edit-collection':   'content:edit',
  'studio:export-snapshot':   'export:data',
  'studio:import-snapshot':   'settings:edit',
  'studio:manage-snapshots':  'settings:edit',
  'studio:bulk-ops':          'content:edit',
  'studio:run-audit':         'audit:read',
  'studio:view-governance':   'audit:read',
  'studio:view-history':      'audit:read',
  'studio:undo-redo':         'content:edit',
  'studio:command-palette':   'content:read',
  'studio:ai-suggest':        'content:edit',
  'studio:ai-accept':         'content:edit',
  'studio:edit-style':        'settings:edit',
  'studio:view-workspace':    'settings:read',
  'studio:switch-site':       'settings:read',
}

/**
 * Human-readable denial reasons for each studio action.
 */
const DENIAL_REASONS: Record<StudioAction, string> = {
  'studio:view':              'Viewing requires content:read permission',
  'studio:section-reorder':   'Reordering sections requires editor role or higher',
  'studio:section-add':       'Adding sections requires editor role or higher',
  'studio:section-remove':    'Removing sections requires admin role or higher',
  'studio:section-duplicate': 'Duplicating sections requires editor role or higher',
  'studio:inspect-props':     'Inspecting properties requires content:read permission',
  'studio:edit-props':        'Editing properties requires editor role or higher',
  'studio:view-collection':   'Viewing collections requires content:read permission',
  'studio:edit-collection':   'Editing collections requires editor role or higher',
  'studio:export-snapshot':   'Exporting snapshots requires admin role or higher',
  'studio:import-snapshot':   'Importing snapshots requires admin role or higher',
  'studio:manage-snapshots':  'Managing safety snapshots requires admin role or higher',
  'studio:bulk-ops':          'Bulk operations require editor role or higher',
  'studio:run-audit':         'Running audits requires admin role or higher',
  'studio:view-governance':   'Governance dashboard requires admin role or higher',
  'studio:view-history':      'Viewing history requires admin role or higher',
  'studio:undo-redo':         'Undo/redo requires editor role or higher',
  'studio:command-palette':   'Command palette requires content:read permission',
  'studio:ai-suggest':        'AI suggestions require editor role or higher',
  'studio:ai-accept':         'Accepting AI proposals requires editor role or higher',
  'studio:edit-style':        'Style editing requires admin role or higher',
  'studio:view-workspace':    'Workspace view requires admin role or higher',
  'studio:switch-site':       'Switching workspace sites requires admin role or higher',
}

// ─── Dev Role Simulation ────────────────────────────────────────────────────

/**
 * Dev-only role simulation store.
 * When active, overrides the real session role for UI testing.
 * Clearly labeled as simulation — not real security.
 */

let simulatedRole: UserRole | null = null
const simListeners = new Set<() => void>()

function notifySimListeners() {
  for (const fn of simListeners) {
    try { fn() } catch { /* swallow */ }
  }
}

export function getSimulatedRole(): UserRole | null {
  return simulatedRole
}

export function setSimulatedRole(role: UserRole | null): void {
  simulatedRole = role
  notifySimListeners()
}

function subscribeSimRole(callback: () => void): () => void {
  simListeners.add(callback)
  return () => { simListeners.delete(callback) }
}

function getSimSnapshot(): UserRole | null {
  return simulatedRole
}

// ─── Core Check Functions ───────────────────────────────────────────────────

/**
 * Check if a role can perform a studio action.
 * Pure function — no hooks, no side effects.
 */
export function canPerformStudioAction(role: UserRole, action: StudioAction): boolean {
  const permission = STUDIO_ACTION_MAP[action]
  return hasPermission(role, permission)
}

/**
 * Get the denial reason for a studio action.
 */
export function getStudioDenialReason(action: StudioAction): string {
  return DENIAL_REASONS[action]
}

/**
 * Enforce a studio action — throws if denied.
 * CLIENT-SIDE ONLY. See module docstring.
 */
export function enforceStudioAction(role: UserRole, action: StudioAction): void {
  if (!canPerformStudioAction(role, action)) {
    throw new Error(DENIAL_REASONS[action])
  }
}

// ─── Non-React Role Resolution ──────────────────────────────────────────────

const STORAGE_PREFIX = 'xtx396:'
const SESSION_KEY = 'founder-hub-session'

/**
 * Resolve effective role outside React context.
 * Reads simulated role first, falls back to session in localStorage.
 * Returns 'support' (minimum privilege) if no session found.
 * For use in async action-layer functions like bulk-ops and snapshot import.
 */
export function getEffectiveRole(): UserRole {
  const sim = getSimulatedRole()
  if (sim) return sim
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${SESSION_KEY}`)
    if (raw) {
      const session = JSON.parse(raw) as { role?: UserRole; expiresAt?: number }
      if (session.role && session.expiresAt && session.expiresAt > Date.now()) {
        return session.role
      }
    }
  } catch { /* corrupted session — fall through */ }
  return 'support'
}

/**
 * Enforce a studio action using the current effective role.
 * Convenience wrapper for non-React code.
 */
export function enforceCurrentRole(action: StudioAction): void {
  enforceStudioAction(getEffectiveRole(), action)
}

// ─── DevCustomizer Mode Permissions ─────────────────────────────────────────

type CustomizerMode = 'navigate' | 'inspect' | 'content' | 'style' | 'workspace' |
  'editor' | 'chat' | 'components' | 'preview' | 'structure' | 'inspector' |
  'collection' | 'history' | 'audit' | 'diff'

/**
 * Maps each DevCustomizer mode to the minimum studio action required.
 */
const MODE_REQUIRED_ACTION: Record<CustomizerMode, StudioAction> = {
  navigate:   'studio:view',
  inspect:    'studio:inspect-props',
  content:    'studio:view',
  style:      'studio:edit-style',
  workspace:  'studio:view-workspace',
  editor:     'studio:edit-props',
  chat:       'studio:view',
  components: 'studio:view',
  preview:    'studio:view',
  structure:  'studio:section-reorder',
  inspector:  'studio:inspect-props',
  collection: 'studio:view-collection',
  history:    'studio:view-history',
  diff:       'studio:view-history',
  audit:      'studio:run-audit',
}

/**
 * Check if a role can access a DevCustomizer mode.
 */
export function canAccessMode(role: UserRole, mode: CustomizerMode): boolean {
  const action = MODE_REQUIRED_ACTION[mode]
  return canPerformStudioAction(role, action)
}

// ─── Command Permission Map ─────────────────────────────────────────────────

/**
 * Maps command IDs to required studio actions.
 * Commands not listed here default to 'studio:view'.
 */
const COMMAND_REQUIRED_ACTION: Record<string, StudioAction> = {
  'section-add':                'studio:section-add',
  'section-remove':             'studio:section-remove',
  'section-duplicate':          'studio:section-duplicate',
  'section-move-top':           'studio:section-reorder',
  'section-move-bottom':        'studio:section-reorder',
  'collection-add-item':        'studio:edit-collection',
  'snapshot-export':            'studio:export-snapshot',
  'snapshot-import':            'studio:import-snapshot',
  'snapshot-clear':             'studio:manage-snapshots',
  'audit-run':                  'studio:run-audit',
  'governance-view':            'studio:view-governance',
  'nav-clear-selection':        'studio:view',
  'bulk-enable-all-sections':   'studio:bulk-ops',
  'bulk-disable-non-essential': 'studio:bulk-ops',
  'bulk-sort-sections-alpha':   'studio:bulk-ops',
  'bulk-normalize-project-titles': 'studio:bulk-ops',
  'ai-improve-description':     'studio:ai-suggest',
  'ai-suggest-tags':            'studio:ai-suggest',
  'ai-accept-proposal':         'studio:ai-accept',
  'site-switch':                'studio:switch-site',
}

/**
 * Get the required studio action for a command.
 */
export function getCommandRequiredAction(commandId: string): StudioAction {
  return COMMAND_REQUIRED_ACTION[commandId] ?? 'studio:view'
}

/**
 * Check if a role can execute a command.
 */
export function canExecuteCommand(role: UserRole, commandId: string): boolean {
  const action = getCommandRequiredAction(commandId)
  return canPerformStudioAction(role, action)
}

// ─── React Hook ─────────────────────────────────────────────────────────────

export interface StudioPermissions {
  /** Effective role (simulated if active, else real session role) */
  effectiveRole: UserRole
  /** Whether role simulation is active */
  isSimulated: boolean
  /** Whether the user is authenticated at all */
  isAuthenticated: boolean
  /** Check if a studio action is allowed */
  can: (action: StudioAction) => boolean
  /** Get denial reason for a studio action */
  why: (action: StudioAction) => string
  /** Check if a DevCustomizer mode is accessible */
  canAccessMode: (mode: string) => boolean
  /** Check if a command can be executed */
  canExecuteCommand: (commandId: string) => boolean
  /** Minimum role check */
  hasMinimumRole: (requiredRole: UserRole) => boolean
  /** Set simulated role (dev only) */
  setSimulatedRole: (role: UserRole | null) => void
}

/**
 * React hook for studio permission checks.
 * Uses real auth role by default; falls back to dev simulation if active.
 *
 * CLIENT-SIDE ONLY — see module docstring.
 */
export function useStudioPermissions(): StudioPermissions {
  const { currentUser, isAuthenticated } = useAuth()
  const simRole = useSyncExternalStore(subscribeSimRole, getSimSnapshot)

  // Effective role: simulation overrides real role (dev only)
  const realRole: UserRole = currentUser?.role ?? 'support'
  const effectiveRole: UserRole = simRole ?? realRole

  const can = useCallback(
    (action: StudioAction): boolean => canPerformStudioAction(effectiveRole, action),
    [effectiveRole],
  )

  const why = useCallback(
    (action: StudioAction): string => DENIAL_REASONS[action],
    [],
  )

  const checkMode = useCallback(
    (mode: string): boolean => {
      const action = MODE_REQUIRED_ACTION[mode as CustomizerMode]
      if (!action) return true // unknown modes default to accessible
      return canPerformStudioAction(effectiveRole, action)
    },
    [effectiveRole],
  )

  const checkCommand = useCallback(
    (commandId: string): boolean => canExecuteCommand(effectiveRole, commandId),
    [effectiveRole],
  )

  const checkMinRole = useCallback(
    (requiredRole: UserRole): boolean => hasMinimumRole(effectiveRole, requiredRole),
    [effectiveRole],
  )

  return {
    effectiveRole,
    isSimulated: simRole !== null,
    isAuthenticated,
    can,
    why,
    canAccessMode: checkMode,
    canExecuteCommand: checkCommand,
    hasMinimumRole: checkMinRole,
    setSimulatedRole,
  }
}
