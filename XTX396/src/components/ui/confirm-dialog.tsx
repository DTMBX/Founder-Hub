/**
 * Confirmation Dialog Component
 * Chain A4 — Destructive Action Safety
 *
 * PRINCIPLES:
 * 1. Any destructive action requires explicit confirmation
 * 2. Critical actions require typed confirmation (e.g., "DELETE site-name")
 * 3. All confirmations are logged to audit trail
 * 4. No UI action can bypass the confirmation gate
 */

import { useState, useCallback, useEffect } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Warning, ShieldCheck, Trash, CloudArrowUp } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { logAudit, useAuth } from '@/lib/auth'
import type { AuditAction } from '@/lib/types'

// ─── Types ───────────────────────────────────────────────────

export type ConfirmationType = 'simple' | 'typed' | 'typed-slug'

export type ConfirmationIntent = 
  | 'delete' 
  | 'archive' 
  | 'publish' 
  | 'deploy' 
  | 'destructive' 
  | 'warning'

export interface ConfirmDialogProps {
  /** Dialog open state */
  open: boolean
  /** Callback when dialog closes */
  onOpenChange: (open: boolean) => void
  /** Dialog title */
  title: string
  /** Description text explaining the action */
  description: string
  /** Type of confirmation required */
  confirmationType?: ConfirmationType
  /** 
   * Text user must type to confirm (for typed/typed-slug)
   * For typed-slug, this is the slug they must type preceded by "DELETE "
   */
  confirmText?: string
  /** Button label for confirm action */
  confirmLabel?: string
  /** Button label for cancel action */
  cancelLabel?: string
  /** Visual intent styling */
  intent?: ConfirmationIntent
  /** Callback when confirmed */
  onConfirm: () => void | Promise<void>
  /** Audit action name (logged on confirm) */
  auditAction?: AuditAction
  /** Extra audit details */
  auditDetails?: string
  /** Disable confirm button while processing */
  isProcessing?: boolean
  /** Warning message or additional info */
  warning?: string
  /** Items being affected (for multi-item operations) */
  affectedItems?: string[]
}

// ─── Intent Configuration ────────────────────────────────────

const INTENT_CONFIG: Record<ConfirmationIntent, {
  icon: typeof Warning
  iconColor: string
  buttonVariant: 'destructive' | 'default' | 'secondary'
  headerBg: string
}> = {
  delete: {
    icon: Trash,
    iconColor: 'text-destructive',
    buttonVariant: 'destructive',
    headerBg: 'bg-destructive/5 border-b border-destructive/20',
  },
  archive: {
    icon: ShieldCheck,
    iconColor: 'text-amber-600',
    buttonVariant: 'default',
    headerBg: 'bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800',
  },
  publish: {
    icon: CloudArrowUp,
    iconColor: 'text-blue-600',
    buttonVariant: 'default',
    headerBg: 'bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-800',
  },
  deploy: {
    icon: CloudArrowUp,
    iconColor: 'text-green-600',
    buttonVariant: 'default',
    headerBg: 'bg-green-50 dark:bg-green-950/20 border-b border-green-200 dark:border-green-800',
  },
  destructive: {
    icon: Warning,
    iconColor: 'text-destructive',
    buttonVariant: 'destructive',
    headerBg: 'bg-destructive/5 border-b border-destructive/20',
  },
  warning: {
    icon: Warning,
    iconColor: 'text-amber-600',
    buttonVariant: 'default',
    headerBg: 'bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800',
  },
}

