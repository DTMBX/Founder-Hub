/**
 * Route Guards Hook
 * Chain A2 — React hooks for route and action authorization
 *
 * USAGE:
 * - useRouteGuard() — check route access
 * - useActionGuard() — check action permission
 * - usePermissions() — full permissions context
 */

import { useCallback, useMemo } from 'react'
import { useAuth } from './auth'
import {
  canAccessRoute,
  canExecuteAction,
  hasPermission,
  hasMinimumRole,
  filterNavByRole,
  getActionGuard,
  enforcePermission,
  enforceRouteAccess,
  enforceAction,
  ROUTE_PERMISSIONS,
  ACTION_GUARDS,
  PermissionDeniedError,
  type Permission,
  type ActionGuard,
} from './permissions'
import {
  useFeatureFlags,
  isFounderMode,
  isOpsMode,
  areDangerousActionsEnabled,
  isTerminalEnabled,
} from './feature-flags'
import type { UserRole } from './types'

// ─── Founder Mode Routes ─────────────────────────────────────

/**
 * Routes available in Founder Mode (P0 daily routes only)
 */
export const FOUNDER_MODE_ROUTES = [
  'overview',
  'content',
  'inbox',
  'leads',
  'sites',
  'projects',
  'upload',
]

// ─── usePermissions Hook ─────────────────────────────────────

export interface PermissionsContext {
  // User info
  role: UserRole
  isAuthenticated: boolean
  isLoading: boolean
  
  // Route access
  canAccessRoute: (routeId: string) => boolean
  filterNavItems: <T extends { id: string }>(items: T[]) => T[]
  
  // Action permissions
  canExecuteAction: (actionId: string) => boolean
  hasPermission: (permission: Permission) => boolean
  hasMinimumRole: (requiredRole: UserRole) => boolean
  getActionGuard: (actionId: string) => ActionGuard | undefined
  
  // Enforcement (throws on failure)
  enforcePermission: (permission: Permission, context?: string) => void
  enforceRouteAccess: (routeId: string) => void
  enforceAction: (actionId: string) => ActionGuard
  
  // Feature flags
  isFounderMode: boolean
  isOpsMode: boolean
  dangerousActionsEnabled: boolean
  terminalEnabled: boolean
  
  // Combined checks
  canAccessRouteInCurrentMode: (routeId: string) => boolean
}

/**
 * Main permissions hook — provides full authorization context
 */
export function usePermissions(): PermissionsContext {
  const { currentUser, isAuthenticated, isLoading } = useAuth()
  const { flags } = useFeatureFlags()
  
  // Default to 'support' (most restrictive) if no user
  const role: UserRole = currentUser?.role ?? 'support'
  
  // Mode flags
  const founderMode = flags.founderMode && !flags.opsMode
  const opsMode = flags.opsMode
  const dangerousEnabled = flags.dangerousActions
  const terminalOn = flags.terminalEnabled
  
  // Route access check
  const checkRouteAccess = useCallback((routeId: string): boolean => {
    return canAccessRoute(role, routeId)
  }, [role])
  
  // Route access in current mode (Founder vs Ops)
  const checkRouteAccessInMode = useCallback((routeId: string): boolean => {
    // First check role permission
    if (!canAccessRoute(role, routeId)) {
      return false
    }
    // In Founder Mode, restrict to P0 routes
    if (founderMode) {
      return FOUNDER_MODE_ROUTES.includes(routeId)
    }
    return true
  }, [role, founderMode])
  
  // Filter nav items
  const filterNav = useCallback(<T extends { id: string }>(items: T[]): T[] => {
    // First filter by role
    let filtered = filterNavByRole(items, role)
    // Then filter by mode
    if (founderMode) {
      filtered = filtered.filter(item => FOUNDER_MODE_ROUTES.includes(item.id))
    }
    return filtered
  }, [role, founderMode])
  
  // Action checks
  const checkActionPermission = useCallback((actionId: string): boolean => {
    // Check if dangerous action requires flag
    const guard = ACTION_GUARDS[actionId]
    if (guard?.permission.startsWith('dangerous:')) {
      if (!dangerousEnabled) return false
    }
    return canExecuteAction(role, actionId)
  }, [role, dangerousEnabled])
  
  // Permission check
  const checkPermission = useCallback((permission: Permission): boolean => {
    // Block dangerous permissions if flag is off
    if (permission.startsWith('dangerous:') && !dangerousEnabled) {
      return false
    }
    return hasPermission(role, permission)
  }, [role, dangerousEnabled])
  
  // Role check
  const checkMinimumRole = useCallback((requiredRole: UserRole): boolean => {
    return hasMinimumRole(role, requiredRole)
  }, [role])
  
  // Get action guard
  const getGuard = useCallback((actionId: string): ActionGuard | undefined => {
    return getActionGuard(actionId)
  }, [])
  
  // Enforcement functions
  const enforcePermissionFn = useCallback((permission: Permission, context?: string): void => {
    if (permission.startsWith('dangerous:') && !dangerousEnabled) {
      throw new PermissionDeniedError(permission, role, 'Dangerous actions are disabled')
    }
    enforcePermission(role, permission, context)
  }, [role, dangerousEnabled])
  
  const enforceRouteFn = useCallback((routeId: string): void => {
    enforceRouteAccess(role, routeId)
  }, [role])
  
  const enforceActionFn = useCallback((actionId: string): ActionGuard => {
    const guard = ACTION_GUARDS[actionId]
    if (guard?.permission.startsWith('dangerous:') && !dangerousEnabled) {
      throw new PermissionDeniedError(guard.permission, role, 'Dangerous actions are disabled')
    }
    return enforceAction(role, actionId)
  }, [role, dangerousEnabled])
  
  return {
    role,
    isAuthenticated,
    isLoading,
    canAccessRoute: checkRouteAccess,
    filterNavItems: filterNav,
    canExecuteAction: checkActionPermission,
    hasPermission: checkPermission,
    hasMinimumRole: checkMinimumRole,
    getActionGuard: getGuard,
    enforcePermission: enforcePermissionFn,
    enforceRouteAccess: enforceRouteFn,
    enforceAction: enforceActionFn,
    isFounderMode: founderMode,
    isOpsMode: opsMode,
    dangerousActionsEnabled: dangerousEnabled,
    terminalEnabled: terminalOn,
    canAccessRouteInCurrentMode: checkRouteAccessInMode,
  }
}

