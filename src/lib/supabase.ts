/**
 * Supabase Client — Identity Provider Integration
 *
 * Initializes the Supabase client for authentication.
 * Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from environment.
 *
 * These are PUBLIC values (anon key is designed to be client-exposed).
 * Row-Level Security (RLS) on Supabase enforces access control.
 *
 * SECURITY: Supabase is the ONLY authentication path.
 * No fallback authentication is available.
 *
 * @module
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ─── Configuration ──────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

/**
 * Whether Supabase auth is configured.
 * 
 * SECURITY: In production, Supabase MUST be configured.
 * There is no fallback authentication mechanism.
 */
export const isSupabaseConfigured = (): boolean =>
  Boolean(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY)

// ─── Client Singleton ───────────────────────────────────────────

let _client: SupabaseClient | null = null

/**
 * Get the Supabase client singleton.
 * Returns null if Supabase is not configured.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null

  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Use localStorage for session persistence (Supabase SDK handles this securely)
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'xtx396-supabase-auth',
        flowType: 'pkce', // PKCE flow for SPAs — more secure than implicit
      },
    })
  }

  return _client
}

/**
 * Reset the client (for testing).
 * @internal
 */
export function _resetClient(): void {
  _client = null
}
