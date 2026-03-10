/**
 * RouteLeaveGuard — Warns users before navigating away with unsaved changes.
 *
 * Intercepts:
 *  1. Admin tab switches (via onBeforeNavigate callback)
 *  2. Browser tab close / refresh (beforeunload event)
 *
 * Does NOT use React Router — this app uses hash-based routing with tab state.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Warning } from '@phosphor-icons/react'

interface RouteLeaveGuardProps {
  /** Whether there are unsaved changes */
  isDirty: boolean
  /** Optional list of which modules have unsaved changes */
  dirtyModules?: string[]
}

/**
 * Hook that creates a guarded navigation function.
 * Returns { guardedNavigate, GuardDialog } — mount GuardDialog in your tree
 * and use guardedNavigate instead of direct tab switches.
 */
export function useRouteLeaveGuard({ isDirty, dirtyModules }: RouteLeaveGuardProps) {
  const [pendingNav, setPendingNav] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const onNavigateRef = useRef<((tabId: string) => void) | null>(null)

  // Block browser close/refresh when dirty
  useEffect(() => {
    if (!isDirty) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const guardedNavigate = useCallback(
    (tabId: string, directNavigate: (tabId: string) => void) => {
      onNavigateRef.current = directNavigate
      if (isDirty) {
        setPendingNav(tabId)
        setShowDialog(true)
      } else {
        directNavigate(tabId)
      }
    },
    [isDirty]
  )

  const handleDiscard = useCallback(() => {
    setShowDialog(false)
    if (pendingNav && onNavigateRef.current) {
      onNavigateRef.current(pendingNav)
    }
    setPendingNav(null)
  }, [pendingNav])

  const handleCancel = useCallback(() => {
    setShowDialog(false)
    setPendingNav(null)
  }, [])

  const GuardDialog = useCallback(() => (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Warning className="h-5 w-5 text-amber-500" weight="fill" />
            Unsaved Changes
          </AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes{dirtyModules?.length
              ? ` in ${dirtyModules.join(', ')}`
              : ''
            }. Navigating away will discard them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Stay & Save</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDiscard}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Discard & Navigate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ), [showDialog, dirtyModules, handleCancel, handleDiscard])

  return { guardedNavigate, GuardDialog }
}
