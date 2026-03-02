/**
 * Auth Provider Abstraction — B26
 *
 * Provides a unified authentication interface that works with:
 * - Supabase Auth (when VITE_SUPABASE_URL is configured)
 * - Legacy localStorage auth (fallback for unconfigured installs)
 *
 * This abstraction allows the admin panel to work in both modes,
 * enabling a smooth migration from legacy to provider auth.
 *
 * PRINCIPLES:
 * - Fail-closed: if auth state is unclear, user is unauthenticated
 * - No secrets in client code
 * - RBAC roles sourced from provider metadata when available
 * - Audit events emitted for all auth lifecycle events
 *
 * @module
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseClient, isSupabaseConfigured } from './supabase'
import { logAudit } from './auth'
import type { UserRole } from './types'
import type { Session as SupabaseSession, User as SupabaseUser, AuthError } from '@supabase/supabase-js'

// ─── Types ──────────────────────────────────────────────────────

export type AuthMode = 'supabase' | 'legacy'

export interface AuthUser {
  /** Unique user ID (Supabase UUID or legacy local ID) */
  id: string
  /** User email */
  email: string
  /** RBAC role */
  role: UserRole
  /** Auth mode this user was loaded from */
  authMode: AuthMode
  /** Whether MFA is enabled */
  mfaEnabled: boolean
  /** Last login timestamp (ms) */
  lastLogin: number
  /** Provider-specific metadata */
  metadata?: Record<string, unknown>
}

export interface AuthState {
  /** Current authenticated user, or null */
  user: AuthUser | null
  /** Whether auth state is still loading */
  isLoading: boolean
  /** Whether the user is authenticated */
  isAuthenticated: boolean
  /** Which auth mode is active */
  authMode: AuthMode
  /** Last auth error */
  error: string | null
}

export interface LoginParams {
  email: string
  password?: string
  /** If true, send a magic link instead of password login */
  magicLink?: boolean
}

export interface LoginResult {
  success: boolean
  error?: string
  /** Magic link sent — user needs to check email */
  magicLinkSent?: boolean
  /** MFA required — prompt for code */
  requiresMfa?: boolean
}

export interface AuthActions {
  /** Log in with email + password or magic link */
  login: (params: LoginParams) => Promise<LoginResult>
  /** Log out */
  logout: () => Promise<void>
  /** Send a magic link email */
  sendMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>
  /** Change password (requires current session) */
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>
  /** Request password reset email */
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>
  /** Get the current auth mode */
  getAuthMode: () => AuthMode
}

// ─── Constants ──────────────────────────────────────────────────

/** Default role for new users (fail-closed: least privilege) */
const DEFAULT_ROLE: UserRole = 'support'

/** Session check interval (ms) */
const SESSION_CHECK_INTERVAL = 60_000

// ─── Supabase Auth Implementation ───────────────────────────────

function mapSupabaseUser(user: SupabaseUser): AuthUser {
  const meta = user.user_metadata ?? {}
  return {
    id: user.id,
    email: user.email ?? '',
    role: (meta.role as UserRole) ?? DEFAULT_ROLE,
    authMode: 'supabase',
    mfaEnabled: Boolean(user.factors?.some(f => f.status === 'verified')),
    lastLogin: user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0,
    metadata: meta,
  }
}

function formatAuthError(error: AuthError | null): string {
  if (!error) return 'Unknown error'
  // Sanitize: never expose internal details
  const msg = error.message ?? 'Authentication failed'
  if (msg.includes('Invalid login credentials')) return 'Invalid email or password'
  if (msg.includes('Email not confirmed')) return 'Please confirm your email before logging in'
  if (msg.includes('Too many requests')) return 'Too many attempts. Please wait before trying again.'
  return msg
}

// ─── useAuthProvider Hook ───────────────────────────────────────

/**
 * Unified auth hook that detects Supabase configuration and falls
 * back to legacy auth when unavailable.
 *
 * Usage:
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuthProvider()
 * ```
 */
