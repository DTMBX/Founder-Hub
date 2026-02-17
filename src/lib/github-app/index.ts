/**
 * GitHub App Integration Module
 *
 * Replaces PAT-based GitHub authentication with GitHub App installation tokens.
 * Provides least-privilege access with automatic token rotation.
 *
 * CHAIN B2: Migrate GitHub integration to GitHub App
 *
 * ARCHITECTURE:
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  Admin Panel (Browser)                                              │
 * │  - Initiates App install flow                                      │
 * │  - Stores installation ID (safe, not secret)                       │
 * │  - Calls token proxy for authentication                            │
 * └───────────────────────────┬─────────────────────────────────────────┘
 *                             │
 *                             ▼
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  Token Proxy (Cloudflare Worker / Backend)                         │
 * │  - Holds App private key (SECRET)                                  │
 * │  - Signs JWT for App authentication                                │
 * │  - Exchanges installation ID for short-lived token                 │
 * │  - Returns token to frontend (memory only, never stored)           │
 * └───────────────────────────┬─────────────────────────────────────────┘
 *                             │
 *                             ▼
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  GitHub API                                                         │
 * │  - Validates installation token                                    │
 * │  - Scoped permissions per installation                             │
 * │  - Tokens expire in 1 hour (auto-refreshed)                        │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * SECURITY:
 * - App private key NEVER touches browser
 * - Installation tokens NEVER stored in localStorage
 * - In-memory token cache with automatic expiration
 * - Installation ID is safe to persist (not a secret)
 *
 * REQUIRED SETUP:
 * 1. Create GitHub App at https://github.com/settings/apps
 * 2. Configure permissions: contents:write, pull_requests:write, checks:read
 * 3. Deploy token proxy (Cloudflare Worker recommended)
 * 4. Set VITE_GITHUB_APP_ID and VITE_GITHUB_TOKEN_PROXY_URL
 *
 * @module github-app
 */

// ─── Type Exports ───────────────────────────────────────────────────────────
export type {
  GitHubInstallation,
  InstalledRepository,
  InstallationPermissions,
  InstallationToken,
  RepoConfig,
  FileChange,
  CommitResult,
  BranchResult,
  PullRequestResult,
  CheckStatus,
  DeploymentRecord,
  GitHubAppState,
  SiteRepoMapping,
  GitHubApiError,
  RateLimitInfo,
} from './types'

// ─── Auth Exports ───────────────────────────────────────────────────────────
export {
  GITHUB_APP_CONFIG,
  getInstallation,
  saveInstallation,
  clearInstallation,
  isConnected,
  initiateInstallFlow,
  handleInstallCallback,
  fetchInstallationRepos,
  refreshInstallation,
  getConnectionState,
  disconnect,
  verifyInstallation,
} from './auth'

// ─── Token Cache Exports ────────────────────────────────────────────────────
export {
  getInstallationToken,
  invalidateToken,
  clearAllTokens,
  getTokenCacheStats,
  getAuthHeaders,
  authenticatedFetch,
} from './cache'

// ─── Operation Exports ──────────────────────────────────────────────────────
export {
  createBranch,
  deleteBranch,
  createCommit,
  createBranchWithCommit,
  createPullRequest,
  getPullRequestStatus,
  getCheckRuns,
  waitForChecks,
  createDeployment,
  updateDeploymentStatus,
  publishChanges,
  getRepoInfo,
} from './operations'

// ─── Convenience Re-exports ─────────────────────────────────────────────────

/**
 * Quick check if GitHub App is available
 */
export async function isGitHubAppAvailable(): Promise<boolean> {
  const { isConnected } = await import('./auth')
  return isConnected()
}

/**
 * Get current connection method
 * Returns 'app' if connected via GitHub App, 'pat' if PAT exists, 'none' otherwise
 */
export async function getConnectionMethod(): Promise<'app' | 'pat' | 'none'> {
  const { isConnected } = await import('./auth')
  const { hasGitHubPAT } = await import('../secret-vault')

  if (await isConnected()) {
    return 'app'
  }

  if (await hasGitHubPAT()) {
    return 'pat'
  }

  return 'none'
}