// ─── Component ───────────────────────────────────────────────

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmationType = 'simple',
  confirmText,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  intent = 'warning',
  onConfirm,
  auditAction,
  auditDetails,
  isProcessing = false,
  warning,
  affectedItems,
}: ConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const { currentUser } = useAuth()
  
  const config = INTENT_CONFIG[intent]
  const Icon = config.icon
  
  // Reset typed value when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setTypedValue('')
      setIsConfirming(false)
    }
  }, [open])
  
  // Determine required text for typed confirmation
  const getRequiredText = useCallback(() => {
    if (confirmationType === 'typed-slug' && confirmText) {
      return `DELETE ${confirmText}`
    }
    return confirmText || ''
  }, [confirmationType, confirmText])
  
  // Check if confirmation is valid
  const isConfirmValid = useCallback(() => {
    if (confirmationType === 'simple') {
      return true
    }
    const required = getRequiredText()
    return typedValue.trim() === required
  }, [confirmationType, typedValue, getRequiredText])
  
  // Handle confirmation
  const handleConfirm = useCallback(async () => {
    if (!isConfirmValid()) return
    
    setIsConfirming(true)
    
    try {
      // Log to audit trail
      if (auditAction && currentUser) {
        const details = confirmationType !== 'simple' 
          ? `${auditDetails || `Confirmed: ${title}`} [typed: ${typedValue}]`
          : auditDetails || `Confirmed: ${title}`
        await logAudit(
          currentUser.id, 
          currentUser.email, 
          auditAction,
          details,
          confirmationType
        )
      }
      
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error('[ConfirmDialog] Error during confirmation:', error)
    } finally {
      setIsConfirming(false)
    }
  }, [
    isConfirmValid, 
    auditAction, 
    currentUser, 
    title, 
    confirmationType, 
    typedValue, 
    auditDetails, 
    onConfirm, 
    onOpenChange
  ])
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="p-0 overflow-hidden">
        <AlertDialogHeader className={cn("p-6", config.headerBg)}>
          <div className="flex items-start gap-4">
            <div className={cn(
              "flex-shrink-0 p-2 rounded-full",
              intent === 'delete' || intent === 'destructive' 
                ? 'bg-destructive/10' 
                : 'bg-current/10'
            )}>
              <Icon className={cn("w-6 h-6", config.iconColor)} weight="fill" />
            </div>
            <div className="flex-1 min-w-0">
              <AlertDialogTitle className="text-lg font-semibold">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-sm text-muted-foreground">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        
        <div className="px-6 py-4 space-y-4">
          {/* Warning message */}
          {warning && (
            <div className="flex items-start gap-2 p-3 text-sm rounded-md bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
              <Warning className="w-4 h-4 flex-shrink-0 mt-0.5" weight="fill" />
              <span>{warning}</span>
            </div>
          )}
          
          {/* Affected items list */}
          {affectedItems && affectedItems.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Items affected ({affectedItems.length}):
              </Label>
              <div className="max-h-32 overflow-y-auto p-2 rounded-md bg-muted/50 border text-sm">
                <ul className="space-y-1">
                  {affectedItems.slice(0, 10).map((item, idx) => (
                    <li key={idx} className="truncate">• {item}</li>
                  ))}
                  {affectedItems.length > 10 && (
                    <li className="text-muted-foreground">
                      ...and {affectedItems.length - 10} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
          
          {/* Typed confirmation input */}
          {confirmationType !== 'simple' && (
            <div className="space-y-2">
              <Label htmlFor="confirm-input" className="text-sm font-medium">
                {confirmationType === 'typed-slug' 
                  ? `Type "DELETE ${confirmText}" to confirm:`
                  : `Type "${confirmText}" to confirm:`
                }
              </Label>
              <Input
                id="confirm-input"
                value={typedValue}
                onChange={(e) => setTypedValue(e.target.value)}
                placeholder={getRequiredText()}
                className={cn(
                  "font-mono",
                  isConfirmValid() && typedValue.length > 0 
                    ? "border-green-500 focus-visible:ring-green-500" 
                    : ""
                )}
                autoComplete="off"
                autoFocus
              />
              {typedValue.length > 0 && !isConfirmValid() && (
                <p className="text-xs text-destructive">
                  Text does not match. Please type exactly: {getRequiredText()}
                </p>
              )}
            </div>
          )}
        </div>
        
        <AlertDialogFooter className="px-6 py-4 bg-muted/30 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming || isProcessing}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={handleConfirm}
            disabled={!isConfirmValid() || isConfirming || isProcessing}
          >
            {isConfirming || isProcessing ? 'Processing...' : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Hook for Confirmation ───────────────────────────────────

export interface UseConfirmDialogOptions {
  title: string
  description: string
  confirmationType?: ConfirmationType
  confirmText?: string
  confirmLabel?: string
  intent?: ConfirmationIntent
  auditAction?: AuditAction
  auditDetails?: string
  warning?: string
  affectedItems?: string[]
}

export interface UseConfirmDialogReturn {
  confirm: () => Promise<boolean>
  dialogProps: ConfirmDialogProps
}

/**
 * Hook for programmatic confirmation dialogs
 * 
 * @example
 * const { confirm, dialogProps } = useConfirmDialog({
 *   title: 'Delete Site',
 *   description: 'This will permanently delete the site.',
 *   confirmationType: 'typed-slug',
 *   confirmText: 'my-site',
 *   intent: 'delete',
 * })
 * 
 * // Later:
 * const confirmed = await confirm()
 * if (confirmed) {
 *   // Do the action
 * }
 * 
 * // In JSX:
 * <ConfirmDialog {...dialogProps} onConfirm={...} />
 */
export function useConfirmDialog(options: UseConfirmDialogOptions): UseConfirmDialogReturn {
  const [isOpen, setIsOpen] = useState(false)
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null)
  
  const confirm = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve)
      setIsOpen(true)
    })
  }, [])
  
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open && resolver) {
      resolver(false)
      setResolver(null)
    }
  }, [resolver])
  
  const handleConfirm = useCallback(() => {
    if (resolver) {
      resolver(true)
      setResolver(null)
    }
    setIsOpen(false)
  }, [resolver])
  
  return {
    confirm,
    dialogProps: {
      open: isOpen,
      onOpenChange: handleOpenChange,
      title: options.title,
      description: options.description,
      confirmationType: options.confirmationType,
      confirmText: options.confirmText,
      confirmLabel: options.confirmLabel,
      intent: options.intent,
      auditAction: options.auditAction,
      auditDetails: options.auditDetails,
      warning: options.warning,
      affectedItems: options.affectedItems,
      onConfirm: handleConfirm,
    },
  }
}