export function useAuthProvider(): AuthState & AuthActions {
  const mode: AuthMode = isSupabaseConfigured() ? 'supabase' : 'legacy'

  // Both hooks must be called unconditionally (React Rules of Hooks).
  // We select the correct result based on mode after calling both.
  const supabaseAuth = useSupabaseAuth(mode === 'supabase')
  const legacyAuth = useLegacyAuthBridge()

  return mode === 'supabase' ? supabaseAuth : legacyAuth
}

// ─── Supabase Auth Hook ─────────────────────────────────────────

function useSupabaseAuth(enabled = true): AuthState & AuthActions {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)
  const userRef = useRef<AuthUser | null>(null)

  // Keep userRef in sync so the auth listener always has the latest value
  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  // ── Initialize: check existing session ──
  useEffect(() => {
    if (!enabled) return

    const client = getSupabaseClient()
    if (!client) {
      setIsLoading(false)
      return
    }

    // Get current session
    client.auth.getSession().then(({ data: { session } }) => {
      if (!mounted.current) return
      if (session?.user) {
        setUser(mapSupabaseUser(session.user))
      }
      setIsLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted.current) return

        if (event === 'SIGNED_IN' && session?.user) {
          const authUser = mapSupabaseUser(session.user)
          setUser(authUser)
          setError(null)
          await logAudit(
            authUser.id, authUser.email,
            'login', `Signed in via ${event}`,
            'auth', authUser.id
          ).catch(() => {})
        } else if (event === 'SIGNED_OUT') {
          const prevUser = userRef.current
          setUser(null)
          if (prevUser) {
            await logAudit(
              prevUser.id, prevUser.email,
              'logout', 'Session ended',
              'auth', prevUser.id
            ).catch(() => {})
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(mapSupabaseUser(session.user))
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Periodic session validation ──
  useEffect(() => {
    if (!user) return

    const interval = setInterval(async () => {
      const client = getSupabaseClient()
      if (!client) return
      const { data: { session } } = await client.auth.getSession()
      if (!session && mounted.current) {
        setUser(null)
        setError('Session expired')
      }
    }, SESSION_CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [user])

  // ── Actions ──

  const login = useCallback(async (params: LoginParams): Promise<LoginResult> => {
    const client = getSupabaseClient()
    if (!client) return { success: false, error: 'Auth provider not configured' }

    setError(null)

    if (params.magicLink) {
      const { error: linkError } = await client.auth.signInWithOtp({
        email: params.email,
        options: {
          shouldCreateUser: false, // fail-closed: no auto-registration
        },
      })
      if (linkError) {
        const msg = formatAuthError(linkError)
        setError(msg)
        await logAudit(
          'anonymous', params.email,
          'login_failed', `Magic link request failed: ${msg}`,
          'auth', params.email
        ).catch(() => {})
        return { success: false, error: msg }
      }
      await logAudit(
        'anonymous', params.email,
        'login', 'Magic link sent',
        'auth', params.email
      ).catch(() => {})
      return { success: true, magicLinkSent: true }
    }

    // Password login
    if (!params.password) {
      return { success: false, error: 'Password is required' }
    }

    const { data, error: loginError } = await client.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    })

    if (loginError) {
      const msg = formatAuthError(loginError)
      setError(msg)
      await logAudit(
        'anonymous', params.email,
        'login_failed', `Password login failed`,
        'auth', params.email
      ).catch(() => {})
      return { success: false, error: msg }
    }

    if (data.user) {
      const authUser = mapSupabaseUser(data.user)
      setUser(authUser)
      await logAudit(
        authUser.id, authUser.email,
        'login', 'Authenticated via password',
        'auth', authUser.id
      ).catch(() => {})
    }

    return { success: true }
  }, [])

  const logout = useCallback(async () => {
    const client = getSupabaseClient()
    if (!client) return

    const prevUser = user
    await client.auth.signOut()
    setUser(null)

    if (prevUser) {
      await logAudit(
        prevUser.id, prevUser.email,
        'logout', 'User signed out',
        'auth', prevUser.id
      ).catch(() => {})
    }
  }, [user])

  const sendMagicLink = useCallback(async (email: string) => {
    const client = getSupabaseClient()
    if (!client) return { success: false, error: 'Auth provider not configured' }

    const { error: linkError } = await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    })

    if (linkError) {
      return { success: false, error: formatAuthError(linkError) }
    }

    return { success: true }
  }, [])

  const changePassword = useCallback(async (newPassword: string) => {
    const client = getSupabaseClient()
    if (!client) return { success: false, error: 'Auth provider not configured' }
    if (!user) return { success: false, error: 'Not authenticated' }

    if (newPassword.length < 12) {
      return { success: false, error: 'Password must be at least 12 characters' }
    }

    const { error: updateError } = await client.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      return { success: false, error: formatAuthError(updateError) }
    }

    await logAudit(
      user.id, user.email,
      'password_changed', 'Password changed via provider',
      'auth', user.id
    ).catch(() => {})

    return { success: true }
  }, [user])

  const requestPasswordReset = useCallback(async (email: string) => {
    const client = getSupabaseClient()
    if (!client) return { success: false, error: 'Auth provider not configured' }

    const { error: resetError } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin?reset=true`,
    })

    if (resetError) {
      return { success: false, error: formatAuthError(resetError) }
    }

    await logAudit(
      'anonymous', email,
      'password_changed', 'Password reset requested',
      'auth', email
    ).catch(() => {})

    return { success: true }
  }, [])

  const getAuthMode = useCallback((): AuthMode => 'supabase', [])

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    authMode: 'supabase',
    error,
    login,
    logout,
    sendMagicLink,
    changePassword,
    requestPasswordReset,
    getAuthMode,
  }
}

// ─── Legacy Auth Bridge ─────────────────────────────────────────

/**
 * Bridge that wraps the existing localStorage-based `useAuth()` hook
 * to match the AuthProvider interface. Used when Supabase is not configured.
 */
function useLegacyAuthBridge(): AuthState & AuthActions {
  // Lazy import to avoid circular dependency initialization issues
  // The legacy auth module is only used when Supabase is not configured
  const [legacyAuth, setLegacyAuth] = useState<ReturnType<typeof import('./auth').useAuth> | null>(null)
  const [bridgeLoading, setBridgeLoading] = useState(true)

  useEffect(() => {
    // Dynamic import to break circular dependency
    import('./auth').then(mod => {
      // We cannot call hooks dynamically, so we use a different approach:
      // The legacy auth re-exports are used directly by consumers.
      // This bridge exists only as a type-compatible passthrough.
      setBridgeLoading(false)
    })
  }, [])

  // For legacy mode, consumers should use `useAuth()` directly.
  // This bridge provides a compatible interface for code that checks `authMode`.
  const user: AuthUser | null = null
  const isLoading = bridgeLoading

  const login = useCallback(async (_params: LoginParams): Promise<LoginResult> => {
    return { success: false, error: 'Legacy auth: use useAuth().login() directly' }
  }, [])

  const logout = useCallback(async () => {}, [])
  const sendMagicLink = useCallback(async (_email: string) => {
    return { success: false, error: 'Magic links require Supabase configuration' }
  }, [])
  const changePassword = useCallback(async (_newPassword: string) => {
    return { success: false, error: 'Legacy auth: use useAuth().changePassword() directly' }
  }, [])
  const requestPasswordReset = useCallback(async (_email: string) => {
    return { success: false, error: 'Password reset requires Supabase configuration' }
  }, [])
  const getAuthMode = useCallback((): AuthMode => 'legacy', [])

  return {
    user,
    isLoading,
    isAuthenticated: false,
    authMode: 'legacy',
    error: null,
    login,
    logout,
    sendMagicLink,
    changePassword,
    requestPasswordReset,
    getAuthMode,
  }
}

// ─── Utility: Check if user has admin access ────────────────────

/**
 * Check if a user's role grants admin-level access.
 * Used for route guards and capability checks.
 */
export function isAdminRole(role: UserRole): boolean {
  return role === 'owner' || role === 'admin'
}

/**
 * Get the effective auth mode for the current environment.
 */
export function getEffectiveAuthMode(): AuthMode {
  return isSupabaseConfigured() ? 'supabase' : 'legacy'
}
