/**
 * ReauthDialog — modal that prompts the user to re-enter their password
 * before performing a dangerous / owner-only action.
 *
 * Usage:
 *   const [gate, ReauthGate] = useReauthGate()
 *   // later …
 *   gate(() => { performDangerousAction() })
 *   // renders <ReauthGate /> somewhere in the tree
 */

import { useState, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth'
import { isReauthValid, verifyReauth } from '@/lib/reauth-gate'

export function useReauthGate() {
  const { currentUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const onSuccessRef = useRef<(() => void) | null>(null)

  /** Call this instead of performing the action directly. */
  const gate = useCallback(
    async (action: () => void) => {
      if (await isReauthValid()) {
        action()
        return
      }
      onSuccessRef.current = action
      setPassword('')
      setError('')
      setOpen(true)
    },
    [],
  )

  const handleConfirm = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    setError('')

    const ok = await verifyReauth(
      password,
      currentUser.passwordHash,
      currentUser.passwordSalt,
    )

    setLoading(false)

    if (ok) {
      setOpen(false)
      onSuccessRef.current?.()
      onSuccessRef.current = null
    } else {
      setError('Incorrect password')
    }
  }, [currentUser, password])

  const ReauthGate = useCallback(
    () => (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm your identity</DialogTitle>
            <DialogDescription>
              Re-enter your password to continue with this action.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || !password}
              className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Confirm'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    ),
    [open, password, error, loading, handleConfirm],
  )

  return [gate, ReauthGate] as const
}
