/**
 * GitHub App Token Cache
 *
 * Manages installation access tokens in memory only.
 * Tokens are short-lived (1 hour) and auto-refreshed.
 *
 * CHAIN B2: Least privilege GitHub integration
 *
 * SECURITY:
 * - Tokens NEVER touch localStorage or IndexedDB
 * - Memory-only storage with automatic expiration
 * - Token proxy handles JWT signing with app private key
 */

import type { InstallationToken, CachedToken, InstallationPermissions } from './types'
import { GITHUB_APP_CONFIG, getInstallation } from './auth'

// ─── In-Memory Token Cache ──────────────────────────────────────────────────

/**
 * Token cache (memory only)
 * Key: installationId, Value: cached token
 */
const tokenCache = new Map<number, CachedToken>()

/**
 * Token expiration buffer (5 minutes before actual expiry)
 * Ensures we refresh before token actually expires
 */
const EXPIRATION_BUFFER_MS = 5 * 60 * 1000

/**
 * Minimum time between refresh attempts (prevents hammering)
 */
const MIN_REFRESH_INTERVAL_MS = 30 * 1000

/**
 * Last refresh attempt timestamp per installation
 */
const lastRefreshAttempt = new Map<number, number>()

// ─── Token Retrieval ────────────────────────────────────────────────────────

/**
 * Get a valid installation access token
 * Returns cached token if still valid, otherwise fetches new one
 *
 * @param installationId - GitHub App installation ID
 * @returns Access token string
 * @throws If token cannot be retrieved
 */
export async function getInstallationToken(installationId?: number): Promise<string> {
  // If no installation ID provided, get from stored installation
  if (!installationId) {
    const installation = await getInstallation()
    if (!installation) {
      throw new Error('Not connected to GitHub App')
    }
    installationId = installation.installationId
  }

  // Check cache
  const cached = tokenCache.get(installationId)
  if (cached && isTokenValid(cached)) {
    return cached.token.token
  }

  // Rate limit refresh attempts
  const lastAttempt = lastRefreshAttempt.get(installationId) || 0
  const now = Date.now()
  if (now - lastAttempt < MIN_REFRESH_INTERVAL_MS) {
    throw new Error('Token refresh rate limited — try again shortly')
  }

  // Fetch new token
  lastRefreshAttempt.set(installationId, now)
  const token = await fetchInstallationToken(installationId)

  // Cache it
  tokenCache.set(installationId, {
    token,
    installationId,
    cachedAt: now,
  })

  return token.token
}

/**
 * Check if cached token is still valid
 */
function isTokenValid(cached: CachedToken): boolean {
  const expiresAt = new Date(cached.token.expiresAt).getTime()
  const bufferExpiry = expiresAt - EXPIRATION_BUFFER_MS
  return Date.now() < bufferExpiry
}

/**
 * Fetch new installation token from token proxy
 */
async function fetchInstallationToken(installationId: number): Promise<InstallationToken> {
  const response = await fetch(`${GITHUB_APP_CONFIG.tokenProxyUrl}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ installationId }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get installation token: ${response.status} ${error}`)
  }

  const data = await response.json()

  return {
    token: data.token,
    expiresAt: data.expires_at,
    permissions: mapPermissions(data.permissions || {}),
    repositorySelection: data.repository_selection || 'selected',
  }
}

function mapPermissions(perms: Record<string, string>): InstallationPermissions {
  return {
    contents: perms.contents as 'read' | 'write' | undefined,
    metadata: perms.metadata as 'read' | undefined,
    pullRequests: perms.pull_requests as 'read' | 'write' | undefined,
    checks: perms.checks as 'read' | 'write' | undefined,
    deployments: perms.deployments as 'read' | 'write' | undefined,
    statuses: perms.statuses as 'read' | 'write' | undefined,
  }
}

// ─── Cache Management ───────────────────────────────────────────────────────

/**
 * Invalidate cached token for installation
 * Forces next request to fetch fresh token
 */
export function invalidateToken(installationId: number): void {
  tokenCache.delete(installationId)
}

/**
 * Clear all cached tokens
 * Call on disconnect or session end
 */
export function clearAllTokens(): void {
  tokenCache.clear()
  lastRefreshAttempt.clear()
}

/**
 * Get token cache stats (for debugging)
 */
export function getTokenCacheStats(): {
  cachedCount: number
  installations: number[]
} {
  return {
    cachedCount: tokenCache.size,
    installations: Array.from(tokenCache.keys()),
  }
}

// ─── Preemptive Refresh ─────────────────────────────────────────────────────

/**
 * Schedule preemptive token refresh
 * Refreshes token before expiration to avoid request failures
 */
export function scheduleTokenRefresh(installationId: number): void {
  const cached = tokenCache.get(installationId)
  if (!cached) return

  const expiresAt = new Date(cached.token.expiresAt).getTime()
  const refreshAt = expiresAt - EXPIRATION_BUFFER_MS - 60000 // 1 minute before buffer
  const delay = refreshAt - Date.now()

  if (delay > 0) {
    setTimeout(async () => {
      try {
        await getInstallationToken(installationId)
      } catch {
        // Silent failure — next request will retry
      }
    }, delay)
  }
}

// ─── Token Headers ──────────────────────────────────────────────────────────

/**
 * Get headers for GitHub API request with installation token
 */
export async function getAuthHeaders(installationId?: number): Promise<Record<string, string>> {
  const token = await getInstallationToken(installationId)

  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

/**
 * Make authenticated GitHub API request
 * Handles token refresh on 401
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
  installationId?: number
): Promise<Response> {
  const headers = await getAuthHeaders(installationId)

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  })

  // If unauthorized, invalidate token and retry once
  if (response.status === 401) {
    const installation = await getInstallation()
    if (installation) {
      invalidateToken(installation.installationId)
      const newHeaders = await getAuthHeaders(installationId)

      return fetch(url, {
        ...options,
        headers: {
          ...newHeaders,
          ...(options.headers || {}),
        },
      })
    }
  }

  return response
}
