/**
 * Mobile-First Admin Login — B26-P5
 *
 * Auth-provider-aware login screen that:
 * - Uses Supabase auth when configured (magic link + password)
 * - Falls back to legacy auth when Supabase is not configured
 * - Optimized for 360–480px mobile devices
 * - Accessible (WCAG 2.1 AA), keyboard-navigable
 * - Emits audit events for all auth actions
 *
 * @module
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  EnvelopeSimple,
  MagicWand,
  SignIn,
  CheckCircle,
  Warning,
  Spinner,
  Key,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  useAuthProvider,
  getEffectiveAuthMode,
  type AuthMode,
  type LoginResult,
} from '@/lib/auth-provider'
import { isSupabaseConfigured } from '@/lib/supabase'

type LoginMethod = 'password' | 'magic-link'

interface ProviderLoginProps {
  /** Navigate back to public site */
  onBack: () => void
  /** Called after successful authentication */
  onAuthenticated?: () => void
}

/**
 * Provider-aware login component.
 * When Supabase is configured, shows magic-link + password options.
 * When legacy, delegates to the existing AdminLogin component.
 */
export default function ProviderLogin({ onBack, onAuthenticated }: ProviderLoginProps) {
  const authMode = getEffectiveAuthMode()

  // If legacy mode, render the original login
  if (authMode === 'legacy') {
    // Dynamic import to avoid loading Supabase code in legacy mode
    const AdminLogin = require('@/components/admin/AdminLogin').default
    return <AdminLogin onBack={onBack} />
  }

  return <SupabaseLoginForm onBack={onBack} onAuthenticated={onAuthenticated} />
}

// ─── Supabase Login Form ────────────────────────────────────────

