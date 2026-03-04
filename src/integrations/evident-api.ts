/**
 * Evident API Client — Controlled Subdomain Integration
 *
 * Read-only integration with the Evident evidence engine.
 * Founder-Hub acts as the control plane; Evident handles forensic data.
 *
 * SECURITY:
 * - Uses Supabase JWT for authentication (validated server-side by Evident via JWKS)
 * - No secrets embedded in client code
 * - Read-only access until Evident API supports write operations
 * - All requests are logged by Evident's audit system
 *
 * @module
 */

import { getSupabaseClient } from '@/lib/supabase'

// ─── Configuration ──────────────────────────────────────────────

const EVIDENT_API_URL = import.meta.env.VITE_EVIDENT_API_URL ?? ''
const EVIDENT_ENABLED = import.meta.env.VITE_EVIDENT_ENABLED === 'true'

/**
 * Whether Evident integration is enabled and configured.
 */
export function isEvidentConfigured(): boolean {
  return EVIDENT_ENABLED && Boolean(EVIDENT_API_URL)
}

// ─── Types (mirrors Evident OpenAPI contract) ───────────────────

export interface EvidentUser {
  id: number
  email: string
  username: string
  full_name: string
  organization: string | null
  role: 'admin' | 'moderator' | 'pro_user' | 'user'
  tier: 'free' | 'pro' | 'enterprise' | 'admin'
  is_active: boolean
  created_at: string
  last_login: string | null
}

export interface EvidentCase {
  id: number
  title: string
  description: string | null
  status: 'open' | 'in_progress' | 'review' | 'closed' | 'archived'
  organization_id: number
  created_by: number
  created_at: string
  updated_at: string
  evidence_count: number
}

export interface EvidentCaseListResponse {
  cases: EvidentCase[]
  total: number
  page: number
  page_size: number
}

export interface EvidentAuditEntry {
  id: number
  timestamp: string
  action: string
  actor_id: number
  actor_email: string
  target_type: string
  target_id: string
  details: string | null
  ip_address: string | null
}

export interface EvidentAuditResponse {
  entries: EvidentAuditEntry[]
  total: number
}

export interface EvidentPipelineStatus {
  pending_jobs: number
  processing_jobs: number
  completed_today: number
  failed_today: number
  worker_status: 'healthy' | 'degraded' | 'offline'
}

export interface EvidentHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  database: 'connected' | 'disconnected'
  redis: 'connected' | 'disconnected' | 'not_configured'
  timestamp: string
}

// ─── API Error ──────────────────────────────────────────────────

export class EvidentAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'EvidentAPIError'
  }
}

// ─── Core Fetch Function ────────────────────────────────────────

/**
 * Make an authenticated request to the Evident API.
 *
 * @param path - API endpoint path (e.g., '/api/v1/cases')
 * @param options - Fetch options (method, body, etc.)
 * @returns Parsed JSON response
 * @throws EvidentAPIError on failure
 */
export async function evidentFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!isEvidentConfigured()) {
    throw new EvidentAPIError('Evident integration not configured', 0, 'NOT_CONFIGURED')
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new EvidentAPIError('Supabase not configured', 0, 'AUTH_NOT_CONFIGURED')
  }

  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new EvidentAPIError('Not authenticated', 401, 'UNAUTHENTICATED')
  }

  const url = `${EVIDENT_API_URL}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    let errorMessage = `Evident API error: ${response.status}`
    let errorCode: string | undefined

    try {
      const errorBody = await response.json()
      errorMessage = errorBody.error ?? errorBody.message ?? errorMessage
      errorCode = errorBody.code
    } catch {
      // Response body not JSON
    }

    throw new EvidentAPIError(errorMessage, response.status, errorCode)
  }

  return response.json()
}

// ─── API Methods (Read-Only) ────────────────────────────────────

/**
 * Check Evident API health.
 */
export async function getHealth(): Promise<EvidentHealthResponse> {
  // Health endpoint may not require auth
  if (!isEvidentConfigured()) {
    throw new EvidentAPIError('Evident integration not configured', 0, 'NOT_CONFIGURED')
  }

  const response = await fetch(`${EVIDENT_API_URL}/health`, {
    headers: { 'Accept': 'application/json' },
  })

  if (!response.ok) {
    throw new EvidentAPIError('Evident health check failed', response.status)
  }

  return response.json()
}

/**
 * Get current user's profile from Evident.
 */
export async function getCurrentUser(): Promise<EvidentUser> {
  return evidentFetch<EvidentUser>('/api/v1/user/me')
}

/**
 * List cases accessible to the current user.
 */
export async function getCases(params?: {
  page?: number
  page_size?: number
  status?: EvidentCase['status']
}): Promise<EvidentCaseListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.page_size) searchParams.set('page_size', String(params.page_size))
  if (params?.status) searchParams.set('status', params.status)

  const query = searchParams.toString()
  return evidentFetch<EvidentCaseListResponse>(`/api/v1/cases${query ? `?${query}` : ''}`)
}

/**
 * Get a single case by ID.
 */
export async function getCase(caseId: number): Promise<EvidentCase> {
  return evidentFetch<EvidentCase>(`/api/v1/cases/${caseId}`)
}

/**
 * Get audit log entries (admin only).
 */
export async function getAuditLog(params?: {
  page?: number
  page_size?: number
  action?: string
}): Promise<EvidentAuditResponse> {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.page_size) searchParams.set('page_size', String(params.page_size))
  if (params?.action) searchParams.set('action', params.action)

  const query = searchParams.toString()
  return evidentFetch<EvidentAuditResponse>(`/api/v1/admin/audit${query ? `?${query}` : ''}`)
}

/**
 * Get transcription pipeline status.
 */
export async function getPipelineStatus(): Promise<EvidentPipelineStatus> {
  return evidentFetch<EvidentPipelineStatus>('/api/v1/pipeline/status')
}

// ─── Deep Link Helpers ──────────────────────────────────────────

/**
 * Generate a deep link to an Evident case.
 */
export function getCaseDeepLink(caseId: number): string {
  if (!EVIDENT_API_URL) return '#'
  // Evident UI is assumed to be at the same domain as the API
  const baseUrl = EVIDENT_API_URL.replace('/api', '').replace(/\/$/, '')
  return `${baseUrl}/cases/${caseId}`
}

/**
 * Generate a deep link to Evident dashboard.
 */
export function getDashboardDeepLink(): string {
  if (!EVIDENT_API_URL) return '#'
  const baseUrl = EVIDENT_API_URL.replace('/api', '').replace(/\/$/, '')
  return `${baseUrl}/dashboard`
}

/**
 * Generate a deep link to Evident admin panel.
 */
export function getAdminDeepLink(): string {
  if (!EVIDENT_API_URL) return '#'
  const baseUrl = EVIDENT_API_URL.replace('/api', '').replace(/\/$/, '')
  return `${baseUrl}/admin`
}
