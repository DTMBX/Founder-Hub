/**
 * GitHub App Authentication Module
 *
 * Handles GitHub App installation OAuth flow.
 * For static sites, uses the installation callback pattern.
 *
 * CHAIN B2: Least privilege GitHub integration
 *
 * FLOW:
 * 1. User clicks "Connect GitHub" → redirects to GitHub App install page
 * 2. User installs/authorizes app for selected repos
 * 3. GitHub redirects back with installation_id in URL
 * 4. Frontend stores installation_id (safe) and fetches repos
 *
 * SECURITY:
 * - Installation ID is safe to store (not a secret)
 * - Installation tokens retrieved via backend proxy or Cloudflare Worker
 * - Tokens never touch localStorage (memory only)
 */

import type {
  GitHubInstallation,
  GitHubAppState,
  InstalledRepository,
  InstallationPermissions,
} from './types'

// ─── Configuration ──────────────────────────────────────────────────────────

/**
 * GitHub App configuration
 * These are PUBLIC values - safe to expose
 */
export const GITHUB_APP_CONFIG = {
  /** GitHub App name (for install URL) */
  appSlug: 'xtx396-publisher',
  /** GitHub App ID (public) */
  appId: parseInt(import.meta.env.VITE_GITHUB_APP_ID || '0', 10),
  /** Install URL */
  installUrl: 'https://github.com/apps/xtx396-publisher/installations/new',
  /** Callback path (relative to origin) */
  callbackPath: '/admin/github/callback',
  /** Token proxy endpoint (Cloudflare Worker or similar) */
  tokenProxyUrl: import.meta.env.VITE_GITHUB_TOKEN_PROXY_URL || '/api/github/token',
  /** Minimum required permissions */
  requiredPermissions: {
    contents: 'write',
    pullRequests: 'write',
    checks: 'read',
    metadata: 'read',
  } as InstallationPermissions,
}

// Storage key for installation data (safe to store in localStorage)
const INSTALLATION_STORAGE_KEY = 'xtx396:github-app-installation'

// ─── Installation State ─────────────────────────────────────────────────────

/**
 * Get stored installation data
 * Returns null if not connected
 * 
 * NOTE: Installation data is NOT a secret - it's safe in localStorage
 */
export async function getInstallation(): Promise<GitHubInstallation | null> {
  const raw = localStorage.getItem(INSTALLATION_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as GitHubInstallation
  } catch {
    return null
  }
}

/**
 * Store installation data
 * Only stores safe data (installation ID, repos, permissions)
 */
export async function saveInstallation(installation: GitHubInstallation): Promise<void> {
  localStorage.setItem(INSTALLATION_STORAGE_KEY, JSON.stringify(installation))
}

/**
 * Clear installation data (disconnect)
 */
export async function clearInstallation(): Promise<void> {
  localStorage.removeItem(INSTALLATION_STORAGE_KEY)
}

/**
 * Check if GitHub App is connected
 */
export async function isConnected(): Promise<boolean> {
  const installation = await getInstallation()
  return installation !== null
}

// ─── OAuth Flow ─────────────────────────────────────────────────────────────

/**
 * Initiate GitHub App installation flow
 * Redirects user to GitHub to install/configure app
 *
 * @param redirectUri - Where to return after installation
 */
export function initiateInstallFlow(redirectUri?: string): void {
  const callbackUrl = redirectUri || `${window.location.origin}${GITHUB_APP_CONFIG.callbackPath}`
  const state = generateOAuthState()

  // Store state for CSRF protection
  sessionStorage.setItem('github_oauth_state', state)
  sessionStorage.setItem('github_oauth_redirect', window.location.href)

  // Build install URL
  const url = new URL(GITHUB_APP_CONFIG.installUrl)
  url.searchParams.set('state', state)

  window.location.href = url.toString()
}

/**
 * Handle OAuth callback
 * Call this when user returns from GitHub App installation
 *
 * @param searchParams - URL search params from callback
 * @returns Installation data or error
 */