function SupabaseLoginForm({ onBack, onAuthenticated }: ProviderLoginProps) {
  const { login, sendMagicLink, requestPasswordReset, isAuthenticated } = useAuthProvider()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [method, setMethod] = useState<LoginMethod>('magic-link')
  const [isLoading, setIsLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  // Auto-redirect when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      onAuthenticated?.()
    }
  }, [isAuthenticated, onAuthenticated])

  // Focus email on mount
  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const handleLogin = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (isLoading) return
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    setIsLoading(true)
    setError(null)

    let result: LoginResult

    if (method === 'magic-link') {
      result = await login({ email: email.trim(), magicLink: true })
      if (result.success && result.magicLinkSent) {
        setMagicLinkSent(true)
        toast.success('Check your email for the sign-in link')
      }
    } else {
      if (!password) {
        setError('Password is required')
        setIsLoading(false)
        return
      }
      result = await login({ email: email.trim(), password })
    }

    if (!result.success && result.error) {
      setError(result.error)
    }

    setIsLoading(false)
  }, [email, password, method, isLoading, login])

  const handlePasswordReset = useCallback(async () => {
    if (!email.trim()) {
      setError('Enter your email first')
      return
    }
    setIsLoading(true)
    setError(null)

    const result = await requestPasswordReset(email.trim())

    if (result.success) {
      setResetSent(true)
      toast.success('Password reset email sent')
    } else {
      setError(result.error ?? 'Reset request failed')
    }

    setIsLoading(false)
  }, [email, requestPasswordReset])

  // ── Magic link sent confirmation ──
  if (magicLinkSent) {
    return (
      <LoginShell onBack={onBack}>
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="h-7 w-7 text-emerald-500" weight="duotone" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Check Your Email</h2>
            <p className="text-sm text-muted-foreground mt-1">
              A sign-in link was sent to <strong className="text-foreground">{email}</strong>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Open the link on this device to sign in. The link expires in 1 hour.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              setMagicLinkSent(false)
              setError(null)
            }}
          >
            Try a different method
          </Button>
        </div>
      </LoginShell>
    )
  }

  // ── Password reset confirmation ──
  if (resetSent) {
    return (
      <LoginShell onBack={onBack}>
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <EnvelopeSimple className="h-7 w-7 text-blue-500" weight="duotone" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Reset Email Sent</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Check <strong className="text-foreground">{email}</strong> for password reset instructions.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              setResetSent(false)
              setShowReset(false)
              setError(null)
            }}
          >
            Back to sign in
          </Button>
        </div>
      </LoginShell>
    )
  }

  // ── Password reset form ──
  if (showReset) {
    return (
      <LoginShell onBack={onBack}>
        <form onSubmit={(e) => { e.preventDefault(); handlePasswordReset() }} className="space-y-4">
          <div className="text-center mb-2">
            <h2 className="text-base font-semibold">Reset Password</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Enter your email to receive a reset link.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-email" className="text-xs font-medium">Email</Label>
            <div className="relative">
              <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="pl-9"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && <ErrorMessage message={error} />}

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? <Spinner className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => { setShowReset(false); setError(null) }}
          >
            Back to sign in
          </Button>
        </form>
      </LoginShell>
    )
  }

  // ── Main login form ──
  return (
    <LoginShell onBack={onBack}>
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Method toggle */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg" role="tablist" aria-label="Sign-in method">
          <MethodTab
            active={method === 'magic-link'}
            onClick={() => { setMethod('magic-link'); setError(null) }}
            icon={<MagicWand className="h-3.5 w-3.5" weight="bold" />}
            label="Magic Link"
          />
          <MethodTab
            active={method === 'password'}
            onClick={() => { setMethod('password'); setError(null) }}
            icon={<Lock className="h-3.5 w-3.5" weight="bold" />}
            label="Password"
          />
        </div>

        {/* Email field (always shown) */}
        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-xs font-medium">Email</Label>
          <div className="relative">
            <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={emailRef}
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              autoComplete="email"
              className="pl-9"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Password field (password method only) */}
        {method === 'password' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password" className="text-xs font-medium">Password</Label>
              <button
                type="button"
                className="text-[10px] text-primary hover:underline"
                onClick={() => setShowReset(true)}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pl-9"
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {error && <ErrorMessage message={error} />}

        {/* Submit */}
        <Button type="submit" className="w-full gap-2" size="lg" disabled={isLoading}>
          {isLoading ? (
            <Spinner className="h-4 w-4 animate-spin" />
          ) : method === 'magic-link' ? (
            <>
              <MagicWand className="h-4 w-4" />
              Send Sign-in Link
            </>
          ) : (
            <>
              <SignIn className="h-4 w-4" />
              Sign In
            </>
          )}
        </Button>

        {/* Method hint */}
        {method === 'magic-link' && (
          <p className="text-[10px] text-muted-foreground text-center">
            A one-time sign-in link will be sent to your email.
            No password needed.
          </p>
        )}
      </form>
    </LoginShell>
  )
}

// ─── Layout Shell ───────────────────────────────────────────────

function LoginShell({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-card p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <ShieldCheck className="h-7 w-7 text-primary" weight="duotone" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Admin Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Secure access to your control center
          </p>
        </div>

        {/* Card */}
        <Card className="border-border/50 shadow-xl shadow-black/5">
          <CardContent className="pt-6">
            {children}
          </CardContent>
          <CardFooter className="justify-center pb-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-xs text-muted-foreground gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to site
            </Button>
          </CardFooter>
        </Card>

        {/* Footer badges */}
        <div className="mt-6 flex items-center justify-center gap-3 text-[10px] text-muted-foreground/60 flex-wrap">
          <span>Provider Auth</span>
          <span aria-hidden="true">·</span>
          <span>PKCE Flow</span>
          <span aria-hidden="true">·</span>
          <span>Magic Link</span>
          <span aria-hidden="true">·</span>
          <span>RBAC</span>
        </div>
      </div>
    </div>
  )
}

// ─── Method Tab ─────────────────────────────────────────────────

function MethodTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

// ─── Error Message ──────────────────────────────────────────────

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-md bg-destructive/10 border border-destructive/20" role="alert">
      <Warning className="h-4 w-4 text-destructive shrink-0 mt-0.5" weight="duotone" />
      <p className="text-xs text-destructive">{message}</p>
    </div>
  )
}
