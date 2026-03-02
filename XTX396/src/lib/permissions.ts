/**
 * RBAC Permissions Module
 * Chain A2 — Single source of truth for role-based access control
 * 
 * PRINCIPLES:
 * 1. UI hides actions AND services enforce them (no security by CSS)
 * 2. All enforcement is centralized and testable
 * 3. Permissions are explicit — no implicit grants
 */

import type { UserRole } from './types'

// ─── Role Hierarchy ──────────────────────────────────────────

/**
 * Role hierarchy (highest to lowest):
 * - owner: Full system access, production deploys, user management
 * - admin: Operations + deploy to preview/staging, no prod deploys
 * - editor: Content editing only, no destructive actions
 * - support: Read-only + ticket notes, no edits
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 100,
  admin: 75,
  editor: 50,
  support: 25,
}

/**
 * Check if a role is at least as powerful as another
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

// ─── Permission Definitions ──────────────────────────────────

/**
 * All system permissions — granular actions that can be controlled
 */
export type Permission =
  // Content permissions
  | 'content:read'
  | 'content:edit'
  | 'content:delete'
  // Deployment permissions
  | 'deploy:preview'
  | 'deploy:staging'
  | 'deploy:production'
  // Publishing
  | 'publish:execute'
  | 'export:data'
  // User management
  | 'users:read'
  | 'users:edit'
  | 'users:delete'
  | 'users:manage-roles'
  // System configuration
  | 'settings:read'
  | 'settings:edit'
  | 'security:read'
  | 'security:edit'
  // Audit
  | 'audit:read'
  | 'audit:export'
  // Cases & Documents
  | 'cases:read'
  | 'cases:edit'
  | 'cases:delete'
  | 'documents:read'
  | 'documents:edit'
  | 'documents:delete'
  // Assets
  | 'assets:read'
  | 'assets:upload'
  | 'assets:delete'
  // Support-specific
  | 'tickets:read'
  | 'tickets:note'
  // Dangerous actions (gated by feature flag)
  | 'dangerous:bulk-delete'
  | 'dangerous:wipe-data'
  | 'dangerous:disable-2fa'

/**
 * Permission matrix — defines what each role can do
 * This is the SINGLE SOURCE OF TRUTH for all access control
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    // Owner can do everything
    'content:read', 'content:edit', 'content:delete',
    'deploy:preview', 'deploy:staging', 'deploy:production',
    'publish:execute', 'export:data',
    'users:read', 'users:edit', 'users:delete', 'users:manage-roles',
    'settings:read', 'settings:edit',
    'security:read', 'security:edit',
    'audit:read', 'audit:export',
    'cases:read', 'cases:edit', 'cases:delete',
    'documents:read', 'documents:edit', 'documents:delete',
    'assets:read', 'assets:upload', 'assets:delete',
    'tickets:read', 'tickets:note',
    'dangerous:bulk-delete', 'dangerous:wipe-data', 'dangerous:disable-2fa',
  ],
  admin: [
    // Admin: ops + deploy (no prod, no user role management, no dangerous)
    'content:read', 'content:edit', 'content:delete',
    'deploy:preview', 'deploy:staging',
    'publish:execute', // With confirmation
    'users:read', 'users:edit',
    'settings:read', 'settings:edit',
    'security:read',
    'audit:read',
    'cases:read', 'cases:edit', 'cases:delete',
    'documents:read', 'documents:edit', 'documents:delete',
    'assets:read', 'assets:upload', 'assets:delete',
    'tickets:read', 'tickets:note',
  ],
  editor: [
    // Editor: content only, no destructive actions
    'content:read', 'content:edit',
    'settings:read',
    'audit:read',
    'cases:read', 'cases:edit',
    'documents:read', 'documents:edit',
    'assets:read', 'assets:upload',
    'tickets:read',
  ],
  support: [
    // Support: read-only + ticket notes
    'content:read',
    'settings:read',
    'audit:read',
    'cases:read',
    'documents:read',
    'assets:read',
    'tickets:read', 'tickets:note',
  ],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

// ─── Route Guards ────────────────────────────────────────────

/**
 * Admin route definitions with minimum role requirements
 */