// ─── Preset Dialogs ──────────────────────────────────────────

/**
 * Preset for delete confirmation
 */
export function useDeleteConfirmation(
  itemName: string,
  itemType: string = 'item'
): UseConfirmDialogReturn {
  return useConfirmDialog({
    title: `Delete ${itemType}`,
    description: `This action cannot be undone. The ${itemType.toLowerCase()} "${itemName}" will be permanently deleted.`,
    confirmationType: 'typed-slug',
    confirmText: itemName,
    confirmLabel: 'Delete',
    intent: 'delete',
    auditAction: 'destructive_action_confirmed',
    auditDetails: `Delete ${itemType}: ${itemName}`,
    warning: 'This action is permanent and cannot be reversed.',
  })
}

/**
 * Preset for archive confirmation (soft delete)
 */
export function useArchiveConfirmation(
  itemName: string,
  itemType: string = 'item'
): UseConfirmDialogReturn {
  return useConfirmDialog({
    title: `Archive ${itemType}`,
    description: `The ${itemType.toLowerCase()} "${itemName}" will be archived. You can restore it later if needed.`,
    confirmationType: 'simple',
    confirmLabel: 'Archive',
    intent: 'archive',
    auditAction: 'destructive_action_confirmed',
    auditDetails: `Archive ${itemType}: ${itemName}`,
  })
}

/**
 * Preset for publish confirmation
 */
export function usePublishConfirmation(
  siteName: string
): UseConfirmDialogReturn {
  return useConfirmDialog({
    title: 'Publish Changes',
    description: `You are about to publish changes to "${siteName}". Changes will be pushed to a review branch.`,
    confirmationType: 'typed',
    confirmText: 'PUBLISH',
    confirmLabel: 'Publish',
    intent: 'publish',
    auditAction: 'publish_changes',
    auditDetails: `Publish site: ${siteName}`,
    warning: 'Changes will be pushed to a feature branch and require PR review before going live.',
  })
}

/**
 * Preset for deploy confirmation
 */
export function useDeployConfirmation(
  environment: 'preview' | 'staging' | 'production',
  siteName: string
): UseConfirmDialogReturn {
  const isProduction = environment === 'production'
  
  return useConfirmDialog({
    title: `Deploy to ${environment.charAt(0).toUpperCase() + environment.slice(1)}`,
    description: `Deploy "${siteName}" to the ${environment} environment.`,
    confirmationType: isProduction ? 'typed' : 'simple',
    confirmText: isProduction ? 'DEPLOY-PROD' : undefined,
    confirmLabel: 'Deploy',
    intent: 'deploy',
    auditAction: 'destructive_action_confirmed',
    auditDetails: `Deploy to ${environment}: ${siteName}`,
    warning: isProduction 
      ? 'Production deployments are visible to all users immediately.'
      : undefined,
  })
}
