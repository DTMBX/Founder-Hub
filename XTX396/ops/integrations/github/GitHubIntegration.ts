/**
 * ops/integrations/github/GitHubIntegration.ts
 *
 * GitHub App integration for creating branches and PRs.
 * Uses a pluggable adapter interface — default is a mock for testing.
 * Production implementation would use @octokit/rest or similar.
 *
 * SECURITY:
 * - No secrets stored in source
 * - No tokens printed or logged
 * - All config via env var names, not values
 */

/** GitHub PR creation request. */
export interface GitHubPrRequest {
  readonly repo: string          // owner/name
  readonly baseBranch: string
  readonly headBranch: string
  readonly title: string
  readonly body: string
  readonly files: readonly GitHubFileEntry[]
}

/** A file to commit in the PR. */
export interface GitHubFileEntry {
  readonly path: string
  readonly content: string
}

/** Result of a PR creation attempt. */
export interface GitHubPrResponse {
  readonly success: boolean
  readonly prNumber?: number
  readonly prUrl?: string
  readonly error?: string
}

/** App configuration (env var names only — not actual values). */
export interface GitHubAppEnvConfig {
  readonly appIdEnv: string
  readonly privateKeyEnv: string
  readonly installationIdEnv: string
}

/**
 * Adapter interface for GitHub API operations.
 * Implementations must never log or return actual tokens.
 */
export interface GitHubApiAdapter {
  readonly adapterId: string

  /** Create a branch and PR with the given files. */
  createPullRequest(request: GitHubPrRequest): Promise<GitHubPrResponse>

  /** Check if the adapter has valid credentials (without printing them). */
  isConfigured(): boolean
}

/**
 * Mock adapter for testing. Records calls without making real API requests.
 */
export class MockGitHubApiAdapter implements GitHubApiAdapter {
  readonly adapterId = 'mock-github-v1'

  private readonly _responses: Map<string, GitHubPrResponse> = new Map()
  private readonly _calls: GitHubPrRequest[] = []
  private _configured = true

  /** Register a mock response for a repo. */
  registerResponse(repo: string, response: GitHubPrResponse): void {
    this._responses.set(repo.toLowerCase(), response)
  }

  /** Set whether the adapter reports itself as configured. */
  setConfigured(configured: boolean): void {
    this._configured = configured
  }

  isConfigured(): boolean {
    return this._configured
  }

  async createPullRequest(request: GitHubPrRequest): Promise<GitHubPrResponse> {
    this._calls.push(request)

    const response = this._responses.get(request.repo.toLowerCase())
    if (response) {
      return response
    }

    // Default mock response
    return {
      success: true,
      prNumber: 100 + this._calls.length,
      prUrl: `https://github.com/${request.repo}/pull/${100 + this._calls.length}`,
    }
  }

  /** Get all recorded calls. */
  getCalls(): readonly GitHubPrRequest[] {
    return [...this._calls]
  }

  /** Get the last call (for inspection). */
  getLastCall(): GitHubPrRequest | undefined {
    return this._calls[this._calls.length - 1]
  }

  get callCount(): number {
    return this._calls.length
  }
}

/**
 * Redact a PR body to ensure no secrets leak.
 * Strips anything that looks like a token, key, or credential.
 */
export function redactPrBody(body: string): string {
  // Redact common secret patterns
  return body
    .replace(/ghp_[a-zA-Z0-9]{36}/g, '[REDACTED_GITHUB_PAT]')
    .replace(/ghs_[a-zA-Z0-9]{36}/g, '[REDACTED_GITHUB_TOKEN]')
    .replace(/github_pat_[a-zA-Z0-9_]{82}/g, '[REDACTED_GITHUB_PAT]')
    .replace(/sk_live_[a-zA-Z0-9]{24,}/g, '[REDACTED_STRIPE_KEY]')
    .replace(/-----BEGIN [A-Z ]+KEY-----[\s\S]*?-----END [A-Z ]+KEY-----/g, '[REDACTED_PRIVATE_KEY]')
    .replace(/Bearer\s+[a-zA-Z0-9._-]{20,}/g, 'Bearer [REDACTED]')
    .replace(/token\s*[:=]\s*["']?[a-zA-Z0-9._-]{20,}["']?/gi, 'token=[REDACTED]')
}