export async function handleInstallCallback(
  searchParams: URLSearchParams
): Promise<{ success: true; installation: GitHubInstallation } | { success: false; error: string }> {
  // Verify state for CSRF protection
  const state = searchParams.get('state')
  const storedState = sessionStorage.getItem('github_oauth_state')

  if (!state || state !== storedState) {
    return { success: false, error: 'Invalid OAuth state — possible CSRF attack' }
  }

  // Clear state
  sessionStorage.removeItem('github_oauth_state')

  // Get installation ID from callback
  const installationId = searchParams.get('installation_id')
  if (!installationId) {
    return { success: false, error: 'No installation_id in callback' }
  }

  // Optional: Get setup_action (install, update, etc.)
  const setupAction = searchParams.get('setup_action')
  if (setupAction === 'request') {
    return { success: false, error: 'Installation was requested but not approved yet' }
  }

  try {
    // Fetch installation details via token proxy
    const installation = await fetchInstallationDetails(parseInt(installationId, 10))
    await saveInstallation(installation)

    return { success: true, installation }
  } catch (error) {
    return { success: false, error: `Failed to fetch installation: ${error}` }
  }
}

/**
 * Generate random state for OAuth CSRF protection
 */
function generateOAuthState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

// ─── Installation Details ───────────────────────────────────────────────────

/**
 * Fetch installation details from GitHub via token proxy
 * Token proxy handles JWT auth with app private key
 */
async function fetchInstallationDetails(installationId: number): Promise<GitHubInstallation> {
  const response = await fetch(`${GITHUB_APP_CONFIG.tokenProxyUrl}/installation/${installationId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch installation: ${response.status} ${error}`)
  }

  const data = await response.json()

  return {
    installationId: data.id,
    appId: data.app_id,
    account: {
      login: data.account.login,
      type: data.account.type,
      avatarUrl: data.account.avatar_url,
    },
    targetType: data.target_type,
    repositories: (data.repositories || []).map(mapRepository),
    installedAt: data.created_at,
    permissions: mapPermissions(data.permissions),
  }
}

/**
 * Fetch repositories accessible to installation
 */
export async function fetchInstallationRepos(installationId: number): Promise<InstalledRepository[]> {
  const response = await fetch(
    `${GITHUB_APP_CONFIG.tokenProxyUrl}/installation/${installationId}/repos`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch repos: ${response.status}`)
  }

  const data = await response.json()
  return (data.repositories || []).map(mapRepository)
}

/**
 * Refresh installation data from GitHub
 */
export async function refreshInstallation(): Promise<GitHubInstallation | null> {
  const current = await getInstallation()
  if (!current) return null

  try {
    const updated = await fetchInstallationDetails(current.installationId)
    await saveInstallation(updated)
    return updated
  } catch {
    return current
  }
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function mapRepository(repo: Record<string, unknown>): InstalledRepository {
  return {
    id: repo.id as number,
    name: repo.name as string,
    fullName: repo.full_name as string,
    private: repo.private as boolean,
    defaultBranch: (repo.default_branch as string) || 'main',
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

// ─── Connection State ───────────────────────────────────────────────────────

/**
 * Get current GitHub App connection state
 */
export async function getConnectionState(): Promise<GitHubAppState> {
  const installation = await getInstallation()

  if (!installation) {
    return { connected: false }
  }

  return {
    connected: true,
    installation,
    lastActivity: new Date().toISOString(),
  }
}

/**
 * Disconnect GitHub App
 * Clears local state only — does NOT revoke installation
 */
export async function disconnect(): Promise<void> {
  await clearInstallation()
}

/**
 * Verify installation is still valid
 */
export async function verifyInstallation(): Promise<boolean> {
  const installation = await getInstallation()
  if (!installation) return false

  try {
    // Try to refresh — if it works, installation is valid
    const refreshed = await refreshInstallation()
    return refreshed !== null
  } catch {
    return false
  }
}
