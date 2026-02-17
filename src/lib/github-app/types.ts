/**
 * GitHub App Integration Types
 *
 * Type definitions for GitHub App installation-based authentication.
 * Replaces PAT-based auth with scoped installation tokens.
 *
 * CHAIN B2: Least privilege GitHub integration
 */

// ─── Installation Types ─────────────────────────────────────────────────────

/**
 * GitHub App installation record
 * Safe to persist — contains no secrets
 */
export interface GitHubInstallation {
  /** Installation ID (safe to store) */
  installationId: number
  /** App ID (public) */
  appId: number
  /** Account that installed the app */
  account: {
    login: string
    type: 'User' | 'Organization'
    avatarUrl?: string
  }
  /** Target type */
  targetType: 'User' | 'Organization'
  /** Repositories accessible to this installation */
  repositories: InstalledRepository[]
  /** Installation timestamp */
  installedAt: string
  /** Last token refresh */
  lastTokenRefresh?: string
  /** Permissions granted */
  permissions: InstallationPermissions
}

/**
 * Repository included in installation
 */
export interface InstalledRepository {
  id: number
  name: string
  fullName: string
  private: boolean
  defaultBranch: string
  /** Optional monorepo subfolder mapping */
  dataPath?: string
}

/**
 * Permissions granted to installation
 * Maps to GitHub App permission settings
 */
export interface InstallationPermissions {
  contents?: 'read' | 'write'
  metadata?: 'read'
  pullRequests?: 'read' | 'write'
  checks?: 'read' | 'write'
  deployments?: 'read' | 'write'
  statuses?: 'read' | 'write'
}

// ─── Token Types ────────────────────────────────────────────────────────────

/**
 * Installation access token (short-lived)
 * NEVER persist to localStorage — use memory cache only
 */
export interface InstallationToken {
  /** The access token */
  token: string
  /** Expiration timestamp (ISO 8601) */
  expiresAt: string
  /** Permissions included */
  permissions: InstallationPermissions
  /** Repository selection type */
  repositorySelection: 'all' | 'selected'
}

/**
 * Cached token with metadata
 * @internal
 */
export interface CachedToken {
  token: InstallationToken
  installationId: number
  cachedAt: number
}

// ─── Operation Types ────────────────────────────────────────────────────────

/**
 * Repository configuration for operations
 */
export interface RepoConfig {
  owner: string
  repo: string
  /** Data path within repo (for monorepos) */
  dataPath: string
  /** Default branch name */
  branch?: string
}

/**
 * File to commit
 */
export interface FileChange {
  path: string
  content: string
  /** 'create' | 'update' | 'delete' */
  action?: 'create' | 'update' | 'delete'
}

/**
 * Result of a commit operation
 */
export interface CommitResult {
  success: boolean
  error?: string
  commitSha?: string
  commitUrl?: string
  branch?: string
  pullRequestUrl?: string
  pullRequestNumber?: number
}

/**
 * Result of branch creation
 */
export interface BranchResult {
  success: boolean
  error?: string
  branchName?: string
  sha?: string
}

/**
 * Result of PR creation
 */
export interface PullRequestResult {
  success: boolean
  error?: string
  number?: number
  url?: string
  state?: 'open' | 'closed' | 'merged'
}

/**
 * Check run status
 */
export interface CheckStatus {
  id: number
  name: string
  status: 'queued' | 'in_progress' | 'completed'
  conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required'
  startedAt?: string
  completedAt?: string
  detailsUrl?: string
}

/**
 * Deployment record
 */
export interface DeploymentRecord {
  id: number
  environment: string
  ref: string
  sha: string
  state: 'pending' | 'success' | 'error' | 'failure' | 'inactive' | 'queued' | 'in_progress'
  createdAt: string
  url?: string
}

// ─── Connection State ───────────────────────────────────────────────────────

/**
 * GitHub App connection state
 * Tracks authentication status and available repos
 */
export interface GitHubAppState {
  /** Whether connected via GitHub App */
  connected: boolean
  /** Active installation (if connected) */
  installation?: GitHubInstallation
  /** Selected repository for current site */
  selectedRepo?: InstalledRepository
  /** Connection error (if any) */
  error?: string
  /** Last successful operation timestamp */
  lastActivity?: string
}

/**
 * Site-to-repo mapping (for multi-site)
 */
export interface SiteRepoMapping {
  siteId: string
  installationId: number
  repoFullName: string
  dataPath: string
  lastSync?: string
}

// ─── API Response Types ─────────────────────────────────────────────────────

/**
 * GitHub API error response
 */
export interface GitHubApiError {
  message: string
  documentation_url?: string
  errors?: Array<{
    resource: string
    field: string
    code: string
  }>
}

/**
 * Rate limit info from GitHub API
 */
export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  used: number
}