export const ROUTE_PERMISSIONS: Record<string, UserRole> = {
  // Content routes - editor+
  'content': 'editor',
  'about': 'editor',
  'links': 'editor',
  'profile': 'editor',
  'hero-media': 'editor',
  'visual-modules': 'editor',
  'honor-flag-bar': 'editor',
  'investor': 'editor',
  'offerings': 'editor',
  'evident': 'editor',
  'projects': 'editor',
  'court': 'editor',
  'documents': 'editor',
  'case-jackets': 'editor',
  'templates': 'editor',
  'inbox': 'editor',
  'upload': 'editor',
  'assets': 'editor',
  'leads': 'editor',
  
  // Admin routes - admin+
  'sites': 'admin',
  'staging': 'admin',
  'filing-types': 'admin',
  'client-sites': 'admin',
  'law-firm': 'admin',
  'smb-template': 'admin',
  'agency': 'admin',
  'theme': 'admin',
  'audit': 'admin',
  
  // System routes - admin+
  'session-security': 'admin',
  'runtime-policy': 'admin',
  'deployments': 'admin',
  'provenance': 'admin',
  'incidents': 'admin',
  'audit-integrity': 'admin',
  
  // Owner routes - owner only
  'settings': 'owner',
  'security': 'owner',
  'asset-policy': 'owner',
}

/**
 * Check if a role can access a route
 */
export function canAccessRoute(role: UserRole, routeId: string): boolean {
  const requiredRole = ROUTE_PERMISSIONS[routeId]
  if (!requiredRole) {
    // Route not defined — default to owner-only for safety
    console.warn(`[permissions] Route "${routeId}" not in ROUTE_PERMISSIONS, defaulting to owner-only`)
    return role === 'owner'
  }
  return hasMinimumRole(role, requiredRole)
}

/**
 * Filter navigation items by role
 */
export function filterNavByRole<T extends { id: string }>(
  navItems: T[],
  role: UserRole
): T[] {
  return navItems.filter(item => canAccessRoute(role, item.id))
}

// ─── Action Guards ───────────────────────────────────────────

/**
 * Action definitions with permission requirements
 */
export interface ActionGuard {
  permission: Permission
  requiresConfirmation?: boolean
  confirmationType?: 'simple' | 'typed'
  confirmationText?: string
  auditRequired?: boolean
}

export const ACTION_GUARDS: Record<string, ActionGuard> = {
  // Publishing
  'publish': {
    permission: 'publish:execute',
    requiresConfirmation: true,
    confirmationType: 'typed',
    confirmationText: 'PUBLISH',
    auditRequired: true,
  },
  'export-data': {
    permission: 'export:data',
    requiresConfirmation: true,
    confirmationType: 'typed',
    confirmationText: 'EXPORT',
    auditRequired: true,
  },
  // Deployments
  'deploy-preview': {
    permission: 'deploy:preview',
    requiresConfirmation: true,
    confirmationType: 'simple',
    auditRequired: true,
  },
  'deploy-staging': {
    permission: 'deploy:staging',
    requiresConfirmation: true,
    confirmationType: 'simple',
    auditRequired: true,
  },
  'deploy-production': {
    permission: 'deploy:production',
    requiresConfirmation: true,
    confirmationType: 'typed',
    confirmationText: 'DEPLOY-PROD',
    auditRequired: true,
  },
  // Content deletion
  'delete-content': {
    permission: 'content:delete',
    requiresConfirmation: true,
    confirmationType: 'simple',
    auditRequired: true,
  },
  'delete-document': {
    permission: 'documents:delete',
    requiresConfirmation: true,
    confirmationType: 'typed',
    auditRequired: true,
  },
  'delete-case': {
    permission: 'cases:delete',
    requiresConfirmation: true,
    confirmationType: 'typed',
    auditRequired: true,
  },
  // User management
  'delete-user': {
    permission: 'users:delete',
    requiresConfirmation: true,
    confirmationType: 'typed',
    confirmationText: 'DELETE-USER',
    auditRequired: true,
  },
  'change-user-role': {
    permission: 'users:manage-roles',
    requiresConfirmation: true,
    confirmationType: 'simple',
    auditRequired: true,
  },
  // Security
  'disable-2fa': {
    permission: 'dangerous:disable-2fa',
    requiresConfirmation: true,
    confirmationType: 'typed',
    confirmationText: 'DISABLE-2FA',
    auditRequired: true,
  },
  'clear-github-token': {
    permission: 'security:edit',
    requiresConfirmation: true,
    confirmationType: 'simple',
    auditRequired: true,
  },
  // Dangerous
  'bulk-delete': {
    permission: 'dangerous:bulk-delete',
    requiresConfirmation: true,
    confirmationType: 'typed',
    confirmationText: 'BULK-DELETE',
    auditRequired: true,
  },
  'wipe-data': {
    permission: 'dangerous:wipe-data',
    requiresConfirmation: true,
    confirmationType: 'typed',
    confirmationText: 'WIPE-ALL-DATA',
    auditRequired: true,
  },
}

