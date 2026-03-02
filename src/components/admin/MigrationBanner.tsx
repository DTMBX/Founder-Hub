/**
 * Legacy Auth Migration Banner — B26-P4
 *
 * Displayed when a Supabase-configured install detects legacy localStorage
 * auth data. Allows the operator to:
 * - View a summary of legacy data
 * - Clear legacy data (with confirmation)
 * - Dismiss / skip migration
 *
 * RULES:
 * - Never silently deletes data
 * - Requires explicit confirmation for destructive actions
 * - Emits audit events for all actions
 * - Preserves audit log (append-only)
 *
 * @module
 */

import { useState, useEffect, useCallback } from 'react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ShieldCheck, Warning, Trash, ArrowRight, X } from '@phosphor-icons/react'
import {
  detectLegacyAuth,
  shouldShowMigrationBanner,
  clearLegacyAuthData,
  skipMigration,
  getLegacyDataSummary,
  type LegacyDetectionResult,
} from '@/lib/legacy-migration'

interface MigrationBannerProps {
  /** Email of the currently authenticated user (for audit trail) */
  userEmail: string
  /** Callback when migration is completed or dismissed */
  onDismiss?: () => void
}

export default function MigrationBanner({ userEmail, onDismiss }: MigrationBannerProps) {
  const [visible, setVisible] = useState(false)
  const [detection, setDetection] = useState<LegacyDetectionResult | null>(null)
  const [summary, setSummary] = useState<{
    users: Array<{ email: string; role: string; lastLogin: number }>
    auditLogEntries: number
    hasSession: boolean
  } | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      const shouldShow = await shouldShowMigrationBanner()
      if (cancelled) return
      if (!shouldShow) return

      const result = await detectLegacyAuth()
      if (cancelled) return
      setDetection(result)

      const data = await getLegacyDataSummary()
      if (cancelled) return
      setSummary(data)
      setVisible(true)
    }

    check()
    return () => { cancelled = true }
  }, [])

  const handleSkip = useCallback(async () => {
    await skipMigration(userEmail)
    setVisible(false)
    onDismiss?.()
  }, [userEmail, onDismiss])

  const handleClear = useCallback(async () => {
    setIsClearing(true)
    const result = await clearLegacyAuthData(userEmail)
    setIsClearing(false)

    if (result.success) {
      setCleared(true)
      // Auto-dismiss after showing success
      setTimeout(() => {
        setVisible(false)
        onDismiss?.()
      }, 3000)
    }
  }, [userEmail, onDismiss])

  if (!visible || !detection || !summary) return null

  if (cleared) {
    return (
      <Alert className="border-emerald-500/30 bg-emerald-500/5 mb-4">
        <ShieldCheck className="h-4 w-4 text-emerald-500" weight="duotone" />
        <AlertTitle className="text-emerald-400 text-sm font-medium">
          Migration Complete
        </AlertTitle>
        <AlertDescription className="text-emerald-400/80 text-xs mt-1">
          Legacy auth data cleared. Audit log preserved. You are now using
          provider-based authentication.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <Alert className="border-amber-500/30 bg-amber-500/5 mb-4">
        <Warning className="h-4 w-4 text-amber-500" weight="duotone" />
        <AlertTitle className="text-amber-400 text-sm font-medium">
          Legacy Auth Data Detected
        </AlertTitle>
        <AlertDescription className="text-xs mt-2 space-y-3">
          <p className="text-muted-foreground">
            This install previously used local authentication.
            {summary.users.length > 0 && (
              <> Found <strong>{summary.users.length}</strong> legacy account{summary.users.length !== 1 ? 's' : ''}.</>
            )}
            {summary.auditLogEntries > 0 && (
              <> Audit log ({summary.auditLogEntries} entries) will be preserved.</>
            )}
          </p>

          {/* Legacy accounts list */}
          {summary.users.length > 0 && (
            <div className="rounded border border-border/50 divide-y divide-border/50">
              {summary.users.map((u, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 text-xs">
                  <span className="text-foreground">{u.email}</span>
                  <span className="text-muted-foreground capitalize">{u.role}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              onClick={() => setShowConfirmDialog(true)}
            >
              <Trash className="h-3.5 w-3.5" />
              Clear Legacy Data
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={handleSkip}
            >
              <X className="h-3.5 w-3.5" />
              Dismiss
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {/* Confirmation dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Warning className="h-5 w-5 text-amber-500" weight="duotone" />
              Clear Legacy Auth Data
            </DialogTitle>
            <DialogDescription className="text-xs space-y-2 pt-2">
              <p>This will permanently remove:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Legacy user accounts ({summary.users.length})</li>
                <li>Active session data</li>
                <li>Login attempt records</li>
                <li>Pending 2FA tokens</li>
              </ul>
              <p className="text-emerald-400 font-medium">
                Audit log ({summary.auditLogEntries} entries) will be preserved.
              </p>
              <p className="text-amber-400">
                This action cannot be undone.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isClearing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setShowConfirmDialog(false)
                handleClear()
              }}
              disabled={isClearing}
            >
              {isClearing ? (
                'Clearing...'
              ) : (
                <>
                  <ArrowRight className="h-3.5 w-3.5" />
                  Confirm Clear
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
