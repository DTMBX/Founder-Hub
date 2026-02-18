/**
 * Route Guard React Components
 * Chain A2 — Components for RBAC-based rendering
 */

import { ReactNode } from 'react'
import { useRouteGuard, useActionGuard } from './route-guards'

// ─── Route Guard Component ───────────────────────────────────

export interface RouteGuardProps {
  routeId: string
  children: ReactNode
  fallback?: ReactNode
  onDenied?: (reason: string) => void
}

/**
 * Component that conditionally renders children based on route access
 */
export function RouteGuard({ routeId, children, fallback, onDenied }: RouteGuardProps) {
  const { canAccess, reason } = useRouteGuard(routeId)
  
  if (!canAccess) {
    if (onDenied && reason) {
      onDenied(reason)
    }
    return <>{fallback ?? null}</>
  }
  
  return <>{children}</>
}

// ─── Action Guard Component ──────────────────────────────────

export interface ActionGuardProps {
  actionId: string
  children: ReactNode
  fallback?: ReactNode
  onDenied?: (reason: string) => void
}

/**
 * Component that conditionally renders children based on action permission
 */
export function ActionGuard({ actionId, children, fallback, onDenied }: ActionGuardProps) {
  const { canExecute, reason } = useActionGuard(actionId)
  
  if (!canExecute) {
    if (onDenied && reason) {
      onDenied(reason)
    }
    return <>{fallback ?? null}</>
  }
  
  return <>{children}</>
}

// ─── Guarded Button Component ────────────────────────────────

export interface GuardedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  actionId: string
  onExecute: () => void | Promise<void>
  showWhenDisabled?: boolean
}

/**
 * Button that automatically checks action permissions
 * Hides completely if user lacks permission (unless showWhenDisabled is true)
 */
export function GuardedButton({
  actionId,
  onExecute,
  children,
  showWhenDisabled = false,
  disabled,
  ...props
}: GuardedButtonProps) {
  const { canExecute, reason } = useActionGuard(actionId)
  
  if (!canExecute && !showWhenDisabled) {
    return null
  }
  
  return (
    <button
      {...props}
      disabled={!canExecute || disabled}
      onClick={() => canExecute && onExecute()}
      title={!canExecute ? reason : undefined}
    >
      {children}
    </button>
  )
}

// ─── Permission Denied Component ─────────────────────────────

export interface PermissionDeniedProps {
  title?: string
  message?: string
}

/**
 * Standard permission denied message
 */
export function PermissionDenied({ 
  title = 'Access Denied', 
  message = 'You do not have permission to view this content.' 
}: PermissionDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <svg
          className="h-8 w-8 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md">{message}</p>
    </div>
  )
}
