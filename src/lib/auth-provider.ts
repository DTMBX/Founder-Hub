/**
 * Auth Provider Abstraction — B26
 *
 * Provides a unified authentication interface using Supabase Auth.
 *
 * SECURITY: localStorage-based fallback auth is DISABLED in production.
 * Supabase Auth (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY) is REQUIRED.
 *
 * PRINCIPLES:
 * - Fail-closed: if auth state is unclear, user is unauthenticated
 * - No secrets in client code (no VITE_ADMIN_PASSWORD or similar)
 * - RBAC roles sourced from Supabase user_metadata
 * - Audit events emitted for all auth lifecycle events
 * - Production builds MUST have Supabase configured
 *
 * @module
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseClient, isSupabaseConfigured } from './supabase'
import { logAudit } from './audit-client'
import type { UserRole } from './types'
import type { Session as SupabaseSession, User as SupabaseUser, AuthError } from '@supabase/supabase-js'

// ─── Types ──────────────────────────────────────────────────────

/**
 * Auth mode is always Supabase. Legacy localStorage auth is removed.
 * @deprecated This type exists for backward compatibility only.
 */
export type AuthMode = 'supabase'

export interface AuthUser {
  /** Unique user ID (Supabase UUID) */
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
 * Unified auth hook that requires Supabase configuration.
 *
 * SECURITY: Legacy localStorage auth is DISABLED.
 * In production, if Supabase is not configured, auth will fail closed.
 *
 * Usage:
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuthProvider()
 * ```
 */
export function useAuthProvider(): AuthState & AuthActions {
  const supabaseConfigured = isSupabaseConfigured()
  
  // In production, Supabase is REQUIRED. No fallback.
  if (!supabaseConfigured && !import.meta.env.DEV) {
    console.error('[AuthProvider] FATAL: Supabase not configured in production. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
    // Return a fail-closed state
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      authMode: 'supabase',
      error: 'Authentication service not configured. Contact administrator.',
      login: async () => ({ success: false, error: 'Auth not configured' }),
      logout: async () => {},
      sendMagicLink: async () => ({ success: false, error: 'Auth not configured' }),
      changePassword: async () => ({ success: false, error: 'Auth not configured' }),
      requestPasswordReset: async () => ({ success: false, error: 'Auth not configured' }),
      getAuthMode: () => 'supabase',
    }
  }
  
  // In development without Supabase, warn but allow (for local testing)
  if (!supabaseConfigured && import.meta.env.DEV) {
    console.warn('[AuthProvider] DEV MODE: Supabase not configured. Auth features will not work.')
  }

  // Always use Supabase auth (legacy fallback removed)
  return useSupabaseAuth(supabaseConfigured)
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
 * 
 * SECURITY: Legacy mode is deprecated. Always returns 'supabase'.
 * If Supabase is not configured in production, auth will fail closed.
 */
export function getEffectiveAuthMode(): AuthMode {
  return 'supabase'
}