/**
 * Check if a role can execute an action
 */
export function canExecuteAction(role: UserRole, actionId: string): boolean {
  const guard = ACTION_GUARDS[actionId]
  if (!guard) {
    console.warn(`[permissions] Action "${actionId}" not in ACTION_GUARDS, defaulting to denied`)
    return false
  }
  return hasPermission(role, guard.permission)
}

/**
 * Get action guard configuration
 */
export function getActionGuard(actionId: string): ActionGuard | undefined {
  return ACTION_GUARDS[actionId]
}

// ─── Service-Level Enforcement ───────────────────────────────

/**
 * Guard function for service methods
 * Throws if permission is denied — use at service boundaries
 */
export function enforcePermission(
  role: UserRole,
  permission: Permission,
  context?: string
): void {
  if (!hasPermission(role, permission)) {
    const message = context
      ? `Permission denied: ${permission} (${context})`
      : `Permission denied: ${permission}`
    console.error(`[permissions] ${message} for role: ${role}`)
    throw new PermissionDeniedError(permission, role, context)
  }
}

/**
 * Guard function for route access
 * Throws if route access is denied
 */
export function enforceRouteAccess(role: UserRole, routeId: string): void {
  if (!canAccessRoute(role, routeId)) {
    const requiredRole = ROUTE_PERMISSIONS[routeId] ?? 'owner'
    throw new PermissionDeniedError(
      `route:${routeId}` as Permission,
      role,
      `Requires ${requiredRole} role or higher`
    )
  }
}

/**
 * Guard function for action execution
 * Throws if action is denied
 */
export function enforceAction(role: UserRole, actionId: string): ActionGuard {
  const guard = ACTION_GUARDS[actionId]
  if (!guard) {
    throw new PermissionDeniedError(
      'unknown' as Permission,
      role,
      `Unknown action: ${actionId}`
    )
  }
  if (!hasPermission(role, guard.permission)) {
    throw new PermissionDeniedError(guard.permission, role, `Action: ${actionId}`)
  }
  return guard
}

// ─── Error Types ─────────────────────────────────────────────

export class PermissionDeniedError extends Error {
  public readonly permission: Permission | string
  public readonly role: UserRole
  public readonly context?: string

  constructor(permission: Permission | string, role: UserRole, context?: string) {
    const message = context
      ? `Permission denied: ${permission} for role ${role} (${context})`
      : `Permission denied: ${permission} for role ${role}`
    super(message)
    this.name = 'PermissionDeniedError'
    this.permission = permission
    this.role = role
    this.context = context
  }
}

// ─── Type Exports ────────────────────────────────────────────

export type { UserRole }