// ─── useRouteGuard Hook ──────────────────────────────────────

export interface RouteGuardResult {
  canAccess: boolean
  reason?: string
  requiredRole?: UserRole
}

/**
 * Hook to check if current user can access a specific route
 */
export function useRouteGuard(routeId: string): RouteGuardResult {
  const { role, isAuthenticated, isFounderMode, canAccessRoute, canAccessRouteInCurrentMode } = usePermissions()
  
  return useMemo(() => {
    if (!isAuthenticated) {
      return { canAccess: false, reason: 'Not authenticated' }
    }
    
    // Check mode restriction first
    if (isFounderMode && !FOUNDER_MODE_ROUTES.includes(routeId)) {
      return { canAccess: false, reason: 'Route not available in Founder Mode' }
    }
    
    // Check role permission
    if (!canAccessRoute(routeId)) {
      const requiredRole = ROUTE_PERMISSIONS[routeId]
      return { 
        canAccess: false, 
        reason: `Requires ${requiredRole} role`,
        requiredRole,
      }
    }
    
    return { canAccess: true }
  }, [routeId, role, isAuthenticated, isFounderMode, canAccessRoute])
}

// ─── useActionGuard Hook ─────────────────────────────────────

export interface ActionGuardResult {
  canExecute: boolean
  reason?: string
  guard?: ActionGuard
}

/**
 * Hook to check if current user can execute a specific action
 */
export function useActionGuard(actionId: string): ActionGuardResult {
  const { role, isAuthenticated, canExecuteAction, getActionGuard, dangerousActionsEnabled } = usePermissions()
  
  return useMemo(() => {
    if (!isAuthenticated) {
      return { canExecute: false, reason: 'Not authenticated' }
    }
    
    const guard = getActionGuard(actionId)
    if (!guard) {
      return { canExecute: false, reason: 'Unknown action' }
    }
    
    // Check dangerous flag
    if (guard.permission.startsWith('dangerous:') && !dangerousActionsEnabled) {
      return { 
        canExecute: false, 
        reason: 'Dangerous actions are disabled',
        guard,
      }
    }
    
    if (!canExecuteAction(actionId)) {
      return { 
        canExecute: false, 
        reason: `Insufficient permissions`,
        guard,
      }
    }
    
    return { canExecute: true, guard }
  }, [actionId, role, isAuthenticated, canExecuteAction, getActionGuard, dangerousActionsEnabled])
}

// ─── Component exports moved to route-guards.tsx ─────────────
// See src/lib/route-guards.tsx for RouteGuard, ActionGuard, and GuardedButton components

